import type { OrbState } from '@/components/ai/HelixOrb';
import type { ResearchData } from '@/data/demo/research';

/** Timeline of the Research preview: 6 Lumen steps, the handoff, then 4 Weave steps (~60 s at 1×). */

export type StepId = 'analyse' | 'identify' | 'strategy' | 'search' | 'cluster' | 'extract' | 'generate' | 'predict' | 'score' | 'rank';

export interface StepDef {
  id: StepId;
  agent: 'scholar' | 'weaver';
  label: string;
  plain: string;
  /** duration at 1× in ms (includes the text hold) */
  ms: number;
  orb: OrbState;
  metric: (d: ResearchData) => string;
}

export const STEPS: StepDef[] = [
  { id: 'analyse', agent: 'scholar', label: 'Analyse', plain: 'Understand', ms: 4500, orb: 'searching', metric: (d) => `${d.concepts.length} concepts` },
  { id: 'identify', agent: 'scholar', label: 'Identify', plain: 'Find words', ms: 5000, orb: 'searching', metric: (d) => `${d.keywords.reduce((a, k) => a + k.synonyms.length, 0)} terms` },
  { id: 'strategy', agent: 'scholar', label: 'Strategy', plain: 'Plan', ms: 6000, orb: 'searching', metric: (d) => `${d.plan.length} sources` },
  { id: 'search', agent: 'scholar', label: 'Search', plain: 'Look', ms: 9500, orb: 'searching', metric: (d) => `${d.counts.scanned}` },
  { id: 'cluster', agent: 'scholar', label: 'Cluster', plain: 'Group', ms: 6500, orb: 'searching', metric: (d) => `${d.clusters.length} clusters` },
  { id: 'extract', agent: 'scholar', label: 'Extract', plain: 'Note facts', ms: 8000, orb: 'searching', metric: (d) => `${d.counts.facts} facts` },
  { id: 'generate', agent: 'weaver', label: 'Generate', plain: 'Draft', ms: 7000, orb: 'weaving', metric: (d) => `${d.routes.length} routes` },
  { id: 'predict', agent: 'weaver', label: 'Predict', plain: 'Predict', ms: 5500, orb: 'solving', metric: (d) => `${d.routes.filter((r) => r.feasible).length} routes` },
  { id: 'score', agent: 'weaver', label: 'Score', plain: 'Score', ms: 4000, orb: 'solving', metric: (d) => `${Math.max(...d.routes.map((r) => r.scores.overall)).toFixed(2)}` },
  { id: 'rank', agent: 'weaver', label: 'Rank', plain: 'Rank', ms: 3500, orb: 'weaving', metric: (d) => `${d.routes.find((r) => r.rank === 1)?.id ?? 'P1'} first` },
];

export const STEP_INDEX = Object.fromEntries(STEPS.map((s, i) => [s.id, i])) as Record<StepId, number>;
export const LIT_COUNT = 6;
/** step index meaning "everything done" */
export const END = STEPS.length;

export const TOTAL_MS = STEPS.reduce((a, s) => a + s.ms, 0);

/** Sub-phases within a step, as fractions of its progress. */
export const PHASE = {
  search: { rain: [0, 0.5] as const, screen: [0.58, 0.92] as const },
  cluster: { move: [0, 0.55] as const, hulls: [0.3, 0.9] as const },
  extract: { facts: [0.04, 0.86] as const },
  generate: { appear: [0, 0.25] as const, reject: [0.3, 0.85] as const, collapse: [0.88, 1] as const },
};

/** 0 → 1 inside [a, b] */
export function seg(t: number, [a, b]: readonly [number, number]): number {
  return Math.max(0, Math.min(1, (t - a) / (b - a)));
}

export const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);

/** Which section the page follows for a step: literature act, the bridge, or the pathways act. */
export function followTarget(step: number): 'act-lit' | 'bridge' | 'act-path' | 'end' {
  if (step < LIT_COUNT) return 'act-lit';
  if (step === STEP_INDEX.generate) return 'bridge';
  if (step < END) return 'act-path';
  return 'end';
}

/** Live Act 1 counters (shared by the act header and the funnel). */
export function litCounts(d: ResearchData, step: number, search: number, extract: number) {
  const si = STEP_INDEX.search;
  const ei = STEP_INDEX.extract;
  const rain = step > si ? 1 : step === si ? seg(search, PHASE.search.rain) : 0;
  const screen = step > si ? 1 : step === si ? seg(search, PHASE.search.screen) : 0;
  const facts = step > ei ? 1 : step === ei ? seg(extract, PHASE.extract.facts) : 0;
  return {
    scanned: Math.round(d.counts.scanned * rain),
    screened: Math.round(d.counts.screened * seg(screen, [0, 0.5])),
    relevant: Math.round(d.counts.relevant * seg(screen, [0.4, 0.95])),
    facts: Math.ceil(d.counts.facts * facts),
  };
}
