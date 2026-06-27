'use client';

import Link from 'next/link';
import { Button } from '../../components/ui/button';

const SEGMENT_TABLE = [
  { type: 'text_card', name: '文字卡片', fields: 'title, subtitle' },
  { type: 'bar_chart', name: '柱状图', fields: 'title, data[{label,value}]' },
  { type: 'pie_chart', name: '饼图', fields: 'title, data[{label,value}]' },
  { type: 'line_chart', name: '折线图', fields: 'title, series[{name,data[]}]' },
  { type: 'keyword_highlight', name: '关键词高亮', fields: 'text' },
  { type: 'quote_card', name: '引用卡片', fields: 'quote, author' },
  { type: 'number_animation', name: '数字动画', fields: 'endValue, suffix, label' },
  { type: 'tag_cloud', name: '标签云', fields: 'tags[]' },
  { type: 'progress_timeline', name: '进度时间轴', fields: 'title, nodes[]' },
  { type: 'process_flow', name: '流程图', fields: 'title, steps[{title,description}]' },
  { type: 'persona_card', name: '人物卡片', fields: 'name, title, description' },
  { type: 'compare_card', name: '对比卡片', fields: 'title, leftContent, rightContent' },
  { type: 'image_show', name: '图片展示', fields: 'imageUrl, overlayText' },
  { type: 'background', name: '背景', fields: 'bgType (gradient/particle/grid)' },
  { type: 'end_card', name: '结尾卡片', fields: 'brandName, slogan, ctaText' },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3]">
      <nav className="border-b border-[#30363d] px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0d1117] z-10">
        <Link href="/" className="text-lg font-bold tracking-wide">VisualForge</Link>
        <div className="flex items-center gap-4">
          <Link href="/projects" className="text-sm text-[#7d8590] hover:text-[#e6edf3]">项目</Link>
          <Link href="/editor">
            <Button size="sm" className="bg-[#D4AF37] hover:bg-[#E0BC4A] text-black">进入编辑器</Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">API 文档</h1>
        <p className="text-[#7d8590] mb-8">3 个接口，15 种片段类型，传入 JSON 即可生成 MP4 视频</p>

        {/* Quick Start */}
        <div className="mb-12 p-6 rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/5">
          <h2 className="text-lg font-semibold mb-3 text-[#D4AF37]">快速开始</h2>
          <p className="text-sm text-[#7d8590] mb-4">只需两步：提交渲染 → 轮询状态拿视频 URL</p>
          <pre className="text-xs bg-[#0d1117] border border-[#30363d] rounded-md p-4 overflow-x-auto text-[#e6edf3] leading-relaxed"><code>{`# 1. 提交渲染任务
curl -X POST https://your-domain/api/render \\
  -H "Content-Type: application/json" \\
  -d '{
    "segments": [
      { "type": "text_card", "start": 0, "duration": 3,
        "title": "你好世界", "subtitle": "VisualForge" },
      { "type": "end_card", "start": 3, "duration": 3,
        "brandName": "MyBrand", "slogan": "Build the Future" }
    ]
  }'

# 返回: { "success": true, "renderId": "r_abc123", ... }

# 2. 轮询状态（拿到 videoUrl 就完成了）
curl https://your-domain/api/render/r_abc123/status

# 返回: { "status": "completed", "videoUrl": "https://..." }`}</code></pre>
        </div>

        {/* Segment Types Reference */}
        <h2 className="text-xl font-bold mb-4 mt-10">片段类型速查表</h2>
        <p className="text-sm text-[#7d8590] mb-4">每个 segment 只需填 <code className="text-[#D4AF37]">type</code> + <code className="text-[#D4AF37]">start</code> + 内容字段，其余全自动</p>
        <div className="overflow-x-auto mb-12">
          <table className="w-full text-sm border border-[#30363d] rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-[#161b22] text-[#7d8590]">
                <th className="text-left px-4 py-2 font-medium">type</th>
                <th className="text-left px-4 py-2 font-medium">名称</th>
                <th className="text-left px-4 py-2 font-medium">必填内容字段</th>
              </tr>
            </thead>
            <tbody>
              {SEGMENT_TABLE.map((s) => (
                <tr key={s.type} className="border-t border-[#30363d] hover:bg-[#161b22]/50">
                  <td className="px-4 py-2 font-mono text-[#4FC3F7]">{s.type}</td>
                  <td className="px-4 py-2 text-[#e6edf3]">{s.name}</td>
                  <td className="px-4 py-2 font-mono text-xs text-[#7d8590]">{s.fields}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* API: Render */}
        <ApiSection
          method="POST"
          path="/api/render"
          title="提交渲染任务"
          desc="传入 segments 数组，异步启动 MP4 渲染。总时长不能超过 10 秒（24fps = 240 帧）。"
          request={`{
  "segments": [
    {
      "type": "text_card",       // 片段类型
      "start": 0,                // 开始时间（秒）
      "duration": 3,             // 持续时间（秒），默认 3
      "title": "2024年AI市场规模",
      "subtitle": "3.2万亿元"
    },
    {
      "type": "bar_chart",
      "start": 3,
      "duration": 4,
      "title": "市场份额",
      "data": [
        { "label": "产品A", "value": 45 },
        { "label": "产品B", "value": 30 },
        { "label": "产品C", "value": 25 }
      ]
    },
    {
      "type": "number_animation",
      "start": 7,
      "duration": 3,
      "endValue": 99999,
      "suffix": "+",
      "label": "总下载量"
    }
  ]
}`}
          response={`{
  "success": true,
  "renderId": "r_abc123",
  "status": "processing",
  "estimatedTime": 48
}`}
        />

        {/* API: Status */}
        <ApiSection
          method="GET"
          path="/api/render/{renderId}/status"
          title="查询渲染状态"
          desc="用 renderId 轮询。status 为 completed 时 videoUrl 可用，failed 时 error 有错误信息。建议每 1-2 秒轮询一次。"
          request={null}
          response={`{
  "renderId": "r_abc123",
  "status": "completed",       // processing | completed | failed
  "progress": 1.0,             // 0 ~ 1
  "currentFrame": 240,
  "totalFrames": 240,
  "videoUrl": "https://oss.../r_abc123.mp4",
  "error": null
}`}
        />

        {/* API: Preview Frame */}
        <ApiSection
          method="POST"
          path="/api/preview-frame"
          title="预览单帧"
          desc="传入 segments + time，返回该时间点的 PNG 预览图（base64）。用于渲染前预览效果。"
          request={`{
  "segments": [
    { "type": "text_card", "start": 0, "duration": 3,
      "title": "预览测试", "subtitle": "Hello" }
  ],
  "time": 1.5                 // 预览第 1.5 秒的画面
}`}
          response={`iVBORw0KGgoAAAANSUhEUgAA...    // base64 编码的 PNG 图片`}
        />

        {/* API: Segment Types */}
        <ApiSection
          method="GET"
          path="/api/segment-types"
          title="获取片段类型 Schema"
          desc="返回所有 15 种片段类型的完整属性定义和默认值。"
          request={null}
          response={`{
  "segmentTypes": [
    {
      "id": "text_card",
      "name": "文字卡片",
      "icon": "type",
      "props": [...],
      "defaults": {...}
    }
  ]
}`}
        />

        {/* Examples */}
        <h2 className="text-xl font-bold mb-4 mt-12">完整示例</h2>

        <div className="mb-8">
          <h3 className="text-sm font-semibold text-[#D4AF37] mb-2">示例 1：产品发布（5 秒）</h3>
          <pre className="text-xs bg-[#161b22] border border-[#30363d] rounded-md p-4 overflow-x-auto text-[#e6edf3] leading-relaxed"><code>{`{
  "segments": [
    { "type": "text_card", "start": 0, "duration": 2,
      "title": "新品发布", "subtitle": "2024 春季系列" },
    { "type": "bar_chart", "start": 2, "duration": 3,
      "title": "区域销量",
      "data": [
        { "label": "华北", "value": 320 },
        { "label": "华东", "value": 450 },
        { "label": "华南", "value": 280 }
      ] },
    { "type": "end_card", "start": 5, "duration": 3,
      "brandName": "MyBrand", "slogan": "未来已来" }
  ]
}`}</code></pre>
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-semibold text-[#D4AF37] mb-2">示例 2：数据报告（10 秒）</h3>
          <pre className="text-xs bg-[#161b22] border border-[#30363d] rounded-md p-4 overflow-x-auto text-[#e6edf3] leading-relaxed"><code>{`{
  "segments": [
    { "type": "number_animation", "start": 0, "duration": 3,
      "endValue": 99999, "suffix": "+", "label": "总下载量" },
    { "type": "pie_chart", "start": 3, "duration": 3,
      "title": "市场份额",
      "data": [
        { "label": "iOS", "value": 35 },
        { "label": "Android", "value": 45 },
        { "label": "Web", "value": 20 }
      ] },
    { "type": "line_chart", "start": 6, "duration": 2,
      "title": "增长趋势",
      "series": [
        { "name": "用户", "data": [100, 600, 2400, 3800] },
        { "name": "收入", "data": [50, 420, 1800, 3200] }
      ] },
    { "type": "end_card", "start": 8, "duration": 2,
      "brandName": "DataCorp", "slogan": "数据驱动决策" }
  ]
}`}</code></pre>
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-semibold text-[#D4AF37] mb-2">示例 3：人物介绍 + 流程（8 秒）</h3>
          <pre className="text-xs bg-[#161b22] border border-[#30363d] rounded-md p-4 overflow-x-auto text-[#e6edf3] leading-relaxed"><code>{`{
  "segments": [
    { "type": "quote_card", "start": 0, "duration": 3,
      "quote": "简洁是终极的复杂。",
      "author": "Leonardo da Vinci" },
    { "type": "persona_card", "start": 3, "duration": 3,
      "name": "张三", "title": "首席设计师",
      "description": "十年品牌设计经验，擅长视觉叙事" },
    { "type": "process_flow", "start": 6, "duration": 2,
      "title": "设计流程",
      "steps": [
        { "title": "调研", "description": "理解用户需求" },
        { "title": "交付", "description": "发布最终产品" }
      ] }
  ]
}`}</code></pre>
        </div>

        {/* Notes */}
        <div className="mt-12 p-6 rounded-lg border border-[#30363d] bg-[#161b22]">
          <h2 className="text-lg font-semibold mb-3">注意事项</h2>
          <ul className="text-sm text-[#7d8590] space-y-2 list-disc list-inside">
            <li>视频总时长 = 最后一个片段的 <code className="text-[#4FC3F7]">start + duration</code>，不能超过 <span className="text-[#e6edf3]">10 秒</span></li>
            <li>分辨率固定 <span className="text-[#e6edf3]">720×1280</span>（720P 竖屏），帧率 <span className="text-[#e6edf3]">24fps</span></li>
            <li>颜色、字体、动画、转场全部自动分配，无需手动指定</li>
            <li>每个片段的 <code className="text-[#4FC3F7]">duration</code> 可选，默认 3 秒</li>
            <li>图表类片段（bar/pie/line）的 <code className="text-[#4FC3F7]">color</code> 可选，不传则自动从主题色板分配</li>
            <li>渲染约需 <span className="text-[#e6edf3]">40-60 秒</span>（240 帧 × 0.2 秒/帧）</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

function ApiSection({
  method,
  path,
  title,
  desc,
  request,
  response,
}: {
  method: string;
  path: string;
  title: string;
  desc: string;
  request: string | null;
  response: string;
}) {
  const methodColor = method === 'GET' ? 'text-[#00d4aa] bg-[#00d4aa]/10' : 'text-[#f0883e] bg-[#f0883e]/10';

  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-2">
        <span className={`text-xs font-mono px-2 py-0.5 rounded ${methodColor}`}>{method}</span>
        <code className="text-sm text-[#e6edf3]">{path}</code>
      </div>
      <h2 className="text-lg font-semibold mb-1">{title}</h2>
      <p className="text-sm text-[#7d8590] mb-4">{desc}</p>

      {request && (
        <div className="mb-3">
          <div className="text-xs text-[#7d8590] mb-1">请求体</div>
          <pre className="text-xs bg-[#161b22] border border-[#30363d] rounded-md p-3 overflow-x-auto text-[#e6edf3]"><code>{request}</code></pre>
        </div>
      )}

      <div>
        <div className="text-xs text-[#7d8590] mb-1">响应</div>
        <pre className="text-xs bg-[#161b22] border border-[#30363d] rounded-md p-3 overflow-x-auto text-[#e6edf3]"><code>{response}</code></pre>
      </div>
    </div>
  );
}
