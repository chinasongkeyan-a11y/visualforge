/**
 * API Simplifier — transforms minimal API input into full Project objects.
 *
 * Simplified API accepts:
 *   { theme?: string, segments: SimplifiedSegment[] }
 *
 * Each segment only needs content fields (title, data, quote, etc.).
 * All styling, animation, layout, color, font fields are auto-filled
 * with optimized defaults derived from the selected theme.
 */

import type {
  Project,
  Segment,
  SegmentType,
  SegmentProps,
  TextCardProps,
  BarChartProps,
  PieChartProps,
  LineChartProps,
  KeywordHighlightProps,
  QuoteCardProps,
  ImageShowProps,
  ProcessFlowProps,
  PersonaCardProps,
  CompareCardProps,
  NumberAnimationProps,
  TagCloudProps,
  ProgressTimelineProps,
  EndCardProps,
  BackgroundProps,
  ThemeTokens,
} from './types';
import { getTheme } from './themes';

// ============================================================
// Simplified segment input types
// ============================================================

export interface SimplifiedSegment {
  type: SegmentType;
  start: number;
  duration?: number;
  // Content fields (type-specific)
  title?: string;
  subtitle?: string;
  text?: string;
  quote?: string;
  author?: string;
  imageUrl?: string;
  overlayText?: string;
  name?: string;
  description?: string;
  brandName?: string;
  slogan?: string;
  ctaText?: string;
  endValue?: number;
  startValue?: number;
  prefix?: string;
  suffix?: string;
  label?: string;
  unit?: string;
  centerText?: string;
  leftContent?: string;
  rightContent?: string;
  leftLabel?: string;
  rightLabel?: string;
  bgType?: string;
  data?: Array<{ label: string; value: number; color?: string }>;
  series?: Array<{ name: string; data: number[]; color?: string }>;
  steps?: Array<{ title: string; description: string }>;
  tags?: string[];
  nodes?: string[];
}

export interface SimplifiedRenderRequest {
  theme?: string;
  segments: SimplifiedSegment[];
}

// ============================================================
// Auto transition assignment
// ============================================================

function getAutoTransitionIn(type: SegmentType): Segment['transitionIn'] {
  const map: Record<SegmentType, Segment['transitionIn']> = {
    text_card: 'fadeIn',
    bar_chart: 'fadeIn',
    pie_chart: 'scaleIn',
    line_chart: 'fadeIn',
    keyword_highlight: 'scaleIn',
    quote_card: 'slideUp',
    image_show: 'fadeIn',
    process_flow: 'fadeIn',
    persona_card: 'fadeIn',
    compare_card: 'fadeIn',
    number_animation: 'fadeIn',
    tag_cloud: 'fadeIn',
    progress_timeline: 'fadeIn',
    end_card: 'scaleIn',
    background: 'none',
  };
  return map[type] ?? 'fadeIn';
}

function getAutoTransitionOut(type: SegmentType): Segment['transitionOut'] {
  if (type === 'end_card') return 'fadeOut';
  return 'none';
}

// ============================================================
// Per-type props builder with optimized defaults
// ============================================================

function buildTextCardProps(
  seg: SimplifiedSegment,
  t: ThemeTokens,
): TextCardProps {
  return {
    title: seg.title ?? '',
    subtitle: seg.subtitle ?? '',
    titleFontSize: 80,
    subtitleFontSize: 48,
    textColor: t.textColor,
    bgColor: t.bgColor,
    bgGradient: true,
    bgGradientColors: [t.bgDarkColor, t.cardBgDarkColor],
    textAlign: 'center',
    animation: 'fadeIn',
    emphasis: '',
    emphasisColor: t.primaryColor,
  };
}

function buildBarChartProps(
  seg: SimplifiedSegment,
  t: ThemeTokens,
): BarChartProps {
  return {
    title: seg.title ?? '',
    data: (seg.data ?? []).map((d, i) => ({
      label: d.label,
      value: d.value,
      color: d.color ?? t.chartColors[i % t.chartColors.length],
    })),
    maxValue: 0,
    unit: seg.unit ?? '',
    showValues: true,
    animation: 'grow',
    barWidth: 0.65,
    barGap: 30,
  };
}

