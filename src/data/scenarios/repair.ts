import type { Scenario } from './types';
import { COMMON_GUIDED, speedQuestion } from './guided';
import { bench, midCost, pw, src, variant } from './build';

/** Group 5 — Repair, strengthening and protection. One full scenario per category, a variant per sibling subcategory. Demo data — for R&D to confirm. */

type Comp = [string, number, number][];
const route = (id: string, rank: number, name: string, comp: Comp, predicted: Parameters<typeof pw>[4], s: Parameters<typeof pw>[5], equipment: string[], hazards: string[], citations: string[]) =>
  pw(id, rank, name, comp, predicted, s, midCost(comp), equipment, hazards, citations);

const BLENDER = ['Ploughshare mixer'];
const RESIN_KIT = ['Planetary mixer (A)', 'Drum filler (B)'];
const dryMix = (actives: string) => ['Pre-blend fine additives.', `Charge sand and binder; add the pre-blend (${actives}); mix 4 min.`, 'Mix with water at the declared ratio for 3 min with a slow drill.'];

/* ---------- Repair mortars ---------- */

export const RM_R4: Scenario = {
  id: 'rm-r4', label: 'R4 structural repair mortar', chip: 'Repair mortar · R4',
  example: 'R4 structural repair mortar for spalled concrete beams and columns',
  keywords: ['r4', 'structural repair', 'repair mortar', 'concrete repair', 'patch repair', 'spalled', 'spalling', 'repair'],
  projectName: 'R4 repair mortar — Spalled beams and columns', codePrefix: 'HX-R4',
  docType: 'Technical Data Sheet', productGuess: 'Polymer-modified fibre-reinforced R4 structural repair mortar',
  categoryId: 'repair-mortars', subcategoryId: 'rm-r4', chemistry: ['polymer-modified'], form: 'powder',
  standard: 'EN 1504-3 R4', standardAlt: 'ASTM C928',
  useCase: { substrate: 'Concrete', element: 'Column / beam', thicknessMm: 40, flowClass: 'Trowel (non-flowing)', exposure: 'exterior', climate: 'Hot-humid', appTemp: [10, 40], load: 'None', method: 'Hand trowel', timeToServiceH: 24, standardClass: 'EN 1504-3 R4' },
  useCaseConfidence: { substrate: 0.95, element: 0.9, thicknessMm: 0.76, flowClass: 0.86, exposure: 0.88, climate: 0.7, appTemp: 0.78, load: 0.7, method: 0.9, timeToServiceH: 0.66, standardClass: 0.9 },
  guided: [
    { id: 'what', q: 'What are you repairing?', picture: 'Hammer', answer: 0, options: [
      { label: 'Spalled beam or column', icon: 'Columns3', sets: { element: 'Column / beam', thicknessMm: 40 } },
      { label: 'Slab underside (overhead)', icon: 'Layers', sets: { element: 'Slab', thicknessMm: 25 } },
      { label: 'Bridge or parking deck', icon: 'Truck', sets: { element: 'Slab', thicknessMm: 50, load: 'Heavy vehicular' } },
    ] },
    COMMON_GUIDED[1],
  ],
  benchmarks: [bench('bm-r4', 'Benchmark R-4', 'rm-r4', 'EN 1504-3 R4', 32, [['compressive', 52, 'N/mm²', 'TDS'], ['pull-off', 2.2, 'N/mm²', 'TDS'], ['modulus', 22, 'GPa', 'TDS'], ['shrinkage', 0.8, 'mm/m', 'Lab-tested']])],
  targets: [
    { propertyId: 'compressive', operator: '>=', value: 45, priority: 'must', std: '≥ 45 (R4)', stdMin: 45, bench: 52, confidence: 0.94 },
    { propertyId: 'pull-off', operator: '>=', value: 2, priority: 'must', std: '≥ 2.0 (R4)', stdMin: 2, bench: 2.2, confidence: 0.92 },
    { propertyId: 'modulus', operator: '>=', value: 20, priority: 'important', std: '≥ 20 GPa (R4)', stdMin: 20, bench: 22, confidence: 0.86 },
    { propertyId: 'shrinkage', operator: '<=', value: 1, priority: 'important', reason: 'Restrained shrinkage — no debonding', bench: 0.8, confidence: 0.8 },
    { propertyId: 'chloride', operator: '<=', value: 0.05, priority: 'must', std: '≤ 0.05 %', stdMax: 0.05, confidence: 0.92 },
  ],
  top3: [{ id: 'pull-off', reason: 'Repairs fail at the bond line' }, { id: 'compressive', reason: 'R4 for load-bearing members' }, { id: 'cost', reason: 'Benchmark at ₹ 32/kg' }],
  constraints: { costCeiling: 14, budgetBand: 'mid', materialLimits: [], compliance: ['No chlorides'], site: { tMin: 10, tMax: 40, rhMax: 95 }, mustHaves: ['Up to 50 mm per layer without formwork'], remark: '25 kg bag.' },
  summary: {
    scientist: '**Helix is formulating:** a **fibre-reinforced polymer-modified R4 repair mortar** to **EN 1504-3** for **spalled beams and columns**, with **≥ 45 N/mm²**, **bond ≥ 2.0 N/mm²** and **modulus ≥ 20 GPa**, at **≤ ₹ 14 / kg**.',
    plain: '**Helix is making:** a **strong patching mortar** that **rebuilds broken concrete** on beams and columns and **stays stuck** to the old concrete.',
  },
  pathways: [
    route('P1', 1, 'OPC + silica fume + RDP + PP fibre', [['opc53', 30, 34], ['sand', 58, 64], ['silica-fume', 3, 5], ['vae-rdp', 1, 1.5], ['pp-fibre', 0.1, 0.15], ['mhec', 0.1, 0.15], ['pce-powder', 0.2, 0.3], ['expansion', 0.3, 0.5]], [['compressive', 52, 'pass'], ['pull-off', 2.2, 'pass'], ['modulus', 22, 'pass']], [0.9, 0.8, 0.9, 0.86], BLENDER, ['Alkaline dust — mask'], ['r4a', 'r4b']),
    route('P2', 2, 'No polymer', [['opc53', 32, 36], ['sand', 58, 64], ['silica-fume', 3, 5], ['pp-fibre', 0.1, 0.15], ['mhec', 0.1, 0.15], ['pce-powder', 0.2, 0.3]], [['compressive', 55, 'pass'], ['pull-off', 1.6, 'fail'], ['modulus', 25, 'pass']], [0.6, 0.92, 0.9, 0.78], BLENDER, ['Debonds under thermal cycling'], ['r4a']),
    route('P3', 3, 'High polymer', [['opc53', 30, 33], ['sand', 58, 62], ['silica-fume', 3, 5], ['vae-rdp', 2.5, 3], ['pp-fibre', 0.1, 0.15], ['mhec', 0.12, 0.15], ['pce-powder', 0.2, 0.3]], [['compressive', 46, 'pass'], ['pull-off', 2.5, 'pass'], ['modulus', 18, 'fail']], [0.72, 0.7, 0.9, 0.76], BLENDER, ['Too soft for R4 modulus'], ['r4b']),
  ],
  balanceMaterial: 'sand', leverMaterial: 'vae-rdp',
  clusters: ['Polymer and bond', 'Silica fume and density', 'Shrinkage and fibres', 'Modulus compatibility'],
  query: '("repair mortar" R4 OR "EN 1504-3") AND (bond OR "pull-off") AND ("silica fume" OR polymer) AND shrinkage',
  sources: [
    src('r4a', 'Paper', 'Silica fume and polymer in R4 repair mortars', 2021, 0.88, '4 % silica fume with 1.2 % RDP gave 52 N/mm² and 2.2 N/mm² bond.', 'Polymer and bond'),
    src('r4b', 'Paper', 'Modulus mismatch and failure of concrete repairs', 2019, 0.8, 'Repairs below 20 GPa shed load and cracked at the interface.', 'Modulus compatibility'),
  ],
  measured: ['compressive', 'pull-off', 'modulus', 'shrinkage'],
  mixingProtocol: dryMix('RDP, fibre, MHEC, PCE, expansion agent'),
  testPlan: [
    { test: 'Compressive 28 d', method: 'EN 12190', specimens: 3, ages: '28 d', dueInDays: 30 },
    { test: 'Adhesive bond', method: 'EN 1542', specimens: 5, ages: '28 d', dueInDays: 30 },
    { test: 'Elastic modulus', method: 'EN 13412', specimens: 3, ages: '28 d', dueInDays: 30 },
  ],
};

