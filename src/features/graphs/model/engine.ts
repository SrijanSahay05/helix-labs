import seedrandom from 'seedrandom';
import { Matrix, SingularValueDecomposition } from 'ml-matrix';
import type { Dataset, GTrial, Parameter, ResultDef, Suggestion } from '../types';
import { bestTrialId, datasetHash, desirability, observedRange, primaryResult, renormalise, splitParameters } from '../selectors';
import { expectedImprovement, fitGP, fitRBF, loo, predict, type Surrogate } from './gp';

export interface FitInfo {
  resultId: string;
  kind: 'gp' | 'rbf';
  trainedOn: number;
  lengthscales: Record<string, number>;
  noise: number;
  cvR2: number | null;
  cvRmse: number | null;
}

export interface GridResult {
  xs: number[];
  ys: number[];
  mean: number[][];
  sd: (number[][]) | null;
  extrapolated: boolean[][];
}

export interface PcaResult {
  coords: Record<string, [number, number]>;
  explained: [number, number];
  loadings: { paramId: string; pc1: number; pc2: number }[];
}

/** Everything the Graphs panel asks of the model. Runs inside the worker; also used directly by tests. */
export class ModelEngine {
  private ds: Dataset | null = null;
  private hash = '';
  private varying: Parameter[] = [];
  private lo: Record<string, number> = {};
  private hi: Record<string, number> = {};
  private models = new Map<string, { m: Surrogate; info: FitInfo; ids: string[]; y: number[] }>();
  /** for the dev state switcher: make the next fit throw / take longer */
  failNext = false;
  delayMs = 0;

  setDataset(ds: Dataset): string {
    const h = datasetHash(ds);
    if (h === this.hash) return h;
    this.ds = ds;
    this.hash = h;
    this.models.clear();
    this.varying = splitParameters(ds).varying;
    for (const p of this.varying) {
      const vals = ds.trials.map((t) => t.params[p.id]);
      this.lo[p.id] = Math.min(...vals);
      this.hi[p.id] = Math.max(...vals);
    }
    return h;
  }

  private get data(): Dataset {
    if (!this.ds) throw new Error('No dataset');
    return this.ds;
  }

  normalise(params: Record<string, number>): number[] {
    return this.varying.map((p) => {
      const span = this.hi[p.id] - this.lo[p.id] || 1;
      return ((params[p.id] ?? this.lo[p.id]) - this.lo[p.id]) / span;
    });
  }

  private training(resultId: string): { trials: GTrial[]; y: number[] } {
    const trials = this.data.trials.filter((t) => t.status === 'complete' && t.results[resultId] !== null && t.results[resultId] !== undefined && Number.isFinite(t.results[resultId]));
    // above 200 trials, subsample deterministically for the fit
    const pick = trials.length > 200 ? trials.filter((_, i) => i % Math.ceil(trials.length / 200) === 0) : trials;
    return { trials: pick, y: pick.map((t) => t.results[resultId] as number) };
  }

  fit(resultId: string): FitInfo {
    const cached = this.models.get(resultId);
    if (cached) return cached.info;
    if (this.failNext) {
      this.failNext = false;
      throw new Error("Couldn't fit the model");
    }
    if (this.delayMs) {
      const until = Date.now() + this.delayMs;
      while (Date.now() < until) {
        /* simulated slow fit (dev switcher) */
      }
    }
    const { trials, y } = this.training(resultId);
    if (trials.length < 2) throw new Error('Needs at least 2 complete trials');
    const X = trials.map((t) => this.normalise(t.params));
    let m: Surrogate;
    let cvR2: number | null = null;
    let cvRmse: number | null = null;
    if (trials.length < 8) {
      m = fitRBF(X, y);
    } else {
      m = fitGP(X, y, { levers: this.varying.map((p) => !!p.lever) });
      const preds = loo(m, y);
      const mean = y.reduce((a, b) => a + b, 0) / y.length;
      const ssRes = preds.reduce((a, p, i) => a + (y[i] - p.mean) ** 2, 0);
      const ssTot = y.reduce((a, v) => a + (v - mean) ** 2, 0) || 1;
      cvR2 = 1 - ssRes / ssTot;
      cvRmse = Math.sqrt(ssRes / y.length);
    }
    const info: FitInfo = {
      resultId,
      kind: m.kind,
      trainedOn: trials.length,
      lengthscales: m.kind === 'gp' ? Object.fromEntries(this.varying.map((p, i) => [p.id, (m as { ls: number[] }).ls[i]])) : {},
      noise: m.kind === 'gp' ? m.sn2 : 0,
      cvR2,
      cvRmse,
    };
    this.models.set(resultId, { m, info, ids: trials.map((t) => t.id), y });
    return info;
  }

