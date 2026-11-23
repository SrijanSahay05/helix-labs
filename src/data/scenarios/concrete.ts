import type { Scenario } from './types';
import { COMMON_GUIDED } from './guided';
import { bench, midCost, pw, src, variant } from './build';
import { PCE } from './alternates';

/** Group 1 — Concrete and cement. One full scenario per category, a variant per sibling subcategory. Demo data — for R&D to confirm. */

type Comp = [string, number, number][];
const route = (id: string, rank: number, name: string, comp: Comp, predicted: Parameters<typeof pw>[4], s: Parameters<typeof pw>[5], equipment: string[], hazards: string[], citations: string[]) =>
  pw(id, rank, name, comp, predicted, s, midCost(comp), equipment, hazards, citations);

const LIQUID_TANK = ['Stirred tank'];
const liquidMix = (actives: string) => ['Charge water; start stirrer at 300 rpm.', `Add ${actives} slowly over 5 min.`, 'Add defoamer and biocide; stir 20 min; check solids, pH and density.'];

/* ---------- Admixtures: variants of the PCE scenario ---------- */

export const ADM_PLAST = variant(PCE, {
  id: 'adm-plasticiser', label: 'Normal plasticiser (SNF / lignin)', chip: 'Plasticiser · SNF',
  example: 'Low-cost SNF plasticiser for M25 site-mix concrete',
  keywords: ['plasticiser', 'plasticizer', 'snf', 'naphthalene', 'lignosulphonate', 'lignin', 'water reducer'],
  projectName: 'SNF plasticiser — M20–M25 site concrete', codePrefix: 'HX-PL',
  productGuess: 'SNF / lignosulphonate normal water-reducing plasticiser', subcategoryId: 'adm-plasticiser',
  standard: 'IS 9103 / EN 934-2 T2', standardAlt: 'ASTM C494 Type A',
  useCase: { concreteGrade: 'M20–M25', cementType: 'PPC', wcRatio: 0.5, dosagePct: [0.4, 0.8], slumpRetentionMin: 45, haulTimeMin: 30, climate: 'Composite', appTemp: [15, 40], method: 'Pour', standardClass: 'IS 9103' },
  useCaseConfidence: { concreteGrade: 0.84, cementType: 0.72, wcRatio: 0.66, dosagePct: 0.8, slumpRetentionMin: 0.7, haulTimeMin: 0.74, climate: 0.7, appTemp: 0.8, method: 0.9, standardClass: 0.9 },
  benchmarks: [bench('bm-pl', 'Benchmark N', 'adm-plasticiser', 'IS 9103', 42, [['solids', 40, '%', 'TDS'], ['water-reduction', 12, '%', 'TDS'], ['chloride', 0.1, '% w/w', 'TDS'], ['ph', 8, '–', 'MSDS']])],
  targets: [
    { propertyId: 'water-reduction', operator: '>=', value: 10, priority: 'must', std: '≥ 5 (IS 9103 WRA)', stdMin: 5, bench: 12, confidence: 0.9 },
    { propertyId: 'solids', operator: 'between', value: [38, 42], priority: 'important', bench: 40, confidence: 0.88 },
    { propertyId: 'chloride', operator: '<=', value: 0.2, priority: 'must', std: '≤ 0.2', stdMax: 0.2, confidence: 0.92 },
    { propertyId: 'setting-time', operator: 'between', value: [60, 120], priority: 'nice', reason: 'Initial set delay vs control, min', confidence: 0.7 },
    { propertyId: 'compressive', operator: '>=', value: 110, priority: 'important', reason: '% of control at 28 d', confidence: 0.8 },
  ],
  top3: [{ id: 'cost', reason: 'Site-mix buyers pay ₹ 40–45/kg' }, { id: 'water-reduction', reason: '10 % cut lets M25 use less cement' }, { id: 'chloride', reason: 'Reinforced work needs ≤ 0.2 %' }],
  constraints: { costCeiling: 30, budgetBand: 'economy', materialLimits: [], compliance: ['No chlorides'], site: { tMin: 15, tMax: 40, rhMax: 90 }, mustHaves: ['Works with PPC'], remark: '200 L drum, 12-month shelf life.' },
  summary: {
    scientist: '**Helix is formulating:** an **SNF / lignosulphonate plasticiser** to **IS 9103 / EN 934-2 T2** for **M20–M25 site concrete**, giving **≥ 10 % water reduction** with **≤ 0.2 % chloride**, at **≤ ₹ 30 / kg**.',
    plain: '**Helix is making:** a **cheap liquid for site concrete** that lets builders **use less water** so the concrete comes out **stronger**.',
  },
  pathways: [
    route('P1', 1, 'SNF-rich, lignin-extended', [['snf', 60, 70], ['lignosulphonate', 15, 20], ['liq-defoamer', 0.1, 0.2], ['biocide', 0.1, 0.1], ['water', 12, 22]], [['water-reduction', 12, 'pass'], ['solids', 39, 'pass'], ['chloride', 0.05, 'pass']], [0.88, 0.8, 0.95, 0.86], LIQUID_TANK, ['Formaldehyde traces — ventilate'], ['pl1']),
    route('P2', 2, 'Lignosulphonate only', [['lignosulphonate', 85, 92], ['liq-defoamer', 0.2, 0.3], ['biocide', 0.1, 0.1], ['water', 8, 14]], [['water-reduction', 9, 'borderline'], ['solids', 38, 'pass'], ['setting-time', 140, 'borderline']], [0.7, 0.95, 0.95, 0.8], LIQUID_TANK, ['Over-retards at high dosage'], ['pl2']),
    route('P3', 3, 'SNF + low PCE boost', [['snf', 70, 75], ['pce-liquid', 4, 6], ['liq-defoamer', 0.1, 0.2], ['biocide', 0.1, 0.1], ['water', 19, 25]], [['water-reduction', 15, 'pass'], ['solids', 40, 'pass'], ['chloride', 0.05, 'pass']], [0.92, 0.65, 0.9, 0.8], LIQUID_TANK, ['Cost creep from PCE'], ['pl1']),
  ],
  leverMaterial: 'snf',
  clusters: ['SNF condensation degree', 'Lignin retardation', 'Cement compatibility', 'Cost'],
  query: '("naphthalene sulphonate" OR SNF OR lignosulphonate) AND plasticiser AND ("water reduction" OR workability) AND PPC',
  sources: [
    src('pl1', 'Paper', 'Degree of condensation of SNF and water reduction in PPC concrete', 2020, 0.88, 'Higher condensation SNF adds 3 % water reduction at equal dose.', 'SNF condensation degree'),
    src('pl2', 'Paper', 'Lignosulphonate dosage and set retardation in blended cements', 2019, 0.81, 'Above 0.3 % bwc lignin retards initial set by > 2 h.', 'Lignin retardation'),
  ],
  measured: ['water-reduction', 'solids', 'chloride', 'compressive'],
  mixingProtocol: liquidMix('SNF and lignosulphonate'),
  testPlan: [
    { test: 'Water reduction', method: 'IS 9103', specimens: 3, ages: 'fresh', dueInDays: 2 },
    { test: 'Chloride content', method: 'IS 9103 Annex', specimens: 2, ages: '—', dueInDays: 2 },
    { test: 'Compressive 28 d (% of control)', method: 'IS 516', specimens: 3, ages: '28 d', dueInDays: 30 },
  ],
});

export const ADM_RETARDER = variant(PCE, {
  id: 'adm-retarder', label: 'Set-retarding admixture', chip: 'Retarder',
  example: 'Retarder to delay setting for a 6-hour mass pour in summer',
  keywords: ['retarder', 'retarding', 'delay setting', 'delayed set', 'mass pour', 'cold joint'],
  projectName: 'Set retarder — Hot-weather mass pours', codePrefix: 'HX-RT',
  productGuess: 'Gluconate-based set-retarding admixture', subcategoryId: 'adm-retarder',
  standard: 'IS 9103 / EN 934-2 T8', standardAlt: 'ASTM C494 Type B',
  useCase: { concreteGrade: 'M30–M50', cementType: 'OPC 53', wcRatio: 0.4, dosagePct: [0.1, 0.4], slumpRetentionMin: 180, haulTimeMin: 60, climate: 'Hot-dry', appTemp: [30, 45], method: 'Pump', standardClass: 'IS 9103' },
  useCaseConfidence: { concreteGrade: 0.8, cementType: 0.72, wcRatio: 0.64, dosagePct: 0.76, slumpRetentionMin: 0.82, haulTimeMin: 0.7, climate: 0.86, appTemp: 0.84, method: 0.88, standardClass: 0.9 },
  benchmarks: [bench('bm-rt', 'Benchmark R', 'adm-retarder', 'IS 9103', 60, [['setting-time', 240, 'min', 'TDS'], ['solids', 30, '%', 'TDS'], ['chloride', 0.1, '% w/w', 'TDS'], ['compressive', 105, '%', 'Lab-tested']])],
  targets: [
    { propertyId: 'setting-time', operator: 'between', value: [180, 300], priority: 'must', std: '+60 to +210 min vs control (EN 934-2 T8)', reason: 'Initial set delay vs control, min', bench: 240, confidence: 0.88 },
    { propertyId: 'compressive-1d', operator: '>=', value: 80, priority: 'important', reason: '% of control at 1 d — slab must be strippable next day', confidence: 0.74 },
    { propertyId: 'compressive', operator: '>=', value: 100, priority: 'must', std: '≥ 90 % of control', stdMin: 90, reason: '% of control at 28 d', bench: 105, confidence: 0.86 },
    { propertyId: 'chloride', operator: '<=', value: 0.1, priority: 'must', std: '≤ 0.2', stdMax: 0.2, confidence: 0.9 },
    { propertyId: 'solids', operator: 'between', value: [28, 32], priority: 'nice', bench: 30, confidence: 0.84 },
  ],
  top3: [{ id: 'setting-time', reason: 'No cold joints in a 6 h pour' }, { id: 'compressive-1d', reason: 'Over-retarding stalls formwork' }, { id: 'cost', reason: 'Dosed at 0.2 % — price per litre matters' }],
  constraints: { costCeiling: 45, budgetBand: 'economy', materialLimits: [], compliance: ['No chlorides'], site: { tMin: 30, tMax: 45, rhMax: 50 }, mustHaves: ['Predictable set at 40 °C'], remark: 'Dosed by the RMC plant, 1000 L IBC.' },
  summary: {
    scientist: '**Helix is formulating:** a **gluconate-based retarder** to **EN 934-2 T8** for **hot-weather mass pours**, delaying initial set **180–300 min** while keeping **28 d strength ≥ 100 % of control**, at **≤ ₹ 45 / kg**.',
    plain: '**Helix is making:** a **liquid that slows concrete setting** so a **big pour on a hot day** can finish **without weak joints**.',
  },
  pathways: [
    route('P1', 1, 'Gluconate + lignin blend', [['gluconate', 18, 22], ['lignosulphonate', 20, 25], ['liq-defoamer', 0.1, 0.2], ['biocide', 0.1, 0.1], ['water', 53, 61]], [['setting-time', 230, 'pass'], ['compressive', 104, 'pass'], ['compressive-1d', 82, 'pass']], [0.9, 0.85, 0.95, 0.89], LIQUID_TANK, ['Overdose gives multi-day retardation'], ['rt1']),
    route('P2', 2, 'Gluconate only', [['gluconate', 25, 30], ['liq-defoamer', 0.1, 0.2], ['biocide', 0.1, 0.1], ['water', 70, 75]], [['setting-time', 290, 'borderline'], ['compressive', 102, 'pass'], ['compressive-1d', 70, 'fail']], [0.72, 0.8, 0.95, 0.78], LIQUID_TANK, ['Steep dose–response'], ['rt1', 'rt2']),
    route('P3', 3, 'Retarding PCE', [['pce-liquid', 30, 35], ['gluconate', 8, 10], ['liq-defoamer', 0.1, 0.2], ['biocide', 0.1, 0.1], ['water', 55, 62]], [['setting-time', 200, 'pass'], ['compressive', 112, 'pass'], ['compressive-1d', 88, 'pass']], [0.94, 0.5, 0.9, 0.78], LIQUID_TANK, ['Over cost ceiling'], ['rt2']),
  ],
  leverMaterial: 'gluconate',
  clusters: ['Gluconate dose–response', 'Temperature sensitivity', 'Early strength recovery', 'Cost'],
  query: '(gluconate OR "set retarder") AND concrete AND ("hot weather" OR "mass pour") AND ("setting time" OR "cold joint")',
  sources: [
    src('rt1', 'Paper', 'Sodium gluconate retardation of OPC at 35–45 °C', 2022, 0.9, '0.06 % bwc gluconate delays initial set ~3.5 h at 40 °C.', 'Temperature sensitivity'),
    src('rt2', 'Paper', 'Early strength recovery after retarded hydration', 2020, 0.8, '1 d strength falls to 70 % of control above 0.1 % bwc.', 'Early strength recovery'),
  ],
  measured: ['setting-time', 'compressive-1d', 'compressive', 'chloride'],
  mixingProtocol: liquidMix('gluconate and lignosulphonate'),
  testPlan: [
    { test: 'Setting time (penetration)', method: 'IS 8142 / ASTM C403', specimens: 2, ages: 'fresh', dueInDays: 2 },
    { test: 'Compressive 1 d', method: 'IS 516', specimens: 3, ages: '1 d', dueInDays: 3 },
    { test: 'Compressive 28 d', method: 'IS 516', specimens: 3, ages: '28 d', dueInDays: 30 },
  ],
});

