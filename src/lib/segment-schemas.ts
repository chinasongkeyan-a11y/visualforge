import type { SegmentTypeSchema, SegmentType, SegmentProps } from './types';

/** Schema definitions for all P0 segment types */
export const SEGMENT_TYPE_SCHEMAS: SegmentTypeSchema[] = [
  {
    id: 'text_card',
    name: '文字卡片',
    icon: 'type',
    defaults: {
      title: '标题文字',
      subtitle: '',
      titleFontSize: 64,
      subtitleFontSize: 36,
      textColor: '#1d1d1f',
      bgColor: '#ffffff',
      bgGradient: false,
      bgGradientColors: ['#1a1a2e', '#16213e'],
      textAlign: 'center',
      animation: 'fadeIn',
      emphasis: '',
      emphasisColor: '#0071e3',
    },
    props: [
      { key: 'title', label: '主标题', type: 'string', required: true },
      { key: 'subtitle', label: '副标题', type: 'string' },
      { key: 'titleFontSize', label: '主标题字号', type: 'number', default: 64, min: 20, max: 120, step: 2 },
      { key: 'subtitleFontSize', label: '副标题字号', type: 'number', default: 36, min: 16, max: 80, step: 2 },
      { key: 'textColor', label: '文字颜色', type: 'color', default: '#1d1d1f' },
      { key: 'bgColor', label: '背景颜色', type: 'color', default: '#ffffff' },
      { key: 'bgGradient', label: '渐变背景', type: 'boolean', default: false },
      { key: 'bgGradientColors', label: '渐变色组', type: 'colorArray' },
      { key: 'textAlign', label: '对齐方式', type: 'enum', options: ['left', 'center', 'right'], default: 'center' },
      { key: 'animation', label: '动画方式', type: 'enum', options: ['fadeIn', 'slideUp', 'scaleIn', 'typewriter'], default: 'fadeIn' },
      { key: 'emphasis', label: '高亮文字', type: 'string' },
      { key: 'emphasisColor', label: '高亮颜色', type: 'color', default: '#0071e3' },
    ],
  },
  {
    id: 'bar_chart',
    name: '柱状图',
    icon: 'bar-chart-3',
    defaults: {
      title: '数据对比',
      data: [
        { label: 'A', value: 30, color: '#0071e3' },
        { label: 'B', value: 60, color: '#5ac8fa' },
        { label: 'C', value: 90, color: '#ff6b35' },
      ],
      maxValue: 0,
      unit: '',
      showValues: true,
      animation: 'grow',
      barWidth: 0.7,
      barGap: 40,
    },
    props: [
      { key: 'title', label: '图表标题', type: 'string', required: true },
      { key: 'data', label: '数据项', type: 'data' },
      { key: 'maxValue', label: 'Y轴最大值', type: 'number', default: 0, min: 0, step: 1 },
      { key: 'unit', label: '数值单位', type: 'string' },
      { key: 'showValues', label: '显示数值', type: 'boolean', default: true },
      { key: 'animation', label: '动画方式', type: 'enum', options: ['grow', 'slideIn'], default: 'grow' },
      { key: 'barWidth', label: '柱子宽度', type: 'number', default: 0.7, min: 0.2, max: 1, step: 0.05 },
      { key: 'barGap', label: '柱子间距', type: 'number', default: 40, min: 10, max: 100, step: 5 },
    ],
  },
  {
    id: 'keyword_highlight',
    name: '关键词高亮',
    icon: 'highlighter',
    defaults: {
      text: '关键词',
      fontSize: 80,
      textColor: '#ffffff',
      glowColor: '#0071e3',
      glowRadius: 30,
      bgColor: '#1a1a2e',
      animation: 'pulse',
      pulseScale: 1.1,
    },
    props: [
      { key: 'text', label: '关键词文字', type: 'string', required: true },
      { key: 'fontSize', label: '字号', type: 'number', default: 80, min: 30, max: 150, step: 2 },
      { key: 'textColor', label: '文字颜色', type: 'color', default: '#ffffff' },
      { key: 'glowColor', label: '发光颜色', type: 'color', default: '#0071e3' },
      { key: 'glowRadius', label: '发光半径', type: 'number', default: 30, min: 0, max: 80, step: 2 },
      { key: 'bgColor', label: '背景颜色', type: 'color', default: '#1a1a2e' },
      { key: 'animation', label: '动画方式', type: 'enum', options: ['pulse', 'glow', 'scaleIn'], default: 'pulse' },
      { key: 'pulseScale', label: '脉冲幅度', type: 'number', default: 1.1, min: 1, max: 1.5, step: 0.05 },
    ],
  },
  {
    id: 'quote_card',
    name: '引用金句',
    icon: 'quote',
    defaults: {
      quote: '这里是一段引用金句文字',
      author: '— 作者',
      quoteFontSize: 48,
      authorFontSize: 28,
      quoteColor: '#1d1d1f',
      authorColor: '#6e6e73',
      bgColor: '#ffffff',
      showQuoteMark: true,
      quoteMarkStyle: 'double',
      animation: 'fadeIn',
    },
    props: [
      { key: 'quote', label: '引用文字', type: 'string', required: true },
      { key: 'author', label: '作者/来源', type: 'string' },
      { key: 'quoteFontSize', label: '引用字号', type: 'number', default: 48, min: 24, max: 80, step: 2 },
      { key: 'authorFontSize', label: '作者字号', type: 'number', default: 28, min: 16, max: 50, step: 2 },
      { key: 'quoteColor', label: '引用颜色', type: 'color', default: '#1d1d1f' },
      { key: 'authorColor', label: '作者颜色', type: 'color', default: '#6e6e73' },
      { key: 'bgColor', label: '背景颜色', type: 'color', default: '#ffffff' },
      { key: 'showQuoteMark', label: '显示引号', type: 'boolean', default: true },
      { key: 'quoteMarkStyle', label: '引号样式', type: 'enum', options: ['double', 'single', 'block'], default: 'double' },
      { key: 'animation', label: '动画方式', type: 'enum', options: ['fadeIn', 'slideUp', 'scaleIn'], default: 'fadeIn' },
    ],
  },
  {
    id: 'end_card',
    name: '结尾卡片',
    icon: 'flag',
    defaults: {
      brandName: 'VisualForge',
      slogan: '代码驱动的视觉动画渲染',
      ctaText: '立即体验',
      ctaUrl: '',
      bgColor: '#1a1a2e',
      animation: 'fadeIn',
      fadeOut: true,
    },
    props: [
      { key: 'brandName', label: '品牌名称', type: 'string', required: true },
      { key: 'slogan', label: '标语', type: 'string' },
      { key: 'ctaText', label: '行动号召', type: 'string' },
      { key: 'ctaUrl', label: '链接地址', type: 'string' },
      { key: 'bgColor', label: '背景颜色', type: 'color', default: '#1a1a2e' },
      { key: 'animation', label: '动画方式', type: 'enum', options: ['fadeIn', 'scaleIn', 'slideUp'], default: 'fadeIn' },
      { key: 'fadeOut', label: '结尾淡出', type: 'boolean', default: true },
    ],
  },
];

/** Get schema by segment type ID */
export function getSegmentSchema(type: SegmentType): SegmentTypeSchema | undefined {
  return SEGMENT_TYPE_SCHEMAS.find((s) => s.id === type);
}

/** Get default props for a segment type */
export function getDefaultProps(type: SegmentType): SegmentProps {
  const schema = getSegmentSchema(type);
  if (!schema) {
    throw new Error(`Unknown segment type: ${type}`);
  }
  return { ...schema.defaults } as unknown as SegmentProps;
}

/** Segment type display names for the library sidebar */
export const SEGMENT_LIBRARY: { type: SegmentType; name: string; icon: string }[] = [
  { type: 'text_card', name: '文字卡片', icon: 'type' },
  { type: 'bar_chart', name: '柱状图', icon: 'bar-chart-3' },
  { type: 'keyword_highlight', name: '关键词高亮', icon: 'highlighter' },
  { type: 'quote_card', name: '引用金句', icon: 'quote' },
  { type: 'end_card', name: '结尾卡片', icon: 'flag' },
];
