import type { Scenario } from './types';
import { COMMON_GUIDED } from './guided';
import { bench, midCost, pw, src, variant } from './build';
import { CRYSTALLINE } from './alternates';

/** Group 3 — Waterproofing and sealing. One full scenario per category, a variant per sibling subcategory. Demo data — for R&D to confirm. */

type Comp = [string, number, number][];
const route = (id: string, rank: number, name: string, comp: Comp, predicted: Parameters<typeof pw>[4], s: Parameters<typeof pw>[5], equipment: string[], hazards: string[], citations: string[]) =>
  pw(id, rank, name, comp, predicted, s, midCost(comp), equipment, hazards, citations);

const DISSOLVER = ['High-speed dissolver'];
const PLANETARY = ['Planetary vacuum mixer'];

/* ---------- Waterproofing coatings: PU (full), acrylic and bituminous (variants), cementitious (variant of crystalline) ---------- */

export const WPC_PU: Scenario = {
  id: 'wpc-pu', label: 'Polyurethane liquid waterproofing membrane', chip: 'PU liquid membrane',
  example: 'Polyurethane liquid-applied waterproofing for an exposed flat roof terrace',
  keywords: ['polyurethane waterproof', 'pu waterproof', 'pu membrane', 'pu coating', 'polyurethane coating', 'liquid membrane', 'liquid-applied membrane', 'liquid applied membrane', 'roof terrace'],
  projectName: 'PU liquid membrane — Exposed roof terraces', codePrefix: 'HX-PU',
  docType: 'Technical Data Sheet', productGuess: '1-component moisture-curing polyurethane waterproofing membrane',
  categoryId: 'wp-coatings', subcategoryId: 'wpc-pu', chemistry: ['polyurethane'], form: 'liquid',
  standard: 'EN 1504-2 / ETAG 005', standardAlt: 'ASTM C836',
  useCase: { substrate: 'Concrete', surfaces: ['Floor'], waterExposure: 'Rain / splash', crackMovementMm: 2, thicknessMm: 1.5, coats: 2, uvExposure: 'Full sun', potableContact: 'No', exposure: 'exterior', climate: 'Hot-humid', appTemp: [5, 40], load: 'Light foot', method: 'Brush/roller', timeToTrafficH: 24, standardClass: 'EN 1504-2' },
  useCaseConfidence: { substrate: 0.92, surfaces: 0.9, waterExposure: 0.86, crackMovementMm: 0.7, thicknessMm: 0.74, coats: 0.8, uvExposure: 0.9, potableContact: 0.8, exposure: 0.95, climate: 0.72, appTemp: 0.78, load: 0.82, method: 0.86, timeToTrafficH: 0.66, standardClass: 0.82 },
  guided: [
    { id: 'roof', q: 'Will the coating be open to the sun?', picture: 'Sun', answer: 0, options: [
      { label: 'Yes — open roof', icon: 'Sun', sets: { uvExposure: 'Full sun', surfaces: ['Floor'] } },
      { label: 'No — tiles go on top', icon: 'LayoutGrid', sets: { uvExposure: 'None', surfaces: ['Floor'] } },
      { label: 'Balcony or podium', icon: 'Building', sets: { uvExposure: 'Partial', surfaces: ['Floor'] } },
    ] },
    COMMON_GUIDED[1],
    COMMON_GUIDED[2],
  ],
  benchmarks: [bench('bm-pu', 'Benchmark P-U', 'wpc-pu', 'EN 1504-2', 280, [['elongation', 450, '%', 'TDS'], ['crack-bridging', 2.5, 'mm', 'TDS'], ['pull-off', 1.8, 'N/mm²', 'TDS'], ['uv', 2000, 'h', 'Lab-tested'], ['voc', 300, 'g/L', 'TDS']])],
  targets: [
    { propertyId: 'elongation', operator: '>=', value: 400, priority: 'must', bench: 450, confidence: 0.88 },
    { propertyId: 'crack-bridging', operator: '>=', value: 2, priority: 'must', std: 'A4 > 1.25 mm (EN 1062-7)', stdMin: 1.25, bench: 2.5, confidence: 0.84 },
    { propertyId: 'pull-off', operator: '>=', value: 1.5, priority: 'important', std: '≥ 0.8 (EN 1504-2)', stdMin: 0.8, bench: 1.8, confidence: 0.84 },
    { propertyId: 'uv', operator: '>=', value: 1500, priority: 'important', reason: 'QUV hours without chalking or cracks', bench: 2000, confidence: 0.76 },
    { propertyId: 'voc', operator: '<=', value: 350, priority: 'nice', bench: 300, confidence: 0.8 },
  ],
  top3: [{ id: 'crack-bridging', reason: 'Roof slabs crack with heat cycles' }, { id: 'uv', reason: 'Exposed — no tiles on top' }, { id: 'cost', reason: 'Benchmark at ₹ 280/kg' }],
  constraints: { costCeiling: 180, budgetBand: 'premium', materialLimits: [], compliance: ['No coal tar'], site: { tMin: 5, tMax: 40, rhMax: 85 }, mustHaves: ['Walkable after 24 h'], remark: '20 kg pails, 1.5 kg/m² in two coats.' },
  summary: {
    scientist: '**Helix is formulating:** a **1-component moisture-curing PU membrane** to **EN 1504-2** for **exposed roof terraces**, with **elongation ≥ 400 %**, **crack bridging ≥ 2 mm** and **1500 h UV**, at **≤ ₹ 180 / kg**.',
    plain: '**Helix is making:** a **rubbery coating rolled onto a flat roof** that **stretches over cracks** and **survives the sun** without tiles on top.',
  },
  pathways: [
    route('P1', 1, 'MDI prepolymer, DINP, TiO₂', [['pu-prepolymer', 40, 45], ['plasticiser-dinp', 15, 18], ['caco3', 25, 30], ['tio2', 3, 5], ['solvent', 5, 8], ['moisture-scavenger', 1, 1.5], ['pu-catalyst', 0.1, 0.2]], [['elongation', 460, 'pass'], ['crack-bridging', 2.4, 'pass'], ['uv', 1700, 'pass']], [0.9, 0.78, 0.88, 0.85], PLANETARY, ['Isocyanate — respirator when spraying'], ['pu1', 'pu2']),
    route('P2', 2, 'High-filler economy', [['pu-prepolymer', 32, 36], ['plasticiser-dinp', 15, 18], ['caco3', 35, 40], ['tio2', 3, 4], ['solvent', 5, 7], ['moisture-scavenger', 1, 1.5], ['pu-catalyst', 0.1, 0.2]], [['elongation', 340, 'fail'], ['crack-bridging', 1.6, 'borderline'], ['uv', 1500, 'pass']], [0.62, 0.92, 0.88, 0.78], PLANETARY, ['Brittle in cold'], ['pu1']),
    route('P3', 3, 'Solvent-free', [['pu-prepolymer', 45, 48], ['plasticiser-dinp', 18, 22], ['caco3', 25, 30], ['tio2', 3, 5], ['moisture-scavenger', 1.5, 2], ['pu-catalyst', 0.1, 0.2]], [['elongation', 480, 'pass'], ['crack-bridging', 2.6, 'pass'], ['voc', 40, 'pass']], [0.94, 0.62, 0.85, 0.8], PLANETARY, ['Thick — needs warm weather'], ['pu2']),
  ],
  balanceMaterial: 'caco3', leverMaterial: 'pu-prepolymer',
  clusters: ['Prepolymer NCO content', 'Plasticiser and elongation', 'UV and aliphatic topcoats', 'Moisture cure and blistering'],
  query: '("polyurethane waterproofing" OR "liquid-applied membrane") AND roof AND (elongation OR "crack bridging") AND UV',
  sources: [
    src('pu1', 'Paper', 'NCO content and mechanical properties of 1K PU roof membranes', 2021, 0.88, '3.5 % NCO prepolymer at 42 % gave 450 % elongation.', 'Prepolymer NCO content'),
    src('pu2', 'Paper', 'Weathering of aromatic PU waterproofing on exposed roofs', 2022, 0.81, 'TiO₂ and HALS kept chalk rating ≤ 2 after 1500 h QUV.', 'UV and aliphatic topcoats'),
  ],
  measured: ['elongation', 'crack-bridging', 'pull-off', 'uv'],
  mixingProtocol: ['Dry the filler and TiO₂ (< 0.05 % moisture).', 'Charge prepolymer, plasticiser and scavenger under nitrogen; add fillers under vacuum.', 'Add catalyst last; mix 15 min; pack in sealed pails.'],
  testPlan: [
    { test: 'Elongation at break', method: 'ISO 527-3', specimens: 5, ages: '7 d', dueInDays: 9 },
    { test: 'Crack bridging', method: 'EN 1062-7', specimens: 3, ages: '14 d', dueInDays: 16 },
    { test: 'QUV weathering', method: 'ASTM G154', specimens: 2, ages: '1500 h', dueInDays: 70 },
  ],
};

