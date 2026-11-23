import type { Scenario } from './types';
import { COMMON_GUIDED } from './guided';
import { bench, midCost, pw, src, variant } from './build';
import { GYPSUM } from './alternates';

/** Group 2 — Masonry and wall build-up. One full scenario per category, a variant per sibling subcategory. Demo data — for R&D to confirm. */

type Comp = [string, number, number][];
const route = (id: string, rank: number, name: string, comp: Comp, predicted: Parameters<typeof pw>[4], s: Parameters<typeof pw>[5], equipment: string[], hazards: string[], citations: string[]) =>
  pw(id, rank, name, comp, predicted, s, midCost(comp), equipment, hazards, citations);

const BLENDER = ['Ploughshare mixer'];
const TANK = ['Low-shear mixer'];
const dryMix = (actives: string) => ['Pre-blend cellulose ether, polymer powder and additives.', `Charge sand and binder; add the pre-blend (${actives}); mix 4 min.`, 'Mix with water at the declared ratio; rest 3 min; remix 30 s.'];

/* ---------- Block-jointing mortar ---------- */

export const BJ_AAC: Scenario = {
  id: 'bj-aac', label: 'AAC block-jointing mortar', chip: 'AAC thin-bed mortar',
  example: 'Thin-bed mortar for laying AAC blocks with 3 mm joints',
  keywords: ['block jointing', 'block-jointing', 'jointing mortar', 'aac block mortar', 'aac mortar', 'block adhesive', 'thin-bed mortar', 'thin bed mortar', 'block laying'],
  projectName: 'AAC thin-bed jointing mortar — Residential towers', codePrefix: 'HX-BJ',
  docType: 'Technical Data Sheet', productGuess: 'Polymer-modified thin-bed mortar for AAC blocks',
  categoryId: 'block-jointing', subcategoryId: 'bj-aac', chemistry: ['cementitious', 'polymer-modified'], form: 'powder',
  standard: 'EN 998-2 T M10', standardAlt: 'IS 2250',
  useCase: { substrate: 'AAC block', surfaces: ['Wall'], thicknessMm: 3, coats: 1, coverageKgM2: 4, exposure: 'interior', climate: 'Hot-humid', appTemp: [10, 40], method: 'Notched trowel', standardClass: 'EN 998-2 T M10' },
  useCaseConfidence: { substrate: 0.95, surfaces: 0.92, thicknessMm: 0.86, coats: 0.8, coverageKgM2: 0.66, exposure: 0.8, climate: 0.7, appTemp: 0.78, method: 0.88, standardClass: 0.86 },
  guided: [
    { id: 'blocks', q: 'Which blocks are you laying?', picture: 'BrickWall', answer: 0, options: [
      { label: 'AAC blocks', icon: 'Box', sets: { substrate: 'AAC block', thicknessMm: 3 } },
      { label: 'Concrete blocks', icon: 'BrickWall', sets: { substrate: 'Block masonry', thicknessMm: 5 } },
    ] },
    COMMON_GUIDED[1],
  ],
  benchmarks: [bench('bm-bj', 'Benchmark B', 'bj-aac', 'EN 998-2 T M10', 12, [['compressive', 10.5, 'N/mm²', 'TDS'], ['pull-off', 0.45, 'N/mm²', 'TDS'], ['water-retention', 98, '%', 'TDS'], ['coverage', 4, 'kg/m²', 'TDS']])],
  targets: [
    { propertyId: 'compressive', operator: '>=', value: 10, priority: 'must', std: '≥ 10 (EN 998-2 M10)', stdMin: 10, bench: 10.5, confidence: 0.9 },
    { propertyId: 'pull-off', operator: '>=', value: 0.4, priority: 'must', std: 'Initial shear ≥ 0.3 (EN 1052-3)', reason: 'Bond to AAC face', bench: 0.45, confidence: 0.84 },
    { propertyId: 'water-retention', operator: '>=', value: 97, priority: 'must', reason: 'AAC sucks water out of a 3 mm joint', bench: 98, confidence: 0.88 },
    { propertyId: 'setting-time', operator: 'between', value: [180, 360], priority: 'important', reason: 'Initial set, min — time to adjust blocks', confidence: 0.76 },
    { propertyId: 'coverage', operator: '<=', value: 4, priority: 'nice', bench: 4, confidence: 0.7 },
  ],
  top3: [{ id: 'water-retention', reason: 'Joints fail when AAC dries them out' }, { id: 'cost', reason: 'Competes with site-mixed cement mortar' }, { id: 'pull-off', reason: 'Wall stability' }],
  constraints: { costCeiling: 10, budgetBand: 'economy', materialLimits: [], compliance: [], site: { tMin: 10, tMax: 40, rhMax: 95 }, mustHaves: ['40 kg bag'], remark: 'Mixed by hand on the slab.' },
  summary: {
    scientist: '**Helix is formulating:** a **polymer-modified thin-bed mortar** to **EN 998-2 T M10** for **AAC block walls with 3 mm joints**, with **≥ 97 % water retention** and **≥ 0.4 N/mm² bond**, at **≤ ₹ 10 / kg**.',
    plain: '**Helix is making:** a **thin glue-like mortar for AAC blocks** that **stays wet long enough** to grip the blocks firmly.',
  },
  pathways: [
    route('P1', 1, 'MHEC + low RDP', [['opc53', 28, 32], ['sand', 62, 67], ['lime', 2, 3], ['mhec', 0.25, 0.3], ['vae-rdp', 0.8, 1.2], ['starch-ether', 0.03, 0.05], ['defoamer', 0.05, 0.1]], [['compressive', 10.8, 'pass'], ['pull-off', 0.44, 'pass'], ['water-retention', 98, 'pass']], [0.9, 0.82, 0.9, 0.87], BLENDER, ['Alkaline dust — mask'], ['bj1', 'bj2']),
    route('P2', 2, 'MHEC only, no polymer', [['opc53', 30, 33], ['sand', 63, 67], ['lime', 2, 3], ['mhec', 0.3, 0.35]], [['compressive', 11.5, 'pass'], ['pull-off', 0.32, 'borderline'], ['water-retention', 98, 'pass']], [0.72, 0.95, 0.95, 0.83], BLENDER, ['Brittle joints'], ['bj1']),
    route('P3', 3, 'Fly-ash extended + RDP', [['opc53', 22, 25], ['fly-ash', 6, 8], ['sand', 62, 66], ['mhec', 0.25, 0.3], ['vae-rdp', 1, 1.2]], [['compressive', 9.4, 'borderline'], ['pull-off', 0.45, 'pass'], ['water-retention', 97.5, 'pass']], [0.78, 0.88, 0.9, 0.82], BLENDER, ['Slower strength gain'], ['bj2']),
  ],
  balanceMaterial: 'sand', leverMaterial: 'vae-rdp',
  clusters: ['Water retention on porous blocks', 'Polymer and bond', 'Binder economy', 'Workability'],
  query: '("thin-bed mortar" OR "thin layer mortar") AND (AAC OR "autoclaved aerated concrete") AND ("water retention" OR "bond strength")',
  sources: [
    src('bj1', 'Paper', 'Cellulose ether dosage and joint bond in AAC thin-layer mortars', 2021, 0.89, '0.25–0.3 % MHEC kept water retention above 97 % on dry AAC.', 'Water retention on porous blocks'),
    src('bj2', 'Paper', 'Redispersible powder in thin-bed masonry mortars', 2020, 0.82, '1 % VAE RDP raised initial shear bond from 0.3 to 0.45 N/mm².', 'Polymer and bond'),
  ],
  measured: ['compressive', 'pull-off', 'water-retention', 'setting-time'],
  mixingProtocol: dryMix('MHEC, RDP, starch ether, defoamer'),
  testPlan: [
    { test: 'Compressive 28 d', method: 'EN 1015-11', specimens: 3, ages: '28 d', dueInDays: 30 },
    { test: 'Initial shear bond', method: 'EN 1052-3', specimens: 3, ages: '28 d', dueInDays: 30 },
    { test: 'Water retention', method: 'EN 1015-8', specimens: 2, ages: 'fresh', dueInDays: 1 },
  ],
};

