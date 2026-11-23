import type { Scenario } from './types';
import { COMMON_GUIDED } from './guided';
import { bench, midCost, pw, src, variant } from './build';
import { SL_MS } from './waterproofing';

/** Group 6 — Specialty. One full scenario per subcategory (fire and adhesives use different field profiles). Demo data — for R&D to confirm. */

type Comp = [string, number, number][];
const route = (id: string, rank: number, name: string, comp: Comp, predicted: Parameters<typeof pw>[4], s: Parameters<typeof pw>[5], equipment: string[], hazards: string[], citations: string[]) =>
  pw(id, rank, name, comp, predicted, s, midCost(comp), equipment, hazards, citations);

/* ---------- Fire protection ---------- */

export const FP_INT: Scenario = {
  id: 'fp-intumescent', label: 'Intumescent steel fire-protection coating', chip: 'Intumescent coating',
  example: 'Intumescent fire protection coating for structural steel beams, 90 minutes',
  keywords: ['intumescent', 'fire protection', 'fire-protection', 'fireproofing', 'fire proofing', 'fire rating', 'fire resistant coating', 'fire-resistant coating', 'steel fire'],
  projectName: 'Water-based intumescent — Structural steel R90', codePrefix: 'HX-FP',
  docType: 'Technical Data Sheet', productGuess: 'Water-based thin-film intumescent coating for steel',
  categoryId: 'fire', subcategoryId: 'fp-intumescent', chemistry: ['acrylic'], form: 'liquid',
  standard: 'EN 13381-8', standardAlt: 'BS 476-20',
  useCase: { substrate: 'Steel', element: 'Steel section', fireRatingMin: 90, sectionFactor: 200, thicknessMm: 1.5, exposure: 'interior', climate: 'Hot-humid', method: 'Spray', standardClass: 'EN 13381-8' },
  useCaseConfidence: { substrate: 0.96, element: 0.92, fireRatingMin: 0.88, sectionFactor: 0.62, thicknessMm: 0.7, exposure: 0.88, climate: 0.68, method: 0.86, standardClass: 0.86 },
  guided: [
    { id: 'rating', q: 'How long must the steel survive a fire?', picture: 'Flame', answer: 1, options: [
      { label: '1 hour', icon: 'Timer', sets: { fireRatingMin: 60, thicknessMm: 0.8 } },
      { label: '1½ hours', icon: 'Timer', sets: { fireRatingMin: 90, thicknessMm: 1.5 } },
      { label: '2 hours', icon: 'Timer', sets: { fireRatingMin: 120, thicknessMm: 2.5 } },
    ] },
    { id: 'steel', q: 'How heavy are the steel sections?', picture: 'Columns3', answer: 1, options: [
      { label: 'Heavy columns', icon: 'Columns3', sets: { sectionFactor: 120 } },
      { label: 'Medium beams', icon: 'Rows3', sets: { sectionFactor: 200 } },
      { label: 'Light or thin sections', icon: 'Minus', sets: { sectionFactor: 300 } },
    ] },
  ],
  benchmarks: [bench('bm-fp', 'Benchmark F-P', 'fp-intumescent', 'EN 13381-8', 260, [['fire-resistance', 95, 'min', 'TDS'], ['char-expansion', 35, '×', 'Lab-tested'], ['pull-off', 1.5, 'N/mm²', 'TDS'], ['drying-time', 3, 'h', 'TDS']])],
  targets: [
    { propertyId: 'fire-resistance', operator: '>=', value: 90, priority: 'must', reason: 'At Hp/A 200 m⁻¹, 1.5 mm DFT, 550 °C critical', bench: 95, confidence: 0.86 },
    { propertyId: 'char-expansion', operator: '>=', value: 30, priority: 'important', reason: 'Stable char insulates the steel', bench: 35, confidence: 0.8 },
    { propertyId: 'pull-off', operator: '>=', value: 1, priority: 'important', reason: 'Adhesion to primed steel', bench: 1.5, confidence: 0.82 },
    { propertyId: 'drying-time', operator: '<=', value: 4, priority: 'nice', reason: 'Recoat the same day', bench: 3, confidence: 0.78 },
  ],
  top3: [{ id: 'fire-resistance', reason: 'Life safety — the only reason it is bought' }, { id: 'cost', reason: 'Thickness × area decides the bid' }, { id: 'char-expansion', reason: 'Weak char falls off in the furnace' }],
  constraints: { costCeiling: 140, budgetBand: 'premium', materialLimits: [], compliance: ['Water-based', 'Low VOC'], site: { tMin: 10, tMax: 40, rhMax: 80 }, mustHaves: ['Airless spray, 1 mm per coat'], remark: '25 kg pails.' },
  summary: {
    scientist: '**Helix is formulating:** a **water-based thin-film intumescent** to **EN 13381-8** for **structural steel**, giving **R90 at Hp/A 200 m⁻¹ and 1.5 mm DFT** with **char expansion ≥ 30×**, at **≤ ₹ 140 / kg**.',
    plain: '**Helix is making:** a **paint for steel beams** that **swells into a thick foam in a fire** and keeps the steel cool for **90 minutes**.',
  },
  pathways: [
    route('P1', 1, 'APP / PER / melamine + TiO₂ in acrylic', [['app-fr', 24, 28], ['pentaerythritol', 7, 9], ['melamine', 7, 9], ['tio2', 7, 9], ['acrylic-emul', 22, 26], ['coalescent', 1, 1.5], ['hec', 0.2, 0.4], ['biocide', 0.1, 0.2], ['liq-defoamer', 0.2, 0.3], ['water', 20, 24]], [['fire-resistance', 94, 'pass'], ['char-expansion', 34, 'pass'], ['pull-off', 1.4, 'pass']], [0.9, 0.8, 0.85, 0.85], ['High-speed dissolver', 'Bead mill'], ['Releases ammonia in fire tests'], ['fp1', 'fp2']),
    route('P2', 2, 'Low APP', [['app-fr', 18, 20], ['pentaerythritol', 7, 9], ['melamine', 7, 9], ['tio2', 7, 9], ['acrylic-emul', 24, 28], ['coalescent', 1, 1.5], ['hec', 0.2, 0.4], ['biocide', 0.1, 0.2], ['water', 23, 27]], [['fire-resistance', 78, 'fail'], ['char-expansion', 25, 'fail'], ['pull-off', 1.6, 'pass']], [0.5, 0.9, 0.85, 0.72], ['High-speed dissolver', 'Bead mill'], ['Below R90'], ['fp1']),
    route('P3', 3, 'APP + expandable graphite', [['app-fr', 22, 25], ['pentaerythritol', 6, 8], ['melamine', 6, 8], ['expandable-graphite', 3, 4], ['tio2', 6, 8], ['acrylic-emul', 22, 26], ['coalescent', 1, 1.5], ['hec', 0.2, 0.4], ['biocide', 0.1, 0.2], ['water', 20, 24]], [['fire-resistance', 100, 'pass'], ['char-expansion', 45, 'pass'], ['pull-off', 1.2, 'pass']], [0.92, 0.7, 0.75, 0.8], ['High-speed dissolver', 'Bead mill'], ['Dark colour — needs a topcoat'], ['fp2']),
  ],
  balanceMaterial: 'water', leverMaterial: 'app-fr',
  clusters: ['APP / PER / MEL ratio', 'Char strength and expansion', 'Binder and adhesion', 'Section factor and thickness'],
  query: '(intumescent AND "ammonium polyphosphate" AND pentaerythritol) AND (steel OR "EN 13381-8") AND ("char expansion" OR "fire resistance")',
  sources: [
    src('fp1', 'Paper', 'APP:PER:MEL ratio and char quality of water-based intumescents', 2021, 0.88, 'A 3:1:1 ratio gave 35× expansion and the most coherent char.', 'APP / PER / MEL ratio'),
    src('fp2', 'Paper', 'Expandable graphite in thin-film intumescent coatings', 2022, 0.8, '3 % graphite added 10 min fire resistance but darkened the film.', 'Char strength and expansion'),
  ],
  measured: ['fire-resistance', 'char-expansion', 'pull-off', 'drying-time'],
  mixingProtocol: ['Charge water, HEC, dispersant and biocide.', 'Add APP, PER, melamine and TiO₂ at high speed; bead-mill to < 50 µm.', 'Let down with acrylic emulsion and coalescent; adjust viscosity for airless spray.'],
  testPlan: [
    { test: 'Small-scale furnace (steel plate)', method: 'Internal / BS 476-20 indicative', specimens: 3, ages: '14 d', dueInDays: 18 },
    { test: 'Char expansion', method: 'Internal (500 °C muffle)', specimens: 3, ages: '7 d', dueInDays: 9 },
    { test: 'Pull-off on primed steel', method: 'ISO 4624', specimens: 5, ages: '7 d', dueInDays: 9 },
  ],
};