export const WPC_ACR = variant(WPC_PU, {
  id: 'wpc-acr', label: 'Elastomeric acrylic roof coating', chip: 'Acrylic roof coating',
  example: 'White elastomeric acrylic cool-roof waterproofing coating for a terrace',
  keywords: ['acrylic waterproof', 'elastomeric', 'cool roof', 'cool-roof', 'heat reflective', 'roof coating', 'terrace coating'],
  projectName: 'Elastomeric acrylic cool-roof coating', codePrefix: 'HX-AR',
  productGuess: 'Water-based elastomeric acrylic waterproof roof coating', subcategoryId: 'wpc-acr', chemistry: ['acrylic'],
  standard: 'ASTM D6083', standardAlt: 'EN 1504-2',
  useCase: { substrate: 'Concrete', surfaces: ['Floor'], waterExposure: 'Rain / splash', crackMovementMm: 1, thicknessMm: 0.6, coats: 2, uvExposure: 'Full sun', potableContact: 'No', exposure: 'exterior', climate: 'Hot-dry', appTemp: [10, 40], load: 'None', method: 'Brush/roller', timeToTrafficH: 24, standardClass: 'ASTM D6083' },
  benchmarks: [bench('bm-ar', 'Benchmark A-R', 'wpc-acr', 'ASTM D6083', 160, [['elongation', 250, '%', 'TDS'], ['reflectance', 85, '%', 'TDS'], ['crack-bridging', 1.2, 'mm', 'Lab-tested'], ['pull-off', 1.2, 'N/mm²', 'TDS']])],
  targets: [
    { propertyId: 'elongation', operator: '>=', value: 200, priority: 'must', std: '≥ 100 % (ASTM D6083)', stdMin: 100, bench: 250, confidence: 0.88 },
    { propertyId: 'crack-bridging', operator: '>=', value: 1, priority: 'must', bench: 1.2, confidence: 0.82 },
    { propertyId: 'reflectance', operator: '>=', value: 80, priority: 'important', reason: 'Cool roof — lower top-floor temperature', bench: 85, confidence: 0.84 },
    { propertyId: 'pull-off', operator: '>=', value: 1, priority: 'important', bench: 1.2, confidence: 0.82 },
  ],
  top3: [{ id: 'reflectance', reason: 'Sold on cooler rooms' }, { id: 'crack-bridging', reason: 'Roof slab cracks' }, { id: 'cost', reason: 'Benchmark at ₹ 160/kg' }],
  constraints: { costCeiling: 110, budgetBand: 'mid', materialLimits: [], compliance: ['Water-based', 'Low VOC'], site: { tMin: 10, tMax: 40, rhMax: 80 }, mustHaves: ['Rain-safe in 4 h'], remark: '20 L pails, 1.2 L/m² in two coats.' },
  summary: {
    scientist: '**Helix is formulating:** a **water-based elastomeric acrylic coating** to **ASTM D6083** for **exposed roofs in hot-dry climates**, with **elongation ≥ 200 %** and **solar reflectance ≥ 80 %**, at **≤ ₹ 110 / kg**.',
    plain: '**Helix is making:** a **white rubbery roof paint** that **keeps rain out** and **reflects the sun** so rooms below stay cooler.',
  },
  pathways: [
    route('P1', 1, 'Elastomeric acrylic + TiO₂', [['elasto-acrylic', 45, 50], ['caco3', 25, 30], ['tio2-disp', 8, 10], ['hec', 0.3, 0.5], ['coalescent', 0.8, 1.2], ['biocide', 0.1, 0.2], ['liq-defoamer', 0.2, 0.3], ['water', 10, 14]], [['elongation', 240, 'pass'], ['crack-bridging', 1.1, 'pass'], ['reflectance', 84, 'pass']], [0.9, 0.8, 0.9, 0.86], DISSOLVER, ['Freezes below 0 °C'], ['ar1', 'ar2']),
    route('P2', 2, 'Lean binder, high filler', [['elasto-acrylic', 35, 40], ['caco3', 35, 40], ['tio2-disp', 6, 8], ['hec', 0.4, 0.5], ['coalescent', 0.8, 1], ['biocide', 0.1, 0.2], ['water', 12, 16]], [['elongation', 150, 'fail'], ['crack-bridging', 0.8, 'fail'], ['reflectance', 80, 'pass']], [0.55, 0.95, 0.9, 0.75], DISSOLVER, ['Cracks in first summer'], ['ar1']),
    route('P3', 3, 'High-TiO₂ reflective', [['elasto-acrylic', 45, 50], ['caco3', 20, 25], ['tio2-disp', 10, 12], ['hec', 0.3, 0.5], ['coalescent', 0.8, 1.2], ['biocide', 0.1, 0.2], ['water', 12, 16]], [['elongation', 230, 'pass'], ['crack-bridging', 1.1, 'pass'], ['reflectance', 88, 'pass']], [0.92, 0.7, 0.85, 0.82], DISSOLVER, ['Higher TiO₂ cost'], ['ar2']),
  ],
  balanceMaterial: 'caco3', leverMaterial: 'elasto-acrylic',
  clusters: ['Binder Tg and elongation', 'Solar reflectance', 'Dirt pick-up', 'Wet adhesion'],
  query: '("elastomeric roof coating" OR "cool roof") AND acrylic AND (reflectance OR elongation) AND waterproofing',
  sources: [
    src('ar1', 'Paper', 'Binder content and low-temperature elongation of acrylic roof coatings', 2020, 0.85, '45–50 % elastomeric emulsion kept elongation above 200 % after ageing.', 'Binder Tg and elongation'),
    src('ar2', 'Paper', 'Cool-roof coatings and top-floor temperature in Indian cities', 2023, 0.82, '85 % reflectance cut roof surface temperature 15–20 °C.', 'Solar reflectance'),
  ],
  measured: ['elongation', 'crack-bridging', 'reflectance', 'pull-off'],
  mixingProtocol: ['Charge water, dispersant, HEC and biocide; disperse 10 min.', 'Add calcite and TiO₂ dispersion at high speed.', 'Let down with elastomeric emulsion and coalescent; adjust viscosity.'],
  testPlan: [
    { test: 'Elongation at break', method: 'ASTM D2370', specimens: 5, ages: '14 d', dueInDays: 16 },
    { test: 'Solar reflectance', method: 'ASTM C1549', specimens: 2, ages: '7 d', dueInDays: 9 },
    { test: 'Crack bridging', method: 'EN 1062-7', specimens: 3, ages: '14 d', dueInDays: 16 },
  ],
});

