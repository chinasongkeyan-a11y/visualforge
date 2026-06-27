import { NextRequest, NextResponse } from 'next/server';
import { createRenderTask, cleanupOldTasks } from '../../../lib/server/render-store';
import { executeRenderPipeline } from '../../../lib/server/pipeline';
import { simplifiedToProject, type SimplifiedRenderRequest } from '../../../lib/api-simplifier';
import type { Project } from '../../../lib/types';

export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * POST /api/render
 *
 * Accepts two formats:
 *
 * 1. Simplified (recommended):
 *    { theme?: string, segments: [{ type, start, duration?, ...contentFields }] }
 *
 * 2. Legacy (full project):
 *    { project: { id, name, canvas, theme, timeline: [...] } }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    let project: Project;

    if (body.project) {
      // Legacy full-project format
      project = body.project as Project;
    } else if (body.segments) {
      // Simplified format
      project = simplifiedToProject(body as SimplifiedRenderRequest);
    } else {
      return NextResponse.json(
        { success: false, error: '请求格式无效：需要 segments 数组或 project 对象' },
        { status: 400 },
      );
    }

    // Validate timeline
    if (!project.timeline || project.timeline.length === 0) {
      return NextResponse.json(
        { success: false, error: '时间线为空，请添加至少一个片段' },
        { status: 400 },
      );
    }

    // Validate max duration (10 seconds per user spec = 240 frames @ 24fps)
    const maxDuration = 10;
    let totalDuration = 0;
    for (const seg of project.timeline) {
      totalDuration = Math.max(totalDuration, seg.start + seg.duration);
    }
    if (totalDuration > maxDuration) {
      return NextResponse.json(
        { success: false, error: `视频时长不能超过 ${maxDuration} 秒` },
        { status: 400 },
      );
    }

    // Clean up old tasks
    cleanupOldTasks();

    // Create render task
    const task = createRenderTask(project);

    // Start rendering asynchronously (fire and forget)
    executeRenderPipeline(task.id).catch((err: unknown) => {
      console.error(`[api/render] Pipeline error for ${task.id}:`, err);
    });

    // Calculate estimated time based on frame count
    const fps = project.canvas?.fps ?? 24;
    const estimatedFrames = Math.ceil(totalDuration * fps);
    const estimatedTime = Math.ceil(estimatedFrames * 0.2); // ~200ms per frame

    return NextResponse.json({
      success: true,
      renderId: task.id,
      status: 'processing',
      estimatedTime,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[api/render] Error:', msg);
    return NextResponse.json(
      { success: false, error: `渲染请求失败: ${msg}` },
      { status: 500 },
    );
  }
}
