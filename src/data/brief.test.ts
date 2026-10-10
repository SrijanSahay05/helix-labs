import { describe, expect, it } from 'vitest';
import { CATEGORIES, GROUPS } from './categories';
import { PROPERTIES } from './properties';
import type { PropertyGroup } from '@/types';

/** The UI/UX design brief (Oct 2, 2026), pp. 2–4 and 6–7, as data. These tests stop the lists drifting. */

const BRIEF_GROUPS = ['Concrete and cement', 'Masonry and wall build-up', 'Waterproofing and sealing', 'Tile, stone and flooring', 'Repair, strengthening and protection', 'Specialty'];

const BRIEF_CATEGORIES: [number, string][] = [
  [1, 'Admixtures'], [1, 'Shotcrete accelerators'], [1, 'Fibres'], [1, 'Cement grinding aids'], [1, 'Curing compounds'], [1, 'Release agents'],
  [2, 'Block-jointing mortar'], [2, 'Plaster'], [2, 'Wall putty and skim coat'], [2, 'Bonding agents and primers'], [2, 'Thermal insulation mortars'],
  [3, 'Waterproofing coatings'], [3, 'Membranes'], [3, 'Joint sealants'], [3, 'Injection systems for leaks'],
  [4, 'Tile and stone adhesives'], [4, 'Tile grouts'], [4, 'Epoxy grouts'], [4, 'Stone care and sealers'], [4, 'Self-levelling compounds'], [4, 'Screeds'], [4, 'Floor hardeners'], [4, 'Resin floors'],
  [5, 'Repair mortars'], [5, 'Micro-concrete'], [5, 'Structural injection resins'], [5, 'Precision grouts'], [5, 'Anchors'], [5, 'Fibre wrap'], [5, 'Anti-corrosion and protective coatings'],
  [6, 'Fire protection'], [6, 'Tunnelling and mining chemicals'], [6, 'Construction adhesives and foams'],
];

const BRIEF_TYPES: Record<string, string[]> = {
  Admixtures: ['Plasticisers', 'Superplasticisers', 'Retarders', 'Accelerators', 'Air entrainers', 'Waterproofing admixtures', 'Corrosion inhibitors'],
  Plaster: ['Ready-mix plaster', 'Gypsum plaster'],
  'Waterproofing coatings': ['Cementitious', 'Acrylic', 'Polyurethane', 'Bituminous', 'Crystalline'],
  'Resin floors': ['Epoxy', 'Polyurethane'],
  'Fire protection': ['Intumescent', 'Firestop'],
};

export const BRIEF_PROPERTIES: Record<PropertyGroup, string[]> = {
  chemical: ['Binder type and content', 'Polymer type and content', 'Polymer-to-cement ratio', 'Water demand', 'pH', 'Solids content', 'VOC', 'Chloride content', 'Alkali content', 'Mix ratio', 'Chemical resistance', 'Shelf life', 'Hazard class'],
  rheological: ['Viscosity', 'Yield stress', 'Thixotropy', 'Flow', 'Sag', 'Slip', 'Open time', 'Adjustability', 'Pot life', 'Setting time', 'Water retention', 'Wetting', 'Fresh density', 'Air content', 'Bleeding'],
  mechanical: ['Tensile adhesion — initial', 'Tensile adhesion — water', 'Tensile adhesion — heat', 'Tensile adhesion — freeze-thaw', 'Shear adhesion', 'Compressive strength', 'Flexural strength', 'Transverse deformation', 'Elongation', 'Crack bridging', 'Modulus', 'Shrinkage', 'Abrasion', 'Hardness', 'Pull-off bond'],
  durability: ['Water absorption', 'Permeability', 'Vapour transmission', 'Freeze-thaw', 'UV resistance', 'Service temperature', 'Efflorescence', 'Coverage'],
};

describe('brief: category data (CAT-01…CAT-35)', () => {
  it('six groups in order of construction', () => {
    expect(GROUPS.map((g) => g.name)).toEqual(BRIEF_GROUPS);
  });
  it.each(BRIEF_CATEGORIES)('group %i has "%s"', (group, name) => {
    const c = CATEGORIES.find((x) => x.name.toLowerCase() === name.toLowerCase());
    expect(c, name).toBeDefined();
    expect(c!.group).toBe(group);
  });
  it('categories appear in group order', () => {
    const groups = CATEGORIES.map((c) => c.group);
    expect([...groups].sort((a, b) => a - b)).toEqual(groups);
  });
  it.each(Object.entries(BRIEF_TYPES))('%s lists its types as sub-SKUs', (name, types) => {
    const c = CATEGORIES.find((x) => x.name === name)!;
    for (const t of types) expect(c.subcategories.some((s) => s.name.toLowerCase().includes(t.toLowerCase())), `${name} › ${t}`).toBe(true);
  });
  it('every subcategory has a Competitors field (CAT-34), a default standard and a property template', () => {
    for (const c of CATEGORIES)
      for (const s of c.subcategories) {
        expect(Array.isArray(s.competitors), s.id).toBe(true);
        expect(s.defaultStandard, s.id).toBeTruthy();
        expect(s.propertyTemplate.length, s.id).toBeGreaterThan(0);
      }
  });
});

describe('brief: property library (PR-CH, PR-RH, PR-ME, PR-DU)', () => {
  it.each(Object.entries(BRIEF_PROPERTIES))('%s group has every brief property', (group, names) => {
    const inGroup = PROPERTIES.filter((p) => p.group === group).map((p) => p.name.toLowerCase());
    for (const n of names) expect(inGroup.some((x) => x.startsWith(n.toLowerCase())), `${group}: ${n}`).toBe(true);
  });
  it('every property id in a template exists', () => {
    const ids = new Set(PROPERTIES.map((p) => p.id));
    for (const c of CATEGORIES) for (const s of c.subcategories) for (const id of s.propertyTemplate) expect(ids.has(id), `${s.id}: ${id}`).toBe(true);
  });
});