export const WPC_BIT = variant(WPC_PU, {
  id: 'wpc-bit', label: 'Bitumen-emulsion foundation coating', chip: 'Bituminous coating',
  example: 'Bituminous damp-proof coating for foundation walls below ground',
  keywords: ['bituminous coating', 'bitumen coating', 'bitumen emulsion', 'bituminous', 'damp-proof', 'damp proof', 'foundation coating', 'below ground'],
  projectName: 'Polymer-bitumen emulsion — Foundation walls', codePrefix: 'HX-BC',
  productGuess: 'SBR-modified bitumen emulsion thick coating', subcategoryId: 'wpc-bit', chemistry: ['bituminous'],
  standard: 'EN 15814 CB2', standardAlt: 'IS 1580',
  useCase: { substrate: 'Concrete', surfaces: ['Wall'], waterExposure: 'Positive side (pressure from front)', crackMovementMm: 2, thicknessMm: 3, coats: 2, uvExposure: 'None', potableContact: 'No', exposure: 'exterior', climate: 'Hot-humid', appTemp: [5, 35], load: 'None', method: 'Brush/roller', timeToTrafficH: 72, standardClass: 'EN 15814 CB2' },
  benchmarks: [bench('bm-bc', 'Benchmark B-C', 'wpc-bit', 'EN 15814 CB2', 90, [['crack-bridging', 2.5, 'mm', 'TDS'], ['solids', 62, '%', 'TDS'], ['service-temp', 80, '°C', 'TDS'], ['drying-time', 24, 'h', 'TDS']])],
  targets: [
    { propertyId: 'crack-bridging', operator: '>=', value: 2, priority: 'must', std: 'CB2 ≥ 2 mm (EN 15814)', stdMin: 2, bench: 2.5, confidence: 0.86 },
    { propertyId: 'solids', operator: 'between', value: [58, 66], priority: 'important', bench: 62, confidence: 0.84 },
    { propertyId: 'service-temp', operator: '>=', value: 70, priority: 'important', reason: 'Heat resistance — no flow on a vertical wall', bench: 80, confidence: 0.78 },
    { propertyId: 'drying-time', operator: '<=', value: 24, priority: 'nice', reason: 'Backfill after 3 days', bench: 24, confidence: 0.74 },
  ],
  top3: [{ id: 'crack-bridging', reason: 'Foundations settle and crack' }, { id: 'cost', reason: 'Large areas, low price point' }, { id: 'service-temp', reason: 'Sags in summer before backfill' }],
  constraints: { costCeiling: 65, budgetBand: 'economy', materialLimits: [], compliance: ['Water-based', 'No coal tar'], site: { tMin: 5, tMax: 35, rhMax: 95 }, mustHaves: ['Solvent-free'], remark: '20 kg pails, 4 kg/m² wet.' },
  summary: {
    scientist: '**Helix is formulating:** an **SBR-modified bitumen emulsion thick coating** to **EN 15814 CB2** for **foundation walls below ground**, with **crack bridging ≥ 2 mm** and **no flow at 70 °C**, at **≤ ₹ 65 / kg**.',
    plain: '**Helix is making:** a **thick black coating for basement walls outside** that **keeps ground water out** even if the wall cracks.',
  },
  pathways: [
    route('P1', 1, 'Bitumen emulsion + SBR + fibre', [['bitumen-emul', 75, 80], ['sbr-latex', 8, 10], ['caco3', 8, 12], ['cell-fibre', 0.5, 1], ['water', 2, 5]], [['crack-bridging', 2.4, 'pass'], ['solids', 62, 'pass'], ['service-temp', 78, 'pass']], [0.9, 0.84, 0.9, 0.88], ['Low-shear mixer'], ['Stains skin and clothes'], ['bc1']),
    route('P2', 2, 'Unmodified emulsion', [['bitumen-emul', 85, 90], ['caco3', 8, 12], ['water', 2, 5]], [['crack-bridging', 1.4, 'fail'], ['solids', 60, 'pass'], ['service-temp', 65, 'fail']], [0.5, 0.95, 0.95, 0.73], ['Low-shear mixer'], ['Brittle when cold'], ['bc1']),
    route('P3', 3, 'High polymer, low filler', [['bitumen-emul', 72, 76], ['sbr-latex', 14, 16], ['caco3', 6, 8], ['cell-fibre', 0.5, 1], ['water', 2, 4]], [['crack-bridging', 3, 'pass'], ['solids', 61, 'pass'], ['service-temp', 82, 'pass']], [0.94, 0.7, 0.9, 0.83], ['Low-shear mixer'], ['Higher latex cost'], ['bc2']),
  ],
  balanceMaterial: 'caco3', leverMaterial: 'sbr-latex',
  clusters: ['Polymer modification of bitumen', 'Crack bridging', 'Heat resistance', 'Drying and backfill'],
  query: '("polymer-modified bitumen" OR "bitumen emulsion") AND ("thick coating" OR "EN 15814") AND ("crack bridging" OR "heat resistance")',
  sources: [
    src('bc1', 'Paper', 'SBR modification of bitumen emulsion thick coatings', 2019, 0.84, '9 % SBR raised crack bridging from 1.4 to 2.4 mm.', 'Polymer modification of bitumen'),
    src('bc2', 'Paper', 'Heat resistance of polymer-bitumen coatings on vertical walls', 2021, 0.76, 'Above 14 % latex no flow was seen at 80 °C.', 'Heat resistance'),
  ],
  measured: ['crack-bridging', 'solids', 'service-temp', 'drying-time'],
  mixingProtocol: ['Charge bitumen emulsion; low-shear stir.', 'Add SBR latex slowly, then calcite and fibre.', 'Adjust with water; check solids and viscosity.'],
  testPlan: [
    { test: 'Crack bridging', method: 'EN 15812', specimens: 3, ages: '14 d', dueInDays: 16 },
    { test: 'Heat resistance', method: 'EN 15818', specimens: 2, ages: '14 d', dueInDays: 16 },
    { test: 'Solids', method: 'ISO 3251', specimens: 2, ages: '—', dueInDays: 1 },
  ],
});

export const WPC_CEM = variant(CRYSTALLINE, {
  id: 'wpc-cem', label: 'Flexible cementitious waterproofing', chip: 'Cementitious waterproofing · 2K',
  example: 'Two-component flexible cementitious waterproofing under bathroom tiles',
  keywords: ['cementitious waterproof', 'flexible cementitious', 'two-component waterproof', '2k waterproof', 'bathroom waterproof', 'wet room waterproof', 'under tile waterproof', 'under-tile waterproof'],
  projectName: 'Flexible cementitious waterproofing — Wet rooms', codePrefix: 'HX-CW',
  productGuess: '2-component polymer-modified flexible cementitious membrane', subcategoryId: 'wpc-cem', chemistry: ['cementitious', 'polymer-modified'], form: '2-component',
  standard: 'EN 14891 CM O1P', standardAlt: 'EN 1504-2',
  useCase: { substrate: 'Cement screed', surfaces: ['Floor', 'Wall', 'Wet area'], waterExposure: 'Wet room', crackMovementMm: 0.75, thicknessMm: 2, coats: 2, uvExposure: 'None', potableContact: 'No', exposure: 'interior', climate: 'Hot-humid', appTemp: [5, 35], load: 'Light foot', method: 'Brush/roller', timeToTrafficH: 24, standardClass: 'EN 14891 CM O1P' },
  useCaseConfidence: { substrate: 0.86, surfaces: 0.92, waterExposure: 0.9, crackMovementMm: 0.74, thicknessMm: 0.78, coats: 0.84, uvExposure: 0.9, potableContact: 0.8, exposure: 0.92, climate: 0.68, appTemp: 0.76, load: 0.8, method: 0.86, timeToTrafficH: 0.7, standardClass: 0.88 },
  guided: [COMMON_GUIDED[0], COMMON_GUIDED[1]],
  benchmarks: [bench('bm-cw', 'Benchmark C-W', 'wpc-cem', 'EN 14891 CM O1P', 75, [['crack-bridging', 0.9, 'mm', 'TDS'], ['pull-off', 0.8, 'N/mm²', 'TDS'], ['elongation', 40, '%', 'Lab-tested'], ['pot-life', 1.5, 'h', 'TDS']])],
  targets: [
    { propertyId: 'crack-bridging', operator: '>=', value: 0.75, priority: 'must', std: '≥ 0.75 mm at 23 °C (EN 14891)', stdMin: 0.75, bench: 0.9, confidence: 0.88 },
    { propertyId: 'pull-off', operator: '>=', value: 0.5, priority: 'must', std: '≥ 0.5 (EN 14891, initial)', stdMin: 0.5, bench: 0.8, confidence: 0.86 },
    { propertyId: 'elongation', operator: '>=', value: 30, priority: 'important', bench: 40, confidence: 0.8 },
    { propertyId: 'pot-life', operator: '>=', value: 1, priority: 'nice', bench: 1.5, confidence: 0.78 },
  ],
  top3: [{ id: 'crack-bridging', reason: 'Screeds crack under tiles' }, { id: 'pull-off', reason: 'Tiles stick to the membrane, not the screed' }, { id: 'cost', reason: 'Benchmark at ₹ 75/kg' }],
  constraints: { costCeiling: 55, budgetBand: 'mid', materialLimits: [], compliance: ['Water-based'], site: { tMin: 5, tMax: 35, rhMax: 95 }, mustHaves: ['Tileable after 24 h'], remark: '20 kg powder + 10 kg liquid kit.' },
  summary: {
    scientist: '**Helix is formulating:** a **2-component flexible cementitious membrane** to **EN 14891 CM O1P** for **bathrooms and wet rooms under tiles**, with **crack bridging ≥ 0.75 mm** and **≥ 0.5 N/mm² bond**, at **≤ ₹ 55 / kg**.',
    plain: '**Helix is making:** a **brush-on grey coating under bathroom tiles** that **keeps water out of the floor** even if it cracks a little.',
  },
  pathways: [
    route('P1', 1, 'OPC + elastomeric acrylic (2K)', [['opc53', 22, 25], ['sand', 30, 35], ['caco3', 8, 10], ['elasto-acrylic', 28, 32], ['defoamer', 0.1, 0.2], ['mhec', 0.1, 0.15], ['water', 2, 4]], [['crack-bridging', 0.85, 'pass'], ['pull-off', 0.75, 'pass'], ['elongation', 38, 'pass']], [0.9, 0.8, 0.9, 0.86], ['Ploughshare mixer (A)', 'Low-shear mixer (B)'], ['Alkaline — gloves'], ['cw1']),
    route('P2', 2, 'Low-polymer 2K', [['opc53', 25, 28], ['sand', 35, 40], ['caco3', 8, 10], ['elasto-acrylic', 20, 22], ['defoamer', 0.1, 0.2], ['mhec', 0.1, 0.15], ['water', 2, 4]], [['crack-bridging', 0.55, 'fail'], ['pull-off', 0.8, 'pass'], ['elongation', 20, 'fail']], [0.55, 0.92, 0.9, 0.74], ['Ploughshare mixer (A)', 'Low-shear mixer (B)'], ['Cracks at screed joints'], ['cw1']),
    route('P3', 3, '1K with acrylic powder', [['opc53', 30, 33], ['sand', 40, 45], ['caco3', 10, 12], ['acrylic-rdp', 12, 14], ['defoamer', 0.1, 0.2], ['mhec', 0.15, 0.2]], [['crack-bridging', 0.78, 'pass'], ['pull-off', 0.7, 'pass'], ['elongation', 32, 'pass']], [0.82, 0.7, 0.85, 0.79], ['Ploughshare mixer'], ['Single bag — easier on site'], ['cw2']),
  ],
  balanceMaterial: 'sand', leverMaterial: 'elasto-acrylic',
  clusters: ['Polymer-to-cement ratio', 'Crack bridging at low temperature', 'Tile bond on membrane', '1K vs 2K'],
  query: '("flexible cementitious" OR "polymer-modified cementitious membrane") AND ("crack bridging" OR "EN 14891") AND (bathroom OR "wet room")',
  sources: [
    src('cw1', 'Paper', 'Polymer-to-cement ratio and crack bridging of 2K cementitious membranes', 2021, 0.88, 'P/C above 0.5 gave > 0.75 mm crack bridging at 23 °C.', 'Polymer-to-cement ratio'),
    src('cw2', 'Paper', 'One-component flexible membranes with acrylic powders', 2022, 0.78, '12 % acrylic powder matched 2K crack bridging at higher cost.', '1K vs 2K'),
  ],
  measured: ['crack-bridging', 'pull-off', 'elongation', 'pot-life'],
  mixingProtocol: ['Blend component A (cement, sand, filler, MHEC, defoamer).', 'Fill component B (elastomeric acrylic + water).', 'On site: add A to B under a paddle; mix 3 min; rest 2 min.'],
  testPlan: [
    { test: 'Crack bridging at 23 °C', method: 'EN 14891 A.8.2', specimens: 3, ages: '28 d', dueInDays: 30 },
    { test: 'Initial tensile adhesion', method: 'EN 14891 A.6.2', specimens: 5, ages: '28 d', dueInDays: 30 },
    { test: 'Elongation', method: 'ISO 527-3', specimens: 5, ages: '28 d', dueInDays: 30 },
  ],
});

