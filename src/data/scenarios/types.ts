import type { Benchmark, Constraints, Operator, Pathway, Priority, Source, Trial, UseCase } from '@/types';

export interface TargetSeed {
  propertyId: string;
  operator: Operator;
  value: number | [number, number];
  priority: Priority;
  std?: string;
  stdMin?: number;
  stdMax?: number;
  bench?: number | string;
  confidence?: number;
  reason?: string;
}

export interface GuidedOption {
  label: string;
  icon: string;
  /** structured fields this answer maps to */
  sets: Record<string, unknown>;
}
export interface GuidedQuestion {
  id: string;
  q: string;
  picture: string;
  options: GuidedOption[];
  answer: number;
}

export interface TestPlanRow {
  test: string;
  method: string;
  specimens: number;
  ages: string;
  dueInDays: number;
}

export interface Scenario {
  id: string;
  label: string;
  chip: string;
  /** a Magic Start brief that routes to this scenario (tested) */
  example: string;
  keywords: string[];
  projectName: string;
  codePrefix: string;
  docType: string;
  productGuess: string;
  categoryId: string;
  subcategoryId: string;
  chemistry: string[];
  form: string;
  standard: string;
  standardAlt?: string;
  useCase: UseCase;
  useCaseConfidence: Partial<Record<keyof UseCase, number>>;
  guided: GuidedQuestion[];
  benchmarks: Benchmark[];
  targets: TargetSeed[];
  top3: { id: string; reason: string }[];
  constraints: Constraints;
  summary: { scientist: string; plain: string };
  pathways: Pathway[];
  balanceMaterial: string;
  /** material Helix tweaks first when a must-have target is short */
  leverMaterial: string;
  clusters: string[];
  query: string;
  sources: Source[];
  trials?: Trial[];
  trialsIter2?: Trial[];
  /** iteration 2: the iteration-1 trial it builds on and the analysis text that proposes it */
  iter2?: { base: string; summary: string };
  /** sources and lab data are hand-written from a research run: no generated sources, and Graphs show this project's own trials */
  curated?: boolean;
  measured: string[];
  mixingProtocol: string[];
  testPlan: TestPlanRow[];
  /** hand-seeded means per trial for the default scenario */
  resultMeans?: Record<string, Record<string, number>>;
}