/* ---------- Plaster: ready-mix variant of the gypsum scenario ---------- */

export const PL_READYMIX = variant(GYPSUM, {
  id: 'pl-readymix', label: 'Ready-mix cement plaster', chip: 'Ready-mix plaster',
  example: 'Ready-mix cement plaster for external walls, machine sprayed',
  keywords: ['ready-mix plaster', 'readymix plaster', 'ready mix plaster', 'cement plaster', 'external plaster', 'dry-mix plaster', 'rendering', 'render'],
  projectName: 'Ready-mix cement plaster — External walls', codePrefix: 'HX-RP',
  productGuess: 'Factory-made cement–lime rendering plaster', subcategoryId: 'pl-readymix', chemistry: ['cementitious'],
  standard: 'EN 998-1 GP CS III W1', standardAlt: 'IS 1542',
  useCase: { substrate: 'Block masonry', surfaces: ['Wall', 'Facade'], thicknessMm: 15, coats: 2, finish: 'Coating-ready', coverageKgM2: 16, exposure: 'exterior', climate: 'Hot-humid', appTemp: [10, 40], method: 'Spray', standardClass: 'EN 998-1 GP CS III W1' },
  useCaseConfidence: { substrate: 0.88, surfaces: 0.9, thicknessMm: 0.8, coats: 0.76, finish: 0.7, coverageKgM2: 0.64, exposure: 0.92, climate: 0.72, appTemp: 0.78, method: 0.86, standardClass: 0.84 },
  benchmarks: [bench('bm-rp', 'Benchmark R-P', 'pl-readymix', 'EN 998-1 CS III', 9, [['compressive', 5, 'N/mm²', 'TDS'], ['pull-off', 0.35, 'N/mm²', 'TDS'], ['water-retention', 92, '%', 'TDS'], ['shrinkage', 1, 'mm/m', 'Lab-tested']])],
  targets: [
    { propertyId: 'compressive', operator: 'between', value: [3.5, 7.5], priority: 'must', std: 'CS III 3.5–7.5 (EN 998-1)', stdMin: 3.5, stdMax: 7.5, bench: 5, confidence: 0.9 },
    { propertyId: 'pull-off', operator: '>=', value: 0.3, priority: 'must', std: '≥ 0.3 or FP B (EN 998-1)', stdMin: 0.3, bench: 0.35, confidence: 0.86 },
    { propertyId: 'water-retention', operator: '>=', value: 90, priority: 'important', bench: 92, confidence: 0.82 },
    { propertyId: 'shrinkage', operator: '<=', value: 1.2, priority: 'important', reason: 'Cracking on hot facades', bench: 1, confidence: 0.76 },
    { propertyId: 'setting-time', operator: 'between', value: [120, 300], priority: 'nice', confidence: 0.7 },
  ],
  top3: [{ id: 'cost', reason: 'Replaces ₹ 6/kg site mix' }, { id: 'shrinkage', reason: 'Exterior cracks are the #1 complaint' }, { id: 'pull-off', reason: 'Delamination on block walls' }],
  constraints: { costCeiling: 6, budgetBand: 'economy', materialLimits: [], compliance: [], site: { tMin: 10, tMax: 40, rhMax: 95 }, mustHaves: ['Sprayable with a plastering machine'], remark: '40 kg bag or silo.' },
  summary: {
    scientist: '**Helix is formulating:** a **cement–lime ready-mix plaster** to **EN 998-1 GP CS III W1** for **machine-sprayed external walls**, with **pull-off ≥ 0.3 N/mm²** and **shrinkage ≤ 1.2 mm/m**, at **≤ ₹ 6 / kg**.',
    plain: '**Helix is making:** a **bagged plaster for outside walls** that sprays on by machine and **doesn\'t crack in the sun**.',
  },
  pathways: [
    route('P1', 1, 'Cement–lime + MHEC + air + fibre', [['opc53', 16, 18], ['sand', 74, 78], ['lime', 4, 6], ['mhec', 0.12, 0.15], ['aea-powder', 0.02, 0.04], ['pp-fibre', 0.05, 0.08]], [['compressive', 5.2, 'pass'], ['pull-off', 0.36, 'pass'], ['shrinkage', 1, 'pass']], [0.9, 0.8, 0.9, 0.86], BLENDER, ['Alkaline dust — mask'], ['rp1', 'rp2']),
    route('P2', 2, 'Cement-rich, no lime', [['opc53', 20, 22], ['sand', 76, 79], ['mhec', 0.12, 0.15], ['aea-powder', 0.02, 0.03]], [['compressive', 7.8, 'fail'], ['pull-off', 0.4, 'pass'], ['shrinkage', 1.5, 'fail']], [0.6, 0.85, 0.95, 0.75], BLENDER, ['Cracks on hot walls'], ['rp2']),
    route('P3', 3, 'Fly-ash cement–lime', [['opc53', 12, 14], ['fly-ash', 4, 6], ['sand', 74, 78], ['lime', 4, 5], ['mhec', 0.12, 0.15], ['aea-powder', 0.02, 0.04]], [['compressive', 4.1, 'pass'], ['pull-off', 0.31, 'borderline'], ['shrinkage', 0.9, 'pass']], [0.8, 0.92, 0.9, 0.84], BLENDER, ['Slow early strength in cold'], ['rp1']),
  ],
  balanceMaterial: 'sand', leverMaterial: 'mhec',
  clusters: ['Lime and crack resistance', 'Cellulose ether and sprayability', 'Air entrainment', 'Fibre reinforcement'],
  query: '("ready-mix plaster" OR "rendering mortar") AND (lime OR "cellulose ether") AND (shrinkage OR cracking) AND spray',
  sources: [
    src('rp1', 'Paper', 'Lime content and crack resistance of cement renders', 2020, 0.87, '5 % lime cut drying shrinkage 20 % with CS III kept.', 'Lime and crack resistance'),
    src('rp2', 'Paper', 'Air entrainment and pumpability of machine-applied renders', 2022, 0.8, '0.03 % air entrainer improved spray flow and lowered density.', 'Air entrainment'),
  ],
  measured: ['compressive', 'pull-off', 'shrinkage', 'water-retention'],
  mixingProtocol: dryMix('MHEC, air entrainer, PP fibre'),
  testPlan: [
    { test: 'Compressive 28 d', method: 'EN 1015-11', specimens: 3, ages: '28 d', dueInDays: 30 },
    { test: 'Adhesive strength', method: 'EN 1015-12', specimens: 5, ages: '28 d', dueInDays: 30 },
    { test: 'Drying shrinkage', method: 'EN 12617-4', specimens: 3, ages: '28 d', dueInDays: 30 },
  ],
});