export const ADM_ACC = variant(PCE, {
  id: 'adm-accelerator', label: 'Non-chloride set accelerator', chip: 'Set accelerator',
  example: 'Non-chloride accelerator for winter concreting and early de-moulding',
  keywords: ['accelerator', 'accelerating', 'non-chloride', 'early de-mould', 'early demould', 'winter concreting', 'cold weather concreting'],
  projectName: 'Non-chloride accelerator — Cold weather & precast', codePrefix: 'HX-AC',
  productGuess: 'Calcium nitrate / thiocyanate non-chloride accelerator', subcategoryId: 'adm-accelerator',
  standard: 'IS 9103 / EN 934-2 T6', standardAlt: 'ASTM C494 Type C',
  useCase: { concreteGrade: 'Precast', cementType: 'OPC 53', wcRatio: 0.4, dosagePct: [1, 3], slumpRetentionMin: 30, haulTimeMin: 15, climate: 'Cold', appTemp: [2, 15], method: 'Pour', standardClass: 'IS 9103' },
  useCaseConfidence: { concreteGrade: 0.76, cementType: 0.74, wcRatio: 0.62, dosagePct: 0.78, slumpRetentionMin: 0.6, haulTimeMin: 0.6, climate: 0.88, appTemp: 0.86, method: 0.86, standardClass: 0.9 },
  benchmarks: [bench('bm-ac', 'Benchmark A', 'adm-accelerator', 'IS 9103', 48, [['setting-time', -90, 'min', 'TDS'], ['compressive-1d', 160, '%', 'TDS'], ['chloride', 0.05, '% w/w', 'TDS'], ['solids', 45, '%', 'TDS']])],
  targets: [
    { propertyId: 'compressive-1d', operator: '>=', value: 150, priority: 'must', std: '≥ 120 % of control at 20 °C (EN 934-2 T6)', stdMin: 120, reason: '% of control at 1 d, 5 °C cure', bench: 160, confidence: 0.86 },
    { propertyId: 'setting-time', operator: 'between', value: [-120, -60], priority: 'important', reason: 'Initial set change vs control, min', bench: -90, confidence: 0.8 },
    { propertyId: 'chloride', operator: '<=', value: 0.1, priority: 'must', std: '≤ 0.1 (non-chloride)', stdMax: 0.1, confidence: 0.94 },
    { propertyId: 'compressive', operator: '>=', value: 100, priority: 'important', reason: '% of control at 28 d', confidence: 0.82 },
    { propertyId: 'solids', operator: 'between', value: [40, 48], priority: 'nice', bench: 45, confidence: 0.8 },
  ],
  top3: [{ id: 'compressive-1d', reason: 'Strip moulds next morning at 5 °C' }, { id: 'chloride', reason: 'Precast is reinforced — no chloride' }, { id: 'cost', reason: 'High dose (2 %) — ₹/kg drives cost per m³' }],
  constraints: { costCeiling: 35, budgetBand: 'economy', materialLimits: [], compliance: ['No chlorides'], site: { tMin: 2, tMax: 15, rhMax: 90 }, mustHaves: ['Chloride-free'], remark: 'Precast yards in north India, Dec–Feb.' },
  summary: {
    scientist: '**Helix is formulating:** a **non-chloride accelerator** (nitrate / thiocyanate / TEA) to **EN 934-2 T6** for **cold-weather precast**, with **1 d strength ≥ 150 % of control at 5 °C** and **≤ 0.1 % chloride**, at **≤ ₹ 35 / kg**.',
    plain: '**Helix is making:** a **liquid that makes concrete harden faster in cold weather**, so moulds can be **opened the next morning**, without salt that rusts steel.',
  },
  pathways: [
    route('P1', 1, 'Calcium nitrate + thiocyanate + TEA', [['ca-nitrate', 70, 75], ['na-thiocyanate', 3, 4], ['tea', 0.5, 1], ['water', 20, 26.5]], [['compressive-1d', 158, 'pass'], ['setting-time', -85, 'pass'], ['chloride', 0.02, 'pass']], [0.92, 0.75, 0.8, 0.84], LIQUID_TANK, ['Thiocyanate — limit 1 % bwc'], ['ac1']),
    route('P2', 2, 'Calcium nitrate + TEA', [['ca-nitrate', 80, 85], ['tea', 1, 1.5], ['water', 13.5, 19]], [['compressive-1d', 138, 'borderline'], ['setting-time', -70, 'pass'], ['chloride', 0.02, 'pass']], [0.75, 0.9, 0.95, 0.83], LIQUID_TANK, ['TEA overdose retards'], ['ac1', 'ac2']),
    route('P3', 3, 'Nitrate + calcium formate slurry', [['ca-nitrate', 60, 65], ['ca-formate', 10, 12], ['tea', 0.5, 1], ['water', 22, 29.5]], [['compressive-1d', 150, 'pass'], ['setting-time', -100, 'pass'], ['compressive', 96, 'borderline']], [0.84, 0.7, 0.85, 0.79], LIQUID_TANK, ['Formate settles — needs stirring'], ['ac2']),
  ],
  leverMaterial: 'ca-nitrate',
  clusters: ['Nitrate acceleration', 'Thiocyanate limits', 'TEA dosage window', 'Low-temperature hydration'],
  query: '("non-chloride accelerator" OR "calcium nitrate" OR thiocyanate) AND concrete AND ("cold weather" OR "early strength") AND precast',
  sources: [
    src('ac1', 'Paper', 'Calcium nitrate and thiocyanate accelerators at 5 °C', 2021, 0.89, 'Nitrate + 0.5 % thiocyanate doubles 1 d strength at 5 °C.', 'Low-temperature hydration'),
    src('ac2', 'Paper', 'Dosage window of triethanolamine in OPC', 2019, 0.8, 'TEA accelerates below 0.03 % bwc and retards above 0.1 %.', 'TEA dosage window'),
  ],
  measured: ['compressive-1d', 'setting-time', 'chloride', 'compressive'],
  mixingProtocol: liquidMix('calcium nitrate, thiocyanate and TEA'),
  testPlan: [
    { test: 'Compressive 1 d at 5 °C', method: 'IS 516', specimens: 3, ages: '1 d', dueInDays: 3 },
    { test: 'Setting time', method: 'IS 8142', specimens: 2, ages: 'fresh', dueInDays: 2 },
    { test: 'Compressive 28 d', method: 'IS 516', specimens: 3, ages: '28 d', dueInDays: 30 },
  ],
});

export const ADM_AIR = variant(PCE, {
  id: 'adm-air', label: 'Air-entraining admixture', chip: 'Air entrainer',
  example: 'Air-entraining admixture for frost-resistant pavement concrete in the hills',
  keywords: ['air entrain', 'air-entrain', 'aea', 'air content', 'frost-resistant concrete', 'scaling'],
  projectName: 'Air entrainer — Pavement concrete, hill roads', codePrefix: 'HX-AE',
  productGuess: 'Synthetic surfactant air-entraining admixture', subcategoryId: 'adm-air',
  standard: 'EN 934-2 T5', standardAlt: 'ASTM C260',
  useCase: { concreteGrade: 'M30–M50', cementType: 'OPC 43', wcRatio: 0.42, dosagePct: [0.02, 0.1], slumpRetentionMin: 60, haulTimeMin: 45, climate: 'Cold', appTemp: [5, 25], method: 'Pour', standardClass: 'EN 934-2 T5' },
  useCaseConfidence: { concreteGrade: 0.8, cementType: 0.7, wcRatio: 0.7, dosagePct: 0.74, slumpRetentionMin: 0.64, haulTimeMin: 0.66, climate: 0.9, appTemp: 0.8, method: 0.86, standardClass: 0.9 },
  benchmarks: [bench('bm-ae', 'Benchmark F', 'adm-air', 'EN 934-2 T5', 70, [['air-content', 5.5, '%', 'TDS'], ['spacing-factor', 0.18, 'mm', 'Lab-tested'], ['solids', 12, '%', 'TDS'], ['compressive', 90, '%', 'TDS']])],
  targets: [
    { propertyId: 'air-content', operator: 'between', value: [4.5, 6.5], priority: 'must', std: '+2.5 % vs control, total 4–6 % (EN 934-2 T5)', bench: 5.5, confidence: 0.9 },
    { propertyId: 'spacing-factor', operator: '<=', value: 0.2, priority: 'must', std: '≤ 0.200 mm (EN 934-2 T5)', stdMax: 0.2, bench: 0.18, confidence: 0.86 },
    { propertyId: 'freeze-thaw', operator: '>=', value: 80, priority: 'important', reason: 'Durability factor after 300 cycles, ASTM C666', confidence: 0.78 },
    { propertyId: 'compressive', operator: '>=', value: 80, priority: 'important', std: '≥ 75 % of control', stdMin: 75, reason: '% of control at 28 d', bench: 90, confidence: 0.84 },
    { propertyId: 'solids', operator: 'between', value: [10, 14], priority: 'nice', bench: 12, confidence: 0.8 },
  ],
  top3: [{ id: 'spacing-factor', reason: 'What actually stops frost damage' }, { id: 'air-content', reason: 'Too much air costs strength' }, { id: 'compressive', reason: 'Pavement still needs M40' }],
  constraints: { costCeiling: 50, budgetBand: 'mid', materialLimits: [], compliance: ['No chlorides'], site: { tMin: 0, tMax: 25, rhMax: 95 }, mustHaves: ['Stable air with PCE'], remark: 'Used alongside PCE in hill-road pavements.' },
  summary: {
    scientist: '**Helix is formulating:** a **synthetic air entrainer** to **EN 934-2 T5** for **M40 pavement concrete in freeze–thaw zones**, giving **4.5–6.5 % air** with **spacing factor ≤ 0.20 mm**, at **≤ ₹ 50 / kg**.',
    plain: '**Helix is making:** a **liquid that puts tiny air bubbles in concrete** so **hill roads don\'t crack** when water freezes inside them.',
  },
  pathways: [
    route('P1', 1, 'Alkyl ether sulphate + stabiliser', [['aea-surfactant', 38, 42], ['tea', 0.5, 1], ['biocide', 0.1, 0.1], ['water', 57, 61.5]], [['air-content', 5.4, 'pass'], ['spacing-factor', 0.17, 'pass'], ['compressive', 86, 'pass']], [0.9, 0.8, 0.9, 0.86], LIQUID_TANK, ['Foams in tank — fill from bottom'], ['ae1']),
    route('P2', 2, 'Surfactant only, high dilution', [['aea-surfactant', 30, 33], ['biocide', 0.1, 0.1], ['water', 67, 70]], [['air-content', 4.6, 'borderline'], ['spacing-factor', 0.21, 'fail'], ['compressive', 90, 'pass']], [0.65, 0.95, 0.95, 0.77], LIQUID_TANK, ['Air unstable with PCE'], ['ae2']),
    route('P3', 3, 'Surfactant + soap co-entrainer', [['aea-surfactant', 35, 38], ['ca-stearate', 3, 5], ['biocide', 0.1, 0.1], ['water', 57, 62]], [['air-content', 6, 'pass'], ['spacing-factor', 0.16, 'pass'], ['compressive', 79, 'borderline']], [0.84, 0.7, 0.85, 0.79], LIQUID_TANK, ['Strength loss at high air'], ['ae1', 'ae2']),
  ],
  leverMaterial: 'aea-surfactant',
  clusters: ['Bubble size and spacing', 'Compatibility with PCE', 'Freeze–thaw durability', 'Strength penalty'],
  query: '("air entraining" OR "air-entraining") AND concrete AND ("spacing factor" OR "freeze-thaw") AND polycarboxylate',
  sources: [
    src('ae1', 'Paper', 'Air-void stability of synthetic AEAs with PCE superplasticisers', 2022, 0.9, 'TEA-stabilised surfactant held spacing factor below 0.18 mm after 60 min.', 'Compatibility with PCE'),
    src('ae2', 'Paper', 'Spacing factor versus freeze–thaw durability in pavement concrete', 2019, 0.83, 'Durability factor > 80 when spacing factor ≤ 0.20 mm.', 'Freeze–thaw durability'),
  ],
  measured: ['air-content', 'spacing-factor', 'compressive', 'freeze-thaw'],
  mixingProtocol: liquidMix('air-entraining surfactant (fill from the bottom to limit foam)'),
  testPlan: [
    { test: 'Air content (pressure)', method: 'EN 12350-7', specimens: 2, ages: 'fresh', dueInDays: 2 },
    { test: 'Air-void spacing factor', method: 'EN 480-11', specimens: 2, ages: '28 d', dueInDays: 32 },
    { test: 'Freeze–thaw (300 cycles)', method: 'ASTM C666', specimens: 3, ages: '14 d + cycles', dueInDays: 75 },
  ],
});

