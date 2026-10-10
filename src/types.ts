export type Mode = 'scientist' | 'non-scientist';
export type Role = 'chemist' | 'technician' | 'reviewer' | 'admin';
export type Priority = 'must' | 'important' | 'nice';
export type Operator = '>=' | '<=' | '=' | 'between';
export type Status = 'pass' | 'borderline' | 'fail' | 'pending';
export type StageStatus = 'waiting' | 'running' | 'complete' | 'failed' | 'low-confidence';
export type StageId = 'literature' | 'pathways' | 'trials' | 'results' | 'analysis' | 'final';
export type PropertyGroup = 'chemical' | 'rheological' | 'mechanical' | 'durability';
export type StandardFamily = 'IS' | 'EN' | 'ASTM';

import type { AgentId } from '@/agents/registry';

export interface AIMeta {
  by: 'helix' | 'user';
  /** which crew agent filled it (when `by` is 'helix') */
  agent?: AgentId;
  confidence?: number;
  reason?: string;
  source?: string;
}

export interface Subcategory {
  id: string;
  name: string;
  types?: string[];
  chemistry: string[];
  forms: string[];
  defaultStandard?: string;
  propertyTemplate: string[];
  competitors?: string[];
}

/** Step 1 "category card" inside a construction group. */
export interface Category {
  id: string;
  group: 1 | 2 | 3 | 4 | 5 | 6;
  groupName: string;
  name: string;
  example: string;
  plainExample: string;
  icon: string;
  subcategories: Subcategory[];
}

export interface Property {
  id: string;
  group: PropertyGroup;
  name: string;
  plainName: string;
  unit: string;
  testMethod: Partial<Record<StandardFamily, string>> & { internal?: string };
}

export interface TargetRow {
  propertyId: string;
  testMethod: string;
  unit: string;
  standardLimit?: string;
  /** numeric floor/ceiling implied by the standard, used for validation */
  standardMin?: number;
  standardMax?: number;
  benchmarkValue?: number | string;
  operator: Operator;
  value: number | [number, number];
  priority: Priority;
  meta: AIMeta;
}

export interface UseCase {
  substrate: string;
  surfaces: string[];
  materialType: string;
  size: { w: number; h: number; t: number };
  exposure: 'interior' | 'exterior';
  climate: string;
  appTemp: [number, number];
  load: string;
  method: string;
  timeToGroutH: number;
  timeToTrafficH: number;
  standardClass?: string;
}

export interface Constraints {
  costCeiling?: number;
  budgetBand?: 'economy' | 'mid' | 'premium';
  materialLimits: { materialId: string; maxPct?: number; exclude?: boolean }[];
  compliance: string[];
  site: { tMin: number; tMax: number; rhMax: number };
  mustHaves: string[];
  remark?: string;
}

export interface BenchmarkValue {
  propertyId: string;
  value: number | string;
  unit: string;
  tag: 'TDS' | 'MSDS' | 'Lab-tested';
  page?: number;
  confidence?: number;
}

export interface Benchmark {
  id: string;
  name: string;
  maker: string;
  subcategoryId: string;
  standardClass: string;
  pricePerKg?: number;
  updated: string;
  values: BenchmarkValue[];
  versions: { v: number; date: string; note: string }[];
}

export interface RawMaterial {
  id: string;
  name: string;
  fn: string;
  grade: string;
  supplier: string;
  pricePerKg: number;
  stockKg: number;
  approval: 'approved' | 'pending' | 'rejected';
  msdsUrl?: string;
  alternatives: string[];
}

export type SourceType = 'Paper' | 'Patent' | 'TDS' | 'Supplier sheet' | 'Uploaded' | 'Internal formulation';

export interface Source {
  id: string;
  type: SourceType;
  title: string;
  year: number;
  relevance: number;
  finding: string;
  cluster: string;
  snippet?: string;
  extracted?: { label: string; value: string }[];
  pinned?: boolean;
  excluded?: boolean;
}

export interface Pathway {
  id: string;
  rank: number;
  name: string;
  variantOf?: string;
  composition: { materialId: string; range: [number, number] }[];
  predicted: { propertyId: string; value: number; status: Status }[];
  scores: { targetMatch: number; cost: number; availability: number; overall: number };
  costPerKg: number;
  equipment: string[];
  hazards: string[];
  citations: string[];
}

export interface Trial {
  id: string;
  iteration: number;
  recipe: Record<string, number>;
  meta: Record<string, AIMeta>;
}

export interface Result {
  trialId: string;
  propertyId: string;
  readings: number[];
  mean: number;
  failureMode?: string;
  testDate?: string;
  photos?: string[];
  dueDate?: string;
  status: Status;
}

export interface ActivityItem {
  id: string;
  at: string;
  who: 'helix' | string;
  /** set when an agent wrote the entry */
  agent?: AgentId;
  text: string;
}

export interface Comment {
  id: string;
  target: string;
  author: string;
  /** set when an agent left the comment */
  agent?: AgentId;
  text: string;
  at: string;
}

export interface Proposal {
  trials: Trial[];
  summary: string;
  changes: { trialId: string; materialId: string; from: number; to: number }[];
}

export interface Project {
  id: string;
  code: string;
  name: string;
  owner: string;
  updated: string;
  scenarioId: string;
  mode: Mode;
  categoryId: string;
  subcategoryId: string;
  standard: string;
  useCase: UseCase;
  benchmarks: string[];
  targets: TargetRow[];
  top3: string[];
  constraints: Constraints;
  summary: string;
  stages: Record<StageId, StageStatus>;
  stageNotes?: Partial<Record<StageId, string>>;
  sources: Source[];
  pathways: Pathway[];
  compare: string[];
  selectedPathway?: string;
  trials: Trial[];
  results: Result[];
  proposal?: Proposal;
  iteration: number;
  approval: 'draft' | 'submitted' | 'approved';
  approvers?: string[];
  activity: ActivityItem[];
  comments: Comment[];
  finalCode?: string;
  finalTrial?: string;
}