/* ---------- Wall putty ---------- */

export const PT_WC: Scenario = {
  id: 'pt-wc', label: 'White-cement wall putty', chip: 'Wall putty · white cement',
  example: 'White cement wall putty for smooth interior walls before painting',
  keywords: ['wall putty', 'white cement putty', 'cement putty', 'putty', 'skim coat', 'skimming'],
  projectName: 'White-cement wall putty — Interior paint-ready', codePrefix: 'HX-PT',
  docType: 'Technical Data Sheet', productGuess: 'Polymer-modified white-cement wall putty',
  categoryId: 'putty', subcategoryId: 'pt-wc', chemistry: ['cementitious', 'polymer-modified'], form: 'powder',
  standard: 'Internal', standardAlt: 'EN 1348 (adhesion method)',
  useCase: { substrate: 'Cement plaster', surfaces: ['Wall'], thicknessMm: 1.5, coats: 2, finish: 'Paint-ready smooth', coverageKgM2: 1.2, exposure: 'interior', climate: 'Hot-humid', appTemp: [10, 40], method: 'Putty blade', standardClass: 'Internal' },
  useCaseConfidence: { substrate: 0.9, surfaces: 0.94, thicknessMm: 0.78, coats: 0.86, finish: 0.92, coverageKgM2: 0.7, exposure: 0.9, climate: 0.68, appTemp: 0.76, method: 0.9, standardClass: 0.6 },
  guided: [
    { id: 'where', q: 'Where is the putty going?', picture: 'PaintRoller', answer: 0, options: [
      { label: 'Inside walls', icon: 'House', sets: { exposure: 'interior', surfaces: ['Wall'] } },
      { label: 'Outside walls', icon: 'Building', sets: { exposure: 'exterior', surfaces: ['Wall', 'Facade'] } },
      { label: 'Bathroom walls', icon: 'ShowerHead', sets: { exposure: 'interior', surfaces: ['Wall', 'Wet area'] } },
    ] },
    COMMON_GUIDED[1],
  ],
  benchmarks: [bench('bm-pt', 'Benchmark W-P', 'pt-wc', 'Internal', 22, [['pull-off', 1.1, 'N/mm²', 'TDS'], ['water-retention', 99, '%', 'TDS'], ['coverage', 1.2, 'kg/m²', 'TDS'], ['setting-time', 180, 'min', 'TDS']])],
  targets: [
    { propertyId: 'pull-off', operator: '>=', value: 1, priority: 'must', reason: 'Adhesion to plaster, 28 d', bench: 1.1, confidence: 0.88 },
    { propertyId: 'water-retention', operator: '>=', value: 98, priority: 'must', reason: 'Thin coat on dry plaster', bench: 99, confidence: 0.86 },
    { propertyId: 'setting-time', operator: 'between', value: [120, 240], priority: 'important', reason: 'Second coat same day', bench: 180, confidence: 0.78 },
    { propertyId: 'coverage', operator: '<=', value: 1.2, priority: 'nice', reason: 'Two coats, kg/m²', bench: 1.2, confidence: 0.72 },
  ],
  top3: [{ id: 'pull-off', reason: 'Paint peels if putty powders' }, { id: 'cost', reason: 'Painter-led market, ₹ 18–25/kg' }, { id: 'water-retention', reason: 'Cracks on hot dry walls' }],
  constraints: { costCeiling: 16, budgetBand: 'economy', materialLimits: [], compliance: [], site: { tMin: 10, tMax: 40, rhMax: 90 }, mustHaves: ['White, sands smooth'], remark: '20 and 40 kg bags.' },
  summary: {
    scientist: '**Helix is formulating:** a **polymer-modified white-cement putty** for **interior paint-ready walls**, with **adhesion ≥ 1.0 N/mm²** and **≥ 98 % water retention**, at **≤ ₹ 16 / kg**.',
    plain: '**Helix is making:** a **white paste for walls** that fills small dents and **makes the wall smooth** before painting.',
  },
  pathways: [
    route('P1', 1, 'White cement + dolomite + VAE', [['white-cement', 30, 35], ['dolomite', 40, 45], ['caco3', 18, 22], ['vae-rdp', 1, 1.5], ['hpmc60', 0.3, 0.4], ['lime', 2, 3]], [['pull-off', 1.08, 'pass'], ['water-retention', 99, 'pass'], ['setting-time', 170, 'pass']], [0.9, 0.8, 0.9, 0.86], BLENDER, ['Alkaline — gloves'], ['pt1', 'pt2']),
    route('P2', 2, 'Low cement, high filler', [['white-cement', 22, 25], ['dolomite', 50, 55], ['caco3', 18, 22], ['vae-rdp', 0.8, 1], ['hpmc60', 0.3, 0.35], ['lime', 2, 3]], [['pull-off', 0.82, 'fail'], ['water-retention', 98.5, 'pass'], ['setting-time', 200, 'pass']], [0.65, 0.95, 0.9, 0.79], BLENDER, ['Powders when sanded'], ['pt1']),
    route('P3', 3, 'High-polymer premium', [['white-cement', 30, 33], ['dolomite', 40, 44], ['caco3', 18, 22], ['vae-rdp', 2, 2.5], ['hpmc60', 0.35, 0.4], ['lime', 2, 3]], [['pull-off', 1.3, 'pass'], ['water-retention', 99, 'pass'], ['setting-time', 190, 'pass']], [0.92, 0.6, 0.9, 0.8], BLENDER, ['Over cost ceiling risk'], ['pt2']),
  ],
  balanceMaterial: 'dolomite', leverMaterial: 'vae-rdp',
  clusters: ['Cement-to-filler ratio', 'Polymer and adhesion', 'Water retention', 'Whiteness and sanding'],
  query: '("wall putty" OR "skim coat") AND ("white cement" OR "redispersible powder") AND (adhesion OR "water retention")',
  sources: [
    src('pt1', 'Paper', 'Filler ratio and adhesion of white-cement skim coats', 2021, 0.86, 'Below 28 % cement, adhesion fell under 0.9 N/mm².', 'Cement-to-filler ratio'),
    src('pt2', 'Paper', 'Redispersible powders in decorative skim coats', 2022, 0.82, '1.2 % VAE powder lifted adhesion to 1.1 N/mm² without hurting sanding.', 'Polymer and adhesion'),
  ],
  measured: ['pull-off', 'water-retention', 'setting-time', 'coverage'],
  mixingProtocol: dryMix('HPMC, VAE powder, lime'),
  testPlan: [
    { test: 'Adhesion to plaster', method: 'EN 1348 (adapted)', specimens: 5, ages: '28 d', dueInDays: 30 },
    { test: 'Water retention', method: 'EN 1015-8', specimens: 2, ages: 'fresh', dueInDays: 1 },
    { test: 'Setting time', method: 'EN 196-3', specimens: 2, ages: 'fresh', dueInDays: 1 },
  ],
};

