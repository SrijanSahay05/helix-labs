/**
 * Gaussian process regression with an ARD squared-exponential kernel.
 * Inputs are expected min-max normalised, outputs are standardised internally.
 * Hyperparameters are fitted by maximising the log marginal likelihood with Adam from several restarts.
 */

export interface GPModel {
  kind: 'gp';
  X: number[][];
  yMean: number;
  yStd: number;
  /** log lengthscales, log signal variance, log noise variance */
  ls: number[];
  sf2: number;
  sn2: number;
  L: Float64Array; // cholesky of K, row-major n×n
  alpha: Float64Array;
  Kinv: Float64Array;
  nlml: number;
}

export interface RBFModel {
  kind: 'rbf';
  X: number[][];
  yMean: number;
  yStd: number;
  w: Float64Array;
  length: number;
}

export type Surrogate = GPModel | RBFModel;

/** Cholesky in place: returns lower-triangular L (row-major) or null if not positive definite. */
export function cholesky(A: Float64Array, n: number): Float64Array | null {
  const L = new Float64Array(n * n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let s = A[i * n + j];
      for (let k = 0; k < j; k++) s -= L[i * n + k] * L[j * n + k];
      if (i === j) {
        if (s <= 1e-12) return null;
        L[i * n + i] = Math.sqrt(s);
      } else L[i * n + j] = s / L[j * n + j];
    }
  }
  return L;
}

/** Solve L x = b (forward). */
export function forward(L: Float64Array, n: number, b: ArrayLike<number>): Float64Array {
  const x = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let s = b[i];
    for (let k = 0; k < i; k++) s -= L[i * n + k] * x[k];
    x[i] = s / L[i * n + i];
  }
  return x;
}

/** Solve Lᵀ x = b (backward). */
export function backward(L: Float64Array, n: number, b: ArrayLike<number>): Float64Array {
  const x = new Float64Array(n);
  for (let i = n - 1; i >= 0; i--) {
    let s = b[i];
    for (let k = i + 1; k < n; k++) s -= L[k * n + i] * x[k];
    x[i] = s / L[i * n + i];
  }
  return x;
}

function invFromChol(L: Float64Array, n: number): Float64Array {
  const inv = new Float64Array(n * n);
  const e = new Float64Array(n);
  for (let j = 0; j < n; j++) {
    e.fill(0);
    e[j] = 1;
    const col = backward(L, n, forward(L, n, e));
    for (let i = 0; i < n; i++) inv[i * n + j] = col[i];
  }
  return inv;
}

/** weak log-normal prior on lengthscales; leaning long lets irrelevant inputs drift out */
export const LS_PRIOR = { mu: Math.log(1.5), sd: 1.5 };
const LS_PRIOR_MU = LS_PRIOR.mu;
const LS_PRIOR_SD = LS_PRIOR.sd;
const LOG_L_MIN = Math.log(0.04);
const LOG_L_MAX = Math.log(30);
const LOG_N_MIN = Math.log(1e-4);
const LOG_N_MAX = Math.log(0.6);

interface Eval {
  nlml: number;
  grad: number[];
  L: Float64Array;
  alpha: Float64Array;
  Kinv: Float64Array;
}

