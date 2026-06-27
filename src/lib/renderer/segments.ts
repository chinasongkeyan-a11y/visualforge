// ============================================================
// Segment Renderers - All 15 segment types
// ============================================================
import type { RenderCtx, DrawContext, CanvasInfo, CanvasImageLike } from './context';
import type {
  TextCardProps,
  BarChartProps,
  KeywordHighlightProps,
  QuoteCardProps,
  EndCardProps,
  PieChartProps,
  LineChartProps,
  ImageShowProps,
  ProcessFlowProps,
  PersonaCardProps,
  CompareCardProps,
  NumberAnimationProps,
  TagCloudProps,
  ProgressTimelineProps,
  BackgroundProps,
  ThemeTokens,
  Segment,
} from '../types';
import { clamp01, EASINGS, lerp } from '../easing';
import { wrapText, roundRectPath, withAlpha } from './context';

/** Animation plays during first 60% of segment, then holds */
const ANIMATION_PHASE = 0.6;

function getAnimProgress(localTime: number, duration: number): number {
  return clamp01(localTime / (duration * ANIMATION_PHASE));
}

// ============================================================
// P0+P1 Visual Effects Library
// ============================================================

/** Overshoot easing - goes past 1 then settles back (for bouncy animations) */
function overshoot(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/** Draw glowing text with configurable shadow blur */
function drawGlowText(
  ctx: RenderCtx,
  text: string,
  x: number,
  y: number,
  opts: {
    glowColor: string;
    glowBlur: number;
    fillStyle?: string;
    color?: string;
    font?: string;
    blur?: number;
    alpha?: number;
    textAlign?: CanvasTextAlign;
  },
): void {
  ctx.save();
  ctx.shadowColor = opts.glowColor;
  ctx.shadowBlur = opts.glowBlur;
  if (opts.font) { ctx.font = opts.font; }
  if (opts.textAlign) { ctx.textAlign = opts.textAlign; }
  if (opts.alpha !== undefined) { ctx.globalAlpha = opts.alpha; }
  ctx.fillStyle = opts.fillStyle || opts.color || '#ffffff';
  ctx.fillText(text, x, y);
  ctx.shadowBlur = 0;
  ctx.restore();
}

/** Draw a sweep light effect - a diagonal light band sweeping across the canvas */
function drawSweepLight(ctx: RenderCtx, canvas: CanvasInfo, progress: number, color = '#ffffff'): void {
  if (progress <= 0 || progress >= 1) return;
  const sweepX = -canvas.width * 0.3 + progress * canvas.width * 1.6;
  const sweepWidth = canvas.width * 0.25;
  const alpha = Math.sin(progress * Math.PI) * 0.25;

  ctx.save();
  const grad = ctx.createLinearGradient(sweepX - sweepWidth, 0, sweepX + sweepWidth, 0);
  grad.addColorStop(0, withAlpha(color, 0));
  grad.addColorStop(0.5, withAlpha(color, alpha));
  grad.addColorStop(1, withAlpha(color, 0));
  ctx.fillStyle = grad;
  // Skew the sweep band at 15 degrees for a dynamic look
  ctx.beginPath();
  const skewOffset = canvas.height * 0.15;
  ctx.moveTo(sweepX - sweepWidth, -skewOffset);
  ctx.lineTo(sweepX + sweepWidth, -skewOffset);
  ctx.lineTo(sweepX + sweepWidth * 0.6, canvas.height + skewOffset);
  ctx.lineTo(sweepX - sweepWidth * 0.6, canvas.height + skewOffset);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Particle burst - particles radiating outward from a center point */
interface BurstParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
}

function drawParticleBurst(
  ctx: RenderCtx,
  cx: number,
  cy: number,
  progress: number,
  count: number,
  radius: number,
  colors: string[],
): void {
  if (progress <= 0 || progress >= 1) return;
  const fadeOut = 1 - progress;
  ctx.save();
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + i * 0.7;
    const dist = radius * progress * (0.8 + (i % 3) * 0.15);
    const px = cx + Math.cos(angle) * dist;
    const py = cy + Math.sin(angle) * dist;
    const pSize = (3 + (i % 4) * 2) * fadeOut;
    const color = colors[i % colors.length];

    ctx.fillStyle = withAlpha(color, fadeOut);
    ctx.shadowColor = color;
    ctx.shadowBlur = pSize * 2;
    ctx.beginPath();
    ctx.arc(px, py, pSize, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.restore();
}

/** Draw a glowing dot at a point (for line chart draw head) */
function drawGlowDot(
  ctx: RenderCtx,
  x: number,
  y: number,
  radius: number,
  color: string,
  glowRadius: number,
): void {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = glowRadius;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  // Inner white core
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ============================================================
// TextCard
// ============================================================
export function drawTextCard(
  dc: DrawContext,
  props: TextCardProps,
  localTime: number,
  duration: number,
  theme: ThemeTokens,
): void {
  const { ctx, canvas } = dc;
  const font = theme.fontFamily;
  const progress = getAnimProgress(localTime, duration);

  // Resolve font sizes with theme fallback
  const titleFontSize = props.titleFontSize ?? theme.titleFontSize;
  const subtitleFontSize = props.subtitleFontSize ?? theme.subtitleFontSize;

  // Background
  if (props.bgGradient && props.bgGradientColors && props.bgGradientColors.length >= 2) {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    const colors = props.bgGradientColors;
    colors.forEach((c, i) => grad.addColorStop(i / (colors.length - 1), c));
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = props.bgColor ?? theme.cardBgColor;
  }
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Calculate positions
  const padding = canvas.width * 0.1;
  const maxTextWidth = canvas.width - padding * 2;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  // Title
  const titleFont = `bold ${titleFontSize}px ${font}`;
  ctx.font = titleFont;
  ctx.textAlign = props.textAlign;
  ctx.textBaseline = 'middle';

  const titleLines = wrapText(ctx, props.title, maxTextWidth);
  const lineHeight = titleFontSize * 1.4;

  // Handle typewriter animation
  let displayTitle = props.title;
  if (props.animation === 'typewriter') {
    const totalChars = [...props.title].length;
    const visibleChars = Math.floor(totalChars * progress);
    displayTitle = [...props.title].slice(0, visibleChars).join('');
  }

  // Calculate subtitle
  const subtitleFont = `${subtitleFontSize}px ${font}`;
  ctx.font = subtitleFont;
  const subtitleLines = props.subtitle
    ? wrapText(ctx, props.subtitle, maxTextWidth)
    : [];
  const subtitleLineHeight = subtitleFontSize * 1.4;

  // Total height
  const titleBlockHeight = titleLines.length * lineHeight;
  const subtitleBlockHeight = subtitleLines.length * subtitleLineHeight;
  const gap = props.subtitle ? 40 : 0;
  const totalHeight = titleBlockHeight + gap + subtitleBlockHeight;
  const startY = centerY - totalHeight / 2 + lineHeight / 2;

  // Apply content animation (not for typewriter which handles itself)
  ctx.save();
  if (props.animation === 'slideUp') {
    const offset = (1 - EASINGS.easeOut(progress)) * 60;
    ctx.translate(0, offset);
  } else if (props.animation === 'scaleIn') {
    const scale = 0.85 + 0.15 * EASINGS.easeOut(progress);
    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);
    ctx.translate(-centerX, -centerY);
  } else if (props.animation === 'fadeIn') {
    ctx.globalAlpha *= progress;
  }

  // Draw title lines
  ctx.font = titleFont;
  let xPos: number;
  if (props.textAlign === 'left') xPos = padding;
  else if (props.textAlign === 'right') xPos = canvas.width - padding;
  else xPos = centerX;

  for (let i = 0; i < titleLines.length; i++) {
    const y = startY + i * lineHeight;
    const line = props.animation === 'typewriter' && i === titleLines.length - 1
      ? displayTitle.split('\n')[titleLines.length - 1] || ''
      : titleLines[i];

    drawTextWithEmphasis(ctx, line, xPos, y, props, theme, titleFontSize);
  }

  // Draw subtitle
  if (subtitleLines.length > 0) {
    ctx.font = subtitleFont;
    ctx.fillStyle = theme.textSecondaryColor;
    const subStartY = startY + titleBlockHeight + gap + subtitleLineHeight / 2;
    for (let i = 0; i < subtitleLines.length; i++) {
      ctx.fillText(subtitleLines[i], xPos, subStartY + i * subtitleLineHeight);
    }
  }

  ctx.restore();

  // Sweep light effect during entry phase
  drawSweepLight(ctx, canvas, progress, theme.primaryColor);
}

/** Draw text with emphasis portion highlighted */
function drawTextWithEmphasis(
  ctx: RenderCtx,
  text: string,
  x: number,
  y: number,
  props: TextCardProps,
  theme: ThemeTokens,
  fontSize: number,
): void {
  if (!props.emphasis || !text.includes(props.emphasis)) {
    ctx.fillStyle = props.textColor ?? theme.textColor;
    ctx.fillText(text, x, y);
    return;
  }

  // Split by emphasis and draw parts with different colors
  const parts = text.split(props.emphasis);
  ctx.textAlign = 'left';
  let currentX = x;

  // For centered text, need to calculate total width first
  if (props.textAlign === 'center') {
    const fullWidth = ctx.measureText(text).width;
    currentX = x - fullWidth / 2;
  } else if (props.textAlign === 'right') {
    const fullWidth = ctx.measureText(text).width;
    currentX = x - fullWidth;
  }

  for (let i = 0; i < parts.length; i++) {
    if (parts[i]) {
      ctx.fillStyle = props.textColor ?? theme.textColor;
      ctx.fillText(parts[i], currentX, y);
      currentX += ctx.measureText(parts[i]).width;
    }
    if (i < parts.length - 1) {
      ctx.fillStyle = props.emphasisColor ?? theme.primaryColor;
      ctx.font = `bold ${fontSize}px ${theme.fontFamily}`;
      ctx.fillText(props.emphasis, currentX, y);
      currentX += ctx.measureText(props.emphasis).width;
      ctx.font = `bold ${fontSize}px ${theme.fontFamily}`;
    }
  }

  // Restore textAlign
  ctx.textAlign = props.textAlign;
}

// ============================================================
// BarChart
// ============================================================
export function drawBarChart(
  dc: DrawContext,
  props: BarChartProps,
  localTime: number,
  duration: number,
  theme: ThemeTokens,
): void {
  const { ctx, canvas } = dc;
  const font = theme.fontFamily;
  const progress = getAnimProgress(localTime, duration);

  // Background
  ctx.fillStyle = theme.bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!props.data || props.data.length === 0) return;

  const padding = { top: 120, right: 80, bottom: 140, left: 80 };
  const chartWidth = canvas.width - padding.left - padding.right;
  const chartHeight = canvas.height - padding.top - padding.bottom;

  // Title
  ctx.font = `bold ${theme.subtitleFontSize}px ${font}`;
  ctx.fillStyle = theme.textColor;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(props.title, padding.left, 60);

  // Calculate max value
  const dataMax = Math.max(...props.data.map((d) => d.value));
  const maxValue = props.maxValue && props.maxValue > 0 ? props.maxValue : dataMax * 1.1;

  // Bar layout (defaults: barWidth=0.6, barGap=20)
  const barWidth = props.barWidth ?? 0.6;
  const barGap = props.barGap ?? 20;
  const totalGap = barGap * (props.data.length - 1);
  const barSlotWidth = (chartWidth - totalGap) / props.data.length;
  const barW = barSlotWidth * barWidth;

  const baseY = canvas.height - padding.bottom;
  const chartTop = padding.top + 80;

  // Draw grid lines
  ctx.strokeStyle = withAlpha(theme.textSecondaryColor, 0.15);
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = chartTop + (baseY - chartTop) * (i / 4);
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(canvas.width - padding.right, y);
    ctx.stroke();
  }

  // Draw bars with stagger + overshoot
  props.data.forEach((item, i) => {
    const slotStart = padding.left + i * (barSlotWidth + barGap);
    const barX = slotStart + (barSlotWidth - barW) / 2;
    const fullBarHeight = (item.value / maxValue) * (baseY - chartTop);

    // Stagger: each bar starts slightly later
    const staggerDelay = i * 0.12;
    const staggeredProgress = clamp01((progress - staggerDelay) / (1 - staggerDelay));

    let barHeight: number;
    let barOffsetX = 0;
    let glowIntensity = 0;

    if (props.animation === 'grow') {
      // Overshoot easing: bars grow past target then settle back
      const overshootVal = overshoot(staggeredProgress);
      barHeight = fullBarHeight * overshootVal;
      // Glow brightest near the overshoot peak
      if (staggeredProgress > 0.6 && staggeredProgress < 0.85) {
        glowIntensity = (0.85 - staggeredProgress) / 0.25;
      }
    } else {
      // slideIn
      barHeight = fullBarHeight;
      barOffsetX = (1 - EASINGS.easeOut(staggeredProgress)) * -chartWidth * 0.3;
    }

    const barY = baseY - barHeight;
    const barColor = item.color ?? theme.chartColors[i % theme.chartColors.length];

    // Bar glow on overshoot peak
    if (glowIntensity > 0) {
      ctx.save();
      ctx.shadowColor = barColor;
      ctx.shadowBlur = 20 * glowIntensity;
      ctx.fillStyle = barColor;
      roundRectPath(ctx, barX + barOffsetX, barY, barW, barHeight, 8);
      ctx.fill();
      ctx.restore();
    }

    // Bar with rounded top + gradient
    const grad = ctx.createLinearGradient(0, barY, 0, baseY);
    grad.addColorStop(0, barColor);
    grad.addColorStop(1, withAlpha(barColor, 0.7));
    ctx.fillStyle = grad;
    roundRectPath(ctx, barX + barOffsetX, barY, barW, barHeight, 8);
    ctx.fill();

    // Value on top with bounce-in
    if (props.showValues && staggeredProgress > 0.5) {
      const valueAlpha = clamp01((staggeredProgress - 0.5) * 2);
      const bounceScale = 1 + 0.15 * Math.sin(clamp01((staggeredProgress - 0.5) * 2) * Math.PI);
      ctx.save();
      ctx.globalAlpha *= valueAlpha;
      ctx.font = `bold ${theme.bodyFontSize * bounceScale}px ${font}`;
      ctx.fillStyle = theme.textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      const valueText = `${item.value}${props.unit}`;
      drawGlowText(ctx, valueText, barX + barW / 2 + barOffsetX, barY - 10, {
        color: theme.textColor, glowColor: barColor, glowBlur: 8 * valueAlpha,
      });
      ctx.restore();
    }

    // Label below
    ctx.font = `${theme.bodyFontSize}px ${font}`;
    ctx.fillStyle = theme.textSecondaryColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(item.label, barX + barW / 2 + barOffsetX, baseY + 20);
  });
}

