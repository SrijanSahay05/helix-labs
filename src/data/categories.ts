import type { Category, Subcategory } from '@/types';

/**
 * Single config for Group → Category card → Subcategory (sub-SKU).
 * Final lists are an open question in the brief — edit here only.
 * Competitor lists are intentionally empty for now.
 */
export const GROUPS: { id: Category['group']; name: string; plain: string }[] = [
  { id: 1, name: 'Concrete and cement', plain: 'Making and pouring concrete' },
  { id: 2, name: 'Masonry and wall build-up', plain: 'Building and finishing walls' },
  { id: 3, name: 'Waterproofing and sealing', plain: 'Keeping water out' },
  { id: 4, name: 'Tile, stone and flooring', plain: 'Tiles, stone and floors' },
  { id: 5, name: 'Repair, strengthening and protection', plain: 'Fixing and protecting structures' },
  { id: 6, name: 'Specialty', plain: 'Special jobs' },
];

const T = {
  tileAdhesive: ['polymer-content', 'water-demand', 'voc', 'open-time', 'slip', 'pot-life', 'adh-initial', 'adh-water', 'adh-heat', 'adh-ft', 'transverse-def', 'water-absorption', 'service-temp'],
  grout: ['water-demand', 'voc', 'flow', 'pot-life', 'setting-time', 'compressive', 'flexural', 'shrinkage', 'abrasion', 'water-absorption'],
  epoxyGrout: ['mix-ratio', 'voc', 'chem-resistance', 'pot-life', 'viscosity', 'compressive', 'flexural', 'shrinkage', 'water-absorption', 'service-temp'],
  waterproofing: ['solids', 'voc', 'pot-life', 'setting-time', 'pull-off', 'crack-bridging', 'permeability', 'neg-pressure', 'self-healing', 'compressive', 'coverage'],
  admixture: ['solids', 'ph', 'chloride', 'alkali', 'water-reduction', 'slump-retention', 'setting-time', 'air-content', 'compressive-1d', 'compressive'],
  plaster: ['water-demand', 'setting-time', 'water-retention', 'fresh-density', 'compressive', 'flexural', 'pull-off', 'shrinkage', 'coverage'],
  repair: ['water-demand', 'flow', 'setting-time', 'compressive-1d', 'compressive', 'flexural', 'pull-off', 'shrinkage', 'expansion', 'modulus', 'chloride', 'permeability'],
  sealant: ['voc', 'viscosity', 'sag', 'drying-time', 'movement-capability', 'secant-modulus', 'elongation', 'hardness', 'uv', 'service-temp'],
  coating: ['solids', 'voc', 'viscosity', 'pot-life', 'pull-off', 'elongation', 'crack-bridging', 'uv', 'reflectance', 'vapour', 'chem-resistance'],
  shotcrete: ['solids', 'ph', 'alkali', 'chloride', 'setting-time', 'early-strength', 'compressive-1d', 'compressive'],
  fibre: ['compressive', 'flexural', 'residual-flexural', 'crack-reduction', 'shrinkage', 'air-content'],
  grindingAid: ['solids', 'ph', 'chloride', 'blaine', 'residue-45', 'mill-output', 'setting-time', 'compressive-1d', 'compressive'],
  curing: ['solids', 'voc', 'viscosity', 'drying-time', 'moisture-loss', 'reflectance'],
  membrane: ['tensile-strength', 'elongation', 'cold-flex', 'service-temp', 'permeability', 'crack-bridging', 'uv', 'pull-off'],
  injection: ['viscosity', 'gel-time', 'foam-expansion', 'pot-life', 'elongation', 'pull-off', 'water-absorption', 'service-temp'],
  release: ['viscosity', 'voc', 'release-efficiency', 'shelf-life', 'service-temp'],
  structural: ['viscosity', 'pot-life', 'gel-time', 'setting-time', 'bond-strength', 'resin-tensile', 'elongation', 'pull-off', 'tg', 'compressive'],
  fire: ['solids', 'voc', 'viscosity', 'drying-time', 'pull-off', 'char-expansion', 'fire-resistance'],
  tbm: ['solids', 'ph', 'viscosity', 'foam-expansion', 'half-life', 'biodegradability'],
  foam: ['foam-expansion', 'foam-density', 'drying-time', 'shrinkage', 'thermal-conductivity', 'service-temp'],
  generic: ['solids', 'voc', 'viscosity', 'pot-life', 'setting-time', 'compressive', 'pull-off', 'shrinkage', 'service-temp'],
};

