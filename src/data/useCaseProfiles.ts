import type { UseCase } from '@/types';
import { findSubcategory } from './categories';
import { STANDARD_CLASSES } from './standards';
import { CLIMATES, LOADS, MATERIAL_TYPES, METHODS, SUBSTRATES, SURFACES } from './useCaseOptions';

/**
 * Which use-case fields a brief fills depends on the product: a tile adhesive needs tile size and time to grout,
 * an admixture needs concrete grade and haul time. Labels live in USE_CASE_LABEL (copy.ts); input shape lives here.
 */
export type UseCaseKey = keyof UseCase;

export type FieldSpec =
  | { kind: 'select'; options: string[] }
  | { kind: 'chips'; options: string[] }
  | { kind: 'number'; unit?: string }
  | { kind: 'range'; unit: string; min: number; max: number }
  | { kind: 'size' }
  | { kind: 'toggle'; options: string[] };

const sel = (options: string[]): FieldSpec => ({ kind: 'select', options });
const num = (unit?: string): FieldSpec => ({ kind: 'number', unit });

export const FIELDS: Record<UseCaseKey, FieldSpec> = {
  // shared
  substrate: sel(SUBSTRATES),
  surfaces: { kind: 'chips', options: SURFACES },
  exposure: { kind: 'toggle', options: ['interior', 'exterior'] },
  climate: sel(CLIMATES),
  appTemp: { kind: 'range', unit: '°C', min: -10, max: 50 },
  load: sel(LOADS),
  method: sel(METHODS),
  standardClass: sel(STANDARD_CLASSES),
  element: sel(['Column / beam', 'Slab', 'Wall', 'Foundation', 'Precast element', 'Tunnel lining', 'Steel section']),
  thicknessMm: num('mm'),
  timeToTrafficH: num('h'),
  // tiles and grouts
  materialType: sel(MATERIAL_TYPES),
  size: { kind: 'size' },
  timeToGroutH: num('h'),
  jointWidthMm: num('mm'),
  chemicalExposure: sel(['None', 'Household cleaners', 'Kitchen acids / fats', 'Pool chlorine', 'Industrial acids / alkalis']),
  colour: sel(['Grey', 'White', 'Pigmented']),
  // concrete and cement
  concreteGrade: sel(['M20–M25', 'M30–M50', 'M50–M80', 'Shotcrete', 'Precast']),
  cementType: sel(['OPC 53', 'OPC 43', 'PPC', 'PSC', 'Composite cement']),
  wcRatio: num(),
  dosagePct: { kind: 'range', unit: '% bwc', min: 0, max: 10 },
  slumpRetentionMin: num('min'),
  haulTimeMin: num('min'),
  millType: sel(['Ball mill (closed circuit)', 'Ball mill (open circuit)', 'Vertical roller mill']),
  blaineTarget: num('cm²/g'),
  clinkerFactor: num('%'),
  dosageKgM3: num('kg/m³'),
  formworkType: sel(['Plywood', 'Steel', 'Aluminium', 'Plastic', 'None (exposed slab)']),
  reuseCycles: num(),
  // walls
  coats: num(),
  finish: sel(['Paint-ready smooth', 'Textured', 'Tile-ready', 'Exposed / wearing surface', 'Coating-ready']),
  coverageKgM2: num('kg/m²'),
  // waterproofing, sealing, injection
  waterExposure: sel(['Rain / splash', 'Wet room', 'Positive side (pressure from front)', 'Negative side (pressure from behind)', 'Submerged']),
  crackMovementMm: num('mm'),
  uvExposure: sel(['None', 'Partial', 'Full sun']),
  potableContact: { kind: 'toggle', options: ['No', 'Yes'] },
  movementPct: num('%'),
  substrate2: sel(SUBSTRATES),
  paintable: { kind: 'toggle', options: ['No', 'Yes'] },
  crackWidthMm: num('mm'),
  leakState: sel(['Dry', 'Damp', 'Active seepage', 'Running water']),
  depthMm: num('mm'),
  // floors and repair
  areaM2: num('m²'),
  substrateMoisturePct: num('%'),
  timeToWalkH: num('h'),
  flowClass: sel(['Trowel (non-flowing)', 'Pourable', 'Free-flow', 'Pumpable']),
  timeToServiceH: num('h'),
  // structural
  designLoadKN: num('kN'),
  substrateCondition: sel(['Uncracked', 'Cracked', 'Damp', 'Underwater']),
  embedDepthMm: num('mm'),
  layers: num(),
  // fire and tunnelling
  fireRatingMin: num('min'),
  sectionFactor: num('m⁻¹'),
  soilType: sel(['Clay', 'Silt', 'Sand', 'Gravel', 'Mixed face', 'Rock']),
  tbmDiameterM: num('m'),
  fer: num(),
  firPct: num('%'),
};

