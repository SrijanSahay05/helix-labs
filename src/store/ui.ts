import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Mode, Role, StageId, StageStatus, StandardFamily } from '@/types';

export type DemoSpeed = 0.5 | 1 | 2 | 'instant';

interface UIState {
  theme: 'light' | 'dark';
  mode: Mode;
  modeRemembered: boolean;
  role: Role;
  userName: string;
  sidebarCollapsed: boolean;
  navOpen: boolean;
  askOpen: boolean;
  paletteOpen: boolean;
  devOpen: boolean;
  speed: DemoSpeed;
  standards: StandardFamily[];
  nonScientistOutput: 'spec' | 'full';
  usePastFormulations: boolean;
  autopilot: boolean;
  showReasoning: boolean;
  /** global bot motion: Lively / Calm (default) / Still */
  botMotion: 'lively' | 'calm' | 'still';
  /** dev: which dataset the Graphs panel shows, and forced states */
  graphsDataset: 'cream22' | 'tile' | 'project' | 'synthetic' | 'empty' | 'few' | 'lowconf' | 'missing' | 'failed';
  graphsReadOnly: boolean;
  /** Magic Start scenario: 'auto' routes by keyword, otherwise this scenario id is always used */
  demoScenario: string;
  /** dev state switcher overrides: `${projectId}:${stage}` → status */
  devStates: Record<string, StageStatus>;
  setTheme: (t: 'light' | 'dark') => void;
  setMode: (m: Mode, remember?: boolean) => void;
  set: (p: Partial<UIState>) => void;
  forceStage: (projectId: string, stage: StageId, s: StageStatus | null) => void;
}

export const useUI = create<UIState>()(
  persist(
    (set) => ({
      theme: 'light',
      mode: 'scientist',
      modeRemembered: false,
      role: 'chemist',
      userName: 'Saijal R.',
      sidebarCollapsed: false,
      navOpen: false,
      askOpen: false,
      paletteOpen: false,
      devOpen: false,
      speed: 1,
      standards: ['IS', 'EN'],
      nonScientistOutput: 'spec',
      usePastFormulations: false,
      autopilot: true,
      showReasoning: true,
      botMotion: 'calm',
      graphsDataset: 'cream22',
      graphsReadOnly: false,
      demoScenario: 'auto',
      devStates: {},
      setTheme: (theme) => set({ theme }),
      setMode: (mode, remember = true) => set((s) => ({ mode, modeRemembered: remember || s.modeRemembered })),
      set: (p) => set(p),
      forceStage: (projectId, stage, st) =>
        set((s) => {
          const next = { ...s.devStates };
          const k = `${projectId}:${stage}`;
          if (st) next[k] = st;
          else delete next[k];
          return { devStates: next };
        }),
    }),
    {
      name: 'helix:v1',
      partialize: (s) => {
        const { askOpen: _a, paletteOpen: _p, devOpen: _d, navOpen: _n, ...rest } = s;
        void _a; void _p; void _d; void _n;
        return rest;
      },
    },
  ),
);

export function speedFactor(): number {
  const s = useUI.getState().speed;
  return s === 'instant' ? Infinity : s;
}
