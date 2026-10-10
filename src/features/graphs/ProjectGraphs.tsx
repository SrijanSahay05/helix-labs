import { useMemo } from 'react';
import type { Project, Trial } from '@/types';
import { useProjects } from '@/store/project';
import { useUI } from '@/store/ui';
import { buildCream22 } from '@/data/demo/cream22';
import { buildSynthetic, buildTileAdhesive, datasetFromProject } from '@/data/demo/tileAdhesive';
import { SCENARIO } from '@/data/scenarios';
import { pendingResults } from '@/lib/simulate';
import { balanceTo100 } from '@/lib/cost';
import { GraphsCard } from './GraphsCard';
import type { Dataset } from './types';

let cream: Dataset | null = null;
const creamDs = () => (cream ??= buildCream22());

/** Dataset for the Graphs panel: the demo cream by default; the dev switcher (⌘⇧D) picks others and forces states. */
export function useGraphsDataset(p: Project): { ds: Dataset; key: string; isProject: boolean } {
  const choice = useUI((s) => s.graphsDataset);
  const trials = p.trials;
  const results = p.results;
  return useMemo(() => {
    const c = creamDs();
    const variant = (id: string, title: string, fn: (d: Dataset) => Dataset) => fn({ ...c, id, title, trials: c.trials.map((t) => ({ ...t, results: { ...t.results } })) });
    switch (choice) {
      case 'tile':
        return { ds: buildTileAdhesive(), key: `${p.id}:tile`, isProject: false };
      case 'synthetic':
        return { ds: buildSynthetic(), key: `${p.id}:synthetic`, isProject: false };
      case 'project':
        return { ds: datasetFromProject({ ...p, trials, results }), key: `${p.id}:project`, isProject: true };
      case 'empty':
        return { ds: variant('cream-empty', 'Cosmetic cream — no results yet', (d) => ({ ...d, suggestion: undefined, trials: d.trials.map((t) => ({ ...t, status: 'pending', results: Object.fromEntries(Object.keys(t.results).map((k) => [k, null])) })) })), key: `${p.id}:empty`, isProject: false };
      case 'few':
        return { ds: variant('cream-few', 'Cosmetic cream — 2 trials', (d) => ({ ...d, suggestion: undefined, trials: [d.trials[3], d.trials[18]] })), key: `${p.id}:few`, isProject: false };
      case 'lowconf':
        return { ds: variant('cream-low', 'Cosmetic cream — 7 trials', (d) => ({ ...d, trials: d.trials.slice(0, 7) })), key: `${p.id}:lowconf`, isProject: false };
      case 'missing':
        return { ds: variant('cream-missing', 'Cosmetic cream — 3 viscosity values missing', (d) => ({ ...d, trials: d.trials.map((t) => (['T3', 'T7', 'T15'].includes(t.id) ? { ...t, results: { ...t.results, viscosity: null } } : t)) })), key: `${p.id}:missing`, isProject: false };
      case 'failed':
        return { ds: variant('cream-failed', 'Cosmetic cream — T22 failed', (d) => ({ ...d, trials: d.trials.map((t) => (t.id === 'T22' ? { ...t, status: 'failed', results: Object.fromEntries(Object.keys(t.results).map((k) => [k, null])) } : t)) })), key: `${p.id}:failed`, isProject: false };
      default:
        return { ds: c, key: `${p.id}:cream22`, isProject: false };
    }
  }, [choice, p, trials, results]);
}

/** Graphs card for a project stage (Results or Analysis). */
export function ProjectGraphs({ p, placement, defaultCollapsed }: { p: Project; placement: 'results' | 'analysis'; defaultCollapsed?: boolean }) {
  const { ds, key, isProject } = useGraphsDataset(p);
  const forceRO = useUI((s) => s.graphsReadOnly);
  const readOnly = forceRO || p.stages.final === 'complete';
  const addToProject = (params: Record<string, number>, label: string) => {
    const s = SCENARIO[p.scenarioId];
    const recipe = balanceTo100(Object.fromEntries(Object.entries(params).filter(([, v]) => v > 0).map(([k, v]) => [k, Math.round(v * 100) / 100])), s.balanceMaterial);
    const trial: Trial = { id: label, iteration: p.iteration + 1, recipe, meta: Object.fromEntries(Object.keys(recipe).map((m) => [m, { by: 'helix' as const, agent: 'analyst' as const, confidence: 0.8, reason: 'Q Suggestion from Graphs' }])) };
    useProjects.getState().update(p.id, (x) => ({ ...x, trials: [...x.trials, trial], results: [...x.results, ...pendingResults(s, [trial])] }));
    useProjects.getState().log(p.id, 'helix', `Added ${label} from the Q Suggestion`, 'analyst');
  };
  return (
    <GraphsCard
      dataset={ds}
      storeKey={key}
      placement={placement}
      defaultView="2d"
      owner="analyst"
      defaultCollapsed={defaultCollapsed}
      readOnly={readOnly}
      onAddTrial={isProject ? addToProject : undefined}
      onOpenInTrials={isProject ? () => document.getElementById('trials')?.scrollIntoView({ behavior: 'smooth' }) : undefined}
    />
  );
}