/* ---------- Membranes ---------- */

export const MB_APP: Scenario = {
  id: 'mb-app', label: 'APP modified bitumen membrane', chip: 'APP membrane',
  example: 'Torch-applied APP modified bitumen membrane, 4 mm, for a podium deck',
  keywords: ['app membrane', 'app modified', 'app bitumen', 'torch-applied', 'torch applied', 'torch on', 'modified bitumen', 'bitumen membrane', 'bituminous membrane', 'roofing felt'],
  projectName: 'APP bitumen membrane 4 mm — Roofs and podiums', codePrefix: 'HX-AM',
  docType: 'Technical Data Sheet', productGuess: 'Polyester-reinforced APP modified bitumen sheet, 4 mm',
  categoryId: 'membranes', subcategoryId: 'mb-app', chemistry: ['bituminous'], form: 'sheet',
  standard: 'EN 13707', standardAlt: 'ASTM D6222',
  useCase: { substrate: 'Concrete', surfaces: ['Floor'], waterExposure: 'Rain / splash', crackMovementMm: 1, thicknessMm: 4, coats: 1, uvExposure: 'Partial', potableContact: 'No', exposure: 'exterior', climate: 'Hot-humid', appTemp: [5, 45], load: 'Light foot', method: 'Torch-applied', timeToTrafficH: 2, standardClass: 'EN 13707' },
  useCaseConfidence: { substrate: 0.92, surfaces: 0.9, waterExposure: 0.84, crackMovementMm: 0.62, thicknessMm: 0.92, coats: 0.8, uvExposure: 0.76, potableContact: 0.8, exposure: 0.94, climate: 0.72, appTemp: 0.8, load: 0.78, method: 0.94, timeToTrafficH: 0.6, standardClass: 0.86 },
  guided: [
    { id: 'top', q: 'What goes on top of the membrane?', picture: 'Layers', answer: 0, options: [
      { label: 'Screed or tiles', icon: 'LayoutGrid', sets: { uvExposure: 'None' } },
      { label: 'Nothing — open to sun', icon: 'Sun', sets: { uvExposure: 'Full sun' } },
      { label: 'Gravel or soil (green roof)', icon: 'Mountain', sets: { uvExposure: 'None' } },
    ] },
    COMMON_GUIDED[1],
  ],
  benchmarks: [bench('bm-am', 'Benchmark M-A', 'mb-app', 'EN 13707', 110, [['tensile-strength', 750, 'N/50 mm', 'TDS'], ['elongation', 45, '%', 'TDS'], ['cold-flex', -5, '°C', 'TDS'], ['service-temp', 130, '°C', 'TDS']])],
  targets: [
    { propertyId: 'tensile-strength', operator: '>=', value: 700, priority: 'must', reason: 'Longitudinal, polyester 180 g/m²', bench: 750, confidence: 0.86 },
    { propertyId: 'cold-flex', operator: '<=', value: -5, priority: 'must', reason: 'Winter in north India', bench: -5, confidence: 0.84 },
    { propertyId: 'service-temp', operator: '>=', value: 120, priority: 'important', std: 'Flow resistance (EN 1110)', bench: 130, confidence: 0.82 },
    { propertyId: 'elongation', operator: '>=', value: 40, priority: 'important', bench: 45, confidence: 0.8 },
  ],
  top3: [{ id: 'service-temp', reason: 'Roofs hit 70 °C — no flow' }, { id: 'cold-flex', reason: 'Cracks if rolled out cold' }, { id: 'cost', reason: 'Sold per roll — ₹/m² decides' }],
  constraints: { costCeiling: 80, budgetBand: 'mid', materialLimits: [], compliance: ['No coal tar'], site: { tMin: 5, tMax: 45, rhMax: 95 }, mustHaves: ['Torch-on, 10 m × 1 m roll'], remark: '4 mm, 10 m² rolls.' },
  summary: {
    scientist: '**Helix is formulating:** a **polyester-reinforced APP modified bitumen membrane (4 mm)** to **EN 13707 / ASTM D6222** for **roofs and podium decks**, with **≥ 700 N/50 mm tensile**, **cold flex ≤ −5 °C** and **flow resistance ≥ 120 °C**, at **≤ ₹ 80 / kg**.',
    plain: '**Helix is making:** a **thick black waterproof sheet** melted onto roofs with a torch, that **stays soft in winter and doesn\'t melt in summer**.',
  },
  pathways: [
    route('P1', 1, '22 % APP, polyester 180', [['bitumen', 62, 66], ['app-polymer', 20, 24], ['caco3', 8, 10], ['polyester-mat', 4, 5]], [['tensile-strength', 760, 'pass'], ['cold-flex', -6, 'pass'], ['service-temp', 128, 'pass']], [0.9, 0.82, 0.9, 0.87], ['Heated mixing kettle', 'Impregnation and calender line'], ['Hot bitumen 180 °C — burns'], ['am1']),
    route('P2', 2, 'Low APP, high filler', [['bitumen', 64, 68], ['app-polymer', 14, 16], ['caco3', 14, 18], ['polyester-mat', 4, 5]], [['tensile-strength', 740, 'pass'], ['cold-flex', 0, 'fail'], ['service-temp', 115, 'fail']], [0.55, 0.95, 0.9, 0.75], ['Heated mixing kettle', 'Impregnation and calender line'], ['Cracks in winter'], ['am1']),
    route('P3', 3, '26 % APP premium', [['bitumen', 60, 63], ['app-polymer', 25, 28], ['caco3', 6, 8], ['polyester-mat', 4, 5]], [['tensile-strength', 770, 'pass'], ['cold-flex', -10, 'pass'], ['service-temp', 140, 'pass']], [0.95, 0.65, 0.9, 0.82], ['Heated mixing kettle', 'Impregnation and calender line'], ['Higher polymer cost'], ['am2']),
  ],
  balanceMaterial: 'bitumen', leverMaterial: 'app-polymer',
  clusters: ['APP content and phase inversion', 'Cold flexibility', 'Flow resistance', 'Reinforcement'],
  query: '("APP modified bitumen" OR "atactic polypropylene") AND membrane AND ("cold flexibility" OR "flow resistance") AND polyester',
  sources: [
    src('am1', 'Paper', 'APP content and low-temperature flexibility of bitumen membranes', 2019, 0.86, '20–24 % APP gave −5 to −8 °C cold flexibility.', 'Cold flexibility'),
    src('am2', 'Paper', 'Phase inversion in APP-modified bitumen', 2021, 0.8, 'Above 25 % APP the polymer phase becomes continuous; flow resistance > 140 °C.', 'APP content and phase inversion'),
  ],
  measured: ['tensile-strength', 'cold-flex', 'service-temp', 'elongation'],
  mixingProtocol: ['Heat bitumen to 180 °C in the kettle.', 'Add APP over 30 min under high shear; then filler.', 'Impregnate polyester mat, calender to 4 mm, apply sand / PE film, cool and wind.'],
  testPlan: [
    { test: 'Tensile strength and elongation', method: 'EN 12311-1', specimens: 5, ages: '—', dueInDays: 3 },
    { test: 'Cold flexibility', method: 'EN 1109', specimens: 5, ages: '—', dueInDays: 3 },
    { test: 'Flow resistance', method: 'EN 1110', specimens: 3, ages: '—', dueInDays: 3 },
  ],
};

