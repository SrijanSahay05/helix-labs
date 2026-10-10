import { create } from 'zustand';
import type { RunState } from '@/agent/types';

interface TaskState {
  runs: Record<string, RunState>;
  order: string[];
  upsert: (r: RunState) => void;
  patch: (id: string, fn: (r: RunState) => Partial<RunState>) => void;
  remove: (id: string) => void;
}

export const useTasks = create<TaskState>()((set) => ({
  runs: {},
  order: [],
  upsert: (r) => set((s) => ({ runs: { ...s.runs, [r.id]: r }, order: s.order.includes(r.id) ? s.order : [r.id, ...s.order] })),
  patch: (id, fn) =>
    set((s) => {
      const r = s.runs[id];
      if (!r) return s;
      return { runs: { ...s.runs, [id]: { ...r, ...fn(r) } } };
    }),
  remove: (id) =>
    set((s) => {
      const runs = { ...s.runs };
      delete runs[id];
      return { runs, order: s.order.filter((x) => x !== id) };
    }),
}));

export function useRunningCount() {
  return useTasks((s) => Object.values(s.runs).filter((r) => r.status === 'running' || r.status === 'paused').length);
}