  private model(resultId: string) {
    this.fit(resultId);
    return this.models.get(resultId)!;
  }

  predictPoints(resultId: string, points: Record<string, number>[]): { mean: number; sd: number | null }[] {
    const { m } = this.model(resultId);
    return points.map((p) => predict(m, this.normalise(p)));
  }

  /** Slice values default to the best trial's parameters. */
  defaultSlice(): Record<string, number> {
    const id = bestTrialId(this.data);
    const t = this.data.trials.find((x) => x.id === id) ?? this.data.trials[0];
    return { ...t.params };
  }

  predictGrid(args: { resultId: string; x: string; y: string; slice?: Record<string, number>; n?: number; pad?: number; range?: { x: [number, number]; y: [number, number] } }): GridResult {
    const { m } = this.model(args.resultId);
    const n = args.n ?? 50;
    const pad = args.pad ?? 0.03;
    const xr = args.range?.x ?? padRange(this.lo[args.x], this.hi[args.x], pad);
    const yr = args.range?.y ?? padRange(this.lo[args.y], this.hi[args.y], pad);
    const xs = Array.from({ length: n }, (_, i) => xr[0] + ((xr[1] - xr[0]) * i) / (n - 1));
    const ys = Array.from({ length: n }, (_, i) => yr[0] + ((yr[1] - yr[0]) * i) / (n - 1));
    const base = { ...this.defaultSlice(), ...args.slice };
    const pts = this.data.trials.filter((t) => t.status === 'complete').map((t) => [t.params[args.x], t.params[args.y]]);
    const sx = this.hi[args.x] - this.lo[args.x] || 1;
    const sy = this.hi[args.y] - this.lo[args.y] || 1;
    const mean: number[][] = [];
    const sd: number[][] = [];
    const extrapolated: boolean[][] = [];
    for (const yv of ys) {
      const rowM: number[] = [];
      const rowS: number[] = [];
      const rowE: boolean[] = [];
      for (const xv of xs) {
        const p = predict(m, this.normalise({ ...base, [args.x]: xv, [args.y]: yv }));
        rowM.push(p.mean);
        rowS.push(p.sd ?? NaN);
        let dmin = Infinity;
        for (const [px, py] of pts) dmin = Math.min(dmin, Math.hypot((px - xv) / sx, (py - yv) / sy));
        rowE.push(dmin > 0.25);
      }
      mean.push(rowM);
      sd.push(rowS);
      extrapolated.push(rowE);
    }
    return { xs, ys, mean, sd: m.kind === 'gp' ? sd : null, extrapolated };
  }

  /** Where every `must` result is predicted to pass. */
  feasibleGrid(args: { x: string; y: string; slice?: Record<string, number>; n?: number; range?: { x: [number, number]; y: [number, number] } }): boolean[][] | null {
    const musts = this.data.results.filter((r) => r.must && r.target !== undefined);
    if (!musts.length) return null;
    const grids = musts.map((r) => ({ r, g: this.predictGrid({ ...args, resultId: r.id }) }));
    const g0 = grids[0].g;
    return g0.mean.map((row, i) => row.map((_, j) => grids.every(({ r, g }) => passes(g.mean[i][j], r))));
  }

  looPredictions(resultId: string): { id: string; measured: number; predicted: number; sd: number | null }[] {
    const { m, ids, y } = this.model(resultId);
    if (m.kind !== 'gp') return ids.map((id, i) => ({ id, measured: y[i], predicted: y[i], sd: null }));
    return loo(m, y).map((p, i) => ({ id: ids[i], measured: y[i], predicted: p.mean, sd: p.sd }));
  }

