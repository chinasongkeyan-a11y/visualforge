// ============================================================
// In-memory Render Task Store
// Manages render task state (MVP: no database, no persistence)
// ============================================================

import type { Project } from '../types';

export interface RenderTask {
  id: string;
  projectId: string;
  project: Project;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-1
  currentFrame: number;
  totalFrames: number;
  videoUrl: string | null;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
}

// Use globalThis to survive HMR in development
const globalStore = globalThis as unknown as {
  __vfRenderStore?: Map<string, RenderTask>;
};

if (!globalStore.__vfRenderStore) {
  globalStore.__vfRenderStore = new Map();
}

const store = globalStore.__vfRenderStore;

export function createRenderTask(project: Project): RenderTask {
  const id = `r_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const task: RenderTask = {
    id,
    projectId: project.id || 'untitled',
    project,
    status: 'queued',
    progress: 0,
    currentFrame: 0,
    totalFrames: 0,
    videoUrl: null,
    error: null,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
  store.set(id, task);
  return task;
}

export function getRenderTask(id: string): RenderTask | undefined {
  return store.get(id);
}

export function updateRenderTask(id: string, updates: Partial<RenderTask>): RenderTask | undefined {
  const task = store.get(id);
  if (!task) return undefined;
  Object.assign(task, updates);
  return task;
}

/**
 * Clean up old render tasks (older than 1 hour).
 * Called on each new render submission.
 */
export function cleanupOldTasks(): void {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  for (const [id, task] of store.entries()) {
    const createdAt = new Date(task.createdAt).getTime();
    if (now - createdAt > oneHour) {
      store.delete(id);
    }
  }
}
