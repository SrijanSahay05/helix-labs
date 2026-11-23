import type { Scenario } from './types';
import { COMMON_GUIDED, speedQuestion } from './guided';
import { bench, midCost, pw, src, variant } from './build';
import { TILE_SCENARIO } from '../demoProject';

/** Group 4 — Tile, stone and flooring. One full scenario per category, a variant per sibling subcategory. Demo data — for R&D to confirm. */

type Comp = [string, number, number][];
const route = (id: string, rank: number, name: string, comp: Comp, predicted: Parameters<typeof pw>[4], s: Parameters<typeof pw>[5], equipment: string[], hazards: string[], citations: string[]) =>
  pw(id, rank, name, comp, predicted, s, midCost(comp), equipment, hazards, citations);

const BLENDER = ['Ploughshare mixer'];
const dryMix = (actives: string) => ['Pre-blend cellulose ether, polymer powder and additives.', `Charge sand and binder; add the pre-blend (${actives}); mix 4 min.`, 'Mix with water at the declared ratio; rest 3 min; remix 30 s.'];
/** Tile adhesive variants use generated trials and results, not the tile demo's hand-seeded ones. */
const OWN_LAB = { trials: undefined, trialsIter2: undefined, iter2: undefined, resultMeans: undefined, curated: undefined } as const;
const TILE_TESTS = [
  { test: 'Tensile adhesion — initial, water, heat', method: 'EN 1348', specimens: 10, ages: '28 d', dueInDays: 30 },
  { test: 'Open time', method: 'EN 1346', specimens: 10, ages: '28 d', dueInDays: 30 },
];

/* ---------- Tile and stone adhesives: variants of the tile scenario ---------- */

export const TA_C1 = variant(TILE_SCENARIO, {
  ...OWN_LAB,
  id: 'ta-c1', label: 'C1 standard tile adhesive', chip: 'Tile adhesive · C1',
  example: 'Economy C1 tile adhesive for ceramic floor tiles indoors',
  keywords: ['c1 adhesive', 'c1 tile', 'standard tile adhesive', 'ceramic tile adhesive', 'basic tile adhesive', 'type 1 adhesive', 'economy tile adhesive'],
  projectName: 'C1 tile adhesive — Interior ceramic', codePrefix: 'HX-T1',
  productGuess: 'Cementitious normal-setting tile adhesive (C1)', subcategoryId: 'ta-c1', chemistry: ['cementitious'],
  standard: 'IS 15477 Type 1', standardAlt: 'EN 12004 C1',
  useCase: { substrate: 'Cement screed', surfaces: ['Floor'], materialType: 'Ceramic', size: { w: 300, h: 300, t: 8 }, exposure: 'interior', climate: 'Composite', appTemp: [10, 35], load: 'Light foot', method: 'Notched trowel', timeToGroutH: 24, timeToTrafficH: 24, standardClass: 'IS 15477 Type 1' },
  benchmarks: [bench('bm-t1', 'Benchmark C-1', 'ta-c1', 'EN 12004 C1', 9, [['adh-initial', 0.6, 'N/mm²', 'TDS'], ['adh-water', 0.55, 'N/mm²', 'TDS'], ['adh-heat', 0.55, 'N/mm²', 'TDS'], ['open-time', 0.55, 'N/mm² @ 20 min', 'TDS']])],
  targets: [
    { propertyId: 'adh-initial', operator: '>=', value: 0.5, priority: 'must', std: '≥ 0.5', stdMin: 0.5, bench: 0.6, confidence: 0.94 },
    { propertyId: 'adh-water', operator: '>=', value: 0.5, priority: 'must', std: '≥ 0.5', stdMin: 0.5, bench: 0.55, confidence: 0.92 },
    { propertyId: 'adh-heat', operator: '>=', value: 0.5, priority: 'important', std: '≥ 0.5', stdMin: 0.5, bench: 0.55, confidence: 0.9 },
    { propertyId: 'open-time', operator: '>=', value: 0.5, priority: 'important', std: '≥ 0.5 after 20 min', stdMin: 0.5, bench: 0.55, confidence: 0.88 },
    { propertyId: 'water-demand', operator: 'between', value: [22, 26], priority: 'nice', confidence: 0.8 },
  ],
  top3: [{ id: 'cost', reason: 'Competes with sand–cement bedding' }, { id: 'adh-initial', reason: 'Hollow tiles are the complaint' }, { id: 'adh-water', reason: 'Floors get mopped daily' }],
  constraints: { costCeiling: 7, budgetBand: 'economy', materialLimits: [], compliance: [], site: { tMin: 10, tMax: 35, rhMax: 90 }, mustHaves: ['Grey, 20 kg bag'], remark: 'Interior floors up to 600 mm.' },
  summary: {
    scientist: '**Helix is formulating:** a **C1 cementitious tile adhesive** to **IS 15477 Type 1 / EN 12004 C1** for **interior ceramic floors**, with **≥ 0.5 N/mm² adhesion** after water and heat, at **≤ ₹ 7 / kg**.',
    plain: '**Helix is making:** a **low-cost tile glue** for **ceramic floor tiles indoors** that holds better than plain cement.',
  },
  pathways: [
    route('P1', 1, 'OPC + MHEC, no polymer', [['opc53', 30, 35], ['sand', 60, 66], ['caco3', 2, 4], ['mhec', 0.2, 0.25]], [['adh-initial', 0.62, 'pass'], ['adh-water', 0.56, 'pass'], ['adh-heat', 0.52, 'pass']], [0.88, 0.9, 0.95, 0.9], BLENDER, ['Alkaline dust — mask'], ['t1a']),
    route('P2', 2, 'Fly-ash extended', [['opc53', 24, 27], ['fly-ash', 6, 8], ['sand', 62, 66], ['mhec', 0.2, 0.25]], [['adh-initial', 0.52, 'borderline'], ['adh-water', 0.48, 'fail'], ['adh-heat', 0.5, 'pass']], [0.62, 0.95, 0.9, 0.78], BLENDER, ['Slow early strength'], ['t1a']),
    route('P3', 3, 'Low RDP boost', [['opc53', 30, 33], ['sand', 62, 67], ['vae-rdp', 0.5, 0.8], ['mhec', 0.22, 0.25]], [['adh-initial', 0.75, 'pass'], ['adh-water', 0.62, 'pass'], ['adh-heat', 0.6, 'pass']], [0.92, 0.7, 0.9, 0.83], BLENDER, ['Over cost ceiling risk'], ['t1b']),
  ],
  balanceMaterial: 'sand', leverMaterial: 'mhec',
  clusters: ['Cellulose ether and water retention', 'Binder content', 'Low-polymer formulations', 'Cost'],
  query: '("tile adhesive" C1) AND ("cellulose ether" OR "water retention") AND (adhesion OR "open time")',
  sources: [
    src('t1a', 'Paper', 'Water retention and adhesion of polymer-free C1 tile adhesives', 2019, 0.84, '0.22 % MHEC gave 0.6 N/mm² initial adhesion on ceramic.', 'Cellulose ether and water retention'),
    src('t1b', 'Paper', 'Small RDP additions in economy tile adhesives', 2021, 0.76, '0.6 % RDP raised water-immersion adhesion 20 %.', 'Low-polymer formulations'),
  ],
  measured: ['adh-initial', 'adh-water', 'adh-heat', 'open-time'],
  mixingProtocol: dryMix('MHEC'),
  testPlan: TILE_TESTS,
});

