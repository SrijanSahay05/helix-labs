import seedrandom from 'seedrandom';
import { SCENARIO } from '@/data/scenarios';
import { MAT } from '@/data/rawMaterials';
import { PROP } from '@/data/properties';
import type { Status } from '@/types';

/**
 * Research preview seed (Step 9 of 10). Demo data — generic titles, no real authors or patent numbers.
 * The tile-adhesive numbers follow the Research preview prompt §11 exactly; other scenarios are scaled.
 */

export type RType = 'Paper' | 'Patent' | 'TDS' | 'Supplier sheet' | 'Uploaded';
export const R_TYPES: Exclude<RType, 'Uploaded'>[] = ['Paper', 'Patent', 'TDS', 'Supplier sheet'];
export type RStatus = 'out' | 'screened' | 'relevant';

export interface RSource {
  id: string;
  /** citation label, e.g. P12 / T07 / S04 / PT03 */
  ref: string;
  type: RType;
  title: string;
  year: number;
  relevance: number;
  finding: string;
  /** cluster index, −1 when not relevant */
  cluster: number;
  status: RStatus;
  top?: boolean;
  snippet?: string;
  extracted?: { label: string; value: string }[];
  /** id of the matching source in the real Literature stage (carry-over) */
  projectSourceId?: string;
}

export interface RCluster {
  id: number;
  name: string;
  plain: string;
  count: number;
  facts: number;
  signal: string;
  plainSignal: string;
}

export interface RFact {
  id: string;
  fact: string;
  plain: string;
  value: string;
  condition: string;
  sourceId: string;
  cluster: number;
}

export interface RComp {
  materialId: string;
  name: string;
  fn: string;
  range: [number, number];
  /** min–max dosage seen in the literature */
  lit: [number, number];
}

export interface RPred {
  propertyId: string;
  name: string;
  plain: string;
  unit: string;
  op: '>=' | '<=';
  target: number;
  value: number;
  unc: number;
  status: Status;
  must: boolean;
}

export interface RRoute {
  id: string;
  name: string;
  plain: string;
  feasible: boolean;
  rank?: number;
  reason?: string;
  constraint?: string;
  costPerKg: number;
  scores: { targetMatch: number; cost: number; availability: number; overall: number };
  evidence: number;
  composition: RComp[];
  predicted: RPred[];
  equipment: string[];
  hazards: { text: string; kind: 'hazard' | 'risk' }[];
  citations: string[];
  note?: string;
}

export interface RConcept {
  title: string;
  plain: string;
}

export interface RKeyword {
  concept: number;
  term: string;
  synonyms: string[];
}

export interface RFlow {
  cluster: number;
  route: string;
  value: number;
  factIds: string[];
}

export interface ResearchData {
  scenarioId: string;
  briefLabel: string;
  standard: string;
  ceiling: number;
  concepts: RConcept[];
  keywords: RKeyword[];
  query: string;
  plan: string[];
  filters: string[];
  counts: { scanned: number; screened: number; relevant: number; facts: number; byType: Record<Exclude<RType, 'Uploaded'>, number> };
  sources: RSource[];
  clusters: RCluster[];
  facts: RFact[];
  routes: RRoute[];
  flows: RFlow[];
  why: string;
  plainWhy: string;
  summary: string;
  plainSummary: string;
}

/* ------------------------------------------------------------------ tile (exact) */

const TYPE_QUOTA: Record<Exclude<RType, 'Uploaded'>, { total: number; relevant: number; screened: number }> = {
  Paper: { total: 248, relevant: 38, screened: 74 },
  Patent: { total: 71, relevant: 9, screened: 21 },
  TDS: { total: 58, relevant: 9, screened: 17 },
  'Supplier sheet': { total: 35, relevant: 7, screened: 11 },
};

const TILE_CLUSTERS: Omit<RCluster, 'id'>[] = [
  { name: 'RDP type & dosage', plain: 'Polymer powder amount', count: 14, facts: 9, signal: 'VAE RDP 4–5 % most cited for heat-aged adhesion ≥ 1.0 N/mm²', plainSignal: 'About 4–5 % polymer powder keeps the grip after hot weather' },
  { name: 'Cellulose ether & water retention', plain: 'Water-holding additive', count: 11, facts: 7, signal: 'MHEC 40k at 0.30–0.40 % holds open time ≥ 30 min', plainSignal: 'A small dose keeps the glue workable for 30 minutes' },
  { name: 'Heat-ageing failure', plain: 'Why grip fails in heat', count: 9, facts: 8, signal: 'Adhesive-mode failure after 70 °C ageing below 3.5 % RDP', plainSignal: 'Too little polymer and tiles let go after hot summers' },
  { name: 'Accelerators', plain: 'Faster setting', count: 7, facts: 5, signal: 'Ca-formate above 0.8 % trims open time; keep 0.5–0.8 %', plainSignal: 'A little accelerator helps; too much shortens working time' },
  { name: 'Anti-slip & rheology', plain: 'Stops tiles sliding', count: 8, facts: 4, signal: 'Starch ether 0.02–0.05 % keeps slip ≤ 0.3 mm on large tiles', plainSignal: 'A pinch of starch ether stops big tiles sliding down' },
  { name: 'Deformability (S1)', plain: 'Flexibility', count: 8, facts: 5, signal: 'p/c ≥ 0.12 needed for S1; hybrid powders reach it with less polymer', plainSignal: 'Enough polymer lets the glue flex when the wall moves' },
  { name: 'Fillers & cost', plain: 'Fillers and price', count: 6, facts: 3, signal: 'Fly ash ≤ 20 % saves about ₹1.5/kg with small adhesion loss', plainSignal: 'Cheaper fillers save money with a small loss of grip' },
];

