import seedrandom from 'seedrandom';
import type { Dataset, GTrial, Parameter, ResultDef } from '@/features/graphs/types';

/**
 * Demo dataset that reproduces the reference screenshots: a stearate-soap cosmetic cream,
 * 22 complete trials + T23 pending, 28 parameters, 6 results. Deterministic (seed 'helix-demo').
 * Demo data — for R&D to confirm.
 */

const LEVERS = ['water', 'stearic', 'tea'];
const P = (id: string, name: string, min: number, max: number, unit = '% w/w', kind: Parameter['kind'] = 'ingredient', group?: string): Parameter => ({ id, name, unit, kind, min, max, group, lever: LEVERS.includes(id) });

export const CREAM_PARAMS: Parameter[] = [
  P('water', 'Distilled Water', 55, 68, '% w/w', 'ingredient', 'Aqueous'),
  P('stearic', 'Stearic Acid', 6, 16, '% w/w', 'ingredient', 'Emulsifier system'),
  P('tea', 'Triethanolamine (forms soap with stearic acid)', 1.5, 2.5, '% w/w', 'ingredient', 'Emulsifier system'),
  P('cetyl', 'Cetyl Alcohol', 1, 4, '% w/w', 'ingredient', 'Thickener'),
  P('cetearyl', 'Cetearyl Alcohol', 0, 3, '% w/w', 'ingredient', 'Thickener'),
  P('gms', 'Glyceryl Monostearate', 0.5, 3, '% w/w', 'ingredient', 'Emulsifier system'),
  P('glycerin', 'Glycerin', 2, 8, '% w/w', 'ingredient', 'Humectant'),
  P('pg', 'Propylene Glycol', 0, 4, '% w/w', 'ingredient', 'Humectant'),
  P('mineral', 'Mineral Oil', 2, 10, '% w/w', 'ingredient', 'Oil phase'),
  P('ipm', 'Isopropyl Myristate', 0, 5, '% w/w', 'ingredient', 'Oil phase'),
  P('dimethicone', 'Dimethicone', 0, 2, '% w/w', 'ingredient', 'Oil phase'),
  P('shea', 'Shea Butter', 0, 3, '% w/w', 'ingredient', 'Oil phase'),
  P('coconut', 'Coconut Oil', 0, 3, '% w/w', 'ingredient', 'Oil phase'),
  P('lanolin', 'Lanolin', 0, 2, '% w/w', 'ingredient', 'Oil phase'),
  P('beeswax', 'Beeswax', 0, 2, '% w/w', 'ingredient', 'Thickener'),
  P('xanthan', 'Xanthan Gum', 0, 0.4, '% w/w', 'ingredient', 'Thickener'),
  P('carbomer', 'Carbomer', 0, 0.3, '% w/w', 'ingredient', 'Thickener'),
  P('ps60', 'Polysorbate 60', 0, 2, '% w/w', 'ingredient', 'Emulsifier system'),
  P('sorbitan', 'Sorbitan Stearate', 0, 2, '% w/w', 'ingredient', 'Emulsifier system'),
  P('allantoin', 'Allantoin', 0, 0.5, '% w/w', 'ingredient', 'Actives'),
  P('panthenol', 'Panthenol', 0, 1, '% w/w', 'ingredient', 'Actives'),
  P('tocopherol', 'Tocopherol', 0, 0.5, '% w/w', 'ingredient', 'Actives'),
  P('phenoxy', 'Phenoxyethanol', 0.5, 1, '% w/w', 'ingredient', 'Preservative'),
  P('ehg', 'Ethylhexylglycerin', 0, 0.3, '% w/w', 'ingredient', 'Preservative'),
  P('edta', 'Disodium EDTA', 0, 0.1, '% w/w', 'ingredient', 'Preservative'),
  P('fragrance', 'Fragrance', 0, 0.5, '% w/w', 'ingredient', 'Sensory'),
  P('speed', 'Mixing Speed', 500, 2000, 'rpm', 'process', 'Process'),
  P('temp', 'Emulsification Temp', 65, 80, '°C', 'process', 'Process'),
];

