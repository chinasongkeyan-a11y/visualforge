// ============================================================
// VisualForge - Core Type Definitions
// ============================================================

/** All segment types */
export type SegmentType =
  | 'text_card'
  | 'bar_chart'
  | 'pie_chart'
  | 'line_chart'
  | 'keyword_highlight'
  | 'quote_card'
  | 'image_show'
  | 'process_flow'
  | 'persona_card'
  | 'compare_card'
  | 'number_animation'
  | 'tag_cloud'
  | 'progress_timeline'
  | 'end_card'
  | 'background';

/** Transition types for segment in/out */
export type TransitionType = 'fadeIn' | 'slideUp' | 'scaleIn' | 'fadeOut' | 'slideOut' | 'scaleOut' | 'none';

/** Canvas size preset */
export type CanvasPreset = 'vertical' | 'horizontal' | 'square';

/** Animation easing functions */
export type EasingType = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'bounce' | 'elastic';

/** Canvas configuration */
export interface CanvasConfig {
  width: number;  // 1080 | 1920 | 1080
  height: number; // 1920 | 1080 | 1080
  fps: number;    // 24 (MVP fixed)
}

/** A single segment on the timeline */
export interface Segment {
  id: string;
  type: SegmentType;
  track: number;       // 0=background, 1=content, 2=foreground
  start: number;       // start time in seconds
  duration: number;    // duration in seconds
  props: SegmentProps;
  transitionIn: TransitionType;
  transitionOut: TransitionType;
}

/** Union of all segment property types */
export type SegmentProps =
  | TextCardProps
  | BarChartProps
  | PieChartProps
  | LineChartProps
  | KeywordHighlightProps
  | QuoteCardProps
  | ImageShowProps
  | ProcessFlowProps
  | PersonaCardProps
  | CompareCardProps
  | NumberAnimationProps
  | TagCloudProps
  | ProgressTimelineProps
  | EndCardProps
  | BackgroundProps;

// ---- TextCard ----
export interface TextCardProps {
  title: string;
  subtitle: string;
  titleFontSize: number;
  subtitleFontSize: number;
  textColor: string;
  bgColor: string;
  bgGradient: boolean;
  bgGradientColors: string[];
  textAlign: 'left' | 'center' | 'right';
  animation: 'fadeIn' | 'slideUp' | 'scaleIn' | 'typewriter';
  emphasis: string;
  emphasisColor: string;
}

// ---- BarChart ----
export interface BarChartProps {
  title: string;
  data: { label: string; value: number; color: string }[];
  maxValue: number;
  unit: string;
  showValues: boolean;
  animation: 'grow' | 'slideIn';
  barWidth: number;  // 0-1 ratio
  barGap: number;
}

// ---- KeywordHighlight ----
export interface KeywordHighlightProps {
  text: string;
  fontSize: number;
  textColor: string;
  glowColor: string;
  glowRadius: number;
  bgColor: string;
  animation: 'pulse' | 'glow' | 'scaleIn';
  pulseScale: number;
}

// ---- QuoteCard ----
export interface QuoteCardProps {
  quote: string;
  author: string;
  quoteFontSize: number;
  authorFontSize: number;
  quoteColor: string;
  authorColor: string;
  bgColor: string;
  showQuoteMark: boolean;
  quoteMarkStyle: 'double' | 'single' | 'block';
  animation: 'fadeIn' | 'slideUp' | 'scaleIn';
}

// ---- EndCard ----
export interface EndCardProps {
  brandName: string;
  slogan: string;
  ctaText: string;
  ctaUrl: string;
  bgColor: string;
  animation: 'fadeIn' | 'scaleIn' | 'slideUp';
  fadeOut: boolean;
}

// ---- PieChart ----
export interface PieChartProps {
  title: string;
  data: { label: string; value: number; color: string }[];
  showLabels: boolean;
  showPercent: boolean;
  showLegend: boolean;
  animation: 'expand' | 'fadeIn';
  donutMode: boolean;
  centerText: string;
}

// ---- LineChart ----
export interface LineChartProps {
  title: string;
  series: { name: string; data: number[]; color: string }[];
  xLabels: string[];
  yMax: number;
  showDots: boolean;
  showGrid: boolean;
  animation: 'draw' | 'fadeIn';
  fillArea: boolean;
}

// ---- ImageShow ----
export interface ImageShowProps {
  imageUrl: string;
  fit: 'cover' | 'contain' | 'fill';
  filter: 'none' | 'grayscale' | 'sepia' | 'blur' | 'darken';
  overlayText: string;
  overlayPosition: 'top' | 'center' | 'bottom';
  animation: 'kenBurns' | 'fadeIn' | 'slideIn';
  kenBurnsScale: number;
  kenBurnsDirection: 'zoomIn' | 'zoomOut' | 'panLeft' | 'panRight' | 'panUp' | 'panDown';
  roundedCorners: number;
}

