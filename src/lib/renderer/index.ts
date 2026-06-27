// ============================================================
// Main Renderer - Frame orchestration
// ============================================================
import type { RenderCtx, DrawContext } from './context';
import type { Project, Segment, ThemeTokens } from '../types';
import { getTheme } from '../themes';
import { drawSegment } from './segments';
import { computeTransition, applyTransitionState } from './transitions';

/**
 * Render a single frame at the given time.
 * Works with both browser CanvasRenderingContext2D and @napi-rs/canvas context.
 *
 * @param ctx - Canvas 2D context (browser or node-canvas)
 * @param project - Project data
 * @param time - Current time in seconds
 */
export function renderFrame(
  ctx: RenderCtx,
  project: Project,
  time: number,
): void {
  const theme = getTheme(project.theme);
  const tokens = theme.tokens;
  const canvas = { width: project.canvas.width, height: project.canvas.height };

  // 1. Clear and fill background
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = tokens.bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Get active segments at this time
  const activeSegments = project.timeline.filter(
    (s) => time >= s.start && time < s.start + s.duration,
  );

  // 3. Sort by track (0=background, 1=content, 2=foreground)
  const sorted = [...activeSegments].sort((a, b) => a.track - b.track);

  // 4. Draw each segment
  for (const segment of sorted) {
    drawSegmentWithTransition(ctx, canvas, segment, time, tokens);
  }
}

/** Draw a single segment with transition applied */
function drawSegmentWithTransition(
  ctx: RenderCtx,
  canvas: { width: number; height: number },
  segment: Segment,
  time: number,
  theme: ThemeTokens,
): void {
  const localTime = time - segment.start;

  // Compute transition state
  const transition = computeTransition(
    localTime,
    segment.duration,
    segment.transitionIn,
    segment.transitionOut,
    canvas,
  );

  // Apply transition (save context state)
  applyTransitionState(ctx, transition, canvas);

  // Draw the segment content
  const dc: DrawContext = { ctx, canvas };
  drawSegment(dc, segment, localTime, theme);

  // Restore context state
  ctx.restore();
}

/** Get the total duration of a project (max end time of all segments) */
export function getProjectDuration(project: Project): number {
  if (project.timeline.length === 0) return 0;
  return Math.max(
    ...project.timeline.map((s) => s.start + s.duration),
  );
}

/** Get total frame count */
export function getTotalFrames(project: Project): number {
  return Math.ceil(getProjectDuration(project) * project.canvas.fps);
}
