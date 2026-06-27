'use client';

import Link from 'next/link';
import { Button } from '../components/ui/button';
import { Film, Zap, Code2, Palette } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3]">
      {/* Nav */}
      <nav className="border-b border-[#30363d] px-6 py-4 flex items-center justify-between">
        <span className="text-lg font-bold tracking-wide">VisualForge</span>
        <div className="flex items-center gap-4">
          <Link href="/projects" className="text-sm text-[#7d8590] hover:text-[#e6edf3] transition-colors">项目</Link>
          <Link href="/docs" className="text-sm text-[#7d8590] hover:text-[#e6edf3] transition-colors">API 文档</Link>
          <Link href="/editor">
            <Button size="sm" className="bg-[#238636] hover:bg-[#2ea043] text-white">进入编辑器</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center space-y-6">
          <h1 className="text-5xl font-bold tracking-tight">
            代码驱动的视觉动画<br />
            <span className="text-[#2f81f7]">视频渲染平台</span>
          </h1>
          <p className="text-lg text-[#7d8590] max-w-2xl mx-auto">
            通过可视化时间线编辑器编排动画效果，系统使用 node-canvas 逐帧渲染并输出 MP4 文件，同时提供 API 供程序化调用。
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Link href="/editor">
              <Button size="lg" className="bg-[#238636] hover:bg-[#2ea043] text-white px-8">
                开始创作
              </Button>
            </Link>
            <Link href="/docs">
              <Button size="lg" variant="outline" className="border-[#30363d] bg-[#161b22] text-[#e6edf3] hover:bg-[#21262d] px-8">
                查看 API
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-24">
          <FeatureCard
            icon={<Zap className="h-6 w-6 text-[#2f81f7]" />}
            title="所见即所得"
            desc="可视化编辑界面，拖拽编排，实时预览"
          />
          <FeatureCard
            icon={<Film className="h-6 w-6 text-[#2f81f7]" />}
            title="纯 Node.js 渲染"
            desc="无需 Headless Chrome，FaaS 可部署"
          />
          <FeatureCard
            icon={<Code2 className="h-6 w-6 text-[#2f81f7]" />}
            title="API 驱动"
            desc="暴露完整 API，支持程序化批量生成"
          />
          <FeatureCard
            icon={<Palette className="h-6 w-6 text-[#2f81f7]" />}
            title="多主题切换"
            desc="内置多套视觉主题，一键切换风格"
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="p-6 rounded-lg border border-[#30363d] bg-[#161b22]">
      <div className="mb-3">{icon}</div>
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <p className="text-xs text-[#7d8590]">{desc}</p>
    </div>
  );
}
