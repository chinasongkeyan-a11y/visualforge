// ============================================================
// Server-side Render Engine
// Uses @napi-rs/canvas for frame rendering
// ============================================================

import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import fs from 'fs';
import path from 'path';
import type { Project } from '../types';
import { renderFrame } from '../renderer';
import type { RenderCtx } from '../renderer/context';
import { getProjectDuration } from '../renderer';

// Register Chinese font once
let fontRegistered = false;
function ensureFontRegistered(): void {
  if (fontRegistered) return;
  const fontPaths = [
    '/usr/share/fonts/truetype/wqy/wqy-microhei.ttc',
    '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',
  ];
  for (const p of fontPaths) {
    if (fs.existsSync(p)) {
      GlobalFonts.registerFromPath(p, 'WQY Micro Hei');
      break;
    }
  }
  fontRegistered = true;
}

export interface RenderProgressCallback {
  (currentFrame: number, totalFrames: number): void;
}

/**
 * Render a project to a series of PNG frames in a temp directory.
 * Returns the directory path and frame count.
 */
export async function renderFrames(
  project: Project,
  outputDir: string,
  onProgress?: RenderProgressCallback,
): Promise<{ frameDir: string; totalFrames: number }> {
  ensureFontRegistered();

  const duration = getProjectDuration(project);
  if (duration <= 0) {
    throw new Error('项目时长为 0，请添加至少一个片段');
  }

  const fps = project.canvas.fps;
  const totalFrames = Math.ceil(duration * fps);
  const { width, height } = project.canvas;

  // Create frame directory
  const frameDir = path.join(outputDir, 'frames');
  fs.mkdirSync(frameDir, { recursive: true });

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  for (let i = 0; i < totalFrames; i++) {
    const time = i / fps;
    renderFrame(ctx as unknown as RenderCtx, project, time);

    const framePath = path.join(frameDir, `frame_${String(i).padStart(5, '0')}.png`);
    const pngBuffer = canvas.toBuffer('image/png');
    fs.writeFileSync(framePath, pngBuffer);

    if (onProgress) {
      onProgress(i + 1, totalFrames);
    }

    // Yield to event loop every 10 frames to avoid blocking
    if (i % 10 === 9) {
      await new Promise((resolve) => setImmediate(resolve));
    }
  }

  return { frameDir, totalFrames };
}