export const PT_ACRYLIC = variant(PT_WC, {
  id: 'pt-acrylic', label: 'Acrylic wall putty (paste)', chip: 'Acrylic putty',
  example: 'Ready-to-use acrylic putty paste for touch-ups on interior walls',
  keywords: ['acrylic putty', 'ready-to-use putty', 'ready to use putty', 'paste putty', 'putty paste'],
  projectName: 'Acrylic putty paste — Interior touch-up', codePrefix: 'HX-AP',
  productGuess: 'Water-based acrylic wall putty paste', subcategoryId: 'pt-acrylic', chemistry: ['acrylic'], form: 'paste',
  standard: 'Internal', standardAlt: 'EN 13963',
  useCase: { substrate: 'Cement plaster', surfaces: ['Wall'], thicknessMm: 1, coats: 2, finish: 'Paint-ready smooth', coverageKgM2: 0.8, exposure: 'interior', climate: 'Composite', appTemp: [10, 40], method: 'Putty blade', standardClass: 'Internal' },
  benchmarks: [bench('bm-ap', 'Benchmark A-P', 'pt-acrylic', 'Internal', 45, [['pull-off', 0.9, 'N/mm²', 'TDS'], ['drying-time', 3, 'h', 'TDS'], ['voc', 10, 'g/L', 'TDS'], ['shrinkage', 2, 'mm/m', 'Lab-tested']])],
  targets: [
    { propertyId: 'pull-off', operator: '>=', value: 0.8, priority: 'must', reason: 'Adhesion to plaster', bench: 0.9, confidence: 0.86 },
    { propertyId: 'voc', operator: '<=', value: 30, priority: 'must', reason: 'Low-odour indoors', bench: 10, confidence: 0.88 },
    { propertyId: 'drying-time', operator: '<=', value: 4, priority: 'important', reason: 'Sand and paint the same day', bench: 3, confidence: 0.8 },
    { propertyId: 'shrinkage', operator: '<=', value: 3, priority: 'important', reason: 'No dips after drying in 2 mm fills', bench: 2, confidence: 0.72 },
  ],
  top3: [{ id: 'drying-time', reason: 'Painters want same-day finish' }, { id: 'pull-off', reason: 'No flaking' }, { id: 'cost', reason: 'Benchmark at ₹ 45/kg' }],
  constraints: { costCeiling: 30, budgetBand: 'mid', materialLimits: [], compliance: ['Water-based', 'Low VOC'], site: { tMin: 10, tMax: 40, rhMax: 85 }, mustHaves: ['Smooth sanding'], remark: '1, 5 and 20 kg tubs.' },
  summary: {
    scientist: '**Helix is formulating:** a **water-based acrylic putty paste** for **interior touch-ups**, with **adhesion ≥ 0.8 N/mm²**, **VOC ≤ 30 g/L** and **dry in ≤ 4 h**, at **≤ ₹ 30 / kg**.',
    plain: '**Helix is making:** a **ready-to-use putty in a tub** that fills dents and **dries fast enough to paint the same day**.',
  },
  pathways: [
    route('P1', 1, 'Acrylic binder + calcite + talc', [['acrylic-emul', 12, 15], ['caco3', 55, 60], ['talc', 12, 15], ['hec', 0.3, 0.5], ['coalescent', 0.5, 0.8], ['biocide', 0.1, 0.2], ['liq-defoamer', 0.1, 0.2], ['water', 12, 16]], [['pull-off', 0.88, 'pass'], ['voc', 12, 'pass'], ['drying-time', 3, 'pass']], [0.9, 0.8, 0.9, 0.86], ['Butterfly mixer'], ['Freezes below 0 °C'], ['ap1']),
    route('P2', 2, 'Low binder', [['acrylic-emul', 8, 10], ['caco3', 60, 65], ['talc', 12, 15], ['hec', 0.4, 0.5], ['biocide', 0.1, 0.2], ['water', 14, 18]], [['pull-off', 0.6, 'fail'], ['voc', 8, 'pass'], ['drying-time', 2.5, 'pass']], [0.6, 0.95, 0.9, 0.78], ['Butterfly mixer'], ['Chalky surface'], ['ap1']),
    route('P3', 3, 'Acrylic + white cement hybrid', [['acrylic-emul', 10, 12], ['caco3', 50, 55], ['white-cement', 8, 10], ['talc', 10, 12], ['hec', 0.3, 0.4], ['biocide', 0.1, 0.2], ['water', 12, 15]], [['pull-off', 1, 'pass'], ['voc', 10, 'pass'], ['drying-time', 3.5, 'pass']], [0.85, 0.85, 0.85, 0.85], ['Butterfly mixer'], ['Short tub life — cement reacts'], ['ap2']),
  ],
  balanceMaterial: 'caco3', leverMaterial: 'acrylic-emul',
  clusters: ['Binder level and adhesion', 'Filler packing and sanding', 'Drying and shrinkage', 'In-can stability'],
  query: '("acrylic putty" OR "ready-mixed filler") AND (adhesion OR sanding) AND (shrinkage OR drying)',
  sources: [
    src('ap1', 'Paper', 'Binder content of ready-mixed acrylic fillers', 2020, 0.84, '12–15 % emulsion gave 0.8–0.95 N/mm² adhesion with good sanding.', 'Binder level and adhesion'),
    src('ap2', 'Paper', 'Hybrid acrylic–cement putties', 2022, 0.74, 'Cement addition raised adhesion but shortened shelf life to 3 months.', 'In-can stability'),
  ],
  measured: ['pull-off', 'voc', 'drying-time', 'shrinkage'],
  mixingProtocol: ['Charge water, HEC and biocide; disperse 10 min.', 'Add acrylic emulsion and coalescent.', 'Add calcite and talc under high torque; deaerate.'],
  testPlan: [
    { test: 'Adhesion to plaster', method: 'EN 1348 (adapted)', specimens: 5, ages: '7 d', dueInDays: 9 },
    { test: 'Drying time', method: 'ASTM D1640', specimens: 2, ages: '—', dueInDays: 1 },
    { test: 'VOC', method: 'EN ISO 11890-2', specimens: 1, ages: '—', dueInDays: 5 },
  ],
});