// ============================================================
// KeywordHighlight
// ============================================================
export function drawKeywordHighlight(
  dc: DrawContext,
  props: KeywordHighlightProps,
  localTime: number,
  duration: number,
  theme: ThemeTokens,
): void {
  const { ctx, canvas } = dc;
  const font = theme.fontFamily;
  const progress = getAnimProgress(localTime, duration);
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  // Background
  ctx.fillStyle = props.bgColor ?? theme.bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const fontSize = props.fontSize ?? theme.titleFontSize * 1.5;
  let scale = 1;
  let glowBlur = props.glowRadius ?? 20;

  if (props.animation === 'pulse') {
    // Continuous pulse after entering
    if (progress < 0.3) {
      const enterT = EASINGS.easeOut(progress / 0.3);
      scale = lerp(0.8, 1, enterT);
    } else {
      const pulseT = (localTime - duration * ANIMATION_PHASE * 0.3) * 2;
      scale = 1 + (props.pulseScale - 1) * (0.5 + 0.5 * Math.sin(pulseT));
    }
  } else if (props.animation === 'glow') {
    if (progress < 0.3) {
      const enterT = EASINGS.easeOut(progress / 0.3);
      glowBlur = props.glowRadius * enterT;
    } else {
      const glowT = localTime * 2;
      glowBlur = props.glowRadius * (0.6 + 0.4 * Math.sin(glowT));
    }
  } else if (props.animation === 'scaleIn') {
    scale = lerp(0.5, 1, EASINGS.elastic(progress));
  }

  // Apply glow
  ctx.shadowColor = props.glowColor ?? theme.primaryColor;
  ctx.shadowBlur = glowBlur;

  // Apply scale
  if (scale !== 1) {
    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);
    ctx.translate(-centerX, -centerY);
  }

  // Draw text
  ctx.font = `bold ${fontSize}px ${font}`;
  ctx.fillStyle = props.textColor ?? theme.primaryColor;
  ctx.fillText(props.text, centerX, centerY);

  ctx.restore();

  // Particle burst — radiating from center during first 50%
  if (progress < 0.5) {
    const burstT = progress / 0.5;
    const burstColor = props.glowColor ?? theme.primaryColor;
    const burstCount = 24;
    const maxRadius = Math.min(canvas.width, canvas.height) * 0.4;
    for (let i = 0; i < burstCount; i++) {
      const angle = (i / burstCount) * Math.PI * 2;
      const particleDist = burstT * maxRadius * (0.7 + 0.3 * Math.sin(i * 1.7));
      const px = centerX + Math.cos(angle) * particleDist;
      const py = centerY + Math.sin(angle) * particleDist;
      const pAlpha = (1 - burstT) * 0.6;
      const pSize = (1 - burstT) * 4 + 1;
      ctx.save();
      ctx.globalAlpha = pAlpha;
      ctx.fillStyle = burstColor;
      ctx.shadowColor = burstColor;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(px, py, pSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Continuous ambient particles after burst
  if (progress >= 0.3) {
    const ambientT = (localTime - duration * ANIMATION_PHASE * 0.3) * 1.5;
    const ambientColor = props.glowColor ?? theme.primaryColor;
    const ambientCount = 8;
    for (let i = 0; i < ambientCount; i++) {
      const angle = ambientT * 0.5 + (i / ambientCount) * Math.PI * 2;
      const radius = 100 + 80 * Math.sin(ambientT * 0.7 + i);
      const px = centerX + Math.cos(angle) * radius;
      const py = centerY + Math.sin(angle) * radius;
      const pAlpha = 0.3 + 0.2 * Math.sin(ambientT + i * 2);
      ctx.save();
      ctx.globalAlpha = pAlpha;
      ctx.fillStyle = ambientColor;
      ctx.shadowColor = ambientColor;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

// ============================================================
// QuoteCard
// ============================================================
export function drawQuoteCard(
  dc: DrawContext,
  props: QuoteCardProps,
  localTime: number,
  duration: number,
  theme: ThemeTokens,
): void {
  const { ctx, canvas } = dc;
  const font = theme.fontFamily;
  const progress = getAnimProgress(localTime, duration);

  // Resolve font sizes with theme fallback
  const quoteFontSize = props.quoteFontSize ?? theme.titleFontSize * 0.8;
  const authorFontSize = props.authorFontSize ?? theme.subtitleFontSize * 0.8;

  // Background
  ctx.fillStyle = props.bgColor ?? theme.cardBgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const padding = canvas.width * 0.12;
  const maxTextWidth = canvas.width - padding * 2;
  const centerX = canvas.width / 2;

  // Quote text
  ctx.font = `${quoteFontSize}px ${font}`;
  const quoteLines = wrapText(ctx, props.quote, maxTextWidth);
  const lineHeight = quoteFontSize * 1.5;

  // Author
  ctx.font = `${authorFontSize}px ${font}`;
  const authorLines = props.author ? wrapText(ctx, props.author, maxTextWidth) : [];
  const authorLineHeight = authorFontSize * 1.4;

  const quoteBlockHeight = quoteLines.length * lineHeight;
  const authorBlockHeight = authorLines.length * authorLineHeight;
  const gap = 50;
  const totalHeight = quoteBlockHeight + gap + authorBlockHeight;
  const startY = canvas.height / 2 - totalHeight / 2;

  // Apply animation
  ctx.save();
  if (props.animation === 'slideUp') {
    ctx.translate(0, (1 - EASINGS.easeOut(progress)) * 60);
  } else if (props.animation === 'scaleIn') {
    const scale = 0.85 + 0.15 * EASINGS.easeOut(progress);
    ctx.translate(centerX, canvas.height / 2);
    ctx.scale(scale, scale);
    ctx.translate(-centerX, -canvas.height / 2);
  } else {
    ctx.globalAlpha *= progress;
  }

  // Quote mark
  if (props.showQuoteMark) {
    const markSize = quoteFontSize * 1.5;
    ctx.font = `bold ${markSize}px ${font}`;
    ctx.fillStyle = withAlpha(theme.primaryColor, 0.3);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    let mark = '"';
    if (props.quoteMarkStyle === 'single') mark = "'";
    else if (props.quoteMarkStyle === 'block') mark = '';

    if (mark) {
      ctx.fillText(mark, padding - 10, startY - markSize * 0.8);
    } else {
      // Block style: draw a vertical bar
      ctx.fillStyle = withAlpha(theme.primaryColor, 0.5);
      ctx.fillRect(padding - 10, startY, 6, quoteBlockHeight);
    }
  }

  // Quote text
  ctx.font = `${quoteFontSize}px ${font}`;
  ctx.fillStyle = props.quoteColor ?? theme.textColor;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  for (let i = 0; i < quoteLines.length; i++) {
    ctx.fillText(quoteLines[i], padding, startY + i * lineHeight);
  }

  // Author
  if (authorLines.length > 0) {
    ctx.font = `${authorFontSize}px ${font}`;
    ctx.fillStyle = props.authorColor ?? theme.textSecondaryColor;
    const authorStartY = startY + quoteBlockHeight + gap;
    for (let i = 0; i < authorLines.length; i++) {
      ctx.fillText(authorLines[i], padding, authorStartY + i * authorLineHeight);
    }
  }

  ctx.restore();
}

// ============================================================
// EndCard
// ============================================================
export function drawEndCard(
  dc: DrawContext,
  props: EndCardProps,
  localTime: number,
  duration: number,
  theme: ThemeTokens,
): void {
  const { ctx, canvas } = dc;
  const font = theme.fontFamily;
  const progress = getAnimProgress(localTime, duration);
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  // Background
  ctx.fillStyle = props.bgColor ?? theme.bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  let fadeAlpha = 1;
  if (props.fadeOut && localTime > duration * 0.7) {
    fadeAlpha = 1 - clamp01((localTime - duration * 0.7) / (duration * 0.3));
  }

  ctx.save();
  ctx.globalAlpha *= fadeAlpha;

  // Apply animation
  if (props.animation === 'slideUp') {
    ctx.translate(0, (1 - EASINGS.easeOut(progress)) * 60);
  } else if (props.animation === 'scaleIn') {
    const scale = 0.85 + 0.15 * EASINGS.elastic(progress);
    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);
    ctx.translate(-centerX, -centerY);
  } else {
    ctx.globalAlpha *= progress;
  }

  // Brand name with glow
  ctx.font = `bold ${theme.titleFontSize}px ${font}`;
  ctx.fillStyle = theme.primaryColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = theme.primaryColor;
  ctx.shadowBlur = 25 * progress;
  ctx.fillText(props.brandName, centerX, centerY - 80);
  ctx.shadowBlur = 0;

  // Slogan
  if (props.slogan) {
    ctx.font = `${theme.subtitleFontSize}px ${font}`;
    ctx.fillStyle = theme.textSecondaryColor;
    ctx.fillText(props.slogan, centerX, centerY);
  }

  // CTA button
  if (props.ctaText) {
    ctx.font = `bold ${theme.bodyFontSize}px ${font}`;
    const textMetrics = ctx.measureText(props.ctaText);
    const btnWidth = textMetrics.width + 80;
    const btnHeight = theme.bodyFontSize + 40;
    const btnX = centerX - btnWidth / 2;
    const btnY = centerY + 80;

    // Button background with subtle glow
    ctx.shadowColor = theme.primaryColor;
    ctx.shadowBlur = 15 * progress;
    ctx.fillStyle = theme.primaryColor;
    roundRectPath(ctx, btnX, btnY, btnWidth, btnHeight, theme.borderRadius);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Button text
    ctx.fillStyle = '#ffffff';
    ctx.fillText(props.ctaText, centerX, btnY + btnHeight / 2);
  }

  // Sweep light effect during first 40% of animation
  if (progress < 0.4) {
    const sweepProgress = progress / 0.4;
    const sweepX = -canvas.width * 0.3 + sweepProgress * canvas.width * 1.6;
    const grad = ctx.createLinearGradient(sweepX - 80, 0, sweepX + 80, 0);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.15)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.restore();
}

// ============================================================
// PieChart
// ============================================================
export function drawPieChart(
  dc: DrawContext,
  props: PieChartProps,
  localTime: number,
  duration: number,
  theme: ThemeTokens,
): void {
  const { ctx, canvas } = dc;
  const font = theme.fontFamily;
  const progress = getAnimProgress(localTime, duration);
  const data = props.data ?? [];
  if (data.length === 0) return;

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(canvas.width, canvas.height) * 0.28;
  const showLabels = props.showLabels ?? true;
  const showPercent = props.showPercent ?? true;
  const showLegend = props.showLegend ?? true;
  const donutMode = props.donutMode ?? false;
  const centerText = props.centerText ?? '';
  const innerRadius = donutMode ? radius * 0.55 : 0;

  // Background
  ctx.fillStyle = theme.cardBgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Title
  if (props.title) {
    ctx.font = `bold ${theme.titleFontSize * 0.7}px ${font}`;
    ctx.fillStyle = theme.textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(props.title, centerX, canvas.height * 0.08);
  }

  const total = data.reduce((sum: number, d) => sum + (d.value ?? 0), 0);
  if (total <= 0) return;

  const chartCenterY = canvas.height * 0.45;
  let startAngle = -Math.PI / 2;
  const animProgress = props.animation === 'fadeIn' ? 1 : progress;

  ctx.save();
  if (props.animation === 'fadeIn') ctx.globalAlpha *= progress;

  data.forEach((item, i) => {
    const sliceAngle = ((item.value ?? 0) / total) * Math.PI * 2 * animProgress;
    const color = item.color ?? theme.chartColors[i % theme.chartColors.length];

    // Fill slice
    ctx.beginPath();
    ctx.moveTo(centerX, chartCenterY);
    ctx.arc(centerX, chartCenterY, radius, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Separator stroke between slices for clarity
    ctx.strokeStyle = theme.cardBgColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(centerX, chartCenterY);
    ctx.lineTo(centerX + Math.cos(startAngle) * radius, chartCenterY + Math.sin(startAngle) * radius);
    ctx.stroke();

    // Labels
    if (showLabels && animProgress > 0.5) {
      const midAngle = startAngle + sliceAngle / 2;
      const labelRadius = radius * 1.18;
      const lx = centerX + Math.cos(midAngle) * labelRadius;
      const ly = chartCenterY + Math.sin(midAngle) * labelRadius;
      const percent = ((item.value ?? 0) / total * 100).toFixed(1);

      ctx.font = `bold ${theme.bodyFontSize * 0.7}px ${font}`;
      ctx.fillStyle = theme.textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (showPercent) {
        ctx.fillText(`${percent}%`, lx, ly);
      } else {
        ctx.fillText(item.label ?? '', lx, ly);
      }
    }

    startAngle += sliceAngle;
  });

  // Donut center text
  if (donutMode && centerText && animProgress > 0.5) {
    // Clear center with bg color for clean donut hole
    ctx.fillStyle = theme.cardBgColor;
    ctx.beginPath();
    ctx.arc(centerX, chartCenterY, innerRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = `bold ${theme.subtitleFontSize}px ${font}`;
    ctx.fillStyle = theme.primaryColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(centerText, centerX, chartCenterY);
  }

  ctx.restore();

  // Legend
  if (showLegend) {
    const legendY = canvas.height * 0.82;
    const legendItemWidth = canvas.width / data.length;
    data.forEach((item, i) => {
      const lx = legendItemWidth * i + 24;
      const color = item.color ?? theme.chartColors[i % theme.chartColors.length];
      ctx.fillStyle = color;
      roundRectPath(ctx, lx, legendY, 28, 28, 6);
      ctx.fill();
      ctx.font = `${theme.bodyFontSize * 0.65}px ${font}`;
      ctx.fillStyle = theme.textColor;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.label ?? '', lx + 36, legendY + 14);
    });
  }
}

// ============================================================
// LineChart
// ============================================================
export function drawLineChart(
  dc: DrawContext,
  props: LineChartProps,
  localTime: number,
  duration: number,
  theme: ThemeTokens,
): void {
  const { ctx, canvas } = dc;
  const font = theme.fontFamily;
  const progress = getAnimProgress(localTime, duration);
  const series = props.series ?? [];
  if (series.length === 0) return;

  const padding = { top: canvas.height * 0.12, right: 80, bottom: canvas.height * 0.15, left: 100 };
  const chartW = canvas.width - padding.left - padding.right;
  const chartH = canvas.height - padding.top - padding.bottom;
  const showDots = props.showDots ?? true;
  const showGrid = props.showGrid ?? true;
  const fillArea = props.fillArea ?? false;

  // Background
  ctx.fillStyle = theme.cardBgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Title
  if (props.title) {
    ctx.font = `bold ${theme.titleFontSize * 0.8}px ${font}`;
    ctx.fillStyle = theme.textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(props.title, canvas.width / 2, canvas.height * 0.06);
  }

  // Calculate max value
  let yMax = props.yMax ?? 0;
  if (!props.yMax) {
    series.forEach(s => {
      (s.data ?? []).forEach(v => { if (v > yMax) yMax = v; });
    });
  }
  yMax = yMax * 1.1 || 1;

  // Grid
  if (showGrid) {
    ctx.strokeStyle = withAlpha(theme.textColor, 0.12);
    ctx.lineWidth = 1.5;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartH / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartW, y);
      ctx.stroke();
    }
  }

  // X axis labels
  const xLabels = props.xLabels ?? [];
  ctx.font = `${theme.bodyFontSize * 0.6}px ${font}`;
  ctx.fillStyle = theme.textSecondaryColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const pointsPerSeries = series[0]?.data?.length ?? 0;
  for (let i = 0; i < pointsPerSeries; i++) {
    const x = padding.left + (chartW / Math.max(pointsPerSeries - 1, 1)) * i;
    ctx.fillText(xLabels[i] ?? '', x, padding.top + chartH + 12);
  }

  // Draw each series
  series.forEach((s, si) => {
    const data = s.data ?? [];
    if (data.length === 0) return;
    const color = s.color ?? theme.chartColors[si % theme.chartColors.length];
    const drawProgress = props.animation === 'fadeIn' ? 1 : progress;
    const visiblePoints = Math.ceil(data.length * drawProgress);

    // Fill area
    if (fillArea && visiblePoints > 1) {
      ctx.beginPath();
      ctx.moveTo(padding.left, padding.top + chartH);
      for (let i = 0; i < visiblePoints; i++) {
        const x = padding.left + (chartW / Math.max(data.length - 1, 1)) * i;
        const y = padding.top + chartH - (data[i] / yMax) * chartH;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(padding.left + (chartW / Math.max(data.length - 1, 1)) * (visiblePoints - 1), padding.top + chartH);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
      grad.addColorStop(0, withAlpha(color, 0.45));
      grad.addColorStop(1, withAlpha(color, 0.02));
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Line — thick and vibrant
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < visiblePoints; i++) {
      const x = padding.left + (chartW / Math.max(data.length - 1, 1)) * i;
      const y = padding.top + chartH - (data[i] / yMax) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw-head glow: a luminous dot at the drawing front
    if (visiblePoints > 0 && visiblePoints < data.length && drawProgress < 1) {
      const headIdx = visiblePoints - 1;
      const nextIdx = Math.min(headIdx + 1, data.length - 1);
      const segProgress = (data.length * drawProgress) - Math.floor(data.length * drawProgress);
      const hx = padding.left + (chartW / Math.max(data.length - 1, 1)) * headIdx + (chartW / Math.max(data.length - 1, 1)) * segProgress;
      const hy = padding.top + chartH - (data[headIdx] + (data[nextIdx] - data[headIdx]) * segProgress) / yMax * chartH;
      drawGlowDot(ctx, hx, hy, 18, color, 40);
    }

    // Dots — bigger with white outline for contrast
    if (showDots) {
      for (let i = 0; i < visiblePoints; i++) {
        const x = padding.left + (chartW / Math.max(data.length - 1, 1)) * i;
        const y = padding.top + chartH - (data[i] / yMax) * chartH;
        // White outline
        ctx.fillStyle = theme.cardBgColor;
        ctx.beginPath();
        ctx.arc(x, y, 13, 0, Math.PI * 2);
        ctx.fill();
        // Color dot with subtle glow
        drawGlowDot(ctx, x, y, 9, color, 12);
      }
    }
  });

  // Legend
  const legendY = canvas.height * 0.93;
  const legendItemWidth = canvas.width / series.length;
  series.forEach((s, si) => {
    const color = s.color ?? theme.chartColors[si % theme.chartColors.length];
    const lx = legendItemWidth * si + 24;
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(lx, legendY + 10);
    ctx.lineTo(lx + 30, legendY + 10);
    ctx.stroke();
    ctx.font = `${theme.bodyFontSize * 0.6}px ${font}`;
    ctx.fillStyle = theme.textColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(s.name ?? '', lx + 38, legendY + 10);
  });
}

// ============================================================
// ImageShow
// ============================================================
export async function drawImageShow(
  dc: DrawContext,
  props: ImageShowProps,
  localTime: number,
  duration: number,
  theme: ThemeTokens,
): Promise<void> {
  const { ctx, canvas, loadImage } = dc;
  const font = theme.fontFamily;
  const progress = getAnimProgress(localTime, duration);
  const fit = props.fit ?? 'cover';
  const filter = props.filter ?? 'none';
  const roundedCorners = props.roundedCorners ?? 0;

  // Background
  ctx.fillStyle = theme.cardBgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!props.imageUrl || !loadImage) {
    // Placeholder
    ctx.font = `${theme.bodyFontSize}px ${font}`;
    ctx.fillStyle = theme.textSecondaryColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('无图片', canvas.width / 2, canvas.height / 2);
    return;
  }

  try {
    const img = await loadImage(props.imageUrl);
    ctx.save();

    // Apply animation
    if (props.animation === 'fadeIn') {
      ctx.globalAlpha *= progress;
    } else if (props.animation === 'slideIn') {
      ctx.translate((1 - EASINGS.easeOut(progress)) * -canvas.width * 0.3, 0);
    } else if (props.animation === 'kenBurns') {
      const scale = props.kenBurnsDirection === 'zoomIn'
        ? 1 + 0.2 * (localTime / duration)
        : props.kenBurnsDirection === 'zoomOut'
          ? 1.2 - 0.2 * (localTime / duration)
          : 1 + 0.1 * (localTime / duration);
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(scale, scale);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }

    // Apply filter
    const ctxAny = ctx as unknown as { filter: string };
    if (filter === 'grayscale') ctxAny.filter = 'grayscale(100%)';
    else if (filter === 'sepia') ctxAny.filter = 'sepia(100%)';
    else if (filter === 'blur') ctxAny.filter = 'blur(10px)';
    else if (filter === 'darken') ctxAny.filter = 'brightness(0.5)';

    // Calculate dimensions based on fit
    const imgAny = img as { width: number; height: number };
    const imgRatio = imgAny.width / imgAny.height;
    const canvasRatio = canvas.width / canvas.height;
    let dw: number, dh: number, dx: number, dy: number;

    if (fit === 'cover') {
      if (imgRatio > canvasRatio) {
        dh = canvas.height;
        dw = dh * imgRatio;
      } else {
        dw = canvas.width;
        dh = dw / imgRatio;
      }
      dx = (canvas.width - dw) / 2;
      dy = (canvas.height - dh) / 2;
    } else if (fit === 'contain') {
      if (imgRatio > canvasRatio) {
        dw = canvas.width;
        dh = dw / imgRatio;
      } else {
        dh = canvas.height;
        dw = dh * imgRatio;
      }
      dx = (canvas.width - dw) / 2;
      dy = (canvas.height - dh) / 2;
    } else {
      dw = canvas.width;
      dh = canvas.height;
      dx = 0;
      dy = 0;
    }

    if (roundedCorners > 0) {
      roundRectPath(ctx, dx, dy, dw, dh, roundedCorners);
      ctx.clip();
    }

    ctx.drawImage(img as CanvasImageLike, dx, dy, dw, dh);
    (ctx as unknown as { filter: string }).filter = 'none';

    // Overlay text
    if (props.overlayText) {
      const overlayY = props.overlayPosition === 'top' ? canvas.height * 0.1
        : props.overlayPosition === 'bottom' ? canvas.height * 0.9
          : canvas.height / 2;
      ctx.font = `bold ${theme.subtitleFontSize}px ${font}`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 20;
      ctx.fillText(props.overlayText, canvas.width / 2, overlayY);
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  } catch {
    ctx.font = `${theme.bodyFontSize}px ${font}`;
    ctx.fillStyle = theme.textSecondaryColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('图片加载失败', canvas.width / 2, canvas.height / 2);
  }
}

// ============================================================
// ProcessFlow
// ============================================================
export function drawProcessFlow(
  dc: DrawContext,
  props: ProcessFlowProps,
  localTime: number,
  duration: number,
  theme: ThemeTokens,
): void {
  const { ctx, canvas } = dc;
  const font = theme.fontFamily;
  const progress = getAnimProgress(localTime, duration);
  const steps = props.steps ?? [];
  if (steps.length === 0) return;

  const layout = props.layout ?? 'vertical';
  const showConnector = props.showConnector ?? true;
  const connectorStyle = props.connectorStyle ?? 'arrow';
  const iconType = props.iconType ?? 'number';
  const stepDelay = props.stepDelay ?? 0.3;

  // Background
  ctx.fillStyle = theme.cardBgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Title
  if (props.title) {
    ctx.font = `bold ${theme.titleFontSize * 0.7}px ${font}`;
    ctx.fillStyle = theme.textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(props.title, canvas.width / 2, canvas.height * 0.06);
  }

  const isVertical = layout === 'vertical';
  const stepCount = steps.length;
  const startX = canvas.width * 0.5;
  const startY = canvas.height * 0.15;
  const stepSpacing = isVertical
    ? (canvas.height * 0.65) / Math.max(stepCount, 1)
    : (canvas.width * 0.8) / Math.max(stepCount, 1);

  steps.forEach((step, i) => {
    let stepProgress: number;
    if (props.animation === 'fadeInAll') {
      stepProgress = progress;
    } else {
      const stepStart = i * stepDelay;
      stepProgress = clamp01((localTime - stepStart) / (duration * ANIMATION_PHASE - stepStart));
    }

    if (stepProgress <= 0) return;

    const x = isVertical ? startX : startX + stepSpacing * i;
    const y = isVertical ? startY + stepSpacing * i : startY + 60;

    ctx.save();
    ctx.globalAlpha *= stepProgress;

    // Connector
    if (showConnector && i > 0) {
      const prevX = isVertical ? startX : startX + stepSpacing * (i - 1);
      const prevY = isVertical ? startY + stepSpacing * (i - 1) : startY + 60;
      ctx.strokeStyle = withAlpha(theme.primaryColor, 0.4);
      ctx.lineWidth = 3;
      if (connectorStyle === 'dashed') ctx.setLineDash([10, 8]);

      ctx.beginPath();
      if (isVertical) {
        ctx.moveTo(prevX, prevY + 30);
        ctx.lineTo(x, y - 30);
      } else {
        ctx.moveTo(prevX + 30, prevY);
        ctx.lineTo(x - 30, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      if (connectorStyle === 'arrow') {
        ctx.fillStyle = withAlpha(theme.primaryColor, 0.4);
        ctx.beginPath();
        if (isVertical) {
          ctx.moveTo(x, y - 30);
          ctx.lineTo(x - 8, y - 40);
          ctx.lineTo(x + 8, y - 40);
        } else {
          ctx.moveTo(x - 30, y);
          ctx.lineTo(x - 40, y - 8);
          ctx.lineTo(x - 40, y + 8);
        }
        ctx.closePath();
        ctx.fill();
      }
    }

    // Icon
    const iconR = 30;
    ctx.fillStyle = theme.primaryColor;
    ctx.beginPath();
    ctx.arc(x, y, iconR, 0, Math.PI * 2);
    ctx.fill();

    if (iconType === 'number') {
      ctx.font = `bold ${theme.bodyFontSize * 0.8}px ${font}`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), x, y);
    } else if (iconType === 'dot') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (iconType === 'check') {
      ctx.font = `bold ${theme.bodyFontSize * 0.8}px ${font}`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✓', x, y);
    }

    // Step title
    ctx.font = `bold ${theme.subtitleFontSize * 0.6}px ${font}`;
    ctx.fillStyle = theme.textColor;
    ctx.textAlign = isVertical ? 'left' : 'center';
    ctx.textBaseline = 'middle';
    const textX = isVertical ? x + 50 : x;
    const textY = isVertical ? y - 12 : y + 50;
    ctx.fillText(step.title ?? '', textX, textY);

    // Step description
    if (step.description) {
      ctx.font = `${theme.bodyFontSize * 0.5}px ${font}`;
      ctx.fillStyle = theme.textSecondaryColor;
      const descY = isVertical ? y + 14 : y + 80;
      const descLines = wrapText(ctx, step.description, canvas.width * 0.6);
      descLines.slice(0, 2).forEach((line, li) => {
        ctx.fillText(line, textX, descY + li * (theme.bodyFontSize * 0.6));
      });
    }

    ctx.restore();
  });
}

// ============================================================
// PersonaCard
// ============================================================
export function drawPersonaCard(
  dc: DrawContext,
  props: PersonaCardProps,
  localTime: number,
  duration: number,
  theme: ThemeTokens,
): void {
  const { ctx, canvas } = dc;
  const font = theme.fontFamily;
  const progress = getAnimProgress(localTime, duration);
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const avatarShape = props.avatarShape ?? 'circle';
  const showBorder = props.showBorder ?? true;
  const borderColor = props.borderColor ?? theme.primaryColor;

  // Background
  ctx.fillStyle = props.bgColor ?? theme.cardBgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.globalAlpha *= progress;

  // Apply animation
  if (props.animation === 'slideLeft') {
    ctx.translate((1 - EASINGS.easeOut(progress)) * 200, 0);
  } else if (props.animation === 'slideRight') {
    ctx.translate((1 - EASINGS.easeOut(progress)) * -200, 0);
  } else if (props.animation === 'scaleIn') {
    const scale = 0.85 + 0.15 * EASINGS.easeOut(progress);
    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);
    ctx.translate(-centerX, -centerY);
  }

  const avatarSize = 280;
  const avatarX = centerX - avatarSize / 2;
  const avatarY = centerY - 340;

  // Decorative accent bar behind avatar
  ctx.fillStyle = withAlpha(borderColor, 0.06);
  ctx.fillRect(0, avatarY - 80, canvas.width, avatarSize + 160);

  // Decorative side accents
  ctx.fillStyle = withAlpha(borderColor, 0.15);
  ctx.fillRect(40, avatarY - 80, 6, avatarSize + 160);
  ctx.fillRect(canvas.width - 46, avatarY - 80, 6, avatarSize + 160);

  // Avatar border ring (outer + inner glow)
  if (showBorder) {
    ctx.strokeStyle = withAlpha(borderColor, 0.3);
    ctx.lineWidth = 2;
    if (avatarShape === 'circle') {
      ctx.beginPath();
      ctx.arc(centerX, avatarY + avatarSize / 2, avatarSize / 2 + 18, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 6;
    if (avatarShape === 'circle') {
      ctx.beginPath();
      ctx.arc(centerX, avatarY + avatarSize / 2, avatarSize / 2 + 8, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      roundRectPath(ctx, avatarX - 8, avatarY - 8, avatarSize + 16, avatarSize + 16, avatarShape === 'rounded' ? 24 : 0);
      ctx.stroke();
    }
  }

  // Avatar fill
  const avatarGrad = ctx.createLinearGradient(avatarX, avatarY, avatarX + avatarSize, avatarY + avatarSize);
  avatarGrad.addColorStop(0, theme.primaryColor);
  avatarGrad.addColorStop(1, theme.secondaryColor);
  ctx.fillStyle = avatarGrad;
  if (avatarShape === 'circle') {
    ctx.beginPath();
    ctx.arc(centerX, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    roundRectPath(ctx, avatarX, avatarY, avatarSize, avatarSize, avatarShape === 'rounded' ? 20 : 0);
    ctx.fill();
  }

  // Initials
  ctx.font = `bold 120px ${font}`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const initials = (props.name ?? '?').slice(0, 1);
  ctx.fillText(initials, centerX, avatarY + avatarSize / 2);

  // Name
  const nameY = avatarY + avatarSize + 90;
  ctx.font = `bold ${theme.titleFontSize}px ${font}`;
  ctx.fillStyle = theme.textColor;
  ctx.fillText(props.name ?? '', centerX, nameY);

  // Title with accent underline
  if (props.title) {
    ctx.font = `${theme.subtitleFontSize}px ${font}`;
    ctx.fillStyle = theme.primaryColor;
    ctx.fillText(props.title, centerX, nameY + 65);
    // Underline accent
    const tw = ctx.measureText(props.title).width;
    ctx.strokeStyle = theme.primaryColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX - tw / 2 - 12, nameY + 92);
    ctx.lineTo(centerX + tw / 2 + 12, nameY + 92);
    ctx.stroke();
  }

  // Description
  if (props.description) {
    ctx.font = `${theme.bodyFontSize}px ${font}`;
    ctx.fillStyle = theme.textSecondaryColor;
    const lines = wrapText(ctx, props.description, canvas.width * 0.85);
    const descStartY = nameY + 150;
    lines.slice(0, 3).forEach((line, i) => {
      ctx.fillText(line, centerX, descStartY + i * (theme.bodyFontSize * 1.2));
    });
  }

  // Bottom decorative bar
  ctx.fillStyle = withAlpha(theme.primaryColor, 0.3);
  ctx.fillRect(centerX - 100, canvas.height - 120, 200, 4);

  ctx.restore();
}

// ============================================================
// CompareCard
// ============================================================
export function drawCompareCard(
  dc: DrawContext,
  props: CompareCardProps,
  localTime: number,
  duration: number,
  theme: ThemeTokens,
): void {
  const { ctx, canvas } = dc;
  const font = theme.fontFamily;
  const progress = getAnimProgress(localTime, duration);
  const layout = props.layout ?? 'sideBySide';
  const dividerStyle = props.dividerStyle ?? 'line';

  // Background
  ctx.fillStyle = theme.cardBgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.globalAlpha *= progress;

  // Title
  if (props.title) {
    ctx.font = `bold ${theme.titleFontSize * 0.7}px ${font}`;
    ctx.fillStyle = theme.textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(props.title, canvas.width / 2, canvas.height * 0.08);
  }

  const isSideBySide = layout === 'sideBySide';
  const halfW = canvas.width / 2;
  const halfH = canvas.height / 2;
  const contentStartY = canvas.height * 0.15;

  // Left side
  ctx.save();
  if (props.animation === 'slideLeft') {
    ctx.globalAlpha *= clamp01(progress * 2);
  }
  ctx.fillStyle = withAlpha(props.leftColor ?? theme.primaryColor, 0.1);
  if (isSideBySide) {
    ctx.fillRect(0, contentStartY, halfW, canvas.height - contentStartY);
  } else {
    ctx.fillRect(0, contentStartY, canvas.width, halfH);
  }
  ctx.fillStyle = props.leftColor ?? theme.primaryColor;
  ctx.font = `bold ${theme.subtitleFontSize * 0.6}px ${font}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(props.leftLabel ?? '', isSideBySide ? halfW / 2 : canvas.width / 2, contentStartY + 40);
  ctx.font = `${theme.bodyFontSize * 0.6}px ${font}`;
  ctx.fillStyle = theme.textColor;
  const leftLines = wrapText(ctx, props.leftContent ?? '', isSideBySide ? halfW * 0.8 : canvas.width * 0.8);
  leftLines.slice(0, 5).forEach((line, i) => {
    ctx.fillText(line, isSideBySide ? halfW / 2 : canvas.width / 2, contentStartY + 100 + i * (theme.bodyFontSize * 0.8));
  });
  ctx.restore();

  // Right side
  ctx.save();
  if (props.animation === 'slideLeft') {
    ctx.globalAlpha *= clamp01(progress * 2 - 1);
  }
  ctx.fillStyle = withAlpha(props.rightColor ?? theme.accentColor, 0.1);
  if (isSideBySide) {
    ctx.fillRect(halfW, contentStartY, halfW, canvas.height - contentStartY);
  } else {
    ctx.fillRect(0, halfH, canvas.width, halfH);
  }
  ctx.fillStyle = props.rightColor ?? theme.accentColor;
  ctx.font = `bold ${theme.subtitleFontSize * 0.6}px ${font}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(props.rightLabel ?? '', isSideBySide ? halfW + halfW / 2 : canvas.width / 2, isSideBySide ? contentStartY + 40 : halfH + 40);
  ctx.font = `${theme.bodyFontSize * 0.6}px ${font}`;
  ctx.fillStyle = theme.textColor;
  const rightLines = wrapText(ctx, props.rightContent ?? '', isSideBySide ? halfW * 0.8 : canvas.width * 0.8);
  const rightStartY = isSideBySide ? contentStartY + 100 : halfH + 100;
  rightLines.slice(0, 5).forEach((line, i) => {
    ctx.fillText(line, isSideBySide ? halfW + halfW / 2 : canvas.width / 2, rightStartY + i * (theme.bodyFontSize * 0.8));
  });
  ctx.restore();

  // Divider
  if (dividerStyle === 'line') {
    ctx.strokeStyle = withAlpha(theme.textColor, 0.2);
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (isSideBySide) {
      ctx.moveTo(halfW, contentStartY);
      ctx.lineTo(halfW, canvas.height);
    } else {
      ctx.moveTo(0, halfH);
      ctx.lineTo(canvas.width, halfH);
    }
    ctx.stroke();
  } else if (dividerStyle === 'VS') {
    ctx.font = `bold ${theme.titleFontSize * 0.5}px ${font}`;
    ctx.fillStyle = theme.textSecondaryColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (isSideBySide) {
      ctx.fillText('VS', halfW, canvas.height / 2);
    } else {
      ctx.fillText('VS', canvas.width / 2, halfH);
    }
  }

  ctx.restore();
}

// ============================================================
// NumberAnimation
// ============================================================
export function drawNumberAnimation(
  dc: DrawContext,
  props: NumberAnimationProps,
  localTime: number,
  duration: number,
  theme: ThemeTokens,
): void {
  const { ctx, canvas } = dc;
  const font = theme.fontFamily;
  const progress = getAnimProgress(localTime, duration);
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  const startValue = props.startValue ?? 0;
  const endValue = props.endValue ?? 100;
  const decimals = props.decimals ?? 0;
  const easing = props.easing ?? 'easeOut';

  // Background
  ctx.fillStyle = props.bgColor ?? theme.cardBgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Calculate animated value
  const eased = easing === 'linear' ? progress
    : easing === 'easeIn' ? progress * progress
      : easing === 'easeInOut' ? progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2
        : easing === 'bounce' ? 1 - Math.pow(1 - progress, 3)
          : 1 - Math.pow(1 - progress, 3); // easeOut

  const currentValue = startValue + (endValue - startValue) * eased;
  const displayValue = currentValue.toFixed(decimals);

  // Number with glow
  const fontSize = props.fontSize ?? 160;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  drawGlowText(ctx, `${props.prefix ?? ''}${displayValue}${props.suffix ?? ''}`, centerX, centerY, {
    font: `bold ${fontSize}px ${font}`,
    color: props.textColor ?? theme.primaryColor,
    glowColor: props.textColor ?? theme.primaryColor,
    glowBlur: 30,
    alpha: 1,
  });

  // Label
  if (props.label) {
    ctx.font = `${theme.bodyFontSize * 0.7}px ${font}`;
    ctx.fillStyle = theme.textSecondaryColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(props.label, centerX, centerY + fontSize * 0.8);
  }

  // Particle burst when reaching target value
  if (progress >= 0.92) {
    const burstT = (progress - 0.92) / 0.08;
    const burstColor = props.textColor ?? theme.primaryColor;
    const burstCount = 32;
    const maxRadius = Math.min(canvas.width, canvas.height) * 0.35;
    for (let i = 0; i < burstCount; i++) {
      const angle = (i / burstCount) * Math.PI * 2 + burstT * 0.3;
      const particleDist = burstT * maxRadius * (0.6 + 0.4 * Math.sin(i * 2.3));
      const px = centerX + Math.cos(angle) * particleDist;
      const py = centerY + Math.sin(angle) * particleDist;
      const pAlpha = (1 - burstT) * 0.8;
      const pSize = (1 - burstT) * 5 + 2;
      ctx.save();
      ctx.globalAlpha = pAlpha;
      ctx.fillStyle = burstColor;
      ctx.shadowColor = burstColor;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(px, py, pSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

// ============================================================
// TagCloud
// ============================================================
export function drawTagCloud(
  dc: DrawContext,
  props: TagCloudProps,
  localTime: number,
  duration: number,
  theme: ThemeTokens,
): void {
  const { ctx, canvas } = dc;
  const font = theme.fontFamily;
  const tags = props.tags ?? [];
  if (tags.length === 0) return;

  const layout = props.layout ?? 'grid';
  const minFontSize = props.minFontSize ?? 34;
  const maxFontSize = props.maxFontSize ?? 68;
  const staggerDelay = props.staggerDelay ?? 0.15;
  const localProgress = clamp01(localTime / (duration * ANIMATION_PHASE));

  // Background
  ctx.fillStyle = props.bgColor ?? theme.cardBgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (layout === 'grid') {
    // Calculate grid: prefer fewer columns for larger tags on mobile
    const cols = tags.length <= 4 ? 2 : Math.ceil(Math.sqrt(tags.length));
    const rows = Math.ceil(tags.length / cols);
    const padding = 60;
    const usableW = canvas.width - padding * 2;
    const usableH = canvas.height - padding * 2;
    const cellW = usableW / cols;
    const cellH = usableH / rows;

    tags.forEach((tag, i) => {
      let tagProgress: number;
      if (props.animation === 'fadeInSequential') {
        tagProgress = clamp01((localTime - i * staggerDelay) / (duration * ANIMATION_PHASE - i * staggerDelay));
      } else if (props.animation === 'fadeInAll') {
        tagProgress = localProgress;
      } else {
        tagProgress = localProgress;
      }
      if (tagProgress <= 0) return;

      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = padding + cellW * col + cellW / 2;
      const y = padding + cellH * row + cellH / 2;
      const fontSize = tag.size ?? Math.max(minFontSize, Math.min(maxFontSize, Math.floor(cellW * 0.28)));

      const tagColor = tag.color ?? theme.chartColors[i % theme.chartColors.length];
      const text = tag.text ?? '';

      ctx.save();
      ctx.globalAlpha *= tagProgress;
      if (props.animation === 'floatIn') {
        ctx.translate(0, (1 - tagProgress) * 30);
      }
      ctx.font = `bold ${fontSize}px ${font}`;
      ctx.fillStyle = tagColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Draw pill background
      const textWidth = ctx.measureText(text).width;
      const pillW = textWidth + fontSize * 0.8;
      const pillH = fontSize * 1.6;
      const pillX = x - pillW / 2;
      const pillY = y - pillH / 2;
      const radius = pillH / 2;
      ctx.beginPath();
      ctx.moveTo(pillX + radius, pillY);
      ctx.lineTo(pillX + pillW - radius, pillY);
      ctx.quadraticCurveTo(pillX + pillW, pillY, pillX + pillW, pillY + radius);
      ctx.lineTo(pillX + pillW, pillY + pillH - radius);
      ctx.quadraticCurveTo(pillX + pillW, pillY + pillH, pillX + pillW - radius, pillY + pillH);
      ctx.lineTo(pillX + radius, pillY + pillH);
      ctx.quadraticCurveTo(pillX, pillY + pillH, pillX, pillY + pillH - radius);
      ctx.lineTo(pillX, pillY + radius);
      ctx.quadraticCurveTo(pillX, pillY, pillX + radius, pillY);
      ctx.closePath();
      ctx.fillStyle = withAlpha(tagColor, 0.15);
      ctx.fill();
      ctx.strokeStyle = withAlpha(tagColor, 0.5);
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text on top
      ctx.fillStyle = tagColor;
      ctx.fillText(text, x, y);
      ctx.restore();
    });
  } else if (layout === 'spiral') {
    tags.forEach((tag, i) => {
      let tagProgress: number;
      if (props.animation === 'fadeInSequential') {
        tagProgress = clamp01((localTime - i * staggerDelay) / (duration * ANIMATION_PHASE - i * staggerDelay));
      } else {
        tagProgress = localProgress;
      }
      if (tagProgress <= 0) return;

      const angle = i * 0.5;
      const r = 40 * Math.sqrt(i);
      const x = canvas.width / 2 + r * Math.cos(angle);
      const y = canvas.height / 2 + r * Math.sin(angle);
      const fontSize = tag.size ?? (minFontSize + (maxFontSize - minFontSize) * (1 - i / tags.length));

      ctx.save();
      ctx.globalAlpha *= tagProgress;
      ctx.font = `bold ${fontSize}px ${font}`;
      ctx.fillStyle = tag.color ?? theme.chartColors[i % theme.chartColors.length];
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tag.text ?? '', x, y);
      ctx.restore();
    });
  } else {
    // random fallback — also use grid for clean look
    const cols = Math.min(tags.length, 2);
    const rows = Math.ceil(tags.length / cols);
    const cellW = canvas.width / cols;
    const cellH = canvas.height / rows;

    tags.forEach((tag, i) => {
      let tagProgress: number;
      if (props.animation === 'fadeInSequential') {
        tagProgress = clamp01((localTime - i * staggerDelay) / (duration * ANIMATION_PHASE - i * staggerDelay));
      } else {
        tagProgress = localProgress;
      }
      if (tagProgress <= 0) return;

      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = cellW * col + cellW / 2;
      const y = cellH * row + cellH / 2;
      const fontSize = tag.size ?? (minFontSize + (maxFontSize - minFontSize) * (0.4 + 0.6 * Math.abs(Math.sin(i * 1.7))));

      ctx.save();
      ctx.globalAlpha *= tagProgress;
      ctx.font = `bold ${fontSize}px ${font}`;
      const textWidth = ctx.measureText(tag.text ?? '').width;
      const padX = fontSize * 0.5;
      const padY = fontSize * 0.35;
      const pillW = textWidth + padX * 2;
      const pillH = fontSize + padY * 2;
      const pillX = x - pillW / 2;
      const pillY = y - pillH / 2;
      const tagColor = tag.color ?? theme.chartColors[i % theme.chartColors.length];
      const r = pillH / 2;

      ctx.beginPath();
      ctx.moveTo(pillX + r, pillY);
      ctx.lineTo(pillX + pillW - r, pillY);
      ctx.quadraticCurveTo(pillX + pillW, pillY, pillX + pillW, pillY + r);
      ctx.lineTo(pillX + pillW, pillY + pillH - r);
      ctx.quadraticCurveTo(pillX + pillW, pillY + pillH, pillX + pillW - r, pillY + pillH);
      ctx.lineTo(pillX + r, pillY + pillH);
      ctx.quadraticCurveTo(pillX, pillY + pillH, pillX, pillY + pillH - r);
      ctx.lineTo(pillX, pillY + r);
      ctx.quadraticCurveTo(pillX, pillY, pillX + r, pillY);
      ctx.closePath();
      ctx.fillStyle = withAlpha(tagColor, 0.15);
      ctx.fill();
      ctx.strokeStyle = withAlpha(tagColor, 0.5);
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = tagColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tag.text ?? '', x, y);
      ctx.restore();
    });
  }
}

// ============================================================
// ProgressTimeline
// ============================================================
export function drawProgressTimeline(
  dc: DrawContext,
  props: ProgressTimelineProps,
  localTime: number,
  duration: number,
  theme: ThemeTokens,
): void {
  const { ctx, canvas } = dc;
  const font = theme.fontFamily;
  const progress = getAnimProgress(localTime, duration);
  const nodes = props.nodes ?? [];
  if (nodes.length === 0) return;

  const layout = props.layout ?? 'horizontal';
  const lineStyle = props.lineStyle ?? 'solid';
  const nodeShape = props.nodeShape ?? 'circle';
  const showProgress = props.showProgress ?? true;

  // Background
  ctx.fillStyle = theme.cardBgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Title
  if (props.title) {
    ctx.font = `bold ${theme.titleFontSize * 0.75}px ${font}`;
    ctx.fillStyle = theme.textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(props.title, canvas.width / 2, canvas.height * 0.07);
  }

  const isHorizontal = layout === 'horizontal';
  const startX = isHorizontal ? canvas.width * 0.15 : canvas.width / 2;
  const endX = isHorizontal ? canvas.width * 0.85 : canvas.width / 2;
  const startY = isHorizontal ? canvas.height * 0.48 : canvas.height * 0.2;
  const endY = isHorizontal ? canvas.height * 0.48 : canvas.height * 0.8;
  const lineLen = nodes.length - 1;
  const nodeR = isHorizontal ? 32 : 36;

  // Draw line
  const drawProgress = props.animation === 'fadeIn' ? 1 : progress;
  if (lineStyle === 'dashed') ctx.setLineDash([12, 8]);

  // Background line
  ctx.strokeStyle = withAlpha(theme.textColor, 0.15);
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  if (isHorizontal) ctx.lineTo(endX, startY);
  else ctx.lineTo(startX, endY);
  ctx.stroke();

  // Progress line
  if (showProgress) {
    const progX = isHorizontal ? startX + (endX - startX) * drawProgress : startX;
    const progY = isHorizontal ? startY : startY + (endY - startY) * drawProgress;
    const grad = ctx.createLinearGradient(startX, startY, endX, isHorizontal ? startY : endY);
    grad.addColorStop(0, theme.primaryColor);
    grad.addColorStop(1, theme.secondaryColor);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(progX, progY);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Draw nodes
  nodes.forEach((node, i) => {
    const t = lineLen > 0 ? i / lineLen : 0;
    const x = isHorizontal ? startX + (endX - startX) * t : startX;
    const y = isHorizontal ? startY : startY + (endY - startY) * t;
    const color = node.color ?? theme.chartColors[i % theme.chartColors.length];
    const isPassed = showProgress && t <= drawProgress;

    // Node glow ring
    if (isPassed) {
      ctx.strokeStyle = withAlpha(color, 0.3);
      ctx.lineWidth = 3;
      ctx.beginPath();
      if (nodeShape === 'circle') {
        ctx.arc(x, y, nodeR + 8, 0, Math.PI * 2);
      } else if (nodeShape === 'diamond') {
        const r2 = nodeR + 8;
        ctx.moveTo(x, y - r2);
        ctx.lineTo(x + r2, y);
        ctx.lineTo(x, y + r2);
        ctx.lineTo(x - r2, y);
        ctx.closePath();
      }
      ctx.stroke();
    }

    // Node
    ctx.fillStyle = isPassed ? color : withAlpha(theme.textColor, 0.15);
    if (nodeShape === 'circle') {
      ctx.beginPath();
      ctx.arc(x, y, nodeR, 0, Math.PI * 2);
      ctx.fill();
      // Inner highlight
      if (isPassed) {
        ctx.fillStyle = withAlpha('#ffffff', 0.3);
        ctx.beginPath();
        ctx.arc(x - nodeR * 0.25, y - nodeR * 0.25, nodeR * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (nodeShape === 'diamond') {
      ctx.beginPath();
      ctx.moveTo(x, y - nodeR);
      ctx.lineTo(x + nodeR, y);
      ctx.lineTo(x, y + nodeR);
      ctx.lineTo(x - nodeR, y);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillRect(x - nodeR, y - nodeR, nodeR * 2, nodeR * 2);
    }

    // Label with card background
    const labelText = node.label ?? '';
    const labelFontSize = theme.bodyFontSize * 0.85;
    ctx.font = `bold ${labelFontSize}px ${font}`;
    const labelY = isHorizontal ? y + nodeR + 28 : y;
    const labelX = isHorizontal ? x : x + nodeR + 24;
    ctx.textAlign = isHorizontal ? 'center' : 'left';

    // Card background for label
    const textWidth = ctx.measureText(labelText).width;
    const padX = 20;
    const padY = 10;
    const cardX = isHorizontal ? x - textWidth / 2 - padX : labelX - padX;
    const cardY = isHorizontal ? labelY - padY : labelY - labelFontSize / 2 - padY;
    const cardW = textWidth + padX * 2;
    const cardH = labelFontSize + padY * 2;
    ctx.fillStyle = withAlpha(color, isPassed ? 0.15 : 0.05);
    roundRectPath(ctx, cardX, cardY, cardW, cardH, 8);
    ctx.fill();

    ctx.fillStyle = isPassed ? theme.textColor : theme.textSecondaryColor;
    ctx.textBaseline = isHorizontal ? 'top' : 'middle';
    ctx.fillText(labelText, labelX, labelY);
    if (node.time) {
      ctx.font = `${labelFontSize * 0.8}px ${font}`;
      ctx.fillStyle = theme.textSecondaryColor;
      ctx.fillText(node.time, labelX, labelY + labelFontSize + 6);
    }
  });
}

// ============================================================
// Background
// ============================================================
export function drawBackground(
  dc: DrawContext,
  props: BackgroundProps,
  localTime: number,
  duration: number,
  theme: ThemeTokens,
): void {
  const { ctx, canvas } = dc;
  const type = props.type ?? 'solid';
  const animated = props.animated ?? false;

  if (type === 'solid') {
    ctx.fillStyle = props.color ?? theme.bgDarkColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (type === 'gradient') {
    const colors = props.gradientColors ?? [theme.bgDarkColor, theme.bgColor];
    const direction = props.gradientDirection ?? 'vertical';
    let grad: CanvasGradient;
    if (direction === 'radial') {
      grad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2);
    } else if (direction === 'horizontal') {
      grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
    } else if (direction === 'diagonal') {
      grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    } else {
      grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    }
    colors.forEach((c, i) => grad.addColorStop(i / Math.max(colors.length - 1, 1), c));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (type === 'grid') {
    ctx.fillStyle = props.color ?? theme.bgDarkColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = props.gridColor ?? withAlpha(theme.textColor, 0.08);
    ctx.lineWidth = 1;
    const spacing = props.gridSpacing ?? 60;
    const offset = animated ? (localTime * 20) % spacing : 0;
    for (let x = -offset; x < canvas.width; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = -offset; y < canvas.height; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  } else if (type === 'dots') {
    ctx.fillStyle = props.color ?? theme.bgDarkColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = props.gridColor ?? withAlpha(theme.textColor, 0.1);
    const spacing = props.gridSpacing ?? 50;
    const offset = animated ? (localTime * 15) % spacing : 0;
    for (let x = -offset; x < canvas.width; x += spacing) {
      for (let y = -offset; y < canvas.height; y += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (type === 'particles') {
    ctx.fillStyle = props.color ?? theme.bgDarkColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const count = props.particleCount ?? 50;
    const pColor = props.particleColor ?? withAlpha(theme.primaryColor, 0.4);
    const speed = props.particleSpeed ?? 1;
    ctx.fillStyle = pColor;
    for (let i = 0; i < count; i++) {
      const seed = i * 9973;
      const baseX = (seed * 1.1) % canvas.width;
      const baseY = (seed * 1.7) % canvas.height;
      const x = animated ? (baseX + localTime * speed * (20 + (seed % 30))) % canvas.width : baseX;
      const y = animated ? (baseY + Math.sin(localTime * speed + seed) * 20) % canvas.height : baseY;
      const r = 2 + (seed % 4);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ============================================================
// Segment dispatch
// ============================================================
export function drawSegment(
  dc: DrawContext,
  segment: Segment,
  localTime: number,
  theme: ThemeTokens,
): void {
  const { duration } = segment;
  switch (segment.type) {
    case 'text_card':
      drawTextCard(dc, segment.props as TextCardProps, localTime, duration, theme);
      break;
    case 'bar_chart':
      drawBarChart(dc, segment.props as BarChartProps, localTime, duration, theme);
      break;
    case 'keyword_highlight':
      drawKeywordHighlight(dc, segment.props as KeywordHighlightProps, localTime, duration, theme);
      break;
    case 'quote_card':
      drawQuoteCard(dc, segment.props as QuoteCardProps, localTime, duration, theme);
      break;
    case 'end_card':
      drawEndCard(dc, segment.props as EndCardProps, localTime, duration, theme);
      break;
    case 'pie_chart':
      drawPieChart(dc, segment.props as PieChartProps, localTime, duration, theme);
      break;
    case 'line_chart':
      drawLineChart(dc, segment.props as LineChartProps, localTime, duration, theme);
      break;
    case 'image_show':
      void drawImageShow(dc, segment.props as ImageShowProps, localTime, duration, theme);
      break;
    case 'process_flow':
      drawProcessFlow(dc, segment.props as ProcessFlowProps, localTime, duration, theme);
      break;
    case 'persona_card':
      drawPersonaCard(dc, segment.props as PersonaCardProps, localTime, duration, theme);
      break;
    case 'compare_card':
      drawCompareCard(dc, segment.props as CompareCardProps, localTime, duration, theme);
      break;
    case 'number_animation':
      drawNumberAnimation(dc, segment.props as NumberAnimationProps, localTime, duration, theme);
      break;
    case 'tag_cloud':
      drawTagCloud(dc, segment.props as TagCloudProps, localTime, duration, theme);
      break;
    case 'progress_timeline':
      drawProgressTimeline(dc, segment.props as ProgressTimelineProps, localTime, duration, theme);
      break;
    case 'background':
      drawBackground(dc, segment.props as BackgroundProps, localTime, duration, theme);
      break;
  }
}
