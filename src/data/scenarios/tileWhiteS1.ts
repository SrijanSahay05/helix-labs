import type { Pathway, Source, Status, Trial } from '@/types';
import { TILE_SCENARIO } from '../demoProject';
import { TILE_WHITE_S1_PACK as PACK } from '../demo/packs/tileWhiteS1';
import type { Scenario } from './types';

/**
 * White C2TE S1 tile adhesive for India — the brief from the 2026-10-23 C2TE run (user answers D5–D11),
 * research from research/c2te-s1-white-india-20261118. Sources and pathways come from the research pack so both stay in step.
 */

const SOURCES: Source[] = PACK.hand.map(([, type, title, year, relevance, finding, cluster, id, snippet, extracted]) => ({
  id, type, title, year, relevance, finding, cluster: PACK.clusters[cluster].name, snippet, extracted: extracted.map(([label, value]) => ({ label, value })),
}));
const sourceId = Object.fromEntries(PACK.hand.map((h) => [h[0], h[7]]));

// same pass / borderline (10 %) bands as statusOf in research.ts
const status = (propertyId: string, v: number): Status => {
  const t = PACK.targets[propertyId];
  const ok = t.op === '>=' ? v >= t.target : v <= t.target;
  const near = t.op === '>=' ? v >= t.target * 0.9 : v <= t.target * 1.1;
  return ok ? 'pass' : near ? 'borderline' : 'fail';
};

const PATHWAYS: Pathway[] = PACK.routes.map((r, i) => ({
  id: r.id,
  rank: r.rank ?? i + 1,
  name: r.name,
  composition: r.composition.map(([materialId, a, b]) => ({ materialId, range: [a, b] })),
  predicted: r.predicted.map(([propertyId, value]) => ({ propertyId, value, status: status(propertyId, value) })),
  scores: r.scores,
  costPerKg: r.costPerKg,
  equipment: r.equipment,
  hazards: r.hazards.map((h) => h.text),
  citations: r.citations.map((c) => sourceId[c]),
}));

// demo lab data, not measured: iteration 1 is an RDP ladder around P1; iteration 2 builds on T3
const MATS = ['white-cement', 'sand', 'caco3', 'vae-rdp', 'mhec', 'starch-ether', 'ca-formate', 'cell-fibre', 'defoamer'];
const trial = (id: string, iteration: number, r: number[]): Trial => ({
  id,
  iteration,
  recipe: Object.fromEntries(MATS.map((m, i) => [m, r[i]])),
  meta: Object.fromEntries(MATS.map((m) => [m, { by: 'helix' as const, confidence: 0.9 }])),
});
const TRIALS_ITER1 = [
  trial('T1', 1, [35, 53.05, 8, 3.0, 0.35, 0.05, 0.4, 0.1, 0.05]),
  trial('T2', 1, [35, 52.3, 8, 3.75, 0.35, 0.05, 0.4, 0.1, 0.05]),
  trial('T3', 1, [35, 51.55, 8, 4.5, 0.35, 0.05, 0.4, 0.1, 0.05]),
  trial('T4', 1, [35, 50.8, 8, 5.25, 0.35, 0.05, 0.4, 0.1, 0.05]),
];
const TRIALS_ITER2 = [
  trial('T5', 2, [35, 50.84, 8, 5.0, 0.35, 0.06, 0.4, 0.3, 0.05]),
  trial('T6', 2, [35, 50.43, 8, 5.25, 0.35, 0.07, 0.4, 0.45, 0.05]),
];