/* ---------- Bonding agents and primers ---------- */

export const BD_SBR: Scenario = {
  id: 'bd-sbr', label: 'SBR bonding agent', chip: 'SBR bonding agent',
  example: 'SBR latex bonding agent for bonding new plaster to old concrete',
  keywords: ['sbr', 'bonding agent', 'bond coat', 'bonding slurry', 'latex'],
  projectName: 'SBR bonding agent — New-to-old bonding', codePrefix: 'HX-SB',
  docType: 'Technical Data Sheet', productGuess: 'Carboxylated SBR latex bonding agent',
  categoryId: 'bonding', subcategoryId: 'bd-sbr', chemistry: ['polymer-modified'], form: 'liquid',
  standard: 'ASTM C1059 Type II', standardAlt: 'BS 6319',
  useCase: { substrate: 'Concrete', surfaces: ['Wall', 'Floor'], thicknessMm: 2, coats: 1, coverageKgM2: 0.15, exposure: 'exterior', climate: 'Hot-humid', appTemp: [10, 40], method: 'Brush/roller', standardClass: 'ASTM C1059 Type II' },
  useCaseConfidence: { substrate: 0.92, surfaces: 0.84, thicknessMm: 0.66, coats: 0.8, coverageKgM2: 0.64, exposure: 0.76, climate: 0.7, appTemp: 0.78, method: 0.86, standardClass: 0.86 },
  guided: [
    { id: 'what', q: 'What are you sticking to the old surface?', picture: 'Link', answer: 0, options: [
      { label: 'New plaster', icon: 'PaintRoller', sets: { surfaces: ['Wall'], thicknessMm: 2 } },
      { label: 'New floor screed', icon: 'Square', sets: { surfaces: ['Floor'], thicknessMm: 2 } },
      { label: 'Repair mortar', icon: 'Hammer', sets: { surfaces: ['Wall', 'Floor'], thicknessMm: 2 } },
    ] },
    COMMON_GUIDED[1],
  ],
  benchmarks: [bench('bm-sb', 'Benchmark S-B', 'bd-sbr', 'ASTM C1059 Type II', 140, [['pull-off', 1.6, 'N/mm²', 'TDS'], ['solids', 32, '%', 'TDS'], ['viscosity', 150, 'mPa·s', 'TDS'], ['shelf-life', 12, 'months', 'TDS']])],
  targets: [
    { propertyId: 'pull-off', operator: '>=', value: 1.5, priority: 'must', std: 'Bond ≥ 1.5 (ASTM C1059 slant shear, adapted)', reason: 'New-to-old bond, wet cured', bench: 1.6, confidence: 0.86 },
    { propertyId: 'solids', operator: 'between', value: [30, 35], priority: 'important', bench: 32, confidence: 0.86 },
    { propertyId: 'viscosity', operator: '<=', value: 300, priority: 'nice', reason: 'Brushable and mixable into slurry', bench: 150, confidence: 0.78 },
    { propertyId: 'shelf-life', operator: '>=', value: 12, priority: 'nice', bench: 12, confidence: 0.82 },
  ],
  top3: [{ id: 'pull-off', reason: 'Plaster hollowness is the failure' }, { id: 'cost', reason: 'Sold by the litre to contractors' }, { id: 'solids', reason: 'Diluted on site — must still work' }],
  constraints: { costCeiling: 100, budgetBand: 'mid', materialLimits: [], compliance: ['Water-based'], site: { tMin: 10, tMax: 40, rhMax: 95 }, mustHaves: ['Non-re-emulsifiable (Type II)'], remark: '1, 5 and 20 L cans.' },
  summary: {
    scientist: '**Helix is formulating:** a **carboxylated SBR bonding agent** to **ASTM C1059 Type II** for **new plaster and screed on old concrete**, giving **≥ 1.5 N/mm² bond** at **30–35 % solids**, at **≤ ₹ 100 / kg**.',
    plain: '**Helix is making:** a **milky liquid brushed on old concrete** so **new plaster sticks to it** and doesn\'t sound hollow later.',
  },
  pathways: [
    route('P1', 1, 'Carboxylated SBR, stabilised', [['sbr-latex', 60, 65], ['emulsifier', 1, 1.5], ['liq-defoamer', 0.2, 0.3], ['biocide', 0.1, 0.2], ['water', 33, 38.7]], [['pull-off', 1.62, 'pass'], ['solids', 31.5, 'pass'], ['viscosity', 140, 'pass']], [0.9, 0.8, 0.9, 0.86], TANK, ['Skin sensitiser (biocide)'], ['sb1']),
    route('P2', 2, 'Lean SBR', [['sbr-latex', 50, 55], ['emulsifier', 1, 1.5], ['liq-defoamer', 0.2, 0.3], ['biocide', 0.1, 0.2], ['water', 43, 48.7]], [['pull-off', 1.3, 'fail'], ['solids', 26, 'fail'], ['viscosity', 90, 'pass']], [0.55, 0.95, 0.9, 0.74], TANK, ['Weak bond'], ['sb1']),
    route('P3', 3, 'SBR + acrylic blend', [['sbr-latex', 45, 50], ['acrylic-emul', 15, 18], ['emulsifier', 1, 1.5], ['liq-defoamer', 0.2, 0.3], ['biocide', 0.1, 0.2], ['water', 30, 38.7]], [['pull-off', 1.7, 'pass'], ['solids', 32, 'pass'], ['viscosity', 180, 'pass']], [0.88, 0.75, 0.85, 0.82], TANK, ['Two latex suppliers'], ['sb2']),
  ],
  balanceMaterial: 'water', leverMaterial: 'sbr-latex',
  clusters: ['Latex solids and bond', 'Carboxylation and cement compatibility', 'Water resistance', 'Shelf life'],
  query: '("SBR latex" OR "bonding agent") AND (concrete OR mortar) AND ("bond strength" OR "slant shear") AND carboxylated',
  sources: [
    src('sb1', 'Paper', 'SBR latex solids and bond of new-to-old concrete', 2019, 0.86, 'Slurry with 30 % latex solids doubled slant-shear bond vs neat cement.', 'Latex solids and bond'),
    src('sb2', 'Paper', 'SBR–acrylic blends in cementitious bonding coats', 2021, 0.78, 'Blends kept bond and improved UV resistance.', 'Water resistance'),
  ],
  measured: ['pull-off', 'solids', 'viscosity'],
  mixingProtocol: ['Charge water and emulsifier; low-shear stir.', 'Add SBR latex slowly; add defoamer and biocide.', 'Stir 15 min; check solids, pH and viscosity.'],
  testPlan: [
    { test: 'Bond strength (slurry coat)', method: 'ASTM C1059 / EN 1542', specimens: 3, ages: '28 d', dueInDays: 30 },
    { test: 'Solids content', method: 'ISO 3251', specimens: 2, ages: '—', dueInDays: 1 },
    { test: 'Viscosity', method: 'EN ISO 2555', specimens: 2, ages: '—', dueInDays: 1 },
  ],
};

