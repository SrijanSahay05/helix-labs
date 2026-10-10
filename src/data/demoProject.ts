import type { Pathway, Source, Trial } from '@/types';
import type { Scenario } from './scenarios/types';
import { COMMON_GUIDED } from './scenarios/guided';

/** Default scenario: "Exterior tile adhesive — Large format". Demo data — for R&D to confirm. */

const trial = (id: string, iteration: number, r: number[]): Trial => {
  const ids = ['opc53', 'sand', 'caco3', 'vae-rdp', 'mhec', 'ca-formate', 'starch-ether', 'defoamer'];
  const recipe: Record<string, number> = {};
  ids.forEach((m, i) => (recipe[m] = r[i]));
  const meta = Object.fromEntries(ids.map((m) => [m, { by: 'helix' as const, confidence: 0.9 }]));
  return { id, iteration, recipe, meta };
};

export const TILE_TRIALS_ITER1: Trial[] = [
  trial('T1', 1, [33.0, 58.95, 3.5, 3.5, 0.35, 0.65, 0.03, 0.02]),
  trial('T2', 1, [33.0, 58.45, 3.5, 4.0, 0.35, 0.65, 0.03, 0.02]),
  trial('T3', 1, [33.0, 58.25, 3.5, 4.0, 0.4, 0.8, 0.03, 0.02]),
  trial('T4', 1, [35.0, 56.75, 2.5, 4.5, 0.4, 0.8, 0.03, 0.02]),
];

export const TILE_TRIALS_ITER2: Trial[] = [
  trial('T5', 2, [33.0, 57.85, 3.5, 4.6, 0.4, 0.6, 0.03, 0.02]),
  trial('T6', 2, [33.0, 57.65, 3.5, 4.8, 0.4, 0.6, 0.03, 0.02]),
];

export const TILE_SOURCES: Source[] = [
  { id: 's1', type: 'Paper', title: 'Effect of VAE redispersible powder dosage on heat-aged tensile adhesion of C2 tile adhesives', year: 2023, relevance: 0.96, finding: 'Heat-aged adhesion rises ~0.12 N/mm² per +0.5 % RDP between 3.5–5 %.', cluster: 'RDP type & dosage', snippet: 'At 4.5 % RDP the heat-aged adhesion exceeded 1.0 N/mm² on all substrates tested…', extracted: [{ label: 'RDP 4.5 % → heat-aged', value: '1.06 N/mm²' }, { label: 'RDP 3.5 % → heat-aged', value: '0.82 N/mm²' }] },
  { id: 's2', type: 'Paper', title: 'Cellulose ether viscosity grade and water retention in thin-bed mortars', year: 2022, relevance: 0.91, finding: 'MHEC 40k at 0.35–0.40 % gives ≥ 98 % water retention and 30 min open time.', cluster: 'Cellulose ether & water retention', snippet: 'Water retention plateaued above 0.38 % MHEC…', extracted: [{ label: 'MHEC 0.40 %', value: 'WR 98.6 %' }] },
  { id: 's3', type: 'Patent', title: 'Deformable cementitious adhesive composition with hybrid polymer powder', year: 2021, relevance: 0.88, finding: 'VAE + acrylic hybrid powder reaches S1 deformation at lower total polymer.', cluster: 'Deformability', snippet: 'Claim 1: a dry-mix adhesive comprising 3–6 % hybrid powder…', extracted: [{ label: 'Transverse deformation', value: '3.1 mm' }] },
  { id: 's4', type: 'TDS', title: 'Benchmark A — Technical Data Sheet', year: 2025, relevance: 0.93, finding: 'C2TE S1, adhesion 1.35 / 1.10 / 1.05 / 1.08 N/mm², deformation 2.8 mm.', cluster: 'Fillers & cost', snippet: 'Classification: EN 12004 C2TE S1…' },
  { id: 's5', type: 'Supplier sheet', title: 'VAE RDP grade A — supplier sheet', year: 2025, relevance: 0.84, finding: 'Tg 0 °C, recommended 3–6 % in deformable C2 adhesives.', cluster: 'RDP type & dosage' },
  { id: 's6', type: 'Paper', title: 'Calcium formate as accelerator in polymer-modified cementitious adhesives', year: 2020, relevance: 0.8, finding: '> 0.8 % Ca-formate shortens open time and slightly lowers heat-aged adhesion.', cluster: 'Accelerators', extracted: [{ label: 'Ca-formate 1.0 %', value: 'open time −6 min' }] },
  { id: 's7', type: 'Paper', title: 'Failure mechanisms of tile adhesives under thermal ageing at 70 °C', year: 2024, relevance: 0.86, finding: 'Polymer film degradation at the tile interface drives adhesive-mode failure.', cluster: 'Heat-ageing failure mechanisms' },
  { id: 's8', type: 'Paper', title: 'Starch ether as anti-slip agent for large-format wall tiling', year: 2021, relevance: 0.78, finding: '0.02–0.05 % starch ether keeps slip ≤ 0.3 mm for 20 kg/m² tiles.', cluster: 'Anti-slip & rheology' },
  { id: 's9', type: 'Patent', title: 'Low-cost tile adhesive with pozzolanic cement replacement', year: 2019, relevance: 0.69, finding: 'Up to 20 % fly-ash replacement with ≤ 8 % adhesion loss.', cluster: 'Fillers & cost' },
  { id: 's10', type: 'Supplier sheet', title: 'MHEC 40k mPa·s — supplier sheet', year: 2024, relevance: 0.74, finding: 'Delayed-solubility grade, surface-treated for lump-free mixing.', cluster: 'Cellulose ether & water retention' },
  { id: 's11', type: 'Paper', title: 'Deformability of C2 adhesives as a function of polymer-to-cement ratio', year: 2022, relevance: 0.83, finding: 'p/c ≥ 0.12 needed for S1 (≥ 2.5 mm) on 3 mm beds.', cluster: 'Deformability' },
  { id: 's12', type: 'Paper', title: 'Gypsum-modified rapid-set adhesives: moisture sensitivity', year: 2018, relevance: 0.62, finding: 'Gypsum phases lower water-immersion adhesion by 30–40 %.', cluster: 'Accelerators' },
];

