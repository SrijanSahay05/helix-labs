import type { Pathway, Proposal, Result, StandardFamily, TargetRow, Trial } from '@/types';
import type { Scenario } from '@/data/scenarios/types';
import { methodFor, PROP } from '@/data/properties';
import { balanceTo100, midpointRecipe } from './cost';
import { statusFor } from './status';
import { hashString, seeded } from './motion';

export function buildTargets(s: Scenario, standards: StandardFamily[]): TargetRow[] {
  const bm = s.benchmarks[0];
  return s.targets.map((t) => {
    const p = PROP[t.propertyId];
    const bv = t.bench ?? bm?.values.find((v) => v.propertyId === t.propertyId)?.value;
    return {
      propertyId: t.propertyId,
      testMethod: methodFor(t.propertyId, standards),
      unit: p?.unit ?? '',
      standardLimit: t.std,
      standardMin: t.stdMin,
      standardMax: t.stdMax,
      benchmarkValue: bv,
      operator: t.operator,
      value: t.value,
      priority: t.priority,
      meta: { by: 'helix', confidence: t.confidence ?? 0.85, reason: t.reason ?? 'From property template and benchmark', source: t.std ? `Standard ${s.standard}` : bm ? `${bm.name} TDS` : 'Template' },
    };
  });
}

const r2 = (n: number) => Math.round(n * 100) / 100;

export function buildTrials(s: Scenario, pathway: Pathway): Trial[] {
  if (s.trials && pathway.id === 'P1') return s.trials.map((t) => ({ ...t, recipe: { ...t.recipe }, meta: { ...t.meta } }));
  const base = midpointRecipe(pathway.composition, s.balanceMaterial);
  const lever = pathway.composition.find((c) => c.materialId === s.leverMaterial) ?? pathway.composition.find((c) => c.materialId !== s.balanceMaterial)!;
  const [lo, hi] = lever.range;
  const levels = [lo, (lo + (lo + hi) / 2) / 2, (lo + hi) / 2, hi];
  return levels.map((lv, i) => {
    const recipe = balanceTo100({ ...base, [lever.materialId]: r2(lv) }, s.balanceMaterial);
    const meta = Object.fromEntries(Object.keys(recipe).map((m) => [m, { by: 'helix' as const, confidence: 0.88 }]));
    return { id: `T${i + 1}`, iteration: 1, recipe, meta };
  });
}

const FAILURE_MODES = ['Adhesive (tile interface)', 'Cohesive in adhesive', 'Cohesive in substrate', 'Tile failure'];

function readingsAround(mean: number, rnd: () => number, n = 5): number[] {
  const spread = Math.abs(mean) * 0.06 || 0.02;
  const vals = Array.from({ length: n - 1 }, () => r2(mean + (rnd() - 0.5) * 2 * spread));
  const last = r2(mean * n - vals.reduce((a, b) => a + b, 0));
  return [...vals, last];
}

function genericMean(row: TargetRow, trialIdx: number, iteration: number, rnd: () => number): number {
  const q = iteration === 1 ? [0.85, 0.95, 0.97, 1.02][trialIdx % 4] : [1.05, 1.07][trialIdx % 2];
  const jitter = 1 + (rnd() - 0.5) * 0.06;
  const quality = q * jitter;
  if (row.operator === 'between' && Array.isArray(row.value)) {
    const c = (row.value[0] + row.value[1]) / 2;
    const half = (row.value[1] - row.value[0]) / 2;
    return r2(c + half * (1 - quality) * 4);
  }
  const t = Array.isArray(row.value) ? row.value[0] : row.value;
  return r2(row.operator === '<=' ? t / quality : t * quality);
}

const AGED = new Set(['adh-heat', 'adh-ft', 'self-healing', 'shrinkage', 'freeze-thaw']);

/** Lab results for trials. Tile scenario uses the hand-seeded means. */
export function buildResults(s: Scenario, trials: Trial[], targets: TargetRow[], today = new Date()): Result[] {
  const out: Result[] = [];
  for (const propertyId of s.measured) {
    const row = targets.find((t) => t.propertyId === propertyId);
    if (!row) continue;
    trials.forEach((tr) => {
      const rnd = seeded(hashString(`${tr.id}-${propertyId}`));
      const idxInIter = trials.filter((x) => x.iteration === tr.iteration).indexOf(tr);
      const mean = s.resultMeans?.[propertyId]?.[tr.id] ?? genericMean(row, idxInIter, tr.iteration, rnd);
      const status = statusFor(mean, row.operator, row.value);
      const d = new Date(today);
      d.setDate(d.getDate() - (AGED.has(propertyId) ? 1 : 3));
      out.push({
        trialId: tr.id,
        propertyId,
        readings: readingsAround(mean, rnd),
        mean,
        failureMode: status === 'pass' ? FAILURE_MODES[1 + Math.floor(rnd() * 2)] : FAILURE_MODES[0],
        testDate: d.toISOString().slice(0, 10),
        status,
      });
    });
  }
  return out;
}