// ---- ProcessFlow ----
export interface ProcessFlowProps {
  title: string;
  steps: { title: string; description: string }[];
  layout: 'vertical' | 'horizontal';
  showConnector: boolean;
  connectorStyle: 'line' | 'arrow' | 'dashed';
  animation: 'sequential' | 'fadeInAll';
  stepDelay: number;
  iconType: 'number' | 'dot' | 'check';
}

// ---- PersonaCard ----
export interface PersonaCardProps {
  name: string;
  title: string;
  description: string;
  avatarUrl: string;
  avatarShape: 'circle' | 'square' | 'rounded';
  bgColor: string;
  animation: 'slideLeft' | 'slideRight' | 'fadeIn' | 'scaleIn';
  showBorder: boolean;
  borderColor: string;
}

// ---- CompareCard ----
export interface CompareCardProps {
  title: string;
  leftLabel: string;
  rightLabel: string;
  leftContent: string;
  rightContent: string;
  leftColor: string;
  rightColor: string;
  layout: 'sideBySide' | 'topBottom';
  animation: 'slideLeft' | 'expand' | 'fadeIn';
  dividerStyle: 'line' | 'VS' | 'none';
}

// ---- NumberAnimation ----
export interface NumberAnimationProps {
  startValue: number;
  endValue: number;
  prefix: string;
  suffix: string;
  decimals: number;
  fontSize: number;
  textColor: string;
  bgColor: string;
  label: string;
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'bounce';
}

// ---- TagCloud ----
export interface TagCloudProps {
  tags: { text: string; color?: string; size?: number }[];
  bgColor: string;
  layout: 'random' | 'grid' | 'spiral';
  animation: 'fadeInSequential' | 'fadeInAll' | 'floatIn';
  staggerDelay: number;
  minFontSize: number;
  maxFontSize: number;
}

// ---- ProgressTimeline ----
export interface ProgressTimelineProps {
  title: string;
  nodes: { label: string; time?: string; color?: string }[];
  layout: 'horizontal' | 'vertical';
  lineStyle: 'solid' | 'dashed' | 'gradient';
  nodeShape: 'circle' | 'diamond' | 'square';
  animation: 'draw' | 'fadeIn';
  showProgress: boolean;
}

// ---- Background ----
export interface BackgroundProps {
  type: 'solid' | 'gradient' | 'particles' | 'grid' | 'dots';
  color: string;
  gradientColors: string[];
  gradientDirection: 'vertical' | 'horizontal' | 'radial' | 'diagonal';
  particleCount: number;
  particleColor: string;
  particleSpeed: number;
  gridColor: string;
  gridSpacing: number;
  animated: boolean;
}

/** Theme tokens - used by all segment renderers */
export interface ThemeTokens {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  bgColor: string;
  bgDarkColor: string;
  textColor: string;
  textSecondaryColor: string;
  cardBgColor: string;
  cardBgDarkColor: string;
  chartColors: string[];
  fontFamily: string;
  titleFontSize: number;
  subtitleFontSize: number;
  bodyFontSize: number;
  borderRadius: number;
  shadow: string;
}

export interface Theme {
  id: string;
  name: string;
  tokens: ThemeTokens;
}

/** Project data model */
export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  canvas: CanvasConfig;
  theme: string;
  timeline: Segment[];
}

/** Render task status */
export interface RenderTask {
  id: string;
  projectId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;    // 0-1
  currentFrame: number;
  totalFrames: number;
  videoUrl: string | null;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
}

// ---- API Request/Response types ----
export interface RenderRequest {
  project: Project;
}

export interface RenderResponse {
  success: boolean;
  renderId: string;
  status: string;
  estimatedTime: number;
}

export interface RenderStatusResponse {
  renderId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentFrame: number;
  totalFrames: number;
  videoUrl: string | null;
  error: string | null;
}

export interface PreviewFrameRequest {
  project: Project;
  time: number;
}

export interface PreviewFrameResponse {
  frame: string; // data:image/png;base64,...
}

export interface SegmentTypeSchema {
  id: SegmentType;
  name: string;
  icon: string;
  props: SegmentPropSchema[];
  defaults: Record<string, unknown>;
}

export interface SegmentPropSchema {
  key: string;
  label: string;
  type: 'string' | 'number' | 'color' | 'boolean' | 'enum' | 'data' | 'colorArray';
  required?: boolean;
  options?: string[];
  default?: unknown;
  min?: number;
  max?: number;
  step?: number;
}

export interface ThemeListResponse {
  themes: { id: string; name: string }[];
}

export interface SegmentTypesResponse {
  segmentTypes: SegmentTypeSchema[];
}

/** Canvas preset definitions */
export const CANVAS_PRESETS: Record<CanvasPreset, CanvasConfig> = {
  vertical: { width: 1080, height: 1920, fps: 24 },
  horizontal: { width: 1920, height: 1080, fps: 24 },
  square: { width: 1080, height: 1080, fps: 24 },
};

/** Max video duration in seconds (10s = 240 frames @ 24fps) */
export const MAX_DURATION = 10;