export const TA_C2 = variant(TILE_SCENARIO, {
  ...OWN_LAB,
  id: 'ta-c2', label: 'C2 polymer-modified tile adhesive', chip: 'Tile adhesive · C2',
  example: 'C2 polymer-modified tile adhesive for 600 × 600 vitrified floor tiles',
  keywords: ['c2 adhesive', 'c2 tile', 'polymer-modified tile adhesive', 'polymer modified tile adhesive', 'improved tile adhesive', 'type 2 adhesive'],
  projectName: 'C2 tile adhesive — Vitrified floors', codePrefix: 'HX-T2',
  productGuess: 'Polymer-modified cementitious tile adhesive (C2)', subcategoryId: 'ta-c2',
  standard: 'IS 15477 Type 2', standardAlt: 'EN 12004 C2',
  useCase: { substrate: 'Cement screed', surfaces: ['Floor', 'Wall'], materialType: 'Vitrified', size: { w: 600, h: 600, t: 9 }, exposure: 'interior', climate: 'Hot-humid', appTemp: [10, 40], load: 'Heavy foot', method: 'Notched trowel', timeToGroutH: 24, timeToTrafficH: 24, standardClass: 'IS 15477 Type 2' },
  benchmarks: [bench('bm-t2', 'Benchmark C-2', 'ta-c2', 'EN 12004 C2', 18, [['adh-initial', 1.2, 'N/mm²', 'TDS'], ['adh-water', 1.05, 'N/mm²', 'TDS'], ['adh-heat', 1.05, 'N/mm²', 'TDS'], ['open-time', 0.6, 'N/mm² @ 20 min', 'TDS']])],
  targets: [
    { propertyId: 'adh-initial', operator: '>=', value: 1, priority: 'must', std: '≥ 1.0', stdMin: 1, bench: 1.2, confidence: 0.96 },
    { propertyId: 'adh-water', operator: '>=', value: 1, priority: 'must', std: '≥ 1.0', stdMin: 1, bench: 1.05, confidence: 0.94 },
    { propertyId: 'adh-heat', operator: '>=', value: 1, priority: 'must', std: '≥ 1.0', stdMin: 1, bench: 1.05, confidence: 0.94 },
    { propertyId: 'adh-ft', operator: '>=', value: 1, priority: 'important', std: '≥ 1.0', stdMin: 1, confidence: 0.82 },
    { propertyId: 'open-time', operator: '>=', value: 0.5, priority: 'important', std: '≥ 0.5 after 20 min', stdMin: 0.5, bench: 0.6, confidence: 0.88 },
  ],
  top3: [{ id: 'adh-water', reason: 'Vitrified tiles barely absorb — polymer does the bonding' }, { id: 'cost', reason: 'Mid-market, ₹ 15–20/kg' }, { id: 'adh-heat', reason: 'Sun-lit floors near windows' }],
  constraints: { costCeiling: 13, budgetBand: 'mid', materialLimits: [], compliance: ['Low VOC'], site: { tMin: 10, tMax: 40, rhMax: 90 }, mustHaves: ['Grey and white versions'], remark: '20 kg bag.' },
  summary: {
    scientist: '**Helix is formulating:** a **C2 polymer-modified tile adhesive** to **IS 15477 Type 2 / EN 12004 C2** for **600 × 600 vitrified floors**, with **≥ 1.0 N/mm² adhesion** after water and heat, at **≤ ₹ 13 / kg**.',
    plain: '**Helix is making:** a **stronger tile glue with polymer** so **glassy vitrified tiles** don\'t come loose.',
  },
  pathways: [
    route('P1', 1, 'VAE RDP 2 % + MHEC + formate', [['opc53', 35, 38], ['sand', 55, 60], ['vae-rdp', 1.5, 2.5], ['mhec', 0.3, 0.35], ['ca-formate', 0.5, 1], ['starch-ether', 0.03, 0.05]], [['adh-initial', 1.15, 'pass'], ['adh-water', 1.04, 'pass'], ['adh-heat', 1.02, 'pass']], [0.9, 0.82, 0.9, 0.87], BLENDER, ['Alkaline dust — mask'], ['t2a']),
    route('P2', 2, 'Low RDP', [['opc53', 35, 38], ['sand', 58, 62], ['vae-rdp', 0.8, 1.2], ['mhec', 0.3, 0.35], ['ca-formate', 0.5, 1]], [['adh-initial', 0.98, 'borderline'], ['adh-water', 0.85, 'fail'], ['adh-heat', 0.9, 'fail']], [0.58, 0.95, 0.9, 0.76], BLENDER, ['Fails after water immersion'], ['t2a']),
    route('P3', 3, 'RDP + fly ash', [['opc53', 30, 32], ['fly-ash', 5, 7], ['sand', 55, 60], ['vae-rdp', 2, 2.5], ['mhec', 0.3, 0.35], ['ca-formate', 0.5, 1]], [['adh-initial', 1.1, 'pass'], ['adh-water', 1.02, 'pass'], ['adh-heat', 1, 'pass']], [0.86, 0.86, 0.9, 0.87], BLENDER, ['Slower set in cold'], ['t2b']),
  ],
  balanceMaterial: 'sand', leverMaterial: 'vae-rdp',
  clusters: ['RDP dosage and water resistance', 'Cellulose ether', 'Accelerators', 'Fly ash'],
  query: '("tile adhesive" C2) AND (redispersible OR RDP) AND ("water immersion" OR "heat ageing") AND vitrified',
  sources: [
    src('t2a', 'Paper', 'RDP dosage and wet adhesion of C2 adhesives on porcelain', 2021, 0.88, '2 % VAE RDP kept water-immersion adhesion above 1.0 N/mm².', 'RDP dosage and water resistance'),
    src('t2b', 'Paper', 'Fly ash in polymer-modified tile adhesives', 2020, 0.76, '6 % fly ash cut cost with no loss at 28 d.', 'Fly ash'),
  ],
  measured: ['adh-initial', 'adh-water', 'adh-heat', 'open-time'],
  mixingProtocol: dryMix('VAE RDP, MHEC, calcium formate, starch ether'),
  testPlan: TILE_TESTS,
});

export const TA_C2TE_S2 = variant(TILE_SCENARIO, {
  ...OWN_LAB,
  id: 'ta-c2te-s2', label: 'C2TE S2 highly deformable tile adhesive', chip: 'Tile adhesive · C2TE S2',
  example: 'Highly deformable C2TE S2 two-component adhesive for large slabs on a heated floor',
  keywords: ['c2te s2', 'c2tes2', 's2 adhesive', 'highly deformable', 'two-component tile adhesive', '2k tile adhesive', 'heated floor'],
  projectName: 'C2TE S2 adhesive — Large slabs, heated floors', codePrefix: 'HX-T5',
  productGuess: '2-component highly deformable tile adhesive (S2)', subcategoryId: 'ta-c2te-s2', form: '2-component',
  standard: 'IS 15477 Type 5', standardAlt: 'EN 12004 C2TE S2',
  useCase: { substrate: 'Cement screed', surfaces: ['Floor'], materialType: 'Large-format slab', size: { w: 1600, h: 800, t: 6 }, exposure: 'interior', climate: 'Composite', appTemp: [10, 35], load: 'Heavy foot', method: 'Notched trowel', timeToGroutH: 24, timeToTrafficH: 24, standardClass: 'EN 12004 C2TE S2' },
  benchmarks: [bench('bm-t5', 'Benchmark S-2', 'ta-c2te-s2', 'EN 12004 C2TE S2', 70, [['transverse-def', 5.5, 'mm', 'TDS'], ['adh-initial', 1.4, 'N/mm²', 'TDS'], ['adh-heat', 1.1, 'N/mm²', 'TDS'], ['slip', 0.3, 'mm', 'TDS']])],
  targets: [
    { propertyId: 'transverse-def', operator: '>=', value: 5, priority: 'must', std: '≥ 5 mm (S2)', stdMin: 5, bench: 5.5, confidence: 0.94 },
    { propertyId: 'adh-initial', operator: '>=', value: 1, priority: 'must', std: '≥ 1.0', stdMin: 1, bench: 1.4, confidence: 0.94 },
    { propertyId: 'adh-heat', operator: '>=', value: 1, priority: 'must', std: '≥ 1.0', stdMin: 1, bench: 1.1, confidence: 0.92 },
    { propertyId: 'open-time', operator: '>=', value: 0.5, priority: 'important', std: '≥ 0.5 after 30 min (E)', stdMin: 0.5, confidence: 0.86 },
    { propertyId: 'slip', operator: '<=', value: 0.5, priority: 'important', std: '≤ 0.5 (T)', stdMax: 0.5, bench: 0.3, confidence: 0.86 },
  ],
  top3: [{ id: 'transverse-def', reason: 'Underfloor heating moves big slabs' }, { id: 'adh-heat', reason: 'Heated screed at 30–40 °C' }, { id: 'cost', reason: 'Benchmark at ₹ 70/kg' }],
  constraints: { costCeiling: 48, budgetBand: 'premium', materialLimits: [], compliance: ['Low VOC'], site: { tMin: 10, tMax: 35, rhMax: 85 }, mustHaves: ['2K kit: 20 kg powder + 5 kg liquid'], remark: 'Slabs up to 1600 × 3200 mm.' },
  summary: {
    scientist: '**Helix is formulating:** a **2-component C2TE S2 adhesive** to **EN 12004** for **large-format slabs on heated floors**, with **transverse deformation ≥ 5 mm** and **≥ 1.0 N/mm² after heat ageing**, at **≤ ₹ 48 / kg**.',
    plain: '**Helix is making:** a **very flexible two-part tile glue** for **huge slabs on heated floors** that bends with the floor instead of cracking.',
  },
  pathways: [
    route('P1', 1, 'Powder + elastomeric acrylic liquid', [['opc53', 22, 25], ['sand', 40, 45], ['caco3', 5, 8], ['elasto-acrylic', 22, 26], ['mhec', 0.2, 0.3], ['defoamer', 0.1, 0.2]], [['transverse-def', 5.6, 'pass'], ['adh-initial', 1.35, 'pass'], ['adh-heat', 1.08, 'pass']], [0.9, 0.78, 0.88, 0.85], ['Ploughshare mixer (A)', 'Low-shear mixer (B)'], ['Alkaline — gloves'], ['t5a']),
    route('P2', 2, '1K high RDP', [['opc53', 30, 33], ['sand', 52, 56], ['vae-rdp', 7, 8], ['acrylic-rdp', 2, 3], ['mhec', 0.35, 0.4]], [['transverse-def', 4.6, 'fail'], ['adh-initial', 1.3, 'pass'], ['adh-heat', 1.05, 'pass']], [0.68, 0.7, 0.9, 0.74], BLENDER, ['Below S2'], ['t5b']),
    route('P3', 3, 'Lean liquid 2K', [['opc53', 24, 27], ['sand', 45, 50], ['caco3', 5, 8], ['elasto-acrylic', 16, 18], ['mhec', 0.2, 0.3], ['defoamer', 0.1, 0.2]], [['transverse-def', 4.8, 'borderline'], ['adh-initial', 1.25, 'pass'], ['adh-heat', 1.02, 'pass']], [0.72, 0.9, 0.88, 0.82], ['Ploughshare mixer (A)', 'Low-shear mixer (B)'], ['Borderline deformability'], ['t5a']),
  ],
  balanceMaterial: 'sand', leverMaterial: 'elasto-acrylic',
  clusters: ['Polymer-to-cement ratio and deformability', 'Heat ageing', '1K vs 2K', 'Large-format slabs'],
  query: '("highly deformable" OR S2) AND "tile adhesive" AND ("transverse deformation" OR "polymer-cement ratio") AND (heated OR "large format")',
  sources: [
    src('t5a', 'Paper', 'Liquid polymer content and S2 deformability', 2022, 0.88, 'P/C above 0.45 reached ≥ 5 mm transverse deformation.', 'Polymer-to-cement ratio and deformability'),
    src('t5b', 'Paper', 'Can one-component adhesives reach S2?', 2021, 0.78, '1K adhesives plateaued at 4.5 mm even at 10 % RDP.', '1K vs 2K'),
  ],
  measured: ['transverse-def', 'adh-initial', 'adh-heat', 'slip'],
  mixingProtocol: ['Blend component A (cement, sand, filler, MHEC, defoamer).', 'Fill component B (elastomeric acrylic).', 'On site: add A to B under a paddle; mix 3 min; rest 3 min.'],
  testPlan: [{ test: 'Transverse deformation', method: 'EN 12002', specimens: 6, ages: '28 d', dueInDays: 30 }, ...TILE_TESTS],
});