function buildPieChartProps(
  seg: SimplifiedSegment,
  t: ThemeTokens,
): PieChartProps {
  return {
    title: seg.title ?? '',
    data: (seg.data ?? []).map((d, i) => ({
      label: d.label,
      value: d.value,
      color: d.color ?? t.chartColors[i % t.chartColors.length],
    })),
    showLabels: true,
    showPercent: true,
    showLegend: true,
    animation: 'expand',
    donutMode: true,
    centerText: seg.centerText ?? '',
  };
}

function buildLineChartProps(
  seg: SimplifiedSegment,
  t: ThemeTokens,
): LineChartProps {
  return {
    title: seg.title ?? '',
    series: (seg.series ?? []).map((s, i) => ({
      name: s.name,
      data: s.data,
      color: s.color ?? t.chartColors[i % t.chartColors.length],
    })),
    xLabels: [],
    yMax: 0,
    showDots: true,
    showGrid: true,
    animation: 'draw',
    fillArea: true,
  };
}

function buildKeywordHighlightProps(
  seg: SimplifiedSegment,
  t: ThemeTokens,
): KeywordHighlightProps {
  return {
    text: seg.text ?? '',
    fontSize: 130,
    textColor: '#ffffff',
    glowColor: t.primaryColor,
    glowRadius: 50,
    bgColor: t.bgDarkColor,
    animation: 'pulse',
    pulseScale: 1.15,
  };
}

function buildQuoteCardProps(
  seg: SimplifiedSegment,
  t: ThemeTokens,
): QuoteCardProps {
  return {
    quote: seg.quote ?? '',
    author: seg.author ?? '',
    quoteFontSize: 58,
    authorFontSize: 34,
    quoteColor: t.textColor,
    authorColor: t.textSecondaryColor,
    bgColor: t.bgColor,
    showQuoteMark: true,
    quoteMarkStyle: 'double',
    animation: 'fadeIn',
  };
}

function buildImageShowProps(
  seg: SimplifiedSegment,
  _t: ThemeTokens,
): ImageShowProps {
  return {
    imageUrl: seg.imageUrl ?? '',
    fit: 'cover',
    filter: 'none',
    overlayText: seg.overlayText ?? '',
    overlayPosition: 'center',
    animation: 'kenBurns',
    kenBurnsScale: 1.3,
    kenBurnsDirection: 'zoomIn',
    roundedCorners: 0,
  };
}

function buildProcessFlowProps(
  seg: SimplifiedSegment,
  _t: ThemeTokens,
): ProcessFlowProps {
  return {
    title: seg.title ?? '',
    steps: seg.steps ?? [],
    layout: 'vertical',
    showConnector: true,
    connectorStyle: 'arrow',
    animation: 'sequential',
    stepDelay: 0.4,
    iconType: 'number',
  };
}

function buildPersonaCardProps(
  seg: SimplifiedSegment,
  t: ThemeTokens,
): PersonaCardProps {
  return {
    name: seg.name ?? '',
    title: seg.title ?? '',
    description: seg.description ?? '',
    avatarUrl: '',
    avatarShape: 'circle',
    bgColor: t.bgColor,
    animation: 'slideLeft',
    showBorder: true,
    borderColor: t.primaryColor,
  };
}

function buildCompareCardProps(
  seg: SimplifiedSegment,
  t: ThemeTokens,
): CompareCardProps {
  return {
    title: seg.title ?? '',
    leftLabel: seg.leftLabel ?? 'Before',
    rightLabel: seg.rightLabel ?? 'After',
    leftContent: seg.leftContent ?? '',
    rightContent: seg.rightContent ?? '',
    leftColor: t.textSecondaryColor,
    rightColor: t.primaryColor,
    layout: 'sideBySide',
    animation: 'expand',
    dividerStyle: 'VS',
  };
}

function buildNumberAnimationProps(
  seg: SimplifiedSegment,
  t: ThemeTokens,
): NumberAnimationProps {
  return {
    startValue: seg.startValue ?? 0,
    endValue: seg.endValue ?? 100,
    prefix: seg.prefix ?? '',
    suffix: seg.suffix ?? '',
    decimals: 0,
    fontSize: 170,
    textColor: t.primaryColor,
    bgColor: t.bgDarkColor,
    label: seg.label ?? '',
    easing: 'easeOut',
  };
}

