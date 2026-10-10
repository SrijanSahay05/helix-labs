import type { ViewState } from '../store';
import type { HoverInfo } from '../PlotHost';

export type AxisKey = 'x' | 'y' | 'z' | 'colorBy' | 'result' | 'sizeBy';

/** What a view can ask of the workspace. */
export interface VizAct {
  set: (p: Partial<ViewState> | ((v: ViewState) => Partial<ViewState>)) => void;
  hover: (h: (HoverInfo & { extra?: string[] }) | null) => void;
  click: (id: string | null, e?: MouseEvent) => void;
  select: (ids: string[] | null) => void;
  openAxis: (k: AxisKey) => void;
  probe: (x: number, y: number) => void;
  gd: (el: HTMLDivElement | null) => void;
}