export const TA_PASTE = variant(TILE_SCENARIO, {
  ...OWN_LAB,
  id: 'ta-paste', label: 'Ready-mix paste tile adhesive (D2)', chip: 'Tile adhesive · D2 paste',
  example: 'Ready-mixed paste tile adhesive for ceramic wall tiles on gypsum board',
  keywords: ['paste adhesive', 'paste tile adhesive', 'ready-mix tile adhesive', 'ready-mixed tile adhesive', 'ready mix tile adhesive', 'dispersion adhesive', 'd2 adhesive', 'tub adhesive'],
  projectName: 'D2TE paste adhesive — Wall tiles on board', codePrefix: 'HX-TD',
  productGuess: 'Acrylic dispersion ready-mixed tile adhesive (D2TE)', subcategoryId: 'ta-paste', chemistry: ['acrylic'], form: 'paste',
  standard: 'EN 12004 D2TE', standardAlt: 'ISO 13007-1 D2TE',
  useCase: { substrate: 'Gypsum', surfaces: ['Wall'], materialType: 'Ceramic', size: { w: 300, h: 450, t: 8 }, exposure: 'interior', climate: 'Composite', appTemp: [10, 35], load: 'None', method: 'Notched trowel', timeToGroutH: 24, timeToTrafficH: 0, standardClass: 'EN 12004 D2TE' },
  benchmarks: [bench('bm-td', 'Benchmark D-2', 'ta-paste', 'EN 12004 D2TE', 55, [['shear-adh', 1.3, 'N/mm²', 'TDS'], ['adh-water', 0.6, 'N/mm²', 'TDS'], ['slip', 0.3, 'mm', 'TDS'], ['voc', 8, 'g/L', 'TDS']])],
  targets: [
    { propertyId: 'shear-adh', operator: '>=', value: 1, priority: 'must', std: '≥ 1.0 (EN 12004 D)', stdMin: 1, bench: 1.3, confidence: 0.92 },
    { propertyId: 'adh-water', operator: '>=', value: 0.5, priority: 'must', std: 'Shear after water ≥ 0.5 (D2)', stdMin: 0.5, bench: 0.6, confidence: 0.9 },
    { propertyId: 'slip', operator: '<=', value: 0.5, priority: 'must', std: '≤ 0.5 (T)', stdMax: 0.5, bench: 0.3, confidence: 0.9 },
    { propertyId: 'open-time', operator: '>=', value: 0.5, priority: 'important', std: '≥ 0.5 after 30 min (E)', stdMin: 0.5, confidence: 0.84 },
    { propertyId: 'voc', operator: '<=', value: 20, priority: 'nice', bench: 8, confidence: 0.82 },
  ],
  top3: [{ id: 'slip', reason: 'Wall tiles must not slide' }, { id: 'adh-water', reason: 'Bathroom walls get splashed' }, { id: 'cost', reason: 'Benchmark at ₹ 55/kg' }],
  constraints: { costCeiling: 36, budgetBand: 'mid', materialLimits: [], compliance: ['Water-based', 'Low VOC'], site: { tMin: 10, tMax: 35, rhMax: 80 }, mustHaves: ['No mixing — open and use'], remark: '5 and 15 kg tubs.' },
  summary: {
    scientist: '**Helix is formulating:** a **D2TE acrylic dispersion adhesive** to **EN 12004** for **ceramic wall tiles on gypsum board**, with **≥ 1.0 N/mm² shear adhesion** and **slip ≤ 0.5 mm**, at **≤ ₹ 36 / kg**.',
    plain: '**Helix is making:** a **ready-to-use tile glue in a tub** for **wall tiles on board**, no mixing needed.',
  },
  pathways: [
    route('P1', 1, 'Acrylic dispersion + calcite + sand', [['acrylic-emul', 18, 22], ['caco3', 55, 60], ['sand', 10, 15], ['hec', 0.3, 0.5], ['coalescent', 0.5, 1], ['biocide', 0.1, 0.2], ['liq-defoamer', 0.2, 0.3], ['water', 5, 8]], [['shear-adh', 1.25, 'pass'], ['adh-water', 0.58, 'pass'], ['slip', 0.3, 'pass']], [0.9, 0.8, 0.9, 0.86], ['Butterfly mixer'], ['Freezes below 0 °C'], ['tda']),
    route('P2', 2, 'Low binder', [['acrylic-emul', 12, 14], ['caco3', 60, 65], ['sand', 12, 15], ['hec', 0.4, 0.5], ['biocide', 0.1, 0.2], ['water', 7, 10]], [['shear-adh', 0.85, 'fail'], ['adh-water', 0.4, 'fail'], ['slip', 0.2, 'pass']], [0.5, 0.95, 0.9, 0.72], ['Butterfly mixer'], ['Weak in wet rooms'], ['tda']),
    route('P3', 3, 'Elastomeric binder', [['elasto-acrylic', 16, 18], ['caco3', 55, 60], ['sand', 12, 15], ['hec', 0.3, 0.5], ['biocide', 0.1, 0.2], ['liq-defoamer', 0.2, 0.3], ['water', 6, 9]], [['shear-adh', 1.3, 'pass'], ['adh-water', 0.65, 'pass'], ['slip', 0.4, 'pass']], [0.9, 0.7, 0.88, 0.82], ['Butterfly mixer'], ['Higher binder cost'], ['tdb']),
  ],
  balanceMaterial: 'caco3', leverMaterial: 'acrylic-emul',
  clusters: ['Binder level and shear adhesion', 'Water resistance', 'Thixotropy and slip', 'In-can stability'],
  query: '("dispersion adhesive" OR "ready-mixed tile adhesive") AND (D2 OR "shear adhesion") AND (slip OR "water resistance")',
  sources: [
    src('tda', 'Paper', 'Binder level and wet shear adhesion of D2 tile adhesives', 2020, 0.84, '18–22 % dispersion met D2 after water immersion.', 'Binder level and shear adhesion'),
    src('tdb', 'Paper', 'Elastomeric dispersions in ready-mixed adhesives', 2022, 0.74, 'Low-Tg binders improved wet shear by 10 %.', 'Water resistance'),
  ],
  measured: ['shear-adh', 'adh-water', 'slip', 'open-time'],
  mixingProtocol: ['Charge water, HEC and biocide; disperse 10 min.', 'Add dispersion and coalescent.', 'Add calcite and sand under high torque; deaerate; fill tubs.'],
  testPlan: [{ test: 'Shear adhesion — initial, water, heat', method: 'EN 1324', specimens: 10, ages: '14 d', dueInDays: 16 }, { test: 'Slip', method: 'EN 1308', specimens: 3, ages: 'fresh', dueInDays: 1 }],
});

/* ---------- Tile grouts ---------- */