export const RM_R3 = variant(RM_R4, {
  id: 'rm-r3', label: 'R3 lightweight repair mortar', chip: 'Repair mortar · R3',
  example: 'Lightweight R3 repair mortar for overhead slab repairs without formwork',
  keywords: ['r3', 'lightweight repair', 'overhead repair', 'r3 repair', 'light repair mortar'],
  projectName: 'R3 lightweight repair — Overhead slabs', codePrefix: 'HX-R3',
  productGuess: 'Lightweight polymer-modified R3 repair mortar', subcategoryId: 'rm-r3',
  standard: 'EN 1504-3 R3', standardAlt: 'ASTM C928',
  useCase: { substrate: 'Concrete', element: 'Slab', thicknessMm: 30, flowClass: 'Trowel (non-flowing)', exposure: 'interior', climate: 'Hot-humid', appTemp: [10, 40], load: 'None', method: 'Hand trowel', timeToServiceH: 24, standardClass: 'EN 1504-3 R3' },
  benchmarks: [bench('bm-r3', 'Benchmark R-3', 'rm-r3', 'EN 1504-3 R3', 28, [['compressive', 30, 'N/mm²', 'TDS'], ['pull-off', 1.7, 'N/mm²', 'TDS'], ['modulus', 16, 'GPa', 'TDS'], ['fresh-density', 1650, 'kg/m³', 'TDS']])],
  targets: [
    { propertyId: 'compressive', operator: '>=', value: 25, priority: 'must', std: '≥ 25 (R3)', stdMin: 25, bench: 30, confidence: 0.92 },
    { propertyId: 'pull-off', operator: '>=', value: 1.5, priority: 'must', std: '≥ 1.5 (R3)', stdMin: 1.5, bench: 1.7, confidence: 0.9 },
    { propertyId: 'modulus', operator: '>=', value: 15, priority: 'important', std: '≥ 15 GPa (R3)', stdMin: 15, bench: 16, confidence: 0.84 },
    { propertyId: 'fresh-density', operator: '<=', value: 1700, priority: 'important', reason: 'Light enough to build 30 mm overhead', bench: 1650, confidence: 0.8 },
  ],
  top3: [{ id: 'fresh-density', reason: 'Overhead layers fall off if heavy' }, { id: 'pull-off', reason: 'Bond carries the weight' }, { id: 'cost', reason: 'Benchmark at ₹ 28/kg' }],
  constraints: { costCeiling: 13, budgetBand: 'mid', materialLimits: [], compliance: ['No chlorides'], site: { tMin: 10, tMax: 40, rhMax: 95 }, mustHaves: ['30 mm overhead in one layer'], remark: '20 kg bag.' },
  summary: {
    scientist: '**Helix is formulating:** a **lightweight R3 repair mortar** to **EN 1504-3** for **overhead slab repairs**, with **≥ 25 N/mm²**, **bond ≥ 1.5 N/mm²** and **fresh density ≤ 1700 kg/m³**, at **≤ ₹ 13 / kg**.',
    plain: '**Helix is making:** a **light patching mortar** that **sticks to the underside of slabs** in thick layers without falling off.',
  },
  pathways: [
    route('P1', 1, 'Perlite-lightened, polymer-modified', [['opc53', 28, 32], ['sand', 50, 56], ['perlite', 4, 6], ['vae-rdp', 1.5, 2], ['pp-fibre', 0.1, 0.15], ['mhec', 0.15, 0.2], ['caco3', 8, 12]], [['compressive', 29, 'pass'], ['pull-off', 1.7, 'pass'], ['fresh-density', 1640, 'pass']], [0.9, 0.82, 0.88, 0.86], BLENDER, ['Alkaline dust — mask'], ['r3a']),
    route('P2', 2, 'Dense, no perlite', [['opc53', 30, 33], ['sand', 60, 65], ['vae-rdp', 1.5, 2], ['pp-fibre', 0.1, 0.15], ['mhec', 0.15, 0.2], ['caco3', 3, 5]], [['compressive', 34, 'pass'], ['pull-off', 1.8, 'pass'], ['fresh-density', 1950, 'fail']], [0.7, 0.9, 0.9, 0.82], BLENDER, ['Sags overhead'], ['r3a']),
    route('P3', 3, 'High perlite', [['opc53', 28, 31], ['sand', 46, 52], ['perlite', 8, 10], ['vae-rdp', 2, 2.5], ['pp-fibre', 0.1, 0.15], ['mhec', 0.18, 0.22], ['caco3', 8, 10]], [['compressive', 22, 'fail'], ['pull-off', 1.6, 'pass'], ['fresh-density', 1450, 'pass']], [0.66, 0.75, 0.88, 0.74], BLENDER, ['Below R3 strength'], ['r3a']),
  ],
  leverMaterial: 'vae-rdp',
  clusters: ['Lightweight aggregates', 'Overhead build-up', 'Polymer and bond', 'Strength vs density'],
  query: '("lightweight repair mortar" OR R3) AND (overhead OR thickness) AND (perlite OR density) AND bond',
  sources: [src('r3a', 'Paper', 'Perlite in lightweight R3 repair mortars', 2020, 0.84, '5 % perlite cut density to 1650 kg/m³ at 29 N/mm².', 'Lightweight aggregates')],
  measured: ['compressive', 'pull-off', 'modulus', 'fresh-density'],
  mixingProtocol: dryMix('RDP, fibre, MHEC'),
});

/* ---------- Structural injection resins ---------- */

