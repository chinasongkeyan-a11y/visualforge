import type { Project } from './types';
import { CANVAS_PRESETS, MAX_DURATION } from './types';
import { getDefaultProps } from './segment-schemas';
import type { SegmentType, Segment } from './types';

const STORAGE_KEY = 'visualforge_projects';

/** Generate a unique ID */
export function generateId(prefix = 'seg'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Create a new empty project */
export function createProject(name: string, theme = 'tech_blue'): Project {
  const now = new Date().toISOString();
  return {
    id: generateId('proj'),
    name,
    createdAt: now,
    updatedAt: now,
    canvas: { ...CANVAS_PRESETS.vertical },
    theme,
    timeline: [],
  };
}

/** Create a new segment with default props */
export function createSegment(type: SegmentType, start: number, duration: number): Segment {
  return {
    id: generateId('seg'),
    type,
    track: 1, // Default to content track
    start,
    duration,
    props: getDefaultProps(type),
    transitionIn: 'fadeIn',
    transitionOut: 'none',
  };
}

/** Save project to localStorage */
export function saveProject(project: Project): void {
  if (typeof window === 'undefined') return;
  const projects = loadProjects();
  const idx = projects.findIndex((p) => p.id === project.id);
  const updated = { ...project, updatedAt: new Date().toISOString() };
  if (idx >= 0) {
    projects[idx] = updated;
  } else {
    projects.push(updated);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

/** Load all projects from localStorage */
export function loadProjects(): Project[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as Project[];
  } catch {
    return [];
  }
}

/** Delete project from localStorage */
export function deleteProject(id: string): void {
  if (typeof window === 'undefined') return;
  const projects = loadProjects().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

/** Load a single project by ID */
export function loadProject(id: string): Project | null {
  return loadProjects().find((p) => p.id === id) ?? null;
}

/** Export project as JSON file */
export function exportProjectJson(project: Project): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${project.name || 'project'}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

/** Ensure segment times stay within bounds */
export function clampSegment(segment: Segment): Segment {
  const start = Math.max(0, Math.min(segment.start, MAX_DURATION - 0.5));
  const duration = Math.max(0.5, Math.min(segment.duration, MAX_DURATION - start));
  return { ...segment, start, duration };
}
