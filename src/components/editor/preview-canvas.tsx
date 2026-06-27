'use client';

import { useEffect, useRef, memo } from 'react';
import type { Project } from '../../lib/types';
import { renderFrame } from '../../lib/renderer';
import type { RenderCtx } from '../../lib/renderer/context';

interface PreviewCanvasProps {
  project: Project;
  currentTime: number;
  maxWidth?: number;
  maxHeight?: number;
}

function PreviewCanvasBase({ project, currentTime, maxWidth = 400, maxHeight = 500 }: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas to project resolution
    canvas.width = project.canvas.width;
    canvas.height = project.canvas.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Cast browser context to our RenderCtx interface
    renderFrame(ctx as unknown as RenderCtx, project, currentTime);
  }, [project, currentTime]);

  // Calculate display size maintaining aspect ratio
  const aspectRatio = project.canvas.width / project.canvas.height;
  let displayWidth = maxWidth;
  let displayHeight = maxWidth / aspectRatio;
  if (displayHeight > maxHeight) {
    displayHeight = maxHeight;
    displayWidth = maxHeight * aspectRatio;
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: displayWidth,
        height: displayHeight,
        borderRadius: 8,
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      }}
    />
  );
}

export const PreviewCanvas = memo(PreviewCanvasBase);