export const TG_CG2: Scenario = {
  id: 'tg-cg2', label: 'CG2WA improved cementitious grout', chip: 'Tile grout · CG2WA',
  example: 'CG2WA cementitious tile grout for 3 mm floor joints in a mall',
  keywords: ['cg2', 'cg2wa', 'tile grout', 'cementitious grout', 'cement grout', 'sanded grout', 'joint filler for tiles', 'grout'],
  projectName: 'CG2WA tile grout — Commercial floors', codePrefix: 'HX-G2',
  docType: 'Technical Data Sheet', productGuess: 'Polymer-modified water-repellent cementitious tile grout',
  categoryId: 'tile-grouts', subcategoryId: 'tg-cg2', chemistry: ['polymer-modified'], form: 'powder',
  standard: 'EN 13888 CG2WA', standardAlt: 'ISO 13007-3 CG2WA',
  useCase: { surfaces: ['Floor'], materialType: 'Vitrified', jointWidthMm: 3, exposure: 'interior', climate: 'Hot-humid', appTemp: [10, 40], chemicalExposure: 'Household cleaners', colour: 'Pigmented', load: 'Heavy foot', method: 'Rubber float', timeToTrafficH: 24, standardClass: 'EN 13888 CG2WA' },
  useCaseConfidence: { surfaces: 0.92, materialType: 0.86, jointWidthMm: 0.78, exposure: 0.92, climate: 0.68, appTemp: 0.76, chemicalExposure: 0.72, colour: 0.7, load: 0.84, method: 0.88, timeToTrafficH: 0.7, standardClass: 0.88 },
  guided: [COMMON_GUIDED[0], COMMON_GUIDED[2], speedQuestion('timeToTrafficH')],
  benchmarks: [bench('bm-g2', 'Benchmark G-2', 'tg-cg2', 'EN 13888 CG2WA', 45, [['abrasion', 900, 'mm³', 'TDS'], ['flexural', 3.5, 'N/mm²', 'TDS'], ['compressive', 20, 'N/mm²', 'TDS'], ['shrinkage', 2, 'mm/m', 'Lab-tested']])],
  targets: [
    { propertyId: 'abrasion', operator: '<=', value: 1000, priority: 'must', std: '≤ 1000 mm³ (A)', stdMax: 1000, bench: 900, confidence: 0.9 },
    { propertyId: 'flexural', operator: '>=', value: 2.5, priority: 'must', std: '≥ 2.5 (EN 13888)', stdMin: 2.5, bench: 3.5, confidence: 0.92 },
    { propertyId: 'compressive', operator: '>=', value: 15, priority: 'must', std: '≥ 15 (EN 13888)', stdMin: 15, bench: 20, confidence: 0.92 },
    { propertyId: 'shrinkage', operator: '<=', value: 3, priority: 'important', std: '≤ 3 mm/m', stdMax: 3, bench: 2, confidence: 0.86 },
  ],
  top3: [{ id: 'abrasion', reason: 'Mall floors — joints wear first' }, { id: 'cost', reason: 'Benchmark at ₹ 45/kg' }, { id: 'shrinkage', reason: 'Cracked joints let water in' }],
  constraints: { costCeiling: 30, budgetBand: 'mid', materialLimits: [], compliance: ['Low VOC'], site: { tMin: 10, tMax: 40, rhMax: 90 }, mustHaves: ['30 colours from one base'], remark: '1 and 5 kg bags.' },
  summary: {
    scientist: '**Helix is formulating:** a **water-repellent CG2WA cementitious grout** to **EN 13888** for **3 mm joints on commercial floors**, with **abrasion ≤ 1000 mm³** and **flexural ≥ 2.5 N/mm²**, at **≤ ₹ 30 / kg**.',
    plain: '**Helix is making:** a **coloured filler for tile joints** that **doesn\'t wear away** under heavy foot traffic and keeps water out.',
  },
  pathways: [
    route('P1', 1, 'OPC + fine sand + RDP + hydrophobe', [['opc53', 30, 34], ['sand', 55, 60], ['caco3', 4, 6], ['vae-rdp', 1.5, 2], ['hydrophobe', 0.3, 0.5], ['mhec', 0.1, 0.15], ['pigment', 0.5, 1], ['defoamer', 0.1, 0.2]], [['abrasion', 880, 'pass'], ['flexural', 3.4, 'pass'], ['shrinkage', 2.1, 'pass']], [0.9, 0.8, 0.9, 0.86], BLENDER, ['Alkaline — gloves'], ['g2a']),
    route('P2', 2, 'No hydrophobe', [['opc53', 30, 34], ['sand', 56, 61], ['caco3', 4, 6], ['vae-rdp', 1.5, 2], ['mhec', 0.1, 0.15], ['pigment', 0.5, 1]], [['abrasion', 900, 'pass'], ['flexural', 3.3, 'pass'], ['shrinkage', 2.2, 'pass']], [0.75, 0.88, 0.9, 0.83], BLENDER, ['Not W class — stains'], ['g2a']),
    route('P3', 3, 'Low cement', [['opc53', 24, 27], ['sand', 60, 65], ['caco3', 6, 8], ['vae-rdp', 1, 1.5], ['hydrophobe', 0.3, 0.5], ['mhec', 0.1, 0.15], ['pigment', 0.5, 1]], [['abrasion', 1150, 'fail'], ['flexural', 2.6, 'pass'], ['shrinkage', 1.8, 'pass']], [0.6, 0.95, 0.9, 0.77], BLENDER, ['Wears in traffic lanes'], ['g2b']),
  ],
  balanceMaterial: 'sand', leverMaterial: 'vae-rdp',
  clusters: ['Abrasion and binder content', 'Water repellence', 'Colour consistency', 'Shrinkage'],
  query: '("cementitious grout" OR "tile grout") AND (CG2 OR "EN 13888") AND (abrasion OR "water absorption") AND hydrophobic',
  sources: [
    src('g2a', 'Paper', 'Hydrophobic additives in CG2WA tile grouts', 2021, 0.86, '0.4 % silane powder met W class with no strength loss.', 'Water repellence'),
    src('g2b', 'Paper', 'Binder content and abrasion resistance of cementitious grouts', 2019, 0.8, 'Below 28 % cement abrasion rose above 1000 mm³.', 'Abrasion and binder content'),
  ],
  measured: ['abrasion', 'flexural', 'compressive', 'shrinkage'],
  mixingProtocol: dryMix('RDP, hydrophobe, MHEC, pigment, defoamer'),
  testPlan: [
    { test: 'Abrasion resistance', method: 'EN 12808-2', specimens: 3, ages: '28 d', dueInDays: 30 },
    { test: 'Flexural and compressive strength', method: 'EN 12808-3', specimens: 3, ages: '28 d', dueInDays: 30 },
    { test: 'Shrinkage', method: 'EN 12808-4', specimens: 3, ages: '28 d', dueInDays: 30 },
  ],
};

export const TG_CG1 = variant(TG_CG2, {
  id: 'tg-cg1', label: 'CG1 standard cementitious grout', chip: 'Tile grout · CG1',
  example: 'Economy CG1 grout for wall tile joints in apartments',
  keywords: ['cg1', 'unsanded grout', 'economy grout', 'standard grout', 'wall grout'],
  projectName: 'CG1 tile grout — Apartment walls', codePrefix: 'HX-G1',
  productGuess: 'Normal cementitious tile grout (CG1)', subcategoryId: 'tg-cg1', chemistry: ['cementitious'],
  standard: 'EN 13888 CG1', standardAlt: 'ISO 13007-3 CG1',
  useCase: { surfaces: ['Wall'], materialType: 'Ceramic', jointWidthMm: 2, exposure: 'interior', climate: 'Composite', appTemp: [10, 35], chemicalExposure: 'None', colour: 'White', load: 'None', method: 'Rubber float', timeToTrafficH: 0, standardClass: 'EN 13888 CG1' },
  benchmarks: [bench('bm-g1', 'Benchmark G-1', 'tg-cg1', 'EN 13888 CG1', 22, [['abrasion', 1800, 'mm³', 'TDS'], ['flexural', 2.8, 'N/mm²', 'TDS'], ['compressive', 16, 'N/mm²', 'TDS']])],
  targets: [
    { propertyId: 'abrasion', operator: '<=', value: 2000, priority: 'must', std: '≤ 2000 mm³', stdMax: 2000, bench: 1800, confidence: 0.9 },
    { propertyId: 'flexural', operator: '>=', value: 2.5, priority: 'must', std: '≥ 2.5', stdMin: 2.5, bench: 2.8, confidence: 0.9 },
    { propertyId: 'compressive', operator: '>=', value: 15, priority: 'must', std: '≥ 15', stdMin: 15, bench: 16, confidence: 0.9 },
    { propertyId: 'shrinkage', operator: '<=', value: 3, priority: 'important', std: '≤ 3 mm/m', stdMax: 3, confidence: 0.84 },
  ],
  top3: [{ id: 'cost', reason: 'Price-led apartment market' }, { id: 'compressive', reason: 'Must still meet CG1' }, { id: 'shrinkage', reason: 'Cracked joints look cheap' }],
  constraints: { costCeiling: 14, budgetBand: 'economy', materialLimits: [], compliance: [], site: { tMin: 10, tMax: 35, rhMax: 90 }, mustHaves: ['Bright white'], remark: '1 kg bags.' },
  summary: {
    scientist: '**Helix is formulating:** a **CG1 white cementitious grout** to **EN 13888** for **wall tile joints up to 3 mm**, with **flexural ≥ 2.5** and **compressive ≥ 15 N/mm²**, at **≤ ₹ 14 / kg**.',
    plain: '**Helix is making:** a **low-cost white filler** for the **gaps between wall tiles**.',
  },
  pathways: [
    route('P1', 1, 'White cement + calcite', [['white-cement', 30, 35], ['caco3', 60, 66], ['mhec', 0.15, 0.2], ['vae-rdp', 0.3, 0.5]], [['abrasion', 1700, 'pass'], ['flexural', 2.9, 'pass'], ['compressive', 17, 'pass']], [0.88, 0.85, 0.9, 0.87], BLENDER, ['Alkaline — gloves'], ['g1a']),
    route('P2', 2, 'Low white cement', [['white-cement', 24, 27], ['caco3', 70, 75], ['mhec', 0.15, 0.2]], [['abrasion', 2200, 'fail'], ['flexural', 2.3, 'fail'], ['compressive', 13, 'fail']], [0.4, 0.95, 0.9, 0.67], BLENDER, ['Fails CG1'], ['g1a']),
    route('P3', 3, 'White cement + sand', [['white-cement', 30, 33], ['sand', 30, 35], ['caco3', 30, 35], ['mhec', 0.15, 0.2]], [['abrasion', 1500, 'pass'], ['flexural', 2.7, 'pass'], ['compressive', 18, 'pass']], [0.86, 0.88, 0.9, 0.88], BLENDER, ['Gritty on glossy tiles'], ['g1a']),
  ],
  balanceMaterial: 'caco3', leverMaterial: 'white-cement',
  clusters: ['Binder content', 'Whiteness', 'Cost'],
  query: '("tile grout" CG1) AND "white cement" AND (strength OR abrasion)',
  sources: [src('g1a', 'Paper', 'White-cement content and CG1 compliance', 2018, 0.8, '30 % white cement met CG1 with calcite filler.', 'Binder content')],
  measured: ['abrasion', 'flexural', 'compressive'],
  mixingProtocol: dryMix('MHEC, RDP'),
});

/* ---------- Stone care ---------- */