/** Negative log marginal likelihood (+ weak log-normal priors) and its gradient. */
function evaluate(theta: number[], X: number[][], y: number[], D: Float64Array[], prior: { mu: number[]; sd: number[] }): Eval | null {
  const n = X.length;
  const d = X[0]?.length ?? 0;
  const ls = theta.slice(0, d).map(Math.exp);
  const sf2 = Math.exp(theta[d]);
  const sn2 = Math.exp(theta[d + 1]);
  const Kf = new Float64Array(n * n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let r = 0;
      for (let k = 0; k < d; k++) r += D[k][i * n + j] / (ls[k] * ls[k]);
      const v = sf2 * Math.exp(-0.5 * r);
      Kf[i * n + j] = v;
      Kf[j * n + i] = v;
    }
  }
  const K = new Float64Array(Kf);
  for (let i = 0; i < n; i++) K[i * n + i] += sn2 + 1e-8;
  const L = cholesky(K, n);
  if (!L) return null;
  const alpha = backward(L, n, forward(L, n, y));
  let logdet = 0;
  for (let i = 0; i < n; i++) logdet += Math.log(L[i * n + i]);
  let fit = 0;
  for (let i = 0; i < n; i++) fit += y[i] * alpha[i];
  // priors: lengthscales lean long (irrelevant inputs drift out), noise around 0.02 of the standardised variance
  let prior_ = 0;
  const gPrior = new Array(d + 2).fill(0);
  for (let k = 0; k < d; k++) {
    const z = (theta[k] - prior.mu[k]) / prior.sd[k];
    prior_ += 0.5 * z * z;
    gPrior[k] = z / prior.sd[k];
  }
  const zn = (theta[d + 1] - Math.log(0.02)) / 2;
  prior_ += 0.5 * zn * zn;
  gPrior[d + 1] = zn / 2;
  const nlml = 0.5 * fit + logdet + 0.5 * n * Math.log(2 * Math.PI) + prior_;

  const Kinv = invFromChol(L, n);
  // W = K⁻¹ − ααᵀ ;  dNLML/dθ = ½ tr(W dK/dθ)
  const grad = new Array(d + 2).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const w = Kinv[i * n + j] - alpha[i] * alpha[j];
      const kf = Kf[i * n + j];
      const wk = w * kf;
      for (let k = 0; k < d; k++) grad[k] += 0.5 * wk * (D[k][i * n + j] / (ls[k] * ls[k]));
      grad[d] += 0.5 * wk;
    }
    grad[d + 1] += 0.5 * (Kinv[i * n + i] - alpha[i] * alpha[i]) * sn2;
  }
  for (let k = 0; k < d + 2; k++) grad[k] += gPrior[k];
  return { nlml, grad, L, alpha, Kinv };
}

export interface FitOptions {
  iterations?: number;
  restarts?: number;
  /**
   * Inputs the experiment deliberately varied (design levers). Their lengthscale prior leans short,
   * incidental inputs lean long — prior knowledge that stops chance correlations at small n from
   * stealing the effect.
   */
  levers?: boolean[];
}

export function fitGP(X: number[][], yRaw: number[], opts: FitOptions = {}): GPModel {
  const n = X.length;
  const d = X[0]?.length ?? 0;
  const yMean = yRaw.reduce((a, b) => a + b, 0) / n;
  const yStd = Math.sqrt(yRaw.reduce((a, b) => a + (b - yMean) ** 2, 0) / Math.max(1, n - 1)) || 1;
  const y = yRaw.map((v) => (v - yMean) / yStd);
  const D: Float64Array[] = Array.from({ length: d }, (_, k) => {
    const m = new Float64Array(n * n);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) m[i * n + j] = (X[i][k] - X[j][k]) ** 2;
    return m;
  });
  const hasLevers = !!opts.levers?.some(Boolean);
  const prior = {
    mu: Array.from({ length: d }, (_, k) => (hasLevers ? (opts.levers![k] ? Math.log(0.5) : Math.log(4)) : LS_PRIOR_MU)),
    sd: Array.from({ length: d }, (_, k) => (hasLevers ? (opts.levers![k] ? 1.5 : 0.6) : LS_PRIOR_SD)),
  };
  const iters = opts.iterations ?? (n > 120 ? 40 : n > 50 ? 90 : 220);
  const starts = [Math.log(1.5), Math.log(0.5), Math.log(4)].slice(0, opts.restarts ?? 3);
  let best: { theta: number[]; ev: Eval } | null = null;
  for (const l0 of starts) {
    let theta = [...prior.mu.map((m) => (hasLevers ? m + (l0 - Math.log(1.5)) * 0.5 : l0)), 0, Math.log(0.02)];
    let ev = evaluate(theta, X, y, D, prior);
    if (!ev) continue;
    const m = new Array(d + 2).fill(0);
    const v = new Array(d + 2).fill(0);
    const lr = 0.06;
    let bestLocal = { theta, ev };
    for (let t = 1; t <= iters; t++) {
      for (let k = 0; k < d + 2; k++) {
        m[k] = 0.9 * m[k] + 0.1 * ev.grad[k];
        v[k] = 0.999 * v[k] + 0.001 * ev.grad[k] ** 2;
      }
      const next = theta.map((th, k) => {
        const step = (lr * (m[k] / (1 - 0.9 ** t))) / (Math.sqrt(v[k] / (1 - 0.999 ** t)) + 1e-8);
        let nv = th - step;
        if (k < d) nv = Math.min(LOG_L_MAX, Math.max(LOG_L_MIN, nv));
        if (k === d) nv = Math.min(Math.log(20), Math.max(Math.log(0.05), nv));
        if (k === d + 1) nv = Math.min(LOG_N_MAX, Math.max(LOG_N_MIN, nv));
        return nv;
      });
      const ne = evaluate(next, X, y, D, prior);
      if (!ne) break;
      theta = next;
      ev = ne;
      if (ev.nlml < bestLocal.ev.nlml) bestLocal = { theta, ev };
    }
    if (!best || bestLocal.ev.nlml < best.ev.nlml) best = bestLocal;
  }
  if (!best) throw new Error('Gaussian process fit failed (matrix not positive definite)');
  const { theta, ev } = best;
  return { kind: 'gp', X, yMean, yStd, ls: theta.slice(0, d).map(Math.exp), sf2: Math.exp(theta[d]), sn2: Math.exp(theta[d + 1]), L: ev.L, alpha: ev.alpha, Kinv: ev.Kinv, nlml: ev.nlml };
}

