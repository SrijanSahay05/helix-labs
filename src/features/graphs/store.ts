import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FitInfo } from './model/engine';
import type { GTrial, Suggestion, ViewId } from './types';

export type Colorscale = 'helix' | 'viridis' | 'cividis' | 'diverging';
export type DragMode = 'pan' | 'select' | 'lasso' | 'zoom';
export interface Camera3D {
  eye: { x: number; y: number; z: number };
  up?: { x: number; y: number; z: number };
  center?: { x: number; y: number; z: number };
}

export interface ViewState {
  view: ViewId;
  x?: string;
  y?: string;
  z?: string;
  colorBy?: string;
  sizeBy?: string | null;
  /** Surface / Contour: the modelled result (height and colour) */
  result?: string;
  slice: Record<string, number>;
  selection: string[];
  pinned: string[];
  hidden: string[];
  filters: { iteration?: [number, number]; status: ('complete' | 'pending' | 'failed')[]; ranges: Record<string, [number, number]> };
  showBest: boolean;
  showSuggestion: boolean;
  labels: 'auto' | 'all' | 'none';
  logX: boolean;
  logY: boolean;
  colorscale: Colorscale;
  pointSize: number;
  camera3d: Partial<Record<ViewId, Camera3D>>;
  surfaceOpacity: number;
  showUncertainty: 'off' | 'band' | 'color';
  showTrials: boolean;
  floorContours: boolean;
  dropLines: boolean;
  overlays: { trend: boolean; band: boolean; target: boolean; marginals: boolean; isoline: boolean; feasible: boolean; sigma: boolean; loadings: boolean };
  parallelDims: string[] | null;
  splomDims: string[] | null;
  pareto: [string, string] | null;
  ternary: [string, string, string] | null;
  progressBy: 'trial' | 'iteration';
  /** Bar chart: metric per trial and sort order */
  barMetric?: string;
  barSort: 'trial' | 'value';
  /** Pie chart: two recipes to compare and the "Other" threshold (% w/w) */
  pieLeft?: string;
  pieRight?: string;
  pieOther: number;
  /** axes Delta picked (chip "✦ Picked by Delta" until the user changes them) */
  picked: Partial<Record<'x' | 'y' | 'z' | 'colorBy' | 'result', boolean>>;
  collapsed: boolean;
  scrubber: boolean;
  iterMax?: number;
  tableView: boolean;
  dragmode: DragMode;
  autoRotate: boolean;
  /** suggestions turned into draft trials (demo datasets) */
  extraTrials: GTrial[];
  bestBy: 'primary' | 'overall';
}

export const defaultView = (): ViewState => ({
  view: '2d',
  slice: {},
  selection: [],
  pinned: [],
  hidden: [],
  filters: { status: ['complete', 'pending', 'failed'], ranges: {} },
  showBest: true,
  showSuggestion: true,
  labels: 'auto',
  logX: false,
  logY: false,
  colorscale: 'helix',
  pointSize: 1,
  camera3d: {},
  surfaceOpacity: 0.92,
  showUncertainty: 'off',
  showTrials: true,
  floorContours: true,
  dropLines: false,
  overlays: { trend: false, band: false, target: true, marginals: false, isoline: true, feasible: false, sigma: false, loadings: true },
  parallelDims: null,
  splomDims: null,
  pareto: null,
  ternary: null,
  progressBy: 'trial',
  barSort: 'trial',
  pieOther: 1,
  picked: {},
  collapsed: false,
  scrubber: false,
  tableView: false,
  dragmode: 'pan',
  autoRotate: false,
  extraTrials: [],
  bestBy: 'primary',
});

interface GraphsState {
  views: Record<string, ViewState>;
  patch: (key: string, p: Partial<ViewState> | ((v: ViewState) => Partial<ViewState>)) => void;
  reset: (key: string) => void;
}

/** Per-project view state (persisted): axes, selection, pins, overlays, camera. */
export const useGraphs = create<GraphsState>()(
  persist(
    (set) => ({
      views: {},
      patch: (key, p) =>
        set((s) => {
          const cur = { ...defaultView(), ...s.views[key] };
          return { views: { ...s.views, [key]: { ...cur, ...(typeof p === 'function' ? p(cur) : p) } } };
        }),
      reset: (key) => set((s) => ({ views: { ...s.views, [key]: { ...defaultView(), collapsed: s.views[key]?.collapsed ?? false } } })),
    }),
    { name: 'helix:v1:graphs', version: 1 },
  ),
);

export function useView(key: string): ViewState {
  const v = useGraphs((s) => s.views[key]);
  return v ? { ...defaultView(), ...v, overlays: { ...defaultView().overlays, ...v.overlays } } : DEFAULT;
}
const DEFAULT = defaultView();

export type Drawer =
  | { kind: 'trial'; id: string }
  | { kind: 'suggestion'; id: string }
  | { kind: 'traits'; ids: string[] }
  | null;

interface Runtime {
  hovered?: string;
  fitting: boolean;
  fitError?: string;
  fits: Record<string, FitInfo>;
  trainedOn: number;
  /** trials with results at the time of the last fit (stale when fewer than now) */
  suggestion: Suggestion | null;
  batch: Suggestion[];
  regenIndex: number;
  drawer: Drawer;
  importance: { paramId: string; score: number }[];
  /** where the primary result peaks (Delta's caption) */
  peak: { x: string; y: string; at: [number, number]; value: number } | null;
  introSeen: boolean;
  dismissedInsights: string[];
  /** bumped by Retry to re-run failed model requests */
  retry: number;
  /** dataset currently loaded (runtime resets when it changes) */
  hash?: string;
  set: (p: Partial<Runtime>) => void;
}

/** Session-only state shared by every mounted view: hover, fitting, suggestion, drawers. */
export const useGraphsRuntime = create<Runtime>()((set) => ({
  fitting: false,
  fits: {},
  trainedOn: 0,
  suggestion: null,
  batch: [],
  regenIndex: 0,
  drawer: null,
  importance: [],
  peak: null,
  introSeen: false,
  dismissedInsights: [],
  retry: 0,
  set: (p) => set(p),
}));

/** Collapsed state per card placement (Results vs Analysis), persisted. */
export const useGraphsCards = create<{ collapsed: Record<string, boolean>; toggle: (k: string, def: boolean) => void }>()(
  persist(
    (set) => ({
      collapsed: {},
      toggle: (k, def) => set((s) => ({ collapsed: { ...s.collapsed, [k]: !(s.collapsed[k] ?? def) } })),
    }),
    { name: 'helix:v1:graphs-cards' },
  ),
);

/** The dataset as the panel sees it: base trials plus suggestions turned into draft trials (demo datasets). */
export function withExtras<T extends { trials: GTrial[] }>(dataset: T, extra: GTrial[]): T {
  return extra.length ? { ...dataset, trials: [...dataset.trials, ...extra.filter((x) => !dataset.trials.some((t) => t.id === x.id))] } : dataset;
}