export const ADM_WP = variant(PCE, {
  id: 'adm-wp', label: 'Integral waterproofing admixture', chip: 'Waterproofing admixture',
  example: 'Integral waterproofing admixture for basement raft concrete',
  keywords: ['integral waterproof', 'waterproofing admixture', 'waterproof concrete', 'permeability reducing', 'watertight concrete'],
  projectName: 'Integral waterproofing admixture — Basements & tanks', codePrefix: 'HX-IW',
  productGuess: 'Crystalline / stearate permeability-reducing admixture', subcategoryId: 'adm-wp',
  chemistry: ['crystalline', 'PCE/SNF'], form: 'liquid',
  standard: 'EN 934-2 T9', standardAlt: 'ACI 212.3R PRAH',
  useCase: { concreteGrade: 'M30–M50', cementType: 'OPC 53', wcRatio: 0.4, dosagePct: [0.8, 1.5], slumpRetentionMin: 90, haulTimeMin: 60, climate: 'Hot-humid', appTemp: [15, 40], method: 'Pump', standardClass: 'EN 934-2 T9' },
  useCaseConfidence: { concreteGrade: 0.82, cementType: 0.72, wcRatio: 0.7, dosagePct: 0.74, slumpRetentionMin: 0.66, haulTimeMin: 0.66, climate: 0.76, appTemp: 0.78, method: 0.84, standardClass: 0.88 },
  benchmarks: [bench('bm-iw', 'Benchmark I', 'adm-wp', 'EN 934-2 T9', 110, [['permeability', 10, 'mm', 'TDS'], ['water-absorption', 2.5, '%', 'TDS'], ['compressive', 100, '%', 'TDS'], ['chloride', 0.05, '% w/w', 'TDS']])],
  targets: [
    { propertyId: 'permeability', operator: '<=', value: 15, priority: 'must', std: '≤ 50 % of control (EN 12390-8)', reason: 'Water penetration depth, mm', bench: 10, confidence: 0.88 },
    { propertyId: 'water-absorption', operator: '<=', value: 3, priority: 'must', std: '≤ 50 % of control (EN 480-5)', bench: 2.5, confidence: 0.84 },
    { propertyId: 'compressive', operator: '>=', value: 95, priority: 'important', std: '≥ 85 % of control', stdMin: 85, reason: '% of control at 28 d', bench: 100, confidence: 0.84 },
    { propertyId: 'air-content', operator: '<=', value: 2, priority: 'important', reason: '+ air vs control, % — stearates entrain air', confidence: 0.76 },
    { propertyId: 'chloride', operator: '<=', value: 0.1, priority: 'must', std: '≤ 0.1', stdMax: 0.1, confidence: 0.92 },
  ],
  top3: [{ id: 'permeability', reason: 'Basement rafts under ground water' }, { id: 'compressive', reason: 'No strength penalty allowed in the raft' }, { id: 'cost', reason: 'Benchmark I at ₹ 110/kg' }],
  constraints: { costCeiling: 70, budgetBand: 'mid', materialLimits: [], compliance: ['No chlorides', 'Potable-water contact'], site: { tMin: 15, tMax: 40, rhMax: 95 }, mustHaves: ['Compatible with PCE'], remark: 'Dosed at the batching plant with the PCE.' },
  summary: {
    scientist: '**Helix is formulating:** an **integral permeability-reducing admixture** to **EN 934-2 T9** for **basement rafts and tanks**, with **water penetration ≤ 15 mm** and **no more than 5 % strength loss**, at **≤ ₹ 70 / kg**.',
    plain: '**Helix is making:** a **liquid mixed into concrete** so the **concrete itself keeps water out** of basements and tanks.',
  },
  pathways: [
    route('P1', 1, 'Stearate + crystalline active', [['ca-stearate', 35, 40], ['cryst-active', 8, 10], ['pce-liquid', 5, 7], ['liq-defoamer', 0.3, 0.5], ['biocide', 0.1, 0.1], ['water', 42.4, 51.6]], [['permeability', 11, 'pass'], ['water-absorption', 2.6, 'pass'], ['compressive', 97, 'pass']], [0.9, 0.75, 0.85, 0.84], LIQUID_TANK, ['Keep stirred — settles'], ['iw1', 'iw2']),
    route('P2', 2, 'Stearate only', [['ca-stearate', 45, 50], ['liq-defoamer', 0.4, 0.6], ['biocide', 0.1, 0.1], ['water', 49.3, 54.5]], [['permeability', 16, 'borderline'], ['water-absorption', 2.4, 'pass'], ['air-content', 2.6, 'fail']], [0.68, 0.85, 0.95, 0.78], LIQUID_TANK, ['Air entrainment'], ['iw2']),
    route('P3', 3, 'Crystalline active slurry', [['cryst-active', 18, 22], ['pce-liquid', 8, 10], ['liq-defoamer', 0.2, 0.3], ['biocide', 0.1, 0.1], ['water', 67.6, 73.7]], [['permeability', 9, 'pass'], ['water-absorption', 3.2, 'borderline'], ['compressive', 103, 'pass']], [0.82, 0.6, 0.8, 0.74], LIQUID_TANK, ['Higher cost'], ['iw1']),
  ],
  leverMaterial: 'ca-stearate',
  clusters: ['Hydrophobic pore blocking', 'Crystalline pore filling', 'Air side-effects', 'PCE compatibility'],
  query: '("permeability reducing admixture" OR "integral waterproofing" OR stearate) AND concrete AND ("water penetration" OR absorption)',
  sources: [
    src('iw1', 'Paper', 'Crystalline admixtures and water penetration under pressure', 2022, 0.88, 'Crystalline PRAH halved penetration depth at 1 % bwc.', 'Crystalline pore filling'),
    src('iw2', 'Paper', 'Calcium stearate in concrete: absorption and air content', 2020, 0.82, 'Stearate cut absorption 60 % but added 1.5–3 % air.', 'Air side-effects'),
  ],
  measured: ['permeability', 'water-absorption', 'compressive', 'air-content'],
  mixingProtocol: liquidMix('stearate dispersion and crystalline active'),
  testPlan: [
    { test: 'Water penetration under pressure', method: 'EN 12390-8', specimens: 3, ages: '28 d', dueInDays: 31 },
    { test: 'Capillary absorption', method: 'EN 480-5', specimens: 3, ages: '28 d', dueInDays: 31 },
    { test: 'Compressive 28 d', method: 'IS 516', specimens: 3, ages: '28 d', dueInDays: 30 },
  ],
});

export const ADM_CI = variant(PCE, {
  id: 'adm-ci', label: 'Corrosion-inhibiting admixture', chip: 'Corrosion inhibitor',
  example: 'Corrosion inhibitor admixture for marine concrete jetty piles',
  keywords: ['corrosion inhibit', 'rebar corrosion', 'calcium nitrite', 'marine concrete', 'chloride attack', 'jetty'],
  projectName: 'Corrosion inhibitor — Marine RCC', codePrefix: 'HX-CI',
  productGuess: 'Calcium nitrite corrosion-inhibiting admixture', subcategoryId: 'adm-ci',
  standard: 'ASTM C1582', standardAlt: 'EN 934-2',
  useCase: { concreteGrade: 'M50–M80', cementType: 'PSC', wcRatio: 0.36, dosagePct: [2, 4], slumpRetentionMin: 90, haulTimeMin: 45, climate: 'Hot-humid', appTemp: [20, 38], method: 'Pump', standardClass: 'ASTM C1582' },
  useCaseConfidence: { concreteGrade: 0.78, cementType: 0.74, wcRatio: 0.7, dosagePct: 0.72, slumpRetentionMin: 0.62, haulTimeMin: 0.64, climate: 0.88, appTemp: 0.8, method: 0.84, standardClass: 0.9 },
  benchmarks: [bench('bm-ci', 'Benchmark C', 'adm-ci', 'ASTM C1582', 120, [['corrosion-reduction', 70, '%', 'Lab-tested'], ['setting-time', -30, 'min', 'TDS'], ['solids', 30, '%', 'TDS'], ['chloride', 0.01, '% w/w', 'TDS']])],
  targets: [
    { propertyId: 'corrosion-reduction', operator: '>=', value: 65, priority: 'must', std: 'Pass ASTM C1582 (G109 macrocell)', reason: 'Integrated macrocell current vs control', bench: 70, confidence: 0.82 },
    { propertyId: 'setting-time', operator: 'between', value: [-60, 30], priority: 'important', reason: 'Nitrite accelerates — keep within ±1 h of control', bench: -30, confidence: 0.78 },
    { propertyId: 'compressive', operator: '>=', value: 100, priority: 'important', std: '≥ 90 % of control', stdMin: 90, reason: '% of control at 28 d', confidence: 0.84 },
    { propertyId: 'chloride', operator: '<=', value: 0.05, priority: 'must', std: '≤ 0.05', stdMax: 0.05, confidence: 0.94 },
    { propertyId: 'solids', operator: 'between', value: [28, 32], priority: 'nice', bench: 30, confidence: 0.8 },
  ],
  top3: [{ id: 'corrosion-reduction', reason: 'Splash-zone piles see chloride in years, not decades' }, { id: 'setting-time', reason: 'Nitrite at 3 % dose speeds set in the heat' }, { id: 'cost', reason: 'High dose per m³' }],
  constraints: { costCeiling: 80, budgetBand: 'mid', materialLimits: [], compliance: ['No chlorides'], site: { tMin: 20, tMax: 38, rhMax: 95 }, mustHaves: ['Works with PSC'], remark: 'Ports and jetties on the west coast.' },
  summary: {
    scientist: '**Helix is formulating:** a **calcium-nitrite corrosion inhibitor** to **ASTM C1582** for **marine RCC in PSC concrete**, reducing **macrocell corrosion ≥ 65 %** with set change within **±1 h**, at **≤ ₹ 80 / kg**.',
    plain: '**Helix is making:** a **liquid that protects the steel inside concrete from rusting** near the sea.',
  },
  pathways: [
    route('P1', 1, 'Calcium nitrite + gluconate balance', [['ca-nitrite', 90, 94], ['gluconate', 1, 2], ['biocide', 0.1, 0.1], ['water', 4, 8.9]], [['corrosion-reduction', 70, 'pass'], ['setting-time', -20, 'pass'], ['compressive', 104, 'pass']], [0.9, 0.75, 0.85, 0.84], LIQUID_TANK, ['Nitrite — toxic if swallowed'], ['ci1']),
    route('P2', 2, 'Nitrite + amino-alcohol', [['ca-nitrite', 70, 75], ['amino-alcohol', 8, 10], ['biocide', 0.1, 0.1], ['water', 15, 22]], [['corrosion-reduction', 76, 'pass'], ['setting-time', -50, 'pass'], ['compressive', 98, 'pass']], [0.92, 0.55, 0.7, 0.76], LIQUID_TANK, ['Amino-alcohol supply pending'], ['ci1', 'ci2']),
    route('P3', 3, 'Amino-alcohol only', [['amino-alcohol', 25, 30], ['biocide', 0.1, 0.1], ['water', 70, 75]], [['corrosion-reduction', 55, 'fail'], ['setting-time', 10, 'pass'], ['compressive', 101, 'pass']], [0.6, 0.6, 0.7, 0.62], LIQUID_TANK, ['Weak in high chloride'], ['ci2']),
  ],
  leverMaterial: 'ca-nitrite',
  clusters: ['Nitrite-to-chloride ratio', 'Migrating inhibitors', 'Set acceleration', 'Marine exposure'],
  query: '("calcium nitrite" OR "corrosion inhibitor") AND concrete AND (chloride OR marine) AND ("ASTM C1582" OR macrocell)',
  sources: [
    src('ci1', 'Paper', 'Calcium nitrite dosage and chloride threshold in marine concrete', 2021, 0.89, 'Nitrite:chloride ≥ 0.6 kept rebar passive over 3 years.', 'Nitrite-to-chloride ratio'),
    src('ci2', 'Paper', 'Amino-alcohol migrating corrosion inhibitors — a review', 2020, 0.78, 'Effective at low chloride, weak above 1 % chloride by cement.', 'Migrating inhibitors'),
  ],
  measured: ['corrosion-reduction', 'setting-time', 'compressive', 'chloride'],
  mixingProtocol: liquidMix('calcium nitrite and gluconate'),
  testPlan: [
    { test: 'Macrocell corrosion', method: 'ASTM G109', specimens: 3, ages: '6 months', dueInDays: 190 },
    { test: 'Setting time', method: 'ASTM C403', specimens: 2, ages: 'fresh', dueInDays: 2 },
    { test: 'Compressive 28 d', method: 'IS 516', specimens: 3, ages: '28 d', dueInDays: 30 },
  ],
});