export const FP_FIRESTOP: Scenario = {
  id: 'fp-firestop', label: 'Intumescent firestop sealant', chip: 'Firestop sealant',
  example: 'Fire-rated intumescent sealant for joints and service penetrations, 2 hours',
  keywords: ['firestop', 'fire stop', 'fire-stop', 'fire sealant', 'fire-rated sealant', 'fire rated sealant', 'intumescent sealant', 'penetration seal', 'fire-rated joint'],
  projectName: 'Intumescent firestop sealant — EI 120 joints', codePrefix: 'HX-FS',
  docType: 'Technical Data Sheet', productGuess: 'Water-based acrylic intumescent firestop sealant',
  categoryId: 'fire', subcategoryId: 'fp-firestop', chemistry: ['acrylic'], form: 'paste',
  standard: 'EN 1366-4 (EI 120)', standardAlt: 'UL 2079',
  useCase: { substrate: 'Concrete', substrate2: 'Concrete', jointWidthMm: 20, movementPct: 7.5, uvExposure: 'None', paintable: 'Yes', exposure: 'interior', climate: 'Hot-humid', appTemp: [5, 40], method: 'Cartridge gun', standardClass: 'EN 1366-4 EI 120' },
  useCaseConfidence: { substrate: 0.9, substrate2: 0.76, jointWidthMm: 0.72, movementPct: 0.66, uvExposure: 0.9, paintable: 0.7, exposure: 0.92, climate: 0.68, appTemp: 0.78, method: 0.92, standardClass: 0.84 },
  guided: [
    { id: 'where', q: 'What are you sealing?', picture: 'Flame', answer: 0, options: [
      { label: 'Gaps between walls and slabs', icon: 'BrickWall', sets: { substrate2: 'Concrete', jointWidthMm: 20, movementPct: 7.5 } },
      { label: 'Holes around pipes and cables', icon: 'Cylinder', sets: { substrate2: 'Metal', jointWidthMm: 30, movementPct: 0 } },
      { label: 'Around fire doors', icon: 'PanelTop', sets: { substrate2: 'Metal', jointWidthMm: 10, movementPct: 5 } },
    ] },
    COMMON_GUIDED[1],
  ],
  benchmarks: [bench('bm-fs', 'Benchmark F-S', 'fp-firestop', 'EN 1366-4 EI 120', 220, [['fire-resistance', 120, 'min', 'TDS'], ['movement-capability', 7.5, '%', 'TDS'], ['char-expansion', 8, '×', 'Lab-tested'], ['sag', 2, 'mm', 'TDS']])],
  targets: [
    { propertyId: 'fire-resistance', operator: '>=', value: 120, priority: 'must', std: 'EI 120 (EN 13501-2)', stdMin: 120, reason: '20 mm joint, 10 mm backing rod', bench: 120, confidence: 0.86 },
    { propertyId: 'movement-capability', operator: '>=', value: 7.5, priority: 'important', reason: 'Linear joint movement in EN 1366-4', bench: 7.5, confidence: 0.8 },
    { propertyId: 'char-expansion', operator: '>=', value: 5, priority: 'important', reason: 'Closes gaps as plastic pipes melt', bench: 8, confidence: 0.78 },
    { propertyId: 'sag', operator: '<=', value: 3, priority: 'nice', std: '≤ 3 mm (ISO 7390)', stdMax: 3, bench: 2, confidence: 0.8 },
  ],
  top3: [{ id: 'fire-resistance', reason: 'Fire compartments depend on it' }, { id: 'char-expansion', reason: 'Seals melting pipes' }, { id: 'cost', reason: 'Benchmark at ₹ 220/kg' }],
  constraints: { costCeiling: 110, budgetBand: 'premium', materialLimits: [], compliance: ['Water-based', 'Halogen-free'], site: { tMin: 5, tMax: 40, rhMax: 85 }, mustHaves: ['Paintable, red or white'], remark: '310 mL cartridges.' },
  summary: {
    scientist: '**Helix is formulating:** a **water-based acrylic intumescent firestop sealant** to **EN 1366-4** for **linear joints and service penetrations**, rated **EI 120** with **≥ 7.5 % movement**, at **≤ ₹ 110 / kg**.',
    plain: '**Helix is making:** a **fire-rated filler for gaps and pipe holes** that **swells in a fire** and stops flames and smoke passing for **2 hours**.',
  },
  pathways: [
    route('P1', 1, 'Acrylic + expandable graphite + APP', [['acrylic-emul', 30, 35], ['caco3', 25, 30], ['expandable-graphite', 8, 10], ['app-fr', 8, 10], ['plasticiser-dinp', 4, 6], ['hec', 0.2, 0.3], ['biocide', 0.1, 0.2], ['water', 10, 14]], [['fire-resistance', 125, 'pass'], ['char-expansion', 8, 'pass'], ['sag', 2, 'pass']], [0.9, 0.8, 0.85, 0.85], ['Planetary mixer'], ['Graphite dust — mask'], ['fs1']),
    route('P2', 2, 'No graphite', [['acrylic-emul', 32, 36], ['caco3', 30, 35], ['app-fr', 12, 14], ['plasticiser-dinp', 4, 6], ['hec', 0.2, 0.3], ['biocide', 0.1, 0.2], ['water', 10, 14]], [['fire-resistance', 95, 'fail'], ['char-expansion', 2, 'fail'], ['sag', 2, 'pass']], [0.45, 0.92, 0.9, 0.72], ['Planetary mixer'], ['Fails around plastic pipes'], ['fs1']),
    route('P3', 3, 'High graphite', [['acrylic-emul', 30, 34], ['caco3', 20, 25], ['expandable-graphite', 14, 16], ['app-fr', 8, 10], ['plasticiser-dinp', 4, 6], ['hec', 0.2, 0.3], ['biocide', 0.1, 0.2], ['water', 10, 14]], [['fire-resistance', 135, 'pass'], ['char-expansion', 14, 'pass'], ['movement-capability', 5, 'fail']], [0.78, 0.65, 0.85, 0.74], ['Planetary mixer'], ['Stiff — tears with joint movement'], ['fs2']),
  ],
  balanceMaterial: 'caco3', leverMaterial: 'expandable-graphite',
  clusters: ['Expandable graphite and pressure build-up', 'Movement vs fire rating', 'Penetration seals', 'Halogen-free formulation'],
  query: '(firestop OR "fire-stop sealant") AND ("expandable graphite" OR intumescent) AND ("EN 1366" OR "UL 2079") AND movement',
  sources: [
    src('fs1', 'Paper', 'Expandable graphite in acrylic firestop sealants', 2021, 0.86, '9 % graphite closed 110 mm plastic pipes and reached EI 120.', 'Expandable graphite and pressure build-up'),
    src('fs2', 'Paper', 'Movement capability of intumescent joint sealants', 2019, 0.74, 'Above 14 % graphite movement capability fell below 7.5 %.', 'Movement vs fire rating'),
  ],
  measured: ['fire-resistance', 'char-expansion', 'movement-capability', 'sag'],
  mixingProtocol: ['Charge emulsion, plasticiser and biocide.', 'Add calcite, APP and HEC under vacuum; add graphite last at low speed (do not crush flakes).', 'Deaerate; fill cartridges.'],
  testPlan: [
    { test: 'Small-scale fire test (joint)', method: 'Internal / EN 1366-4 indicative', specimens: 2, ages: '28 d', dueInDays: 32 },
    { test: 'Movement capability', method: 'ISO 9047 (adapted)', specimens: 3, ages: '28 d', dueInDays: 32 },
    { test: 'Sag', method: 'ISO 7390', specimens: 2, ages: 'fresh', dueInDays: 1 },
  ],
};