function buildTagCloudProps(
  seg: SimplifiedSegment,
  t: ThemeTokens,
): TagCloudProps {
  return {
    tags: (seg.tags ?? []).map((text) => ({ text })),
    bgColor: t.bgColor,
    layout: 'grid',
    animation: 'fadeInSequential',
    staggerDelay: 0.12,
    minFontSize: 32,
    maxFontSize: 64,
  };
}

function buildProgressTimelineProps(
  seg: SimplifiedSegment,
  _t: ThemeTokens,
): ProgressTimelineProps {
  return {
    title: seg.title ?? '',
    nodes: (seg.nodes ?? []).map((label) => ({ label })),
    layout: 'horizontal',
    lineStyle: 'gradient',
    nodeShape: 'circle',
    animation: 'draw',
    showProgress: true,
  };
}

function buildEndCardProps(
  seg: SimplifiedSegment,
  t: ThemeTokens,
): EndCardProps {
  return {
    brandName: seg.brandName ?? '',
    slogan: seg.slogan ?? '',
    ctaText: seg.ctaText ?? '',
    ctaUrl: '',
    bgColor: t.bgDarkColor,
    animation: 'fadeIn',
    fadeOut: true,
  };
}

function buildBackgroundProps(
  seg: SimplifiedSegment,
  t: ThemeTokens,
): BackgroundProps {
  return {
    type: (seg.bgType as BackgroundProps['type']) ?? 'gradient',
    color: t.bgDarkColor,
    gradientColors: [t.bgDarkColor, t.cardBgDarkColor],
    gradientDirection: 'diagonal',
    particleCount: 50,
    particleColor: t.primaryColor,
    particleSpeed: 1,
    gridColor: t.textSecondaryColor,
    gridSpacing: 60,
    animated: true,
  };
}

// ============================================================
// Props builder dispatcher
// ============================================================

function buildProps(
  seg: SimplifiedSegment,
  t: ThemeTokens,
): SegmentProps {
  switch (seg.type) {
    case 'text_card': return buildTextCardProps(seg, t);
    case 'bar_chart': return buildBarChartProps(seg, t);
    case 'pie_chart': return buildPieChartProps(seg, t);
    case 'line_chart': return buildLineChartProps(seg, t);
    case 'keyword_highlight': return buildKeywordHighlightProps(seg, t);
    case 'quote_card': return buildQuoteCardProps(seg, t);
    case 'image_show': return buildImageShowProps(seg, t);
    case 'process_flow': return buildProcessFlowProps(seg, t);
    case 'persona_card': return buildPersonaCardProps(seg, t);
    case 'compare_card': return buildCompareCardProps(seg, t);
    case 'number_animation': return buildNumberAnimationProps(seg, t);
    case 'tag_cloud': return buildTagCloudProps(seg, t);
    case 'progress_timeline': return buildProgressTimelineProps(seg, t);
    case 'end_card': return buildEndCardProps(seg, t);
    case 'background': return buildBackgroundProps(seg, t);
    default:
      throw new Error(`Unknown segment type: ${seg.type satisfies never}`);
  }
}

// ============================================================
// Main transformer: SimplifiedRenderRequest -> Project
// ============================================================

let segmentIdCounter = 0;
function genSegmentId(): string {
  segmentIdCounter++;
  return `seg_${Date.now()}_${segmentIdCounter}`;
}

export function simplifiedToProject(req: SimplifiedRenderRequest): Project {
  const themeId = req.theme ?? 'onyx';
  const theme = getTheme(themeId);
  const tokens = theme.tokens;

  const now = new Date().toISOString();
  const segments: Segment[] = req.segments.map((s) => {
    const track = s.type === 'background' ? 0 : 1;
    const duration = s.duration ?? 3;
    return {
      id: genSegmentId(),
      type: s.type,
      track,
      start: s.start,
      duration,
      props: buildProps(s, tokens),
      transitionIn: getAutoTransitionIn(s.type),
      transitionOut: getAutoTransitionOut(s.type),
    };
  });

  return {
    id: `proj_${Date.now()}`,
    name: `API Render ${new Date().toLocaleString()}`,
    createdAt: now,
    updatedAt: now,
    canvas: { width: 720, height: 1280, fps: 24 },
    theme: 'onyx',
    timeline: segments,
  };
}