/* ---------- Shotcrete accelerators ---------- */

export const SC_AF: Scenario = {
  id: 'sc-af', label: 'Alkali-free shotcrete accelerator', chip: 'Alkali-free accelerator',
  example: 'Alkali-free accelerator for wet-mix shotcrete in a metro tunnel lining',
  keywords: ['shotcrete', 'sprayed concrete', 'alkali-free', 'alkali free', 'gunite', 'tunnel lining', 'nmt'],
  projectName: 'Alkali-free accelerator — Wet-mix tunnel shotcrete', codePrefix: 'HX-SC',
  docType: 'Technical Data Sheet', productGuess: 'Aluminium sulphate alkali-free liquid accelerator',
  categoryId: 'shotcrete-acc', subcategoryId: 'sc-af', chemistry: ['PCE/SNF'], form: 'liquid',
  standard: 'EN 934-5', standardAlt: 'EN 14487-1 J2',
  useCase: { concreteGrade: 'Shotcrete', cementType: 'OPC 53', wcRatio: 0.45, dosagePct: [5, 8], slumpRetentionMin: 120, haulTimeMin: 60, climate: 'Hot-humid', appTemp: [15, 35], method: 'Spray', standardClass: 'EN 934-5' },
  useCaseConfidence: { concreteGrade: 0.92, cementType: 0.74, wcRatio: 0.68, dosagePct: 0.8, slumpRetentionMin: 0.6, haulTimeMin: 0.62, climate: 0.72, appTemp: 0.78, method: 0.96, standardClass: 0.9 },
  guided: [
    { id: 'where', q: 'Where is the concrete sprayed?', picture: 'Mountain', answer: 0, options: [
      { label: 'Tunnel roof and walls', icon: 'Mountain', sets: { concreteGrade: 'Shotcrete', method: 'Spray', dosagePct: [5, 8] } },
      { label: 'Slope or rock face', icon: 'Triangle', sets: { concreteGrade: 'Shotcrete', method: 'Spray', dosagePct: [4, 6] } },
    ] },
    COMMON_GUIDED[1],
  ],
  benchmarks: [bench('bm-sc', 'Benchmark S', 'sc-af', 'EN 934-5', 55, [['setting-time', 4, 'min', 'TDS'], ['early-strength', 1.2, 'N/mm²', 'TDS'], ['compressive-1d', 18, 'N/mm²', 'Lab-tested'], ['alkali', 0.8, '% Na₂O eq', 'TDS'], ['solids', 52, '%', 'TDS']])],
  targets: [
    { propertyId: 'setting-time', operator: '<=', value: 5, priority: 'must', std: 'Final set ≤ 60 min (EN 934-5)', reason: 'Initial set of accelerated paste, min', bench: 4, confidence: 0.88 },
    { propertyId: 'early-strength', operator: '>=', value: 1, priority: 'must', std: 'J2 curve (EN 14487-1)', reason: 'J2 at 6 h', bench: 1.2, confidence: 0.86 },
    { propertyId: 'compressive-1d', operator: '>=', value: 15, priority: 'important', bench: 18, confidence: 0.82 },
    { propertyId: 'alkali', operator: '<=', value: 1, priority: 'must', std: '≤ 1 % Na₂O eq (alkali-free)', stdMax: 1, bench: 0.8, confidence: 0.94 },
    { propertyId: 'compressive', operator: '>=', value: 90, priority: 'important', std: '≥ 75 % of control (EN 934-5)', stdMin: 75, reason: '% of control at 28 d', confidence: 0.84 },
    { propertyId: 'solids', operator: 'between', value: [48, 55], priority: 'nice', bench: 52, confidence: 0.8 },
  ],
  top3: [{ id: 'early-strength', reason: 'Crew safety under fresh lining' }, { id: 'alkali', reason: 'Alkali-free spec for worker safety and durability' }, { id: 'cost', reason: 'Dosed at 6 % — biggest admixture cost in a tunnel' }],
  constraints: { costCeiling: 40, budgetBand: 'mid', materialLimits: [], compliance: ['No chlorides', 'Alkali-free (≤ 1 % Na₂O eq)'], site: { tMin: 15, tMax: 35, rhMax: 95 }, mustHaves: ['Stable 3 months in storage'], remark: '1000 L IBC, dosed at the nozzle.' },
  summary: {
    scientist: '**Helix is formulating:** an **alkali-free aluminium-sulphate accelerator** to **EN 934-5** for **wet-mix tunnel shotcrete**, reaching the **J2 curve (≥ 1 N/mm² at 6 h)** with **≤ 1 % Na₂O eq**, at **≤ ₹ 40 / kg**.',
    plain: '**Helix is making:** a **liquid added at the spray nozzle** so concrete **sticks to a tunnel roof and hardens within minutes**, safely for the crew.',
  },
  pathways: [
    route('P1', 1, 'Al-sulphate + DEA, Al(OH)₃ boosted', [['al-sulphate', 78, 82], ['al-hydroxide', 6, 8], ['dea', 2, 3], ['water', 7, 14]], [['setting-time', 4, 'pass'], ['early-strength', 1.15, 'pass'], ['alkali', 0.3, 'pass']], [0.9, 0.75, 0.85, 0.84], ['Heated stirred tank (60 °C)'], ['Acidic (pH 3) — eye protection'], ['sc1']),
    route('P2', 2, 'Al-sulphate + DEA', [['al-sulphate', 88, 92], ['dea', 3, 4], ['water', 4, 9]], [['setting-time', 6, 'borderline'], ['early-strength', 0.9, 'borderline'], ['alkali', 0.2, 'pass']], [0.7, 0.9, 0.95, 0.82], LIQUID_TANK, ['Slower set'], ['sc1', 'sc2']),
    route('P3', 3, 'High-solids Al(OH)₃ suspension', [['al-sulphate', 65, 70], ['al-hydroxide', 12, 15], ['dea', 2, 3], ['water', 12, 21]], [['setting-time', 3, 'pass'], ['early-strength', 1.4, 'pass'], ['compressive', 82, 'borderline']], [0.86, 0.55, 0.8, 0.74], ['Heated stirred tank (60 °C)', 'High-shear disperser'], ['Settles within 6 weeks'], ['sc2']),
  ],
  balanceMaterial: 'water', leverMaterial: 'al-hydroxide',
  clusters: ['Aluminium sulphate dosage', 'Stabilisers and shelf life', 'Early strength (J-curves)', 'Cement compatibility'],
  query: '("alkali-free accelerator" OR "aluminium sulphate") AND shotcrete AND ("early strength" OR "J2") AND stability',
  sources: [
    src('sc1', 'Paper', 'Aluminium sulphate–DEA accelerators for wet-mix shotcrete', 2022, 0.91, '6–8 % Al(OH)₃ lifted 6 h strength from 0.8 to 1.2 N/mm².', 'Early strength (J-curves)'),
    src('sc2', 'Paper', 'Shelf-life of alkali-free accelerator suspensions', 2021, 0.84, 'Suspensions above 12 % Al(OH)₃ sedimented within 6 weeks.', 'Stabilisers and shelf life'),
  ],
  measured: ['setting-time', 'early-strength', 'compressive-1d', 'alkali'],
  mixingProtocol: ['Charge water; heat to 60 °C.', 'Dissolve aluminium sulphate over 30 min.', 'Add Al(OH)₃ and DEA; stir 60 min; cool and check solids, pH and viscosity.'],
  testPlan: [
    { test: 'Setting time of accelerated paste', method: 'EN 480-2', specimens: 2, ages: 'fresh', dueInDays: 2 },
    { test: 'Early strength (needle / stud)', method: 'EN 14488-2', specimens: 3, ages: '6 h', dueInDays: 3 },
    { test: 'Compressive 1 d', method: 'EN 12390-3', specimens: 3, ages: '1 d', dueInDays: 4 },
  ],
};

export const SC_ALK = variant(SC_AF, {
  id: 'sc-alk', label: 'Alkaline shotcrete accelerator', chip: 'Alkaline accelerator',
  example: 'Low-cost alkaline sodium aluminate accelerator for mine shotcrete',
  keywords: ['alkaline accelerator', 'sodium aluminate', 'aluminate', 'mine shotcrete', 'dry-mix shotcrete'],
  projectName: 'Alkaline accelerator — Mining shotcrete', codePrefix: 'HX-SA',
  productGuess: 'Sodium aluminate alkaline liquid accelerator', subcategoryId: 'sc-alk',
  standard: 'EN 934-5', standardAlt: 'EN 14487-1 J1',
  useCase: { concreteGrade: 'Shotcrete', cementType: 'OPC 53', wcRatio: 0.45, dosagePct: [3, 5], slumpRetentionMin: 60, haulTimeMin: 30, climate: 'Hot-humid', appTemp: [20, 40], method: 'Spray', standardClass: 'EN 934-5' },
  benchmarks: [bench('bm-sa', 'Benchmark K', 'sc-alk', 'EN 934-5', 40, [['setting-time', 2, 'min', 'TDS'], ['early-strength', 0.8, 'N/mm²', 'TDS'], ['alkali', 18, '% Na₂O eq', 'TDS'], ['compressive', 70, '%', 'Lab-tested']])],
  targets: [
    { propertyId: 'setting-time', operator: '<=', value: 3, priority: 'must', reason: 'Initial set of accelerated paste, min', bench: 2, confidence: 0.88 },
    { propertyId: 'early-strength', operator: '>=', value: 0.6, priority: 'must', std: 'J1 curve (EN 14487-1)', reason: 'J1 at 6 h', bench: 0.8, confidence: 0.84 },
    { propertyId: 'compressive', operator: '>=', value: 75, priority: 'important', std: '≥ 75 % of control (EN 934-5)', stdMin: 75, reason: 'Aluminates cut late strength — % of control at 28 d', bench: 70, confidence: 0.8 },
    { propertyId: 'ph', operator: '>=', value: 13, priority: 'nice', reason: 'Strongly alkaline — label and PPE', confidence: 0.9 },
  ],
  top3: [{ id: 'cost', reason: 'Mines buy on price — ≤ ₹ 28/kg' }, { id: 'setting-time', reason: 'Thick layers overhead' }, { id: 'compressive', reason: 'Aluminate strength loss' }],
  constraints: { costCeiling: 28, budgetBand: 'economy', materialLimits: [], compliance: ['No chlorides'], site: { tMin: 20, tMax: 40, rhMax: 95 }, mustHaves: ['Fast set'], remark: 'Not for permanent linings — temporary ground support.' },
  summary: {
    scientist: '**Helix is formulating:** a **sodium-aluminate alkaline accelerator** to **EN 934-5** for **temporary mine shotcrete**, setting in **≤ 3 min** with **28 d strength ≥ 75 % of control**, at **≤ ₹ 28 / kg**.',
    plain: '**Helix is making:** a **cheap liquid that makes sprayed concrete set in minutes** for **temporary support in mines**.',
  },
  pathways: [
    route('P1', 1, 'Sodium aluminate + DEA', [['na-aluminate', 70, 75], ['dea', 1, 2], ['water', 23, 29]], [['setting-time', 2, 'pass'], ['early-strength', 0.75, 'pass'], ['compressive', 76, 'pass']], [0.86, 0.85, 0.95, 0.87], LIQUID_TANK, ['Corrosive (pH 14) — full PPE'], ['sa1']),
    route('P2', 2, 'Concentrated aluminate', [['na-aluminate', 85, 90], ['water', 10, 15]], [['setting-time', 1.5, 'pass'], ['early-strength', 0.9, 'pass'], ['compressive', 68, 'fail']], [0.7, 0.8, 0.95, 0.78], LIQUID_TANK, ['Strength loss'], ['sa1']),
    route('P3', 3, 'Aluminate + Al-sulphate hybrid', [['na-aluminate', 50, 55], ['al-sulphate', 15, 20], ['water', 25, 35]], [['setting-time', 3, 'pass'], ['early-strength', 0.7, 'pass'], ['compressive', 80, 'pass']], [0.82, 0.8, 0.85, 0.82], LIQUID_TANK, ['Gels if mixed wrong order'], ['sa2']),
  ],
  leverMaterial: 'na-aluminate',
  clusters: ['Aluminate dosage', 'Late strength loss', 'Worker safety', 'Cost'],
  query: '("sodium aluminate" OR "alkaline accelerator") AND shotcrete AND ("setting time" OR "strength loss")',
  sources: [
    src('sa1', 'Paper', 'Sodium aluminate accelerators and 28-day strength loss', 2018, 0.84, 'Above 5 % dose, 28 d strength fell below 70 % of control.', 'Late strength loss'),
    src('sa2', 'Paper', 'Hybrid aluminate–sulphate accelerators', 2020, 0.76, 'Hybrid kept 80 % strength with 3 min set.', 'Aluminate dosage'),
  ],
  measured: ['setting-time', 'early-strength', 'compressive'],
});

