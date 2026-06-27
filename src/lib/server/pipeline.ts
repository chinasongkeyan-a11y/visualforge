// ============================================================
// Full Render Pipeline: frames → ffmpeg → local storage
// ============================================================

import path from 'path';
import fs from 'fs';
import os from 'os';
import type { Project } from '../types';
import { renderFrames } from './render-engine';
import { encodeVideo, cleanupTempDir } from './video-encoder';
import { uploadVideo } from './storage';
import { updateRenderTask, getRenderTask } from './render-store';

/**
 * Execute the full render pipeline for a render task.
 * This runs asynchronously in the background.
 */
export async function executeRenderPipeline(renderId: string): Promise<void> {
  const task = getRenderTask(renderId);
  if (!task) {
    console.error(`[render] Task ${renderId} not found`);
    return;
  }

  const project = task.project;
  const tempDir = path.join(os.tmpdir(), `visualforge_${renderId}`);

  try {
    // Phase 1: Update status to processing
    updateRenderTask(renderId, { status: 'processing' });

    // Phase 2: Render all frames
    const { frameDir, totalFrames } = await renderFrames(project, tempDir, (currentFrame, total) => {
      updateRenderTask(renderId, {
        currentFrame,
        totalFrames: total,
        progress: total > 0 ? currentFrame / total : 0,
      });
    });

    // Phase 3: Encode to MP4
    const mp4Path = path.join(tempDir, 'output.mp4');
    await encodeVideo(frameDir, project.canvas.fps, mp4Path);

    // Phase 4: Save to local storage
    const fileName = `${renderId}.mp4`;
    const videoUrl = await uploadVideo(mp4Path, fileName);

    // Phase 5: Complete
    updateRenderTask(renderId, {
      status: 'completed',
      progress: 1.0,
      currentFrame: totalFrames,
      totalFrames,
      videoUrl,
      completedAt: new Date().toISOString(),
    });

    console.log(`[render] Task ${renderId} completed. Video URL: ${videoUrl}`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[render] Task ${renderId} failed:`, errorMsg);
    updateRenderTask(renderId, {
      status: 'failed',
      error: errorMsg,
      completedAt: new Date().toISOString(),
    });
  } finally {
    // Always clean up temp files
    cleanupTempDir(tempDir);
  }
}
