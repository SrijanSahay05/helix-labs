/**
 * Bridge between the Graphs panel and Ask Helix: the mounted panel registers what is on screen,
 * so "Explain this chart" (⌘E) can answer as Delta with clickable trial references.
 */
export interface ChartContext {
  view: string;
  axes: string;
  selection: string[];
  insights: () => { text: string; refs: string[] };
  pin: (id: string) => void;
}

let current: ChartContext | null = null;

export function setChartContext(c: ChartContext | null) {
  current = c;
}

export function chartContext(): ChartContext | null {
  return current;
}