export const SC_IMP: Scenario = {
  id: 'sc-imp', label: 'Impregnating stone sealer', chip: 'Stone sealer',
  example: 'Impregnating sealer to protect granite and marble floors from oil stains',
  keywords: ['stone sealer', 'impregnating sealer', 'impregnator', 'marble sealer', 'granite sealer', 'stone protector', 'stain protection'],
  projectName: 'Impregnating stone sealer — Granite and marble', codePrefix: 'HX-SS',
  docType: 'Technical Data Sheet', productGuess: 'Solvent-based silane–siloxane / fluoropolymer impregnating sealer',
  categoryId: 'stone-care', subcategoryId: 'sc-imp', chemistry: ['acrylic'], form: 'liquid',
  standard: 'EN 1504-2 (hydrophobic impregnation)', standardAlt: 'ASTM C1794',
  useCase: { substrate: 'Natural stone', surfaces: ['Floor', 'Wall'], waterExposure: 'Rain / splash', coats: 1, uvExposure: 'Partial', potableContact: 'No', exposure: 'interior', climate: 'Hot-humid', appTemp: [10, 35], load: 'Heavy foot', method: 'Brush/roller', timeToTrafficH: 6, standardClass: 'EN 1504-2' },
  useCaseConfidence: { substrate: 0.94, surfaces: 0.86, waterExposure: 0.7, coats: 0.8, uvExposure: 0.66, potableContact: 0.8, exposure: 0.84, climate: 0.66, appTemp: 0.74, load: 0.8, method: 0.86, timeToTrafficH: 0.7, standardClass: 0.76 },
  guided: [
    { id: 'stone', q: 'Which stone are you protecting?', picture: 'Gem', answer: 0, options: [
      { label: 'Granite', icon: 'Gem', sets: { substrate: 'Natural stone', surfaces: ['Floor'] } },
      { label: 'Marble', icon: 'Gem', sets: { substrate: 'Natural stone', surfaces: ['Floor', 'Wall'] } },
      { label: 'Sandstone outside', icon: 'Building', sets: { substrate: 'Natural stone', surfaces: ['Wall', 'Facade'], exposure: 'exterior', uvExposure: 'Full sun' } },
    ] },
    COMMON_GUIDED[2],
  ],
  benchmarks: [bench('bm-ss', 'Benchmark S-S', 'sc-imp', 'Internal', 1400, [['water-absorption', 0.1, '%', 'Lab-tested'], ['stain-resistance', 4, 'rating 1–5', 'Lab-tested'], ['vapour', 90, 'g/m²·d', 'TDS'], ['voc', 600, 'g/L', 'TDS']])],
  targets: [
    { propertyId: 'stain-resistance', operator: '>=', value: 4, priority: 'must', reason: 'Oil, coffee and wine after 24 h', bench: 4, confidence: 0.84 },
    { propertyId: 'water-absorption', operator: '<=', value: 0.15, priority: 'must', reason: 'Absorption after treatment, 24 h', bench: 0.1, confidence: 0.86 },
    { propertyId: 'vapour', operator: '>=', value: 80, priority: 'important', reason: 'Stone must still breathe — no whitening', bench: 90, confidence: 0.8 },
    { propertyId: 'voc', operator: '<=', value: 700, priority: 'nice', bench: 600, confidence: 0.8 },
  ],
  top3: [{ id: 'stain-resistance', reason: 'Kitchen counters and lobbies' }, { id: 'vapour', reason: 'Sealed stone that cannot breathe spalls' }, { id: 'cost', reason: 'Fluoropolymer is costly' }],
  constraints: { costCeiling: 900, budgetBand: 'premium', materialLimits: [], compliance: [], site: { tMin: 10, tMax: 35, rhMax: 80 }, mustHaves: ['No colour change on polished stone'], remark: '1 and 5 L cans, 10–20 m²/L.' },
  summary: {
    scientist: '**Helix is formulating:** a **silane–siloxane / fluoropolymer impregnating sealer** for **granite and marble floors**, with **stain rating ≥ 4**, **absorption ≤ 0.15 %** and **breathable**, at **≤ ₹ 900 / kg**.',
    plain: '**Helix is making:** a **clear liquid that soaks into stone** so **oil and coffee wipe off** without changing how the stone looks.',
  },
  pathways: [
    route('P1', 1, 'Silane–siloxane + fluoropolymer', [['silane-siloxane', 8, 10], ['fluoropolymer', 20, 25], ['solvent', 65, 72]], [['stain-resistance', 4, 'pass'], ['water-absorption', 0.1, 'pass'], ['vapour', 88, 'pass']], [0.9, 0.75, 0.6, 0.78], ['Stirred tank (explosion-proof)'], ['Flammable solvent'], ['ss1', 'ss2']),
    route('P2', 2, 'Silane–siloxane only', [['silane-siloxane', 10, 12], ['solvent', 88, 90]], [['stain-resistance', 2, 'fail'], ['water-absorption', 0.12, 'pass'], ['vapour', 92, 'pass']], [0.55, 0.95, 0.95, 0.75], ['Stirred tank (explosion-proof)'], ['Water but not oil repellent'], ['ss1']),
    route('P3', 3, 'High fluoropolymer', [['silane-siloxane', 6, 8], ['fluoropolymer', 30, 35], ['solvent', 57, 64]], [['stain-resistance', 5, 'pass'], ['water-absorption', 0.08, 'pass'], ['vapour', 82, 'pass']], [0.94, 0.55, 0.6, 0.72], ['Stirred tank (explosion-proof)'], ['Over cost ceiling risk'], ['ss2']),
  ],
  balanceMaterial: 'solvent', leverMaterial: 'fluoropolymer',
  clusters: ['Water vs oil repellence', 'Penetration depth', 'Breathability', 'Appearance on polished stone'],
  query: '("impregnating sealer" OR "stone protection") AND (fluoropolymer OR siloxane) AND ("stain resistance" OR oleophobic) AND (granite OR marble)',
  sources: [
    src('ss1', 'Paper', 'Silane–siloxane impregnation of natural stone', 2019, 0.84, 'Absorption fell 90 % while vapour transmission stayed above 85 %.', 'Breathability'),
    src('ss2', 'Paper', 'Fluorinated acrylics for oil-repellent stone protection', 2021, 0.82, '20–25 % fluoro copolymer gave rating 4 against oil after 24 h.', 'Water vs oil repellence'),
  ],
  measured: ['stain-resistance', 'water-absorption', 'vapour'],
  mixingProtocol: ['Charge solvent under nitrogen.', 'Add silane–siloxane, then fluoropolymer solution slowly.', 'Stir 20 min; filter; fill cans.'],
  testPlan: [
    { test: 'Stain resistance (oil, coffee, wine)', method: 'EN ISO 10545-14 (adapted)', specimens: 3, ages: '7 d', dueInDays: 9 },
    { test: 'Water absorption', method: 'EN 13755', specimens: 3, ages: '7 d', dueInDays: 9 },
    { test: 'Vapour transmission', method: 'EN ISO 7783', specimens: 2, ages: '7 d', dueInDays: 12 },
  ],
};

/* ---------- Self-levelling compounds, screeds, floor hardeners ---------- */

const FLOOR_GUIDED = [COMMON_GUIDED[2], COMMON_GUIDED[1], speedQuestion('timeToWalkH')];