/* ---------- Tunnelling ---------- */

export const TN_FOAM: Scenario = {
  id: 'tn-foam', label: 'TBM soil-conditioning foam', chip: 'TBM foaming agent',
  example: 'TBM foaming agent for soil conditioning in mixed ground on a metro tunnel',
  keywords: ['tbm', 'tunnel boring', 'soil conditioning', 'soil conditioner', 'foaming agent', 'epb', 'earth pressure balance'],
  projectName: 'TBM foaming agent — Metro EPB tunnels', codePrefix: 'HX-TN',
  docType: 'Technical Data Sheet', productGuess: 'Biodegradable anionic foaming agent with polymer stabiliser for EPB TBMs',
  categoryId: 'tunnelling', subcategoryId: 'tn-foam', chemistry: ['polymer-modified'], form: 'liquid',
  standard: 'EFNARC (2005)', standardAlt: 'OECD 301',
  useCase: { soilType: 'Mixed face', tbmDiameterM: 6.6, fer: 12, firPct: 50, dosagePct: [1, 3], climate: 'Hot-humid', appTemp: [15, 40], standardClass: 'EFNARC (2005)' },
  useCaseConfidence: { soilType: 0.78, tbmDiameterM: 0.84, fer: 0.72, firPct: 0.66, dosagePct: 0.7, climate: 0.7, appTemp: 0.76, standardClass: 0.82 },
  guided: [
    { id: 'soil', q: 'What ground is the machine digging through?', picture: 'Mountain', answer: 2, options: [
      { label: 'Sticky clay', icon: 'Mountain', sets: { soilType: 'Clay', fer: 8, firPct: 40 } },
      { label: 'Sand and gravel', icon: 'Grid3x3', sets: { soilType: 'Sand', fer: 12, firPct: 60 } },
      { label: 'Mixed ground', icon: 'Layers', sets: { soilType: 'Mixed face', fer: 12, firPct: 50 } },
    ] },
    COMMON_GUIDED[1],
  ],
  benchmarks: [bench('bm-tn', 'Benchmark T-N', 'tn-foam', 'EFNARC', 95, [['foam-expansion', 12, '×', 'TDS'], ['half-life', 8, 'min', 'Lab-tested'], ['biodegradability', 75, '%', 'TDS'], ['ph', 7.5, '–', 'MSDS']])],
  targets: [
    { propertyId: 'foam-expansion', operator: 'between', value: [10, 15], priority: 'must', reason: 'Foam expansion ratio (FER) at 2 % concentration', bench: 12, confidence: 0.86 },
    { propertyId: 'half-life', operator: '>=', value: 6, priority: 'must', reason: 'Foam survives the chamber', bench: 8, confidence: 0.84 },
    { propertyId: 'biodegradability', operator: '>=', value: 60, priority: 'important', std: 'Readily biodegradable ≥ 60 % (OECD 301)', stdMin: 60, bench: 75, confidence: 0.82 },
    { propertyId: 'ph', operator: 'between', value: [6, 9], priority: 'nice', bench: 7.5, confidence: 0.86 },
  ],
  top3: [{ id: 'half-life', reason: 'Collapsing foam = high torque and face instability' }, { id: 'biodegradability', reason: 'Spoil goes to landfill near the city' }, { id: 'cost', reason: 'Tonnes per kilometre' }],
  constraints: { costCeiling: 60, budgetBand: 'economy', materialLimits: [], compliance: ['Readily biodegradable', 'Low aquatic toxicity'], site: { tMin: 15, tMax: 40, rhMax: 100 }, mustHaves: ['Works with the TBM foam generators'], remark: '1000 L IBC.' },
  summary: {
    scientist: '**Helix is formulating:** a **biodegradable SLES-based foaming agent with polymer stabiliser** to **EFNARC** for **EPB TBMs in mixed ground**, with **FER 10–15**, **half-life ≥ 6 min** and **≥ 60 % biodegradability**, at **≤ ₹ 60 / kg**.',
    plain: '**Helix is making:** a **foam injected at the face of a tunnel-boring machine** that makes the dug soil **soft and easy to move** and breaks down safely afterwards.',
  },
  pathways: [
    route('P1', 1, 'SLES + polymer stabiliser + glycol', [['sles', 25, 30], ['polymer-stabiliser', 2, 3], ['deg', 4, 6], ['biocide', 0.1, 0.2], ['water', 62, 68]], [['foam-expansion', 12, 'pass'], ['half-life', 8, 'pass'], ['biodegradability', 72, 'pass']], [0.9, 0.8, 0.88, 0.86], ['Stirred tank'], ['Eye irritant'], ['tn1', 'tn2']),
    route('P2', 2, 'SLES only', [['sles', 28, 32], ['deg', 4, 6], ['biocide', 0.1, 0.2], ['water', 62, 68]], [['foam-expansion', 13, 'pass'], ['half-life', 4, 'fail'], ['biodegradability', 80, 'pass']], [0.6, 0.92, 0.95, 0.79], ['Stirred tank'], ['Foam collapses in the chamber'], ['tn1']),
    route('P3', 3, 'High stabiliser', [['sles', 22, 25], ['polymer-stabiliser', 4, 5], ['deg', 4, 6], ['biocide', 0.1, 0.2], ['water', 64, 70]], [['foam-expansion', 10, 'pass'], ['half-life', 12, 'pass'], ['biodegradability', 55, 'fail']], [0.72, 0.7, 0.88, 0.76], ['Stirred tank'], ['Polymer slows biodegradation'], ['tn2']),
  ],
  balanceMaterial: 'water', leverMaterial: 'polymer-stabiliser',
  clusters: ['Foam stability (half-life)', 'FER and FIR by soil type', 'Biodegradability and spoil disposal', 'Clay stickiness'],
  query: '("soil conditioning" OR "foaming agent") AND (EPB OR TBM) AND ("half-life" OR stability) AND biodegradab*',
  sources: [
    src('tn1', 'Paper', 'Foam half-life and EPB face support in mixed ground', 2020, 0.86, 'Half-life above 6 min kept chamber pressure stable.', 'Foam stability (half-life)'),
    src('tn2', 'Paper', 'Biodegradability of TBM spoil treated with polymer-stabilised foams', 2022, 0.8, 'Polymer content above 4 % dropped 28-day degradation below 60 %.', 'Biodegradability and spoil disposal'),
  ],
  measured: ['foam-expansion', 'half-life', 'biodegradability'],
  mixingProtocol: ['Charge water; start stirrer at 200 rpm.', 'Add SLES slowly (avoid foaming), then glycol.', 'Pre-dissolve polymer; add with biocide; stir 30 min.'],
  testPlan: [
    { test: 'Foam expansion and half-life', method: 'EFNARC 2005 annex', specimens: 3, ages: '—', dueInDays: 2 },
    { test: 'Ready biodegradability', method: 'OECD 301', specimens: 1, ages: '28 d', dueInDays: 32 },
  ],
};