type Hand = [ref: string, type: RType, title: string, year: number, rel: number, finding: string, cluster: number, projectSourceId: string, snippet: string, extracted: [string, string][]];

const TILE_HAND: Hand[] = [
  ['P12', 'Paper', 'Effect of VAE redispersible powder dosage on heat-aged tensile adhesion of C2 tile adhesives', 2021, 0.96, 'Heat-aged adhesion rises about 0.12 N/mm² per +0.5 % RDP between 3.5 and 5 %.', 0, 's1', 'At 4.5 % RDP the heat-aged adhesion exceeded 1.0 N/mm² on all substrates, while 3.5 % gave 0.82 N/mm².', [['RDP 4.5 %', '1.06 N/mm²'], ['RDP 3.5 %', '0.82 N/mm²']]],
  ['P05', 'Paper', 'Failure mechanisms of polymer-modified tile adhesives under thermal ageing at 70 °C', 2024, 0.93, 'Polymer film degradation at the tile interface drives adhesive-mode failure after heat ageing.', 2, 's7', 'Below 3.5 % polymer the failure moved to the tile interface, losing 0.25 N/mm² after 14 d at 70 °C.', [['Loss at 3.0 % RDP', '−0.25 N/mm²']]],
  ['T07', 'TDS', 'Cellulose ether MHEC 40k — technical data sheet', 2025, 0.92, 'MHEC 40k at 0.30–0.40 % gives open time of 30 min or more at 23 °C.', 1, 's2', 'Recommended dosage 0.30–0.40 % for C2TE adhesives; open time ≥ 30 min at 23 °C / 50 % RH.', [['Viscosity', '40,000 mPa·s'], ['Dosage', '0.30–0.40 %']]],
  ['PT03', 'Patent', 'Deformable cementitious adhesive composition with hybrid polymer powder', 2021, 0.9, 'A VAE + acrylic hybrid powder reaches S1 deformation with less total polymer.', 5, 's3', 'Claim 1: a dry-mix adhesive comprising 3–6 % hybrid powder, achieving 3.1 mm transverse deformation.', [['Transverse deformation', '3.1 mm']]],
  ['S04', 'Supplier sheet', 'Starch ether anti-slip grade — supplier sheet', 2024, 0.86, 'Starch ether at 0.02–0.05 % keeps slip at or below 0.5 mm for heavy wall tiles.', 4, 's8', 'Typical addition 0.02–0.05 % on total dry mix; slip ≤ 0.5 mm for tiles up to 20 kg/m².', [['Dosage', '0.02–0.05 %']]],
  ['P31', 'Paper', 'Calcium formate as accelerator in polymer-modified cementitious adhesives', 2019, 0.85, 'Calcium formate adds early strength but trims open time above 0.8 %.', 3, 's6', 'At 0.5–1.0 % Ca-formate early strength rose 18 % while open time fell 8 %.', [['Early strength', '+18 %'], ['Open time', '−8 %']]],
  ['P18', 'Paper', 'Deformability of C2 adhesives as a function of polymer-to-cement ratio', 2022, 0.84, 'A polymer-to-cement ratio of 0.12 or more is needed for S1 on 3 mm beds.', 5, 's11', 'S1 (≥ 2.5 mm) was reached at p/c ≥ 0.12 on 3 mm beds; below that deformation stayed near 2.0 mm.', [['p/c for S1', '≥ 0.12']]],
  ['T02', 'TDS', 'Benchmark A — technical data sheet', 2025, 0.83, 'C2TE S1 benchmark: heat-aged adhesion 1.05 N/mm², deformation 2.8 mm.', 2, 's4', 'Classification EN 12004 C2TE S1; tensile adhesion after heat ageing 1.05 N/mm².', [['Heat-aged', '1.05 N/mm²'], ['Deformation', '2.8 mm']]],
  ['S09', 'Supplier sheet', 'MHEC delayed-solubility grade — supplier sheet', 2024, 0.8, 'Surface-treated MHEC gives lump-free mixing and ≥ 98 % water retention.', 1, 's10', 'Water retention ≥ 98 % at 0.38–0.40 % addition; delayed solubility prevents lumps.', [['Water retention', '≥ 98 %']]],
  ['PT11', 'Patent', 'Tile adhesive with low-Tg vinyl acetate–ethylene powder', 2020, 0.78, 'A VAE powder with Tg near 0 °C improves flexibility at 3–6 %.', 0, 's5', 'Powder with glass transition near 0 °C gives flexible films at 3–6 % addition.', [['Tg', '≈ 0 °C']]],
  ['P27', 'Paper', 'Starch ether and rheology of thin-bed mortars for large-format wall tiling', 2021, 0.76, 'Large 1200 × 600 tiles held at 0.3 mm slip with starch ether and fine sand.', 4, 's12', 'With 0.03 % starch ether slip stayed at 0.3 mm for 20 kg/m² tiles.', [['Slip', '0.3 mm']]],
  ['P44', 'Paper', 'Low-cost tile adhesive with pozzolanic cement replacement', 2019, 0.72, 'Up to 20 % fly-ash replacement costs at most 8 % adhesion.', 6, 's9', 'Replacing up to 20 % of cement with fly ash lowered adhesion by at most 8 %.', [['Adhesion loss', '≤ 8 %']]],
];