export const MB_HDPE = variant(MB_APP, {
  id: 'mb-hdpe', label: 'Pre-applied HDPE membrane', chip: 'HDPE pre-applied membrane',
  example: 'Pre-applied HDPE sheet membrane for a blind-side basement raft and walls',
  keywords: ['hdpe', 'pre-applied', 'preapplied', 'blind-side', 'blindside', 'blind side', 'fully bonded membrane'],
  projectName: 'Pre-applied HDPE membrane — Basement rafts', codePrefix: 'HX-HD',
  productGuess: 'HDPE sheet with pressure-sensitive adhesive, fully bonded to post-cast concrete', subcategoryId: 'mb-hdpe', chemistry: ['polymer-modified'],
  standard: 'EN 13967', standardAlt: 'ASTM D4541 (bond)',
  useCase: { substrate: 'Concrete', surfaces: ['Floor', 'Wall'], waterExposure: 'Positive side (pressure from front)', crackMovementMm: 3, thicknessMm: 1.2, coats: 1, uvExposure: 'Partial', potableContact: 'No', exposure: 'exterior', climate: 'Hot-humid', appTemp: [5, 45], load: 'None', method: 'Sheet laying', timeToTrafficH: 0, standardClass: 'EN 13967' },
  guided: [
    { id: 'where', q: 'Is the membrane laid before the concrete is poured?', picture: 'Layers', answer: 0, options: [
      { label: 'Yes — under the raft', icon: 'Square', sets: { surfaces: ['Floor'] } },
      { label: 'Yes — against shoring walls', icon: 'BrickWall', sets: { surfaces: ['Wall'] } },
      { label: 'Both', icon: 'Box', sets: { surfaces: ['Floor', 'Wall'] } },
    ] },
    COMMON_GUIDED[1],
  ],
  benchmarks: [bench('bm-hd', 'Benchmark H-D', 'mb-hdpe', 'EN 13967', 240, [['tensile-strength', 900, 'N/50 mm', 'TDS'], ['pull-off', 0.5, 'N/mm²', 'TDS'], ['elongation', 400, '%', 'TDS'], ['uv', 1000, 'h', 'TDS']])],
  targets: [
    { propertyId: 'tensile-strength', operator: '>=', value: 800, priority: 'must', bench: 900, confidence: 0.86 },
    { propertyId: 'pull-off', operator: '>=', value: 0.4, priority: 'must', reason: 'Bond to post-cast concrete — no water tracking behind', bench: 0.5, confidence: 0.82 },
    { propertyId: 'elongation', operator: '>=', value: 300, priority: 'important', bench: 400, confidence: 0.82 },
    { propertyId: 'uv', operator: '>=', value: 1000, priority: 'nice', reason: 'Exposed on site for up to 6 weeks before casting', bench: 1000, confidence: 0.74 },
  ],
  top3: [{ id: 'pull-off', reason: 'Bond stops lateral water tracking' }, { id: 'tensile-strength', reason: 'Rebar and foot traffic on site' }, { id: 'cost', reason: 'Benchmark at ₹ 240/kg' }],
  constraints: { costCeiling: 170, budgetBand: 'premium', materialLimits: [], compliance: [], site: { tMin: 5, tMax: 45, rhMax: 95 }, mustHaves: ['No primer needed'], remark: '1.2 mm, 1 m × 20 m rolls.' },
  summary: {
    scientist: '**Helix is formulating:** a **pre-applied HDPE membrane with PSA layer** to **EN 13967** for **blind-side basement rafts and walls**, with **≥ 800 N/50 mm tensile** and **≥ 0.4 N/mm² bond to post-cast concrete**, at **≤ ₹ 170 / kg**.',
    plain: '**Helix is making:** a **plastic sheet laid before the concrete is poured** that **grips the new concrete** so water can\'t creep behind it.',
  },
  pathways: [
    route('P1', 1, 'HDPE + PSA + sand finish', [['hdpe', 70, 75], ['psa-adhesive', 18, 22], ['sand', 4, 6], ['uv-stabiliser', 0.3, 0.5]], [['tensile-strength', 880, 'pass'], ['pull-off', 0.48, 'pass'], ['elongation', 380, 'pass']], [0.9, 0.78, 0.85, 0.84], ['Sheet extruder', 'Adhesive coater'], ['Hot-melt PSA — burns'], ['hd1']),
    route('P2', 2, 'Thin PSA', [['hdpe', 78, 82], ['psa-adhesive', 12, 14], ['sand', 4, 6], ['uv-stabiliser', 0.3, 0.5]], [['tensile-strength', 900, 'pass'], ['pull-off', 0.32, 'fail'], ['elongation', 400, 'pass']], [0.6, 0.9, 0.85, 0.77], ['Sheet extruder', 'Adhesive coater'], ['Water tracking risk'], ['hd1']),
    route('P3', 3, 'Thick PSA, no sand', [['hdpe', 68, 72], ['psa-adhesive', 26, 30], ['uv-stabiliser', 0.4, 0.6]], [['tensile-strength', 860, 'pass'], ['pull-off', 0.55, 'pass'], ['elongation', 370, 'pass']], [0.88, 0.6, 0.85, 0.77], ['Sheet extruder', 'Adhesive coater'], ['Sticky — hard to walk on'], ['hd2']),
  ],
  balanceMaterial: 'hdpe', leverMaterial: 'psa-adhesive',
  clusters: ['Bond to fresh concrete', 'Lateral water migration', 'Site exposure', 'Sheet mechanics'],
  query: '("pre-applied membrane" OR "fully bonded HDPE") AND (basement OR "blind side") AND (bond OR "lateral water migration")',
  sources: [
    src('hd1', 'Paper', 'Bond of pre-applied HDPE membranes to post-cast concrete', 2022, 0.86, 'PSA layers ≥ 18 % mass gave 0.45–0.5 N/mm² bond.', 'Bond to fresh concrete'),
    src('hd2', 'Paper', 'Lateral water migration under bonded and loose membranes', 2020, 0.8, 'Fully bonded systems confined leaks to the defect location.', 'Lateral water migration'),
  ],
  measured: ['tensile-strength', 'pull-off', 'elongation'],
  mixingProtocol: ['Extrude HDPE with UV masterbatch to 0.8 mm.', 'Coat PSA layer at 0.3 mm; apply sand protective finish.', 'Laminate release liner on laps; wind and cut.'],
  testPlan: [
    { test: 'Tensile strength and elongation', method: 'EN 12311-2', specimens: 5, ages: '—', dueInDays: 3 },
    { test: 'Bond to post-cast concrete', method: 'ASTM D4541 (adapted)', specimens: 5, ages: '7 d', dueInDays: 10 },
  ],
});

/* ---------- Joint sealants ---------- */