/** Pending placeholders with due dates from the test plan. */
export function pendingResults(s: Scenario, trials: Trial[], today = new Date()): Result[] {
  const out: Result[] = [];
  s.measured.forEach((propertyId, i) => {
    const plan = s.testPlan[Math.min(i, s.testPlan.length - 1)];
    const due = new Date(today);
    due.setDate(due.getDate() + (plan?.dueInDays ?? 7));
    trials.forEach((tr) => out.push({ trialId: tr.id, propertyId, readings: [], mean: NaN, status: 'pending', dueDate: due.toISOString().slice(0, 10) }));
  });
  return out;
}

export function trialScore(trialId: string, results: Result[]): { pass: number; total: number } {
  const rs = results.filter((r) => r.trialId === trialId && r.status !== 'pending');
  return { pass: rs.filter((r) => r.status === 'pass').length, total: rs.length };
}

export function mustHavesMet(trialId: string, results: Result[], targets: TargetRow[]): boolean {
  const musts = targets.filter((t) => t.priority === 'must').map((t) => t.propertyId);
  const rs = results.filter((r) => r.trialId === trialId && musts.includes(r.propertyId));
  return rs.length > 0 && rs.every((r) => r.status === 'pass');
}

export function bestTrial(trials: Trial[], results: Result[]): Trial | undefined {
  return [...trials].sort((a, b) => {
    const sa = trialScore(a.id, results);
    const sb = trialScore(b.id, results);
    return sb.pass - sa.pass || b.id.localeCompare(a.id);
  })[0];
}

/** Analysis: propose the next iteration. */
export function proposeNext(s: Scenario, trials: Trial[], results: Result[], iteration: number): Proposal {
  const nextIdx = trials.length + 1;
  if (s.trialsIter2 && iteration === 1 && trials.some((t) => t.id === 'T3')) {
    const base = trials.find((t) => t.id === 'T3')!;
    const changes = s.trialsIter2.flatMap((t) =>
      Object.entries(t.recipe)
        .filter(([m, v]) => Math.abs((base.recipe[m] ?? 0) - v) > 1e-9)
        .map(([m, v]) => ({ trialId: t.id, materialId: m, from: base.recipe[m] ?? 0, to: v })),
    );
    return {
      trials: s.trialsIter2.map((t) => ({ ...t, recipe: { ...t.recipe } })),
      changes,
      summary:
        'T3 meets 12/14 targets. Heat-ageing adhesion is borderline (0.94 vs ≥ 1.0 N/mm²). Proposed: raise RDP 4.0 → 4.6 %, reduce Ca-formate 0.8 → 0.6 % [1][6]. T6 pushes RDP to 4.8 % as a safety margin.',
    };
  }
  const best = bestTrial(trials, results) ?? trials[trials.length - 1];
  const lever = s.leverMaterial in best.recipe ? s.leverMaterial : Object.keys(best.recipe).find((k) => k !== s.balanceMaterial)!;
  const from = best.recipe[lever];
  const mk = (id: string, f: number): Trial => {
    const recipe = balanceTo100({ ...best.recipe, [lever]: r2(from * f) }, s.balanceMaterial);
    return { id, iteration: iteration + 1, recipe, meta: Object.fromEntries(Object.keys(recipe).map((m) => [m, { by: 'helix' as const, confidence: 0.84 }])) };
  };
  const a = mk(`T${nextIdx}`, 1.15);
  const b = mk(`T${nextIdx + 1}`, 1.22);
  const sc = trialScore(best.id, results);
  return {
    trials: [a, b],
    changes: [a, b].flatMap((t) =>
      Object.entries(t.recipe)
        .filter(([m, v]) => Math.abs((best.recipe[m] ?? 0) - v) > 1e-9)
        .map(([m, v]) => ({ trialId: t.id, materialId: m, from: best.recipe[m] ?? 0, to: v })),
    ),
    summary: `${best.id} passes ${sc.pass}/${sc.total} measured targets. Raising the lever material by 15–22 % should close the remaining gaps; balance adjusted to keep 100.00 %.`,
  };
}
