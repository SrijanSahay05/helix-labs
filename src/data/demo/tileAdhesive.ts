import seedrandom from 'seedrandom';
import type { Dataset, GTrial, Parameter, ResultDef } from '@/features/graphs/types';
import type { Project } from '@/types';
import { MAT } from '@/data/rawMaterials';
import { PROP } from '@/data/properties';
import { SCENARIO } from '@/data/scenarios';
import { costPerKg } from '@/lib/cost';

/** Tile-adhesive demo (main prompt §12.4): T1–T5 measured, T6 pending. Demo data — for R&D to confirm. */

const MATS = ['opc53', 'sand', 'caco3', 'vae-rdp', 'mhec', 'ca-formate', 'starch-ether', 'defoamer'];
const RECIPES: Record<string, number[]> = {
  T1: [33.0, 58.95, 3.5, 3.5, 0.35, 0.65, 0.03, 0.02],
  T2: [33.0, 58.45, 3.5, 4.0, 0.35, 0.65, 0.03, 0.02],
  T3: [33.0, 58.25, 3.5, 4.0, 0.4, 0.8, 0.03, 0.02],
  T4: [35.0, 56.75, 2.5, 4.5, 0.4, 0.8, 0.03, 0.02],
  T5: [33.0, 57.85, 3.5, 4.6, 0.4, 0.6, 0.03, 0.02],
  T6: [33.0, 57.65, 3.5, 4.8, 0.4, 0.6, 0.03, 0.02],
};
const RESULTS: Record<string, Record<string, number> | null> = {
  T1: { heat: 0.78, deform: 2.1, initial: 1.12, water: 0.92, slip: 0.4 },
  T2: { heat: 0.88, deform: 2.4, initial: 1.28, water: 1.04, slip: 0.35 },
  T3: { heat: 0.94, deform: 2.6, initial: 1.34, water: 1.08, slip: 0.3 },
  T4: { heat: 0.97, deform: 2.7, initial: 1.41, water: 1.12, slip: 0.45 },
  T5: { heat: 1.06, deform: 2.9, initial: 1.38, water: 1.12, slip: 0.3 },
  T6: null,
};

const RANGE: Record<string, [number, number]> = {
  opc53: [32, 36], sand: [55, 60], caco3: [2.5, 3.5], 'vae-rdp': [3.5, 5], mhec: [0.3, 0.4], 'ca-formate': [0.5, 1.0], 'starch-ether': [0.03, 0.03], defoamer: [0.02, 0.02],
};

export const TILE_RESULTS: ResultDef[] = [
  { id: 'heat', name: 'Adhesion — heat ageing', unit: 'N/mm²', direction: 'maximize', target: 1.0, weight: 2, primary: true, must: true },
  { id: 'deform', name: 'Transverse deformation', unit: 'mm', direction: 'maximize', target: 2.5, weight: 1.5, must: true },
  { id: 'initial', name: 'Adhesion — initial', unit: 'N/mm²', direction: 'maximize', target: 1.0, weight: 1 },
  { id: 'water', name: 'Adhesion — water immersion', unit: 'N/mm²', direction: 'maximize', target: 1.0, weight: 1, must: true },
  { id: 'slip', name: 'Slip', unit: 'mm', direction: 'minimize', target: 0.5, weight: 0.5 },
  { id: 'cost', name: 'Cost', unit: '₹/kg', direction: 'minimize', target: 18, weight: 1 },
];

function params(): Parameter[] {
  return MATS.map((m) => ({ id: m, name: MAT[m]?.name ?? m, unit: '% w/w', kind: 'ingredient', min: RANGE[m][0], max: RANGE[m][1], lever: ['vae-rdp', 'ca-formate', 'mhec'].includes(m) }));
}

export function buildTileAdhesive(): Dataset {
  const trials: GTrial[] = Object.entries(RECIPES).map(([id, r], i) => {
    const p = Object.fromEntries(MATS.map((m, k) => [m, r[k]]));
    const res = RESULTS[id];
    return {
      id,
      label: id,
      name: `Trial ${id.slice(1)}`,
      iteration: i < 4 ? 1 : 2,
      createdAt: new Date(Date.UTC(2026, 8, 1 + i * 3)).toISOString(),
      createdBy: { kind: 'agent', id: i < 4 ? 'mixer' : 'analyst' },
      params: p,
      results: res ? { ...res, cost: Math.round(costPerKg(p) * 100) / 100 } : Object.fromEntries(TILE_RESULTS.map((x) => [x.id, null])),
      status: res ? 'complete' : 'pending',
    };
  });
  return { id: 'tile', title: 'Exterior tile adhesive (demo)', parameters: params(), results: TILE_RESULTS, trials, modelTrainedOn: 0, balanceId: 'sand' };
}

