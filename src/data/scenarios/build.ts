import type { Pathway, Source, Status } from '@/types';
import { costPerKg } from '@/lib/cost';
import type { Scenario } from './types';

/** Compact builders for scenario data. Demo data — for R&D to confirm. */

export const pw = (
  id: string,
  rank: number,
  name: string,
  comp: [string, number, number][],
  predicted: [string, number, Status][],
  s: [number, number, number, number],
  costPerKg: number,
  equipment: string[],
  hazards: string[],
  citations: string[],
): Pathway => ({
  id, rank, name,
  composition: comp.map(([materialId, a, b]) => ({ materialId, range: [a, b] })),
  predicted: predicted.map(([propertyId, value, status]) => ({ propertyId, value, status })),
  scores: { targetMatch: s[0], cost: s[1], availability: s[2], overall: s[3] },
  costPerKg, equipment, hazards, citations,
});

export const src = (id: string, type: Source['type'], title: string, year: number, relevance: number, finding: string, cluster: string): Source => ({ id, type, title, year, relevance, finding, cluster });

export const bench = (id: string, name: string, sub: string, cls: string, price: number, values: [string, number | string, string, 'TDS' | 'MSDS' | 'Lab-tested'][]) => ({
  id, name, maker: 'Competitor 3', subcategoryId: sub, standardClass: cls, pricePerKg: price, updated: '2026-08-30',
  values: values.map(([propertyId, value, unit, tag], i) => ({ propertyId, value, unit, tag, page: 1 + (i % 3), confidence: 0.82 + ((i * 7) % 15) / 100 })),
  versions: [{ v: 1, date: '2026-08-30', note: 'Created from TDS' }],
});

/** Raw-material cost of a composition at its range midpoints, ₹/kg. */
export const midCost = (comp: [string, number, number][]) => costPerKg(Object.fromEntries(comp.map(([id, a, b]) => [id, (a + b) / 2])));

/** A subcategory sibling of a full scenario: same category, guided questions and constraints shape; overrides the rest. */
export const variant = (base: Scenario, o: Partial<Scenario> & Pick<Scenario, 'id' | 'label' | 'chip' | 'example' | 'keywords' | 'subcategoryId'>): Scenario => ({ ...base, ...o });
