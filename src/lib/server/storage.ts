// ============================================================
// Local File Storage - saves MP4 to local renders directory
// ============================================================

import fs from 'fs';
import path from 'path';

/** Directory where rendered MP4 files are stored */
const RENDERS_DIR = process.env.RENDERS_DIR || '/app/renders';

/**
 * Ensure the renders directory exists.
 */
function ensureRendersDir(): void {
  if (!fs.existsSync(RENDERS_DIR)) {
    fs.mkdirSync(RENDERS_DIR, { recursive: true });
  }
}

/**
 * Save an MP4 file to local storage and return a public URL path.
 * @param filePath - Local file path of the MP4 (temporary)
 * @param fileName - Desired file name (e.g. "r_abc123.mp4")
 * @returns Relative URL path for accessing the video (e.g. "/api/video/r_abc123.mp4")
 */
export async function uploadVideo(filePath: string, fileName: string): Promise<string> {
  ensureRendersDir();

  const destPath = path.join(RENDERS_DIR, fileName);

  // Move the file to the renders directory
  const data = fs.readFileSync(filePath);
  fs.writeFileSync(destPath, data);

  // Clean up the temporary source file
  try {
    fs.unlinkSync(filePath);
  } catch {
    // Source file may already be removed, ignore
  }

  // Return a relative URL that the /api/video/[id] route will serve
  const urlPath = `/api/video/${fileName}`;
  return urlPath;
}

/**
 * Get the local file path for a given video file name.
 * @param fileName - File name (e.g. "r_abc123.mp4")
 * @returns Absolute file path
 */
export function getVideoFilePath(fileName: string): string {
  return path.join(RENDERS_DIR, fileName);
}

/**
 * Check if a video file exists.
 */
export function videoExists(fileName: string): boolean {
  return fs.existsSync(path.join(RENDERS_DIR, fileName));
}
