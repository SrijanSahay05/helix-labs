export type Direction = 'maximize' | 'minimize' | 'target';

export interface Parameter {
  id: string;
  name: string;
  unit: string;
  kind: 'ingredient' | 'process';
  min: number;
  max: number;
  group?: string;
  /** a factor the trial plan deliberately varied (Delta prefers these for default axes) */
  lever?: boolean;
}

export interface ResultDef {
  id: string;
  name: string;
  unit: string;
  direction: Direction;
  /** target value (for `target` direction, or a reference line for others) */
  target?: number;
  tolerance?: number;
  weight: number;
  primary?: boolean;
  /** must pass for the feasible region */
  must?: boolean;
}

export interface GTrial {
  id: string;
  /** short label, e.g. 'T19' */
  label: string;
  /** long name, e.g. 'Trial 19' */
  name: string;
  iteration: number;
  createdAt: string;
  createdBy: { kind: 'agent' | 'user'; id: string };
  params: Record<string, number>;
  /** null = pending / missing */
  results: Record<string, number | null>;
  status: 'complete' | 'pending' | 'failed';
}

export interface Suggestion {
  id: string;
  params: Record<string, number>;
  predicted: Record<string, { mean: number; sd: number | null }>;
  acquisition: { kind: 'EI' | 'UCB'; value: number };
  rationale: string[];
}

export interface Dataset {
  id: string;
  title: string;
  parameters: Parameter[];
  results: ResultDef[];
  trials: GTrial[];
  suggestion?: Suggestion;
  /** set from the model state, never hard-coded */
  modelTrainedOn: number;
  /** the ingredient that absorbs changes so recipes sum to 100 % */
  balanceId?: string;
}

export type ViewId = 'parallel' | '2d' | '3d' | 'surface' | 'contour' | 'bar' | 'pie' | 'bubble' | 'splom' | 'pareto' | 'ternary' | 'parity' | 'progress' | 'pca';