/* ---------- Fibres ---------- */

export const FIB_PP: Scenario = {
  id: 'fib-pp', label: 'Polypropylene micro-fibre', chip: 'PP micro-fibre',
  example: 'Polypropylene micro-fibre to stop plastic shrinkage cracks in floor slabs',
  keywords: ['fibre', 'fiber', 'microfibre', 'micro-fibre', 'micro fibre', 'polypropylene fibre', 'pp fibre', 'plastic shrinkage'],
  projectName: 'PP micro-fibre — Slab-on-grade crack control', codePrefix: 'HX-FP',
  docType: 'Technical Data Sheet', productGuess: '12 mm polypropylene monofilament micro-fibre',
  categoryId: 'fibres', subcategoryId: 'fib-pp', chemistry: ['polymer-modified'], form: 'sheet',
  standard: 'EN 14889-2 Class Ia', standardAlt: 'ASTM C1116',
  useCase: { concreteGrade: 'M20–M25', element: 'Slab', dosageKgM3: 0.9, thicknessMm: 150, exposure: 'exterior', climate: 'Hot-dry', appTemp: [20, 45], load: 'Light vehicular', method: 'Pour', standardClass: 'EN 14889-2 Class Ia' },
  useCaseConfidence: { concreteGrade: 0.78, element: 0.92, dosageKgM3: 0.8, thicknessMm: 0.66, exposure: 0.84, climate: 0.82, appTemp: 0.78, load: 0.7, method: 0.9, standardClass: 0.88 },
  guided: [
    { id: 'what', q: 'What are you pouring?', picture: 'Square', answer: 0, options: [
      { label: 'Floor slab or road', icon: 'Square', sets: { element: 'Slab', thicknessMm: 150 } },
      { label: 'Plaster or screed', icon: 'PaintRoller', sets: { element: 'Wall', thicknessMm: 20 } },
      { label: 'Precast pieces', icon: 'Box', sets: { element: 'Precast element', thicknessMm: 60 } },
    ] },
    COMMON_GUIDED[1],
    COMMON_GUIDED[2],
  ],
  benchmarks: [bench('bm-fp', 'Benchmark P-F', 'fib-pp', 'EN 14889-2 Ia', 380, [['crack-reduction', 85, '%', 'TDS'], ['compressive', 100, '%', 'TDS'], ['flexural', 4.2, 'N/mm²', 'Lab-tested'], ['air-content', 2, '%', 'Lab-tested']])],
  targets: [
    { propertyId: 'crack-reduction', operator: '>=', value: 80, priority: 'must', reason: 'Crack reduction ratio vs plain concrete at 0.9 kg/m³', bench: 85, confidence: 0.86 },
    { propertyId: 'compressive', operator: '>=', value: 98, priority: 'important', reason: '% of plain concrete at 28 d', bench: 100, confidence: 0.84 },
    { propertyId: 'flexural', operator: '>=', value: 4, priority: 'nice', bench: 4.2, confidence: 0.76 },
    { propertyId: 'air-content', operator: '<=', value: 2.5, priority: 'important', reason: 'Fibre finish must not entrain air', bench: 2, confidence: 0.8 },
    { propertyId: 'shrinkage', operator: '<=', value: 0.5, priority: 'nice', reason: 'Drying shrinkage, mm/m', confidence: 0.7 },
  ],
  top3: [{ id: 'crack-reduction', reason: 'Hot-dry wind cracks slabs within hours' }, { id: 'cost', reason: 'Bought per m³ — ₹ 200–250/m³' }, { id: 'air-content', reason: 'Finish chemistry can foam' }],
  constraints: { costCeiling: 260, budgetBand: 'economy', materialLimits: [], compliance: [], site: { tMin: 20, tMax: 45, rhMax: 40 }, mustHaves: ['Disperses in 60 s of mixing'], remark: '900 g degradable bag, one bag per m³.' },
  summary: {
    scientist: '**Helix is formulating:** a **12 mm PP monofilament with hydrophilic finish** to **EN 14889-2 Class Ia** for **slabs in hot-dry weather**, cutting **plastic-shrinkage cracking ≥ 80 %** at **0.9 kg/m³**, at **≤ ₹ 260 / kg**.',
    plain: '**Helix is making:** **tiny plastic fibres mixed into concrete** that **stop floors cracking** in the first hours on hot, windy days.',
  },
  pathways: [
    route('P1', 1, '12 mm fibre, 0.8 % hydrophilic finish', [['pp-fibre', 99, 99.4], ['spin-finish', 0.6, 1]], [['crack-reduction', 84, 'pass'], ['compressive', 100, 'pass'], ['air-content', 2.1, 'pass']], [0.9, 0.8, 0.9, 0.87], ['Fibre line (extrude, draw, cut)', 'Finish applicator'], ['Dust on cutting'], ['fp1', 'fp2']),
    route('P2', 2, 'Low finish, cheaper', [['pp-fibre', 99.6, 99.8], ['spin-finish', 0.2, 0.4]], [['crack-reduction', 74, 'borderline'], ['compressive', 99, 'pass'], ['air-content', 1.8, 'pass']], [0.7, 0.9, 0.9, 0.8], ['Fibre line (extrude, draw, cut)'], ['Balls in the mixer'], ['fp2']),
    route('P3', 3, 'High finish, fast dispersion', [['pp-fibre', 98.4, 98.8], ['spin-finish', 1.2, 1.6]], [['crack-reduction', 86, 'pass'], ['compressive', 97, 'borderline'], ['air-content', 2.9, 'fail']], [0.78, 0.7, 0.9, 0.76], ['Fibre line (extrude, draw, cut)', 'Finish applicator'], ['Air entrainment'], ['fp1']),
  ],
  balanceMaterial: 'pp-fibre', leverMaterial: 'spin-finish',
  clusters: ['Fibre length and diameter', 'Dispersion finish', 'Plastic shrinkage', 'Dosage per m³'],
  query: '("polypropylene fibre" OR "micro-fibre") AND concrete AND ("plastic shrinkage" OR "crack reduction") AND (dispersion OR finish)',
  sources: [
    src('fp1', 'Paper', 'Hydrophilic finishes and dispersion of PP micro-fibres', 2021, 0.88, '0.6–1 % finish removed fibre balling with < 0.5 % added air.', 'Dispersion finish'),
    src('fp2', 'Paper', 'Plastic shrinkage cracking of slabs with PP fibres (ASTM C1579)', 2022, 0.86, '0.9 kg/m³ of 12 mm fibre cut crack area 82 %.', 'Plastic shrinkage'),
  ],
  measured: ['crack-reduction', 'compressive', 'air-content', 'flexural'],
  mixingProtocol: ['Batch a reference M25 mix.', 'Add one 0.9 kg bag per m³ with the aggregates.', 'Mix 60 s extra; check dispersion by wash-out and air content.'],
  testPlan: [
    { test: 'Plastic shrinkage cracking', method: 'ASTM C1579', specimens: 2, ages: '24 h', dueInDays: 3 },
    { test: 'Air content', method: 'IS 1199', specimens: 2, ages: 'fresh', dueInDays: 1 },
    { test: 'Compressive 28 d', method: 'IS 516', specimens: 3, ages: '28 d', dueInDays: 30 },
  ],
};

export const FIB_STEEL = variant(FIB_PP, {
  id: 'fib-steel', label: 'Hooked-end steel fibre', chip: 'Steel fibre',
  example: 'Hooked-end steel fibre for a jointless warehouse slab (SFRC)',
  keywords: ['steel fibre', 'steel fiber', 'hooked', 'sfrc', 'jointless'],
  projectName: 'Steel fibre — Jointless warehouse slab', codePrefix: 'HX-FS',
  productGuess: 'Glued hooked-end steel fibre 60 mm', subcategoryId: 'fib-steel', chemistry: ['cementitious'],
  standard: 'EN 14889-1', standardAlt: 'ASTM A820',
  useCase: { concreteGrade: 'M30–M50', element: 'Slab', dosageKgM3: 30, thicknessMm: 200, exposure: 'interior', climate: 'Composite', appTemp: [15, 40], load: 'Heavy vehicular', method: 'Pour', standardClass: 'EN 14889-1' },
  useCaseConfidence: { concreteGrade: 0.82, element: 0.92, dosageKgM3: 0.78, thicknessMm: 0.72, exposure: 0.86, climate: 0.7, appTemp: 0.76, load: 0.9, method: 0.9, standardClass: 0.9 },
  benchmarks: [bench('bm-fs', 'Benchmark H', 'fib-steel', 'EN 14889-1', 110, [['residual-flexural', 3.2, 'N/mm²', 'TDS'], ['flexural', 5, 'N/mm²', 'TDS'], ['compressive', 40, 'N/mm²', 'Lab-tested']])],
  targets: [
    { propertyId: 'residual-flexural', operator: '>=', value: 3, priority: 'must', std: 'fR1 ≥ 1.5 at declared dose (EN 14889-1)', reason: 'fR3 at 30 kg/m³', bench: 3.2, confidence: 0.86 },
    { propertyId: 'flexural', operator: '>=', value: 4.8, priority: 'important', reason: 'Limit of proportionality fL', bench: 5, confidence: 0.82 },
    { propertyId: 'compressive', operator: '>=', value: 38, priority: 'important', bench: 40, confidence: 0.84 },
  ],
  top3: [{ id: 'residual-flexural', reason: 'Replaces mesh — slab design uses fR3' }, { id: 'cost', reason: 'kg/m³ × ₹/kg decides vs mesh' }, { id: 'flexural', reason: 'Forklift point loads' }],
  constraints: { costCeiling: 105, budgetBand: 'mid', materialLimits: [], compliance: [], site: { tMin: 15, tMax: 40, rhMax: 90 }, mustHaves: ['No balling at 30 kg/m³'], remark: '20 kg bags, glued bundles.' },
  summary: {
    scientist: '**Helix is formulating:** a **glued hooked-end steel fibre (l/d 65)** to **EN 14889-1** for **jointless warehouse slabs**, giving **fR3 ≥ 3.0 N/mm² at 30 kg/m³**, at **≤ ₹ 105 / kg**.',
    plain: '**Helix is making:** **short hooked steel wires mixed into concrete** so a **warehouse floor can carry forklifts** without steel mesh.',
  },
  pathways: [
    route('P1', 1, 'l/d 65 glued bundles', [['steel-fibre', 99.4, 99.6], ['pva-glue', 0.4, 0.6]], [['residual-flexural', 3.2, 'pass'], ['flexural', 5, 'pass'], ['compressive', 40, 'pass']], [0.9, 0.8, 0.9, 0.87], ['Wire drawing', 'Hook-forming cutter', 'Glue bath'], ['Sharp ends — gloves'], ['fs1']),
    route('P2', 2, 'Loose fibres, no glue', [['steel-fibre', 100, 100]], [['residual-flexural', 3.1, 'pass'], ['flexural', 4.9, 'pass'], ['compressive', 39, 'pass']], [0.78, 0.9, 0.95, 0.85], ['Wire drawing', 'Hook-forming cutter'], ['Balling above 25 kg/m³'], ['fs1', 'fs2']),
    route('P3', 3, 'Heavier glue, slower release', [['steel-fibre', 98.8, 99.2], ['pva-glue', 0.8, 1.2]], [['residual-flexural', 2.8, 'borderline'], ['flexural', 4.7, 'borderline'], ['compressive', 40, 'pass']], [0.7, 0.75, 0.9, 0.74], ['Wire drawing', 'Hook-forming cutter', 'Glue bath'], ['Bundles survive mixing'], ['fs2']),
  ],
  balanceMaterial: 'steel-fibre', leverMaterial: 'steel-fibre',
  clusters: ['Aspect ratio and anchorage', 'Dosage vs fR3', 'Mixing and balling', 'Mesh replacement'],
  query: '("steel fibre" OR SFRC) AND ("residual flexural" OR fR3 OR "EN 14651") AND (slab OR "industrial floor")',
  sources: [
    src('fs1', 'Paper', 'Residual flexural strength of hooked-end SFRC at 20–40 kg/m³', 2021, 0.9, 'l/d 65 at 30 kg/m³ gave fR3 3.0–3.4 N/mm².', 'Dosage vs fR3'),
    src('fs2', 'Paper', 'Glued versus loose steel fibres: dispersion and balling', 2019, 0.8, 'Glued bundles removed balling up to 40 kg/m³.', 'Mixing and balling'),
  ],
  measured: ['residual-flexural', 'flexural', 'compressive'],
  mixingProtocol: ['Batch a reference M35 mix.', 'Add fibres on the aggregate belt at 30 kg/m³.', 'Mix 90 s extra; check for balls by wash-out.'],
  testPlan: [
    { test: 'Residual flexural (notched beam)', method: 'EN 14651', specimens: 6, ages: '28 d', dueInDays: 31 },
    { test: 'Compressive 28 d', method: 'IS 516', specimens: 3, ages: '28 d', dueInDays: 30 },
  ],
});