export const TILE_WHITE_S1: Scenario = {
  ...TILE_SCENARIO,
  id: 'tile-white-s1',
  label: 'White C2TE S1 tile adhesive',
  chip: 'White tile adhesive · C2TE S1',
  example: 'White C2TE S1 tile adhesive for vitrified floors in India',
  keywords: ['white tile adhesive', 'white adhesive', 'c2tes1', 'c2te s1', 'vitrofix', 'extrofix', 'roff'],
  projectName: 'White C2TE S1 tile adhesive — India',
  codePrefix: 'HX-TW',
  productGuess: 'Polymer-modified white cementitious tile adhesive (deformable S1)',
  standard: 'ISO 13007-1 C2TE S1',
  standardAlt: 'IS 15477:2019',
  useCase: {
    substrate: 'Cement screed / concrete / plaster',
    surfaces: ['Floor', 'Wall', 'Wet area'],
    materialType: 'Vitrified / natural stone',
    size: { w: 1200, h: 600, t: 6 },
    exposure: 'interior',
    climate: 'Hot-humid',
    appTemp: [5, 35],
    load: 'Light foot',
    method: 'Notched trowel',
    timeToGroutH: 24,
    timeToTrafficH: 24,
    standardClass: 'ISO 13007-1 C2TE S1',
  },
  useCaseConfidence: { substrate: 0.9, surfaces: 0.88, materialType: 0.9, size: 0.62, exposure: 0.7, climate: 0.72, appTemp: 0.9, load: 0.8, method: 0.92, timeToGroutH: 0.8, timeToTrafficH: 0.7, standardClass: 0.95 },
  benchmarks: [
    {
      id: 'bm-tw-leader', name: 'Benchmark L (market-leader S1)', maker: 'Competitor 1', subcategoryId: 'ta-c2te-s1', standardClass: 'C2TES1 / IS 15477 Type 4 T S1', updated: '2026-09-17',
      values: [
        { propertyId: 'adh-initial', value: 1.6, unit: 'N/mm²', tag: 'TDS', confidence: 0.95 },
        { propertyId: 'adh-water', value: 1.25, unit: 'N/mm²', tag: 'TDS', confidence: 0.95 },
        { propertyId: 'adh-heat', value: 1.5, unit: 'N/mm²', tag: 'TDS', confidence: 0.95 },
        { propertyId: 'adh-ft', value: 1.2, unit: 'N/mm²', tag: 'TDS', confidence: 0.94 },
        { propertyId: 'transverse-def', value: 3.4, unit: 'mm', tag: 'TDS', confidence: 0.94 },
        { propertyId: 'slip', value: 0.3, unit: 'mm', tag: 'TDS', confidence: 0.93 },
        { propertyId: 'pot-life', value: 2, unit: 'h', tag: 'TDS', confidence: 0.9 },
      ],
      versions: [{ v: 1, date: '2026-09-17', note: 'Created from TDS (quote-verified)' }],
    },
    {
      id: 'bm-tw-ref', name: 'Benchmark V (reference, no S1)', maker: 'Competitor 1', subcategoryId: 'ta-c2te-s1', standardClass: 'C2TE / IS 15477 Type 2 T', updated: '2026-10-23',
      values: [
        { propertyId: 'adh-initial', value: 1.0, unit: 'N/mm²', tag: 'TDS', confidence: 0.7 },
        { propertyId: 'adh-water', value: 1.0, unit: 'N/mm²', tag: 'TDS', confidence: 0.7 },
        { propertyId: 'adh-heat', value: 1.0, unit: 'N/mm²', tag: 'TDS', confidence: 0.7 },
        { propertyId: 'slip', value: 0.5, unit: 'mm', tag: 'TDS', confidence: 0.7 },
        { propertyId: 'pot-life', value: 2, unit: 'h', tag: 'TDS', confidence: 0.8 },
      ],
      versions: [{ v: 1, date: '2026-10-23', note: 'Created from TDS (OCR) — values echo the standard requirements' }],
    },
  ],
  targets: [
    { propertyId: 'adh-initial', operator: '>=', value: 1.0, priority: 'must', std: '≥ 1.0', stdMin: 1.0, bench: 1.6, confidence: 0.97, reason: 'C2 requirement (ISO 13007-1)' },
    { propertyId: 'adh-water', operator: '>=', value: 1.0, priority: 'must', std: '≥ 1.0', stdMin: 1.0, bench: 1.25, confidence: 0.96, reason: 'C2 requirement; wet areas' },
    { propertyId: 'adh-heat', operator: '>=', value: 1.0, priority: 'must', std: '≥ 1.0', stdMin: 1.0, bench: 1.5, confidence: 0.96, reason: 'C2 requirement; Indian heat' },
    { propertyId: 'adh-ft', operator: '>=', value: 1.0, priority: 'must', std: '≥ 1.0', stdMin: 1.0, bench: 1.2, confidence: 0.8, reason: 'Class requirement, low relevance in most of India' },
    { propertyId: 'slip', operator: '<=', value: 0.5, priority: 'must', std: '≤ 0.5', stdMax: 0.5, bench: 0.3, confidence: 0.95, reason: '"T" class — walls and heavy stone' },
    { propertyId: 'open-time', operator: '>=', value: 0.5, priority: 'must', std: '≥ 0.5 @ 30 min', stdMin: 0.5, confidence: 0.95, reason: '"E" extended open time' },
    { propertyId: 'transverse-def', operator: '>=', value: 2.5, priority: 'must', std: '2.5 – <5', stdMin: 2.5, bench: 3.4, confidence: 0.93, reason: 'S1 required by the user; above the reference' },
    { propertyId: 'pot-life', operator: '>=', value: 2, priority: 'important', bench: 2, confidence: 0.8, reason: 'Match the reference (≈ 120 min)' },
    { propertyId: 'polymer-content', operator: 'between', value: [3, 6.5], priority: 'important', confidence: 0.7, reason: 'C2 window 3–6 % [P01]; S1 dose unmeasured' },
  ],
  top3: [
    { id: 'transverse-def', reason: 'S1 is the step above the reference product' },
    { id: 'adh-water', reason: 'Wet areas — bond after immersion' },
    { id: 'cost', reason: 'No ceiling, but RDP is 28–46 % of raw-material cost' },
  ],
  constraints: {
    costCeiling: 25,
    budgetBand: 'premium',
    materialLimits: [{ materialId: 'opc53', exclude: true }, { materialId: 'fly-ash', exclude: true }, { materialId: 'gypsum', exclude: true }],
    compliance: ['Low VOC'],
    site: { tMin: 5, tMax: 35, rhMax: 95 },
    mustHaves: ['White colour', 'Works in Indian heat'],
    remark: 'White only; India only; no hard cost ceiling — ₹25/kg is a review line. 20 kg bag.',
  },
  summary: {
    scientist:
      '**Helix is formulating:** a white polymer-modified cementitious tile adhesive to **ISO 13007-1 C2TE S1** (IS 15477:2019 also applies) for **vitrified tiles and natural stone** on floors, walls and wet areas in **India**. It must **beat the reference on deformability (≥ 2.5 mm, S1)** and match the market-leader S1 product on adhesion, with **no hard cost ceiling**.',
    plain:
      '**Helix is making:** a **white tile glue** for **big tiles and stone** in **Indian homes and buildings**, inside and in wet areas. It should **grip as well as the best competitor** and **flex more than the reference product**, priced as a premium product.',
  },
  pathways: PATHWAYS,
  balanceMaterial: 'sand',
  leverMaterial: 'vae-rdp',
  clusters: PACK.clusters.map((c) => c.name),
  query: PACK.query.replace('\n', ' '),
  sources: SOURCES,
  curated: true,
  trials: TRIALS_ITER1,
  trialsIter2: TRIALS_ITER2,
  iter2: {
    base: 'T3',
    summary:
      'T3 (4.5 % RDP) passes 6/7 must-haves, but transverse deformation is borderline (2.41 vs ≥ 2.5 mm) — below the 3.0 mm the research predicted. T4 (5.25 %) reaches S1 (2.63 mm) but slips 0.57 mm: more polymer softens the paste. Proposed: RDP 4.5 → 5.0 % for S1, with white cellulose fibre 0.1 → 0.3 % and starch ether 0.05 → 0.06 % to hold slip. T6 takes RDP to 5.25 % with more fibre as a margin.',
  },
  resultMeans: {
    'adh-initial': { T1: 1.18, T2: 1.29, T3: 1.38, T4: 1.46, T5: 1.44, T6: 1.47 },
    'adh-water': { T1: 0.94, T2: 1.03, T3: 1.09, T4: 1.14, T5: 1.13, T6: 1.15 },
    'adh-heat': { T1: 0.91, T2: 1.01, T3: 1.08, T4: 1.15, T5: 1.13, T6: 1.16 },
    'adh-ft': { T1: 0.97, T2: 1.04, T3: 1.08, T4: 1.12, T5: 1.1, T6: 1.12 },
    'open-time': { T1: 0.58, T2: 0.57, T3: 0.55, T4: 0.53, T5: 0.54, T6: 0.52 },
    slip: { T1: 0.28, T2: 0.33, T3: 0.41, T4: 0.57, T5: 0.36, T6: 0.31 },
    'transverse-def': { T1: 1.95, T2: 2.21, T3: 2.41, T4: 2.63, T5: 2.58, T6: 2.67 },
  },
  mixingProtocol: [
    'Pre-blend MHEC, starch ether, calcium formate, cellulose fibre and defoamer with 2 kg of CaCO₃ for 2 min (master-batch).',
    'Charge sand, white cement and remaining CaCO₃ into the ribbon blender; dry-mix 3 min.',
    'Add VAE RDP and the master-batch; mix 5 min until uniformly white.',
    'Lab mixing: add 26 % water to powder, mix 30 s slow, rest 60 s, remix 15 s.',
    'Mature 5 min, remix 15 s, then cast specimens within 10 min.',
  ],
};
