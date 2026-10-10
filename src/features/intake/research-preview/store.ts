import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { buildResearch, type RRoute, type RSource, type RType } from '@/data/demo/research';
import { SCENARIO } from '@/data/scenarios';
import { useUI } from '@/store/ui';
import { prefersReducedMotion } from '@/lib/motion';
import type { Pathway, Project, Source } from '@/types';
import { END, STEPS } from './script';

/* ------------------------------------------------------------ playback (not persisted) */

interface Playback {
  step: number;
  /** progress inside the step, 0 → 1 */
  t: number;
  playing: boolean;
  rate: 1 | 2;
  following: boolean;
  set: (p: Partial<Playback>) => void;
  goto: (step: number) => void;
  tick: (dtMs: number) => void;
  reset: () => void;
}

export const usePlayback = create<Playback>()((set, get) => ({
  step: 0,
  t: 0,
  playing: true,
  rate: 1,
  following: true,
  set: (p) => set(p),
  goto: (step) => {
    const s = Math.max(0, Math.min(END, step));
    set({ step: s, t: s === END ? 1 : 0, playing: s === END ? false : get().playing, following: true });
  },
  tick: (dt) => {
    const { step, t, playing, rate } = get();
    if (!playing || step >= END) return;
    const app = useUI.getState().speed;
    if (app === 'instant') return set({ step: END, t: 1, playing: false });
    const nt = t + (dt * rate * app) / STEPS[step].ms;
    if (nt < 1) return set({ t: nt });
    const ns = step + 1;
    set({ step: ns, t: ns >= END ? 1 : 0, playing: ns < END });
  },
  reset: () => set({ step: 0, t: 0, playing: true, following: true }),
}));

export function isReduced(): boolean {
  return prefersReducedMotion() || useUI.getState().botMotion === 'still';
}

export function useReduced(): boolean {
  const still = useUI((s) => s.botMotion === 'still');
  return still || prefersReducedMotion();
}

/** Progress of a step: 0 before, 1 after, live while running. Reduced motion renders the final state of a started step. */
export function useProg(i: number, quant = 0): number {
  const reduced = useReduced();
  return usePlayback((s) => {
    if (s.step > i) return 1;
    if (s.step < i) return 0;
    if (reduced) return 1;
    return quant ? Math.round(s.t * quant) / quant : s.t;
  });
}

export function useStep(): number {
  return usePlayback((s) => s.step);
}

/* ------------------------------------------------------------ interaction (not persisted) */

interface Interaction {
  hoverSource?: string;
  selectSource?: string;
  /** a citation chip being hovered: highlights the node and the Sankey flow */
  hoverCite?: { sourceId: string; route?: string };
  hoverCluster?: number;
  hoverRoute?: string;
  hiddenTypes: RType[];
  openSource?: string;
  set: (p: Partial<Omit<Interaction, 'set'>>) => void;
}

export const useInteract = create<Interaction>()((set) => ({
  hiddenTypes: [],
  set: (p) => set(p),
}));

/* ------------------------------------------------------------ choices (persisted, carry over) */

interface Choices {
  draftId?: string;
  scenarioId: string;
  pinned: string[];
  excluded: string[];
  uploads: RSource[];
  selected?: string;
  compare: string[];
  /** base route id → prompt */
  variants: Record<string, string>;
  reconsidered: string[];
  ensure: (draftId: string, scenarioId: string) => void;
  togglePin: (id: string) => void;
  toggleExclude: (id: string) => void;
  addUpload: (s: RSource) => void;
  select: (id?: string) => void;
  toggleCompare: (id: string) => void;
  addVariant: (base: string, prompt: string) => void;
  reconsider: (id: string) => void;
}

const fresh = (draftId: string | undefined, scenarioId: string) => ({ draftId, scenarioId, pinned: [], excluded: [], uploads: [], selected: undefined, compare: [], variants: {}, reconsidered: [] });

export const useChoices = create<Choices>()(
  persist(
    (set, get) => ({
      ...fresh(undefined, 'tile'),
      ensure: (draftId, scenarioId) => {
        const s = get();
        if (s.draftId !== draftId || s.scenarioId !== scenarioId) set(fresh(draftId, scenarioId));
      },
      togglePin: (id) => set((s) => ({ pinned: s.pinned.includes(id) ? s.pinned.filter((x) => x !== id) : [...s.pinned, id], excluded: s.excluded.filter((x) => x !== id) })),
      toggleExclude: (id) => set((s) => ({ excluded: s.excluded.includes(id) ? s.excluded.filter((x) => x !== id) : [...s.excluded, id], pinned: s.pinned.filter((x) => x !== id) })),
      addUpload: (src) => set((s) => ({ uploads: [...s.uploads, src] })),
      select: (id) => set({ selected: id }),
      toggleCompare: (id) => set((s) => ({ compare: s.compare.includes(id) ? s.compare.filter((x) => x !== id) : s.compare.length < 3 ? [...s.compare, id] : s.compare })),
      addVariant: (base, prompt) => set((s) => ({ variants: { ...s.variants, [base]: prompt } })),
      reconsider: (id) => set((s) => ({ reconsidered: s.reconsidered.includes(id) ? s.reconsidered : [...s.reconsidered, id] })),
    }),
    { name: 'helix:v1:research-preview', version: 1 },
  ),
);

