'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '../../components/ui/button';
import { loadProjects, deleteProject, createProject, exportProjectJson } from '../../lib/project-storage';
import type { Project } from '../../lib/types';
import { Plus, Trash2, Download, Edit3, Film } from 'lucide-react';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    setProjects(loadProjects());
  }, []);

  const refresh = () => setProjects(loadProjects());

  const handleNew = () => {
    const proj = createProject('新项目');
    window.location.href = `/editor?project=${proj.id}`;
  };

  const handleDelete = (id: string) => {
    deleteProject(id);
    refresh();
  };

  const handleExport = (proj: Project) => {
    exportProjectJson(proj);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3]">
      <nav className="border-b border-[#30363d] px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold tracking-wide">VisualForge</Link>
        <div className="flex items-center gap-4">
          <Link href="/editor" className="text-sm text-[#7d8590] hover:text-[#e6edf3]">编辑器</Link>
          <Link href="/docs" className="text-sm text-[#7d8590] hover:text-[#e6edf3]">API 文档</Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">我的项目</h1>
          <Button onClick={handleNew} className="bg-[#238636] hover:bg-[#2ea043] text-white">
            <Plus className="h-4 w-4 mr-1" /> 新建项目
          </Button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-[#30363d] rounded-lg">
            <Film className="h-12 w-12 text-[#30363d] mx-auto mb-4" />
            <p className="text-[#7d8590] mb-4">还没有项目，创建一个开始吧</p>
            <Button onClick={handleNew} className="bg-[#238636] hover:bg-[#2ea043] text-white">
              <Plus className="h-4 w-4 mr-1" /> 新建项目
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="p-5 rounded-lg border border-[#30363d] bg-[#161b22] hover:border-[#2f81f7] transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded bg-[#21262d] flex items-center justify-center">
                      <Film className="h-5 w-5 text-[#2f81f7]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium truncate max-w-32">{proj.name}</h3>
                      <p className="text-[10px] text-[#7d8590]">
                        {proj.timeline.length} 个片段 · {proj.canvas.width}x{proj.canvas.height}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-[#484f58] mb-3">
                  更新于 {new Date(proj.updatedAt).toLocaleString('zh-CN')}
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/editor?project=${proj.id}`}>
                    <Button size="sm" variant="outline" className="h-7 text-xs border-[#30363d] bg-[#0d1117] text-[#e6edf3] hover:bg-[#21262d]">
                      <Edit3 className="h-3 w-3 mr-1" /> 编辑
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-[#7d8590] hover:text-[#e6edf3]"
                    onClick={() => handleExport(proj)}
                  >
                    <Download className="h-3 w-3 mr-1" /> 导出
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-[#f85149] hover:text-[#f85149] ml-auto"
                    onClick={() => handleDelete(proj.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