/* ---------- Cement grinding aids ---------- */

export const GA_GLYCOL: Scenario = {
  id: 'ga-glycol', label: 'Glycol cement grinding aid', chip: 'Grinding aid · glycol',
  example: 'Grinding aid to raise ball-mill output for OPC 53 at our cement plant',
  keywords: ['grinding aid', 'grinding', 'cement mill', 'ball mill', 'mill output', 'glycol'],
  projectName: 'Glycol grinding aid — OPC ball mill output', codePrefix: 'HX-GA',
  docType: 'Technical Data Sheet', productGuess: 'DEG / acetate cement grinding aid',
  categoryId: 'grinding-aids', subcategoryId: 'ga-glycol', chemistry: ['PCE/SNF'], form: 'liquid',
  standard: 'EN 197-1 (≤ 1 % additive)', standardAlt: 'ASTM C465',
  useCase: { cementType: 'OPC 53', millType: 'Ball mill (closed circuit)', blaineTarget: 3300, clinkerFactor: 95, dosagePct: [0.02, 0.05], climate: 'Hot-dry', standardClass: 'ASTM C465' },
  useCaseConfidence: { cementType: 0.9, millType: 0.84, blaineTarget: 0.8, clinkerFactor: 0.7, dosagePct: 0.78, climate: 0.66, standardClass: 0.84 },
  guided: [
    { id: 'mill', q: 'Which mill grinds the cement?', picture: 'Cog', answer: 0, options: [
      { label: 'Ball mill with separator', icon: 'Cog', sets: { millType: 'Ball mill (closed circuit)' } },
      { label: 'Ball mill, no separator', icon: 'Cylinder', sets: { millType: 'Ball mill (open circuit)' } },
      { label: 'Vertical roller mill', icon: 'Layers', sets: { millType: 'Vertical roller mill' } },
    ] },
    { id: 'cement', q: 'Which cement are you making?', picture: 'Box', answer: 0, options: [
      { label: 'OPC 53', icon: 'Box', sets: { cementType: 'OPC 53', clinkerFactor: 95 } },
      { label: 'PPC (fly ash)', icon: 'Layers', sets: { cementType: 'PPC', clinkerFactor: 65 } },
      { label: 'Slag cement', icon: 'Mountain', sets: { cementType: 'PSC', clinkerFactor: 45 } },
    ] },
  ],
  benchmarks: [bench('bm-ga', 'Benchmark G-A', 'ga-glycol', 'ASTM C465', 95, [['mill-output', 10, '%', 'Lab-tested'], ['blaine', 3300, 'cm²/g', 'Lab-tested'], ['residue-45', 8, '%', 'Lab-tested'], ['solids', 60, '%', 'TDS']])],
  targets: [
    { propertyId: 'mill-output', operator: '>=', value: 10, priority: 'must', reason: 't/h gain at equal Blaine', bench: 10, confidence: 0.82 },
    { propertyId: 'blaine', operator: 'between', value: [3200, 3400], priority: 'must', reason: 'Hold the product spec', bench: 3300, confidence: 0.88 },
    { propertyId: 'residue-45', operator: '<=', value: 8, priority: 'important', bench: 8, confidence: 0.82 },
    { propertyId: 'compressive', operator: '>=', value: 100, priority: 'important', reason: '% of blank cement at 28 d (EN 196-1)', confidence: 0.8 },
    { propertyId: 'chloride', operator: '<=', value: 0.1, priority: 'must', std: 'Cement chloride ≤ 0.1 % (EN 197-1)', stdMax: 0.1, confidence: 0.92 },
  ],
  top3: [{ id: 'mill-output', reason: 'Mill is the bottleneck — +10 % t/h' }, { id: 'cost', reason: 'Payback: ₹ per tonne vs kWh saved' }, { id: 'blaine', reason: 'Product spec must not drift' }],
  constraints: { costCeiling: 70, budgetBand: 'economy', materialLimits: [], compliance: ['No chlorides'], site: { tMin: 20, tMax: 50, rhMax: 60 }, mustHaves: ['No pack set in silos'], remark: 'Dosed on the mill feed belt, 1000 L IBC.' },
  summary: {
    scientist: '**Helix is formulating:** a **DEG / acetate grinding aid** to **ASTM C465** for **OPC 53 in a closed-circuit ball mill**, raising **mill output ≥ 10 %** at **Blaine 3200–3400 cm²/g**, at **≤ ₹ 70 / kg**.',
    plain: '**Helix is making:** a **liquid sprayed into the cement mill** so the plant **grinds more cement per hour** using the same power.',
  },
  pathways: [
    route('P1', 1, 'DEG + acetate + TEA', [['deg', 45, 50], ['na-acetate', 8, 10], ['tea', 5, 7], ['water', 33, 42]], [['mill-output', 11, 'pass'], ['blaine', 3320, 'pass'], ['compressive', 101, 'pass']], [0.9, 0.8, 0.9, 0.87], LIQUID_TANK, ['Glycol — not for drinking water lines'], ['ga1']),
    route('P2', 2, 'DEG only', [['deg', 60, 65], ['water', 35, 40]], [['mill-output', 8, 'borderline'], ['blaine', 3300, 'pass'], ['compressive', 99, 'pass']], [0.7, 0.9, 0.95, 0.82], LIQUID_TANK, ['Lower gain'], ['ga1', 'ga2']),
    route('P3', 3, 'DEG + high TEA', [['deg', 40, 45], ['tea', 12, 15], ['water', 40, 48]], [['mill-output', 12, 'pass'], ['blaine', 3350, 'pass'], ['setting-time', 25, 'borderline']], [0.84, 0.6, 0.85, 0.75], LIQUID_TANK, ['Quicker set, flash risk'], ['ga2']),
  ],
  balanceMaterial: 'water', leverMaterial: 'deg',
  clusters: ['Glycol adsorption', 'Agglomeration and coating', 'Amine synergy', 'Plant trials'],
  query: '("grinding aid" OR glycol OR triethanolamine) AND cement AND ("mill output" OR Blaine OR "specific energy")',
  sources: [
    src('ga1', 'Paper', 'Diethylene glycol grinding aids in closed-circuit ball mills', 2020, 0.88, '0.03 % DEG raised output 8–12 % at equal Blaine.', 'Glycol adsorption'),
    src('ga2', 'Paper', 'Synergy of TEA with glycols on separator efficiency', 2022, 0.82, 'Adding TEA raised output a further 2 % but shortened set.', 'Amine synergy'),
  ],
  measured: ['mill-output', 'blaine', 'residue-45', 'compressive'],
  mixingProtocol: ['Charge water.', 'Add DEG, sodium acetate and TEA; stir 30 min.', 'Check density, pH and solids; lab-mill test at 0.03 % on plant clinker.'],
  testPlan: [
    { test: 'Lab ball-mill grindability', method: 'Internal (5 kg mill)', specimens: 3, ages: '—', dueInDays: 3 },
    { test: 'Blaine and 45 µm residue', method: 'EN 196-6', specimens: 3, ages: '—', dueInDays: 3 },
    { test: 'Mortar strength 2/28 d', method: 'EN 196-1', specimens: 3, ages: '2 d, 28 d', dueInDays: 30 },
  ],
};

export const GA_AMINE = variant(GA_GLYCOL, {
  id: 'ga-amine', label: 'Amine cement performance enhancer', chip: 'Performance enhancer · TIPA',
  example: 'TIPA performance enhancer to cut clinker factor in PPC without losing 28-day strength',
  keywords: ['performance enhancer', 'strength enhancer', 'quality improver', 'tipa', 'clinker factor', 'clinker reduction'],
  projectName: 'TIPA strength enhancer — PPC clinker reduction', codePrefix: 'HX-GE',
  productGuess: 'TIPA / TEA amine-based cement performance enhancer', subcategoryId: 'ga-amine',
  useCase: { cementType: 'PPC', millType: 'Ball mill (closed circuit)', blaineTarget: 3600, clinkerFactor: 62, dosagePct: [0.04, 0.08], climate: 'Hot-dry', standardClass: 'ASTM C465' },
  benchmarks: [bench('bm-ge', 'Benchmark E-A', 'ga-amine', 'ASTM C465', 150, [['compressive', 108, '%', 'Lab-tested'], ['compressive-1d', 112, '%', 'Lab-tested'], ['mill-output', 5, '%', 'Lab-tested']])],
  targets: [
    { propertyId: 'compressive', operator: '>=', value: 106, priority: 'must', reason: '% of blank at 28 d — buys 3 points of clinker', bench: 108, confidence: 0.84 },
    { propertyId: 'compressive-1d', operator: '>=', value: 108, priority: 'important', reason: '% of blank at 2 d (EN 196-1)', bench: 112, confidence: 0.78 },
    { propertyId: 'mill-output', operator: '>=', value: 4, priority: 'nice', bench: 5, confidence: 0.74 },
    { propertyId: 'setting-time', operator: 'between', value: [-15, 30], priority: 'important', reason: 'Initial set change vs blank, min', confidence: 0.76 },
    { propertyId: 'chloride', operator: '<=', value: 0.1, priority: 'must', std: '≤ 0.1 % in cement', stdMax: 0.1, confidence: 0.92 },
  ],
  top3: [{ id: 'compressive', reason: '+6 % strength = −3 % clinker' }, { id: 'cost', reason: 'Must cost less than the clinker it saves' }, { id: 'setting-time', reason: 'TIPA can delay set' }],
  summary: {
    scientist: '**Helix is formulating:** a **TIPA / TEA performance enhancer** to **ASTM C465** for **PPC**, lifting **28 d mortar strength ≥ 106 % of blank** so the plant can **cut clinker by ~3 points**, at **≤ ₹ 120 / kg**.',
    plain: '**Helix is making:** a **liquid added at the cement mill** that makes **cement stronger**, so the plant can **use less clinker** and cut cost and CO₂.',
  },
  constraints: { costCeiling: 120, budgetBand: 'mid', materialLimits: [], compliance: ['No chlorides'], site: { tMin: 20, tMax: 50, rhMax: 60 }, mustHaves: ['No pack set in silos'], remark: 'Plant trial on mill 2 after lab approval.' },
  pathways: [
    route('P1', 1, 'TIPA + DEG carrier', [['tipa', 30, 35], ['deg', 20, 25], ['na-acetate', 4, 6], ['water', 34, 46]], [['compressive', 107, 'pass'], ['compressive-1d', 110, 'pass'], ['setting-time', 15, 'pass']], [0.9, 0.7, 0.85, 0.82], LIQUID_TANK, ['Amine — irritant'], ['ge1']),
    route('P2', 2, 'TEA-rich, early strength', [['tea', 25, 30], ['deg', 20, 25], ['water', 45, 55]], [['compressive', 103, 'borderline'], ['compressive-1d', 116, 'pass'], ['setting-time', -10, 'pass']], [0.75, 0.8, 0.9, 0.8], LIQUID_TANK, ['Late strength flat'], ['ge1', 'ge2']),
    route('P3', 3, 'TIPA + TEA blend', [['tipa', 20, 25], ['tea', 10, 12], ['deg', 15, 20], ['water', 43, 55]], [['compressive', 106, 'pass'], ['compressive-1d', 113, 'pass'], ['setting-time', 5, 'pass']], [0.88, 0.75, 0.85, 0.83], LIQUID_TANK, ['Amine — irritant'], ['ge2']),
  ],
  leverMaterial: 'tipa',
  clusters: ['TIPA and ferrite hydration', 'TEA early strength', 'Clinker substitution', 'Plant trials'],
  query: '(triisopropanolamine OR TIPA OR "performance enhancer") AND (PPC OR "blended cement") AND ("28-day strength" OR clinker)',
  sources: [
    src('ge1', 'Paper', 'TIPA and late strength of fly-ash blended cements', 2021, 0.89, '0.04 % TIPA added 6–9 % to 28 d strength.', 'TIPA and ferrite hydration'),
    src('ge2', 'Paper', 'TEA versus TIPA: early and late strength trade-off', 2019, 0.8, 'TEA favours 2 d, TIPA 28 d strength.', 'TEA early strength'),
  ],
  measured: ['compressive', 'compressive-1d', 'setting-time', 'mill-output'],
});