/* ---------- Construction adhesives and foams ---------- */

export const CA_PUFOAM: Scenario = {
  id: 'ca-pufoam', label: '1K PU gap-filling foam', chip: 'PU gap-filling foam',
  example: 'Expanding PU foam in an aerosol can for fixing door and window frames',
  keywords: ['pu foam', 'polyurethane foam', 'expanding foam', 'gap filling foam', 'gap-filling foam', 'spray foam', 'foam filler', 'aerosol foam', 'door frame foam'],
  projectName: '1K PU gap-filling foam — Doors and windows', codePrefix: 'HX-PF',
  docType: 'Technical Data Sheet', productGuess: 'One-component moisture-curing polyurethane foam (aerosol)',
  categoryId: 'constr-adhesives', subcategoryId: 'ca-pufoam', chemistry: ['polyurethane'], form: 'liquid',
  standard: 'EN 17333', standardAlt: 'ASTM D1622',
  useCase: { substrate: 'Block masonry', substrate2: 'Wood', jointWidthMm: 25, movementPct: 10, uvExposure: 'None', paintable: 'Yes', exposure: 'interior', climate: 'Hot-humid', appTemp: [5, 35], method: 'Aerosol can', standardClass: 'EN 17333' },
  useCaseConfidence: { substrate: 0.84, substrate2: 0.8, jointWidthMm: 0.7, movementPct: 0.6, uvExposure: 0.8, paintable: 0.7, exposure: 0.9, climate: 0.68, appTemp: 0.78, method: 0.95, standardClass: 0.76 },
  guided: [
    { id: 'gap', q: 'What gap are you filling?', picture: 'Sticker', answer: 0, options: [
      { label: 'Around door and window frames', icon: 'PanelTop', sets: { substrate2: 'Wood', jointWidthMm: 20 } },
      { label: 'Holes around pipes and cables', icon: 'Cylinder', sets: { substrate2: 'Metal', jointWidthMm: 40 } },
      { label: 'Gaps in walls', icon: 'BrickWall', sets: { substrate2: 'Block masonry', jointWidthMm: 30 } },
    ] },
    COMMON_GUIDED[1],
  ],
  benchmarks: [bench('bm-pf6', 'Benchmark P-F6', 'ca-pufoam', 'EN 17333', 350, [['foam-density', 22, 'kg/m³', 'TDS'], ['drying-time', 0.75, 'h', 'TDS'], ['shrinkage', 4, 'mm/m', 'Lab-tested'], ['thermal-conductivity', 0.036, 'W/m·K', 'TDS']])],
  targets: [
    { propertyId: 'foam-density', operator: '<=', value: 25, priority: 'must', reason: 'Yield per can', bench: 22, confidence: 0.86 },
    { propertyId: 'shrinkage', operator: '<=', value: 5, priority: 'must', reason: 'Dimensional stability — frames don\'t pull', bench: 4, confidence: 0.84 },
    { propertyId: 'drying-time', operator: '<=', value: 1, priority: 'important', reason: 'Cut time', bench: 0.75, confidence: 0.82 },
    { propertyId: 'thermal-conductivity', operator: '<=', value: 0.04, priority: 'nice', bench: 0.036, confidence: 0.78 },
  ],
  top3: [{ id: 'foam-density', reason: 'Low density = more litres per can' }, { id: 'shrinkage', reason: 'Frames twist if foam shrinks' }, { id: 'cost', reason: 'Retail price per can' }],
  constraints: { costCeiling: 210, budgetBand: 'mid', materialLimits: [], compliance: ['CFC-free propellant'], site: { tMin: 5, tMax: 35, rhMax: 95 }, mustHaves: ['Works upside down'], remark: '750 mL aerosol cans.' },
  summary: {
    scientist: '**Helix is formulating:** a **1-component moisture-curing PU foam** to **EN 17333** for **door and window frames**, with **density ≤ 25 kg/m³**, **shrinkage ≤ 5 mm/m** and **cut time ≤ 1 h**, at **≤ ₹ 210 / kg**.',
    plain: '**Helix is making:** a **spray foam in a can** that **fills gaps around door and window frames** and hardens within an hour.',
  },
  pathways: [
    route('P1', 1, 'Polyol + pMDI + TCPP, DME / LPG', [['pu-polyol', 25, 30], ['mdi-iso', 40, 45], ['propellant', 15, 18], ['tcpp', 8, 10], ['foam-surfactant', 1, 1.5], ['foam-catalyst', 0.3, 0.5]], [['foam-density', 22, 'pass'], ['shrinkage', 4, 'pass'], ['drying-time', 0.8, 'pass']], [0.9, 0.8, 0.88, 0.86], ['Aerosol filling line'], ['Isocyanate; flammable propellant'], ['pf61']),
    route('P2', 2, 'Low surfactant', [['pu-polyol', 25, 30], ['mdi-iso', 40, 45], ['propellant', 15, 18], ['tcpp', 8, 10], ['foam-surfactant', 0.4, 0.6], ['foam-catalyst', 0.3, 0.5]], [['foam-density', 28, 'fail'], ['shrinkage', 7, 'fail'], ['drying-time', 0.8, 'pass']], [0.5, 0.88, 0.88, 0.75], ['Aerosol filling line'], ['Coarse cells, shrinks'], ['pf61']),
    route('P3', 3, 'More propellant', [['pu-polyol', 23, 27], ['mdi-iso', 38, 42], ['propellant', 20, 24], ['tcpp', 8, 10], ['foam-surfactant', 1, 1.5], ['foam-catalyst', 0.3, 0.5]], [['foam-density', 18, 'pass'], ['shrinkage', 6, 'fail'], ['drying-time', 0.9, 'pass']], [0.7, 0.85, 0.88, 0.8], ['Aerosol filling line'], ['Post-expansion pushes frames'], ['pf61']),
  ],
  balanceMaterial: 'propellant', leverMaterial: 'foam-surfactant',
  clusters: ['Cell structure and surfactant', 'Dimensional stability', 'Propellant and yield', 'Fire class'],
  query: '("one-component foam" OR "PU foam" aerosol) AND ("dimensional stability" OR shrinkage) AND (density OR yield)',
  sources: [src('pf61', 'Paper', 'Silicone surfactants and dimensional stability of 1K PU foams', 2020, 0.84, '1.2 % surfactant gave fine closed cells and < 5 mm/m shrinkage.', 'Cell structure and surfactant')],
  measured: ['foam-density', 'shrinkage', 'drying-time', 'thermal-conductivity'],
  mixingProtocol: ['Blend polyol, TCPP, surfactant and catalyst (dry).', 'Fill cans with the blend and pMDI; crimp valve.', 'Gas with propellant; shake and condition 24 h at 23 °C.'],
  testPlan: [
    { test: 'Foam density and yield', method: 'EN 17333-1', specimens: 3, ages: '24 h', dueInDays: 2 },
    { test: 'Dimensional stability', method: 'EN 17333-2', specimens: 3, ages: '7 d', dueInDays: 9 },
    { test: 'Cut time', method: 'EN 17333-3', specimens: 3, ages: '—', dueInDays: 1 },
  ],
};

