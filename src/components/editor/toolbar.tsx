'use client';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Play, Pause, Download, Loader2 } from 'lucide-react';
import type { EditorHook } from '../../hooks/use-editor';
import type { CanvasPreset } from '../../lib/types';

interface ToolbarProps {
  editor: EditorHook;
}

export function Toolbar({ editor }: ToolbarProps) {
  const {
    project,
    currentTime,
    duration,
    isPlaying,
    renderProgress,
    renderVideoUrl,
    renderError,
    setProjectName,
    setCanvasPreset,
    setCurrentTime,
    setIsPlaying,
    setRenderProgress,
    setRenderVideoUrl,
    setRenderError,
  } = editor;

  const handleExport = async () => {
    setRenderProgress(0);
    setRenderVideoUrl(null);
    setRenderError(null);

    try {
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || '提交渲染失败');
      }

      const renderId = data.renderId;
      // Poll for status
      const poll = async () => {
        const statusRes = await fetch(`/api/render/${renderId}/status`);
        const status = await statusRes.json();

        if (status.status === 'completed') {
          setRenderProgress(1);
          setRenderVideoUrl(status.videoUrl);
        } else if (status.status === 'failed') {
          setRenderProgress(null);
          setRenderError(status.error || '渲染失败');
        } else {
          setRenderProgress(status.progress);
          setTimeout(poll, 500);
        }
      };
      setTimeout(poll, 500);
    } catch (err) {
      setRenderProgress(null);
      setRenderError(err instanceof Error ? err.message : '未知错误');
    }
  };

  const isRendering = renderProgress !== null && renderVideoUrl === null && !renderError;

  const formatTime = (t: number) => {
    const s = Math.floor(t);
    const ms = Math.floor((t - s) * 10);
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="h-12 border-b border-[#30363d] bg-[#0d1117] flex items-center gap-3 px-4">
      {/* Logo */}
      <span className="text-sm font-bold text-[#e6edf3] tracking-wide">VisualForge</span>

      <div className="w-px h-6 bg-[#30363d]" />

      {/* Project name */}
      <Input
        value={project.name}
        onChange={(e) => setProjectName(e.target.value)}
        className="h-8 w-40 text-xs bg-[#161b22] border-[#30363d] text-[#e6edf3]"
      />

      <div className="w-px h-6 bg-[#30363d]" />

      {/* Canvas preset */}
      <Select
        value={project.canvas.width > project.canvas.height ? 'horizontal' : project.canvas.width === project.canvas.height ? 'square' : 'vertical'}
        onValueChange={(v) => setCanvasPreset(v as CanvasPreset)}
      >
        <SelectTrigger className="h-8 w-28 text-xs bg-[#161b22] border-[#30363d] text-[#e6edf3]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="vertical">竖版 1080x1920</SelectItem>
          <SelectItem value="horizontal">横版 1920x1080</SelectItem>
          <SelectItem value="square">方形 1080x1080</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex-1" />

      {/* Playback controls */}
      <div className="flex items-center gap-2">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-[#e6edf3] hover:bg-[#161b22]"
          onClick={() => {
            if (currentTime >= duration) setCurrentTime(0);
            setIsPlaying(!isPlaying);
          }}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <span className="text-xs text-[#7d8590] tabular-nums">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      <div className="w-px h-6 bg-[#30363d]" />

      {/* Export */}
      {isRendering ? (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-[#D4AF37]" />
          <span className="text-xs text-[#7d8590] tabular-nums">
            渲染中 {Math.round((renderProgress ?? 0) * 100)}%
          </span>
        </div>
      ) : renderVideoUrl ? (
        <div className="flex items-center gap-2">
          <a
            href={renderVideoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 h-8 rounded-md bg-[#D4AF37] hover:bg-[#E0BC4A] text-xs text-black font-medium transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            下载 MP4
          </a>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs text-[#7d8590] hover:text-[#e6edf3]"
            onClick={() => { setRenderVideoUrl(null); setRenderProgress(null); }}
          >
            重新渲染
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          className="h-8 text-xs bg-[#D4AF37] hover:bg-[#E0BC4A] text-black"
          onClick={handleExport}
          disabled={project.timeline.length === 0}
        >
          <Download className="h-3.5 w-3.5 mr-1" />
          导出 MP4
        </Button>
      )}

      {renderError && (
        <span className="text-xs text-[#f85149]">{renderError}</span>
      )}
    </div>
  );
}
