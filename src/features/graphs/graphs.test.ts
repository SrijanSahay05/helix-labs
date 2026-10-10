import { describe, expect, it } from 'vitest';
import { buildCream22 } from '@/data/demo/cream22';
import { bestTrialId, desirability, dominates, hypervolume, ingredientTotal, overallDesirability, paretoFront, renormalise } from './selectors';
import { placeLabels, labelBox, overlaps, middleEllipsis } from './traces/labels';
import { fitGP, predict } from './model/gp';
import { ModelEngine } from './model/engine';
import seedrandom from 'seedrandom';

describe('desirability', () => {
  it('ramps for maximize / minimize and is two-sided for target', () => {
    const r = { min: 0, max: 10 };
    expect(desirability(10, { id: 'a', name: 'a', unit: '', direction: 'maximize', weight: 1 }, r)).toBe(1);
    expect(desirability(0, { id: 'a', name: 'a', unit: '', direction: 'maximize', weight: 1 }, r)).toBe(0);
    expect(desirability(0, { id: 'a', name: 'a', unit: '', direction: 'minimize', weight: 1 }, r)).toBe(1);
    const t = { id: 'a', name: 'a', unit: '', direction: 'target' as const, target: 5, tolerance: 1, weight: 1 };
    expect(desirability(5, t, r)).toBe(1);
    expect(desirability(6, t, r)).toBeCloseTo(0.5);
    expect(desirability(8, t, r)).toBe(0);
  });
  it('overall desirability is a weighted geometric mean in 0–1', () => {
    const ds = buildCream22();
    const d = overallDesirability(ds.trials[0], ds);
    expect(d).toBeGreaterThan(0);
    expect(d).toBeLessThanOrEqual(1);
  });
});

describe('demo dataset and best trial', () => {
  const ds = buildCream22();
  it('reproduces the reference: 22 complete + T23 pending, 28 parameters, 6 results', () => {
    expect(ds.trials.filter((t) => t.status === 'complete')).toHaveLength(22);
    expect(ds.trials.find((t) => t.id === 'T23')?.status).toBe('pending');
    expect(ds.parameters).toHaveLength(28);
    expect(ds.results).toHaveLength(6);
  });
  it('pins T4 as Best with Ph 7.6 and T19 at (59.93, 10.0) → 6.06', () => {
    expect(bestTrialId(ds)).toBe('T4');
    expect(ds.trials[3].results.ph).toBe(7.6);
    const t19 = ds.trials[18];
    expect([t19.params.water, t19.params.stearic, t19.results.ph]).toEqual([59.93, 10, 6.06]);
  });
  it('every recipe sums to 100 %', () => {
    for (const t of ds.trials) expect(ingredientTotal(t.params, ds.parameters)).toBeCloseTo(100, 1);
  });
});

describe('pareto', () => {
  const dirs: ['minimize', 'maximize'] = ['minimize', 'maximize'];
  it('dominance respects directions', () => {
    expect(dominates([1, 10], [2, 9], dirs)).toBe(true);
    expect(dominates([1, 9], [2, 10], dirs)).toBe(false);
    expect(dominates([1, 10], [1, 10], dirs)).toBe(false);
  });
  it('finds the front and its hypervolume', () => {
    const pts: [number, number][] = [
      [1, 5],
      [2, 8],
      [3, 9],
      [2.5, 6],
      [4, 9],
    ];
    const { front, dominatedCount } = paretoFront(pts, (p) => p, dirs);
    expect(front).toEqual([
      [1, 5],
      [2, 8],
      [3, 9],
    ]);
    expect(dominatedCount.get(pts[1])).toBe(1);
    // reference at worst observed (cost 4, stability 5): rectangles (4-3)*(9-5)+(4-2)*(8-5)... union = 3*... computed:
    expect(hypervolume(front, [4, 5], dirs)).toBeCloseTo(1 * 4 + 1 * 3, 6);
  });
});

describe('label collision avoidance', () => {
  it('nudges overlapping labels and hides the ones with no room', () => {
    const items = [
      { id: 'a', x: 100, y: 100, text: 'T1', priority: 1 },
      { id: 'b', x: 104, y: 100, text: 'T2' },
      { id: 'c', x: 300, y: 300, text: 'T3' },
    ];
    const res = placeLabels(items);
    expect(res.get('a')).toBe('top');
    expect(res.get('c')).toBe('top');
    const bPos = res.get('b');
    if (bPos) expect(overlaps(labelBox(items[1], bPos), labelBox(items[0], 'top'))).toBe(false);
  });
  it('middle-ellipsises long names without cutting mid-word', () => {
    const s = middleEllipsis('Triethanolamine (forms soap with stearic acid)', 30);
    expect(s.startsWith('Triethanolamine')).toBe(true);
    expect(s).toContain('…');
    expect(s.length).toBeLessThanOrEqual(31);
  });
});

describe('gaussian process', () => {
  it('learns a known smooth function (RMSE below threshold)', () => {
    const rnd = seedrandom('gp-test');
    const f = (a: number, b: number) => Math.sin(3 * a) + 0.5 * Math.cos(4 * b);
    const X = Array.from({ length: 40 }, () => [rnd(), rnd()]);
    const y = X.map(([a, b]) => f(a, b));
    const m = fitGP(X, y);
    let se = 0;
    for (let i = 0; i < 200; i++) {
      const a = rnd();
      const b = rnd();
      se += (predict(m, [a, b]).mean - f(a, b)) ** 2;
    }
    expect(Math.sqrt(se / 200)).toBeLessThan(0.08);
  });
  it('fits the demo Ph with a usable LOO R²', () => {
    const e = new ModelEngine();
    e.setDataset(buildCream22());
    const info = e.fit('ph');
    expect(info.trainedOn).toBe(22);
    expect(info.cvR2).not.toBeNull();
  });
});

describe('suggestions', () => {
  it('renormalises the balance ingredient to keep 100 %', () => {
    const ds = buildCream22();
    const p = { ...ds.trials[0].params, stearic: ds.trials[0].params.stearic + 1 };
    const r = renormalise(p, ds.parameters, 'water')!;
    expect(ingredientTotal(r, ds.parameters)).toBeCloseTo(100, 6);
    expect(renormalise({ ...p, glycerin: 80 }, ds.parameters, 'water')).toBeNull();
  });
  it('every suggested recipe sums to 100 %', () => {
    const ds = buildCream22();
    const e = new ModelEngine();
    e.setDataset(ds);
    const qs = e.suggest({ count: 3, candidates: 800 });
    expect(qs.length).toBeGreaterThan(0);
    for (const q of qs) expect(ingredientTotal(q.params, ds.parameters)).toBeCloseTo(100, 1);
  });
});