export const SLC_CT: Scenario = {
  id: 'slc-ct', label: 'Self-levelling underlayment CT-C25-F6', chip: 'Self-levelling compound',
  example: 'Self-levelling underlayment, 3–10 mm, to flatten floors before vinyl or carpet',
  keywords: ['self-levelling', 'self levelling', 'self-leveling', 'self leveling', 'slc', 'underlayment', 'levelling compound', 'leveling compound', 'floor levelling'],
  projectName: 'Self-levelling underlayment — Offices and hospitals', codePrefix: 'HX-SL',
  docType: 'Technical Data Sheet', productGuess: 'Ternary-binder self-levelling underlayment',
  categoryId: 'slc', subcategoryId: 'slc-ct', chemistry: ['cementitious', 'polymer-modified'], form: 'powder',
  standard: 'EN 13813 CT-C25-F6', standardAlt: 'ASTM C1708',
  useCase: { substrate: 'Concrete', thicknessMm: 5, areaM2: 2000, substrateMoisturePct: 4, finish: 'Coating-ready', chemicalExposure: 'None', exposure: 'interior', climate: 'Composite', appTemp: [10, 30], load: 'Heavy foot', method: 'Pump', timeToWalkH: 3, timeToTrafficH: 24, standardClass: 'EN 13813 CT-C25-F6' },
  useCaseConfidence: { substrate: 0.92, thicknessMm: 0.82, areaM2: 0.6, substrateMoisturePct: 0.62, finish: 0.76, chemicalExposure: 0.8, exposure: 0.94, climate: 0.66, appTemp: 0.76, load: 0.8, method: 0.82, timeToWalkH: 0.8, timeToTrafficH: 0.7, standardClass: 0.88 },
  guided: FLOOR_GUIDED,
  benchmarks: [bench('bm-sl', 'Benchmark S-L', 'slc-ct', 'EN 13813 CT-C25-F6', 55, [['flow', 145, 'mm', 'TDS'], ['compressive', 27, 'N/mm²', 'TDS'], ['flexural', 6.5, 'N/mm²', 'TDS'], ['shrinkage', 0.5, 'mm/m', 'Lab-tested']])],
  targets: [
    { propertyId: 'flow', operator: '>=', value: 140, priority: 'must', reason: 'Ring 30 × 50 mm, self-smoothing', bench: 145, confidence: 0.88 },
    { propertyId: 'compressive', operator: '>=', value: 25, priority: 'must', std: 'C25 (EN 13813)', stdMin: 25, bench: 27, confidence: 0.9 },
    { propertyId: 'flexural', operator: '>=', value: 6, priority: 'must', std: 'F6 (EN 13813)', stdMin: 6, bench: 6.5, confidence: 0.9 },
    { propertyId: 'shrinkage', operator: '<=', value: 0.6, priority: 'important', bench: 0.5, confidence: 0.82 },
    { propertyId: 'setting-time', operator: 'between', value: [30, 60], priority: 'nice', reason: 'Workable 30 min, walkable in 3 h', confidence: 0.74 },
  ],
  top3: [{ id: 'flow', reason: 'Self-smoothing is the product' }, { id: 'shrinkage', reason: 'Cracks telegraph through vinyl' }, { id: 'cost', reason: 'Benchmark at ₹ 55/kg' }],
  constraints: { costCeiling: 38, budgetBand: 'mid', materialLimits: [], compliance: ['Low VOC'], site: { tMin: 10, tMax: 30, rhMax: 85 }, mustHaves: ['Walkable in 3 h'], remark: '25 kg bag, 1.6 kg/m²/mm.' },
  summary: {
    scientist: '**Helix is formulating:** a **ternary-binder self-levelling underlayment** to **EN 13813 CT-C25-F6** for **3–10 mm floor levelling**, with **flow ≥ 140 mm**, **C25 / F6** and **shrinkage ≤ 0.6 mm/m**, at **≤ ₹ 38 / kg**.',
    plain: '**Helix is making:** a **runny floor powder** that **spreads itself flat** so vinyl or carpet goes down smooth.',
  },
  pathways: [
    route('P1', 1, 'OPC–CAC–anhydrite + PCE + RDP', [['opc53', 18, 22], ['cac', 8, 10], ['anhydrite', 5, 7], ['sand', 45, 50], ['caco3', 12, 16], ['pce-powder', 0.15, 0.25], ['vae-rdp', 1.5, 2], ['tartaric', 0.1, 0.15], ['li-carbonate', 0.02, 0.04], ['defoamer', 0.2, 0.3]], [['flow', 148, 'pass'], ['compressive', 27, 'pass'], ['flexural', 6.4, 'pass']], [0.9, 0.78, 0.85, 0.84], BLENDER, ['Alkaline dust — mask'], ['sl1', 'sl2']),
    route('P2', 2, 'OPC only, PCE', [['opc53', 30, 34], ['sand', 50, 55], ['caco3', 12, 16], ['pce-powder', 0.2, 0.3], ['vae-rdp', 1, 1.5], ['defoamer', 0.2, 0.3]], [['flow', 140, 'pass'], ['compressive', 30, 'pass'], ['shrinkage', 1.1, 'fail']], [0.62, 0.92, 0.9, 0.78], BLENDER, ['Slow and shrinks'], ['sl2']),
    route('P3', 3, 'Low-CAC economy', [['opc53', 20, 24], ['cac', 4, 6], ['anhydrite', 3, 4], ['sand', 48, 52], ['caco3', 14, 18], ['pce-powder', 0.15, 0.25], ['vae-rdp', 1, 1.5], ['tartaric', 0.1, 0.15], ['defoamer', 0.2, 0.3]], [['flow', 142, 'pass'], ['compressive', 24, 'borderline'], ['flexural', 5.8, 'borderline']], [0.72, 0.9, 0.88, 0.82], BLENDER, ['Borderline C25'], ['sl1']),
  ],
  balanceMaterial: 'caco3', leverMaterial: 'cac',
  clusters: ['Ternary binder and ettringite', 'PCE and flow', 'Shrinkage compensation', 'Retarder–accelerator balance'],
  query: '("self-levelling" OR underlayment) AND ("calcium aluminate" OR ettringite) AND (flow OR shrinkage) AND "EN 13813"',
  sources: [
    src('sl1', 'Paper', 'Ternary OPC–CAC–calcium sulphate binders for self-levelling underlayments', 2021, 0.9, '9 % CAC with 6 % anhydrite gave walkability in 3 h and < 0.5 mm/m shrinkage.', 'Ternary binder and ettringite'),
    src('sl2', 'Paper', 'Powder PCE dosage and flow retention in SLUs', 2022, 0.82, '0.2 % PCE kept 145 mm flow for 30 min.', 'PCE and flow'),
  ],
  measured: ['flow', 'compressive', 'flexural', 'shrinkage'],
  mixingProtocol: dryMix('PCE, RDP, tartaric acid, Li₂CO₃, defoamer'),
  testPlan: [
    { test: 'Flow (ring 30 × 50)', method: 'EN 12706', specimens: 2, ages: 'fresh', dueInDays: 1 },
    { test: 'Compressive and flexural', method: 'EN 13892-2', specimens: 3, ages: '28 d', dueInDays: 30 },
    { test: 'Shrinkage', method: 'EN 13454-2', specimens: 3, ages: '28 d', dueInDays: 30 },
  ],
};

export const SCR_FAST = variant(SLC_CT, {
  id: 'scr-fast', label: 'Rapid-dry screed binder', chip: 'Rapid-dry screed',
  example: 'Rapid-drying screed binder so wood flooring can go down in 3 days',
  keywords: ['screed', 'rapid-dry screed', 'rapid dry screed', 'fast-drying screed', 'fast drying screed', 'screed binder', 'floor screed'],
  projectName: 'Rapid-dry screed binder — Fit-out floors', codePrefix: 'HX-SC',
  productGuess: 'Ternary rapid-drying screed binder (mixed with sand on site)', categoryId: 'screeds', subcategoryId: 'scr-fast', chemistry: ['cementitious'],
  standard: 'EN 13813 CT-C30-F5', standardAlt: 'BS 8204-1',
  useCase: { substrate: 'Concrete', thicknessMm: 50, areaM2: 1500, substrateMoisturePct: 4, finish: 'Coating-ready', chemicalExposure: 'None', exposure: 'interior', climate: 'Composite', appTemp: [10, 30], load: 'Heavy foot', method: 'Pump', timeToWalkH: 6, timeToTrafficH: 72, standardClass: 'EN 13813 CT-C30-F5' },
  benchmarks: [bench('bm-sc', 'Benchmark S-C', 'scr-fast', 'EN 13813 CT-C30-F5', 40, [['compressive', 32, 'N/mm²', 'TDS'], ['flexural', 5.5, 'N/mm²', 'TDS'], ['drying-time', 72, 'h', 'TDS'], ['shrinkage', 0.4, 'mm/m', 'Lab-tested']])],
  targets: [
    { propertyId: 'drying-time', operator: '<=', value: 72, priority: 'must', reason: 'Residual moisture ≤ 2 % CM for wood floors', bench: 72, confidence: 0.84 },
    { propertyId: 'compressive', operator: '>=', value: 30, priority: 'must', std: 'C30', stdMin: 30, bench: 32, confidence: 0.88 },
    { propertyId: 'flexural', operator: '>=', value: 5, priority: 'important', std: 'F5', stdMin: 5, bench: 5.5, confidence: 0.86 },
    { propertyId: 'shrinkage', operator: '<=', value: 0.5, priority: 'important', bench: 0.4, confidence: 0.8 },
  ],
  top3: [{ id: 'drying-time', reason: 'Fit-out schedule: floor in 3 days, not 50' }, { id: 'compressive', reason: 'C30 for office loads' }, { id: 'cost', reason: 'Binder only — sand on site' }],
  constraints: { costCeiling: 28, budgetBand: 'mid', materialLimits: [], compliance: [], site: { tMin: 10, tMax: 30, rhMax: 75 }, mustHaves: ['Mix 1:4 with site sand'], remark: '25 kg binder bag.' },
  summary: {
    scientist: '**Helix is formulating:** a **ternary rapid-drying screed binder** to **EN 13813 CT-C30-F5** for **50 mm floor screeds**, dry to **≤ 2 % CM in 72 h**, at **≤ ₹ 28 / kg** binder.',
    plain: '**Helix is making:** a **powder mixed with sand** for floor screeds that **dries in 3 days**, so wooden floors can go down fast.',
  },
  pathways: [
    route('P1', 1, 'OPC + CAC + anhydrite binder', [['opc53', 60, 66], ['cac', 15, 18], ['anhydrite', 12, 15], ['pce-powder', 0.8, 1.2], ['tartaric', 0.2, 0.3], ['caco3', 2, 4]], [['drying-time', 70, 'pass'], ['compressive', 33, 'pass'], ['shrinkage', 0.4, 'pass']], [0.9, 0.75, 0.85, 0.83], BLENDER, ['Alkaline dust — mask'], ['sc1']),
    route('P2', 2, 'OPC + PCE only', [['opc53', 90, 95], ['pce-powder', 1, 1.5], ['caco3', 4, 8]], [['drying-time', 200, 'fail'], ['compressive', 35, 'pass'], ['shrinkage', 0.7, 'fail']], [0.4, 0.95, 0.95, 0.68], BLENDER, ['Weeks to dry'], ['sc1']),
    route('P3', 3, 'High-CAC', [['opc53', 55, 58], ['cac', 22, 25], ['anhydrite', 14, 17], ['pce-powder', 0.8, 1.2], ['tartaric', 0.25, 0.35]], [['drying-time', 48, 'pass'], ['compressive', 34, 'pass'], ['shrinkage', 0.3, 'pass']], [0.94, 0.62, 0.85, 0.79], BLENDER, ['Short working time'], ['sc1']),
  ],
  balanceMaterial: 'opc53', leverMaterial: 'cac',
  clusters: ['Water binding by ettringite', 'Drying and residual moisture', 'Strength', 'Workability on site'],
  query: '("rapid drying screed" OR "screed binder") AND (ettringite OR "calcium aluminate") AND ("residual moisture" OR drying)',
  sources: [src('sc1', 'Paper', 'Ettringite-forming binders and screed drying time', 2020, 0.86, '17 % CAC with anhydrite reached 2 % CM in 3 days at 50 mm.', 'Water binding by ettringite')],
  measured: ['drying-time', 'compressive', 'flexural', 'shrinkage'],
  testPlan: [
    { test: 'Residual moisture (CM)', method: 'Internal (CM method)', specimens: 3, ages: '3 d', dueInDays: 4 },
    { test: 'Compressive and flexural', method: 'EN 13892-2', specimens: 3, ages: '28 d', dueInDays: 30 },
  ],
});