export const IR_EPOXY: Scenario = {
  id: 'ir-epoxy', label: 'Low-viscosity epoxy crack injection', chip: 'Epoxy crack injection',
  example: 'Low-viscosity epoxy injection to re-bond structural cracks in a beam',
  keywords: ['epoxy injection', 'crack injection', 'structural injection', 'injection resin', 'low-viscosity epoxy', 'low viscosity epoxy', 'crack filling', 'epoxy crack', 'rebond cracks', 're-bond cracks'],
  projectName: 'Epoxy crack injection — Structural members', codePrefix: 'HX-EI',
  docType: 'Technical Data Sheet', productGuess: '2-component low-viscosity Bisphenol-F epoxy injection resin',
  categoryId: 'inj-resins', subcategoryId: 'ir-epoxy', chemistry: ['epoxy'], form: '2-component',
  standard: 'EN 1504-5', standardAlt: 'ASTM C881 Type IV Grade 1',
  useCase: { substrate: 'Concrete', element: 'Column / beam', crackWidthMm: 0.3, leakState: 'Dry', depthMm: 300, exposure: 'interior', climate: 'Hot-humid', appTemp: [10, 35], method: 'Injection', standardClass: 'EN 1504-5' },
  useCaseConfidence: { substrate: 0.95, element: 0.88, crackWidthMm: 0.76, leakState: 0.86, depthMm: 0.62, exposure: 0.8, climate: 0.68, appTemp: 0.78, method: 0.96, standardClass: 0.86 },
  guided: [
    { id: 'width', q: 'How wide are the cracks?', picture: 'Syringe', answer: 0, options: [
      { label: 'Hairline (under 0.3 mm)', icon: 'Minus', sets: { crackWidthMm: 0.2 } },
      { label: 'Visible (0.3–1 mm)', icon: 'Equal', sets: { crackWidthMm: 0.5 } },
      { label: 'Wide (over 1 mm)', icon: 'Rows3', sets: { crackWidthMm: 2 } },
    ] },
    COMMON_GUIDED[1],
  ],
  benchmarks: [bench('bm-ei', 'Benchmark E-I', 'ir-epoxy', 'ASTM C881 IV-1', 520, [['viscosity', 180, 'mPa·s', 'TDS'], ['pull-off', 3, 'N/mm²', 'TDS'], ['compressive', 70, 'N/mm²', 'TDS'], ['tg', 55, '°C', 'Lab-tested']])],
  targets: [
    { propertyId: 'viscosity', operator: '<=', value: 200, priority: 'must', std: 'Grade 1 ≤ 2000 (ASTM C881)', reason: 'Enter 0.2 mm cracks at low pressure', bench: 180, confidence: 0.9 },
    { propertyId: 'pull-off', operator: '>=', value: 2.5, priority: 'must', reason: 'Bond — failure must be in the concrete', bench: 3, confidence: 0.88 },
    { propertyId: 'compressive', operator: '>=', value: 60, priority: 'important', bench: 70, confidence: 0.84 },
    { propertyId: 'pot-life', operator: '>=', value: 0.5, priority: 'important', reason: 'Time to inject a full beam at 30 °C', confidence: 0.8 },
    { propertyId: 'tg', operator: '>=', value: 50, priority: 'nice', bench: 55, confidence: 0.76 },
  ],
  top3: [{ id: 'viscosity', reason: 'Thick resin stops at the surface' }, { id: 'pull-off', reason: 'The crack must carry load again' }, { id: 'cost', reason: 'Benchmark at ₹ 520/kg' }],
  constraints: { costCeiling: 340, budgetBand: 'premium', materialLimits: [{ materialId: 'reactive-diluent', maxPct: 10 }], compliance: ['Solvent-free'], site: { tMin: 10, tMax: 35, rhMax: 85 }, mustHaves: ['Mix ratio 2:1 by volume'], remark: '1.5 kg kits.' },
  summary: {
    scientist: '**Helix is formulating:** a **low-viscosity Bisphenol-F epoxy injection resin** to **EN 1504-5 / ASTM C881 IV-1** for **structural cracks in beams and columns**, with **≤ 200 mPa·s** and **bond ≥ 2.5 N/mm²**, at **≤ ₹ 340 / kg**.',
    plain: '**Helix is making:** a **water-thin glue pumped into cracks** that **sets hard and joins the concrete back together**.',
  },
  pathways: [
    route('P1', 1, 'BPF epoxy + 7 % diluent + amine', [['bpf-epoxy', 55, 60], ['reactive-diluent', 6, 8], ['amine-hardener', 32, 36]], [['viscosity', 170, 'pass'], ['pull-off', 3, 'pass'], ['tg', 54, 'pass']], [0.9, 0.78, 0.88, 0.85], RESIN_KIT, ['Amine — skin sensitiser'], ['ei1']),
    route('P2', 2, 'BPA epoxy, more diluent', [['epoxy-resin', 52, 56], ['reactive-diluent', 10, 12], ['amine-hardener', 32, 36]], [['viscosity', 220, 'fail'], ['pull-off', 2.8, 'pass'], ['tg', 46, 'borderline']], [0.65, 0.88, 0.9, 0.79], RESIN_KIT, ['Over diluent limit'], ['ei1']),
    route('P3', 3, 'BPF, no diluent', [['bpf-epoxy', 62, 66], ['amine-hardener', 34, 38]], [['viscosity', 320, 'fail'], ['pull-off', 3.2, 'pass'], ['tg', 60, 'pass']], [0.68, 0.75, 0.9, 0.76], RESIN_KIT, ['Too thick for hairlines'], ['ei2']),
  ],
  balanceMaterial: 'bpf-epoxy', leverMaterial: 'reactive-diluent',
  clusters: ['Viscosity and penetration', 'Bond to dry and damp concrete', 'Diluent and Tg trade-off', 'Pot life at high temperature'],
  query: '("epoxy injection" OR "crack injection") AND (viscosity OR penetration) AND (bond OR "load-bearing") AND concrete',
  sources: [
    src('ei1', 'Paper', 'Bisphenol-F epoxies for structural crack injection', 2021, 0.88, 'BPF with 7 % diluent reached 170 mPa·s and filled 0.2 mm cracks.', 'Viscosity and penetration'),
    src('ei2', 'Paper', 'Reactive diluents and glass transition of injection epoxies', 2019, 0.78, 'Each 2 % diluent lowered Tg ~3 °C.', 'Diluent and Tg trade-off'),
  ],
  measured: ['viscosity', 'pull-off', 'compressive', 'tg'],
  mixingProtocol: ['Component A: BPF epoxy + diluent, mix 10 min.', 'Component B: amine hardener.', 'On site: mix A:B 2:1 for 3 min; inject from the lowest port upwards.'],
  testPlan: [
    { test: 'Viscosity at 23 °C', method: 'EN ISO 3219', specimens: 2, ages: '—', dueInDays: 1 },
    { test: 'Bond to concrete', method: 'EN 12618-2', specimens: 3, ages: '7 d', dueInDays: 9 },
    { test: 'Glass transition', method: 'EN 12614', specimens: 2, ages: '7 d', dueInDays: 9 },
  ],
};

/* ---------- Precision grouts ---------- */