export type ProfileId =
  | 'tile-fix' | 'grout' | 'admixture' | 'plant' | 'fibre' | 'formwork-cure' | 'wall-mortar'
  | 'barrier' | 'joint' | 'injection' | 'floor' | 'repair' | 'structural' | 'fire' | 'tunnel';

export interface UseCaseProfile {
  /** fields in fill order */
  fields: UseCaseKey[];
  /** failure modes for lab results: [0] is the failing mode, [1] and [2] are passing modes */
  failureModes: string[];
}

const SITE: UseCaseKey[] = ['exposure', 'climate', 'appTemp'];

export const PROFILES: Record<ProfileId, UseCaseProfile> = {
  'tile-fix': {
    fields: ['substrate', 'surfaces', 'materialType', 'size', ...SITE, 'load', 'method', 'timeToGroutH', 'timeToTrafficH', 'standardClass'],
    failureModes: ['Adhesive (tile interface)', 'Cohesive in adhesive', 'Cohesive in substrate', 'Tile failure'],
  },
  grout: {
    fields: ['surfaces', 'materialType', 'jointWidthMm', ...SITE, 'chemicalExposure', 'colour', 'load', 'method', 'timeToTrafficH', 'standardClass'],
    failureModes: ['Edge debonding', 'Cohesive in grout', 'Cohesive in tile edge', 'Washout / cracking'],
  },
  admixture: {
    fields: ['concreteGrade', 'cementType', 'wcRatio', 'dosagePct', 'slumpRetentionMin', 'haulTimeMin', 'climate', 'appTemp', 'method', 'standardClass'],
    failureModes: ['Non-uniform (explosive)', 'Satisfactory (hourglass)', 'Satisfactory (cone)', 'Segregation / honeycombing'],
  },
  plant: {
    fields: ['cementType', 'millType', 'blaineTarget', 'clinkerFactor', 'dosagePct', 'climate', 'standardClass'],
    failureModes: ['Low strength (under-ground)', 'Satisfactory (hourglass)', 'Satisfactory (cone)', 'Pack set / false set'],
  },
  fibre: {
    fields: ['concreteGrade', 'element', 'dosageKgM3', 'thicknessMm', ...SITE, 'load', 'method', 'standardClass'],
    failureModes: ['Brittle at first crack', 'Ductile — fibre pull-out', 'Ductile — multiple cracking', 'Fibre balling'],
  },
  'formwork-cure': {
    fields: ['element', 'formworkType', 'reuseCycles', 'concreteGrade', ...SITE, 'method', 'standardClass'],
    failureModes: ['Surface dusting / crazing', 'Sound surface', 'Clean release', 'Staining'],
  },
  'wall-mortar': {
    fields: ['substrate', 'surfaces', 'thicknessMm', 'coats', 'finish', 'coverageKgM2', ...SITE, 'method', 'standardClass'],
    failureModes: ['Adhesive (substrate interface)', 'Cohesive in mortar', 'Cohesive in substrate', 'Cracking / delamination'],
  },
  barrier: {
    fields: ['substrate', 'surfaces', 'waterExposure', 'crackMovementMm', 'thicknessMm', 'coats', 'uvExposure', 'potableContact', ...SITE, 'load', 'method', 'timeToTrafficH', 'standardClass'],
    failureModes: ['Adhesive (substrate interface)', 'Cohesive in coating', 'Cohesive in substrate', 'Blistering'],
  },
  joint: {
    fields: ['substrate', 'substrate2', 'jointWidthMm', 'movementPct', 'uvExposure', 'paintable', ...SITE, 'method', 'standardClass'],
    failureModes: ['Adhesive (joint face)', 'Cohesive in sealant', 'Mixed adhesive / cohesive', 'Substrate failure'],
  },
  injection: {
    fields: ['substrate', 'element', 'crackWidthMm', 'leakState', 'depthMm', ...SITE, 'method', 'standardClass'],
    failureModes: ['Bond failure at crack face', 'Cohesive in substrate', 'Cohesive in resin', 'Incomplete fill'],
  },
  floor: {
    fields: ['substrate', 'thicknessMm', 'areaM2', 'substrateMoisturePct', 'finish', 'chemicalExposure', ...SITE, 'load', 'method', 'timeToWalkH', 'timeToTrafficH', 'standardClass'],
    failureModes: ['Delamination from substrate', 'Cohesive in topping', 'Cohesive in substrate', 'Surface cracking'],
  },
  repair: {
    fields: ['substrate', 'element', 'thicknessMm', 'flowClass', ...SITE, 'load', 'method', 'timeToServiceH', 'standardClass'],
    failureModes: ['Adhesive (repair interface)', 'Cohesive in repair', 'Cohesive in substrate', 'Shrinkage cracking'],
  },
  structural: {
    fields: ['substrate', 'element', 'substrateCondition', 'designLoadKN', 'embedDepthMm', 'layers', ...SITE, 'method', 'timeToServiceH', 'standardClass'],
    failureModes: ['Bond failure (adhesive)', 'Concrete cone', 'Combined pull-out / cone', 'Steel or fibre rupture'],
  },
  fire: {
    fields: ['substrate', 'element', 'fireRatingMin', 'sectionFactor', 'thicknessMm', 'exposure', 'climate', 'method', 'standardClass'],
    failureModes: ['Char loss / detachment', 'Stable char', 'Uniform expansion', 'Char cracking'],
  },
  tunnel: {
    fields: ['soilType', 'tbmDiameterM', 'fer', 'firPct', 'dosagePct', 'climate', 'appTemp', 'standardClass'],
    failureModes: ['Foam collapse', 'Stable foam', 'Good soil conditioning', 'Clogging'],
  },
};