/** Synthetic 2 000-trial dataset for the performance check. */
export function buildSynthetic(n = 2000): Dataset {
  const rnd = seedrandom('helix-synthetic');
  const parameters: Parameter[] = Array.from({ length: 8 }, (_, i) => ({ id: `x${i + 1}`, name: `Factor ${i + 1}`, unit: i < 6 ? '% w/w' : 'rpm', kind: i < 6 ? 'ingredient' : 'process', min: 0, max: i < 6 ? 10 : 2000 }));
  const results: ResultDef[] = [
    { id: 'y1', name: 'Response A', unit: '', direction: 'maximize', weight: 1, primary: true },
    { id: 'y2', name: 'Response B', unit: '', direction: 'minimize', weight: 1 },
    { id: 'y3', name: 'Response C', unit: '', direction: 'target', target: 50, tolerance: 10, weight: 1 },
  ];
  const trials: GTrial[] = Array.from({ length: n }, (_, i) => {
    const p = Object.fromEntries(parameters.map((q) => [q.id, Math.round((q.min + rnd() * (q.max - q.min)) * 100) / 100]));
    const y1 = Math.sin(p.x1 / 2) * 3 + Math.cos(p.x2 / 3) * 2 + p.x3 * 0.2 + rnd() * 0.3;
    return {
      id: `T${i + 1}`,
      label: `T${i + 1}`,
      name: `Trial ${i + 1}`,
      iteration: 1 + Math.floor(i / 200),
      createdAt: new Date(Date.UTC(2026, 0, 1) + i * 3600000).toISOString(),
      createdBy: { kind: 'agent', id: 'mixer' },
      params: p,
      results: { y1: Math.round(y1 * 100) / 100, y2: Math.round((p.x4 * 3 + p.x5 + rnd() * 2) * 100) / 100, y3: Math.round((40 + p.x6 * 2 + rnd() * 5) * 100) / 100 },
      status: 'complete',
    };
  });
  return { id: 'synthetic', title: 'Synthetic 2 000 trials (performance)', parameters, results, trials, modelTrainedOn: 0, balanceId: 'x1' };
}

/** The open project's own trials and lab results. */
export function datasetFromProject(p: Project): Dataset {
  const s = SCENARIO[p.scenarioId];
  const mats = [...new Set(p.trials.flatMap((t) => Object.keys(t.recipe)))];
  const parameters: Parameter[] = mats.map((m) => {
    const vals = p.trials.map((t) => t.recipe[m] ?? 0);
    return { id: m, name: MAT[m]?.name ?? m, unit: '% w/w', kind: 'ingredient', min: Math.min(...vals), max: Math.max(...vals), lever: m === s?.leverMaterial || m === 'ca-formate' || m === 'mhec' };
  });
  const props = s?.measured ?? [];
  const results: ResultDef[] = [
    ...props.map((pid, i): ResultDef => {
      const t = p.targets.find((x) => x.propertyId === pid);
      const v = t ? (Array.isArray(t.value) ? t.value[0] : t.value) : undefined;
      const dir = t?.operator === '<=' ? 'minimize' : t?.operator === 'between' ? 'target' : 'maximize';
      return { id: pid, name: PROP[pid]?.name ?? pid, unit: PROP[pid]?.unit ?? '', direction: dir, target: v, weight: t?.priority === 'must' ? 2 : 1, primary: pid === (p.top3[0] ?? props[0]) || (i === 0 && !props.includes(p.top3[0])), must: t?.priority === 'must' };
    }),
    { id: 'cost', name: 'Cost', unit: '₹/kg', direction: 'minimize', target: p.constraints.costCeiling, weight: 1 },
  ];
  const trials: GTrial[] = p.trials.map((t) => {
    const rs = p.results.filter((r) => r.trialId === t.id);
    const pending = !rs.length || rs.every((r) => r.status === 'pending');
    return {
      id: t.id,
      label: t.id,
      name: `Trial ${t.id.replace(/\D/g, '')}`,
      iteration: t.iteration,
      createdAt: p.updated,
      createdBy: { kind: 'agent', id: 'mixer' },
      params: Object.fromEntries(mats.map((m) => [m, t.recipe[m] ?? 0])),
      results: {
        ...Object.fromEntries(props.map((pid) => {
          const r = rs.find((x) => x.propertyId === pid);
          return [pid, r && r.status !== 'pending' && Number.isFinite(r.mean) ? r.mean : null];
        })),
        cost: Math.round(costPerKg(t.recipe) * 100) / 100,
      },
      status: pending ? 'pending' : 'complete',
    };
  });
  return { id: `project:${p.id}`, title: p.name, parameters, results, trials, modelTrainedOn: 0, balanceId: s?.balanceMaterial };
}