export const PG_NS: Scenario = {
  id: 'pg-ns', label: 'Non-shrink precision grout', chip: 'Precision grout · cementitious',
  example: 'Non-shrink precision grout for machine base plates and anchor bolts',
  keywords: ['precision grout', 'non-shrink grout', 'non shrink grout', 'nonshrink grout', 'machine base', 'base plate', 'baseplate', 'grouting under', 'bedding grout', 'anchor bolt grout'],
  projectName: 'Non-shrink precision grout — Machine bases', codePrefix: 'HX-PG',
  docType: 'Technical Data Sheet', productGuess: 'Cementitious free-flow non-shrink precision grout',
  categoryId: 'precision-grouts', subcategoryId: 'pg-ns', chemistry: ['cementitious'], form: 'powder',
  standard: 'ASTM C1107 Grade B', standardAlt: 'EN 1504-6',
  useCase: { substrate: 'Concrete', element: 'Foundation', thicknessMm: 40, flowClass: 'Free-flow', exposure: 'interior', climate: 'Hot-humid', appTemp: [10, 40], load: 'None', method: 'Pour', timeToServiceH: 24, standardClass: 'ASTM C1107 Grade B' },
  useCaseConfidence: { substrate: 0.94, element: 0.88, thicknessMm: 0.76, flowClass: 0.9, exposure: 0.86, climate: 0.68, appTemp: 0.78, load: 0.7, method: 0.94, timeToServiceH: 0.72, standardClass: 0.86 },
  guided: [
    { id: 'under', q: 'What are you grouting under?', picture: 'Cylinder', answer: 0, options: [
      { label: 'Machine base plate', icon: 'Cog', sets: { element: 'Foundation', thicknessMm: 40, flowClass: 'Free-flow' } },
      { label: 'Steel column base', icon: 'Columns3', sets: { element: 'Column / beam', thicknessMm: 50, flowClass: 'Free-flow' } },
      { label: 'Precast joints', icon: 'Box', sets: { element: 'Precast element', thicknessMm: 30, flowClass: 'Pourable' } },
    ] },
    speedQuestion('timeToServiceH'),
  ],
  benchmarks: [bench('bm-pg', 'Benchmark P-G', 'pg-ns', 'ASTM C1107 Grade B', 22, [['flow', 280, 'mm', 'TDS'], ['expansion', 0.15, '%', 'TDS'], ['compressive-1d', 25, 'N/mm²', 'TDS'], ['compressive', 60, 'N/mm²', 'TDS']])],
  targets: [
    { propertyId: 'expansion', operator: 'between', value: [0, 0.3], priority: 'must', std: '0–0.3 % (ASTM C1107)', stdMin: 0, stdMax: 0.3, reason: 'Stays in contact with the plate', bench: 0.15, confidence: 0.9 },
    { propertyId: 'flow', operator: '>=', value: 260, priority: 'must', reason: 'Fills under a 1 m plate from one side', bench: 280, confidence: 0.88 },
    { propertyId: 'compressive', operator: '>=', value: 50, priority: 'must', bench: 60, confidence: 0.9 },
    { propertyId: 'compressive-1d', operator: '>=', value: 20, priority: 'important', reason: 'Torque bolts next day', bench: 25, confidence: 0.84 },
  ],
  top3: [{ id: 'expansion', reason: 'Shrink = gaps under the plate = vibration' }, { id: 'flow', reason: 'Must fill without vibrating' }, { id: 'cost', reason: 'Benchmark at ₹ 22/kg' }],
  constraints: { costCeiling: 12, budgetBand: 'mid', materialLimits: [], compliance: ['No chlorides', 'No metallic iron'], site: { tMin: 10, tMax: 40, rhMax: 95 }, mustHaves: ['10–100 mm gaps'], remark: '25 kg bag.' },
  summary: {
    scientist: '**Helix is formulating:** a **free-flow non-shrink cementitious grout** to **ASTM C1107 Grade B** for **machine base plates**, with **0–0.3 % expansion**, **flow ≥ 260 mm** and **≥ 50 N/mm²**, at **≤ ₹ 12 / kg**.',
    plain: '**Helix is making:** a **runny cement grout** poured **under machines and steel plates** that **swells slightly** so there are no gaps.',
  },
  pathways: [
    route('P1', 1, 'OPC + PCE + plastic expansion + silica fume', [['opc53', 34, 38], ['sand', 58, 63], ['pce-powder', 0.2, 0.3], ['expansion', 0.5, 0.8], ['silica-fume', 2, 3], ['defoamer', 0.1, 0.2]], [['expansion', 0.16, 'pass'], ['flow', 285, 'pass'], ['compressive', 62, 'pass']], [0.9, 0.82, 0.9, 0.87], BLENDER, ['Alkaline dust — mask'], ['pg1', 'pg2']),
    route('P2', 2, 'No expansion agent', [['opc53', 34, 38], ['sand', 59, 64], ['pce-powder', 0.2, 0.3], ['silica-fume', 2, 3]], [['expansion', -0.1, 'fail'], ['flow', 290, 'pass'], ['compressive', 64, 'pass']], [0.5, 0.92, 0.9, 0.74], BLENDER, ['Shrinks away from the plate'], ['pg1']),
    route('P3', 3, 'Low PCE', [['opc53', 34, 38], ['sand', 58, 63], ['pce-powder', 0.1, 0.15], ['expansion', 0.5, 0.8], ['silica-fume', 2, 3]], [['expansion', 0.2, 'pass'], ['flow', 230, 'fail'], ['compressive', 58, 'pass']], [0.62, 0.9, 0.9, 0.78], BLENDER, ['Needs pumping or rodding'], ['pg2']),
  ],
  balanceMaterial: 'sand', leverMaterial: 'expansion',
  clusters: ['Plastic and hardened expansion', 'Flow and PCE', 'Early strength', 'Bleeding'],
  query: '("non-shrink grout" OR "precision grout") AND (expansion OR "ASTM C1107") AND (flow OR bleeding)',
  sources: [
    src('pg1', 'Paper', 'Gas-generating expansion agents in non-shrink grouts', 2020, 0.86, '0.6 % agent gave 0.15 % expansion with no bleeding.', 'Plastic and hardened expansion'),
    src('pg2', 'Paper', 'PCE dosage and flow of precision grouts', 2021, 0.8, '0.25 % PCE held 280 mm flow for 30 min.', 'Flow and PCE'),
  ],
  measured: ['expansion', 'flow', 'compressive', 'compressive-1d'],
  mixingProtocol: dryMix('PCE, expansion agent, silica fume, defoamer'),
  testPlan: [
    { test: 'Height change', method: 'ASTM C1090', specimens: 3, ages: '1, 3, 14, 28 d', dueInDays: 30 },
    { test: 'Flow', method: 'ASTM C1437 / EN 13395-2', specimens: 2, ages: 'fresh', dueInDays: 1 },
    { test: 'Compressive 1 and 28 d', method: 'ASTM C109', specimens: 3, ages: '1, 28 d', dueInDays: 30 },
  ],
};

export const PG_EPOXY = variant(PG_NS, {
  id: 'pg-epoxy', label: 'Epoxy precision grout', chip: 'Precision grout · epoxy',
  example: 'Epoxy grout for machine base plates under a vibrating compressor',
  keywords: ['epoxy precision grout', 'epoxy grout for machine', 'epoxy machine grout', 'epoxy base plate', 'epoxy baseplate', 'epoxy grout for base plate', 'epoxy grout under', 'epoxy chocking', 'compressor', 'turbine'],
  projectName: 'Epoxy precision grout — Dynamic machinery', codePrefix: 'HX-PE',
  productGuess: '3-component aggregate-filled epoxy machinery grout', subcategoryId: 'pg-epoxy', chemistry: ['epoxy'], form: '2-component',
  standard: 'ASTM C579', standardAlt: 'API RP 686',
  useCase: { substrate: 'Concrete', element: 'Foundation', thicknessMm: 50, flowClass: 'Pourable', exposure: 'interior', climate: 'Hot-humid', appTemp: [15, 35], load: 'Heavy vehicular', method: 'Pour', timeToServiceH: 24, standardClass: 'ASTM C579' },
  benchmarks: [bench('bm-pe', 'Benchmark P-E', 'pg-epoxy', 'ASTM C579', 220, [['compressive', 100, 'N/mm²', 'TDS'], ['flexural', 30, 'N/mm²', 'TDS'], ['pot-life', 1.2, 'h', 'TDS'], ['service-temp', 70, '°C', 'TDS']])],
  targets: [
    { propertyId: 'compressive', operator: '>=', value: 90, priority: 'must', bench: 100, confidence: 0.9 },
    { propertyId: 'flexural', operator: '>=', value: 25, priority: 'important', bench: 30, confidence: 0.84 },
    { propertyId: 'pot-life', operator: '>=', value: 1, priority: 'important', reason: 'Pour a large plate in one go', bench: 1.2, confidence: 0.82 },
    { propertyId: 'service-temp', operator: '>=', value: 60, priority: 'nice', reason: 'Hot compressor foundations', bench: 70, confidence: 0.76 },
  ],
  top3: [{ id: 'compressive', reason: 'Dynamic loads and creep' }, { id: 'pot-life', reason: 'Large pours' }, { id: 'cost', reason: 'Benchmark at ₹ 220/kg' }],
  constraints: { costCeiling: 60, budgetBand: 'premium', materialLimits: [{ materialId: 'reactive-diluent', maxPct: 2 }], compliance: ['Solvent-free'], site: { tMin: 15, tMax: 35, rhMax: 85 }, mustHaves: ['Resists oil and vibration'], remark: '3-part kit: resin, hardener, aggregate.' },
  summary: {
    scientist: '**Helix is formulating:** a **3-component aggregate-filled epoxy grout** to **ASTM C579** for **vibrating machinery foundations**, with **≥ 90 N/mm²** and **≥ 1 h pot life**, at **≤ ₹ 60 / kg**.',
    plain: '**Helix is making:** a **very strong resin grout** poured **under vibrating machines** that doesn\'t crack or crumble.',
  },
  pathways: [
    route('P1', 1, 'BPA epoxy + amine + quartz', [['epoxy-resin', 10, 12], ['amine-hardener', 4, 5], ['quartz-agg', 50, 55], ['silica-flour', 28, 32], ['reactive-diluent', 0.5, 1]], [['compressive', 98, 'pass'], ['flexural', 28, 'pass'], ['pot-life', 1.2, 'pass']], [0.9, 0.82, 0.88, 0.86], RESIN_KIT, ['Amine — skin sensitiser'], ['pe1']),
    route('P2', 2, 'Lean resin', [['epoxy-resin', 8, 9], ['amine-hardener', 3, 4], ['quartz-agg', 55, 58], ['silica-flour', 30, 33]], [['compressive', 85, 'fail'], ['flexural', 22, 'fail'], ['pot-life', 1.4, 'pass']], [0.55, 0.92, 0.9, 0.74], RESIN_KIT, ['Voids — poor flow'], ['pe1']),
    route('P3', 3, 'Rich resin, fine filler', [['epoxy-resin', 13, 15], ['amine-hardener', 5, 6], ['quartz-agg', 45, 50], ['silica-flour', 30, 34]], [['compressive', 105, 'pass'], ['flexural', 32, 'pass'], ['pot-life', 0.9, 'borderline']], [0.86, 0.7, 0.88, 0.8], RESIN_KIT, ['Exotherm in deep pours'], ['pe1']),
  ],
  balanceMaterial: 'quartz-agg', leverMaterial: 'epoxy-resin',
  clusters: ['Resin content and voids', 'Exotherm in deep pours', 'Creep under load', 'Temperature'],
  query: '("epoxy grout" machinery OR "epoxy chocking") AND (creep OR exotherm) AND (compressive OR "ASTM C579")',
  sources: [src('pe1', 'Paper', 'Resin-to-aggregate ratio in epoxy machinery grouts', 2020, 0.84, '15 % binder gave void-free pours at 98 N/mm².', 'Resin content and voids')],
  measured: ['compressive', 'flexural', 'pot-life'],
  mixingProtocol: ['A: resin + diluent; B: amine; C: graded quartz.', 'On site: mix A+B 2 min; add C slowly; mix 3 min.', 'Pour from one side with a head box.'],
  testPlan: [
    { test: 'Compressive', method: 'ASTM C579', specimens: 3, ages: '7 d', dueInDays: 9 },
    { test: 'Flexural', method: 'ASTM C580', specimens: 3, ages: '7 d', dueInDays: 9 },
  ],
});

