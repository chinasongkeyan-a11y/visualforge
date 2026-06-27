'use client';

import { useRef, useCallback, useState, useEffect, type MouseEvent } from 'react';
import type { EditorHook } from '../../hooks/use-editor';
import type { Segment, SegmentType } from '../../lib/types';
import { SEGMENT_LIBRARY } from '../../lib/segment-schemas';
import { MAX_DURATION } from '../../lib/types';

const TRACK_HEIGHT = 56;
const TRACK_GAP = 4;
const RULER_HEIGHT = 28;
const TRACK_NAMES = ['背景层', '内容层', '前景层'];
const TRACK_COLORS = ['#3b82f6', '#f59e0b', '#10b981'];

interface TimelineProps {
  editor: EditorHook;
}

export function Timeline({ editor }: TimelineProps) {
  const { project, currentTime, zoom, selectedSegmentId, duration } = editor;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [dragState, setDragState] = useState<{
    segmentId: string;
    mode: 'move' | 'resize-left' | 'resize-right';
    startX: number;
    origStart: number;
    origDuration: number;
  } | null>(null);

  const totalWidth = MAX_DURATION * zoom;

  // Track scroll position in state to avoid accessing ref during render
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setScrollLeft(el.scrollLeft);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const handleTimeClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + (scrollRef.current?.scrollLeft ?? 0);
    const time = Math.max(0, Math.min(MAX_DURATION, x / zoom));
    editor.setCurrentTime(time);
  }, [zoom, editor]);

  const startDrag = useCallback((e: MouseEvent, segment: Segment, mode: 'move' | 'resize-left' | 'resize-right') => {
    e.stopPropagation();
    editor.selectSegment(segment.id);
    setDragState({
      segmentId: segment.id,
      mode,
      startX: e.clientX,
      origStart: segment.start,
      origDuration: segment.duration,
    });
  }, [editor]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState) return;
    const deltaX = e.clientX - dragState.startX;
    const deltaTime = deltaX / zoom;

    if (dragState.mode === 'move') {
      const newStart = Math.max(0, Math.min(MAX_DURATION - dragState.origDuration, dragState.origStart + deltaTime));
      editor.updateSegment(dragState.segmentId, { start: newStart });
    } else if (dragState.mode === 'resize-left') {
      const newStart = Math.max(0, Math.min(dragState.origStart + dragState.origDuration - 0.5, dragState.origStart + deltaTime));
      const newDuration = dragState.origDuration + (dragState.origStart - newStart);
      editor.updateSegment(dragState.segmentId, { start: newStart, duration: newDuration });
    } else if (dragState.mode === 'resize-right') {
      const newDuration = Math.max(0.5, Math.min(MAX_DURATION - dragState.origStart, dragState.origDuration + deltaTime));
      editor.updateSegment(dragState.segmentId, { duration: newDuration });
    }
  }, [dragState, zoom, editor]);

  const stopDrag = useCallback(() => {
    setDragState(null);
  }, []);

  // Group segments by track
  const tracks: Segment[][] = [[], [], []];
  project.timeline.forEach((seg) => {
    const track = Math.max(0, Math.min(2, seg.track));
    tracks[track].push(seg);
  });

  // Ruler ticks
  const ticks: number[] = [];
  for (let i = 0; i <= MAX_DURATION; i++) {
    ticks.push(i);
  }

  return (
    <div
      className="flex-1 overflow-hidden bg-[#0d1117] border-t border-[#30363d]"
      onMouseMove={handleMouseMove}
      onMouseUp={stopDrag}
      onMouseLeave={stopDrag}
    >
      {/* Ruler */}
      <div className="relative h-7 border-b border-[#30363d] overflow-hidden">
        <div
          ref={scrollRef}
          className="h-full overflow-x-auto overflow-y-hidden"
          style={{ scrollbarWidth: 'thin' }}
        >
          <div className="relative h-full" style={{ width: totalWidth + 100 }} onClick={handleTimeClick}>
            {ticks.map((t) => (
              <div
                key={t}
                className="absolute top-0 h-full flex items-end pb-1"
                style={{ left: t * zoom }}
              >
                <div className="text-[11px] text-[#7d8590] tabular-nums pl-1">{t}s</div>
                <div className="absolute top-0 left-0 w-px h-3 bg-[#30363d]" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tracks */}
      <div
        className="overflow-x-auto overflow-y-auto"
        style={{ maxHeight: '100%' }}
        onScroll={(e) => {
          if (scrollRef.current && scrollRef.current.scrollLeft !== e.currentTarget.scrollLeft) {
            scrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
          }
        }}
      >
        <div style={{ width: totalWidth + 100, minHeight: tracks.length * (TRACK_HEIGHT + TRACK_GAP) + 20 }}>
          {tracks.map((trackSegs, trackIdx) => (
            <div
              key={trackIdx}
              className="relative border-b border-[#21262d]"
              style={{ height: TRACK_HEIGHT, marginBottom: TRACK_GAP, marginTop: trackIdx === 0 ? 4 : 0 }}
            >
              {/* Track label */}
              <div className="absolute left-0 top-0 z-10 h-full w-20 bg-[#161b22] border-r border-[#30363d] flex items-center px-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TRACK_COLORS[trackIdx] }} />
                  <span className="text-[11px] text-[#7d8590]">{TRACK_NAMES[trackIdx]}</span>
                </div>
              </div>

              {/* Track background */}
              <div
                className="absolute top-0 h-full"
                style={{ left: 80, right: 0 }}
                onClick={handleTimeClick}
              />

              {/* Segments */}
              {trackSegs.map((seg) => {
                const isSelected = seg.id === selectedSegmentId;
                const segType = SEGMENT_LIBRARY.find((s) => s.type === seg.type);
                const left = seg.start * zoom + 80;
                const width = seg.duration * zoom;

                return (
                  <div
                    key={seg.id}
                    className={`absolute top-1 rounded-md cursor-pointer transition-colors ${
                      isSelected ? 'ring-2 ring-[#2f81f7]' : ''
                    }`}
                    style={{
                      left,
                      width: Math.max(width, 20),
                      height: TRACK_HEIGHT - 8,
                      backgroundColor: isSelected ? withAlpha(TRACK_COLORS[trackIdx], 0.25) : withAlpha(TRACK_COLORS[trackIdx], 0.15),
                      borderLeft: `3px solid ${TRACK_COLORS[trackIdx]}`,
                    }}
                    onMouseDown={(e) => startDrag(e, seg, 'move')}
                    onClick={(e) => { e.stopPropagation(); editor.selectSegment(seg.id); }}
                  >
                    {/* Resize handles */}
                    <div
                      className="absolute left-0 top-0 h-full w-1.5 cursor-ew-resize hover:bg-white/20"
                      onMouseDown={(e) => startDrag(e, seg, 'resize-left')}
                    />
                    <div
                      className="absolute right-0 top-0 h-full w-1.5 cursor-ew-resize hover:bg-white/20"
                      onMouseDown={(e) => startDrag(e, seg, 'resize-right')}
                    />

                    {/* Label */}
                    <div className="px-2 py-1 text-[11px] text-white/80 truncate pointer-events-none">
                      {segType?.name ?? seg.type}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Playhead */}
      <PlayheadOverlay currentTime={currentTime} zoom={zoom} scrollLeft={scrollLeft} />
    </div>
  );
}

function PlayheadOverlay({ currentTime, zoom, scrollLeft }: { currentTime: number; zoom: number; scrollLeft: number }) {
  const left = currentTime * zoom + 80;
  return (
    <div
      className="absolute top-7 bottom-0 w-0.5 bg-[#f85149] pointer-events-none z-20"
      style={{ left: left - scrollLeft }}
    >
      <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-[#f85149] rotate-45" />
    </div>
  );
}

function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