type HandFact = [fact: string, plain: string, value: string, condition: string, ref: string];
const TILE_FACTS: HandFact[] = [
  ['RDP dosage for C2 heat-aged ≥ 1.0', 'Polymer powder needed for grip after heat', '4.0–5.0 %', 'VAE, OPC 53', 'P12'],
  ['MHEC viscosity for open time ≥ 30 min', 'Water-holding additive for 30 min working time', '40k mPa·s, 0.30–0.40 %', '23 °C', 'T07'],
  ['Calcium formate effect', 'Accelerator: faster strength, shorter working time', '+18 % early strength, −8 % open time', '0.5–1.0 %', 'P31'],
  ['Starch ether for slip ≤ 0.5 mm', 'Starch ether stops tiles sliding', '0.02–0.05 %', '—', 'S04'],
  ['Heat-aged adhesion loss below 3.5 % RDP', 'Too little polymer loses grip after heat', '−0.25 N/mm²', '14 d @ 70 °C', 'P05'],
  ['Polymer/cement ratio for S1', 'Polymer needed for flexibility', 'p/c ≥ 0.12', '3 mm bed', 'P18'],
  ['Hybrid VAE/acrylic deformation', 'Mixed polymer powder flexes more', '3.1 mm at 4.5 %', 'EN 12002', 'PT03'],
  ['Benchmark A heat-aged adhesion', 'How well Benchmark A grips after heat', '1.05 N/mm²', 'EN 1348 §8.4', 'T02'],
  ['MHEC water retention', 'How much water the additive holds', '≥ 98 %', '0.38–0.40 %', 'S09'],
  ['Fly-ash replacement penalty', 'Cheaper filler costs a little grip', '≤ 8 % adhesion loss', '≤ 20 % of cement', 'P44'],
  ['VAE Tg for flexibility', 'Soft polymer for flexibility', 'Tg ≈ 0 °C', '3–6 %', 'PT11'],
  ['Slip on 1200 × 600 tiles', 'Big tiles stay in place', '0.3 mm', '20 kg/m², 0.03 % SE', 'P27'],
];

const TILE_FACT_POOL: Record<number, [string, string, string][]> = {
  0: [['Heat-aged adhesion per +0.5 % RDP', '+0.12 N/mm²', '3.5–5 % range'], ['Initial adhesion at 4 % RDP', '1.30 N/mm²', '28 d'], ['RDP vs water-immersion adhesion', '+0.08 N/mm² per 1 %', 'EN 1348 §8.3'], ['Freeze-thaw adhesion at 4.5 % RDP', '1.06 N/mm²', '25 cycles'], ['Optimal VAE ethylene content', '15–25 %', 'film flexibility'], ['RDP above 5.5 %', 'no further heat-aged gain', 'cost penalty'], ['Water demand at 5 % RDP', '23–25 %', 'mixing water']],
  1: [['MHEC dosage vs open time', '+6 min per 0.05 %', '0.30–0.45 %'], ['HPMC 60k alternative', 'similar water retention', '0.35 %'], ['Cellulose ether vs slip', 'slip −0.1 mm', 'at 0.40 %'], ['Delayed solubility grade', 'lump-free in 30 s', 'mixing'], ['Open time at 35 °C', '22 min', 'without retarder']],
  2: [['Heat-ageing protocol', '14 d + 14 d @ 70 °C', 'EN 1348 §8.4'], ['Failure mode shift', 'cohesive → adhesive', 'below 3.5 % RDP'], ['Interface temperature, facade', 'up to 75 °C', 'hot-humid'], ['Adhesion retained after ageing', '82 %', '4 % RDP'], ['Tile back porosity effect', '−0.1 N/mm²', 'vitrified < 0.5 % WA'], ['Polymer film loss', '−12 %', '70 °C, 14 d']],
  3: [['Ca-formate vs 24 h strength', '+22 %', '1.0 %'], ['Ca-formate vs heat-aged', '−0.03 N/mm²', '> 0.8 %'], ['Lithium carbonate alternative', 'set −40 min', '0.05 %'], ['Accelerator vs pot life', '−20 min', '1.0 %']],
  4: [['Thixotropy index', '3.5–4.5', '0.03 % SE'], ['Sand fineness for slip', '0.1–0.5 mm', 'washed silica']],
  5: [['Deformation at 5 % RDP', '2.9 mm', 'EN 12002'], ['Hybrid powder saving', '−0.8 % polymer', 'for S1'], ['Deformation vs bed thickness', '+0.4 mm', '3 → 5 mm']],
  6: [['Fly-ash cost saving', '₹1.5/kg', '20 % replacement'], ['CaCO₃ 40 µm filler', '2.5–3.5 %', 'packing']],
};

const P_LIT: Record<string, [number, number]> = {
  opc53: [25, 40], sand: [45, 65], caco3: [0, 10], 'vae-rdp': [1, 8], mhec: [0.15, 0.6], 'ca-formate': [0, 2], 'starch-ether': [0, 0.1], defoamer: [0, 0.1], 'acrylic-rdp': [0, 3], 'fly-ash': [0, 15], gypsum: [0, 10],
};