/* ---------- Anchors ---------- */

export const AN_VE: Scenario = {
  id: 'an-ve', label: 'Vinylester chemical anchor', chip: 'Chemical anchor',
  example: 'Vinylester chemical anchor for threaded rods in cracked concrete',
  keywords: ['chemical anchor', 'anchor', 'anchoring', 'rebar anchoring', 'post-installed rebar', 'vinylester', 'injection mortar for anchors', 'resin anchor', 'threaded rod'],
  projectName: 'Vinylester chemical anchor — Cracked concrete', codePrefix: 'HX-AN',
  docType: 'Technical Data Sheet', productGuess: 'Styrene-free vinylester hybrid injection anchor (cartridge)',
  categoryId: 'anchors', subcategoryId: 'an-ve', chemistry: ['epoxy'], form: '2-component',
  standard: 'EAD 330499 (option 1)', standardAlt: 'ASTM E488',
  useCase: { substrate: 'Concrete', element: 'Wall', substrateCondition: 'Cracked', designLoadKN: 25, embedDepthMm: 125, exposure: 'exterior', climate: 'Hot-humid', appTemp: [5, 40], method: 'Cartridge gun', timeToServiceH: 2, standardClass: 'EAD 330499' },
  useCaseConfidence: { substrate: 0.95, element: 0.76, substrateCondition: 0.8, designLoadKN: 0.66, embedDepthMm: 0.72, exposure: 0.8, climate: 0.68, appTemp: 0.78, method: 0.94, timeToServiceH: 0.7, standardClass: 0.86 },
  guided: [
    { id: 'what', q: 'What are you fixing into the concrete?', picture: 'Anchor', answer: 0, options: [
      { label: 'Threaded rods (bolts)', icon: 'Anchor', sets: { embedDepthMm: 125, designLoadKN: 25 } },
      { label: 'New rebar to old concrete', icon: 'Rows3', sets: { embedDepthMm: 300, designLoadKN: 60 } },
      { label: 'Heavy machinery', icon: 'Cog', sets: { embedDepthMm: 200, designLoadKN: 80 } },
    ] },
    COMMON_GUIDED[1],
  ],
  benchmarks: [bench('bm-an', 'Benchmark A-N', 'an-ve', 'EAD 330499', 450, [['bond-strength', 11, 'N/mm²', 'TDS'], ['gel-time', 360, 's', 'TDS'], ['setting-time', 60, 'min', 'TDS']])],
  targets: [
    { propertyId: 'bond-strength', operator: '>=', value: 10, priority: 'must', reason: 'Characteristic bond, uncracked C20/25', bench: 11, confidence: 0.86 },
    { propertyId: 'gel-time', operator: 'between', value: [300, 600], priority: 'important', reason: 'Time to set the rod at 20 °C', bench: 360, confidence: 0.84 },
    { propertyId: 'setting-time', operator: '<=', value: 90, priority: 'important', reason: 'Load in 90 min at 20 °C', bench: 60, confidence: 0.82 },
  ],
  top3: [{ id: 'bond-strength', reason: 'Design loads depend on it' }, { id: 'gel-time', reason: 'Installers need time; hot sites shorten it' }, { id: 'cost', reason: 'Benchmark at ₹ 450/kg' }],
  constraints: { costCeiling: 220, budgetBand: 'premium', materialLimits: [], compliance: ['Styrene-free'], site: { tMin: 5, tMax: 40, rhMax: 95 }, mustHaves: ['Works in damp holes'], remark: '300 / 410 mL coaxial cartridges.' },
  summary: {
    scientist: '**Helix is formulating:** a **styrene-free vinylester hybrid injection anchor** to **EAD 330499** for **threaded rods and rebar in cracked concrete**, with **bond ≥ 10 N/mm²** and **5–10 min gel time**, at **≤ ₹ 220 / kg**.',
    plain: '**Helix is making:** a **resin squeezed into drilled holes** that **locks bolts and steel bars into concrete** within an hour.',
  },
  pathways: [
    route('P1', 1, 'Vinylester + cement hybrid', [['vinylester', 40, 45], ['silica-flour', 35, 40], ['opc53', 10, 12], ['fumed-silica', 2, 3], ['bpo', 2, 3]], [['bond-strength', 11, 'pass'], ['gel-time', 380, 'pass'], ['setting-time', 60, 'pass']], [0.9, 0.8, 0.85, 0.85], ['Planetary vacuum mixer', 'Coaxial cartridge filler'], ['Peroxide — keep cool'], ['an1']),
    route('P2', 2, 'Lean resin', [['vinylester', 32, 35], ['silica-flour', 45, 50], ['opc53', 10, 12], ['fumed-silica', 2, 3], ['bpo', 2, 3]], [['bond-strength', 8.5, 'fail'], ['gel-time', 400, 'pass'], ['setting-time', 70, 'pass']], [0.55, 0.92, 0.85, 0.74], ['Planetary vacuum mixer', 'Coaxial cartridge filler'], ['Below design bond'], ['an1']),
    route('P3', 3, 'No cement', [['vinylester', 42, 46], ['silica-flour', 48, 52], ['fumed-silica', 2, 3], ['bpo', 2, 3]], [['bond-strength', 10.5, 'pass'], ['gel-time', 320, 'pass'], ['setting-time', 45, 'pass']], [0.84, 0.8, 0.85, 0.83], ['Planetary vacuum mixer', 'Coaxial cartridge filler'], ['Weaker in damp holes'], ['an2']),
  ],
  balanceMaterial: 'silica-flour', leverMaterial: 'vinylester',
  clusters: ['Resin and bond in cracked concrete', 'Hybrid cement systems', 'Gel time vs temperature', 'Damp and flooded holes'],
  query: '("bonded anchor" OR "chemical anchor") AND vinylester AND ("bond strength" OR "cracked concrete") AND (EAD OR ETAG)',
  sources: [
    src('an1', 'Paper', 'Vinylester hybrid anchors in cracked concrete', 2021, 0.86, 'Cement–vinylester hybrids kept 85 % of bond in 0.3 mm cracks.', 'Resin and bond in cracked concrete'),
    src('an2', 'Paper', 'Effect of hole moisture on bonded anchor capacity', 2019, 0.76, 'Pure resin systems lost 25 % bond in damp holes.', 'Damp and flooded holes'),
  ],
  measured: ['bond-strength', 'gel-time', 'setting-time'],
  mixingProtocol: ['Side A: vinylester, fillers, fumed silica, cement under vacuum.', 'Side B: peroxide paste with filler.', 'Fill coaxial cartridges 10:1; static mixer on site.'],
  testPlan: [
    { test: 'Confined tension (bond)', method: 'EAD 330499 / ASTM E488', specimens: 5, ages: '24 h', dueInDays: 3 },
    { test: 'Gel and cure time', method: 'Internal (20 °C)', specimens: 3, ages: '—', dueInDays: 1 },
  ],
};