const sku = (
  id: string,
  name: string,
  chemistry: string[],
  forms: string[],
  defaultStandard: string,
  tpl: string[],
  types?: string[],
): Subcategory => ({ id, name, chemistry, forms, defaultStandard, propertyTemplate: tpl, types, competitors: [] });

const cat = (
  id: string,
  group: Category['group'],
  name: string,
  icon: string,
  example: string,
  plainExample: string,
  subcategories: Subcategory[],
): Category => ({ id, group, groupName: GROUPS[group - 1].name, name, icon, example, plainExample, subcategories });

export const CATEGORIES: Category[] = [
  // 1 Concrete and cement
  cat('admixtures', 1, 'Admixtures', 'FlaskConical', 'PCE superplasticisers, retarders, accelerators', 'Liquids added to concrete to make it flow or set right', [
    sku('adm-plasticiser', 'Plasticisers', ['PCE/SNF'], ['liquid', 'powder'], 'IS 9103 / EN 934-2', T.admixture),
    sku('adm-pce', 'Superplasticisers (PCE)', ['PCE/SNF'], ['liquid'], 'IS 9103 / EN 934-2 T3.1/3.2', T.admixture),
    sku('adm-retarder', 'Retarders', ['PCE/SNF'], ['liquid'], 'IS 9103 / EN 934-2 T8', T.admixture),
    sku('adm-accelerator', 'Accelerators', ['PCE/SNF'], ['liquid', 'powder'], 'IS 9103 / EN 934-2 T6', T.admixture),
    sku('adm-air', 'Air entrainers', ['PCE/SNF'], ['liquid'], 'EN 934-2 T5', [...T.admixture, 'spacing-factor', 'freeze-thaw']),
    sku('adm-wp', 'Waterproofing admixtures', ['crystalline', 'PCE/SNF'], ['liquid', 'powder'], 'EN 934-2 T9', [...T.admixture, 'permeability', 'water-absorption']),
    sku('adm-ci', 'Corrosion inhibitors', ['PCE/SNF'], ['liquid'], 'ASTM C1582', [...T.admixture, 'corrosion-reduction']),
  ]),
  cat('shotcrete-acc', 1, 'Shotcrete accelerators', 'Wind', 'Alkali-free liquid accelerators', 'Makes sprayed concrete stick and set fast', [
    sku('sc-af', 'Alkali-free accelerator', ['PCE/SNF'], ['liquid'], 'EN 934-5', T.shotcrete),
    sku('sc-alk', 'Alkaline accelerator', ['PCE/SNF'], ['liquid'], 'EN 934-5', T.shotcrete),
  ]),
  cat('fibres', 1, 'Fibres', 'Spline', 'PP micro-fibres, steel fibres', 'Tiny fibres that stop cracks', [
    sku('fib-pp', 'Polypropylene micro-fibre', ['polymer-modified'], ['sheet'], 'EN 14889-2', T.fibre),
    sku('fib-steel', 'Steel fibre', ['cementitious'], ['sheet'], 'EN 14889-1', T.fibre),
  ]),
  cat('grinding-aids', 1, 'Cement grinding aids', 'Cog', 'Amine/glycol grinding aids', 'Helps cement plants grind faster', [
    sku('ga-glycol', 'Glycol-based grinding aid', ['PCE/SNF'], ['liquid'], 'EN 197-1 / ASTM C465', T.grindingAid),
    sku('ga-amine', 'Amine-based performance enhancer', ['PCE/SNF'], ['liquid'], 'EN 197-1 / ASTM C465', T.grindingAid),
  ]),
  cat('curing', 1, 'Curing compounds', 'Droplets', 'Wax / resin curing membranes', 'Keeps fresh concrete from drying too fast', [
    sku('cur-wax', 'Wax emulsion', ['acrylic'], ['liquid'], 'ASTM C309', T.curing),
    sku('cur-resin', 'Resin-based', ['acrylic'], ['liquid'], 'ASTM C309', T.curing),
  ]),
  cat('release', 1, 'Release agents', 'Layers', 'Formwork release oils', 'Stops concrete sticking to moulds', [
    sku('rel-oil', 'Mineral-oil release agent', ['acrylic'], ['liquid'], 'internal', T.release),
    sku('rel-emul', 'Emulsion release agent', ['acrylic'], ['liquid'], 'internal', T.release),
  ]),
  // 2 Masonry and wall build-up
  cat('block-jointing', 2, 'Block-jointing mortar', 'Grid3x3', 'Thin-bed AAC block mortar', 'Glue for building block walls', [
    sku('bj-aac', 'AAC thin-bed mortar', ['cementitious', 'polymer-modified'], ['powder'], 'IS 2250 / EN 998-2', T.plaster),
  ]),
  cat('plaster', 2, 'Plaster', 'PaintRoller', 'Ready-mix plaster, gypsum plaster', 'Smooth layer on walls', [
    sku('pl-readymix', 'Ready-mix plaster', ['cementitious'], ['powder'], 'IS 1542 / EN 998-1', T.plaster),
    sku('pl-gypsum', 'Gypsum plaster', ['cementitious'], ['powder'], 'IS 2547 / EN 13279-1', T.plaster),
  ]),
  cat('putty', 2, 'Wall putty and skim coat', 'Brush', 'White cement putty', 'Fills small dents before painting', [
    sku('pt-wc', 'White-cement wall putty', ['cementitious', 'polymer-modified'], ['powder'], 'IS 16975', T.plaster),
    sku('pt-acrylic', 'Acrylic putty', ['acrylic'], ['paste'], 'internal', T.plaster),
  ]),
  cat('bonding', 2, 'Bonding agents and primers', 'Link', 'SBR / acrylic bonding agents', 'Helps new layers stick to old ones', [
    sku('bd-sbr', 'SBR bonding agent', ['polymer-modified'], ['liquid'], 'ASTM C1059', T.coating),
    sku('bd-acr', 'Acrylic primer', ['acrylic'], ['liquid'], 'internal', T.coating),
  ]),
  cat('thermal', 2, 'Thermal insulation mortars', 'Thermometer', 'EPS / perlite lightweight mortar', 'Keeps buildings cooler', [
    sku('th-perlite', 'Perlite lightweight mortar', ['cementitious'], ['powder'], 'EN 998-1 T', [...T.plaster, 'thermal-conductivity']),
  ]),
  // 3 Waterproofing and sealing
  cat('wp-coatings', 3, 'Waterproofing coatings', 'Umbrella', 'Cementitious, acrylic, PU, bituminous, crystalline', 'Paint-on layers that keep water out', [
    sku('wpc-cem', 'Cementitious', ['cementitious', 'polymer-modified'], ['powder', '2-component'], 'EN 1504-2 / EN 14891', T.waterproofing),
    sku('wpc-acr', 'Acrylic', ['acrylic'], ['liquid'], 'ASTM D6083', T.coating),
    sku('wpc-pu', 'Polyurethane', ['polyurethane'], ['liquid', '2-component'], 'ASTM C836', T.coating),
    sku('wpc-bit', 'Bituminous', ['bituminous'], ['liquid'], 'IS 1580 / EN 15814', T.coating),
    sku('wpc-cryst', 'Crystalline', ['crystalline', 'cementitious'], ['powder'], 'EN 1504-2 / ACI 212.3R', T.waterproofing),
  ]),
  cat('membranes', 3, 'Membranes', 'StretchHorizontal', 'APP/SBS, HDPE sheet membranes', 'Sheets laid to block water', [
    sku('mb-app', 'APP modified bitumen', ['bituminous'], ['sheet'], 'EN 13707 / ASTM D6222', T.membrane),
    sku('mb-hdpe', 'HDPE pre-applied', ['polymer-modified'], ['sheet'], 'EN 13967', T.membrane),
  ]),
  cat('sealants', 3, 'Joint sealants', 'Pipette', 'PU / MS / silicone sealants', 'Fills gaps between panels', [
    sku('sl-pu', 'PU sealant', ['polyurethane'], ['paste'], 'EN 15651 / ASTM C920', T.sealant),
    sku('sl-ms', 'MS polymer sealant', ['polymer-modified'], ['paste'], 'EN 15651', [...T.sealant, 'shear-adh']),
  ]),
  cat('injection', 3, 'Injection systems for leaks', 'Syringe', 'PU foam / acrylic gel injection', 'Stops active leaks from inside', [
    sku('inj-pu', 'PU foam injection', ['polyurethane'], ['liquid', '2-component'], 'EN 1504-5', T.injection),
    sku('inj-acr', 'Acrylic gel injection', ['acrylic'], ['liquid', '2-component'], 'EN 1504-5', T.injection),
  ]),
  // 4 Tile, stone and flooring
  cat('tile-adhesives', 4, 'Tile and stone adhesives', 'LayoutGrid', 'C1, C2, C2TE S1 deformable', 'Sticking tiles to walls and floors', [
    sku('ta-c1', 'C1 standard', ['cementitious'], ['powder'], 'IS 15477 Type 1 / EN 12004 C1', T.tileAdhesive),
    sku('ta-c2', 'C2 polymer-modified', ['polymer-modified'], ['powder'], 'IS 15477 Type 2 / EN 12004 C2', T.tileAdhesive),
    sku('ta-c2te-s1', 'C2TE S1 deformable', ['polymer-modified'], ['powder'], 'IS 15477 Type 4 T S2 / EN 12004 C2TE S1', T.tileAdhesive),
    sku('ta-c2te-s2', 'C2TE S2 highly deformable', ['polymer-modified'], ['powder', '2-component'], 'IS 15477 Type 5 / EN 12004 C2TE S2', T.tileAdhesive),
    sku('ta-paste', 'Ready-mix paste (D2)', ['acrylic'], ['paste'], 'EN 12004 D2TE', T.tileAdhesive),
  ]),
  cat('tile-grouts', 4, 'Tile grouts', 'Grid2x2', 'CG2WA cementitious grouts', 'Fills the gaps between tiles', [
    sku('tg-cg1', 'CG1 standard grout', ['cementitious'], ['powder'], 'EN 13888 CG1', T.grout),
    sku('tg-cg2', 'CG2WA improved grout', ['polymer-modified'], ['powder'], 'EN 13888 CG2WA', T.grout),
  ]),
  cat('epoxy-grouts', 4, 'Epoxy grouts', 'Hexagon', 'RG 3-component epoxy grout', 'Stain-proof grout for kitchens and pools', [
    sku('eg-rg', 'RG epoxy grout (3-part)', ['epoxy'], ['2-component', 'paste'], 'EN 13888 RG / ISO 13007-3 RG', T.epoxyGrout),
  ]),
  cat('stone-care', 4, 'Stone care and sealers', 'Gem', 'Impregnating sealers', 'Protects natural stone from stains', [
    sku('sc-imp', 'Impregnating sealer', ['acrylic'], ['liquid'], 'EN 1504-2 (hydrophobic impregnation)', [...T.coating, 'water-absorption', 'stain-resistance']),
  ]),
  cat('slc', 4, 'Self-levelling compounds', 'AlignHorizontalJustifyCenter', 'CT-C25-F6 underlayments', 'Makes floors flat before finishing', [
    sku('slc-ct', 'Cementitious SLC CT-C25-F6', ['cementitious', 'polymer-modified'], ['powder'], 'EN 13813', T.repair),
  ]),
  cat('screeds', 4, 'Screeds', 'Rows3', 'Fast-drying screed binders', 'Base layer for floors', [
    sku('scr-fast', 'Rapid-dry screed', ['cementitious'], ['powder'], 'EN 13813', T.repair),
  ]),
  cat('floor-hardeners', 4, 'Floor hardeners', 'Shield', 'Dry-shake metallic hardeners', 'Makes warehouse floors wear-proof', [
    sku('fh-dry', 'Dry-shake hardener', ['cementitious'], ['powder'], 'EN 13813 AR0.5', T.repair),
  ]),
  cat('resin-floors', 4, 'Resin floors', 'Square', 'Epoxy, polyurethane', 'Seamless shiny floors for factories', [
    sku('rf-epoxy', 'Epoxy', ['epoxy'], ['2-component'], 'EN 13813 SR', T.coating),
    sku('rf-pu', 'Polyurethane', ['polyurethane'], ['2-component'], 'EN 13813 SR', T.coating),
  ]),
  // 5 Repair, strengthening and protection
  cat('repair-mortars', 5, 'Repair mortars', 'Hammer', 'R3/R4 polymer-modified repair mortars', 'Patching broken concrete', [
    sku('rm-r3', 'R3 structural repair', ['polymer-modified'], ['powder'], 'EN 1504-3 R3', T.repair),
    sku('rm-r4', 'R4 structural repair', ['polymer-modified'], ['powder'], 'EN 1504-3 R4', T.repair),
  ]),
  cat('micro-concrete', 5, 'Micro-concrete', 'Box', 'Free-flow micro-concrete for jacketing', 'Pourable concrete for column jackets', [
    sku('mc-ff', 'Free-flow micro-concrete', ['cementitious'], ['powder'], 'EN 1504-3 R4 / ASTM C928', T.repair),
  ]),
  cat('inj-resins', 5, 'Structural injection resins', 'Syringe', 'Low-viscosity epoxy injection', 'Glues cracks back together', [
    sku('ir-epoxy', 'Low-viscosity epoxy', ['epoxy'], ['2-component', 'liquid'], 'EN 1504-5 / ASTM C881', T.structural),
  ]),
  cat('precision-grouts', 5, 'Precision grouts', 'Cylinder', 'Non-shrink cementitious grouts', 'Fills under machine base plates', [
    sku('pg-ns', 'Non-shrink cementitious grout', ['cementitious'], ['powder'], 'ASTM C1107 / EN 1504-6', T.repair),
    sku('pg-epoxy', 'Epoxy precision grout', ['epoxy'], ['2-component'], 'ASTM C579', T.epoxyGrout),
  ]),
  cat('anchors', 5, 'Anchors', 'Anchor', 'Chemical anchors (epoxy/vinylester)', 'Fixes rods into concrete', [
    sku('an-ve', 'Vinylester chemical anchor', ['epoxy'], ['2-component', 'paste'], 'EAD 330499', T.structural),
  ]),
  cat('fibre-wrap', 5, 'Fibre wrap', 'Ribbon', 'CFRP sheets + saturant', 'Carbon sheets to strengthen beams', [
    sku('fw-cfrp', 'CFRP saturant system', ['epoxy'], ['sheet', '2-component'], 'ACI 440.2R', T.structural),
  ]),
  cat('protective', 5, 'Anti-corrosion and protective coatings', 'ShieldCheck', 'Zinc-rich primers, anti-carbonation', 'Stops rust and protects concrete', [
    sku('pc-anticarb', 'Anti-carbonation coating', ['acrylic'], ['liquid'], 'EN 1504-2', [...T.coating, 'co2-resistance']),
    sku('pc-zinc', 'Zinc-rich rebar primer', ['epoxy'], ['liquid'], 'EN 1504-7', [...T.coating, 'zinc-content', 'salt-spray', 'drying-time']),
  ]),
  // 6 Specialty
  cat('fire', 6, 'Fire protection', 'Flame', 'Intumescent coatings, firestop', 'Slows fire spreading through a building', [
    sku('fp-intumescent', 'Intumescent coatings', ['acrylic', 'epoxy'], ['liquid'], 'BS 476-20 / EN 13381-8', T.fire),
    sku('fp-firestop', 'Firestop', ['acrylic'], ['paste'], 'EN 1366-3', [...T.sealant, 'fire-resistance', 'char-expansion']),
  ]),
  cat('tunnelling', 6, 'Tunnelling and mining chemicals', 'Mountain', 'TBM foams, soil conditioners', 'Chemicals for digging tunnels', [
    sku('tn-foam', 'TBM foaming agent', ['polymer-modified'], ['liquid'], 'EFNARC', T.tbm),
  ]),
  cat('constr-adhesives', 6, 'Construction adhesives and foams', 'Sticker', 'PU foam, MS adhesives', 'Glues and gap-filling foams', [
    sku('ca-pufoam', 'PU gap-filling foam', ['polyurethane'], ['liquid'], 'EN 17333', T.foam),
    sku('ca-ms', 'MS polymer adhesive', ['polymer-modified'], ['paste'], 'EN 15651', T.sealant),
  ]),
];

export const CHEMISTRIES = ['cementitious', 'polymer-modified', 'epoxy', 'polyurethane', 'acrylic', 'bituminous', 'crystalline', 'PCE/SNF'];
export const FORMS = ['powder', 'liquid', 'paste', '2-component', 'sheet'];

export function findCategory(id?: string) {
  return CATEGORIES.find((c) => c.id === id);
}
export function findSubcategory(id?: string): { cat: Category; sub: Subcategory } | undefined {
  for (const c of CATEGORIES) {
    const s = c.subcategories.find((x) => x.id === id);
    if (s) return { cat: c, sub: s };
  }
  return undefined;
}