export const FH_DRY = variant(SLC_CT, {
  id: 'fh-dry', label: 'Dry-shake floor hardener', chip: 'Floor hardener',
  example: 'Non-metallic dry-shake floor hardener for a warehouse floor with forklifts',
  keywords: ['floor hardener', 'dry-shake', 'dry shake', 'surface hardener', 'non-metallic hardener', 'metallic hardener', 'wear-resistant floor'],
  projectName: 'Dry-shake hardener — Warehouse floors', codePrefix: 'HX-FH',
  productGuess: 'Corundum / quartz non-metallic dry-shake hardener', categoryId: 'floor-hardeners', subcategoryId: 'fh-dry', chemistry: ['cementitious'],
  standard: 'EN 13813 CT-C70-F9-A6', standardAlt: 'ASTM C779',
  useCase: { substrate: 'Fresh concrete', thicknessMm: 3, areaM2: 10000, substrateMoisturePct: 0, finish: 'Exposed / wearing surface', chemicalExposure: 'None', exposure: 'interior', climate: 'Hot-humid', appTemp: [15, 40], load: 'Heavy vehicular', method: 'Dry-shake', timeToWalkH: 24, timeToTrafficH: 168, standardClass: 'EN 13813 CT-C70-F9-A6' },
  guided: [COMMON_GUIDED[2], COMMON_GUIDED[1]],
  benchmarks: [bench('bm-fh', 'Benchmark F-H', 'fh-dry', 'EN 13813 A6', 22, [['abrasion', 5000, 'mm³', 'TDS'], ['compressive', 75, 'N/mm²', 'TDS'], ['flexural', 9, 'N/mm²', 'TDS']])],
  targets: [
    { propertyId: 'abrasion', operator: '<=', value: 6000, priority: 'must', std: 'A6 (Böhme, EN 13892-3)', stdMax: 6000, bench: 5000, confidence: 0.88 },
    { propertyId: 'compressive', operator: '>=', value: 70, priority: 'must', std: 'C70', stdMin: 70, bench: 75, confidence: 0.86 },
    { propertyId: 'flexural', operator: '>=', value: 9, priority: 'important', std: 'F9', stdMin: 9, bench: 9, confidence: 0.82 },
  ],
  top3: [{ id: 'abrasion', reason: 'Forklift wheels grind the surface' }, { id: 'cost', reason: 'Spread at 5 kg/m² over 10,000 m²' }, { id: 'compressive', reason: 'Point loads from racking' }],
  constraints: { costCeiling: 18, budgetBand: 'economy', materialLimits: [], compliance: [], site: { tMin: 15, tMax: 40, rhMax: 95 }, mustHaves: ['Grey and coloured'], remark: '25 kg bags, 3–5 kg/m².' },
  summary: {
    scientist: '**Helix is formulating:** a **non-metallic dry-shake hardener** to **EN 13813 CT-C70-F9-A6** for **warehouse floors with forklifts**, with **Böhme abrasion ≤ 6000 mm³** and **≥ 70 N/mm²**, at **≤ ₹ 18 / kg**.',
    plain: '**Helix is making:** a **hard powder scattered on fresh concrete** and trowelled in, so **warehouse floors don\'t wear down** under forklifts.',
  },
  pathways: [
    route('P1', 1, 'OPC + corundum / quartz', [['opc53', 30, 35], ['corundum', 15, 20], ['quartz-agg', 45, 52], ['pce-powder', 0.2, 0.4], ['pigment', 0, 0.5]], [['abrasion', 4800, 'pass'], ['compressive', 76, 'pass'], ['flexural', 9.5, 'pass']], [0.9, 0.78, 0.88, 0.85], BLENDER, ['Silica dust — mask'], ['fh1']),
    route('P2', 2, 'Quartz only', [['opc53', 32, 35], ['quartz-agg', 64, 68], ['pce-powder', 0.2, 0.4]], [['abrasion', 6800, 'fail'], ['compressive', 72, 'pass'], ['flexural', 9, 'pass']], [0.6, 0.95, 0.95, 0.78], BLENDER, ['Below A6'], ['fh1']),
    route('P3', 3, 'High corundum', [['opc53', 30, 33], ['corundum', 30, 35], ['quartz-agg', 32, 38], ['pce-powder', 0.2, 0.4]], [['abrasion', 3500, 'pass'], ['compressive', 80, 'pass'], ['flexural', 10, 'pass']], [0.94, 0.55, 0.85, 0.77], BLENDER, ['Over cost ceiling risk'], ['fh1']),
  ],
  balanceMaterial: 'quartz-agg', leverMaterial: 'corundum',
  clusters: ['Aggregate hardness', 'Cement content', 'Application timing', 'Colour'],
  query: '("dry shake" OR "floor hardener") AND (corundum OR quartz) AND (abrasion OR Böhme)',
  sources: [src('fh1', 'Paper', 'Corundum content and wear of dry-shake hardeners', 2020, 0.84, '18 % corundum moved Böhme wear from A9 to A6.', 'Aggregate hardness')],
  measured: ['abrasion', 'compressive', 'flexural'],
  mixingProtocol: ['Blend cement, aggregates, PCE and pigment for 3 min.', 'On site: broadcast 2/3 at first float, trowel; broadcast 1/3, power-trowel.', 'Cure with curing compound.'],
  testPlan: [
    { test: 'Böhme abrasion', method: 'EN 13892-3', specimens: 3, ages: '28 d', dueInDays: 30 },
    { test: 'Compressive and flexural', method: 'EN 13892-2', specimens: 3, ages: '28 d', dueInDays: 30 },
  ],
});

/* ---------- Resin floors ---------- */

export const RF_EPOXY: Scenario = {
  id: 'rf-epoxy', label: 'Self-levelling epoxy floor', chip: 'Epoxy floor',
  example: 'Self-levelling epoxy floor, 2 mm, for a pharma clean room',
  keywords: ['epoxy floor', 'epoxy flooring', 'resin floor', 'resin flooring', 'self-levelling epoxy', 'self levelling epoxy', 'epoxy topping', 'epoxy coating for floor'],
  projectName: 'Self-levelling epoxy floor — Pharma and electronics', codePrefix: 'HX-EF',
  docType: 'Technical Data Sheet', productGuess: '3-component self-levelling epoxy floor (resin, hardener, filler)',
  categoryId: 'resin-floors', subcategoryId: 'rf-epoxy', chemistry: ['epoxy'], form: '2-component',
  standard: 'EN 13813 SR-B2.0-AR1-IR4', standardAlt: 'ASTM C579',
  useCase: { substrate: 'Concrete', thicknessMm: 2, areaM2: 800, substrateMoisturePct: 4, finish: 'Exposed / wearing surface', chemicalExposure: 'Household cleaners', exposure: 'interior', climate: 'Composite', appTemp: [15, 30], load: 'Light vehicular', method: 'Hand trowel', timeToWalkH: 24, timeToTrafficH: 72, standardClass: 'EN 13813 SR-B2.0' },
  useCaseConfidence: { substrate: 0.94, thicknessMm: 0.86, areaM2: 0.6, substrateMoisturePct: 0.66, finish: 0.82, chemicalExposure: 0.72, exposure: 0.94, climate: 0.66, appTemp: 0.78, load: 0.8, method: 0.76, timeToWalkH: 0.8, timeToTrafficH: 0.7, standardClass: 0.84 },
  guided: FLOOR_GUIDED,
  benchmarks: [bench('bm-ef', 'Benchmark E-F', 'rf-epoxy', 'EN 13813 SR-B2.0', 420, [['compressive', 70, 'N/mm²', 'TDS'], ['pull-off', 2.5, 'N/mm²', 'TDS'], ['hardness', 80, 'Shore D', 'TDS'], ['pot-life', 0.6, 'h', 'TDS']])],
  targets: [
    { propertyId: 'pull-off', operator: '>=', value: 2, priority: 'must', std: 'B2.0 (EN 13813)', stdMin: 2, bench: 2.5, confidence: 0.9 },
    { propertyId: 'compressive', operator: '>=', value: 60, priority: 'must', bench: 70, confidence: 0.86 },
    { propertyId: 'hardness', operator: '>=', value: 75, priority: 'important', bench: 80, confidence: 0.82 },
    { propertyId: 'pot-life', operator: '>=', value: 0.5, priority: 'important', reason: 'Time to pour and roll at 25 °C', bench: 0.6, confidence: 0.8 },
    { propertyId: 'voc', operator: '<=', value: 50, priority: 'nice', reason: 'Clean room — solvent-free', confidence: 0.82 },
  ],
  top3: [{ id: 'pull-off', reason: 'Delamination is the expensive failure' }, { id: 'pot-life', reason: 'Big pours in warm rooms' }, { id: 'cost', reason: 'Benchmark at ₹ 420/kg' }],
  constraints: { costCeiling: 130, budgetBand: 'premium', materialLimits: [{ materialId: 'reactive-diluent', maxPct: 4 }], compliance: ['Solvent-free', 'Low VOC'], site: { tMin: 15, tMax: 30, rhMax: 75 }, mustHaves: ['Glossy, seamless'], remark: '3-part kit, 2 mm at 3.4 kg/m².' },
  summary: {
    scientist: '**Helix is formulating:** a **solvent-free self-levelling epoxy floor** to **EN 13813 SR-B2.0** for **pharma and electronics clean rooms**, with **bond ≥ 2.0 N/mm²**, **≥ 60 N/mm²** and **≥ 30 min pot life**, at **≤ ₹ 130 / kg**.',
    plain: '**Helix is making:** a **glossy, seamless floor poured as a liquid** for **clean rooms**, hard enough for trolleys and easy to wipe.',
  },
  pathways: [
    route('P1', 1, 'BPA epoxy + cycloaliphatic amine + silica', [['epoxy-resin', 22, 25], ['reactive-diluent', 2, 3], ['amine-hardener', 11, 13], ['silica-flour', 55, 60], ['pigment', 2, 3], ['liq-defoamer', 0.2, 0.3]], [['pull-off', 2.4, 'pass'], ['compressive', 68, 'pass'], ['hardness', 79, 'pass']], [0.9, 0.78, 0.88, 0.85], ['Planetary mixer (A)', 'Site paddle'], ['Amine — skin sensitiser'], ['ef1']),
    route('P2', 2, 'High filler', [['epoxy-resin', 17, 19], ['reactive-diluent', 2, 3], ['amine-hardener', 8, 10], ['silica-flour', 65, 70], ['pigment', 2, 3]], [['pull-off', 2.1, 'pass'], ['compressive', 72, 'pass'], ['hardness', 80, 'pass']], [0.82, 0.9, 0.88, 0.86], ['Planetary mixer (A)', 'Site paddle'], ['Poorer levelling — orange peel'], ['ef1']),
    route('P3', 3, 'Low-viscosity diluted', [['epoxy-resin', 20, 22], ['reactive-diluent', 5, 6], ['amine-hardener', 11, 13], ['silica-flour', 55, 60], ['pigment', 2, 3]], [['pull-off', 2.2, 'pass'], ['compressive', 58, 'fail'], ['hardness', 74, 'borderline']], [0.68, 0.82, 0.85, 0.77], ['Planetary mixer (A)', 'Site paddle'], ['Over diluent limit'], ['ef2']),
  ],
  balanceMaterial: 'silica-flour', leverMaterial: 'epoxy-resin',
  clusters: ['Resin–filler ratio and levelling', 'Hardener and pot life', 'Bond to concrete', 'Reactive diluents'],
  query: '("self-levelling epoxy" OR "epoxy floor") AND (filler OR "pot life") AND ("bond strength" OR "EN 13813")',
  sources: [
    src('ef1', 'Paper', 'Resin-to-filler ratio in self-levelling epoxy toppings', 2021, 0.86, '1:1.6 binder-to-filler gave smooth levelling and 70 N/mm².', 'Resin–filler ratio and levelling'),
    src('ef2', 'Paper', 'Reactive diluents and mechanical loss in epoxy floors', 2019, 0.76, 'Above 4 % diluent compressive strength fell 15 %.', 'Reactive diluents'),
  ],
  measured: ['pull-off', 'compressive', 'hardness', 'pot-life'],
  mixingProtocol: ['Component A: disperse pigment and defoamer in resin and diluent.', 'Component B: amine hardener; component C: silica flour.', 'On site: mix A+B 2 min, add C, mix 2 min; pour and spike-roll.'],
  testPlan: [
    { test: 'Pull-off bond', method: 'EN 13892-8', specimens: 5, ages: '7 d', dueInDays: 9 },
    { test: 'Compressive strength', method: 'EN 13892-2', specimens: 3, ages: '7 d', dueInDays: 9 },
    { test: 'Shore D hardness', method: 'ISO 868', specimens: 3, ages: '7 d', dueInDays: 9 },
  ],
};

