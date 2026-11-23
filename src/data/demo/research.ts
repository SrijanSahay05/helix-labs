import seedrandom from 'seedrandom';
import { SCENARIO } from '@/data/scenarios';
import { MAT } from '@/data/rawMaterials';
import { PROP } from '@/data/properties';
import type { Status } from '@/types';
import { RESEARCH_PACKS } from './packs';

/**
 * Research preview seed (Step 9 of 10). Demo data — generic titles, no real authors or patent numbers.
 * The tile-adhesive numbers follow the Research preview prompt §11 exactly; other scenarios are scaled.
 */

export type RType = 'Paper' | 'Patent' | 'TDS' | 'Supplier sheet' | 'Uploaded';
export const R_TYPES: Exclude<RType, 'Uploaded'>[] = ['Paper', 'Patent', 'TDS', 'Supplier sheet'];
export type RStatus = 'out' | 'screened' | 'relevant';

export interface RSource {
  id: string;
  /** citation label, e.g. P12 / T07 / S04 / PT03 */
  ref: string;
  type: RType;
  title: string;
  year: number;
  relevance: number;
  finding: string;
  /** cluster index, −1 when not relevant */
  cluster: number;
  status: RStatus;
  top?: boolean;
  snippet?: string;
  extracted?: { label: string; value: string }[];
  /** id of the matching source in the real Literature stage (carry-over) */
  projectSourceId?: string;
}

export interface RCluster {
  id: number;
  name: string;
  plain: string;
  count: number;
  facts: number;
  signal: string;
  plainSignal: string;
}

export interface RFact {
  id: string;
  fact: string;
  plain: string;
  value: string;
  condition: string;
  sourceId: string;
  cluster: number;
}

export interface RComp {
  materialId: string;
  name: string;
  fn: string;
  range: [number, number];
  /** min–max dosage seen in the literature */
  lit: [number, number];
}

export interface RPred {
  propertyId: string;
  name: string;
  plain: string;
  unit: string;
  op: '>=' | '<=';
  target: number;
  value: number;
  unc: number;
  status: Status;
  must: boolean;
}

export interface RRoute {
  id: string;
  name: string;
  plain: string;
  feasible: boolean;
  rank?: number;
  reason?: string;
  constraint?: string;
  costPerKg: number;
  scores: { targetMatch: number; cost: number; availability: number; overall: number };
  evidence: number;
  composition: RComp[];
  predicted: RPred[];
  equipment: string[];
  hazards: { text: string; kind: 'hazard' | 'risk' }[];
  citations: string[];
  note?: string;
}

export interface RConcept {
  title: string;
  plain: string;
}

export interface RKeyword {
  concept: number;
  term: string;
  synonyms: string[];
}

export interface RFlow {
  cluster: number;
  route: string;
  value: number;
  factIds: string[];
}

export interface ResearchData {
  scenarioId: string;
  briefLabel: string;
  standard: string;
  ceiling: number;
  concepts: RConcept[];
  keywords: RKeyword[];
  query: string;
  plan: string[];
  filters: string[];
  counts: { scanned: number; screened: number; relevant: number; facts: number; byType: Record<Exclude<RType, 'Uploaded'>, number> };
  sources: RSource[];
  clusters: RCluster[];
  facts: RFact[];
  routes: RRoute[];
  flows: RFlow[];
  why: string;
  plainWhy: string;
  summary: string;
  plainSummary: string;
}

/* ------------------------------------------------------------------ research packs */

export type Hand = [ref: string, type: RType, title: string, year: number, rel: number, finding: string, cluster: number, projectSourceId: string, snippet: string, extracted: [string, string][]];
export type HandFact = [fact: string, plain: string, value: string, condition: string, ref: string];
export type PredSeed = [propertyId: string, value: number, unc: number];
export type TargetMap = Record<string, { op: '>=' | '<='; target: number; must: boolean }>;
export type RouteSeed = Omit<RRoute, 'feasible' | 'composition' | 'predicted'> & { composition: [materialId: string, min: number, max: number][]; predicted: PredSeed[] };
type Quota = Record<Exclude<RType, 'Uploaded'>, { total: number; relevant: number; screened: number }>;