export const SL_PU: Scenario = {
  id: 'sl-pu', label: 'Polyurethane joint sealant', chip: 'PU joint sealant',
  example: 'Low-modulus polyurethane sealant for facade expansion joints',
  keywords: ['joint sealant', 'sealant', 'expansion joint', 'pu sealant', 'polyurethane sealant', 'facade joint', 'movement joint'],
  projectName: 'PU sealant 25LM — Facade and expansion joints', codePrefix: 'HX-SP',
  docType: 'Technical Data Sheet', productGuess: '1-component low-modulus polyurethane sealant',
  categoryId: 'sealants', subcategoryId: 'sl-pu', chemistry: ['polyurethane'], form: 'paste',
  standard: 'ISO 11600 F 25LM', standardAlt: 'ASTM C920 Class 25',
  useCase: { substrate: 'Concrete', substrate2: 'Concrete', jointWidthMm: 20, movementPct: 25, uvExposure: 'Full sun', paintable: 'Yes', exposure: 'exterior', climate: 'Hot-humid', appTemp: [5, 40], method: 'Cartridge gun', standardClass: 'ISO 11600 F 25LM' },
  useCaseConfidence: { substrate: 0.88, substrate2: 0.8, jointWidthMm: 0.78, movementPct: 0.84, uvExposure: 0.86, paintable: 0.66, exposure: 0.94, climate: 0.7, appTemp: 0.78, method: 0.92, standardClass: 0.86 },
  guided: [
    { id: 'joint', q: 'Which joints are you sealing?', picture: 'Pipette', answer: 0, options: [
      { label: 'Gaps between facade panels', icon: 'Building', sets: { substrate2: 'Concrete', jointWidthMm: 20, movementPct: 25, uvExposure: 'Full sun' } },
      { label: 'Floor expansion joints', icon: 'Square', sets: { substrate2: 'Concrete', jointWidthMm: 15, movementPct: 25, uvExposure: 'None' } },
      { label: 'Around windows', icon: 'PanelTop', sets: { substrate2: 'Metal', jointWidthMm: 10, movementPct: 20, uvExposure: 'Partial' } },
    ] },
    COMMON_GUIDED[1],
  ],
  benchmarks: [bench('bm-sp', 'Benchmark S-P', 'sl-pu', 'ISO 11600 F 25LM', 320, [['movement-capability', 25, '%', 'TDS'], ['secant-modulus', 0.35, 'N/mm²', 'TDS'], ['elongation', 600, '%', 'TDS'], ['sag', 2, 'mm', 'TDS']])],
  targets: [
    { propertyId: 'movement-capability', operator: '>=', value: 25, priority: 'must', std: 'Class 25 (ISO 11600)', stdMin: 25, bench: 25, confidence: 0.9 },
    { propertyId: 'secant-modulus', operator: '<=', value: 0.4, priority: 'must', std: 'LM ≤ 0.4 at 23 °C (ISO 11600)', stdMax: 0.4, bench: 0.35, confidence: 0.86 },
    { propertyId: 'elongation', operator: '>=', value: 500, priority: 'important', bench: 600, confidence: 0.82 },
    { propertyId: 'sag', operator: '<=', value: 3, priority: 'important', std: '≤ 3 mm (ISO 7390)', stdMax: 3, bench: 2, confidence: 0.84 },
  ],
  top3: [{ id: 'secant-modulus', reason: 'Stiff sealants tear the joint edge' }, { id: 'movement-capability', reason: 'Facade panels move ±25 %' }, { id: 'cost', reason: 'Benchmark at ₹ 320/kg' }],
  constraints: { costCeiling: 185, budgetBand: 'premium', materialLimits: [], compliance: ['Phthalate-free'], site: { tMin: 5, tMax: 40, rhMax: 95 }, mustHaves: ['Gun-grade in 40 °C heat'], remark: '600 mL sausages.' },
  summary: {
    scientist: '**Helix is formulating:** a **1-component low-modulus PU sealant** to **ISO 11600 F 25LM** for **facade and expansion joints**, with **±25 % movement**, **secant modulus ≤ 0.4 N/mm²** and **sag ≤ 3 mm**, at **≤ ₹ 185 / kg**.',
    plain: '**Helix is making:** a **soft rubbery filler for gaps between building panels** that **stretches as the building moves** without tearing.',
  },
  pathways: [
    route('P1', 1, 'MDI prepolymer, DINP, fumed silica', [['pu-prepolymer', 35, 40], ['plasticiser-dinp', 18, 22], ['caco3', 30, 35], ['fumed-silica', 2, 3], ['moisture-scavenger', 1, 1.5], ['adhesion-promoter', 0.5, 0.8], ['pu-catalyst', 0.1, 0.2], ['tio2', 1, 2]], [['movement-capability', 25, 'pass'], ['secant-modulus', 0.36, 'pass'], ['sag', 2, 'pass']], [0.9, 0.8, 0.9, 0.86], PLANETARY, ['Isocyanate — gloves'], ['sp1', 'sp2']),
    route('P2', 2, 'High filler, low prepolymer', [['pu-prepolymer', 28, 32], ['plasticiser-dinp', 18, 22], ['caco3', 40, 45], ['fumed-silica', 1.5, 2], ['moisture-scavenger', 1, 1.5], ['adhesion-promoter', 0.5, 0.8], ['pu-catalyst', 0.1, 0.2]], [['movement-capability', 20, 'fail'], ['secant-modulus', 0.5, 'fail'], ['sag', 1, 'pass']], [0.5, 0.95, 0.9, 0.73], PLANETARY, ['Stiff — tears joint edges'], ['sp1']),
    route('P3', 3, 'Extra plasticiser, soft', [['pu-prepolymer', 35, 38], ['plasticiser-dinp', 24, 28], ['caco3', 28, 32], ['fumed-silica', 2.5, 3], ['moisture-scavenger', 1, 1.5], ['adhesion-promoter', 0.5, 0.8], ['pu-catalyst', 0.1, 0.2]], [['movement-capability', 25, 'pass'], ['secant-modulus', 0.28, 'pass'], ['sag', 3.5, 'borderline']], [0.84, 0.82, 0.9, 0.84], PLANETARY, ['Plasticiser migration staining'], ['sp2']),
  ],
  balanceMaterial: 'caco3', leverMaterial: 'pu-prepolymer',
  clusters: ['Prepolymer and modulus', 'Plasticiser and migration', 'Thixotropy and sag', 'Adhesion to concrete'],
  query: '("polyurethane sealant" OR "PU sealant") AND ("low modulus" OR "ISO 11600") AND (facade OR "expansion joint") AND (sag OR adhesion)',
  sources: [
    src('sp1', 'Paper', 'Prepolymer content and secant modulus of 1K PU sealants', 2020, 0.87, '35–40 % prepolymer kept secant modulus at 0.3–0.4 N/mm².', 'Prepolymer and modulus'),
    src('sp2', 'Paper', 'Fumed silica and sag of gun-grade sealants in hot climates', 2022, 0.8, '2.5 % fumed silica held sag below 3 mm at 50 °C.', 'Thixotropy and sag'),
  ],
  measured: ['movement-capability', 'secant-modulus', 'elongation', 'sag'],
  mixingProtocol: ['Dry calcite and TiO₂ below 0.05 % moisture.', 'Charge prepolymer, plasticiser and scavenger; add fillers and fumed silica under vacuum.', 'Add silane and catalyst; mix 10 min under vacuum; fill sausages.'],
  testPlan: [
    { test: 'Movement capability (cycling)', method: 'ISO 9047', specimens: 3, ages: '28 d', dueInDays: 35 },
    { test: 'Secant modulus at 100 %', method: 'ISO 8339', specimens: 3, ages: '28 d', dueInDays: 30 },
    { test: 'Sag', method: 'ISO 7390', specimens: 2, ages: 'fresh', dueInDays: 1 },
  ],
};