  importance(resultId: string): { paramId: string; score: number }[] {
    const { m, ids, y } = this.model(resultId);
    let raw: number[];
    if (m.kind === 'gp') raw = m.ls.map((l) => 1 / l);
    else {
      // too few trials: |correlation| with the result
      const trials = ids.map((id) => this.data.trials.find((t) => t.id === id)!);
      raw = this.varying.map((p) => Math.abs(corr(trials.map((t) => t.params[p.id]), y)) || 0);
    }
    const sum = raw.reduce((a, b) => a + b, 0) || 1;
    return this.varying.map((p, i) => ({ paramId: p.id, score: raw[i] / sum })).sort((a, b) => b.score - a.score);
  }

  /** Signed effect of a parameter on a result: + means increasing it raises the result (finite difference around the best trial). */
  effect(resultId: string, paramId: string): number {
    const base = this.defaultSlice();
    const span = (this.hi[paramId] - this.lo[paramId]) * 0.15;
    const [a, b] = this.predictPoints(resultId, [{ ...base, [paramId]: base[paramId] - span }, { ...base, [paramId]: base[paramId] + span }]);
    return b.mean - a.mean;
  }

  private objective(r: ResultDef) {
    return (mean: number) => (r.direction === 'maximize' ? mean : r.direction === 'minimize' ? -mean : -Math.abs(mean - (r.target ?? mean)));
  }

  /** Ranked, diverse candidates by expected improvement (or desirability). */
  suggest(opts: { objective?: 'primary' | 'desirability'; kind?: 'EI' | 'UCB'; candidates?: number; count?: number; skip?: number } = {}): Suggestion[] {
    const ds = this.data;
    const r = primaryResult(ds);
    const fitted = this.model(r.id);
    const rnd = seedrandom(`suggest:${this.hash}`);
    const nCand = opts.candidates ?? 4000;
    const bestId = bestTrialId(ds);
    const best = ds.trials.find((t) => t.id === bestId) ?? ds.trials[0];
    const obj = this.objective(r);
    const bestVal = Math.max(...fitted.y.map(obj));
    const cands: Record<string, number>[] = [];
    // half global (random + Latin hypercube), half local around the best trial
    const lhsPerm = this.varying.map(() => shuffle(Array.from({ length: nCand / 4 }, (_, i) => i), rnd));
    for (let i = 0; i < nCand; i++) {
      const p: Record<string, number> = { ...best.params };
      const local = i >= nCand / 2;
      const lhs = i < nCand / 4;
      const dims = local ? this.varying.filter(() => rnd() < 0.25) : this.varying;
      for (const q of dims) {
        const lo = Math.min(q.min, this.lo[q.id]);
        const hi = Math.max(q.max, this.hi[q.id]);
        let v: number;
        if (local) v = p[q.id] + gauss(rnd) * 0.1 * (hi - lo);
        else if (lhs) v = lo + ((lhsPerm[this.varying.indexOf(q)][i] + rnd()) / (nCand / 4)) * (hi - lo);
        else v = lo + rnd() * (hi - lo);
        p[q.id] = Math.round(Math.min(hi, Math.max(lo, v)) * 100) / 100;
      }
      const ok = renormalise(p, ds.parameters, ds.balanceId);
      if (ok) cands.push(ok);
    }
    const scored = cands.map((p) => {
      const pr = predict(fitted.m, this.normalise(p));
      const sd = pr.sd ?? 0.05 * (Math.abs(pr.mean) || 1);
      const value = opts.kind === 'UCB' ? obj(pr.mean) + 2 * sd : expectedImprovement(obj(pr.mean), sd, bestVal);
      return { p, value };
    });
    scored.sort((a, b) => b.value - a.value);
    // greedy diversity: keep candidates at least 0.15 apart (normalised)
    const picked: typeof scored = [];
    const want = (opts.count ?? 1) + (opts.skip ?? 0);
    for (const c of scored) {
      const x = this.normalise(c.p);
      if (picked.every((q) => dist(this.normalise(q.p), x) > 0.15 * Math.sqrt(this.varying.length / 4))) picked.push(c);
      if (picked.length >= want) break;
    }
    return picked.slice(opts.skip ?? 0).map((c, i) => this.describe(c.p, `Q${(opts.skip ?? 0) + i + 1}`, { kind: opts.kind ?? 'EI', value: c.value }));
  }