export const CREAM_RESULTS: ResultDef[] = [
  // Ph is the primary objective in the demo; the screenshots colour by it with orange = high
  { id: 'ph', name: 'Ph', unit: '', direction: 'maximize', target: 6.5, tolerance: 1, weight: 2, primary: true, must: true },
  { id: 'viscosity', name: 'Viscosity', unit: 'cP', direction: 'target', target: 18000, tolerance: 4000, weight: 1, must: true },
  { id: 'stability', name: 'Stability', unit: 'days @ 45 °C', direction: 'maximize', weight: 1.5 },
  { id: 'spread', name: 'Spreadability', unit: 'mm', direction: 'maximize', weight: 0.5 },
  { id: 'droplet', name: 'Droplet Size', unit: 'µm', direction: 'minimize', weight: 1 },
  { id: 'cost', name: 'Cost', unit: '₹/kg', direction: 'minimize', weight: 1 },
];

const PRICE: Record<string, number> = {
  water: 0.5, stearic: 140, tea: 180, cetyl: 260, cetearyl: 240, gms: 220, glycerin: 120, pg: 150, mineral: 110, ipm: 260, dimethicone: 600, shea: 520, coconut: 220,
  lanolin: 480, beeswax: 700, xanthan: 1400, carbomer: 1800, ps60: 300, sorbitan: 320, allantoin: 1200, panthenol: 2200, tocopherol: 2600, phenoxy: 650, ehg: 2400, edta: 400, fragrance: 3000,
};

/** Trials pinned to the reference screenshots: water, stearic, TEA → Ph. */
const PINS: Record<number, { w: number; s: number; tea?: number; ph: number }> = {
  4: { w: 64.1, s: 11.1, tea: 2.0, ph: 7.6 },
  8: { w: 58.3, s: 14.1, ph: 4.9 },
  11: { w: 66.0, s: 6.6, ph: 6.85 },
  13: { w: 55.7, s: 15.8, ph: 4.97 },
  19: { w: 59.93, s: 10.0, tea: 2.1, ph: 6.06 },
  20: { w: 55.2, s: 13.0, ph: 5.02 },
};

const r2 = (n: number) => Math.round(n * 100) / 100;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function gauss(rnd: () => number) {
  const u = Math.max(1e-9, rnd());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd());
}

export function phTruth(w: number, s: number, tea: number, glycerin: number) {
  return 5.55 + 1.9 * Math.exp(-(((w - 64.2) / 1.1) ** 2 + ((s - 11.2) / 1.0) ** 2)) + 0.7 * Math.exp(-(((w - 66.0) / 1.3) ** 2 + ((s - 6.6) / 1.2) ** 2)) + 0.25 * (tea - 2.0) + 0.04 * (glycerin - 5);
}

const FREE = CREAM_PARAMS.filter((p) => p.kind === 'ingredient' && !['water', 'stearic', 'tea'].includes(p.id));

/** Fill the free ingredients so the recipe sums to exactly 100 %. */
function recipe(rnd: () => number, w: number, s: number, tea: number, base?: Record<string, number>): Record<string, number> {
  // sampled near the room they need, so per-trial rescaling stays small and free ingredients don't mirror water
  const free = Object.fromEntries(FREE.map((p) => [p.id, base?.[p.id] ?? p.min + rnd() * 0.75 * (p.max - p.min)]));
  const room = 100 - w - s - tea;
  const sum = Object.values(free).reduce((a, b) => a + b, 0);
  const out: Record<string, number> = { water: r2(w), stearic: r2(s), tea: r2(tea) };
  for (const p of FREE) out[p.id] = r2((free[p.id] * room) / sum);
  const total = Object.values(out).reduce((a, b) => a + b, 0);
  out.glycerin = r2(out.glycerin + (100 - total));
  return out;
}