export const CA_MS = variant(SL_MS, {
  id: 'ca-ms', label: 'MS polymer construction adhesive', chip: 'MS polymer adhesive',
  example: 'MS polymer construction adhesive for bonding skirting and panels to walls',
  keywords: ['ms polymer adhesive', 'ms adhesive', 'construction adhesive', 'panel adhesive', 'skirting adhesive', 'mounting adhesive', 'grab adhesive', 'hybrid adhesive', 'no nails'],
  projectName: 'MS polymer construction adhesive — Panels and trims', codePrefix: 'HX-CA',
  productGuess: 'High-grab silyl-terminated polyether construction adhesive', categoryId: 'constr-adhesives', subcategoryId: 'ca-ms',
  standard: 'ISO 4587 (lap shear)', standardAlt: 'EN 15651-1',
  useCase: { substrate: 'Concrete', substrate2: 'Wood', jointWidthMm: 3, movementPct: 10, uvExposure: 'None', paintable: 'Yes', exposure: 'interior', climate: 'Hot-humid', appTemp: [5, 40], method: 'Cartridge gun', standardClass: 'ISO 4587' },
  benchmarks: [bench('bm-ca', 'Benchmark C-A', 'ca-ms', 'ISO 4587', 420, [['shear-adh', 2.5, 'N/mm²', 'TDS'], ['sag', 1, 'mm', 'TDS'], ['drying-time', 0.25, 'h', 'TDS'], ['voc', 20, 'g/L', 'TDS']])],
  targets: [
    { propertyId: 'shear-adh', operator: '>=', value: 2, priority: 'must', reason: 'Lap shear, wood–concrete, 7 d', bench: 2.5, confidence: 0.86 },
    { propertyId: 'sag', operator: '<=', value: 2, priority: 'must', reason: 'High grab — panels stay put without clamps', bench: 1, confidence: 0.84 },
    { propertyId: 'drying-time', operator: '<=', value: 0.5, priority: 'important', reason: 'Skin time', bench: 0.25, confidence: 0.8 },
    { propertyId: 'voc', operator: '<=', value: 50, priority: 'nice', bench: 20, confidence: 0.84 },
  ],
  top3: [{ id: 'shear-adh', reason: 'Replaces nails and screws' }, { id: 'sag', reason: 'Initial grab sells it' }, { id: 'cost', reason: 'Retail price per cartridge' }],
  constraints: { costCeiling: 230, budgetBand: 'premium', materialLimits: [], compliance: ['Isocyanate-free', 'Solvent-free'], site: { tMin: 5, tMax: 40, rhMax: 95 }, mustHaves: ['Bonds damp surfaces'], remark: '290 mL cartridges.' },
  summary: {
    scientist: '**Helix is formulating:** a **high-grab MS polymer construction adhesive** for **panels, skirting and trims**, with **lap shear ≥ 2 N/mm²**, **sag ≤ 2 mm** and **skin time ≤ 30 min**, at **≤ ₹ 230 / kg**.',
    plain: '**Helix is making:** a **strong glue in a cartridge** that **sticks panels and skirting to walls** without nails.',
  },
  pathways: [
    route('P1', 1, 'MS polymer, high thixotropy', [['ms-polymer', 32, 36], ['plasticiser-dinp', 8, 10], ['caco3', 45, 50], ['fumed-silica', 3, 4], ['moisture-scavenger', 1.5, 2], ['adhesion-promoter', 0.8, 1.2], ['pu-catalyst', 0.3, 0.5]], [['shear-adh', 2.4, 'pass'], ['sag', 1, 'pass'], ['drying-time', 0.3, 'pass']], [0.9, 0.78, 0.75, 0.82], ['Planetary vacuum mixer'], ['Releases methanol on cure'], ['ca1']),
    route('P2', 2, 'Sealant-like, low grab', [['ms-polymer', 28, 30], ['plasticiser-dinp', 15, 18], ['caco3', 48, 52], ['fumed-silica', 1, 1.5], ['moisture-scavenger', 1.5, 2], ['adhesion-promoter', 0.8, 1.2], ['pu-catalyst', 0.3, 0.5]], [['shear-adh', 1.6, 'fail'], ['sag', 4, 'fail'], ['drying-time', 0.5, 'pass']], [0.45, 0.88, 0.75, 0.68], ['Planetary vacuum mixer'], ['Panels slide'], ['ca1']),
    route('P3', 3, 'High MS, extra silane', [['ms-polymer', 36, 40], ['plasticiser-dinp', 6, 8], ['caco3', 45, 48], ['fumed-silica', 3, 4], ['moisture-scavenger', 1.5, 2], ['adhesion-promoter', 1.5, 2], ['pu-catalyst', 0.3, 0.5]], [['shear-adh', 2.9, 'pass'], ['sag', 1, 'pass'], ['drying-time', 0.25, 'pass']], [0.94, 0.6, 0.75, 0.78], ['Planetary vacuum mixer'], ['Over cost ceiling risk'], ['ca1']),
  ],
  balanceMaterial: 'caco3', leverMaterial: 'ms-polymer',
  clusters: ['Grab and thixotropy', 'Lap-shear strength', 'Adhesion to damp substrates', 'Skin time'],
  query: '("construction adhesive" OR "MS polymer adhesive") AND ("initial grab" OR "lap shear") AND (silane OR thixotropy)',
  sources: [src('ca1', 'Paper', 'Formulating high-grab silyl-terminated polyether adhesives', 2021, 0.84, '3.5 % fumed silica and 34 % STPE gave 2.4 N/mm² lap shear with no sag.', 'Grab and thixotropy')],
  measured: ['shear-adh', 'sag', 'drying-time', 'voc'],
  testPlan: [
    { test: 'Lap shear (wood–concrete)', method: 'ISO 4587 (adapted)', specimens: 5, ages: '7 d', dueInDays: 9 },
    { test: 'Sag / initial grab', method: 'ISO 7390', specimens: 2, ages: 'fresh', dueInDays: 1 },
  ],
});

/** Checked early: firestop before intumescent ("intumescent sealant"), the MS adhesive before the MS sealant. */
export const SPECIALTY_EARLY_ROUTE_ORDER: Scenario[] = [FP_FIRESTOP, FP_INT, TN_FOAM, CA_MS];
/** Checked after group 3, so "PU foam injection" stays the leak-injection run. */
export const SPECIALTY_LATE_ROUTE_ORDER: Scenario[] = [CA_PUFOAM];

export const SPECIALTY_SCENARIOS: Scenario[] = [FP_INT, FP_FIRESTOP, TN_FOAM, CA_PUFOAM, CA_MS];