/** "Make it cheaper by 10 %" → a P1-b route (same maths as the Pathways stage variant). */
export function makeVariant(base: RRoute, prompt: string): RRoute {
  const cheaper = /cheap|cost|lower|price/i.test(prompt);
  const pct = Number(prompt.match(/(\d+)\s*%/)?.[1] ?? 10) / 100;
  const leverIdx = base.composition.findIndex((c) => /rdp|polymer|active|pce/i.test(c.materialId));
  return {
    ...base,
    id: `${base.id}-b`,
    rank: base.rank,
    name: `${base.name} — ${prompt.slice(0, 48)}`,
    plain: cheaper ? `${base.plain}, ${Math.round(pct * 100)} % cheaper` : base.plain,
    costPerKg: Math.round(base.costPerKg * (cheaper ? 1 - pct : 1.04) * 10) / 10,
    composition: base.composition.map((c, i) => (i === leverIdx && cheaper ? { ...c, range: [Math.round(c.range[0] * (1 - pct) * 100) / 100, Math.round(c.range[1] * (1 - pct) * 100) / 100] } : c)),
    predicted: base.predicted.map((p) => {
      if (!cheaper) return p;
      const v = Math.round((p.op === '>=' ? p.value * (1 - pct / 3) : p.value) * 100) / 100;
      const pass = p.op === '>=' ? v >= p.target : v <= p.target;
      const border = p.op === '>=' ? v >= p.target * 0.9 : v <= p.target * 1.1;
      return { ...p, value: v, status: pass ? 'pass' : border ? 'borderline' : 'fail' };
    }),
    scores: { ...base.scores, cost: Math.min(1, base.scores.cost + (cheaper ? pct : -0.03)), targetMatch: Math.round((base.scores.targetMatch - (cheaper ? pct / 2 : 0)) * 100) / 100, overall: Math.round((base.scores.overall - (cheaper ? 0.02 : 0)) * 100) / 100 },
  };
}

/**
 * Carry the preview's pins, exclusions, uploads, selection, compare list and variants into a project.
 * Idempotent; call after the Literature stage has filled `project.sources` and again after Pathways has filled `project.pathways`.
 */
export function applyResearchPreviewChoices(project: Project): Project {
  const c = useChoices.getState();
  if (c.scenarioId !== project.scenarioId) return project;
  const data = buildResearch(project.scenarioId);
  const byId = new Map<string, RSource>([...data.sources, ...c.uploads].map((s) => [s.id, s]));
  const sources = [...project.sources];
  const toSource = (r: RSource): Source => ({ id: `rp-${r.ref}`, type: r.type, title: r.title, year: r.year, relevance: r.relevance, finding: r.finding, cluster: data.clusters[r.cluster]?.name ?? 'Uploaded', snippet: r.snippet, extracted: r.extracted });
  const upsert = (r: RSource, patch: Partial<Source>) => {
    const i = sources.findIndex((s) => s.id === r.projectSourceId || s.id === `rp-${r.ref}`);
    if (i >= 0) sources[i] = { ...sources[i], ...patch };
    else if (project.sources.length || r.type === 'Uploaded') sources.push({ ...toSource(r), ...patch });
  };
  c.uploads.forEach((u) => upsert(u, { pinned: c.pinned.includes(u.id), excluded: c.excluded.includes(u.id) }));
  c.pinned.forEach((id) => byId.get(id) && upsert(byId.get(id)!, { pinned: true, excluded: false }));
  c.excluded.forEach((id) => byId.get(id) && upsert(byId.get(id)!, { excluded: true, pinned: false }));

  let pathways = project.pathways;
  if (pathways.length) {
    const s = SCENARIO[project.scenarioId];
    Object.entries(c.variants).forEach(([baseId, prompt]) => {
      const base = pathways.find((p) => p.id === baseId);
      if (!base || pathways.some((p) => p.id === `${baseId}-b`)) return;
      const cheaper = /cheap|cost|lower|price/i.test(prompt);
      const pct = Number(prompt.match(/(\d+)\s*%/)?.[1] ?? 10) / 100;
      const v: Pathway = {
        ...base,
        id: `${baseId}-b`,
        variantOf: baseId,
        name: `${base.name} — variant (${prompt.slice(0, 40)})`,
        composition: base.composition.map((x) => (x.materialId === s?.leverMaterial && cheaper ? { ...x, range: [Math.round(x.range[0] * (1 - pct) * 100) / 100, Math.round(x.range[1] * (1 - pct) * 100) / 100] } : x)),
        costPerKg: Math.round(base.costPerKg * (cheaper ? 1 - pct : 1.04) * 100) / 100,
      };
      pathways = [...pathways, v];
    });
  }
  const ids = new Set(pathways.map((p) => p.id));
  return {
    ...project,
    sources,
    pathways,
    selectedPathway: c.selected && ids.has(c.selected) ? c.selected : project.selectedPathway,
    compare: c.compare.some((x) => ids.has(x)) ? c.compare.filter((x) => ids.has(x)) : project.compare,
  };
}