/**
 * Hand-written research for one demo scenario (see packs/index.ts). Every relevant source not in `hand`
 * and every fact not in `facts` is generated to fill the cluster counts.
 */
export interface ResearchPack {
  /** seedrandom key for the generated sources */
  seed: string;
  briefLabel: string;
  /** sources scanned per type; defaults to the §11 tile quota */
  typeQuota?: Quota;
  /** how many hand sources are shown as top cards */
  topCount: number;
  clusters: Omit<RCluster, 'id'>[];
  hand: Hand[];
  facts: HandFact[];
  /** extra facts per cluster index, used before generic filler */
  factPool?: Record<number, [string, string, string][]>;
  /** literature dosage windows that override P_LIT */
  lit?: Record<string, [number, number]>;
  targets: TargetMap;
  routes: RouteSeed[];
  rejected: [name: string, reason: string, constraint: string, cost: number, match: number][];
  /** facts per cluster → feasible route; each row must sum to the cluster's facts */
  sankey: number[][];
  concepts: RConcept[];
  keywords: RKeyword[];
  query: string;
  plan?: string[];
  filters?: string[];
  why: string;
  plainWhy: string;
  /** closing sentence of the summary */
  evidence: string;
  plainEvidence: string;
}

const TYPE_QUOTA: Quota = {
  Paper: { total: 248, relevant: 38, screened: 74 },
  Patent: { total: 71, relevant: 9, screened: 21 },
  TDS: { total: 58, relevant: 9, screened: 17 },
  'Supplier sheet': { total: 35, relevant: 7, screened: 11 },
};

const P_LIT: Record<string, [number, number]> = {
  opc53: [25, 40], sand: [45, 65], caco3: [0, 10], 'vae-rdp': [1, 8], mhec: [0.15, 0.6], 'ca-formate': [0, 2], 'starch-ether': [0, 0.1], defoamer: [0, 0.1], 'acrylic-rdp': [0, 3], 'fly-ash': [0, 15], gypsum: [0, 10],
};

function statusOf(op: '>=' | '<=', target: number, v: number): Status {
  const eps = 1e-9;
  if (op === '>=') return v >= target - eps ? 'pass' : v >= target * 0.9 - eps ? 'borderline' : 'fail';
  return v <= target + eps ? 'pass' : v <= target * 1.1 + eps ? 'borderline' : 'fail';
}

function preds(seeds: PredSeed[], targets: TargetMap): RPred[] {
  return seeds
    .map(([propertyId, value, unc]) => {
      const t = targets[propertyId] ?? { op: '>=' as const, target: value, must: false };
      const p = PROP[propertyId];
      return { propertyId, name: p?.name ?? propertyId, plain: p?.plainName ?? propertyId, unit: p?.unit ?? '', op: t.op, target: t.target, value, unc, status: statusOf(t.op, t.target, value), must: t.must };
    })
    .sort((a, b) => Number(b.must) - Number(a.must));
}

function comp(pairs: [string, number, number][], lit: Record<string, [number, number]> = P_LIT): RComp[] {
  return pairs.map(([m, a, b]) => ({ materialId: m, name: MAT[m]?.name ?? m, fn: MAT[m]?.fn ?? '', range: [a, b], lit: lit[m] ?? P_LIT[m] ?? [Math.max(0, a * 0.5), b * 1.5] }));
}

/* ------------------------------------------------------------------ generic helpers */