export const CATEGORY_PROFILE: Record<string, ProfileId> = {
  admixtures: 'admixture', 'shotcrete-acc': 'admixture', fibres: 'fibre', 'grinding-aids': 'plant', curing: 'formwork-cure', release: 'formwork-cure',
  'block-jointing': 'wall-mortar', plaster: 'wall-mortar', putty: 'wall-mortar', bonding: 'wall-mortar', thermal: 'wall-mortar',
  'wp-coatings': 'barrier', membranes: 'barrier', sealants: 'joint', injection: 'injection',
  'tile-adhesives': 'tile-fix', 'tile-grouts': 'grout', 'epoxy-grouts': 'grout', 'stone-care': 'barrier', slc: 'floor', screeds: 'floor', 'floor-hardeners': 'floor', 'resin-floors': 'floor',
  'repair-mortars': 'repair', 'micro-concrete': 'repair', 'inj-resins': 'injection', 'precision-grouts': 'repair', anchors: 'structural', 'fibre-wrap': 'structural', protective: 'barrier',
  fire: 'fire', tunnelling: 'tunnel', 'constr-adhesives': 'joint',
};
/** subcategories that differ from their category */
const SUB_PROFILE: Record<string, ProfileId> = { 'fp-firestop': 'joint' };

export function profileIdFor(subcategoryId?: string): ProfileId {
  const found = findSubcategory(subcategoryId);
  return (subcategoryId ? SUB_PROFILE[subcategoryId] : undefined) ?? (found && CATEGORY_PROFILE[found.cat.id]) ?? 'tile-fix';
}
export const profileFor = (subcategoryId?: string): UseCaseProfile => PROFILES[profileIdFor(subcategoryId)];

/** Keep only the fields this subcategory's profile uses (drops leftovers from another product's brief). */
export function pickProfile(uc: Partial<UseCase>, subcategoryId?: string): Partial<UseCase> {
  return Object.fromEntries(profileFor(subcategoryId).fields.filter((k) => uc[k] !== undefined).map((k) => [k, uc[k]]));
}