/* ---------- Fibre wrap ---------- */

export const FW_CFRP: Scenario = {
  id: 'fw-cfrp', label: 'CFRP epoxy saturant system', chip: 'CFRP saturant',
  example: 'Epoxy saturant for carbon fibre wrap to strengthen columns in an old building',
  keywords: ['cfrp', 'carbon fibre wrap', 'carbon fiber wrap', 'carbon wrap', 'fibre wrap', 'fiber wrap', 'frp', 'saturant', 'strengthening', 'column wrapping'],
  projectName: 'CFRP saturant — Column and beam strengthening', codePrefix: 'HX-FW',
  docType: 'Technical Data Sheet', productGuess: '2-component epoxy impregnating resin for carbon fibre sheets',
  categoryId: 'fibre-wrap', subcategoryId: 'fw-cfrp', chemistry: ['epoxy'], form: '2-component',
  standard: 'ACI 440.2R', standardAlt: 'EN 1504-4',
  useCase: { substrate: 'Concrete', element: 'Column / beam', substrateCondition: 'Uncracked', designLoadKN: 400, layers: 2, exposure: 'interior', climate: 'Hot-humid', appTemp: [10, 35], method: 'Brush/roller', timeToServiceH: 168, standardClass: 'ACI 440.2R' },
  useCaseConfidence: { substrate: 0.95, element: 0.9, substrateCondition: 0.76, designLoadKN: 0.6, layers: 0.74, exposure: 0.82, climate: 0.68, appTemp: 0.78, method: 0.88, timeToServiceH: 0.66, standardClass: 0.86 },
  guided: [
    { id: 'what', q: 'What needs strengthening?', picture: 'Ribbon', answer: 0, options: [
      { label: 'Columns (wrap around)', icon: 'Columns3', sets: { element: 'Column / beam', layers: 2 } },
      { label: 'Beams (bending)', icon: 'Rows3', sets: { element: 'Column / beam', layers: 1 } },
      { label: 'Slabs', icon: 'Square', sets: { element: 'Slab', layers: 1 } },
    ] },
    COMMON_GUIDED[1],
  ],
  benchmarks: [bench('bm-fw', 'Benchmark F-W', 'fw-cfrp', 'ACI 440.2R', 600, [['resin-tensile', 55, 'N/mm²', 'TDS'], ['tg', 65, '°C', 'TDS'], ['pull-off', 3, 'N/mm²', 'TDS'], ['elongation', 3, '%', 'TDS']])],
  targets: [
    { propertyId: 'resin-tensile', operator: '>=', value: 50, priority: 'must', bench: 55, confidence: 0.88 },
    { propertyId: 'tg', operator: '>=', value: 60, priority: 'must', reason: 'ACI 440.2R: Tg ≥ service temperature + 15 °C', bench: 65, confidence: 0.86 },
    { propertyId: 'pull-off', operator: '>=', value: 2, priority: 'must', std: '≥ 1.4 or concrete failure (ACI 440.2R)', stdMin: 1.4, bench: 3, confidence: 0.86 },
    { propertyId: 'elongation', operator: '>=', value: 2.5, priority: 'important', bench: 3, confidence: 0.8 },
    { propertyId: 'pot-life', operator: '>=', value: 0.75, priority: 'nice', reason: 'Wet lay-up of two layers', confidence: 0.76 },
  ],
  top3: [{ id: 'tg', reason: 'Soft resin lets the fibres slip in heat' }, { id: 'pull-off', reason: 'Debonding is the failure mode' }, { id: 'cost', reason: 'Benchmark at ₹ 600/kg' }],
  constraints: { costCeiling: 320, budgetBand: 'premium', materialLimits: [{ materialId: 'reactive-diluent', maxPct: 5 }], compliance: ['Solvent-free'], site: { tMin: 10, tMax: 35, rhMax: 85 }, mustHaves: ['Wets 300 g/m² carbon sheet'], remark: '5 kg kits.' },
  summary: {
    scientist: '**Helix is formulating:** a **2-component epoxy saturant** to **ACI 440.2R** for **wet lay-up CFRP strengthening of columns and beams**, with **tensile ≥ 50 N/mm²**, **Tg ≥ 60 °C** and **bond ≥ 2 N/mm²**, at **≤ ₹ 320 / kg**.',
    plain: '**Helix is making:** a **resin that soaks carbon-fibre sheets** wrapped around old columns, so they **carry more load**.',
  },
  pathways: [
    route('P1', 1, 'BPA epoxy + cycloaliphatic amine, thixotropic', [['epoxy-resin', 60, 65], ['amine-hardener', 30, 34], ['fumed-silica', 1, 2], ['reactive-diluent', 2, 4]], [['resin-tensile', 54, 'pass'], ['tg', 64, 'pass'], ['pull-off', 2.9, 'pass']], [0.9, 0.8, 0.9, 0.86], RESIN_KIT, ['Amine — skin sensitiser'], ['fw1']),
    route('P2', 2, 'More diluent', [['epoxy-resin', 56, 60], ['amine-hardener', 30, 34], ['fumed-silica', 1, 2], ['reactive-diluent', 7, 9]], [['resin-tensile', 46, 'fail'], ['tg', 52, 'fail'], ['pull-off', 2.6, 'pass']], [0.5, 0.85, 0.9, 0.72], RESIN_KIT, ['Over diluent limit'], ['fw1']),
    route('P3', 3, 'No thixotrope', [['epoxy-resin', 62, 66], ['amine-hardener', 31, 35], ['reactive-diluent', 2, 3]], [['resin-tensile', 56, 'pass'], ['tg', 66, 'pass'], ['pull-off', 2.8, 'pass']], [0.82, 0.82, 0.9, 0.84], RESIN_KIT, ['Runs off vertical faces'], ['fw2']),
  ],
  balanceMaterial: 'epoxy-resin', leverMaterial: 'fumed-silica',
  clusters: ['Glass transition and service temperature', 'Wet-out and thixotropy', 'Bond to concrete', 'Hot-climate cure'],
  query: '(CFRP OR "carbon fibre") AND (saturant OR "impregnating resin") AND ("glass transition" OR bond) AND strengthening',
  sources: [
    src('fw1', 'Paper', 'Glass transition of wet lay-up epoxies in hot climates', 2021, 0.86, 'Diluent above 5 % dropped Tg below 55 °C.', 'Glass transition and service temperature'),
    src('fw2', 'Paper', 'Thixotropic saturants for vertical CFRP application', 2020, 0.78, '1.5 % fumed silica stopped run-off without hurting wet-out.', 'Wet-out and thixotropy'),
  ],
  measured: ['resin-tensile', 'tg', 'pull-off', 'elongation'],
  mixingProtocol: ['Component A: epoxy, diluent and fumed silica under vacuum.', 'Component B: amine hardener.', 'On site: mix A:B for 3 min; prime, saturate sheet, roll out air.'],
  testPlan: [
    { test: 'Tensile strength and elongation', method: 'ASTM D638', specimens: 5, ages: '7 d', dueInDays: 9 },
    { test: 'Glass transition', method: 'ASTM E1640', specimens: 2, ages: '7 d', dueInDays: 9 },
    { test: 'Pull-off on concrete', method: 'ASTM D7522', specimens: 5, ages: '7 d', dueInDays: 9 },
  ],
};