const comp = (pairs: [string, number, number][]) => pairs.map(([materialId, a, b]) => ({ materialId, range: [a, b] as [number, number] }));

export const TILE_PATHWAYS: Pathway[] = [
  {
    id: 'P1', rank: 1, name: 'High-RDP VAE + MHEC, Ca-formate accelerated',
    composition: comp([['opc53', 32, 36], ['sand', 55, 60], ['caco3', 2.5, 3.5], ['vae-rdp', 3.5, 5], ['mhec', 0.3, 0.4], ['ca-formate', 0.5, 1.0], ['starch-ether', 0.03, 0.03], ['defoamer', 0.02, 0.02]]),
    predicted: [
      { propertyId: 'adh-initial', value: 1.32, status: 'pass' }, { propertyId: 'adh-water', value: 1.08, status: 'pass' },
      { propertyId: 'adh-heat', value: 0.98, status: 'borderline' }, { propertyId: 'adh-ft', value: 1.05, status: 'pass' },
      { propertyId: 'open-time', value: 0.6, status: 'pass' }, { propertyId: 'slip', value: 0.3, status: 'pass' },
      { propertyId: 'transverse-def', value: 2.7, status: 'pass' },
    ],
    scores: { targetMatch: 0.9, cost: 0.82, availability: 0.9, overall: 0.87 }, costPerKg: 16.1,
    equipment: ['Ribbon blender', 'Valve-bag packer'], hazards: ['Alkaline powder — skin/eye irritant', 'Single-source RDP supplier'], citations: ['s1', 's2', 's6', 's11'],
  },
  {
    id: 'P2', rank: 2, name: 'Mid-RDP + starch ether anti-slip, lower cost',
    composition: comp([['opc53', 32, 35], ['sand', 57, 61], ['caco3', 3, 4], ['vae-rdp', 3.0, 4.0], ['mhec', 0.3, 0.35], ['ca-formate', 0.5, 0.7], ['starch-ether', 0.04, 0.06], ['defoamer', 0.02, 0.02]]),
    predicted: [
      { propertyId: 'adh-initial', value: 1.24, status: 'pass' }, { propertyId: 'adh-water', value: 1.02, status: 'pass' },
      { propertyId: 'adh-heat', value: 0.91, status: 'borderline' }, { propertyId: 'adh-ft', value: 1.0, status: 'pass' },
      { propertyId: 'open-time', value: 0.56, status: 'pass' }, { propertyId: 'slip', value: 0.2, status: 'pass' },
      { propertyId: 'transverse-def', value: 2.4, status: 'borderline' },
    ],
    scores: { targetMatch: 0.79, cost: 0.92, availability: 0.88, overall: 0.81 }, costPerKg: 14.9,
    equipment: ['Ribbon blender'], hazards: ['Alkaline powder — skin/eye irritant'], citations: ['s8', 's2'],
  },
  {
    id: 'P3', rank: 3, name: 'VAE/acrylic hybrid powder for deformability',
    composition: comp([['opc53', 31, 34], ['sand', 55, 59], ['caco3', 2, 3], ['vae-rdp', 3.5, 4.5], ['acrylic-rdp', 1.0, 1.5], ['mhec', 0.35, 0.4], ['ca-formate', 0.5, 0.8], ['defoamer', 0.02, 0.03]]),
    predicted: [
      { propertyId: 'adh-initial', value: 1.4, status: 'pass' }, { propertyId: 'adh-water', value: 1.12, status: 'pass' },
      { propertyId: 'adh-heat', value: 1.04, status: 'pass' }, { propertyId: 'adh-ft', value: 1.08, status: 'pass' },
      { propertyId: 'open-time', value: 0.58, status: 'pass' }, { propertyId: 'slip', value: 0.4, status: 'pass' },
      { propertyId: 'transverse-def', value: 3.4, status: 'pass' },
    ],
    scores: { targetMatch: 0.95, cost: 0.55, availability: 0.8, overall: 0.78 }, costPerKg: 19.6,
    equipment: ['Ribbon blender', 'Dust extraction'], hazards: ['Cost over ceiling (₹ 19.60 vs ₹ 18)', 'Alkaline powder — skin/eye irritant'], citations: ['s3', 's11'],
  },
  {
    id: 'P4', rank: 4, name: 'Fly-ash part-replacement, low-heat',
    composition: comp([['opc53', 26, 30], ['fly-ash', 5, 8], ['sand', 55, 59], ['vae-rdp', 3.5, 4.5], ['mhec', 0.3, 0.4], ['ca-formate', 0.6, 1.0], ['starch-ether', 0.03, 0.03], ['defoamer', 0.02, 0.02]]),
    predicted: [
      { propertyId: 'adh-initial', value: 1.18, status: 'pass' }, { propertyId: 'adh-water', value: 1.0, status: 'pass' },
      { propertyId: 'adh-heat', value: 0.86, status: 'fail' }, { propertyId: 'adh-ft', value: 0.97, status: 'borderline' },
      { propertyId: 'open-time', value: 0.62, status: 'pass' }, { propertyId: 'slip', value: 0.4, status: 'pass' },
      { propertyId: 'transverse-def', value: 2.6, status: 'pass' },
    ],
    scores: { targetMatch: 0.7, cost: 0.95, availability: 0.55, overall: 0.72 }, costPerKg: 13.8,
    equipment: ['Ribbon blender', 'Extra silo for fly ash'], hazards: ['Fly-ash supply varies by season — availability risk'], citations: ['s9'],
  },
  {
    id: 'P5', rank: 5, name: 'Gypsum-modified fast-set',
    composition: comp([['opc53', 28, 31], ['gypsum', 4, 6], ['sand', 56, 60], ['vae-rdp', 3, 4], ['mhec', 0.3, 0.35], ['ca-formate', 0.3, 0.5], ['defoamer', 0.02, 0.02]]),
    predicted: [
      { propertyId: 'adh-initial', value: 1.15, status: 'pass' }, { propertyId: 'adh-water', value: 0.7, status: 'fail' },
      { propertyId: 'adh-heat', value: 0.88, status: 'fail' }, { propertyId: 'adh-ft', value: 0.8, status: 'fail' },
      { propertyId: 'open-time', value: 0.5, status: 'pass' }, { propertyId: 'slip', value: 0.3, status: 'pass' },
      { propertyId: 'transverse-def', value: 2.3, status: 'borderline' },
    ],
    scores: { targetMatch: 0.45, cost: 0.86, availability: 0.85, overall: 0.61 }, costPerKg: 15.2,
    equipment: ['Ribbon blender'], hazards: ['Fails water immersion — not for exterior', 'Ettringite expansion risk'], citations: ['s12'],
  },
];