export const SL_MS = variant(SL_PU, {
  id: 'sl-ms', label: 'MS polymer hybrid sealant', chip: 'MS polymer sealant',
  example: 'Paintable MS polymer hybrid sealant, isocyanate-free, for window perimeters',
  keywords: ['ms polymer', 'ms sealant', 'ms-polymer', 'hybrid sealant', 'silyl', 'isocyanate-free', 'paintable sealant'],
  projectName: 'MS polymer sealant — Window perimeters', codePrefix: 'HX-MS',
  productGuess: 'Isocyanate-free silyl-terminated polyether (MS) sealant', subcategoryId: 'sl-ms', chemistry: ['polymer-modified'],
  standard: 'EN 15651-1 F-EXT-INT 25LM', standardAlt: 'ASTM C920 Class 25',
  useCase: { substrate: 'Concrete', substrate2: 'Metal', jointWidthMm: 10, movementPct: 25, uvExposure: 'Partial', paintable: 'Yes', exposure: 'exterior', climate: 'Hot-humid', appTemp: [5, 40], method: 'Cartridge gun', standardClass: 'EN 15651-1 F-EXT-INT 25LM' },
  benchmarks: [bench('bm-ms', 'Benchmark M-S', 'sl-ms', 'EN 15651-1 25LM', 380, [['movement-capability', 25, '%', 'TDS'], ['secant-modulus', 0.38, 'N/mm²', 'TDS'], ['voc', 20, 'g/L', 'TDS'], ['drying-time', 0.5, 'h', 'TDS']])],
  targets: [
    { propertyId: 'movement-capability', operator: '>=', value: 25, priority: 'must', std: 'Class 25 (EN 15651-1)', stdMin: 25, bench: 25, confidence: 0.88 },
    { propertyId: 'secant-modulus', operator: '<=', value: 0.4, priority: 'must', std: 'LM ≤ 0.4', stdMax: 0.4, bench: 0.38, confidence: 0.86 },
    { propertyId: 'voc', operator: '<=', value: 50, priority: 'important', reason: 'Isocyanate- and solvent-free claim', bench: 20, confidence: 0.84 },
    { propertyId: 'drying-time', operator: '<=', value: 1, priority: 'nice', reason: 'Skin time — paint the same day', bench: 0.5, confidence: 0.78 },
  ],
  top3: [{ id: 'voc', reason: 'Sold as safe indoors — no isocyanate' }, { id: 'secant-modulus', reason: 'Window frames move with heat' }, { id: 'cost', reason: 'MS polymer is the priciest part' }],
  constraints: { costCeiling: 190, budgetBand: 'premium', materialLimits: [], compliance: ['Isocyanate-free', 'Phthalate-free'], site: { tMin: 5, tMax: 40, rhMax: 95 }, mustHaves: ['Paintable with acrylic paint'], remark: '290 mL cartridges.' },
  summary: {
    scientist: '**Helix is formulating:** an **isocyanate-free MS polymer sealant** to **EN 15651-1 25LM** for **window perimeters**, with **±25 % movement**, **secant modulus ≤ 0.4 N/mm²** and **VOC ≤ 50 g/L**, at **≤ ₹ 190 / kg**.',
    plain: '**Helix is making:** a **paintable, low-smell sealant** for **gaps around windows** that stays flexible for years.',
  },
  pathways: [
    route('P1', 1, 'MS polymer + PCC + silane', [['ms-polymer', 25, 30], ['plasticiser-dinp', 15, 18], ['caco3', 45, 50], ['fumed-silica', 1, 2], ['moisture-scavenger', 1, 1.5], ['adhesion-promoter', 0.5, 1], ['pu-catalyst', 0.2, 0.4], ['tio2', 1, 2]], [['movement-capability', 25, 'pass'], ['secant-modulus', 0.37, 'pass'], ['voc', 18, 'pass']], [0.9, 0.78, 0.75, 0.82], PLANETARY, ['Releases methanol on cure'], ['ms1']),
    route('P2', 2, 'Lean MS', [['ms-polymer', 18, 22], ['plasticiser-dinp', 18, 22], ['caco3', 50, 55], ['fumed-silica', 1, 2], ['moisture-scavenger', 1, 1.5], ['adhesion-promoter', 0.5, 1], ['pu-catalyst', 0.2, 0.4]], [['movement-capability', 20, 'fail'], ['secant-modulus', 0.45, 'fail'], ['voc', 15, 'pass']], [0.52, 0.92, 0.75, 0.72], PLANETARY, ['Cohesive tears'], ['ms1']),
    route('P3', 3, 'MS + soft plasticiser', [['ms-polymer', 27, 30], ['plasticiser-dinp', 20, 24], ['caco3', 40, 45], ['fumed-silica', 1.5, 2], ['moisture-scavenger', 1, 1.5], ['adhesion-promoter', 0.5, 1], ['pu-catalyst', 0.2, 0.4]], [['movement-capability', 25, 'pass'], ['secant-modulus', 0.3, 'pass'], ['voc', 20, 'pass']], [0.88, 0.75, 0.75, 0.8], PLANETARY, ['Paint may crack over soft sealant'], ['ms2']),
  ],
  balanceMaterial: 'caco3', leverMaterial: 'ms-polymer',
  clusters: ['Silane cure chemistry', 'Paintability', 'Modulus and plasticiser', 'Adhesion without primer'],
  query: '("MS polymer" OR "silyl-terminated polyether" OR "hybrid sealant") AND (modulus OR paintable) AND (window OR facade)',
  sources: [
    src('ms1', 'Paper', 'Formulating low-modulus silyl-terminated polyether sealants', 2021, 0.86, '25–30 % STPE with 45–50 % PCC met 25LM.', 'Modulus and plasticiser'),
    src('ms2', 'Paper', 'Paint compatibility of hybrid sealants', 2020, 0.74, 'Acrylic paints cracked over sealants with modulus below 0.3 N/mm².', 'Paintability'),
  ],
  measured: ['movement-capability', 'secant-modulus', 'voc', 'drying-time'],
});

/* ---------- Injection systems for leaks ---------- */

export const INJ_PU: Scenario = {
  id: 'inj-pu', label: 'PU foam leak-injection resin', chip: 'PU foam injection',
  example: 'Hydrophobic PU foam injection to stop an active leak through a basement wall crack',
  keywords: ['pu injection', 'pu foam injection', 'polyurethane injection', 'foam injection', 'leak injection', 'active leak', 'stop the leak', 'water stop injection', 'injection'],
  projectName: 'Hydrophobic PU foam injection — Active leaks', codePrefix: 'HX-IJ',
  docType: 'Technical Data Sheet', productGuess: 'Hydrophobic MDI polyurethane foaming injection resin with accelerator',
  categoryId: 'injection', subcategoryId: 'inj-pu', chemistry: ['polyurethane'], form: '2-component',
  standard: 'EN 1504-5', standardAlt: 'ASTM D1622',
  useCase: { substrate: 'Concrete', element: 'Wall', crackWidthMm: 0.5, leakState: 'Running water', depthMm: 300, exposure: 'exterior', climate: 'Hot-humid', appTemp: [5, 35], method: 'Injection', standardClass: 'EN 1504-5' },
  useCaseConfidence: { substrate: 0.92, element: 0.86, crackWidthMm: 0.7, leakState: 0.88, depthMm: 0.64, exposure: 0.8, climate: 0.68, appTemp: 0.76, method: 0.96, standardClass: 0.82 },
  guided: [
    { id: 'leak', q: 'How bad is the leak?', picture: 'Droplets', answer: 2, options: [
      { label: 'Damp patch', icon: 'Droplets', sets: { leakState: 'Damp' } },
      { label: 'Water seeping', icon: 'CloudRain', sets: { leakState: 'Active seepage' } },
      { label: 'Water running out', icon: 'WavesHorizontal', sets: { leakState: 'Running water' } },
    ] },
    COMMON_GUIDED[1],
  ],
  benchmarks: [bench('bm-ij', 'Benchmark I-J', 'inj-pu', 'EN 1504-5', 650, [['foam-expansion', 25, '×', 'TDS'], ['gel-time', 45, 's', 'TDS'], ['viscosity', 250, 'mPa·s', 'TDS'], ['elongation', 15, '%', 'Lab-tested']])],
  targets: [
    { propertyId: 'foam-expansion', operator: '>=', value: 20, priority: 'must', reason: 'Free foam, fills voids behind the crack', bench: 25, confidence: 0.86 },
    { propertyId: 'gel-time', operator: 'between', value: [20, 90], priority: 'must', reason: 'Reacts before running water washes it out', bench: 45, confidence: 0.84 },
    { propertyId: 'viscosity', operator: '<=', value: 300, priority: 'important', reason: 'Enters 0.3 mm cracks', bench: 250, confidence: 0.84 },
    { propertyId: 'elongation', operator: '>=', value: 10, priority: 'nice', reason: 'Foam stays flexible with crack movement', bench: 15, confidence: 0.72 },
  ],
  top3: [{ id: 'gel-time', reason: 'Too slow and running water washes it away' }, { id: 'foam-expansion', reason: 'Fills the void behind the wall' }, { id: 'cost', reason: 'Applicators price per packer' }],
  constraints: { costCeiling: 400, budgetBand: 'premium', materialLimits: [], compliance: [], site: { tMin: 5, tMax: 35, rhMax: 100 }, mustHaves: ['Works in running water'], remark: '20 kg resin + 2 kg accelerator.' },
  summary: {
    scientist: '**Helix is formulating:** a **hydrophobic MDI PU foaming injection resin** to **EN 1504-5** for **active leaks in basement walls**, with **≥ 20× foam expansion**, **20–90 s reaction** and **≤ 300 mPa·s**, at **≤ ₹ 400 / kg**.',
    plain: '**Helix is making:** a **liquid pumped into a leaking crack** that **foams up within a minute** and **stops the water** even while it\'s running.',
  },
  pathways: [
    route('P1', 1, 'Hydrophobic resin + 5 % accelerator', [['pu-inj-resin', 88, 92], ['foam-catalyst', 4, 6], ['plasticiser-dinp', 3, 5]], [['foam-expansion', 24, 'pass'], ['gel-time', 50, 'pass'], ['viscosity', 240, 'pass']], [0.9, 0.78, 0.88, 0.85], ['Low-shear mixer (dry, N₂)'], ['Isocyanate — full PPE'], ['ij1']),
    route('P2', 2, 'Low accelerator', [['pu-inj-resin', 92, 95], ['foam-catalyst', 1.5, 2], ['plasticiser-dinp', 3, 5]], [['foam-expansion', 26, 'pass'], ['gel-time', 140, 'fail'], ['viscosity', 230, 'pass']], [0.6, 0.85, 0.88, 0.76], ['Low-shear mixer (dry, N₂)'], ['Washes out in running water'], ['ij1']),
    route('P3', 3, 'Plasticised low-viscosity', [['pu-inj-resin', 80, 84], ['foam-catalyst', 4, 6], ['plasticiser-dinp', 10, 14]], [['foam-expansion', 18, 'borderline'], ['gel-time', 55, 'pass'], ['viscosity', 150, 'pass']], [0.78, 0.82, 0.88, 0.82], ['Low-shear mixer (dry, N₂)'], ['Lower expansion'], ['ij2']),
  ],
  balanceMaterial: 'pu-inj-resin', leverMaterial: 'foam-catalyst',
  clusters: ['Reaction time under flow', 'Foam expansion and cell structure', 'Viscosity and crack penetration', 'Hydrophobic vs hydrophilic'],
  query: '("polyurethane injection" OR "PU foam injection") AND (leak OR "running water") AND ("reaction time" OR expansion) AND concrete',
  sources: [
    src('ij1', 'Paper', 'Accelerator dosage and reaction of hydrophobic PU injection foams', 2021, 0.87, '5 % amine accelerator cut reaction to 45–60 s at 20 °C.', 'Reaction time under flow'),
    src('ij2', 'Paper', 'Viscosity and penetration of injection resins in fine cracks', 2019, 0.79, 'Below 200 mPa·s resins filled 0.2 mm cracks at 10 bar.', 'Viscosity and crack penetration'),
  ],
  measured: ['foam-expansion', 'gel-time', 'viscosity'],
  mixingProtocol: ['Keep everything dry; blanket with nitrogen.', 'Charge resin and plasticiser; mix 10 min.', 'Pack accelerator separately; field mix just before injection.'],
  testPlan: [
    { test: 'Free foam expansion', method: 'Internal (cup test)', specimens: 3, ages: '—', dueInDays: 1 },
    { test: 'Reaction time with water', method: 'EN 1504-5 / internal', specimens: 3, ages: '—', dueInDays: 1 },
    { test: 'Viscosity', method: 'EN ISO 3219', specimens: 2, ages: '—', dueInDays: 1 },
  ],
};

