import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AIMeta, ActivityItem, Benchmark, Constraints, Mode, Project, StageId, StageStatus, TargetRow, UseCase } from '@/types';
import { seedProjects } from '@/data/projectFactory';
import { setIn } from '@/lib/path';
import { uid } from '@/lib/format';

export type IntakeStep = 'who' | 'category' | 'subcategory' | 'usecase' | 'benchmark' | 'preview' | 'targets' | 'constraints' | 'showcase' | 'review';
export const INTAKE_STEPS: IntakeStep[] = ['who', 'category', 'subcategory', 'usecase', 'benchmark', 'preview', 'targets', 'constraints', 'showcase', 'review'];

export interface Draft {
  id: string;
  request: string;
  source?: { kind: 'link' | 'pdf' | 'text'; value: string; domain?: string };
  scenarioId: string;
  mode?: Mode;
  group?: number;
  categoryId?: string;
  subcategoryId?: string;
  chemistry: string[];
  forms: string[];
  standard?: string;
  useCase: Partial<UseCase>;
  guided: Record<string, number>;
  benchmarks: Benchmark[];
  targets: TargetRow[];
  top3: string[];
  constraints: Partial<Constraints>;
  summary?: string;
  meta: Record<string, AIMeta>;
  done: Partial<Record<IntakeStep, boolean>>;
  magic: 'idle' | 'running' | 'done';
  runId?: string;
}

export const emptyDraft = (): Draft => ({
  id: uid('draft'),
  request: '',
  scenarioId: 'tile',
  chemistry: [],
  forms: [],
  useCase: {},
  guided: {},
  benchmarks: [],
  targets: [],
  top3: [],
  constraints: { materialLimits: [], compliance: [], mustHaves: [] },
  meta: {},
  done: {},
  magic: 'idle',
});

interface ProjectState {
  projects: Project[];
  draft: Draft;
  setDraft: (path: string, value: unknown, meta?: AIMeta) => void;
  patchDraft: (p: Partial<Draft>) => void;
  resetDraft: () => void;
  addProject: (p: Project) => void;
  update: (id: string, fn: (p: Project) => Project) => void;
  setStage: (id: string, stage: StageId, status: StageStatus, note?: string) => void;
  log: (id: string, who: ActivityItem['who'], text: string, agent?: ActivityItem['agent']) => void;
  deleteProject: (id: string) => void;
  resetAll: () => void;
}

export const useProjects = create<ProjectState>()(
  persist(
    (set) => ({
      projects: seedProjects(),
      draft: emptyDraft(),
      setDraft: (path, value, meta) =>
        set((s) => {
          let d = setIn(s.draft, path, value);
          if (meta) d = { ...d, meta: { ...d.meta, [path]: meta } };
          return { draft: d };
        }),
      patchDraft: (p) => set((s) => ({ draft: { ...s.draft, ...p } })),
      resetDraft: () => set({ draft: emptyDraft() }),
      addProject: (p) => set((s) => ({ projects: [p, ...s.projects] })),
      update: (id, fn) => set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...fn(p), updated: new Date().toISOString() } : p)) })),
      setStage: (id, stage, status, note) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id
              ? { ...p, stages: { ...p.stages, [stage]: status }, stageNotes: note !== undefined ? { ...p.stageNotes, [stage]: note } : p.stageNotes, updated: new Date().toISOString() }
              : p,
          ),
        })),
      log: (id, who, text, agent) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, activity: [{ id: uid('a'), at: new Date().toISOString(), who, text, ...(agent ? { agent } : {}) }, ...p.activity].slice(0, 200) } : p)),
        })),
      deleteProject: (id) => set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),
      resetAll: () => set({ projects: seedProjects(), draft: emptyDraft() }),
    }),
    { name: 'helix:v1:projects', version: 1 },
  ),
);

export function useProject(id?: string) {
  return useProjects((s) => s.projects.find((p) => p.id === id));
}