/* ---------- Curing compounds ---------- */

export const CUR_WAX: Scenario = {
  id: 'cur-wax', label: 'Wax-emulsion curing compound', chip: 'Curing compound · wax',
  example: 'White wax curing compound for highway pavement slabs in hot dry weather',
  keywords: ['curing compound', 'curing agent', 'curing membrane', 'wax curing', 'wax emulsion', 'c309'],
  projectName: 'Wax curing compound — Pavement slabs, hot-dry', codePrefix: 'HX-CU',
  docType: 'Technical Data Sheet', productGuess: 'White-pigmented paraffin-wax emulsion curing compound',
  categoryId: 'curing', subcategoryId: 'cur-wax', chemistry: ['acrylic'], form: 'liquid',
  standard: 'ASTM C309 Type 2', standardAlt: 'IS 456 §13.5',
  useCase: { element: 'Slab', formworkType: 'None (exposed slab)', concreteGrade: 'M30–M50', exposure: 'exterior', climate: 'Hot-dry', appTemp: [25, 45], method: 'Spray', standardClass: 'ASTM C309 Type 2' },
  useCaseConfidence: { element: 0.94, formworkType: 0.9, concreteGrade: 0.72, exposure: 0.92, climate: 0.86, appTemp: 0.8, method: 0.94, standardClass: 0.86 },
  guided: [
    { id: 'what', q: 'What are you curing?', picture: 'Square', answer: 0, options: [
      { label: 'Roads and open slabs', icon: 'Square', sets: { element: 'Slab', formworkType: 'None (exposed slab)' } },
      { label: 'Columns and walls after de-shuttering', icon: 'Columns3', sets: { element: 'Column / beam', formworkType: 'Plywood' } },
    ] },
    COMMON_GUIDED[1],
  ],
  benchmarks: [bench('bm-cu', 'Benchmark C-W', 'cur-wax', 'ASTM C309 Type 2', 110, [['moisture-loss', 0.45, 'kg/m²', 'TDS'], ['drying-time', 3, 'h', 'TDS'], ['solids', 30, '%', 'TDS'], ['voc', 20, 'g/L', 'TDS']])],
  targets: [
    { propertyId: 'moisture-loss', operator: '<=', value: 0.45, priority: 'must', std: '≤ 0.55 kg/m² in 72 h (ASTM C309)', stdMax: 0.55, bench: 0.45, confidence: 0.9 },
    { propertyId: 'drying-time', operator: '<=', value: 4, priority: 'important', std: '≤ 4 h (ASTM C309)', stdMax: 4, bench: 3, confidence: 0.86 },
    { propertyId: 'reflectance', operator: '>=', value: 60, priority: 'important', reason: 'White pigment for ASTM C309 Type 2', confidence: 0.78 },
    { propertyId: 'voc', operator: '<=', value: 50, priority: 'nice', bench: 20, confidence: 0.82 },
    { propertyId: 'solids', operator: 'between', value: [28, 34], priority: 'nice', bench: 30, confidence: 0.8 },
  ],
  top3: [{ id: 'moisture-loss', reason: '45 °C wind dries slabs in hours' }, { id: 'cost', reason: 'Highway jobs buy by the tonne' }, { id: 'reflectance', reason: 'White film keeps the slab cool' }],
  constraints: { costCeiling: 80, budgetBand: 'economy', materialLimits: [], compliance: ['Water-based'], site: { tMin: 25, tMax: 45, rhMax: 40 }, mustHaves: ['Sprayable with a knapsack sprayer'], remark: '200 L drums, 0.2 L/m² coverage.' },
  summary: {
    scientist: '**Helix is formulating:** a **white paraffin-wax emulsion curing compound** to **ASTM C309 Type 2** for **pavement slabs in hot-dry weather**, with **moisture loss ≤ 0.45 kg/m² in 72 h** and **dry in ≤ 4 h**, at **≤ ₹ 80 / kg**.',
    plain: '**Helix is making:** a **white liquid sprayed on fresh concrete roads** that **keeps the water in** so the slab **hardens properly** in the heat.',
  },
  pathways: [
    route('P1', 1, 'Wax emulsion + TiO₂', [['paraffin-emul', 55, 60], ['tio2-disp', 6, 8], ['emulsifier', 1, 1.5], ['biocide', 0.1, 0.1], ['water', 30.4, 37.9]], [['moisture-loss', 0.42, 'pass'], ['drying-time', 3, 'pass'], ['reflectance', 65, 'pass']], [0.9, 0.78, 0.9, 0.86], ['Low-shear mixer'], ['Slippery film on walkways'], ['cu1']),
    route('P2', 2, 'Lean wax, no pigment (Type 1)', [['paraffin-emul', 45, 50], ['emulsifier', 1, 1.5], ['biocide', 0.1, 0.1], ['water', 48.4, 53.9]], [['moisture-loss', 0.52, 'borderline'], ['drying-time', 2.5, 'pass'], ['reflectance', 20, 'fail']], [0.6, 0.95, 0.95, 0.76], ['Low-shear mixer'], ['Not Type 2'], ['cu1', 'cu2']),
    route('P3', 3, 'Wax + acrylic hybrid', [['paraffin-emul', 40, 45], ['acrylic-emul', 12, 15], ['tio2-disp', 6, 8], ['emulsifier', 1, 1.5], ['biocide', 0.1, 0.1], ['water', 30.4, 40.9]], [['moisture-loss', 0.38, 'pass'], ['drying-time', 3.5, 'pass'], ['reflectance', 66, 'pass']], [0.92, 0.6, 0.85, 0.8], ['Low-shear mixer'], ['Harder to remove before overlay'], ['cu2']),
  ],
  balanceMaterial: 'water', leverMaterial: 'paraffin-emul',
  clusters: ['Wax film continuity', 'Reflectance and slab temperature', 'Application rate', 'Removal before overlay'],
  query: '("curing compound" OR "wax emulsion") AND concrete AND ("moisture loss" OR "ASTM C309") AND "hot weather"',
  sources: [
    src('cu1', 'Paper', 'Paraffin emulsion curing compounds at 40–45 °C', 2021, 0.88, '55 % emulsion at 0.2 L/m² held moisture loss to 0.43 kg/m².', 'Wax film continuity'),
    src('cu2', 'Paper', 'White-pigmented curing and slab surface temperature', 2020, 0.8, 'TiO₂ films kept slab surface 6–8 °C cooler.', 'Reflectance and slab temperature'),
  ],
  measured: ['moisture-loss', 'drying-time', 'reflectance', 'solids'],
  mixingProtocol: ['Charge water and emulsifier; low-shear stir.', 'Add wax emulsion slowly, then TiO₂ dispersion.', 'Add biocide; stir 15 min; check solids and viscosity.'],
  testPlan: [
    { test: 'Moisture loss (72 h)', method: 'ASTM C156', specimens: 3, ages: '72 h', dueInDays: 4 },
    { test: 'Drying time', method: 'ASTM C309 §8', specimens: 2, ages: '—', dueInDays: 1 },
    { test: 'Daylight reflectance', method: 'ASTM E1347', specimens: 2, ages: '—', dueInDays: 2 },
  ],
};

export const CUR_RESIN = variant(CUR_WAX, {
  id: 'cur-resin', label: 'Resin-based curing compound', chip: 'Curing compound · resin',
  example: 'Acrylic resin curing compound for bridge decks that will be waterproofed later',
  keywords: ['resin curing', 'resin-based curing', 'acrylic curing', 'curing and sealing', 'cure and seal'],
  projectName: 'Acrylic resin curing compound — Bridge decks', codePrefix: 'HX-CR',
  productGuess: 'Water-based acrylic resin curing compound', subcategoryId: 'cur-resin',
  standard: 'ASTM C309 Type 1-D', standardAlt: 'ASTM C1315',
  useCase: { element: 'Slab', formworkType: 'None (exposed slab)', concreteGrade: 'M30–M50', exposure: 'exterior', climate: 'Hot-humid', appTemp: [15, 40], method: 'Spray', standardClass: 'ASTM C309 Type 1-D' },
  benchmarks: [bench('bm-cr', 'Benchmark C-R', 'cur-resin', 'ASTM C309', 140, [['moisture-loss', 0.4, 'kg/m²', 'TDS'], ['drying-time', 2, 'h', 'TDS'], ['solids', 22, '%', 'TDS'], ['voc', 60, 'g/L', 'TDS']])],
  targets: [
    { propertyId: 'moisture-loss', operator: '<=', value: 0.4, priority: 'must', std: '≤ 0.55 kg/m² in 72 h (ASTM C309)', stdMax: 0.55, bench: 0.4, confidence: 0.88 },
    { propertyId: 'drying-time', operator: '<=', value: 3, priority: 'important', std: '≤ 4 h', stdMax: 4, bench: 2, confidence: 0.84 },
    { propertyId: 'voc', operator: '<=', value: 100, priority: 'must', std: '≤ 350 g/L (ASTM C1315)', stdMax: 350, bench: 60, confidence: 0.86 },
    { propertyId: 'solids', operator: 'between', value: [20, 26], priority: 'nice', bench: 22, confidence: 0.8 },
  ],
  top3: [{ id: 'moisture-loss', reason: 'Deck cracking risk' }, { id: 'drying-time', reason: 'Traffic of crews on the deck' }, { id: 'cost', reason: 'Benchmark at ₹ 140/kg' }],
  constraints: { costCeiling: 95, budgetBand: 'mid', materialLimits: [], compliance: ['Water-based', 'Compatible with later waterproofing'], site: { tMin: 15, tMax: 40, rhMax: 95 }, mustHaves: ['No removal needed before membrane'], remark: '20 L pails.' },
  summary: {
    scientist: '**Helix is formulating:** a **water-based acrylic curing compound** to **ASTM C309 Type 1-D** for **bridge decks**, with **moisture loss ≤ 0.40 kg/m²** and **no removal before waterproofing**, at **≤ ₹ 95 / kg**.',
    plain: '**Helix is making:** a **clear sprayed film** that **keeps fresh bridge-deck concrete wet** and **does not need scraping off** before waterproofing.',
  },
  pathways: [
    route('P1', 1, 'Styrene-acrylic + coalescent', [['acrylic-emul', 45, 50], ['coalescent', 1.5, 2], ['liq-defoamer', 0.2, 0.3], ['biocide', 0.1, 0.1], ['water', 47.6, 53.2]], [['moisture-loss', 0.39, 'pass'], ['drying-time', 2, 'pass'], ['voc', 45, 'pass']], [0.9, 0.75, 0.9, 0.85], ['Low-shear mixer'], ['Clogs nozzles if left to dry'], ['cr1']),
    route('P2', 2, 'Acrylic + wax booster', [['acrylic-emul', 35, 40], ['paraffin-emul', 10, 12], ['coalescent', 1, 1.5], ['biocide', 0.1, 0.1], ['water', 46.4, 53.9]], [['moisture-loss', 0.36, 'pass'], ['drying-time', 2.5, 'pass'], ['voc', 35, 'pass']], [0.86, 0.8, 0.9, 0.85], ['Low-shear mixer'], ['Wax may hurt membrane bond'], ['cr1', 'cr2']),
    route('P3', 3, 'Lean acrylic', [['acrylic-emul', 32, 36], ['coalescent', 1, 1.5], ['biocide', 0.1, 0.1], ['water', 62.4, 66.9]], [['moisture-loss', 0.5, 'borderline'], ['drying-time', 1.5, 'pass'], ['voc', 30, 'pass']], [0.62, 0.95, 0.95, 0.77], ['Low-shear mixer'], ['Thin film'], ['cr2']),
  ],
  leverMaterial: 'acrylic-emul',
  clusters: ['Film formation', 'Moisture retention', 'Bond of later coatings', 'VOC'],
  measured: ['moisture-loss', 'drying-time', 'voc', 'solids'],
  query: '("resin curing compound" OR "acrylic curing") AND concrete AND ("moisture loss" OR "ASTM C309") AND (overlay OR waterproofing)',
  sources: [
    src('cr1', 'Paper', 'Acrylic curing membranes and moisture retention', 2022, 0.86, '45 % solids acrylic at 0.2 L/m² gave 0.38 kg/m² loss.', 'Moisture retention'),
    src('cr2', 'Paper', 'Effect of curing compounds on bond of deck waterproofing', 2020, 0.82, 'Wax-containing films cut membrane pull-off by 40 %.', 'Bond of later coatings'),
  ],
});

