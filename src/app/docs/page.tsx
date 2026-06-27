'use client';

import Link from 'next/link';
import { Button } from '../../components/ui/button';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3]">
      <nav className="border-b border-[#30363d] px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold tracking-wide">VisualForge</Link>
        <div className="flex items-center gap-4">
          <Link href="/projects" className="text-sm text-[#7d8590] hover:text-[#e6edf3]">项目</Link>
          <Link href="/editor">
            <Button size="sm" className="bg-[#238636] hover:bg-[#2ea043] text-white">进入编辑器</Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">API 文档</h1>
        <p className="text-[#7d8590] mb-12">VisualForge RESTful API 接口说明</p>

        <ApiSection
          method="POST"
          path="/api/render"
          title="提交渲染任务"
          desc="提交片段数据，异步启动 MP4 渲染任务。theme 字段可选，默认使用 Onyx 黑色主题。"
          request={`{
  "segments": [
    { "type": "text_card", "start": 0, "duration": 3,
      "title": "2024年AI市场规模", "subtitle": "3.2万亿元" },
    { "type": "bar_chart", "start": 3, "duration": 4,
      "title": "市场份额",
      "data": [
        { "label": "A", "value": 45 },
        { "label": "B", "value": 30 },
        { "label": "C", "value": 25 }
      ]},
    { "type": "end_card", "start": 7, "duration": 3,
      "brandName": "VisualForge", "slogan": "Render the Future" }
  ]
}`}
          response={`{
  "success": true,
  "renderId": "r_abc123",
  "status": "processing",
  "estimatedTime": 30
}`}
        />

        <ApiSection
          method="GET"
          path="/api/render/{renderId}/status"
          title="查询渲染状态"
          desc="轮询渲染任务的进度和结果。"
          request={null}
          response={`{
  "renderId": "r_abc123",
  "status": "completed",
  "progress": 1.0,
  "currentFrame": 240,
  "totalFrames": 240,
  "videoUrl": "https://oss.../r_abc123.mp4",
  "error": null
}`}
        />

        <ApiSection
          method="POST"
          path="/api/preview-frame"
          title="预览单帧"
          desc="传入项目数据和时间点，返回该帧的预览图。"
          request={`{
  "project": { ... },
  "time": 3.5
}`}
          response={`{
  "frame": "data:image/png;base64,iVBORw0KGgo..."
}`}
        />

        <ApiSection
          method="GET"
          path="/api/themes"
          title="获取主题列表"
          desc="返回内置主题（当前仅 Onyx 黑色主题）。"
          request={null}
          response={`{
  "themes": [
    { "id": "onyx", "name": "Onyx" }
  ]
}`}
        />

        <ApiSection
          method="GET"
          path="/api/segment-types"
          title="获取片段类型 Schema"
          desc="返回所有片段类型的属性定义和默认值。"
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