export const BD_ACR = variant(BD_SBR, {
  id: 'bd-acr', label: 'Acrylic wall primer', chip: 'Acrylic primer',
  example: 'Acrylic wall primer to seal new plaster before painting',
  keywords: ['acrylic primer', 'wall primer', 'primer', 'sealer coat', 'alkali-resistant primer'],
  projectName: 'Acrylic wall primer — New plaster', codePrefix: 'HX-PR',
  productGuess: 'Water-based acrylic alkali-resistant wall primer', subcategoryId: 'bd-acr', chemistry: ['acrylic'],
  standard: 'Internal', standardAlt: 'IS 15489',
  useCase: { substrate: 'Cement plaster', surfaces: ['Wall'], thicknessMm: 0.05, coats: 1, finish: 'Coating-ready', coverageKgM2: 0.1, exposure: 'interior', climate: 'Composite', appTemp: [10, 40], method: 'Brush/roller', standardClass: 'Internal' },
  benchmarks: [bench('bm-pr', 'Benchmark P-R', 'bd-acr', 'Internal', 60, [['pull-off', 1.2, 'N/mm²', 'Lab-tested'], ['voc', 15, 'g/L', 'TDS'], ['drying-time', 1, 'h', 'TDS'], ['viscosity', 100, 'mPa·s', 'TDS']])],
  targets: [
    { propertyId: 'pull-off', operator: '>=', value: 1, priority: 'must', reason: 'Paint system adhesion on primer', bench: 1.2, confidence: 0.84 },
    { propertyId: 'voc', operator: '<=', value: 30, priority: 'must', bench: 15, confidence: 0.88 },
    { propertyId: 'drying-time', operator: '<=', value: 2, priority: 'important', reason: 'Recoat the same day', bench: 1, confidence: 0.82 },
    { propertyId: 'viscosity', operator: 'between', value: [50, 200], priority: 'nice', bench: 100, confidence: 0.78 },
  ],
  top3: [{ id: 'pull-off', reason: 'Paint peeling on fresh alkaline plaster' }, { id: 'cost', reason: 'Diluted 1:1 — ₹ per litre applied' }, { id: 'drying-time', reason: 'Painters recoat in 2 h' }],
  constraints: { costCeiling: 45, budgetBand: 'economy', materialLimits: [], compliance: ['Water-based', 'Low VOC'], site: { tMin: 10, tMax: 40, rhMax: 85 }, mustHaves: ['Alkali resistant'], remark: '1, 4 and 20 L cans.' },
  summary: {
    scientist: '**Helix is formulating:** a **water-based acrylic primer** for **fresh cement plaster**, giving **≥ 1.0 N/mm² paint adhesion**, **VOC ≤ 30 g/L** and **recoat in ≤ 2 h**, at **≤ ₹ 45 / kg**.',
    plain: '**Helix is making:** a **first coat for new walls** that **seals the plaster** so paint sticks and doesn\'t patch.',
  },
  pathways: [
    route('P1', 1, 'Styrene-acrylic, coalesced', [['acrylic-emul', 25, 30], ['coalescent', 1, 1.5], ['liq-defoamer', 0.2, 0.3], ['biocide', 0.1, 0.2], ['water', 68, 72]], [['pull-off', 1.15, 'pass'], ['voc', 18, 'pass'], ['drying-time', 1, 'pass']], [0.9, 0.8, 0.9, 0.86], TANK, ['Clogs rollers if left'], ['pr1']),
    route('P2', 2, 'Lean binder', [['acrylic-emul', 18, 20], ['coalescent', 0.8, 1], ['biocide', 0.1, 0.2], ['water', 78, 81]], [['pull-off', 0.85, 'fail'], ['voc', 12, 'pass'], ['drying-time', 0.8, 'pass']], [0.6, 0.95, 0.9, 0.77], TANK, ['Poor sealing'], ['pr1']),
    route('P3', 3, 'Acrylic + SBR hybrid', [['acrylic-emul', 20, 22], ['sbr-latex', 6, 8], ['coalescent', 1, 1.2], ['biocide', 0.1, 0.2], ['water', 68, 72]], [['pull-off', 1.2, 'pass'], ['voc', 16, 'pass'], ['drying-time', 1.3, 'pass']], [0.86, 0.75, 0.85, 0.82], TANK, ['Yellows outdoors'], ['pr2']),
  ],
  balanceMaterial: 'water', leverMaterial: 'acrylic-emul',
  clusters: ['Penetration and sealing', 'Alkali resistance', 'Paint adhesion', 'VOC'],
  query: '("acrylic primer" OR "alkali-resistant primer") AND plaster AND (adhesion OR sealing)',
  sources: [
    src('pr1', 'Paper', 'Binder level in alkali-resistant wall primers', 2021, 0.82, '25–30 % emulsion gave full sealing on 7-day-old plaster.', 'Penetration and sealing'),
    src('pr2', 'Paper', 'Hybrid latex primers on fresh cement plaster', 2019, 0.72, 'SBR additions improved adhesion but yellowed under UV.', 'Alkali resistance'),
  ],
  measured: ['pull-off', 'voc', 'drying-time', 'viscosity'],
  mixingProtocol: ['Charge water and defoamer.', 'Add acrylic emulsion and coalescent under low shear.', 'Add biocide; stir 15 min; check viscosity and pH.'],
  testPlan: [
    { test: 'Pull-off of paint system', method: 'ISO 4624', specimens: 5, ages: '7 d', dueInDays: 9 },
    { test: 'Drying time', method: 'ASTM D1640', specimens: 2, ages: '—', dueInDays: 1 },
    { test: 'VOC', method: 'EN ISO 11890-2', specimens: 1, ages: '—', dueInDays: 5 },
  ],
});

