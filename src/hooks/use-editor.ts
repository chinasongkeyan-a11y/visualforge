'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Project, Segment, SegmentType, CanvasPreset } from '../lib/types';
import {
  createSegment,
  clampSegment,
  saveProject,
} from '../lib/project-storage';
import { MAX_DURATION } from '../lib/types';
import { getProjectDuration } from '../lib/renderer';

export interface EditorState {
  project: Project;
  selectedSegmentId: string | null;
  currentTime: number;
  isPlaying: boolean;
  zoom: number; // pixels per second
  renderProgress: number | null; // null = not rendering
  renderVideoUrl: string | null;
  renderError: string | null;
}

export function useEditor(initialProject: Project) {
  const [project, setProject] = useState<Project>(initialProject);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(80); // 80px per second
  const [renderProgress, setRenderProgress] = useState<number | null>(null);
  const [renderVideoUrl, setRenderVideoUrl] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  const duration = getProjectDuration(project);
  const animationFrameRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  // Playback loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    lastTickRef.current = performance.now();

    const tick = (now: number) => {
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      setCurrentTime((prev) => {
        const next = prev + delta;
        if (next >= duration) {
          setIsPlaying(false);
          return duration;
        }
        return next;
      });
      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, duration]);

  // Auto-save to localStorage
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const updateProject = useCallback((updater: (p: Project) => Project) => {
    setProject((prev) => {
      const next = updater(prev);
      // Debounced save
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => saveProject(next), 1000);
      return next;
    });
  }, []);

  const addSegment = useCallback((type: SegmentType) => {
    updateProject((p) => {
      // Find a good start time (end of last segment on track 1, or 0)
      const track1Segments = p.timeline.filter((s) => s.track === 1);
      const start = track1Segments.length > 0
        ? Math.max(...track1Segments.map((s) => s.start + s.duration))
        : 0;
      const remaining = MAX_DURATION - start;
      const segDuration = Math.min(3, remaining > 0 ? remaining : 3);
      const seg = createSegment(type, Math.max(0, start), Math.max(0.5, segDuration));
      setSelectedSegmentId(seg.id);
      return { ...p, timeline: [...p.timeline, seg] };
    });
  }, [updateProject]);

  const updateSegment = useCallback((id: string, partial: Partial<Segment>) => {
    updateProject((p) => ({
      ...p,
      timeline: p.timeline.map((s) =>
        s.id === id ? clampSegment({ ...s, ...partial }) : s,
      ),
    }));
  }, [updateProject]);

  const updateSegmentProps = useCallback((id: string, key: string, value: unknown) => {
    updateProject((p) => ({
      ...p,
      timeline: p.timeline.map((s) =>
        s.id === id
          ? { ...s, props: { ...s.props, [key]: value } as typeof s.props }
          : s,
      ),
    }));
  }, [updateProject]);

  const deleteSegment = useCallback((id: string) => {
    updateProject((p) => ({
      ...p,
      timeline: p.timeline.filter((s) => s.id !== id),
    }));
    setSelectedSegmentId((prev) => (prev === id ? null : prev));
  }, [updateProject]);

  const duplicateSegment = useCallback((id: string) => {
    updateProject((p) => {
      const seg = p.timeline.find((s) => s.id === id);
      if (!seg) return p;
      const newSeg: Segment = {
        ...seg,
        id: `${id}_copy_${Date.now().toString(36)}`,
        start: Math.min(seg.start + seg.duration, MAX_DURATION - 0.5),
        props: JSON.parse(JSON.stringify(seg.props)),
      };
      return { ...p, timeline: [...p.timeline, newSeg] };
    });
  }, [updateProject]);

  const selectSegment = useCallback((id: string | null) => {
    setSelectedSegmentId(id);
  }, []);

  const setProjectName = useCallback((name: string) => {
    updateProject((p) => ({ ...p, name }));
  }, [updateProject]);

  const setTheme = useCallback((themeId: string) => {
    updateProject((p) => ({ ...p, theme: themeId }));
  }, []);

  const setCanvasPreset = useCallback((preset: CanvasPreset) => {
    updateProject((p) => ({
      ...p,
      canvas: {
        width: preset === 'horizontal' ? 1920 : 1080,
        height: preset === 'horizontal' ? 1080 : preset === 'square' ? 1080 : 1920,
        fps: 24,
      },
    }));
  }, []);

  const loadProject = useCallback((newProject: Project) => {
    setProject(newProject);
    setSelectedSegmentId(null);
    setCurrentTime(0);
    setIsPlaying(false);
  }, []);

  return {
    project,
    selectedSegmentId,
    selectedSegment: project.timeline.find((s) => s.id === selectedSegmentId) ?? null,
    currentTime,
    isPlaying,
    zoom,
    duration,
    renderProgress,
    renderVideoUrl,
    renderError,
    setCurrentTime,
    setIsPlaying,
    setZoom,
    setRenderProgress,
    setRenderVideoUrl,
    setRenderError,
    addSegment,
    updateSegment,
    updateSegmentProps,
    deleteSegment,
    duplicateSegment,
    selectSegment,
    setProjectName,
    setTheme,
    setCanvasPreset,
    loadProject,
    updateProject,
  };
}

export type EditorHook = ReturnType<typeof useEditor>;