/* ---------- Protective coatings ---------- */

export const PC_ANTICARB: Scenario = {
  id: 'pc-anticarb', label: 'Anti-carbonation coating', chip: 'Anti-carbonation coating',
  example: 'Anti-carbonation protective coating for exposed concrete on a flyover',
  keywords: ['anti-carbonation', 'anticarbonation', 'carbonation', 'protective coating', 'concrete protection', 'concrete protective', 'fair-face protection'],
  projectName: 'Anti-carbonation coating — Bridges and facades', codePrefix: 'HX-AC',
  docType: 'Technical Data Sheet', productGuess: 'Elastomeric acrylic anti-carbonation coating',
  categoryId: 'protective', subcategoryId: 'pc-anticarb', chemistry: ['acrylic'], form: 'liquid',
  standard: 'EN 1504-2 (C)', standardAlt: 'EN 1062-6',
  useCase: { substrate: 'Concrete', surfaces: ['Wall', 'Facade'], waterExposure: 'Rain / splash', crackMovementMm: 0.3, thicknessMm: 0.3, coats: 2, uvExposure: 'Full sun', potableContact: 'No', exposure: 'exterior', climate: 'Hot-humid', appTemp: [10, 40], load: 'None', method: 'Brush/roller', standardClass: 'EN 1504-2 (C)' },
  useCaseConfidence: { substrate: 0.95, surfaces: 0.88, waterExposure: 0.82, crackMovementMm: 0.66, thicknessMm: 0.7, coats: 0.84, uvExposure: 0.9, potableContact: 0.8, exposure: 0.95, climate: 0.72, appTemp: 0.78, load: 0.8, method: 0.88, standardClass: 0.86 },
  guided: [
    { id: 'where', q: 'Which structure is it?', picture: 'ShieldCheck', answer: 0, options: [
      { label: 'Bridge or flyover', icon: 'Truck', sets: { surfaces: ['Wall'], crackMovementMm: 0.3 } },
      { label: 'Building facade', icon: 'Building', sets: { surfaces: ['Facade'], crackMovementMm: 0.2 } },
      { label: 'Cooling tower or chimney', icon: 'Cylinder', sets: { surfaces: ['Wall'], crackMovementMm: 0.3 } },
    ] },
    COMMON_GUIDED[1],
  ],
  benchmarks: [bench('bm-pc', 'Benchmark P-C', 'pc-anticarb', 'EN 1504-2 (C)', 140, [['co2-resistance', 180, 'm', 'TDS'], ['pull-off', 1.2, 'N/mm²', 'TDS'], ['crack-bridging', 0.5, 'mm', 'TDS'], ['vapour', 40, 'g/m²·d', 'TDS']])],
  targets: [
    { propertyId: 'co2-resistance', operator: '>=', value: 50, priority: 'must', std: 'sD ≥ 50 m (EN 1504-2)', stdMin: 50, bench: 180, confidence: 0.9 },
    { propertyId: 'pull-off', operator: '>=', value: 0.8, priority: 'must', std: '≥ 0.8 (flexible, EN 1504-2)', stdMin: 0.8, bench: 1.2, confidence: 0.88 },
    { propertyId: 'vapour', operator: '>=', value: 20, priority: 'important', reason: 'Lets the concrete breathe — no blistering', bench: 40, confidence: 0.8 },
    { propertyId: 'crack-bridging', operator: '>=', value: 0.3, priority: 'important', bench: 0.5, confidence: 0.8 },
  ],
  top3: [{ id: 'co2-resistance', reason: 'Stops carbonation reaching the rebar' }, { id: 'vapour', reason: 'Trapped moisture blisters coatings' }, { id: 'cost', reason: 'Benchmark at ₹ 140/kg' }],
  constraints: { costCeiling: 95, budgetBand: 'mid', materialLimits: [], compliance: ['Water-based', 'Low VOC'], site: { tMin: 10, tMax: 40, rhMax: 85 }, mustHaves: ['Concrete-grey and white'], remark: '20 L pails, 0.4 L/m² in two coats.' },
  summary: {
    scientist: '**Helix is formulating:** an **elastomeric acrylic anti-carbonation coating** to **EN 1504-2 (C)** for **bridges and exposed concrete**, with **CO₂ sD ≥ 50 m**, **bond ≥ 0.8 N/mm²** and **crack bridging ≥ 0.3 mm**, at **≤ ₹ 95 / kg**.',
    plain: '**Helix is making:** a **paint for bare concrete** that **keeps CO₂ and rain out** so the steel inside doesn\'t rust.',
  },
  pathways: [
    route('P1', 1, 'Elastomeric acrylic + talc barrier', [['elasto-acrylic', 35, 40], ['caco3', 25, 30], ['talc', 8, 10], ['tio2-disp', 6, 8], ['hec', 0.3, 0.4], ['coalescent', 0.8, 1.2], ['biocide', 0.1, 0.2], ['liq-defoamer', 0.2, 0.3], ['water', 12, 16]], [['co2-resistance', 170, 'pass'], ['pull-off', 1.15, 'pass'], ['vapour', 35, 'pass']], [0.9, 0.8, 0.9, 0.86], ['High-speed dissolver'], ['Freezes below 0 °C'], ['pc1']),
    route('P2', 2, 'Standard acrylic', [['acrylic-emul', 35, 40], ['caco3', 31, 36], ['tio2-disp', 6, 8], ['hec', 0.3, 0.4], ['coalescent', 1, 1.5], ['biocide', 0.1, 0.2], ['water', 14, 18]], [['co2-resistance', 90, 'pass'], ['pull-off', 1.1, 'pass'], ['crack-bridging', 0.1, 'fail']], [0.68, 0.9, 0.9, 0.8], ['High-speed dissolver'], ['Cracks over live cracks'], ['pc1']),
    route('P3', 3, 'Silane primer + topcoat', [['elasto-acrylic', 32, 36], ['silane-siloxane', 3, 4], ['caco3', 25, 30], ['talc', 8, 10], ['tio2-disp', 6, 8], ['hec', 0.3, 0.4], ['coalescent', 0.8, 1.2], ['biocide', 0.1, 0.2], ['water', 12, 16]], [['co2-resistance', 200, 'pass'], ['pull-off', 1.3, 'pass'], ['vapour', 30, 'pass']], [0.92, 0.7, 0.85, 0.82], ['High-speed dissolver'], ['Two-product system'], ['pc2']),
  ],
  balanceMaterial: 'caco3', leverMaterial: 'elasto-acrylic',
  clusters: ['CO₂ diffusion resistance', 'Breathability', 'Crack bridging', 'Weathering'],
  query: '("anti-carbonation" OR "carbonation resistance") AND coating AND ("diffusion resistance" OR sD) AND (bridge OR concrete)',
  sources: [
    src('pc1', 'Paper', 'CO₂ diffusion resistance of acrylic concrete coatings', 2020, 0.86, 'Platy talc doubled sD CO₂ at equal film thickness.', 'CO₂ diffusion resistance'),
    src('pc2', 'Paper', 'Silane primers under anti-carbonation coatings', 2022, 0.76, 'Hydrophobic primers cut chloride ingress 60 % more.', 'Weathering'),
  ],
  measured: ['co2-resistance', 'pull-off', 'vapour', 'crack-bridging'],
  mixingProtocol: ['Charge water, HEC, dispersant and biocide.', 'Add calcite, talc and TiO₂ at high speed.', 'Let down with elastomeric emulsion and coalescent.'],
  testPlan: [
    { test: 'CO₂ permeability (sD)', method: 'EN 1062-6', specimens: 2, ages: '28 d', dueInDays: 40 },
    { test: 'Pull-off', method: 'EN 1542', specimens: 5, ages: '28 d', dueInDays: 30 },
    { test: 'Water vapour transmission', method: 'EN ISO 7783', specimens: 2, ages: '28 d', dueInDays: 32 },
  ],
};