type PredSeed = [propertyId: string, value: number, unc: number];
const TILE_TARGETS: Record<string, { op: '>=' | '<='; target: number; must: boolean }> = {
  'adh-initial': { op: '>=', target: 1.0, must: true },
  'adh-water': { op: '>=', target: 1.0, must: true },
  'adh-heat': { op: '>=', target: 1.0, must: true },
  'adh-ft': { op: '>=', target: 1.0, must: false },
  'open-time': { op: '>=', target: 0.5, must: true },
  slip: { op: '<=', target: 0.5, must: true },
  'transverse-def': { op: '>=', target: 2.5, must: true },
};

function statusOf(op: '>=' | '<=', target: number, v: number): Status {
  const eps = 1e-9;
  if (op === '>=') return v >= target - eps ? 'pass' : v >= target * 0.9 - eps ? 'borderline' : 'fail';
  return v <= target + eps ? 'pass' : v <= target * 1.1 + eps ? 'borderline' : 'fail';
}

function preds(seeds: PredSeed[], targets: Record<string, { op: '>=' | '<='; target: number; must: boolean }>): RPred[] {
  return seeds
    .map(([propertyId, value, unc]) => {
      const t = targets[propertyId] ?? { op: '>=' as const, target: value, must: false };
      const p = PROP[propertyId];
      return { propertyId, name: p?.name ?? propertyId, plain: p?.plainName ?? propertyId, unit: p?.unit ?? '', op: t.op, target: t.target, value, unc, status: statusOf(t.op, t.target, value), must: t.must };
    })
    .sort((a, b) => Number(b.must) - Number(a.must));
}

function comp(pairs: [string, number, number][]): RComp[] {
  return pairs.map(([m, a, b]) => ({ materialId: m, name: MAT[m]?.name ?? m, fn: MAT[m]?.fn ?? '', range: [a, b], lit: P_LIT[m] ?? [Math.max(0, a * 0.5), b * 1.5] }));
}

const TILE_ROUTES: RRoute[] = [
  {
    id: 'P1', rank: 1, feasible: true, name: 'High-RDP VAE + MHEC, Ca-formate accelerated', plain: 'Strong and flexible, slightly above mid budget',
    costPerKg: 16.1, scores: { targetMatch: 0.9, cost: 0.82, availability: 0.9, overall: 0.87 }, evidence: 0.92,
    composition: comp([['opc53', 32, 36], ['sand', 55, 60], ['caco3', 2.5, 3.5], ['vae-rdp', 3.5, 5], ['mhec', 0.3, 0.4], ['ca-formate', 0.5, 1.0], ['starch-ether', 0.03, 0.03], ['defoamer', 0.02, 0.02]]),
    predicted: preds([['adh-initial', 1.32, 0.08], ['adh-water', 1.08, 0.06], ['adh-heat', 1.04, 0.07], ['adh-ft', 1.05, 0.08], ['open-time', 0.6, 0.05], ['slip', 0.3, 0.05], ['transverse-def', 2.7, 0.2]], TILE_TARGETS),
    equipment: ['Ribbon blender', 'Sieve 0.6 mm', 'Bagging line'],
    hazards: [{ text: 'Alkaline powder — skin/eye irritant (H315/H318)', kind: 'hazard' }, { text: 'Single-source RDP supplier', kind: 'risk' }, { text: 'Calcium formate: dust', kind: 'hazard' }],
    citations: ['P12', 'T07', 'P31', 'S04'],
  },
  {
    id: 'P2', rank: 2, feasible: true, name: 'Mid-RDP + starch-ether anti-slip, lower cost', plain: 'Cheaper with good grip, a little less flexible',
    costPerKg: 14.9, scores: { targetMatch: 0.79, cost: 0.92, availability: 0.88, overall: 0.81 }, evidence: 0.8,
    composition: comp([['opc53', 32, 35], ['sand', 57, 61], ['caco3', 3, 4], ['vae-rdp', 3.0, 4.0], ['mhec', 0.3, 0.35], ['ca-formate', 0.5, 0.7], ['starch-ether', 0.04, 0.06], ['defoamer', 0.02, 0.02]]),
    predicted: preds([['adh-initial', 1.24, 0.08], ['adh-water', 1.02, 0.06], ['adh-heat', 0.94, 0.07], ['adh-ft', 1.0, 0.08], ['open-time', 0.56, 0.05], ['slip', 0.2, 0.04], ['transverse-def', 2.4, 0.2]], TILE_TARGETS),
    equipment: ['Ribbon blender', 'Bagging line'],
    hazards: [{ text: 'Alkaline powder — skin/eye irritant (H315/H318)', kind: 'hazard' }],
    citations: ['S04', 'P27', 'T07'],
  },
  {
    id: 'P3', rank: 3, feasible: true, name: 'VAE/acrylic hybrid powder for deformability', plain: 'The strongest and most flexible, but over budget',
    costPerKg: 19.6, scores: { targetMatch: 0.95, cost: 0.55, availability: 0.8, overall: 0.78 }, evidence: 0.84, note: 'over ceiling',
    composition: comp([['opc53', 31, 34], ['sand', 55, 59], ['caco3', 2, 3], ['vae-rdp', 3.5, 4.5], ['acrylic-rdp', 1.0, 1.5], ['mhec', 0.35, 0.4], ['ca-formate', 0.5, 0.8], ['defoamer', 0.02, 0.03]]),
    predicted: preds([['adh-initial', 1.4, 0.09], ['adh-water', 1.12, 0.07], ['adh-heat', 1.04, 0.08], ['adh-ft', 1.08, 0.08], ['open-time', 0.58, 0.05], ['slip', 0.4, 0.05], ['transverse-def', 3.4, 0.25]], TILE_TARGETS),
    equipment: ['Ribbon blender', 'Dust extraction'],
    hazards: [{ text: 'Cost over ceiling (₹19.6 vs ₹18)', kind: 'risk' }, { text: 'Alkaline powder — skin/eye irritant (H315/H318)', kind: 'hazard' }],
    citations: ['PT03', 'P18', 'P12'],
  },
  {
    id: 'P4', rank: 4, feasible: true, name: 'Fly-ash part-replacement, low-heat', plain: 'Cheapest, but the fly ash can be hard to get',
    costPerKg: 13.8, scores: { targetMatch: 0.7, cost: 0.95, availability: 0.55, overall: 0.72 }, evidence: 0.62, note: 'availability risk',
    composition: comp([['opc53', 26, 30], ['fly-ash', 5, 8], ['sand', 55, 59], ['vae-rdp', 3.5, 4.5], ['mhec', 0.3, 0.4], ['ca-formate', 0.6, 1.0], ['starch-ether', 0.03, 0.03], ['defoamer', 0.02, 0.02]]),
    predicted: preds([['adh-initial', 1.18, 0.09], ['adh-water', 1.0, 0.07], ['adh-heat', 0.86, 0.08], ['adh-ft', 0.97, 0.08], ['open-time', 0.62, 0.05], ['slip', 0.4, 0.05], ['transverse-def', 2.6, 0.2]], TILE_TARGETS),
    equipment: ['Ribbon blender', 'Extra silo for fly ash'],
    hazards: [{ text: 'Fly-ash supply varies by season', kind: 'risk' }, { text: 'Alkaline powder — skin/eye irritant (H315/H318)', kind: 'hazard' }],
    citations: ['P44', 'P12'],
  },
  {
    id: 'P5', rank: 5, feasible: true, name: 'Gypsum-modified fast-set', plain: 'Sets fast but loses grip when wet — not for outside walls',
    costPerKg: 15.2, scores: { targetMatch: 0.45, cost: 0.86, availability: 0.85, overall: 0.61 }, evidence: 0.48, note: 'fails water immersion',
    composition: comp([['opc53', 28, 31], ['gypsum', 4, 6], ['sand', 56, 60], ['vae-rdp', 3, 4], ['mhec', 0.3, 0.35], ['ca-formate', 0.3, 0.5], ['defoamer', 0.02, 0.02]]),
    predicted: preds([['adh-initial', 1.15, 0.09], ['adh-water', 0.7, 0.08], ['adh-heat', 0.88, 0.08], ['adh-ft', 0.8, 0.09], ['open-time', 0.5, 0.05], ['slip', 0.3, 0.05], ['transverse-def', 2.3, 0.2]], TILE_TARGETS),
    equipment: ['Ribbon blender'],
    hazards: [{ text: 'Fails water immersion — not for exterior', kind: 'risk' }, { text: 'Ettringite expansion risk', kind: 'hazard' }],
    citations: ['P05', 'P31'],
  },
];