/* ---------- Thermal insulation mortars ---------- */

export const TH_PERLITE: Scenario = {
  id: 'th-perlite', label: 'Perlite thermal insulating plaster', chip: 'Thermal plaster · perlite',
  example: 'Lightweight perlite insulating plaster to keep top-floor walls cooler',
  keywords: ['thermal insulation', 'thermal insulating', 'insulating plaster', 'insulating mortar', 'perlite', 'lightweight plaster', 'heat insulation', 'eps plaster'],
  projectName: 'Perlite insulating plaster — Hot-climate walls', codePrefix: 'HX-TH',
  docType: 'Technical Data Sheet', productGuess: 'Perlite lightweight thermal insulating render',
  categoryId: 'thermal', subcategoryId: 'th-perlite', chemistry: ['cementitious'], form: 'powder',
  standard: 'EN 998-1 T1', standardAlt: 'ASTM C518',
  useCase: { substrate: 'Block masonry', surfaces: ['Wall', 'Facade'], thicknessMm: 25, coats: 2, finish: 'Coating-ready', coverageKgM2: 8, exposure: 'exterior', climate: 'Hot-dry', appTemp: [10, 45], method: 'Spray', standardClass: 'EN 998-1 T1' },
  useCaseConfidence: { substrate: 0.86, surfaces: 0.9, thicknessMm: 0.72, coats: 0.76, finish: 0.7, coverageKgM2: 0.62, exposure: 0.92, climate: 0.88, appTemp: 0.8, method: 0.82, standardClass: 0.84 },
  guided: [
    { id: 'thick', q: 'How thick can the plaster be?', picture: 'Thermometer', answer: 1, options: [
      { label: 'Thin — about 15 mm', icon: 'Layers', sets: { thicknessMm: 15, coats: 1 } },
      { label: 'Normal — about 25 mm', icon: 'Layers', sets: { thicknessMm: 25, coats: 2 } },
      { label: 'Thick — 40 mm or more', icon: 'BrickWall', sets: { thicknessMm: 40, coats: 3 } },
    ] },
    COMMON_GUIDED[1],
  ],
  benchmarks: [bench('bm-th', 'Benchmark T', 'th-perlite', 'EN 998-1 T1', 35, [['thermal-conductivity', 0.09, 'W/m·K', 'TDS'], ['fresh-density', 650, 'kg/m³', 'TDS'], ['compressive', 1.8, 'N/mm²', 'TDS'], ['pull-off', 0.25, 'N/mm²', 'TDS']])],
  targets: [
    { propertyId: 'thermal-conductivity', operator: '<=', value: 0.1, priority: 'must', std: 'T1 ≤ 0.1 W/m·K (EN 998-1)', stdMax: 0.1, bench: 0.09, confidence: 0.86 },
    { propertyId: 'compressive', operator: '>=', value: 1.5, priority: 'must', std: 'CS I 0.4–2.5 (EN 998-1)', stdMin: 0.4, bench: 1.8, confidence: 0.84 },
    { propertyId: 'fresh-density', operator: '<=', value: 700, priority: 'important', reason: 'Lower density, lower λ', bench: 650, confidence: 0.82 },
    { propertyId: 'pull-off', operator: '>=', value: 0.2, priority: 'important', std: '≥ 0.2 (EN 998-1)', stdMin: 0.2, bench: 0.25, confidence: 0.8 },
  ],
  top3: [{ id: 'thermal-conductivity', reason: 'The whole point — cooler rooms' }, { id: 'compressive', reason: 'Too light and it dents' }, { id: 'cost', reason: 'Perlite is the expensive part' }],
  constraints: { costCeiling: 24, budgetBand: 'mid', materialLimits: [], compliance: [], site: { tMin: 10, tMax: 45, rhMax: 60 }, mustHaves: ['Sprayable'], remark: '20 kg bag (light).' },
  summary: {
    scientist: '**Helix is formulating:** a **perlite lightweight insulating render** to **EN 998-1 T1** for **sun-exposed walls in hot-dry climates**, with **λ ≤ 0.10 W/m·K** and **compressive ≥ 1.5 N/mm²**, at **≤ ₹ 24 / kg**.',
    plain: '**Helix is making:** a **light plaster with tiny glassy beads** that **keeps heat out** of rooms under the sun.',
  },
  pathways: [
    route('P1', 1, 'Perlite + air + RDP', [['opc53', 45, 50], ['perlite', 25, 30], ['lime', 8, 10], ['caco3', 10, 15], ['mhec', 0.4, 0.5], ['aea-powder', 0.1, 0.15], ['vae-rdp', 1.5, 2], ['pp-fibre', 0.1, 0.2]], [['thermal-conductivity', 0.095, 'pass'], ['compressive', 1.7, 'pass'], ['fresh-density', 680, 'pass']], [0.88, 0.8, 0.88, 0.85], BLENDER, ['Perlite dust — mask'], ['th1', 'th2']),
    route('P2', 2, 'High perlite, low cement', [['opc53', 38, 42], ['perlite', 33, 38], ['lime', 8, 10], ['caco3', 8, 12], ['mhec', 0.45, 0.5], ['aea-powder', 0.12, 0.15], ['vae-rdp', 1.5, 2]], [['thermal-conductivity', 0.08, 'pass'], ['compressive', 1.1, 'fail'], ['fresh-density', 560, 'pass']], [0.7, 0.7, 0.88, 0.76], BLENDER, ['Soft surface'], ['th1']),
    route('P3', 3, 'Perlite + EPS beads', [['opc53', 45, 50], ['perlite', 18, 22], ['eps-beads', 2, 3], ['lime', 8, 10], ['caco3', 15, 18], ['mhec', 0.4, 0.5], ['aea-powder', 0.1, 0.12], ['vae-rdp', 1.5, 2]], [['thermal-conductivity', 0.085, 'pass'], ['compressive', 1.6, 'pass'], ['fresh-density', 600, 'pass']], [0.9, 0.7, 0.6, 0.78], BLENDER, ['EPS supply pending'], ['th2']),
  ],
  balanceMaterial: 'caco3', leverMaterial: 'perlite',
  clusters: ['Lightweight aggregate dosage', 'Density vs conductivity', 'Strength of light mortars', 'Air entrainment'],
  query: '(perlite OR "lightweight aggregate") AND ("thermal insulating render" OR "insulating plaster") AND ("thermal conductivity" OR density)',
  sources: [
    src('th1', 'Paper', 'Expanded perlite content and λ of cement renders', 2021, 0.88, '27 % perlite by mass gave λ 0.09 W/m·K at 1.7 N/mm².', 'Density vs conductivity'),
    src('th2', 'Paper', 'Hybrid perlite–EPS insulating mortars', 2022, 0.8, 'Replacing 30 % perlite with EPS cut λ 10 % at equal strength.', 'Lightweight aggregate dosage'),
  ],
  measured: ['thermal-conductivity', 'compressive', 'fresh-density', 'pull-off'],
  mixingProtocol: dryMix('MHEC, air entrainer, RDP, fibre'),
  testPlan: [
    { test: 'Thermal conductivity', method: 'EN 12667', specimens: 2, ages: '28 d', dueInDays: 32 },
    { test: 'Compressive 28 d', method: 'EN 1015-11', specimens: 3, ages: '28 d', dueInDays: 30 },
    { test: 'Fresh density', method: 'EN 1015-6', specimens: 2, ages: 'fresh', dueInDays: 1 },
  ],
};

/** Routing order: each variant before the scenario whose keywords it overlaps (acrylic before white-cement putty…). */
export const MASONRY_ROUTE_ORDER: Scenario[] = [BJ_AAC, PL_READYMIX, PT_ACRYLIC, PT_WC, BD_SBR, BD_ACR, TH_PERLITE];

export const MASONRY_SCENARIOS: Scenario[] = [BJ_AAC, PL_READYMIX, PT_WC, PT_ACRYLIC, BD_SBR, BD_ACR, TH_PERLITE];