export const PC_ZINC = variant(PC_ANTICARB, {
  id: 'pc-zinc', label: 'Zinc-rich rebar primer', chip: 'Zinc-rich rebar primer',
  example: 'Zinc-rich epoxy primer for exposed rebar during concrete repairs',
  keywords: ['zinc-rich', 'zinc rich', 'zinc primer', 'rebar primer', 'rebar coating', 'reinforcement protection', 'anti-corrosion primer', 'anticorrosion primer', 'anti-corrosion', 'rust primer'],
  projectName: 'Zinc-rich rebar primer — Repair works', codePrefix: 'HX-ZR',
  productGuess: '2-component epoxy zinc-rich reinforcement primer', subcategoryId: 'pc-zinc', chemistry: ['epoxy'],
  standard: 'EN 1504-7', standardAlt: 'ASTM A780',
  useCase: { substrate: 'Steel', surfaces: ['Wall'], waterExposure: 'Rain / splash', thicknessMm: 0.08, coats: 2, uvExposure: 'None', potableContact: 'No', exposure: 'exterior', climate: 'Hot-humid', appTemp: [10, 40], method: 'Brush/roller', standardClass: 'EN 1504-7' },
  useCaseConfidence: { substrate: 0.96, surfaces: 0.6, waterExposure: 0.7, thicknessMm: 0.74, coats: 0.84, uvExposure: 0.8, potableContact: 0.8, exposure: 0.86, climate: 0.72, appTemp: 0.78, method: 0.9, standardClass: 0.88 },
  guided: [COMMON_GUIDED[1]],
  benchmarks: [bench('bm-zr', 'Benchmark Z-R', 'pc-zinc', 'EN 1504-7', 450, [['zinc-content', 85, '%', 'TDS'], ['salt-spray', 1500, 'h', 'TDS'], ['pull-off', 3, 'N/mm²', 'TDS'], ['drying-time', 1, 'h', 'TDS']])],
  targets: [
    { propertyId: 'zinc-content', operator: '>=', value: 80, priority: 'must', std: '≥ 80 % in dry film (ISO 12944 zinc-rich)', stdMin: 80, bench: 85, confidence: 0.9 },
    { propertyId: 'salt-spray', operator: '>=', value: 1000, priority: 'must', reason: 'Protects rebar until the repair mortar is placed and beyond', bench: 1500, confidence: 0.84 },
    { propertyId: 'pull-off', operator: '>=', value: 2, priority: 'important', reason: 'Adhesion to blasted steel', bench: 3, confidence: 0.82 },
    { propertyId: 'drying-time', operator: '<=', value: 2, priority: 'important', reason: 'Repair mortar the same day', bench: 1, confidence: 0.8 },
  ],
  top3: [{ id: 'salt-spray', reason: 'Coastal repairs fail from rebar rust' }, { id: 'drying-time', reason: 'Same-day repair sequence' }, { id: 'cost', reason: 'Zinc is the cost driver' }],
  constraints: { costCeiling: 330, budgetBand: 'premium', materialLimits: [], compliance: ['Lead-free', 'Chromate-free'], site: { tMin: 10, tMax: 40, rhMax: 85 }, mustHaves: ['Brushable on rebar'], remark: '1 kg kits.' },
  summary: {
    scientist: '**Helix is formulating:** a **2-component epoxy zinc-rich primer** to **EN 1504-7** for **exposed rebar in concrete repairs**, with **≥ 80 % zinc in dry film** and **≥ 1000 h salt spray**, at **≤ ₹ 330 / kg**.',
    plain: '**Helix is making:** a **grey zinc paint brushed on rusty steel bars** during repairs so they **don\'t rust again**.',
  },
  pathways: [
    route('P1', 1, 'Epoxy + polyamine, 78 % zinc', [['zinc-dust', 75, 80], ['epoxy-resin', 8, 10], ['amine-hardener', 4, 5], ['solvent', 6, 9], ['fumed-silica', 0.5, 1]], [['zinc-content', 86, 'pass'], ['salt-spray', 1500, 'pass'], ['drying-time', 1, 'pass']], [0.9, 0.78, 0.85, 0.84], ['High-speed disperser (A)', 'Can filler (B)'], ['Flammable solvent', 'Zinc dust — no sparks'], ['zr1']),
    route('P2', 2, 'Lean zinc', [['zinc-dust', 62, 66], ['epoxy-resin', 10, 12], ['amine-hardener', 5, 6], ['solvent', 15, 20], ['fumed-silica', 0.5, 1]], [['zinc-content', 74, 'fail'], ['salt-spray', 800, 'fail'], ['drying-time', 1, 'pass']], [0.5, 0.92, 0.85, 0.74], ['High-speed disperser (A)', 'Can filler (B)'], ['Not zinc-rich'], ['zr1']),
    route('P3', 3, 'High zinc, thin binder', [['zinc-dust', 82, 85], ['epoxy-resin', 6, 7], ['amine-hardener', 3, 4], ['solvent', 5, 7], ['fumed-silica', 0.3, 0.5]], [['zinc-content', 90, 'pass'], ['salt-spray', 1800, 'pass'], ['pull-off', 1.5, 'fail']], [0.75, 0.65, 0.85, 0.75], ['High-speed disperser (A)', 'Can filler (B)'], ['Powdery film'], ['zr1']),
  ],
  balanceMaterial: 'zinc-dust', leverMaterial: 'epoxy-resin',
  clusters: ['Zinc loading and galvanic protection', 'Binder and adhesion', 'Compatibility with repair mortar', 'Drying'],
  query: '("zinc-rich primer" OR "rebar primer") AND (epoxy) AND ("salt spray" OR "galvanic") AND repair',
  sources: [src('zr1', 'Paper', 'Zinc loading in epoxy zinc-rich primers for reinforcement', 2020, 0.84, 'Above 80 % zinc in dry film gave galvanic protection; below 75 % only barrier.', 'Zinc loading and galvanic protection')],
  measured: ['zinc-content', 'salt-spray', 'pull-off', 'drying-time'],
  mixingProtocol: ['Component A: epoxy, solvent, fumed silica; disperse zinc dust at low speed.', 'Component B: amine hardener.', 'On site: mix A+B 2 min; brush on blasted rebar in two coats.'],
  testPlan: [
    { test: 'Zinc in dry film', method: 'ISO 3549', specimens: 2, ages: '7 d', dueInDays: 9 },
    { test: 'Salt spray', method: 'ISO 9227', specimens: 3, ages: '1000 h', dueInDays: 50 },
    { test: 'Pull-off on steel', method: 'ISO 4624', specimens: 5, ages: '7 d', dueInDays: 9 },
  ],
});

/**
 * Group 5 is checked early (right after tile adhesives): its epoxy runs must beat "epoxy" (epoxy grout, resin floors),
 * precision grouts must beat bare "grout" (CG2WA), epoxy injection and anchors must beat "injection" (PU foam), and the
 * rebar primer must beat "primer" (acrylic primer). Within the group, each variant comes before what it overlaps.
 */
export const REPAIR_ROUTE_ORDER: Scenario[] = [PG_EPOXY, PG_NS, IR_EPOXY, AN_VE, FW_CFRP, PC_ZINC, PC_ANTICARB, RM_R3, RM_R4];

export const REPAIR_SCENARIOS: Scenario[] = [RM_R4, RM_R3, IR_EPOXY, PG_NS, PG_EPOXY, AN_VE, FW_CFRP, PC_ANTICARB, PC_ZINC];