  /** Predicted values for every result plus Delta's rationale for a proposed recipe. */
  describe(params: Record<string, number>, id = 'Q1', acquisition?: { kind: 'EI' | 'UCB'; value: number }): Suggestion {
    const ds = this.data;
    const r = primaryResult(ds);
    const predicted: Suggestion['predicted'] = {};
    for (const res of ds.results) {
      try {
        predicted[res.id] = this.predictPoints(res.id, [params])[0];
      } catch {
        /* result without enough data */
      }
    }
    let acq = acquisition;
    if (!acq) {
      const fitted = this.model(r.id);
      const obj = this.objective(r);
      const p = predicted[r.id];
      acq = { kind: 'EI', value: p ? expectedImprovement(obj(p.mean), p.sd ?? 0.05, Math.max(...fitted.y.map(obj))) : 0 };
    }
    return { id, params, predicted, acquisition: acq, rationale: this.rationale(params, predicted) };
  }

  private rationale(params: Record<string, number>, predicted: Suggestion['predicted']): string[] {
    const ds = this.data;
    const r = primaryResult(ds);
    const bestId = bestTrialId(ds);
    const best = ds.trials.find((t) => t.id === bestId);
    const imp = this.importance(r.id).slice(0, 3);
    const p = predicted[r.id];
    const near = ds.trials.filter((t) => t.status === 'complete' && dist(this.normalise(t.params), this.normalise(params)) < 0.35 * Math.sqrt(this.varying.length / 3)).length;
    const changes = this.varying
      .map((q) => ({ q, d: (params[q.id] ?? 0) - (best?.params[q.id] ?? 0) }))
      .filter((c) => Math.abs(c.d) > 0.005 * (this.hi[c.q.id] - this.lo[c.q.id] || 1))
      .sort((a, b) => Math.abs(b.d) / (this.hi[b.q.id] - this.lo[b.q.id] || 1) - Math.abs(a.d) / (this.hi[a.q.id] - this.lo[a.q.id] || 1))
      .slice(0, 3);
    const fmt = (v: number) => (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(2));
    const lines = [
      `Highest expected improvement for ${r.name} near the ${best?.label ?? 'best'} peak${p ? `: predicted ${fmt(p.mean)}${p.sd !== null ? ` ± ${fmt(p.sd)}` : ''}` : ''}.`,
      changes.length ? `Changes vs ${best?.label}: ${changes.map((c) => `${c.q.name.split(' (')[0]} ${c.d > 0 ? '+' : ''}${fmt(c.d)}`).join(', ')}.` : `Same recipe as ${best?.label}, re-tested to confirm.`,
      `Most influential: ${imp.map((x) => ds.parameters.find((q) => q.id === x.paramId)?.name.split(' (')[0]).join(', ')}.`,
      `Uncertainty is ${p?.sd === null || p?.sd === undefined ? 'unknown (too few trials for a full model)' : p.sd / (observedRange(ds, r.id).max - observedRange(ds, r.id).min || 1) > 0.15 ? 'high' : 'moderate'} because ${near === 1 ? 'only 1 trial sits' : `${near} trials sit`} within this region.`,
    ];
    const constrained = ds.results.filter((x) => x.direction === 'target' && predicted[x.id]);
    for (const c of constrained.slice(0, 1)) {
      const v = predicted[c.id]!.mean;
      lines.push(`${c.name} is predicted at ${fmt(v)} ${c.unit} — ${desirability(v, c, observedRange(ds, c.id)) > 0.5 ? 'within' : 'outside'} its target range.`);
    }
    return lines;
  }