const OFF_TOPIC = [
  'Durability of cementitious repair mortars in marine exposure',
  'Rheology of self-levelling underlayments',
  'Shrinkage of lightweight concrete blocks',
  'Grinding aids in cement manufacture',
  'Corrosion inhibitors for reinforced concrete',
  'Fire resistance of gypsum boards',
  'Pigment dispersion in exterior paints',
  'Bitumen membranes for flat roofs',
  'Alkali-silica reaction in aggregates',
  'Workability of ready-mix concrete in hot weather',
  'Epoxy floor coatings for warehouses',
  'Thermal insulation renders with EPS beads',
  'Efflorescence on clay brick facades',
  'Fibre-reinforced shotcrete for tunnels',
  'Waterproofing admixtures for basement concrete',
  'Plaster cracking on AAC walls',
];
const ON_TOPIC = ['Influence of {c} on {p}', 'A study of {c} in {p} under tropical exposure', 'Optimising {c} for {p}: a design-of-experiments approach', 'Microstructure of {p} as affected by {c}', 'Composition for {p} with improved {c}', '{c} — product data for {p}', '{c} grade overview for dry-mix {p}'];

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function splitCounts(total: number, n: number, weights?: number[]): number[] {
  const w = weights ?? Array.from({ length: n }, (_, i) => n - i * 0.6);
  const sum = w.reduce((a, b) => a + b, 0);
  const out = w.map((x) => Math.floor((x / sum) * total));
  let rest = total - out.reduce((a, b) => a + b, 0);
  for (let i = 0; rest > 0; i = (i + 1) % n, rest--) out[i]++;
  return out;
}

function refPrefix(t: RType) {
  return t === 'Paper' ? 'P' : t === 'Patent' ? 'PT' : t === 'TDS' ? 'T' : t === 'Supplier sheet' ? 'S' : 'U';
}

function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const cache = new Map<string, ResearchData>();