export const TILE_SCENARIO: Scenario = {
  id: 'tile',
  label: 'Exterior tile adhesive',
  chip: 'Tile adhesive · C2TE S1',
  keywords: ['tile', 'adhesive', 'c2te', 'c2', 'vitrified', 'facade', 's1'],
  projectName: 'Exterior tile adhesive — Large format',
  codePrefix: 'HX-TA',
  docType: 'Technical Data Sheet',
  productGuess: 'Polymer-modified cementitious tile adhesive (deformable)',
  categoryId: 'tile-adhesives',
  subcategoryId: 'ta-c2te-s1',
  chemistry: ['polymer-modified'],
  form: 'powder',
  standard: 'IS 15477 Type 4 T S2',
  standardAlt: 'EN 12004 C2TE S1',
  useCase: {
    substrate: 'Concrete / block masonry',
    surfaces: ['Wall', 'Facade'],
    materialType: 'Vitrified',
    size: { w: 1200, h: 600, t: 9 },
    exposure: 'exterior',
    climate: 'Hot-humid',
    appTemp: [10, 40],
    load: 'None',
    method: 'Notched trowel',
    timeToGroutH: 24,
    timeToTrafficH: 0,
    standardClass: 'IS 15477 Type 4 T S2',
  },
  useCaseConfidence: { substrate: 0.92, surfaces: 0.95, materialType: 0.9, size: 0.88, exposure: 0.97, climate: 0.66, appTemp: 0.81, load: 0.93, method: 0.9, timeToGroutH: 0.68, timeToTrafficH: 0.74, standardClass: 0.94 },
  guided: [
    { id: 'large-outside', q: 'Large tiles on an outside wall?', picture: 'Building', answer: 0, options: [
      { label: 'Yes — big tiles, outside', icon: 'Building', sets: { exposure: 'exterior', surfaces: ['Wall', 'Facade'], materialType: 'Vitrified', size: { w: 1200, h: 600, t: 9 } } },
      { label: 'No — small tiles, inside', icon: 'House', sets: { exposure: 'interior', surfaces: ['Wall'], materialType: 'Ceramic', size: { w: 300, h: 300, t: 8 } } },
    ] },
    { id: 'behind', q: "What's behind the tiles?", picture: 'BrickWall', answer: 0, options: [
      { label: 'Concrete or block wall', icon: 'BrickWall', sets: { substrate: 'Concrete / block masonry' } },
      { label: 'AAC block', icon: 'Box', sets: { substrate: 'AAC block' } },
      { label: 'Old tiles', icon: 'LayoutGrid', sets: { substrate: 'Existing tiles' } },
      { label: 'Gypsum board', icon: 'PanelTop', sets: { substrate: 'Gypsum' } },
    ] },
    ...COMMON_GUIDED,
  ],
  benchmarks: [
    {
      id: 'bm-a', name: 'Benchmark A', maker: 'Competitor 1', subcategoryId: 'ta-c2te-s1', standardClass: 'EN 12004 C2TE S1', pricePerKg: 22, updated: '2026-09-12',
      values: [
        { propertyId: 'adh-initial', value: 1.35, unit: 'N/mm²', tag: 'TDS', page: 2, confidence: 0.96 },
        { propertyId: 'adh-water', value: 1.1, unit: 'N/mm²', tag: 'TDS', page: 2, confidence: 0.95 },
        { propertyId: 'adh-heat', value: 1.05, unit: 'N/mm²', tag: 'Lab-tested', page: 2, confidence: 0.93 },
        { propertyId: 'adh-ft', value: 1.08, unit: 'N/mm²', tag: 'TDS', page: 2, confidence: 0.92 },
        { propertyId: 'open-time', value: 0.62, unit: 'N/mm² @ 30 min', tag: 'TDS', page: 2, confidence: 0.9 },
        { propertyId: 'slip', value: 0.3, unit: 'mm', tag: 'TDS', page: 3, confidence: 0.88 },
        { propertyId: 'transverse-def', value: 2.8, unit: 'mm', tag: 'Lab-tested', page: 3, confidence: 0.9 },
        { propertyId: 'pot-life', value: 3, unit: 'h', tag: 'TDS', page: 1, confidence: 0.86 },
        { propertyId: 'water-demand', value: 24, unit: '%', tag: 'TDS', page: 1, confidence: 0.84 },
        { propertyId: 'voc', value: '<5', unit: 'g/L', tag: 'MSDS', page: 4, confidence: 0.78 },
        { propertyId: 'service-temp', value: '−30 to +80', unit: '°C', tag: 'TDS', page: 3, confidence: 0.82 },
        { propertyId: 'polymer-content', value: '~4', unit: '% w/w', tag: 'Lab-tested', confidence: 0.61 },
      ],
      versions: [{ v: 1, date: '2026-03-02', note: 'Created from TDS' }, { v: 2, date: '2026-09-12', note: 'Heat-ageing & deformation lab-tested' }],
    },
    {
      id: 'bm-b', name: 'Benchmark B', maker: 'Competitor 2', subcategoryId: 'ta-c2te-s1', standardClass: 'EN 12004 C2TE S1', pricePerKg: 19, updated: '2026-07-21',
      values: [
        { propertyId: 'adh-initial', value: 1.2, unit: 'N/mm²', tag: 'TDS' },
        { propertyId: 'adh-water', value: 1.02, unit: 'N/mm²', tag: 'TDS' },
        { propertyId: 'adh-heat', value: 1.0, unit: 'N/mm²', tag: 'TDS' },
        { propertyId: 'transverse-def', value: 2.6, unit: 'mm', tag: 'TDS' },
        { propertyId: 'slip', value: 0.4, unit: 'mm', tag: 'TDS' },
      ],
      versions: [{ v: 1, date: '2026-07-21', note: 'Created from TDS' }],
    },
  ],
  targets: [
    { propertyId: 'polymer-content', operator: 'between', value: [3.5, 5.0], priority: 'important', bench: '~4', confidence: 0.82, reason: 'S1 deformation needs p/c ≥ 0.12 [11]' },
    { propertyId: 'water-demand', operator: 'between', value: [22, 26], priority: 'nice', bench: 24, confidence: 0.86, reason: 'Matches Benchmark A mixing water' },
    { propertyId: 'voc', operator: '<=', value: 5, priority: 'important', bench: '<5', confidence: 0.9, reason: 'Low-VOC compliance chip' },
    { propertyId: 'open-time', operator: '>=', value: 0.5, priority: 'must', std: '≥ 0.5 @ 30 min', stdMin: 0.5, bench: 0.62, confidence: 0.95, reason: 'IS 15477 Type 4 / EN 12004 "E" extended open time' },
    { propertyId: 'slip', operator: '<=', value: 0.5, priority: 'must', std: '≤ 0.5', stdMax: 0.5, bench: 0.3, confidence: 0.95, reason: '"T" class — wall tiles, no slip' },
    { propertyId: 'pot-life', operator: '>=', value: 3, priority: 'important', bench: 3, confidence: 0.8, reason: 'Site practice for facades' },
    { propertyId: 'adh-initial', operator: '>=', value: 1.0, priority: 'must', std: '≥ 1.0', stdMin: 1.0, bench: 1.35, confidence: 0.97, reason: 'C2 requirement' },
    { propertyId: 'adh-water', operator: '>=', value: 1.0, priority: 'must', std: '≥ 1.0', stdMin: 1.0, bench: 1.1, confidence: 0.96, reason: 'C2 requirement; exterior rain exposure' },
    { propertyId: 'adh-heat', operator: '>=', value: 1.0, priority: 'must', std: '≥ 1.0', stdMin: 1.0, bench: 1.05, confidence: 0.96, reason: 'Hot-humid facade; top-1 priority' },
    { propertyId: 'adh-ft', operator: '>=', value: 1.0, priority: 'important', std: '≥ 1.0', stdMin: 1.0, bench: 1.08, confidence: 0.84, reason: 'Rare frost in hot-humid zone' },
    { propertyId: 'transverse-def', operator: '>=', value: 2.5, priority: 'must', std: '2.5 – <5', stdMin: 2.5, bench: 2.8, confidence: 0.93, reason: 'S1 deformable — 1200 mm tiles move with heat' },
    { propertyId: 'water-absorption', operator: '<=', value: 8, priority: 'nice', confidence: 0.64, reason: 'Internal guideline, not in standard' },
    { propertyId: 'service-temp', operator: 'between', value: [-20, 80], priority: 'nice', bench: '−30 to +80', confidence: 0.72, reason: 'Facade surface can reach 75 °C' },
  ],
  top3: [
    { id: 'adh-heat', reason: 'Exterior facade in hot-humid climate — most common field failure [7]' },
    { id: 'transverse-def', reason: '1200 × 600 tiles need S1 deformability for thermal movement' },
    { id: 'cost', reason: 'Benchmark A sells at ₹ 22/kg; RM ceiling ₹ 18 keeps margin' },
  ],
  constraints: {
    costCeiling: 18,
    budgetBand: 'mid',
    materialLimits: [{ materialId: 'vae-rdp', maxPct: 5 }, { materialId: 'gypsum', exclude: true }],
    compliance: ['Low VOC', 'No chlorides'],
    site: { tMin: 10, tMax: 40, rhMax: 90 },
    mustHaves: ['Works in heat', 'Low smell'],
    remark: 'Grey colour only; 20 kg valve bag; shelf life 12 months.',
  },
  summary: {
    scientist:
      '**Helix is formulating:** a polymer-modified cementitious tile adhesive, **IS 15477 Type 4 T S2 / EN 12004 C2TE S1**, for **1200 × 600 mm vitrified tiles on exterior concrete/block facades** in a **hot-humid climate** (application 10–40 °C), **notched-trowel** applied, grout after **24 h**. It must **match or beat Benchmark A** on tensile adhesion after heat ageing and transverse deformation, at **≤ ₹ 18 / kg** raw material cost.',
    plain:
      '**Helix is making:** a **strong, slightly flexible tile glue** for **big tiles on outside walls** in **hot, humid weather**. It should **grip as well as Benchmark A**, even **after hot summers**, **flex a little when the wall moves**, be ready to grout **the next day**, and cost **mid-range**.',
  },
  pathways: TILE_PATHWAYS,
  balanceMaterial: 'sand',
  leverMaterial: 'vae-rdp',
  clusters: ['RDP type & dosage', 'Cellulose ether & water retention', 'Heat-ageing failure mechanisms', 'Accelerators', 'Anti-slip & rheology', 'Deformability', 'Fillers & cost'],
  query: '("tile adhesive" OR "thin-bed mortar") AND ("redispersible" OR RDP OR VAE) AND ("heat ageing" OR "thermal ageing") AND (deformab* OR "transverse deformation") NOT gypsum-only',
  sources: TILE_SOURCES,
  trials: TILE_TRIALS_ITER1,
  trialsIter2: TILE_TRIALS_ITER2,
  measured: ['adh-initial', 'adh-water', 'adh-heat', 'adh-ft', 'open-time', 'slip', 'transverse-def'],
  resultMeans: {
    'adh-initial': { T1: 1.12, T2: 1.28, T3: 1.34, T4: 1.41, T5: 1.38, T6: 1.4 },
    'adh-water': { T1: 0.92, T2: 1.04, T3: 1.08, T4: 1.12, T5: 1.12, T6: 1.13 },
    'adh-heat': { T1: 0.78, T2: 0.88, T3: 0.94, T4: 0.97, T5: 1.06, T6: 1.09 },
    'adh-ft': { T1: 0.95, T2: 1.02, T3: 1.06, T4: 1.09, T5: 1.1, T6: 1.11 },
    'open-time': { T1: 0.55, T2: 0.58, T3: 0.61, T4: 0.52, T5: 0.6, T6: 0.59 },
    slip: { T1: 0.4, T2: 0.35, T3: 0.3, T4: 0.45, T5: 0.3, T6: 0.32 },
    'transverse-def': { T1: 2.1, T2: 2.4, T3: 2.6, T4: 2.7, T5: 2.9, T6: 3.0 },
  },
  mixingProtocol: [
    'Pre-blend MHEC, starch ether, Ca-formate and defoamer with 2 kg of CaCO₃ for 2 min (master-batch).',
    'Charge sand, OPC 53 and remaining CaCO₃ into the ribbon blender; dry-mix 3 min.',
    'Add VAE RDP and the master-batch; mix 5 min until homogeneous (check colour uniformity).',
    'Lab mixing: add 24 % water to powder (EN 1348 §7), mix 30 s slow, rest 60 s, remix 15 s.',
    'Mature 5 min, remix 15 s, then cast specimens within 10 min.',
  ],
  testPlan: [
    { test: 'Tensile adhesion — initial', method: 'EN 1348 §8.2', specimens: 10, ages: '28 d', dueInDays: 6 },
    { test: 'Tensile adhesion — water immersion', method: 'EN 1348 §8.3', specimens: 10, ages: '7 d + 21 d water', dueInDays: 6 },
    { test: 'Tensile adhesion — heat ageing', method: 'EN 1348 §8.4', specimens: 10, ages: '14 d + 14 d @ 70 °C + 1 d', dueInDays: 14 },
    { test: 'Tensile adhesion — freeze-thaw', method: 'EN 1348 §8.5', specimens: 10, ages: '7 d + 21 d water + 25 cycles', dueInDays: 21 },
    { test: 'Open time', method: 'EN 1346', specimens: 10, ages: '30 min / 28 d', dueInDays: 6 },
    { test: 'Slip', method: 'EN 1308', specimens: 3, ages: 'fresh', dueInDays: 1 },
    { test: 'Transverse deformation', method: 'EN 12002', specimens: 6, ages: '28 d', dueInDays: 6 },
  ],
};