/* ---------- Release agents ---------- */

export const REL_OIL: Scenario = {
  id: 'rel-oil', label: 'Mineral-oil release agent', chip: 'Release agent · oil',
  example: 'Formwork release oil for plywood shuttering on a high-rise site',
  keywords: ['release agent', 'release oil', 'form release', 'formwork oil', 'shuttering oil', 'mould release', 'mold release', 'de-shuttering'],
  projectName: 'Mineral-oil release agent — Plywood shuttering', codePrefix: 'HX-RO',
  docType: 'Technical Data Sheet', productGuess: 'Chemically active mineral-oil formwork release agent',
  categoryId: 'release', subcategoryId: 'rel-oil', chemistry: ['acrylic'], form: 'liquid',
  standard: 'Internal', standardAlt: 'ACI 347R',
  useCase: { element: 'Wall', formworkType: 'Plywood', reuseCycles: 8, concreteGrade: 'M30–M50', exposure: 'exterior', climate: 'Hot-humid', appTemp: [15, 40], method: 'Spray', standardClass: 'ACI 347R' },
  useCaseConfidence: { element: 0.8, formworkType: 0.92, reuseCycles: 0.7, concreteGrade: 0.66, exposure: 0.8, climate: 0.7, appTemp: 0.78, method: 0.9, standardClass: 0.7 },
  guided: [
    { id: 'form', q: 'What are the moulds made of?', picture: 'Layers', answer: 0, options: [
      { label: 'Plywood', icon: 'Layers', sets: { formworkType: 'Plywood', reuseCycles: 8 } },
      { label: 'Steel', icon: 'Box', sets: { formworkType: 'Steel', reuseCycles: 100 } },
      { label: 'Aluminium', icon: 'Building', sets: { formworkType: 'Aluminium', reuseCycles: 150 } },
    ] },
    COMMON_GUIDED[1],
  ],
  benchmarks: [bench('bm-ro', 'Benchmark O', 'rel-oil', 'Internal', 110, [['release-efficiency', 95, '%', 'Lab-tested'], ['viscosity', 25, 'mPa·s', 'TDS'], ['voc', 180, 'g/L', 'TDS'], ['shelf-life', 24, 'months', 'TDS']])],
  targets: [
    { propertyId: 'release-efficiency', operator: '>=', value: 95, priority: 'must', reason: 'Clean area after strip, % — no staining, minimal blowholes', bench: 95, confidence: 0.84 },
    { propertyId: 'viscosity', operator: 'between', value: [15, 35], priority: 'important', reason: 'Sprays without dripping on vertical forms', bench: 25, confidence: 0.82 },
    { propertyId: 'voc', operator: '<=', value: 250, priority: 'important', bench: 180, confidence: 0.8 },
    { propertyId: 'shelf-life', operator: '>=', value: 18, priority: 'nice', bench: 24, confidence: 0.86 },
  ],
  top3: [{ id: 'release-efficiency', reason: 'Fair-face finish without patching' }, { id: 'cost', reason: 'Bought by the barrel — ₹/m² of form' }, { id: 'viscosity', reason: 'Sprayed thin on vertical plywood' }],
  constraints: { costCeiling: 85, budgetBand: 'economy', materialLimits: [], compliance: [], site: { tMin: 15, tMax: 40, rhMax: 95 }, mustHaves: ['No staining on fair-face concrete'], remark: '210 L barrel, 30–40 m²/L.' },
  summary: {
    scientist: '**Helix is formulating:** a **chemically active mineral-oil release agent** for **plywood shuttering**, giving **≥ 95 % clean release** at **15–35 mPa·s**, at **≤ ₹ 85 / kg**.',
    plain: '**Helix is making:** an **oil sprayed on wooden moulds** so **concrete comes off cleanly** and the moulds can be **reused**.',
  },
  pathways: [
    route('P1', 1, 'Base oil + 8 % fatty ester', [['mineral-oil', 88, 91], ['fatty-ester', 7, 9], ['emulsifier', 1, 2]], [['release-efficiency', 96, 'pass'], ['viscosity', 24, 'pass'], ['voc', 150, 'pass']], [0.9, 0.8, 0.95, 0.88], ['Paddle mixer'], ['Flammable mist — no hot work'], ['ro1']),
    route('P2', 2, 'Plain base oil', [['mineral-oil', 99, 100]], [['release-efficiency', 88, 'fail'], ['viscosity', 22, 'pass'], ['voc', 200, 'pass']], [0.55, 0.95, 0.95, 0.74], ['Paddle mixer'], ['Blowholes and staining'], ['ro1', 'ro2']),
    route('P3', 3, 'High-ester premium', [['mineral-oil', 80, 84], ['fatty-ester', 14, 18], ['emulsifier', 1, 2]], [['release-efficiency', 98, 'pass'], ['viscosity', 28, 'pass'], ['voc', 140, 'pass']], [0.94, 0.6, 0.9, 0.8], ['Paddle mixer'], ['Over cost ceiling risk'], ['ro2']),
  ],
  balanceMaterial: 'mineral-oil', leverMaterial: 'fatty-ester',
  clusters: ['Chemical release (soap formation)', 'Film thickness and blowholes', 'Formwork type', 'VOC'],
  query: '("release agent" OR "form release") AND concrete AND (blowholes OR "surface quality") AND (ester OR "mineral oil")',
  sources: [
    src('ro1', 'Paper', 'Fatty-acid esters as reactive release agents', 2020, 0.87, '7–9 % ester cut blowhole area 60 % on plywood.', 'Chemical release (soap formation)'),
    src('ro2', 'Paper', 'Release agent film thickness and fair-face concrete quality', 2018, 0.79, 'Films above 20 µm caused staining and dusting.', 'Film thickness and blowholes'),
  ],
  measured: ['release-efficiency', 'viscosity', 'voc'],
  mixingProtocol: ['Charge base oil.', 'Add fatty ester and emulsifier under paddle stirring.', 'Stir 20 min; check viscosity at 25 °C.'],
  testPlan: [
    { test: 'Release on plywood panels', method: 'Internal (300 × 300 mm panels)', specimens: 3, ages: '1 d', dueInDays: 2 },
    { test: 'Viscosity', method: 'EN ISO 2555', specimens: 2, ages: '—', dueInDays: 1 },
  ],
};

export const REL_EMUL = variant(REL_OIL, {
  id: 'rel-emul', label: 'Emulsion release agent', chip: 'Release agent · emulsion',
  example: 'Water-based release emulsion for steel moulds in a precast yard',
  keywords: ['release emulsion', 'emulsion release', 'water-based release', 'precast mould', 'steel mould'],
  projectName: 'Water-based release emulsion — Precast steel moulds', codePrefix: 'HX-RE',
  productGuess: 'Water-based mineral-oil emulsion release agent', subcategoryId: 'rel-emul',
  useCase: { element: 'Precast element', formworkType: 'Steel', reuseCycles: 200, concreteGrade: 'Precast', exposure: 'interior', climate: 'Composite', appTemp: [10, 40], method: 'Spray', standardClass: 'ACI 347R' },
  benchmarks: [bench('bm-re', 'Benchmark E-R', 'rel-emul', 'Internal', 70, [['release-efficiency', 94, '%', 'Lab-tested'], ['viscosity', 30, 'mPa·s', 'TDS'], ['voc', 10, 'g/L', 'TDS'], ['shelf-life', 9, 'months', 'TDS']])],
  targets: [
    { propertyId: 'release-efficiency', operator: '>=', value: 94, priority: 'must', reason: 'Clean area after strip, %', bench: 94, confidence: 0.84 },
    { propertyId: 'voc', operator: '<=', value: 30, priority: 'must', reason: 'Indoor precast hall', bench: 10, confidence: 0.86 },
    { propertyId: 'shelf-life', operator: '>=', value: 9, priority: 'important', reason: 'Emulsion must not split in storage', bench: 9, confidence: 0.8 },
    { propertyId: 'viscosity', operator: 'between', value: [20, 40], priority: 'nice', bench: 30, confidence: 0.8 },
  ],
  top3: [{ id: 'release-efficiency', reason: 'Architectural precast finish' }, { id: 'voc', reason: 'Workers in a closed hall' }, { id: 'cost', reason: 'Diluted 1:5 on site' }],
  constraints: { costCeiling: 50, budgetBand: 'economy', materialLimits: [], compliance: ['Water-based'], site: { tMin: 10, tMax: 40, rhMax: 90 }, mustHaves: ['No rust on steel moulds'], remark: 'Concentrate, diluted 1:5 with water.' },
  summary: {
    scientist: '**Helix is formulating:** a **water-based oil-emulsion release agent** for **precast steel moulds**, giving **≥ 94 % clean release** with **VOC ≤ 30 g/L** and **9-month emulsion stability**, at **≤ ₹ 50 / kg**.',
    plain: '**Helix is making:** a **low-smell, water-based release** for **steel precast moulds** that comes off clean and **doesn\'t rust the moulds**.',
  },
  pathways: [
    route('P1', 1, 'Oil + ester emulsion', [['mineral-oil', 35, 40], ['fatty-ester', 4, 6], ['emulsifier', 3, 4], ['biocide', 0.1, 0.1], ['water', 49.9, 57.9]], [['release-efficiency', 95, 'pass'], ['voc', 8, 'pass'], ['shelf-life', 10, 'pass']], [0.9, 0.8, 0.9, 0.87], ['High-shear emulsifier'], ['Splits if frozen'], ['re1']),
    route('P2', 2, 'Lean oil emulsion', [['mineral-oil', 25, 30], ['emulsifier', 2.5, 3], ['biocide', 0.1, 0.1], ['water', 66.9, 72.4]], [['release-efficiency', 89, 'fail'], ['voc', 5, 'pass'], ['shelf-life', 8, 'borderline']], [0.6, 0.95, 0.95, 0.77], ['High-shear emulsifier'], ['Staining'], ['re1']),
    route('P3', 3, 'Oil + ester, extra emulsifier', [['mineral-oil', 35, 40], ['fatty-ester', 4, 6], ['emulsifier', 5, 6], ['biocide', 0.1, 0.1], ['water', 47.9, 55.9]], [['release-efficiency', 94, 'pass'], ['voc', 9, 'pass'], ['shelf-life', 14, 'pass']], [0.88, 0.75, 0.9, 0.84], ['High-shear emulsifier'], ['Foams on spraying'], ['re1']),
  ],
  balanceMaterial: 'water', leverMaterial: 'emulsifier',
  clusters: ['Emulsion stability', 'Release on steel', 'Corrosion of moulds', 'VOC'],
  query: '("release agent" emulsion) AND precast AND ("steel mould" OR "surface quality") AND stability',
  sources: [
    src('re1', 'Paper', 'Emulsion release agents for precast steel moulds', 2021, 0.84, '35–40 % oil with 4–6 % ester matched neat-oil release.', 'Release on steel'),
  ],
  mixingProtocol: ['Charge water and emulsifier; high-shear at 3000 rpm.', 'Add premixed oil + ester slowly over 10 min.', 'Add biocide; check droplet size and stability at 50 °C for 7 days.'],
});

/** Routing order: each variant before the scenario whose keywords it overlaps (alkaline before alkali-free shotcrete, steel before PP fibre…). */
export const CONCRETE_ROUTE_ORDER: Scenario[] = [ADM_WP, CUR_RESIN, CUR_WAX, SC_ALK, SC_AF, ADM_ACC, ADM_RETARDER, ADM_AIR, ADM_CI, ADM_PLAST, FIB_STEEL, FIB_PP, GA_AMINE, GA_GLYCOL, REL_EMUL, REL_OIL];

export const CONCRETE_SCENARIOS: Scenario[] = [ADM_PLAST, ADM_RETARDER, ADM_ACC, ADM_AIR, ADM_WP, ADM_CI, SC_AF, SC_ALK, FIB_PP, FIB_STEEL, GA_GLYCOL, GA_AMINE, CUR_WAX, CUR_RESIN, REL_OIL, REL_EMUL];