export const INJ_ACR = variant(INJ_PU, {
  id: 'inj-acr', label: 'Acrylic gel curtain injection', chip: 'Acrylic gel injection',
  example: 'Acrylic gel curtain injection behind a damp basement wall',
  keywords: ['acrylic gel', 'acrylate gel', 'acrylate injection', 'gel injection', 'curtain injection', 'curtain grouting'],
  projectName: 'Acrylic gel curtain injection — Damp basements', codePrefix: 'HX-AG',
  productGuess: 'Methacrylate gel injection with persulphate / TEA initiator', subcategoryId: 'inj-acr', chemistry: ['acrylic'],
  useCase: { substrate: 'Concrete', element: 'Wall', crackWidthMm: 0.2, leakState: 'Damp', depthMm: 230, exposure: 'exterior', climate: 'Hot-humid', appTemp: [5, 35], method: 'Injection', standardClass: 'EN 1504-5' },
  benchmarks: [bench('bm-ag', 'Benchmark A-G', 'inj-acr', 'EN 1504-5', 180, [['gel-time', 60, 's', 'TDS'], ['viscosity', 5, 'mPa·s', 'TDS'], ['elongation', 150, '%', 'Lab-tested']])],
  targets: [
    { propertyId: 'gel-time', operator: 'between', value: [30, 120], priority: 'must', reason: 'Adjustable on site with initiator dose', bench: 60, confidence: 0.86 },
    { propertyId: 'viscosity', operator: '<=', value: 10, priority: 'must', reason: 'Water-thin — spreads through soil behind the wall', bench: 5, confidence: 0.88 },
    { propertyId: 'elongation', operator: '>=', value: 100, priority: 'important', reason: 'Gel stays elastic when wet–dry cycling', bench: 150, confidence: 0.76 },
  ],
  top3: [{ id: 'viscosity', reason: 'Must reach behind the wall' }, { id: 'gel-time', reason: 'Set before it drains away' }, { id: 'cost', reason: 'Used by the tonne on large walls' }],
  constraints: { costCeiling: 110, budgetBand: 'mid', materialLimits: [], compliance: ['Non-toxic to ground water'], site: { tMin: 5, tMax: 35, rhMax: 100 }, mustHaves: ['Adjustable gel time'], remark: 'A: monomer, B: initiator, C: activator.' },
  summary: {
    scientist: '**Helix is formulating:** a **methacrylate gel curtain injection** to **EN 1504-5** for **damp basement walls**, with **≤ 10 mPa·s**, **30–120 s gel time** and **≥ 100 % gel elongation**, at **≤ ₹ 110 / kg**.',
    plain: '**Helix is making:** a **water-thin liquid injected through a wall** that **turns into a rubbery gel behind it** and blocks damp from the soil.',
  },
  pathways: [
    route('P1', 1, '33 % monomer, persulphate / TEA', [['acrylate-monomer', 30, 35], ['persulphate', 1, 1.5], ['tea', 1, 1.5], ['water', 62, 67]], [['gel-time', 60, 'pass'], ['viscosity', 4, 'pass'], ['elongation', 140, 'pass']], [0.9, 0.8, 0.88, 0.86], ['Stainless mixing tank'], ['Sensitiser — gloves and goggles'], ['ag1']),
    route('P2', 2, 'Dilute monomer', [['acrylate-monomer', 20, 24], ['persulphate', 1, 1.5], ['tea', 1, 1.5], ['water', 73, 78]], [['gel-time', 110, 'pass'], ['viscosity', 3, 'pass'], ['elongation', 70, 'fail']], [0.6, 0.95, 0.88, 0.78], ['Stainless mixing tank'], ['Weak gel shrinks when dry'], ['ag1']),
    route('P3', 3, 'Monomer + polymer modifier', [['acrylate-monomer', 30, 33], ['elasto-acrylic', 5, 7], ['persulphate', 1, 1.5], ['tea', 1, 1.5], ['water', 57, 63]], [['gel-time', 55, 'pass'], ['viscosity', 9, 'pass'], ['elongation', 200, 'pass']], [0.9, 0.7, 0.85, 0.8], ['Stainless mixing tank'], ['Near viscosity limit'], ['ag2']),
  ],
  balanceMaterial: 'water', leverMaterial: 'acrylate-monomer',
  clusters: ['Monomer concentration and gel strength', 'Initiator and gel time', 'Wet–dry durability', 'Ground water safety'],
  query: '("acrylic gel" OR acrylate) AND ("curtain injection" OR "injection grout") AND ("gel time" OR swelling OR durability)',
  sources: [
    src('ag1', 'Paper', 'Methacrylate injection gels: concentration and wet–dry cycling', 2020, 0.84, 'Below 25 % monomer gels shrank and cracked after 10 dry cycles.', 'Wet–dry durability'),
    src('ag2', 'Paper', 'Polymer-modified acrylate gels for curtain injection', 2022, 0.76, '6 % latex doubled gel elongation.', 'Monomer concentration and gel strength'),
  ],
  measured: ['gel-time', 'viscosity', 'elongation'],
  mixingProtocol: ['A: dilute monomer in water.', 'B: dissolve persulphate in water; C: TEA activator.', 'On site: mix A+C, then B in the 2-line pump; adjust gel time with B dose.'],
  testPlan: [
    { test: 'Gel time at 20 °C', method: 'EN 1504-5 / internal', specimens: 3, ages: '—', dueInDays: 1 },
    { test: 'Viscosity', method: 'EN ISO 3219', specimens: 2, ages: '—', dueInDays: 1 },
    { test: 'Gel elongation after wet–dry cycles', method: 'Internal', specimens: 3, ages: '14 d', dueInDays: 16 },
  ],
});

/** Routing order: each variant before the scenario whose keywords it overlaps (MS before PU sealant, acrylic gel before PU injection…). */
export const WATERPROOFING_ROUTE_ORDER: Scenario[] = [WPC_CEM, WPC_ACR, MB_APP, MB_HDPE, WPC_BIT, WPC_PU, SL_MS, SL_PU, INJ_ACR, INJ_PU];

export const WATERPROOFING_SCENARIOS: Scenario[] = [WPC_CEM, WPC_ACR, WPC_PU, WPC_BIT, MB_APP, MB_HDPE, SL_PU, SL_MS, INJ_PU, INJ_ACR];
