import type { Pathway, Proposal, Result, StandardFamily, TargetRow, Trial } from '@/types';
import type { Scenario } from '@/data/scenarios/types';
import { profileFor } from '@/data/useCaseProfiles';
import { methodFor, PROP } from '@/data/properties';
import { balanceTo100, costPerKg, midpointRecipe } from './cost';
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
  const modes = profileFor(s.subcategoryId).failureModes;
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
        failureMode: status === 'pass' ? modes[1 + Math.floor(rnd() * 2)] : modes[0],
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
export function proposeNext(s: Scenario, trials: Trial[], results: Result[], iteration: number, costCeiling = s.constraints.costCeiling): Proposal {
  const nextIdx = trials.length + 1;
  if (s.trialsIter2 && s.iter2 && iteration === 1 && trials.some((t) => t.id === s.iter2!.base)) {
    const base = trials.find((t) => t.id === s.iter2!.base)!;
    const changes = s.trialsIter2.flatMap((t) =>
      Object.entries(t.recipe)
        .filter(([m, v]) => Math.abs((base.recipe[m] ?? 0) - v) > 1e-9)
        .map(([m, v]) => ({ trialId: t.id, materialId: m, from: base.recipe[m] ?? 0, to: v })),
    );
    return {
      trials: s.trialsIter2.map((t) => ({ ...t, recipe: { ...t.recipe } })),
      changes,
      summary: s.iter2.summary,
    };
  }
  // analysis only closes a trial under the cost ceiling: build on the best affordable trial (else the cheapest)
  // and step the lever back until the new trial fits, so iterations converge instead of drifting over budget
  const affordable = costCeiling === undefined ? trials : trials.filter((t) => costPerKg(t.recipe) <= costCeiling);
  const cheapest = [...trials].sort((a, b) => costPerKg(a.recipe) - costPerKg(b.recipe))[0];
  const best = (affordable.length ? bestTrial(affordable, results) : cheapest) ?? trials[trials.length - 1];
  const lever = s.leverMaterial in best.recipe ? s.leverMaterial : Object.keys(best.recipe).find((k) => k !== s.balanceMaterial)!;
  const from = best.recipe[lever];
  const recipeAt = (f: number) => balanceTo100({ ...best.recipe, [lever]: r2(from * f) }, s.balanceMaterial);
  const fit = (f: number) => {
    while (costCeiling !== undefined && f > 0.5 && costPerKg(recipeAt(f)) > costCeiling) f = r2(f - 0.01);
    return f;
  };
  const mk = (id: string, f: number): Trial => {
    const recipe = recipeAt(f);
    return { id, iteration: iteration + 1, recipe, meta: Object.fromEntries(Object.keys(recipe).map((m) => [m, { by: 'helix' as const, confidence: 0.84 }])) };
  };
  const fa = fit(1.15);
  const fb = fit(1.22);
  const a = mk(`T${nextIdx}`, fa);
  const b = mk(`T${nextIdx + 1}`, fb === fa ? r2(fa - 0.03) : fb);
  const capped = fa < 1.15;
  const sc = trialScore(best.id, results);
  return {
    trials: [a, b],
    changes: [a, b].flatMap((t) =>
      Object.entries(t.recipe)
        .filter(([m, v]) => Math.abs((best.recipe[m] ?? 0) - v) > 1e-9)
        .map(([m, v]) => ({ trialId: t.id, materialId: m, from: best.recipe[m] ?? 0, to: v })),
    ),
    summary: capped
      ? `${best.id} passes ${sc.pass}/${sc.total} measured targets. Adjusting the lever material only as far as the ₹ ${costCeiling}/kg cost ceiling allows; balance adjusted to keep 100.00 %.`
      : `${best.id} passes ${sc.pass}/${sc.total} measured targets. Raising the lever material by 15–22 % should close the remaining gaps; balance adjusted to keep 100.00 %.`,
  };
}