const TILE_REJECTED: [name: string, reason: string, constraint: string, cost: number, match: number][] = [
  ['Acrylic-only high-polymer route', 'over cost ceiling', 'Cost ≤ ₹18/kg (₹23.4)', 23.4, 0.93],
  ['VAE grade B + HPMC 60k', 'no approved supplier', 'Approved suppliers only (VAE grade B pending)', 15.6, 0.74],
  ['Solvent-borne tackifier boost', 'VOC limit', 'Low VOC ≤ 5 g/L', 17.2, 0.82],
  ['Low-starch, high-flow mix', 'fails slip', 'Slip ≤ 0.5 mm (0.8 predicted)', 14.2, 0.66],
  ['Gypsum-rich rapid set', 'excluded material', 'Gypsum excluded in constraints', 12.9, 0.4],
  ['Calcium chloride accelerated', 'chlorides not allowed', 'No chlorides', 13.5, 0.58],
  ['Ultra-low RDP economy', 'below standard minimum', 'Heat-aged adhesion ≥ 1.0 (0.62 predicted)', 11.8, 0.36],
];

/** facts used per cluster → pathway (rows = clusters, cols = P1..P5); total 41 */
const TILE_SANKEY = [
  [4, 2, 2, 1, 0],
  [3, 2, 1, 1, 0],
  [6, 0, 1, 0, 1],
  [2, 1, 0, 0, 2],
  [1, 3, 0, 0, 0],
  [1, 0, 3, 1, 0],
  [0, 1, 0, 2, 0],
];

/* ------------------------------------------------------------------ generic helpers */

const OFF_TOPIC = [
  'Durability of cementitious repair mortars in marine exposure',
  'Rheology of self-levelling underlayments',
  'Shrinkage of lightweight concrete blocks',
  'Grinding aids in cement manufacture',
  'Corrosion inhibitors for reinforced concrete',
  'Fire resistance of gypsum boards',
  'Pigment dispersion in exterior paints',
  'Bitumen membranes for flat roofs',
  'Alkali-silica reaction in aggregates',
  'Workability of ready-mix concrete in hot weather',
  'Epoxy floor coatings for warehouses',
  'Thermal insulation renders with EPS beads',
  'Efflorescence on clay brick facades',
  'Fibre-reinforced shotcrete for tunnels',
  'Waterproofing admixtures for basement concrete',
  'Plaster cracking on AAC walls',
];
const ON_TOPIC = ['Influence of {c} on {p}', 'A study of {c} in {p} under tropical exposure', 'Optimising {c} for {p}: a design-of-experiments approach', 'Microstructure of {p} as affected by {c}', 'Composition for {p} with improved {c}', '{c} — product data for {p}', '{c} grade overview for dry-mix {p}'];

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function splitCounts(total: number, n: number, weights?: number[]): number[] {
  const w = weights ?? Array.from({ length: n }, (_, i) => n - i * 0.6);
  const sum = w.reduce((a, b) => a + b, 0);
  const out = w.map((x) => Math.floor((x / sum) * total));
  let rest = total - out.reduce((a, b) => a + b, 0);
  for (let i = 0; rest > 0; i = (i + 1) % n, rest--) out[i]++;
  return out;
}