export const RF_PU = variant(RF_EPOXY, {
  id: 'rf-pu', label: 'Elastic polyurethane floor', chip: 'PU floor',
  example: 'Elastic polyurethane floor coating for a school with crack-bridging',
  keywords: ['pu floor', 'pu flooring', 'polyurethane floor', 'polyurethane flooring', 'elastic floor', 'pu screed'],
  projectName: 'Elastic PU floor — Schools and hospitals', codePrefix: 'HX-PF',
  productGuess: '2-component self-levelling elastic polyurethane floor', subcategoryId: 'rf-pu', chemistry: ['polyurethane'],
  standard: 'EN 13813 SR-B1.5', standardAlt: 'ASTM D412',
  useCase: { substrate: 'Concrete', thicknessMm: 2, areaM2: 1200, substrateMoisturePct: 4, finish: 'Exposed / wearing surface', chemicalExposure: 'Household cleaners', exposure: 'interior', climate: 'Composite', appTemp: [10, 30], load: 'Heavy foot', method: 'Hand trowel', timeToWalkH: 24, timeToTrafficH: 48, standardClass: 'EN 13813 SR-B1.5' },
  benchmarks: [bench('bm-pf', 'Benchmark P-F', 'rf-pu', 'EN 13813 SR-B1.5', 520, [['elongation', 100, '%', 'TDS'], ['pull-off', 2, 'N/mm²', 'TDS'], ['hardness', 45, 'Shore D', 'TDS'], ['crack-bridging', 0.8, 'mm', 'Lab-tested']])],
  targets: [
    { propertyId: 'elongation', operator: '>=', value: 80, priority: 'must', bench: 100, confidence: 0.86 },
    { propertyId: 'pull-off', operator: '>=', value: 1.5, priority: 'must', std: 'B1.5 (EN 13813)', stdMin: 1.5, bench: 2, confidence: 0.88 },
    { propertyId: 'crack-bridging', operator: '>=', value: 0.5, priority: 'important', bench: 0.8, confidence: 0.8 },
    { propertyId: 'hardness', operator: '>=', value: 40, priority: 'important', bench: 45, confidence: 0.8 },
  ],
  top3: [{ id: 'elongation', reason: 'Bridges slab cracks — epoxy would crack' }, { id: 'pull-off', reason: 'No delamination' }, { id: 'cost', reason: 'Benchmark at ₹ 520/kg' }],
  constraints: { costCeiling: 140, budgetBand: 'premium', materialLimits: [], compliance: ['Solvent-free', 'Low VOC'], site: { tMin: 10, tMax: 30, rhMax: 75 }, mustHaves: ['Quiet and warm underfoot'], remark: '2-part kit, 2 mm.' },
  summary: {
    scientist: '**Helix is formulating:** a **2-component elastic PU floor** to **EN 13813 SR-B1.5** for **schools and hospitals**, with **elongation ≥ 80 %**, **crack bridging ≥ 0.5 mm** and **bond ≥ 1.5 N/mm²**, at **≤ ₹ 140 / kg**.',
    plain: '**Helix is making:** a **seamless, slightly soft floor** for **schools and hospitals** that **stretches over small cracks** in the slab.',
  },
  pathways: [
    route('P1', 1, 'Castor polyol + pMDI + silica', [['pu-polyol', 28, 32], ['mdi-iso', 16, 19], ['silica-flour', 45, 50], ['pigment', 2, 3], ['moisture-scavenger', 1, 2]], [['elongation', 95, 'pass'], ['pull-off', 1.9, 'pass'], ['hardness', 45, 'pass']], [0.9, 0.78, 0.85, 0.84], ['Planetary mixer (A)', 'Site paddle'], ['Isocyanate — respirator'], ['pf1']),
    route('P2', 2, 'Harder, low polyol', [['pu-polyol', 22, 25], ['mdi-iso', 18, 21], ['silica-flour', 50, 55], ['pigment', 2, 3], ['moisture-scavenger', 1, 2]], [['elongation', 55, 'fail'], ['pull-off', 2.1, 'pass'], ['hardness', 60, 'pass']], [0.6, 0.86, 0.85, 0.77], ['Planetary mixer (A)', 'Site paddle'], ['Cracks over slab joints'], ['pf1']),
    route('P3', 3, 'Soft, high polyol', [['pu-polyol', 34, 37], ['mdi-iso', 14, 16], ['silica-flour', 42, 46], ['pigment', 2, 3], ['moisture-scavenger', 1, 2]], [['elongation', 130, 'pass'], ['pull-off', 1.6, 'pass'], ['hardness', 35, 'fail']], [0.75, 0.72, 0.85, 0.77], ['Planetary mixer (A)', 'Site paddle'], ['Marks under furniture'], ['pf1']),
  ],
  balanceMaterial: 'silica-flour', leverMaterial: 'pu-polyol',
  clusters: ['Polyol–isocyanate ratio', 'Elasticity vs hardness', 'Moisture and bubbling', 'Bond'],
  query: '("polyurethane floor" OR "elastic floor") AND (elongation OR "crack bridging") AND (hardness OR bond)',
  sources: [src('pf1', 'Paper', 'Castor-based polyols in elastic PU floor coatings', 2021, 0.84, 'NCO:OH 1.05 with 30 % polyol gave 95 % elongation at Shore D 45.', 'Polyol–isocyanate ratio')],
  measured: ['elongation', 'pull-off', 'hardness', 'crack-bridging'],
  mixingProtocol: ['Component A: polyol, pigment, scavenger, silica (vacuum, dry).', 'Component B: pMDI.', 'On site: mix A+B 3 min with a slow paddle; pour and spike-roll.'],
  testPlan: [
    { test: 'Elongation at break', method: 'ISO 527-3', specimens: 5, ages: '7 d', dueInDays: 9 },
    { test: 'Pull-off bond', method: 'EN 13892-8', specimens: 5, ages: '7 d', dueInDays: 9 },
    { test: 'Shore D hardness', method: 'ISO 868', specimens: 3, ages: '7 d', dueInDays: 9 },
  ],
});

/** Tile adhesive variants: checked before the generic tile run and before groups 1–3. */
export const TILE_ADHESIVE_ROUTE_ORDER: Scenario[] = [TA_PASTE, TA_C2TE_S2, TA_C1, TA_C2];
/** Resin floors and stone sealer before epoxy grout (which owns "epoxy" and "stain"); cement grouts after it (CG2WA owns bare "grout"). */
export const FINISH_BEFORE_EPOXY: Scenario[] = [RF_PU, RF_EPOXY, SC_IMP];
export const GROUT_AFTER_EPOXY: Scenario[] = [TG_CG1, TG_CG2];
/** Cementitious floor runs: checked after group 3 so "screed" in a waterproofing brief does not win. */
export const FLOOR_ROUTE_ORDER: Scenario[] = [SLC_CT, SCR_FAST, FH_DRY];

export const TILE_SCENARIOS: Scenario[] = [TA_C1, TA_C2, TA_C2TE_S2, TA_PASTE, TG_CG2, TG_CG1, SC_IMP, SLC_CT, SCR_FAST, FH_DRY, RF_EPOXY, RF_PU];
