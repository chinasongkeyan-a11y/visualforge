import { NextRequest, NextResponse } from 'next/server';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import fs from 'fs';
import type { Project } from '../../../lib/types';
import { renderFrame } from '../../../lib/renderer';
import type { RenderCtx } from '../../../lib/renderer/context';

export const runtime = 'nodejs';
export const maxDuration = 60;

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

interface PreviewRequest {
  project: Project;
  time: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PreviewRequest;
    const { project, time } = body;

    if (!project) {
      return NextResponse.json(
        { success: false, error: '缺少 project 参数' },
        { status: 400 },
      );
    }

    if (typeof time !== 'number' || time < 0) {
      return NextResponse.json(
        { success: false, error: 'time 参数无效' },
        { status: 400 },
      );
    }

    ensureFontRegistered();

    const { width, height } = project.canvas;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    renderFrame(ctx as unknown as RenderCtx, project, time);

    const base64 = canvas.toBuffer('image/png').toString('base64');

    return NextResponse.json({
      frame: `data:image/png;base64,${base64}`,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[api/preview-frame] Error:', msg);
    return NextResponse.json(
      { success: false, error: `预览失败: ${msg}` },
      { status: 500 },
    );
  }
}
