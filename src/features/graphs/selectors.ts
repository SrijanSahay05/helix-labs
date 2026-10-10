import type { Dataset, GTrial, Parameter, ResultDef } from './types';

/** Parameters that actually vary across trials (constant ones are hidden from axis menus). */
export function splitParameters(ds: Dataset): { varying: Parameter[]; constant: Parameter[] } {
  const varying: Parameter[] = [];
  const constant: Parameter[] = [];
  for (const p of ds.parameters) {
    const vals = ds.trials.map((t) => t.params[p.id]).filter((v) => Number.isFinite(v));
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    (hi - lo > 1e-9 ? varying : constant).push(p);
  }
  return { varying, constant };
}

export function primaryResult(ds: Dataset): ResultDef {
  return ds.results.find((r) => r.primary) ?? ds.results[0];
}

export const complete = (ds: Dataset) => ds.trials.filter((t) => t.status === 'complete');

/**
 * Derringer desirability of one value, 0–1.
 * maximize/minimize ramp linearly between the worst and best observed values (or the target as the floor);
 * target is two-sided around target ± tolerance.
 */
export function desirability(value: number, r: ResultDef, observed: { min: number; max: number }): number {
  if (!Number.isFinite(value)) return 0;
  const span = observed.max - observed.min || 1;
  if (r.direction === 'target') {
    const t = r.target ?? (observed.min + observed.max) / 2;
    const tol = r.tolerance ?? span / 2;
    return Math.max(0, 1 - Math.abs(value - t) / (tol * 2));
  }
  const d = (value - observed.min) / span;
  return Math.min(1, Math.max(0, r.direction === 'maximize' ? d : 1 - d));
}

export function observedRange(ds: Dataset, id: string): { min: number; max: number } {
  const vals = ds.trials.map((t) => (id in t.results ? t.results[id] : t.params[id])).filter((v): v is number => v !== null && v !== undefined && Number.isFinite(v));
  if (!vals.length) return { min: 0, max: 1 };
  return { min: Math.min(...vals), max: Math.max(...vals) };
}

/** Weighted geometric mean of per-result desirabilities (missing results are skipped). */
export function overallDesirability(t: GTrial, ds: Dataset, ranges = Object.fromEntries(ds.results.map((r) => [r.id, observedRange(ds, r.id)]))): number {
  let logSum = 0;
  let wSum = 0;
  for (const r of ds.results) {
    const v = t.results[r.id];
    if (v === null || v === undefined) continue;
    const d = Math.max(1e-3, desirability(v, r, ranges[r.id]));
    logSum += r.weight * Math.log(d);
    wSum += r.weight;
  }
  return wSum ? Math.exp(logSum / wSum) : 0;
}

/** Best complete trial by the primary objective, or by overall desirability. */
export function bestTrialId(ds: Dataset, by: 'primary' | 'overall' = 'primary'): string | undefined {
  const done = complete(ds);
  if (!done.length) return undefined;
  if (by === 'overall') {
    const ranges = Object.fromEntries(ds.results.map((r) => [r.id, observedRange(ds, r.id)]));
    return done.reduce((a, b) => (overallDesirability(b, ds, ranges) > overallDesirability(a, ds, ranges) ? b : a)).id;
  }
  const r = primaryResult(ds);
  const score = (t: GTrial) => {
    const v = t.results[r.id];
    if (v === null || v === undefined) return -Infinity;
    if (r.direction === 'maximize') return v;
    if (r.direction === 'minimize') return -v;
    return -Math.abs(v - (r.target ?? v));
  };
  return done.reduce((a, b) => (score(b) > score(a) ? b : a)).id;
}

export function counts(ds: Dataset) {
  const { varying, constant } = splitParameters(ds);
  return {
    trials: ds.trials.filter((t) => t.status !== 'failed').length,
    complete: complete(ds).length,
    parameters: varying.length,
    constant: constant.length,
    results: ds.results.length,
  };
}

/* ---------- Pareto ---------- */

/** a dominates b when it is at least as good on both and strictly better on one ("good" respects direction). */
export function dominates(a: [number, number], b: [number, number], dirs: ['maximize' | 'minimize', 'maximize' | 'minimize']): boolean {
  const s = (v: number, d: 'maximize' | 'minimize') => (d === 'maximize' ? v : -v);
  const a0 = s(a[0], dirs[0]);
  const a1 = s(a[1], dirs[1]);
  const b0 = s(b[0], dirs[0]);
  const b1 = s(b[1], dirs[1]);
  return a0 >= b0 && a1 >= b1 && (a0 > b0 || a1 > b1);
}

export function paretoFront<T>(items: T[], get: (t: T) => [number, number], dirs: ['maximize' | 'minimize', 'maximize' | 'minimize']): { front: T[]; dominatedCount: Map<T, number> } {
  const front: T[] = [];
  const dominatedCount = new Map<T, number>();
  for (const a of items) {
    let dominated = false;
    let n = 0;
    for (const b of items) {
      if (a === b) continue;
      if (dominates(get(b), get(a), dirs)) dominated = true;
      if (dominates(get(a), get(b), dirs)) n++;
    }
    dominatedCount.set(a, n);
    if (!dominated) front.push(a);
  }
  return { front, dominatedCount };
}

/** 2D hypervolume of a front against a reference point (worst observed values). */
export function hypervolume(points: [number, number][], ref: [number, number], dirs: ['maximize' | 'minimize', 'maximize' | 'minimize']): number {
  // map to a maximise-both space where the reference is the origin
  const m = points
    .map(([a, b]) => [dirs[0] === 'maximize' ? a - ref[0] : ref[0] - a, dirs[1] === 'maximize' ? b - ref[1] : ref[1] - b] as [number, number])
    .filter(([a, b]) => a > 0 && b > 0)
    .sort((p, q) => q[0] - p[0]);
  let hv = 0;
  let prevY = 0;
  for (const [x, y] of m) {
    if (y > prevY) {
      hv += x * (y - prevY);
      prevY = y;
    }
  }
  return hv;
}

/* ---------- 100 % recipes ---------- */

/** Rescale the balance ingredient so ingredient totals sum to 100 %. Returns null if the balance leaves its bounds. */
export function renormalise(params: Record<string, number>, parameters: Parameter[], balanceId?: string): Record<string, number> | null {
  if (!balanceId) return params;
  const bal = parameters.find((p) => p.id === balanceId);
  if (!bal) return params;
  const others = parameters.filter((p) => p.kind === 'ingredient' && p.id !== balanceId).reduce((a, p) => a + (params[p.id] ?? 0), 0);
  const v = Math.round((100 - others) * 100) / 100;
  if (v < bal.min - 1e-6 || v > bal.max + 1e-6) return null;
  return { ...params, [balanceId]: v };
}

export function ingredientTotal(params: Record<string, number>, parameters: Parameter[]) {
  return parameters.filter((p) => p.kind === 'ingredient').reduce((a, p) => a + (params[p.id] ?? 0), 0);
}

/** Stable hash of the data that the model depends on. */
export function datasetHash(ds: Dataset): string {
  let h = 2166136261;
  const s = JSON.stringify(ds.trials.map((t) => [t.id, t.status, t.params, t.results]));
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return `${ds.id}:${(h >>> 0).toString(36)}:${ds.trials.length}`;
}
