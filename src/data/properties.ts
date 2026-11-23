import type { Property, PropertyGroup, StandardFamily } from '@/types';

/** Property library — draft, for R&D to confirm. Each subcategory loads its own subset. */
const P = (
  id: string,
  group: PropertyGroup,
  name: string,
  plainName: string,
  unit: string,
  testMethod: Property['testMethod'],
): Property => ({ id, group, name, plainName, unit, testMethod });

export const PROPERTIES: Property[] = [
  // Chemical
  P('binder-content', 'chemical', 'Binder type and content', 'Amount of cement / binder', '% w/w', { internal: 'internal' }),
  P('polymer-content', 'chemical', 'Polymer type and content (RDP)', 'Amount of flexible polymer', '% w/w', { internal: 'internal' }),
  P('polymer-cement-ratio', 'chemical', 'Polymer-to-cement ratio', 'Polymer vs cement balance', 'ratio', { internal: 'internal' }),
  P('water-demand', 'chemical', 'Water demand', 'Water needed to mix', '%', { internal: 'internal', EN: 'EN 1348 §7' }),
  P('ph', 'chemical', 'pH', 'Acidity / alkalinity', '–', { ASTM: 'ASTM E70', internal: 'internal' }),
  P('solids', 'chemical', 'Solids content', 'Active solids in the liquid', '%', { IS: 'IS 9103 Annex', EN: 'EN 480-8', ASTM: 'ASTM C494' }),
  P('voc', 'chemical', 'VOC', 'Smell / emissions', 'g/L', { EN: 'EN ISO 11890-2', ASTM: 'ASTM D2369' }),
  P('chloride', 'chemical', 'Chloride content', 'Salt that can rust steel', '% w/w', { IS: 'IS 9103', EN: 'EN 480-10', ASTM: 'ASTM C1152' }),
  P('alkali', 'chemical', 'Alkali content', 'Alkali level', '% Na₂O eq', { EN: 'EN 480-12' }),
  P('mix-ratio', 'chemical', 'Mix ratio', 'How to mix the parts', 'A:B', { internal: 'internal' }),
  P('chem-resistance', 'chemical', 'Chemical resistance', 'Stands up to chemicals', 'class', { EN: 'EN 12808-1', ASTM: 'ASTM C267' }),
  P('shelf-life', 'chemical', 'Shelf life', 'How long it keeps in the bag', 'months', { internal: 'internal' }),
  P('blaine', 'chemical', 'Cement fineness (Blaine)', 'How fine the cement is', 'cm²/g', { EN: 'EN 196-6', ASTM: 'ASTM C204' }),
  P('residue-45', 'chemical', 'Residue on 45 µm sieve', 'Coarse particles left', '%', { EN: 'EN 196-6', ASTM: 'ASTM C430' }),
  P('mill-output', 'chemical', 'Mill output gain', 'More cement per hour', '%', { internal: 'plant trial' }),
  P('hazard-class', 'chemical', 'Hazard class', 'Safety label', 'GHS', { internal: 'internal' }),
  // Rheological
  P('viscosity', 'rheological', 'Viscosity', 'How thick it is', 'mPa·s', { EN: 'EN ISO 2555', ASTM: 'ASTM D2196' }),
  P('yield-stress', 'rheological', 'Yield stress', 'Force to start flowing', 'Pa', { internal: 'rheometer' }),
  P('thixotropy', 'rheological', 'Thixotropy', 'Thick at rest, thins when worked', 'index', { internal: 'rheometer' }),
  P('flow', 'rheological', 'Flow', 'How far it spreads', 'mm', { IS: 'IS 5512', EN: 'EN 13395-1', ASTM: 'ASTM C1437' }),
  P('sag', 'rheological', 'Sag resistance', 'Stays put on vertical surfaces', 'mm', { EN: 'EN 1504-3', ASTM: 'ASTM D4400' }),
  P('slip', 'rheological', 'Slip', "Tiles don't slide down the wall", 'mm', { IS: 'IS 15477 Annex E', EN: 'EN 1308' }),
  P('open-time', 'rheological', 'Open time', 'How long you can work before placing tiles', 'N/mm² @ 30 min', { IS: 'IS 15477 Annex D', EN: 'EN 1346' }),
  P('adjustability', 'rheological', 'Adjustability', 'How long you can still nudge a tile', 'min', { internal: 'internal' }),
  P('pot-life', 'rheological', 'Pot life', 'How long the mix stays usable', 'h', { internal: 'internal', ASTM: 'ASTM C308' }),
  P('setting-time', 'rheological', 'Setting time', 'How fast it hardens', 'min', { IS: 'IS 4031-5', EN: 'EN 196-3', ASTM: 'ASTM C191' }),
  P('water-retention', 'rheological', 'Water retention', 'Keeps water in while curing', '%', { EN: 'EN 1015-8', ASTM: 'ASTM C1506' }),
  P('wetting', 'rheological', 'Wetting', 'How well it wets the tile back', '% coverage', { EN: 'EN 1346 §wetting', internal: 'internal' }),
  P('fresh-density', 'rheological', 'Fresh density', 'Weight of the wet mix', 'kg/m³', { EN: 'EN 1015-6', ASTM: 'ASTM C185' }),
  P('air-content', 'rheological', 'Air content', 'Air bubbles in the mix', '%', { IS: 'IS 1199', EN: 'EN 1015-7', ASTM: 'ASTM C231' }),
  P('bleeding', 'rheological', 'Bleeding', 'Water rising to the top', '%', { EN: 'EN 480-4', ASTM: 'ASTM C940' }),
  P('drying-time', 'rheological', 'Drying time', 'Dry to touch in', 'h', { ASTM: 'ASTM D1640' }),
  P('slump-retention', 'rheological', 'Slump retention @ 60 min', 'Stays workable in the truck', 'mm', { IS: 'IS 1199', EN: 'EN 12350-2', ASTM: 'ASTM C143' }),
  P('water-reduction', 'rheological', 'Water reduction', 'Water saved in the mix', '%', { IS: 'IS 9103', EN: 'EN 934-2', ASTM: 'ASTM C494' }),
  // Mechanical
  P('adh-initial', 'mechanical', 'Tensile adhesion — initial', 'How well it grips', 'N/mm²', { IS: 'IS 15477 Annex F', EN: 'EN 1348', ASTM: 'ASTM C1583' }),
  P('adh-water', 'mechanical', 'Tensile adhesion — water immersion', 'Grip after getting soaked', 'N/mm²', { IS: 'IS 15477 Annex F', EN: 'EN 1348' }),
  P('adh-heat', 'mechanical', 'Tensile adhesion — heat ageing', 'Grip after hot weather', 'N/mm²', { IS: 'IS 15477 Annex F', EN: 'EN 1348' }),
  P('adh-ft', 'mechanical', 'Tensile adhesion — freeze-thaw', 'Grip after freezing and thawing', 'N/mm²', { IS: 'IS 15477 Annex F', EN: 'EN 1348' }),
  P('shear-adh', 'mechanical', 'Shear adhesion', 'Grip against sideways push', 'N/mm²', { EN: 'EN 12003' }),
  P('compressive', 'mechanical', 'Compressive strength (28 d)', 'How much weight it can take', 'N/mm²', { IS: 'IS 4031-6', EN: 'EN 196-1', ASTM: 'ASTM C109' }),
  P('compressive-1d', 'mechanical', 'Compressive strength (1 d)', 'Early strength next day', 'N/mm²', { IS: 'IS 4031-6', EN: 'EN 196-1', ASTM: 'ASTM C109' }),
  P('flexural', 'mechanical', 'Flexural strength', 'Resistance to bending', 'N/mm²', { IS: 'IS 4031', EN: 'EN 196-1', ASTM: 'ASTM C348' }),
  P('transverse-def', 'mechanical', 'Transverse deformation', 'Flexibility (handles wall movement)', 'mm', { IS: 'IS 15477 Annex H', EN: 'EN 12002' }),
  P('elongation', 'mechanical', 'Elongation at break', 'How far it stretches', '%', { EN: 'EN ISO 527', ASTM: 'ASTM D412' }),
  P('crack-bridging', 'mechanical', 'Crack bridging', 'Covers cracks without tearing', 'mm', { EN: 'EN 14891', ASTM: 'ASTM C1305' }),
  P('modulus', 'mechanical', 'Modulus (elastic)', 'Stiffness', 'GPa', { EN: 'EN 13412', ASTM: 'ASTM C469' }),
  P('shrinkage', 'mechanical', 'Shrinkage', 'How much it shrinks', 'mm/m', { IS: 'IS 4031-10', EN: 'EN 12617-4', ASTM: 'ASTM C157' }),
  P('expansion', 'mechanical', 'Expansion (non-shrink)', 'Stays tight under plates', '%', { ASTM: 'ASTM C1090', EN: 'EN 445' }),
  P('abrasion', 'mechanical', 'Abrasion resistance', 'Resists wear', 'mm³', { EN: 'EN 13892-4', ASTM: 'ASTM C944' }),
  P('hardness', 'mechanical', 'Hardness', 'Surface hardness', 'Shore D', { ASTM: 'ASTM D2240' }),
  P('early-strength', 'mechanical', 'Early strength (6 h)', 'Strength a few hours after spraying', 'N/mm²', { EN: 'EN 14488-2' }),
  P('residual-flexural', 'mechanical', 'Residual flexural strength (fR3)', 'Strength left after cracking', 'N/mm²', { EN: 'EN 14651', ASTM: 'ASTM C1609' }),
  P('pull-off', 'mechanical', 'Pull-off bond', 'Sticks to the old concrete', 'N/mm²', { IS: 'IS 13311', EN: 'EN 1542', ASTM: 'ASTM C1583' }),
  // Durability
  P('water-absorption', 'durability', 'Water absorption', 'Soaks up water', '%', { EN: 'EN 12808-5', ASTM: 'ASTM C642' }),
  P('permeability', 'durability', 'Permeability (water penetration)', 'Water getting through', 'mm', { IS: 'IS 3085', EN: 'EN 12390-8', ASTM: 'ASTM D5084' }),
  P('neg-pressure', 'durability', 'Negative-side water pressure', 'Holds water pushing from behind', 'bar', { EN: 'EN 12390-8', ASTM: 'CRD C48' }),
  P('vapour', 'durability', 'Vapour transmission', 'Lets the wall breathe', 'g/m²·d', { EN: 'EN ISO 7783', ASTM: 'ASTM E96' }),
  P('freeze-thaw', 'durability', 'Freeze-thaw resistance', 'Survives freezing', 'cycles', { EN: 'EN 13687-1', ASTM: 'ASTM C666' }),
  P('uv', 'durability', 'UV resistance', 'Survives sunlight', 'h', { ASTM: 'ASTM G154' }),
  P('service-temp', 'durability', 'Service temperature', 'Temperature range in use', '°C', { internal: 'internal' }),
  P('efflorescence', 'durability', 'Efflorescence', 'White salt marks', 'rating', { internal: 'internal' }),
  P('coverage', 'durability', 'Coverage', 'How far a bag goes', 'kg/m²', { internal: 'internal' }),
  P('thermal-conductivity', 'durability', 'Thermal conductivity', 'How much heat gets through', 'W/m·K', { EN: 'EN 1745 / EN 12667', ASTM: 'ASTM C518' }),
  P('crack-reduction', 'durability', 'Plastic-shrinkage crack reduction', 'Fewer early cracks', '%', { ASTM: 'ASTM C1579' }),
  P('moisture-loss', 'durability', 'Moisture loss (72 h)', 'Water lost while curing', 'kg/m²', { ASTM: 'ASTM C156' }),
  P('release-efficiency', 'durability', 'Release efficiency', 'Clean surface after demoulding', '%', { internal: 'internal' }),
  P('spacing-factor', 'durability', 'Air-void spacing factor', 'How evenly air bubbles spread', 'mm', { EN: 'EN 480-11', ASTM: 'ASTM C457' }),
  P('corrosion-reduction', 'durability', 'Corrosion reduction', 'Less rust on steel', '%', { ASTM: 'ASTM C1582 / G109' }),
  P('self-healing', 'durability', 'Crack self-healing width', 'Seals small cracks by itself', 'mm', { internal: 'internal', EN: 'EN 12390-8' }),
  P('cost', 'chemical', 'Cost per kg', 'Price per kg', '₹/kg', { internal: 'computed' }),
];

export const PROP: Record<string, Property> = Object.fromEntries(PROPERTIES.map((p) => [p.id, p]));

export const GROUP_ORDER: PropertyGroup[] = ['chemical', 'rheological', 'mechanical', 'durability'];
export const GROUP_LABEL: Record<PropertyGroup, string> = {
  chemical: 'Chemical',
  rheological: 'Rheological (fresh state)',
  mechanical: 'Mechanical (hardened state)',
  durability: 'Durability',
};
export const GROUP_PLAIN: Record<PropertyGroup, string> = {
  chemical: 'What goes in it',
  rheological: 'While you apply it',
  mechanical: 'Once it has hardened',
  durability: 'Over the years',
};

/** Pick the test method for a property using the first enabled standard family. */
export function methodFor(propertyId: string, enabled: StandardFamily[]): string {
  const p = PROP[propertyId];
  if (!p) return '—';
  for (const fam of enabled) {
    const m = p.testMethod[fam];
    if (m) return m;
  }
  return p.testMethod.internal ?? '—';
}