/** Deterministic research seed for a scenario: its research pack when one is registered, otherwise generated. */
export function buildResearch(scenarioId = 'tile'): ResearchData {
  const hit = cache.get(scenarioId);
  if (hit) return hit;
  const s = SCENARIO[scenarioId] ?? SCENARIO.tile;
  const pack = RESEARCH_PACKS[s.id];
  const rnd = seedrandom(pack?.seed ?? `helix-research:${s.id}`);
  const product = s.label.toLowerCase();
  const quota = pack?.typeQuota ?? TYPE_QUOTA;

  /* clusters */
  const clusters: RCluster[] = pack
    ? pack.clusters.map((c, id) => ({ ...c, id }))
    : (() => {
        const counts = splitCounts(63, s.clusters.length);
        const facts = splitCounts(41, s.clusters.length);
        return s.clusters.map((name, id) => ({ id, name, plain: name, count: counts[id], facts: facts[id], signal: `${name} is the most cited lever for this brief`, plainSignal: `${name} matters most here` }));
      })();

  /* hand-written top sources */
  const used = new Set<string>();
  const hand: RSource[] = pack
    ? pack.hand.map(([ref, type, title, year, relevance, finding, cluster, projectSourceId, snippet, extracted], i) => ({ id: `rs-${ref}`, ref, type, title, year, relevance, finding, cluster, status: 'relevant', top: i < pack.topCount, snippet, extracted: extracted.map(([label, value]) => ({ label, value })), projectSourceId }))
    : s.sources.slice(0, 12).map((x, i) => {
        const type: RType = x.type === 'Uploaded' || x.type === 'Internal formulation' ? 'Paper' : x.type;
        const ref = `${refPrefix(type)}${String(3 + i * 7).padStart(2, '0')}`;
        const ci = Math.max(0, s.clusters.indexOf(x.cluster));
        return { id: `rs-${ref}`, ref, type, title: x.title, year: x.year, relevance: x.relevance, finding: x.finding, cluster: ci >= 0 ? ci : i % clusters.length, status: 'relevant' as const, top: i < 5, snippet: x.snippet ?? x.finding, extracted: x.extracted, projectSourceId: x.id };
      });
  hand.forEach((h) => used.add(h.ref));

  /* the rest of the scanned sources, by type quota */
  const handByType = (t: RType) => hand.filter((h) => h.type === t).length;
  const counters: Record<string, number> = { P: 1, PT: 1, T: 1, S: 1 };
  const nextRef = (t: RType) => {
    const p = refPrefix(t);
    let r: string;
    do r = `${p}${String(counters[p]++).padStart(2, '0')}`;
    while (used.has(r));
    used.add(r);
    return r;
  };
  // relevant slots still needed per cluster
  const needed = clusters.map((c) => c.count - hand.filter((h) => h.cluster === c.id).length);
  const clusterBag = shuffle(needed.flatMap((n, ci) => Array.from({ length: Math.max(0, n) }, () => ci)), rnd);
  const gen: RSource[] = [];
  let g = 0;
  for (const type of R_TYPES) {
    const q = quota[type];
    const rel = Math.max(0, q.relevant - handByType(type));
    const statuses: RStatus[] = shuffle([...Array<RStatus>(rel).fill('relevant'), ...Array<RStatus>(q.screened).fill('screened'), ...Array<RStatus>(q.total - q.relevant - q.screened).fill('out')], rnd);
    for (const status of statuses) {
      const ref = nextRef(type);
      const cluster = status === 'relevant' ? (clusterBag.pop() ?? 0) : -1;
      const cname = cluster >= 0 ? clusters[cluster].name.toLowerCase() : '';
      const title =
        status === 'relevant'
          ? cap(ON_TOPIC[Math.floor(rnd() * ON_TOPIC.length)].replace('{c}', cname).replace('{p}', product))
          : status === 'screened'
            ? cap(ON_TOPIC[Math.floor(rnd() * 4)].replace('{c}', ['curing', 'pigments', 'packaging', 'pot life', 'colour stability', 'storage'][Math.floor(rnd() * 6)]).replace('{p}', product))
            : OFF_TOPIC[Math.floor(rnd() * OFF_TOPIC.length)];
      const relevance = status === 'relevant' ? 0.6 + rnd() * 0.15 : status === 'screened' ? 0.35 + rnd() * 0.22 : 0.05 + rnd() * 0.28;
      gen.push({
        id: `rs-${ref}`,
        ref,
        type,
        title,
        year: 2010 + Math.floor(rnd() * 17),
        relevance: Math.round(relevance * 100) / 100,
        finding: status === 'relevant' ? `Reports a measurable effect of ${cname} on key ${product} properties.` : status === 'screened' ? 'Related product, but no values that apply to this brief.' : 'Off-topic for this brief.',
        cluster,
        status,
        snippet: status === 'relevant' ? `The study varied ${cname} and measured its effect on adhesion, workability and durability.` : undefined,
        projectSourceId: status === 'relevant' && g < 48 ? `${s.id}-g${g++}` : undefined,
      });
    }
  }
  const sources = [...hand, ...gen];

  /* facts */
  const facts: RFact[] = [];
  const byRef = new Map(sources.map((x) => [x.ref, x]));
  pack?.facts.forEach(([fact, plain, value, condition, ref], i) => facts.push({ id: `f${i + 1}`, fact, plain, value, condition, sourceId: byRef.get(ref)!.id, cluster: byRef.get(ref)!.cluster }));
  clusters.forEach((c) => {
    const have = facts.filter((f) => f.cluster === c.id).length;
    const pool = pack?.factPool?.[c.id] ?? [];
    const srcs = sources.filter((x) => x.cluster === c.id && !x.top);
    for (let k = have; k < c.facts; k++) {
      const p = pool[k - have] ?? [`${c.name} — reported effect ${k + 1}`, ['+0.08', '−6 %', '+12 %', '0.3–0.5 %'][k % 4], ['28 d', 'lab, 23 °C', '—', 'site trial'][k % 4]];
      const src = srcs[k % Math.max(1, srcs.length)] ?? sources.find((x) => x.cluster === c.id)!;
      facts.push({ id: `f${facts.length + 1}`, fact: p[0], plain: p[0], value: p[1], condition: p[2], sourceId: src.id, cluster: c.id });
    }
  });

  /* routes */
  const ceiling = s.constraints.costCeiling ?? 18;
  let routes: RRoute[];
  if (pack) {
    const feas = pack.routes.map((r): RRoute => ({ ...r, feasible: true, composition: comp(r.composition, pack.lit), predicted: preds(r.predicted, pack.targets) }));
    const rej = pack.rejected.map(([name, reason, constraint, cost, match], i): RRoute => ({ id: `R${String(i + feas.length + 1).padStart(2, '0')}`, name, plain: name, feasible: false, reason, constraint, costPerKg: cost, scores: { targetMatch: match, cost: 0, availability: 0, overall: 0 }, evidence: 0, composition: [], predicted: [], equipment: [], hazards: [], citations: [] }));
    routes = [...feas, ...rej];
  } else {
    const tmap = Object.fromEntries(s.targets.map((t) => [t.propertyId, { op: (t.operator === '<=' ? '<=' : '>=') as '>=' | '<=', target: Array.isArray(t.value) ? t.value[0] : t.value, must: t.priority === 'must' }]));
    const refs = hand.map((h) => h.ref);
    const feas: RRoute[] = s.pathways.slice(0, 5).map((p, i) => ({
      id: p.id,
      rank: i + 1,
      feasible: true,
      name: p.name,
      plain: p.name,
      costPerKg: p.costPerKg,
      scores: p.scores,
      evidence: Math.max(0.4, p.scores.overall),
      composition: comp(p.composition.map((c) => [c.materialId, c.range[0], c.range[1]])),
      predicted: preds(p.predicted.map((x) => [x.propertyId, x.value, Math.round(Math.abs(x.value) * 0.06 * 100) / 100]), tmap),
      equipment: p.equipment,
      hazards: p.hazards.map((h) => ({ text: h, kind: /cost|supply|risk|weak|higher/i.test(h) ? ('risk' as const) : ('hazard' as const) })),
      citations: refs.slice(i, i + 3),
      note: p.costPerKg > ceiling ? 'over ceiling' : undefined,
    }));
    const reasons: [string, string][] = [['over cost ceiling', `Cost ≤ ₹${ceiling}/kg`], ['no approved supplier', 'Approved suppliers only'], ['VOC limit', 'Low VOC'], ['fails a must-have', 'Must-have target'], ['excluded material', 'Material limits'], ['chlorides not allowed', 'No chlorides'], ['below standard minimum', s.standard]];
    const rej = Array.from({ length: 12 - feas.length }, (_, i): RRoute => {
      const [reason, constraint] = reasons[i % reasons.length];
      return { id: `R${String(feas.length + i + 1).padStart(2, '0')}`, name: `Alternative route ${i + 1}`, plain: `Alternative route ${i + 1}`, feasible: false, reason, constraint, costPerKg: Math.round(ceiling * (0.6 + rnd() * 0.7) * 10) / 10, scores: { targetMatch: Math.round((0.35 + rnd() * 0.5) * 100) / 100, cost: 0, availability: 0, overall: 0 }, evidence: 0, composition: [], predicted: [], equipment: [], hazards: [], citations: [] };
    });
    routes = [...feas, ...rej];
  }

  /* sankey: facts per cluster → route */
  const feasible = routes.filter((r) => r.feasible);
  const flows: RFlow[] = [];
  clusters.forEach((c) => {
    const cf = facts.filter((f) => f.cluster === c.id);
    const row = pack ? pack.sankey[c.id] : splitCounts(cf.length, feasible.length, feasible.map((r) => r.scores.overall ** 2 + rnd() * 0.2));
    let k = 0;
    feasible.forEach((r, j) => {
      const v = row[j] ?? 0;
      if (v > 0) flows.push({ cluster: c.id, route: r.id, value: v, factIds: cf.slice(k, k + v).map((f) => f.id) });
      k += v;
    });
  });

  const relevant = sources.filter((x) => x.status === 'relevant').length;
  const top = feasible[0];
  const data: ResearchData = {
    scenarioId: s.id,
    briefLabel: pack?.briefLabel ?? s.chip,
    standard: s.standard,
    ceiling,
    concepts: pack?.concepts ?? [
      { title: s.productGuess, plain: s.label },
      { title: `${s.useCase.exposure === 'exterior' ? 'Exterior' : 'Interior'} · ${s.useCase.climate}`, plain: `${s.useCase.exposure === 'exterior' ? 'Outside' : 'Inside'} use, ${(s.useCase.climate ?? 'local').toLowerCase()} weather` },
      { title: `${s.top3.map((t) => PROP[t.id]?.name ?? t.id).slice(0, 2).join(' + ')} at ≤ ₹${ceiling}/kg`, plain: 'Performance that matters most, within budget' },
    ],
    keywords: pack?.keywords ?? s.clusters.slice(0, 5).map((c, i) => ({ concept: i % 3, term: c, synonyms: c.toLowerCase().split(/[ &]+/).filter((w) => w.length > 3) })),
    query: pack?.query ?? s.query.replace(/ AND \(/, '\nAND ('),
    plan: pack?.plan ?? ['Papers 2010–2026', 'Patents (IN, EP, US)', 'TDS library', 'Supplier sheets'],
    filters: pack?.filters ?? ['Language: English', 'Years: 2010–2026', 'Peer-reviewed + grey literature'],
    counts: {
      scanned: sources.length,
      screened: sources.filter((x) => x.status !== 'out').length,
      relevant,
      facts: facts.length,
      byType: Object.fromEntries(R_TYPES.map((t) => [t, quota[t].total])) as ResearchData['counts']['byType'],
    },
    sources,
    clusters,
    facts,
    routes,
    flows,
    why: pack?.why ?? `${top.id} has the best balance of target match (${top.scores.targetMatch.toFixed(2)}) and cost (₹${top.costPerKg.toFixed(1)}/kg) within the ₹${ceiling}/kg ceiling. It follows the strongest evidence [${top.citations[0] ?? hand[0]?.ref}]. ${feasible[1]?.id ?? ''} is the fallback.`,
    plainWhy: pack?.plainWhy ?? `${top.id} fits your needs best for the price [${top.citations[0] ?? hand[0]?.ref}].`,
    summary: `**${relevant}** relevant sources, **${clusters.length}** clusters, **${facts.length}** facts. Strongest evidence: ${pack?.evidence ?? `${clusters[0].name.toLowerCase()} and ${clusters[1]?.name.toLowerCase() ?? 'cost'} drive the key targets.`}`,
    plainSummary: `Helix read **${relevant}** useful sources, grouped them into **${clusters.length}** topics and noted **${facts.length}** facts. ${pack?.plainEvidence ?? 'A few ingredients matter most for your targets.'}`,
  };
  cache.set(scenarioId, data);
  return data;
}

/** Pareto front (min cost, max target match) over feasible routes, sorted by cost. */
export function paretoFront(routes: RRoute[]): RRoute[] {
  const f = routes.filter((r) => r.feasible);
  return f.filter((a) => !f.some((b) => b !== a && b.costPerKg <= a.costPerKg && b.scores.targetMatch >= a.scores.targetMatch && (b.costPerKg < a.costPerKg || b.scores.targetMatch > a.scores.targetMatch))).sort((a, b) => a.costPerKg - b.costPerKg);
}

export function allMustPass(r: RRoute): boolean {
  return r.feasible && r.predicted.filter((p) => p.must).every((p) => p.status === 'pass');
}