function kvec(m: GPModel, x: number[]): Float64Array {
  const n = m.X.length;
  const k = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let r = 0;
    const xi = m.X[i];
    for (let j = 0; j < x.length; j++) {
      const dd = (x[j] - xi[j]) / m.ls[j];
      r += dd * dd;
    }
    k[i] = m.sf2 * Math.exp(-0.5 * r);
  }
  return k;
}

/** Interpolating RBF (Gaussian kernel) used when there are too few trials for a GP. */
export function fitRBF(X: number[][], yRaw: number[]): RBFModel {
  const n = X.length;
  const yMean = yRaw.reduce((a, b) => a + b, 0) / n;
  const yStd = Math.sqrt(yRaw.reduce((a, b) => a + (b - yMean) ** 2, 0) / Math.max(1, n - 1)) || 1;
  const y = yRaw.map((v) => (v - yMean) / yStd);
  const dists: number[] = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) dists.push(Math.sqrt(X[i].reduce((a, v, k) => a + (v - X[j][k]) ** 2, 0)));
  dists.sort((a, b) => a - b);
  const length = Math.max(0.15, dists[Math.floor(dists.length / 2)] ?? 0.5);
  const A = new Float64Array(n * n);
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const r2 = X[i].reduce((a, v, k) => a + (v - X[j][k]) ** 2, 0);
      A[i * n + j] = Math.exp(-r2 / (2 * length * length)) + (i === j ? 1e-6 : 0);
    }
  const L = cholesky(A, n) ?? cholesky(A.map((v, i) => (i % (n + 1) === 0 ? v + 1e-3 : v)), n);
  if (!L) throw new Error('RBF interpolant failed');
  const w = backward(L, n, forward(L, n, y));
  return { kind: 'rbf', X, yMean, yStd, w, length };
}

export function predict(m: Surrogate, x: number[]): { mean: number; sd: number | null } {
  if (m.kind === 'rbf') {
    let s = 0;
    for (let i = 0; i < m.X.length; i++) {
      const r2 = m.X[i].reduce((a, v, k) => a + (v - x[k]) ** 2, 0);
      s += m.w[i] * Math.exp(-r2 / (2 * m.length * m.length));
    }
    return { mean: m.yMean + s * m.yStd, sd: null };
  }
  const n = m.X.length;
  const k = kvec(m, x);
  let mu = 0;
  for (let i = 0; i < n; i++) mu += k[i] * m.alpha[i];
  const v = forward(m.L, n, k);
  let vv = 0;
  for (let i = 0; i < n; i++) vv += v[i] * v[i];
  const variance = Math.max(1e-10, m.sf2 - vv);
  return { mean: m.yMean + mu * m.yStd, sd: Math.sqrt(variance) * m.yStd };
}

/** Closed-form leave-one-out predictions for a GP (no refits): μ₋ᵢ = yᵢ − αᵢ / [K⁻¹]ᵢᵢ, σ²₋ᵢ = 1 / [K⁻¹]ᵢᵢ. */
export function loo(m: GPModel, yRaw: number[]): { mean: number; sd: number }[] {
  const n = m.X.length;
  return Array.from({ length: n }, (_, i) => {
    const kii = m.Kinv[i * n + i];
    return { mean: yRaw[i] - (m.alpha[i] / kii) * m.yStd, sd: Math.sqrt(1 / kii) * m.yStd };
  });
}

export function normCdf(z: number) {
  // Abramowitz–Stegun
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}
export const normPdf = (z: number) => Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);

/** Expected improvement for maximisation of a Gaussian with (mean, sd) over `best`. */
export function expectedImprovement(mean: number, sd: number, best: number, xi = 0.01): number {
  if (sd <= 1e-12) return Math.max(0, mean - best - xi);
  const z = (mean - best - xi) / sd;
  return (mean - best - xi) * normCdf(z) + sd * normPdf(z);
}
