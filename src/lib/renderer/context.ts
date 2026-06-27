// ============================================================
// Unified Render Context
// Works with both browser CanvasRenderingContext2D and
// @napi-rs/canvas SKRSContext2D (structurally compatible).
// ============================================================

/** Gradient object (both browser and node-canvas have addColorStop) */
export interface GradientLike {
  addColorStop(offset: number, color: string): void;
}

/** Image object (browser HTMLImageElement / node-canvas Image) */
export interface CanvasImageLike {
  width: number;
  height: number;
}

/**
 * Minimal 2D context interface covering all methods used by the renderer.
 * Both browser's CanvasRenderingContext2D and @napi-rs/canvas's context
 * satisfy this interface structurally.
 */
export interface RenderCtx {
  // State
  save(): void;
  restore(): void;

  // Transform
  translate(x: number, y: number): void;
  scale(x: number, y: number): void;
  rotate(angle: number): void;

  // Compositing
  globalAlpha: number;

  // Styles
  fillStyle: string | GradientLike;
  strokeStyle: string | GradientLike;
  lineWidth: number;
  lineCap: string;
  lineJoin: string;

  // Shadow
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;

  // Text
  font: string;
  textAlign: string;
  textBaseline: string;
  fillText(text: string, x: number, y: number, maxWidth?: number): void;
  measureText(text: string): { width: number };

  // Rectangles
  fillRect(x: number, y: number, w: number, h: number): void;
  clearRect(x: number, y: number, w: number, h: number): void;

  // Paths
  beginPath(): void;
  closePath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean): void;
  rect(x: number, y: number, w: number, h: number): void;
  fill(): void;
  stroke(): void;
  clip(): void;

  // Curves
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void;
  bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void;

  // Gradients
  createLinearGradient(x0: number, y0: number, x1: number, y1: number): GradientLike;
  createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): GradientLike;

  // Images
  drawImage(image: unknown, dx: number, dy: number): void;
  drawImage(image: unknown, dx: number, dy: number, dw: number, dh: number): void;

  // Line dash
  setLineDash(segments: number[]): void;

  // Image filter (CSS filter string, e.g. "grayscale(100%)")
  filter?: string;
}

/** Canvas size info passed to segment renderers */
export interface CanvasInfo {
  width: number;
  height: number;
}

/** Drawing context passed to segment renderers */
export interface DrawContext {
  ctx: RenderCtx;
  canvas: CanvasInfo;
  loadImage?: (src: string) => Promise<CanvasImageLike | null>;
}

/** Wrap text into lines that fit within maxWidth */
export function wrapText(
  ctx: RenderCtx,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  const paragraphs = text.split('\n');
  for (const para of paragraphs) {
    if (para === '') {
      lines.push('');
      continue;
    }
    let currentLine = '';
    const chars = [...para];
    for (const char of chars) {
      const testLine = currentLine + char;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine !== '') {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine !== '') {
      lines.push(currentLine);
    }
  }
  return lines;
}

/** Draw a rounded rectangle path (compatible with all canvas implementations) */
export function roundRectPath(
  ctx: RenderCtx,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/** Parse hex color to RGB */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean;
  const num = parseInt(full, 16);
  return {
    r: (num >> 16) & 0xff,
    g: (num >> 8) & 0xff,
    b: num & 0xff,
  };
}

/** Convert hex + alpha to rgba string */
export function withAlpha(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}
