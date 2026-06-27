// ============================================================
// Segment Renderers - All 15 segment types
// ============================================================
import type { RenderCtx, DrawContext, CanvasInfo, CanvasImageLike } from './context';
import type {
  TextCardProps,
  BarChartProps,
  KeywordHighlightProps,
  QuoteCardProps,
  PieChartProps,
  LineChartProps,
  ProcessFlowProps,
  CompareCardProps,
  NumberAnimationProps,
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

  const iconType = props.iconType ?? 'number';
  const stepDelay = props.stepDelay ?? 0.3;
  const stepCount = steps.length;

  // Background
  ctx.fillStyle = theme.cardBgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Title
  const titleY = canvas.height * 0.07;
  if (props.title) {
    ctx.font = `bold ${theme.titleFontSize * 0.75}px ${font}`;
    ctx.fillStyle = theme.textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = theme.primaryColor;
    ctx.shadowBlur = 20 * progress;
    ctx.fillText(props.title, canvas.width / 2, titleY);
    ctx.shadowBlur = 0;
  }

  // Layout: vertical, cards on the left, connector line on the left edge
  const contentTop = canvas.height * 0.14;
  const contentBottom = canvas.height * 0.92;
  const totalH = contentBottom - contentTop;
  const stepSpacing = totalH / Math.max(stepCount, 1);
  const lineX = canvas.width * 0.22;

  // Draw connector line (gradient, animated draw)
  const lineProgress = clamp01(progress / 0.6);
  const lineEndY = contentTop + (totalH * 0.85) * lineProgress;
  const grad = ctx.createLinearGradient(0, contentTop, 0, contentBottom);
  grad.addColorStop(0, theme.primaryColor);
  grad.addColorStop(0.5, theme.chartColors[2] ?? theme.primaryColor);
  grad.addColorStop(1, theme.chartColors[1] ?? theme.primaryColor);
  ctx.strokeStyle = grad;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(lineX, contentTop);
  ctx.lineTo(lineX, lineEndY);
  ctx.stroke();

  // Draw a soft glow behind the line
  ctx.shadowColor = theme.primaryColor;
  ctx.shadowBlur = 15;
  ctx.strokeStyle = withAlpha(theme.primaryColor, 0.3);
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(lineX, contentTop);
  ctx.lineTo(lineX, lineEndY);
  ctx.stroke();
  ctx.shadowBlur = 0;

  steps.forEach((step, i) => {
    let stepProgress: number;
    if (props.animation === 'fadeInAll') {
      stepProgress = progress;
    } else {
      const stepStart = i * stepDelay;
      stepProgress = clamp01((localTime - stepStart) / (duration * ANIMATION_PHASE - stepStart));
    }
    if (stepProgress <= 0) return;

    const y = contentTop + stepSpacing * i + stepSpacing * 0.5;

    ctx.save();
    ctx.globalAlpha *= stepProgress;

    // Slide-in from left
    const slideX = (1 - EASINGS.easeOut(stepProgress)) * 40;
    ctx.translate(-slideX, 0);

    // Node circle on the connector line
    const nodeR = 32;
    const colorIdx = i % (theme.chartColors.length || 1);
    const nodeColor = theme.chartColors[colorIdx] ?? theme.primaryColor;

    // Glow ring
    ctx.shadowColor = nodeColor;
    ctx.shadowBlur = 20;
    ctx.strokeStyle = withAlpha(nodeColor, 0.4);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(lineX, y, nodeR + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Filled node
    ctx.fillStyle = nodeColor;
    ctx.beginPath();
    ctx.arc(lineX, y, nodeR, 0, Math.PI * 2);
    ctx.fill();

    // Node icon
    if (iconType === 'number') {
      ctx.font = `bold ${theme.bodyFontSize * 0.9}px ${font}`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), lineX, y);
    } else if (iconType === 'dot') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(lineX, y, 10, 0, Math.PI * 2);
      ctx.fill();
    } else if (iconType === 'check') {
      ctx.font = `bold ${theme.bodyFontSize * 0.9}px ${font}`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String.fromCharCode(0x2713), lineX, y);
    }

    // Card to the right of the node
    const cardX = lineX + nodeR + 30;
    const cardW = canvas.width - cardX - 40;
    const cardH = stepSpacing * 0.75;
    const cardY = y - cardH / 2;

    // Card background
    ctx.fillStyle = withAlpha(theme.cardBgColor, 0.9);
    roundRectPath(ctx, cardX, cardY, cardW, cardH, 12);
    ctx.fill();

    // Card left accent bar
    ctx.fillStyle = nodeColor;
    roundRectPath(ctx, cardX, cardY, 5, cardH, 2.5);
    ctx.fill();

    // Card border
    ctx.strokeStyle = withAlpha(nodeColor, 0.3);
    ctx.lineWidth = 1.5;
    roundRectPath(ctx, cardX, cardY, cardW, cardH, 12);
    ctx.stroke();

    // Step title
    ctx.font = `bold ${theme.subtitleFontSize * 0.75}px ${font}`;
    ctx.fillStyle = theme.textColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(step.title ?? '', cardX + 24, cardY + cardH * 0.32);

    // Step description
    if (step.description) {
      ctx.font = `${theme.bodyFontSize * 0.6}px ${font}`;
      ctx.fillStyle = theme.textSecondaryColor;
      const descLines = wrapText(ctx, step.description, cardW - 50);
      descLines.slice(0, 2).forEach((line, li) => {
        ctx.fillText(line, cardX + 24, cardY + cardH * 0.65 + li * (theme.bodyFontSize * 0.7));
      });
    }

    ctx.restore();
  });

  // Animated particle traveling down the line
  if (progress < 0.95) {
    const particleY = contentTop + (totalH * 0.85) * clamp01(progress / 0.7);
    ctx.fillStyle = theme.primaryColor;
    ctx.shadowColor = theme.primaryColor;
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.arc(lineX, particleY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
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
  const isSideBySide = props.layout !== 'topBottom';

  // Background
  ctx.fillStyle = theme.cardBgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.globalAlpha *= progress;

  // Title with glow
  const titleY = canvas.height * 0.07;
  if (props.title) {
    ctx.font = `bold ${theme.titleFontSize * 0.75}px ${font}`;
    ctx.fillStyle = theme.textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = theme.primaryColor;
    ctx.shadowBlur = 20 * progress;
    ctx.fillText(props.title, canvas.width / 2, titleY);
    ctx.shadowBlur = 0;
  }

  const leftColor = props.leftColor ?? theme.chartColors[0] ?? theme.primaryColor;
  const rightColor = props.rightColor ?? theme.accentColor;
  const contentTop = canvas.height * 0.14;
  const contentBottom = canvas.height * 0.94;
  const contentH = contentBottom - contentTop;
  const padding = 20;

  // Left panel slide-in from left, right panel from right
  const slideOffset = (1 - EASINGS.easeOut(progress)) * canvas.width * 0.15;

  if (isSideBySide) {
    const panelW = (canvas.width - padding * 3) / 2;

    // ---- Left panel ----
    const lx = padding - slideOffset;
    const ly = contentTop;
    ctx.save();
    ctx.globalAlpha *= clamp01(progress * 2);

    // Card background with gradient
    const leftGrad = ctx.createLinearGradient(lx, ly, lx, ly + contentH);
    leftGrad.addColorStop(0, withAlpha(leftColor, 0.15));
    leftGrad.addColorStop(1, withAlpha(leftColor, 0.03));
    ctx.fillStyle = leftGrad;
    roundRectPath(ctx, lx, ly, panelW, contentH, 16);
    ctx.fill();

    // Glow border
    ctx.shadowColor = leftColor;
    ctx.shadowBlur = 15;
    ctx.strokeStyle = withAlpha(leftColor, 0.5);
    ctx.lineWidth = 2;
    roundRectPath(ctx, lx, ly, panelW, contentH, 16);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Left label badge
    const labelY = ly + 50;
    ctx.fillStyle = leftColor;
    ctx.font = `bold ${theme.subtitleFontSize * 0.7}px ${font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(props.leftLabel ?? '', lx + panelW / 2, labelY);

    // Left content
    ctx.font = `${theme.bodyFontSize * 0.65}px ${font}`;
    ctx.fillStyle = theme.textColor;
    const leftLines = wrapText(ctx, props.leftContent ?? '', panelW * 0.85);
    const leftStartY = labelY + 50;
    leftLines.slice(0, 6).forEach((line, i) => {
      ctx.fillText(line, lx + panelW / 2, leftStartY + i * (theme.bodyFontSize * 0.85));
    });
    ctx.restore();

    // ---- Right panel ----
    const rx = canvas.width - padding - panelW + slideOffset;
    ctx.save();
    ctx.globalAlpha *= clamp01(progress * 2 - 0.5);

    const rightGrad = ctx.createLinearGradient(rx, contentTop, rx, contentBottom);
    rightGrad.addColorStop(0, withAlpha(rightColor, 0.15));
    rightGrad.addColorStop(1, withAlpha(rightColor, 0.03));
    ctx.fillStyle = rightGrad;
    roundRectPath(ctx, rx, contentTop, panelW, contentH, 16);
    ctx.fill();

    ctx.shadowColor = rightColor;
    ctx.shadowBlur = 15;
    ctx.strokeStyle = withAlpha(rightColor, 0.5);
    ctx.lineWidth = 2;
    roundRectPath(ctx, rx, contentTop, panelW, contentH, 16);
    ctx.stroke();
    ctx.shadowBlur = 0;

    const rLabelY = contentTop + 50;
    ctx.fillStyle = rightColor;
    ctx.font = `bold ${theme.subtitleFontSize * 0.7}px ${font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(props.rightLabel ?? '', rx + panelW / 2, rLabelY);

    ctx.font = `${theme.bodyFontSize * 0.65}px ${font}`;
    ctx.fillStyle = theme.textColor;
    const rightLines = wrapText(ctx, props.rightContent ?? '', panelW * 0.85);
    const rightStartY = rLabelY + 50;
    rightLines.slice(0, 6).forEach((line, i) => {
      ctx.fillText(line, rx + panelW / 2, rightStartY + i * (theme.bodyFontSize * 0.85));
    });
    ctx.restore();

    // ---- VS badge in center ----
    const vsScale = EASINGS.easeOutBack(clamp01(progress * 1.5));
    if (vsScale > 0.01) {
      const vsX = canvas.width / 2;
      const vsY = (contentTop + contentBottom) / 2;
      const vsR = 36 * vsScale;

      ctx.save();
      ctx.translate(vsX, vsY);

      // Glow
      ctx.shadowColor = theme.primaryColor;
      ctx.shadowBlur = 30;

      // Outer ring
      ctx.strokeStyle = theme.primaryColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, vsR, 0, Math.PI * 2);
      ctx.stroke();

      // Inner fill
      ctx.fillStyle = theme.cardBgColor;
      ctx.beginPath();
      ctx.arc(0, 0, vsR - 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // VS text
      ctx.font = `bold ${theme.subtitleFontSize * 0.7 * vsScale}px ${font}`;
      ctx.fillStyle = theme.primaryColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('VS', 0, 0);
      ctx.restore();
    }
  } else {
    // Top-bottom layout
    const panelH = (contentH - padding) / 2;

    // Top panel (left content)
    const topSlide = (1 - EASINGS.easeOut(progress)) * 60;
    ctx.save();
    ctx.globalAlpha *= clamp01(progress * 2);
    const tGrad = ctx.createLinearGradient(padding, contentTop, canvas.width - padding, contentTop + panelH);
    tGrad.addColorStop(0, withAlpha(leftColor, 0.15));
    tGrad.addColorStop(1, withAlpha(leftColor, 0.03));
    ctx.fillStyle = tGrad;
    roundRectPath(ctx, padding, contentTop - topSlide, canvas.width - padding * 2, panelH, 16);
    ctx.fill();
    ctx.shadowColor = leftColor;
    ctx.shadowBlur = 15;
    ctx.strokeStyle = withAlpha(leftColor, 0.5);
    ctx.lineWidth = 2;
    roundRectPath(ctx, padding, contentTop - topSlide, canvas.width - padding * 2, panelH, 16);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = leftColor;
    ctx.font = `bold ${theme.subtitleFontSize * 0.7}px ${font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(props.leftLabel ?? '', canvas.width / 2, contentTop + 45 - topSlide);
    ctx.font = `${theme.bodyFontSize * 0.65}px ${font}`;
    ctx.fillStyle = theme.textColor;
    const topLines = wrapText(ctx, props.leftContent ?? '', canvas.width * 0.8);
    topLines.slice(0, 3).forEach((line, i) => {
      ctx.fillText(line, canvas.width / 2, contentTop + 95 - topSlide + i * (theme.bodyFontSize * 0.85));
    });
    ctx.restore();

    // Bottom panel (right content)
    ctx.save();
    ctx.globalAlpha *= clamp01(progress * 2 - 0.5);
    const bY = contentTop + panelH + padding;
    const bSlide = (1 - EASINGS.easeOut(progress)) * 60;
    const bGrad = ctx.createLinearGradient(padding, bY, canvas.width - padding, bY + panelH);
    bGrad.addColorStop(0, withAlpha(rightColor, 0.15));
    bGrad.addColorStop(1, withAlpha(rightColor, 0.03));
    ctx.fillStyle = bGrad;
    roundRectPath(ctx, padding, bY + bSlide, canvas.width - padding * 2, panelH, 16);
    ctx.fill();
    ctx.shadowColor = rightColor;
    ctx.shadowBlur = 15;
    ctx.strokeStyle = withAlpha(rightColor, 0.5);
    ctx.lineWidth = 2;
    roundRectPath(ctx, padding, bY + bSlide, canvas.width - padding * 2, panelH, 16);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = rightColor;
    ctx.font = `bold ${theme.subtitleFontSize * 0.7}px ${font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(props.rightLabel ?? '', canvas.width / 2, bY + 45 + bSlide);
    ctx.font = `${theme.bodyFontSize * 0.65}px ${font}`;
    ctx.fillStyle = theme.textColor;
    const botLines = wrapText(ctx, props.rightContent ?? '', canvas.width * 0.8);
    botLines.slice(0, 3).forEach((line, i) => {
      ctx.fillText(line, canvas.width / 2, bY + 95 + bSlide + i * (theme.bodyFontSize * 0.85));
    });
    ctx.restore();

    // VS badge
    const vsScale = EASINGS.easeOutBack(clamp01(progress * 1.5));
    if (vsScale > 0.01) {
      const vsY = contentTop + panelH + padding / 2;
      const vsR = 28 * vsScale;
      ctx.save();
      ctx.translate(canvas.width / 2, vsY);
      ctx.shadowColor = theme.primaryColor;
      ctx.shadowBlur = 25;
      ctx.strokeStyle = theme.primaryColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, vsR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = theme.cardBgColor;
      ctx.beginPath();
      ctx.arc(0, 0, vsR - 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.font = `bold ${theme.subtitleFontSize * 0.55 * vsScale}px ${font}`;
      ctx.fillStyle = theme.primaryColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('VS', 0, 0);
      ctx.restore();
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
    case 'pie_chart':
      drawPieChart(dc, segment.props as PieChartProps, localTime, duration, theme);
      break;
    case 'line_chart':
      drawLineChart(dc, segment.props as LineChartProps, localTime, duration, theme);
      break;
    case 'process_flow':
      drawProcessFlow(dc, segment.props as ProcessFlowProps, localTime, duration, theme);
      break;
    case 'compare_card':
      drawCompareCard(dc, segment.props as CompareCardProps, localTime, duration, theme);
      break;
    case 'number_animation':
      drawNumberAnimation(dc, segment.props as NumberAnimationProps, localTime, duration, theme);
      break;
    case 'progress_timeline':
      drawProgressTimeline(dc, segment.props as ProgressTimelineProps, localTime, duration, theme);
      break;
    case 'background':
      drawBackground(dc, segment.props as BackgroundProps, localTime, duration, theme);
      break;
  }
}