  pca(extra?: Record<string, number>[]): PcaResult {
    const ds = this.data;
    const rows = ds.trials.map((t) => this.varying.map((p) => t.params[p.id]));
    const means = this.varying.map((_, j) => rows.reduce((a, r) => a + r[j], 0) / rows.length);
    const sds = this.varying.map((_, j) => Math.sqrt(rows.reduce((a, r) => a + (r[j] - means[j]) ** 2, 0) / Math.max(1, rows.length - 1)) || 1);
    const z = (r: number[]) => r.map((v, j) => (v - means[j]) / sds[j]);
    const M = new Matrix(rows.map(z));
    const svd = new SingularValueDecomposition(M, { autoTranspose: true });
    const V = svd.rightSingularVectors;
    const s = svd.diagonal;
    const total = s.reduce((a, v) => a + v * v, 0) || 1;
    const proj = (r: number[]): [number, number] => {
      const zr = z(r);
      let a = 0;
      let b = 0;
      for (let j = 0; j < zr.length; j++) {
        a += zr[j] * V.get(j, 0);
        b += zr[j] * (V.columns > 1 ? V.get(j, 1) : 0);
      }
      return [a, b];
    };
    const coords: Record<string, [number, number]> = Object.fromEntries(ds.trials.map((t, i) => [t.id, proj(rows[i])]));
    extra?.forEach((p, i) => (coords[`__extra${i}`] = proj(this.varying.map((q) => p[q.id] ?? means[this.varying.indexOf(q)]))));
    return {
      coords,
      explained: [(s[0] ?? 0) ** 2 / total, (s[1] ?? 0) ** 2 / total],
      loadings: this.varying.map((p, j) => ({ paramId: p.id, pc1: V.get(j, 0), pc2: V.columns > 1 ? V.get(j, 1) : 0 })),
    };
  }

  /** Surrogate on a triangular grid of three renormalised components (ternary underlay). */
  ternaryGrid(resultId: string, ids: [string, string, string], steps = 24): { a: number[]; b: number[]; c: number[]; v: number[] } {
    const base = this.defaultSlice();
    const total = ids.reduce((a, id) => a + (base[id] ?? 0), 0);
    const out = { a: [] as number[], b: [] as number[], c: [] as number[], v: [] as number[] };
    const pts: Record<string, number>[] = [];
    const fr: [number, number, number][] = [];
    for (let i = 0; i <= steps; i++)
      for (let j = 0; j <= steps - i; j++) {
        const f: [number, number, number] = [i / steps, j / steps, (steps - i - j) / steps];
        fr.push(f);
        pts.push({ ...base, [ids[0]]: f[0] * total, [ids[1]]: f[1] * total, [ids[2]]: f[2] * total });
      }
    const pred = this.predictPoints(resultId, pts);
    fr.forEach((f, k) => {
      out.a.push(f[0]);
      out.b.push(f[1]);
      out.c.push(f[2]);
      out.v.push(pred[k].mean);
    });
    return out;
  }
}

export function passes(v: number, r: ResultDef): boolean {
  if (r.target === undefined) return true;
  if (r.direction === 'maximize') return v >= r.target;
  if (r.direction === 'minimize') return v <= r.target;
  return Math.abs(v - r.target) <= (r.tolerance ?? 0);
}

function padRange(lo: number, hi: number, pad: number): [number, number] {
  const s = hi - lo || 1;
  return [lo - s * pad, hi + s * pad];
}

function dist(a: number[], b: number[]) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s);
}

function corr(a: number[], b: number[]) {
  const ma = a.reduce((x, y) => x + y, 0) / a.length;
  const mb = b.reduce((x, y) => x + y, 0) / b.length;
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < a.length; i++) {
    num += (a[i] - ma) * (b[i] - mb);
    da += (a[i] - ma) ** 2;
    db += (b[i] - mb) ** 2;
  }
  return num / Math.sqrt(da * db || 1);
}

function gauss(rnd: () => number) {
  return Math.sqrt(-2 * Math.log(Math.max(1e-9, rnd()))) * Math.cos(2 * Math.PI * rnd());
}

function shuffle<T>(a: T[], rnd: () => number): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
