// ============================================================
// Video Encoder - ffmpeg encoding via system binary
// ============================================================

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

/**
 * Encode a PNG frame sequence into an MP4 file using system ffmpeg.
 * @param frameDir - Directory containing frame_00000.png, frame_00001.png, ...
 * @param fps - Frames per second
 * @param outputPath - Output MP4 file path
 */
export async function encodeVideo(
  frameDir: string,
  fps: number,
  outputPath: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const inputPattern = path.join(frameDir, 'frame_%05d.png');
    const args = [
      '-y',
      '-framerate', String(fps),
      '-i', inputPattern,
      '-pix_fmt', 'yuv420p',
      '-preset', 'fast',
      '-crf', '18',
      '-movflags', '+faststart',
      '-r', String(fps),
      outputPath,
    ];

    const proc = spawn('ffmpeg', args, { stdio: ['pipe', 'pipe', 'pipe'] });

    let stderrOutput = '';
    proc.stderr.on('data', (data: Buffer) => {
      stderrOutput += data.toString();
    });

    proc.on('close', (code: number | null) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg 编码失败 (exit code ${code}): ${stderrOutput.slice(-500)}`));
      }
    });

    proc.on('error', (err: Error) => {
      reject(new Error(`ffmpeg 启动失败: ${err.message}`));
    });
  });
}

/**
 * Clean up temporary files after rendering.
 */
export function cleanupTempDir(dir: string): void {
  try {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true });
    }
  } catch {
    // Silent cleanup failure
  }
}
