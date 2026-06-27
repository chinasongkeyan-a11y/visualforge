import { NextRequest, NextResponse } from 'next/server';
import { getVideoFilePath, videoExists } from '../../../../lib/server/storage';

export const runtime = 'nodejs';

/**
 * GET /api/video/[id]
 *
 * Serves a rendered MP4 video file from local storage.
 * [id] is the file name, e.g. "r_abc123.mp4"
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Sanitize: only allow alphanumeric, underscore, hyphen, dot
  if (!/^[\w.-]+\.mp4$/.test(id)) {
    return NextResponse.json({ error: 'Invalid file name' }, { status: 400 });
  }

  if (!videoExists(id)) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  }

  const filePath = getVideoFilePath(id);

  // Read file and stream it
  const fs = await import('fs');
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;

  const headers = new Headers();
  headers.set('Content-Type', 'video/mp4');
  headers.set('Content-Length', fileSize.toString());
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Cache-Control', 'public, max-age=86400');

  // Support range requests for video streaming
  const range = _request.headers.get('range');
  if (range) {
    const match = /bytes=(\d+)-(\d*)/.exec(range);
    if (match) {
      const start = parseInt(match[1], 10);
      const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const stream = fs.createReadStream(filePath, { start, end });
      const readable = new ReadableStream({
        start(controller) {
          stream.on('data', (chunk: Buffer | string) => controller.enqueue(new Uint8Array(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)));
          stream.on('end', () => controller.close());
          stream.on('error', (err: Error) => controller.error(err));
        },
      });

      const rangeHeaders = new Headers(headers);
      rangeHeaders.set('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      rangeHeaders.set('Content-Length', chunkSize.toString());

      return new NextResponse(readable, {
        status: 206,
        headers: rangeHeaders,
      });
    }
  }

  // Full file response
  const stream = fs.createReadStream(filePath);
  const readable = new ReadableStream({
    start(controller) {
      stream.on('data', (chunk: Buffer | string) => controller.enqueue(new Uint8Array(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)));
      stream.on('end', () => controller.close());
      stream.on('error', (err: Error) => controller.error(err));
    },
  });

  return new NextResponse(readable, { status: 200, headers });
}
