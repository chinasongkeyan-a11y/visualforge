import { NextRequest, NextResponse } from 'next/server';
import { getRenderTask } from '../../../../../lib/server/render-store';

export const runtime = 'nodejs';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const task = getRenderTask(id);

    if (!task) {
      return NextResponse.json(
        { success: false, error: '渲染任务不存在' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      renderId: task.id,
      status: task.status,
      progress: task.progress,
      currentFrame: task.currentFrame,
      totalFrames: task.totalFrames,
      videoUrl: task.videoUrl,
      error: task.error,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: `查询失败: ${msg}` },
      { status: 500 },
    );
  }
}
