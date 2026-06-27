// ============================================================
// Segment Renderers - All 5 P0 segment types
// ============================================================
import type { RenderCtx, DrawContext, CanvasInfo } from './context';
import type {
  TextCardProps,
  BarChartProps,
  KeywordHighlightProps,
  QuoteCardProps,
  EndCardProps,
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

  // Draw bars
  props.data.forEach((item, i) => {
    const slotStart = padding.left + i * (barSlotWidth + barGap);
    const barX = slotStart + (barSlotWidth - barW) / 2;
    const fullBarHeight = (item.value / maxValue) * (baseY - chartTop);

    let barHeight: number;
    let barOffsetX = 0;

    if (props.animation === 'grow') {
      barHeight = fullBarHeight * EASINGS.easeOut(progress);
    } else {
      // slideIn
      barHeight = fullBarHeight;
      barOffsetX = (1 - EASINGS.easeOut(progress)) * -chartWidth * 0.3;
    }

    const barY = baseY - barHeight;

    // Bar with rounded top
    ctx.fillStyle = item.color;
    roundRectPath(ctx, barX + barOffsetX, barY, barW, barHeight, 8);
    ctx.fill();

    // Value on top
    if (props.showValues && progress > 0.5) {
      const valueAlpha = clamp01((progress - 0.5) * 2);
      ctx.globalAlpha *= valueAlpha;
      ctx.font = `bold ${theme.bodyFontSize}px ${font}`;
      ctx.fillStyle = theme.textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      const valueText = `${item.value}${props.unit}`;
      ctx.fillText(valueText, barX + barW / 2 + barOffsetX, barY - 10);
      ctx.globalAlpha /= valueAlpha;
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
    const scale = 0.85 + 0.15 * EASINGS.easeOut(progress);
    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);
    ctx.translate(-centerX, -centerY);
  } else {
    ctx.globalAlpha *= progress;
  }

  // Brand name
  ctx.font = `bold ${theme.titleFontSize}px ${font}`;
  ctx.fillStyle = theme.primaryColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(props.brandName, centerX, centerY - 80);

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

    // Button background
    ctx.fillStyle = theme.primaryColor;
    roundRectPath(ctx, btnX, btnY, btnWidth, btnHeight, theme.borderRadius);
    ctx.fill();

    // Button text
    ctx.fillStyle = '#ffffff';
    ctx.fillText(props.ctaText, centerX, btnY + btnHeight / 2);
  }

  ctx.restore();
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
  switch (segment.type) {
    case 'text_card':
      drawTextCard(dc, segment.props as TextCardProps, localTime, segment.duration, theme);
      break;
    case 'bar_chart':
      drawBarChart(dc, segment.props as BarChartProps, localTime, segment.duration, theme);
      break;
    case 'keyword_highlight':
      drawKeywordHighlight(dc, segment.props as KeywordHighlightProps, localTime, segment.duration, theme);
      break;
    case 'quote_card':
      drawQuoteCard(dc, segment.props as QuoteCardProps, localTime, segment.duration, theme);
      break;
    case 'end_card':
      drawEndCard(dc, segment.props as EndCardProps, localTime, segment.duration, theme);
      break;
  }
}