function refPrefix(t: RType) {
  return t === 'Paper' ? 'P' : t === 'Patent' ? 'PT' : t === 'TDS' ? 'T' : t === 'Supplier sheet' ? 'S' : 'U';
}

function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const cache = new Map<string, ResearchData>();

/** Deterministic research seed for a scenario (tile adhesive by default). */
export function buildResearch(scenarioId = 'tile'): ResearchData {
  const hit = cache.get(scenarioId);
  if (hit) return hit;
  const s = SCENARIO[scenarioId] ?? SCENARIO.tile;
  const tile = s.id === 'tile';
  const rnd = seedrandom(`helix-research${tile ? '' : `:${s.id}`}`);
  const product = s.label.toLowerCase();

  /* clusters */
  const clusters: RCluster[] = tile
    ? TILE_CLUSTERS.map((c, id) => ({ ...c, id }))
    : (() => {
        const counts = splitCounts(63, s.clusters.length);
        const facts = splitCounts(41, s.clusters.length);
        return s.clusters.map((name, id) => ({ id, name, plain: name, count: counts[id], facts: facts[id], signal: `${name} is the most cited lever for this brief`, plainSignal: `${name} matters most here` }));
      })();

  /* hand-written top sources */
  const used = new Set<string>();
  const hand: RSource[] = tile
    ? TILE_HAND.map(([ref, type, title, year, relevance, finding, cluster, projectSourceId, snippet, extracted], i) => ({ id: `rs-${ref}`, ref, type, title, year, relevance, finding, cluster, status: 'relevant', top: i < 5, snippet, extracted: extracted.map(([label, value]) => ({ label, value })), projectSourceId }))
    : s.sources.slice(0, 12).map((x, i) => {
        const type: RType = x.type === 'Uploaded' || x.type === 'Internal formulation' ? 'Paper' : x.type;
        const ref = `${refPrefix(type)}${String(3 + i * 7).padStart(2, '0')}`;
        const ci = Math.max(0, s.clusters.indexOf(x.cluster));
        return { id: `rs-${ref}`, ref, type, title: x.title, year: x.year, relevance: x.relevance, finding: x.finding, cluster: ci >= 0 ? ci : i % clusters.length, status: 'relevant' as const, top: i < 5, snippet: x.snippet ?? x.finding, extracted: x.extracted, projectSourceId: x.id };
      });
  hand.forEach((h) => used.add(h.ref));

  /* the rest of the 412, by type quota */
  const handByType = (t: RType) => hand.filter((h) => h.type === t).length;
  const counters: Record<string, number> = { P: 1, PT: 1, T: 1, S: 1 };
  const nextRef = (t: RType) => {
    const p = refPrefix(t);
    let r: string;
    do r = `${p}${String(counters[p]++).padStart(2, '0')}`;
    while (used.has(r));
    used.add(r);
    return r;
  };
  // relevant slots still needed per cluster
  const needed = clusters.map((c) => c.count - hand.filter((h) => h.cluster === c.id).length);
  const clusterBag = shuffle(needed.flatMap((n, ci) => Array.from({ length: Math.max(0, n) }, () => ci)), rnd);
  const gen: RSource[] = [];
  let g = 0;
  for (const type of R_TYPES) {
    const q = TYPE_QUOTA[type];
    const rel = Math.max(0, q.relevant - handByType(type));
    const statuses: RStatus[] = shuffle([...Array<RStatus>(rel).fill('relevant'), ...Array<RStatus>(q.screened).fill('screened'), ...Array<RStatus>(q.total - q.relevant - q.screened).fill('out')], rnd);
    for (const status of statuses) {
      const ref = nextRef(type);
      const cluster = status === 'relevant' ? (clusterBag.pop() ?? 0) : -1;
      const cname = cluster >= 0 ? clusters[cluster].name.toLowerCase() : '';
      const title =
        status === 'relevant'
          ? cap(ON_TOPIC[Math.floor(rnd() * ON_TOPIC.length)].replace('{c}', cname).replace('{p}', product))
          : status === 'screened'
            ? cap(ON_TOPIC[Math.floor(rnd() * 4)].replace('{c}', ['curing', 'pigments', 'packaging', 'pot life', 'colour stability', 'storage'][Math.floor(rnd() * 6)]).replace('{p}', product))
            : OFF_TOPIC[Math.floor(rnd() * OFF_TOPIC.length)];
      const relevance = status === 'relevant' ? 0.6 + rnd() * 0.15 : status === 'screened' ? 0.35 + rnd() * 0.22 : 0.05 + rnd() * 0.28;
      gen.push({
        id: `rs-${ref}`,
        ref,
        type,
        title,
        year: 2010 + Math.floor(rnd() * 17),
        relevance: Math.round(relevance * 100) / 100,
        finding: status === 'relevant' ? `Reports a measurable effect of ${cname} on key ${product} properties.` : status === 'screened' ? 'Related product, but no values that apply to this brief.' : 'Off-topic for this brief.',
        cluster,
        status,
        snippet: status === 'relevant' ? `The study varied ${cname} and measured its effect on adhesion, workability and durability.` : undefined,
        projectSourceId: status === 'relevant' && g < 48 ? `${s.id}-g${g++}` : undefined,
      });
    }
  }
  const sources = [...hand, ...gen];

  /* facts */
  const facts: RFact[] = [];
  const byRef = new Map(sources.map((x) => [x.ref, x]));
  if (tile) TILE_FACTS.forEach(([fact, plain, value, condition, ref], i) => facts.push({ id: `f${i + 1}`, fact, plain, value, condition, sourceId: byRef.get(ref)!.id, cluster: byRef.get(ref)!.cluster }));
  clusters.forEach((c) => {
    const have = facts.filter((f) => f.cluster === c.id).length;
    const pool = tile ? TILE_FACT_POOL[c.id] : [];
    const srcs = sources.filter((x) => x.cluster === c.id && !x.top);
    for (let k = have; k < c.facts; k++) {
      const p = pool[k - have] ?? [`${c.name} — reported effect ${k + 1}`, ['+0.08', '−6 %', '+12 %', '0.3–0.5 %'][k % 4], ['28 d', 'lab, 23 °C', '—', 'site trial'][k % 4]];
      const src = srcs[k % Math.max(1, srcs.length)] ?? sources.find((x) => x.cluster === c.id)!;
      facts.push({ id: `f${facts.length + 1}`, fact: p[0], plain: p[0], value: p[1], condition: p[2], sourceId: src.id, cluster: c.id });
    }
  });

  /* routes */
  const ceiling = s.constraints.costCeiling ?? 18;
  let routes: RRoute[];
  if (tile) {
    const rej = TILE_REJECTED.map(([name, reason, constraint, cost, match], i): RRoute => ({ id: `R${String(i + 6).padStart(2, '0')}`, name, plain: name, feasible: false, reason, constraint, costPerKg: cost, scores: { targetMatch: match, cost: 0, availability: 0, overall: 0 }, evidence: 0, composition: [], predicted: [], equipment: [], hazards: [], citations: [] }));
    routes = [...TILE_ROUTES, ...rej];
  } else {
    const tmap = Object.fromEntries(s.targets.map((t) => [t.propertyId, { op: (t.operator === '<=' ? '<=' : '>=') as '>=' | '<=', target: Array.isArray(t.value) ? t.value[0] : t.value, must: t.priority === 'must' }]));
    const refs = hand.map((h) => h.ref);
    const feas: RRoute[] = s.pathways.slice(0, 5).map((p, i) => ({
      id: p.id,
      rank: i + 1,
      feasible: true,
      name: p.name,
      plain: p.name,
      costPerKg: p.costPerKg,
      scores: p.scores,
      evidence: Math.max(0.4, p.scores.overall),
      composition: comp(p.composition.map((c) => [c.materialId, c.range[0], c.range[1]])),
      predicted: preds(p.predicted.map((x) => [x.propertyId, x.value, Math.round(Math.abs(x.value) * 0.06 * 100) / 100]), tmap),
      equipment: p.equipment,
      hazards: p.hazards.map((h) => ({ text: h, kind: /cost|supply|risk|weak|higher/i.test(h) ? ('risk' as const) : ('hazard' as const) })),
      citations: refs.slice(i, i + 3),
      note: p.costPerKg > ceiling ? 'over ceiling' : undefined,
    }));
    const reasons: [string, string][] = [['over cost ceiling', `Cost ≤ ₹${ceiling}/kg`], ['no approved supplier', 'Approved suppliers only'], ['VOC limit', 'Low VOC'], ['fails a must-have', 'Must-have target'], ['excluded material', 'Material limits'], ['chlorides not allowed', 'No chlorides'], ['below standard minimum', s.standard]];
    const rej = Array.from({ length: 12 - feas.length }, (_, i): RRoute => {
      const [reason, constraint] = reasons[i % reasons.length];
      return { id: `R${String(feas.length + i + 1).padStart(2, '0')}`, name: `Alternative route ${i + 1}`, plain: `Alternative route ${i + 1}`, feasible: false, reason, constraint, costPerKg: Math.round(ceiling * (0.6 + rnd() * 0.7) * 10) / 10, scores: { targetMatch: Math.round((0.35 + rnd() * 0.5) * 100) / 100, cost: 0, availability: 0, overall: 0 }, evidence: 0, composition: [], predicted: [], equipment: [], hazards: [], citations: [] };
    });
    routes = [...feas, ...rej];
  }

  /* sankey: facts per cluster → route */
  const feasible = routes.filter((r) => r.feasible);
  const flows: RFlow[] = [];
  clusters.forEach((c) => {
    const cf = facts.filter((f) => f.cluster === c.id);
    const row = tile ? TILE_SANKEY[c.id] : splitCounts(cf.length, feasible.length, feasible.map((r) => r.scores.overall ** 2 + rnd() * 0.2));
    let k = 0;
    feasible.forEach((r, j) => {
      const v = row[j] ?? 0;
      if (v > 0) flows.push({ cluster: c.id, route: r.id, value: v, factIds: cf.slice(k, k + v).map((f) => f.id) });
      k += v;
    });
  });

  const sub = tile ? 'C2TE S1 tile adhesive' : s.chip;
  const top = feasible[0];
  const data: ResearchData = {
    scenarioId: s.id,
    briefLabel: sub,
    standard: s.standard,
    ceiling,
    concepts: tile
      ? [
          { title: 'Polymer-modified cementitious adhesive (C2TE S1)', plain: 'A cement tile glue with added polymer' },
          { title: 'Exterior large-format vitrified, hot-humid', plain: 'Big tiles on outside walls in hot, humid weather' },
          { title: 'Heat-ageing adhesion + deformability at ≤ ₹18/kg', plain: 'Grips after heat and flexes, at a mid-range price' },
        ]
      : [
          { title: s.productGuess, plain: s.label },
          { title: `${s.useCase.exposure === 'exterior' ? 'Exterior' : 'Interior'} · ${s.useCase.climate}`, plain: `${s.useCase.exposure === 'exterior' ? 'Outside' : 'Inside'} use, ${s.useCase.climate.toLowerCase()} weather` },
          { title: `${s.top3.map((t) => PROP[t.id]?.name ?? t.id).slice(0, 2).join(' + ')} at ≤ ₹${ceiling}/kg`, plain: 'Performance that matters most, within budget' },
        ],
    keywords: tile
      ? [
          { concept: 0, term: 'Polymer powder', synonyms: ['redispersible polymer powder', 'RDP', 'VAE', 'EVA'] },
          { concept: 0, term: 'Water retention', synonyms: ['cellulose ether', 'MHEC', 'HPMC'] },
          { concept: 1, term: 'Large-format exterior', synonyms: ['vitrified tile', 'facade', 'hot-humid', 'thin-bed mortar'] },
          { concept: 2, term: 'Deformability', synonyms: ['transverse deformation', 'S1', 'flexibility'] },
          { concept: 2, term: 'Heat ageing', synonyms: ['heat ageing', 'tensile adhesion', 'EN 1348'] },
        ]
      : s.clusters.slice(0, 5).map((c, i) => ({ concept: i % 3, term: c, synonyms: c.toLowerCase().split(/[ &]+/).filter((w) => w.length > 3) })),
    query: tile ? '("tile adhesive" OR "thin-bed mortar") AND ("redispersible polymer" OR RDP OR VAE)\nAND ("heat ageing" OR "tensile adhesion" OR "EN 1348") AND (deformab* OR "S1")' : s.query.replace(/ AND \(/, '\nAND ('),
    plan: ['Papers 2010–2026', 'Patents (IN, EP, US)', 'TDS library', 'Supplier sheets'],
    filters: ['Language: English', 'Years: 2010–2026', 'Peer-reviewed + grey literature'],
    counts: { scanned: 412, screened: 186, relevant: 63, facts: 41, byType: { Paper: 248, Patent: 71, TDS: 58, 'Supplier sheet': 35 } },
    sources,
    clusters,
    facts,
    routes,
    flows,
    why: tile
      ? 'P1 is the only route predicted to clear heat-aged adhesion (1.04 ± 0.07) and S1 deformability together within the cost ceiling. It follows the strongest evidence cluster (RDP 4–5 % [P12]) and takes its MHEC grade from [T07]. It uses approved suppliers only. Risk: single-source RDP; P2 is the fallback at ₹14.9/kg.'
      : `${top.id} has the best balance of target match (${top.scores.targetMatch.toFixed(2)}) and cost (₹${top.costPerKg.toFixed(1)}/kg) within the ₹${ceiling}/kg ceiling. It follows the strongest evidence [${top.citations[0] ?? hand[0]?.ref}]. ${feasible[1]?.id ?? ''} is the fallback.`,
    plainWhy: tile
      ? 'P1 is the only recipe expected to grip after hot weather and flex with the wall, while staying under ₹18/kg. It follows what most studies recommend [P12] [T07]. The one risk: its polymer comes from a single supplier, so P2 is the backup at ₹14.9/kg.'
      : `${top.id} fits your needs best for the price [${top.citations[0] ?? hand[0]?.ref}].`,
    summary: `**63** relevant sources, **${clusters.length}** clusters, **41** facts. Strongest evidence: ${tile ? 'RDP dosage and cellulose-ether grade drive heat-aged adhesion and open time.' : `${clusters[0].name.toLowerCase()} and ${clusters[1]?.name.toLowerCase() ?? 'cost'} drive the key targets.`}`,
    plainSummary: `Helix read **63** useful sources, grouped them into **${clusters.length}** topics and noted **41** facts. ${tile ? 'The amount of polymer powder and the water-holding additive matter most for grip after heat and working time.' : 'A few ingredients matter most for your targets.'}`,
  };
  cache.set(scenarioId, data);
  return data;
}

/** Pareto front (min cost, max target match) over feasible routes, sorted by cost. */
export function paretoFront(routes: RRoute[]): RRoute[] {
  const f = routes.filter((r) => r.feasible);
  return f.filter((a) => !f.some((b) => b !== a && b.costPerKg <= a.costPerKg && b.scores.targetMatch >= a.scores.targetMatch && (b.costPerKg < a.costPerKg || b.scores.targetMatch > a.scores.targetMatch))).sort((a, b) => a.costPerKg - b.costPerKg);
}

export function allMustPass(r: RRoute): boolean {
  return r.feasible && r.predicted.filter((p) => p.must).every((p) => p.status === 'pass');
}