export function creamResults(p: Record<string, number>, rnd: () => number, ph?: number): Record<string, number> {
  const n = () => gauss(rnd);
  const viscosity = 9000 + 900 * (p.stearic - 6) + 1500 * p.cetyl + 15000 * p.xanthan + 20000 * p.carbomer - 300 * (p.water - 60) + 800 * n();
  const cost = Object.entries(PRICE).reduce((a, [k, v]) => a + ((p[k] ?? 0) * v) / 100, 0) + (p.speed / 2000) * 4;
  return {
    ph: r2(ph ?? phTruth(p.water, p.stearic, p.tea, p.glycerin) + 0.08 * n()),
    viscosity: Math.round(viscosity),
    stability: r2(Math.max(3, 20 + 25 * Math.exp(-(((p.water - 63) / 4) ** 2)) + 6 * p.ps60 + 4 * p.gms + 10 * p.xanthan + 1.5 * n())),
    spread: r2(40 + 3 * p.mineral + 2 * p.ipm - 0.0008 * (viscosity - 15000) + n()),
    droplet: r2(Math.max(0.5, 8 - 0.002 * (p.speed - 500) + 0.15 * (p.stearic - 10) - p.ps60 + 0.3 * n())),
    cost: r2(cost),
  };
}

export function buildCream22(): Dataset {
  const rnd = seedrandom('helix-demo');
  const trials: GTrial[] = [];
  const start = Date.UTC(2026, 7, 3);
  for (let i = 1; i <= 23; i++) {
    const pin = PINS[i];
    // iteration 1 explores at random; iterations 2–3 were guided toward the promising regions
    const guided = i > 8 && !pin;
    const minor = guided && i % 4 === 1;
    const w = pin?.w ?? (guided ? clamp((minor ? 66.0 : 64.0) + gauss(rnd) * 1.4, 55.2, 67.8) : 55.5 + rnd() * 12);
    // iteration 1 trades water against stearic acid (oil/water series)
    const s = pin?.s ?? (guided ? clamp((minor ? 6.8 : 11.0) + gauss(rnd) * 1.5, 6.1, 15.9) : clamp(72.5 - w + (rnd() - 0.5) * 8, 6.2, 15.8));
    const tea = pin?.tea ?? 1.5 + rnd();
    const params = {
      ...recipe(rnd, w, s, tea),
      speed: Math.round((500 + rnd() * 1500) / 50) * 50,
      temp: Math.round(65 + rnd() * 15),
    };
    const pending = i === 23;
    const iteration = i <= 8 ? 1 : i <= 16 ? 2 : i <= 22 ? 3 : 4;
    trials.push({
      id: `T${i}`,
      label: `T${i}`,
      name: `Trial ${i}`,
      iteration,
      createdAt: new Date(start + i * 86400000 * 1.5).toISOString(),
      createdBy: i % 5 === 0 ? { kind: 'user', id: 'Saijal R.' } : { kind: 'agent', id: 'mixer' },
      params,
      results: pending ? Object.fromEntries(CREAM_RESULTS.map((r) => [r.id, null])) : creamResults(params, rnd, pin?.ph),
      status: pending ? 'pending' : 'complete',
    });
  }
  const t4 = trials[3].params;
  const qParams = { ...recipe(rnd, 64.25, 10.6, 2.3, t4), speed: t4.speed, temp: t4.temp };
  return {
    id: 'cream22',
    title: 'Cosmetic cream — stearate soap emulsion',
    parameters: CREAM_PARAMS,
    results: CREAM_RESULTS,
    trials,
    // the reference Q Suggestion; its predicted values come from the model once fitted
    suggestion: { id: 'Q1', params: qParams, predicted: {}, acquisition: { kind: 'EI', value: 0 }, rationale: [] },
    modelTrainedOn: 0,
    balanceId: 'water',
  };
}
