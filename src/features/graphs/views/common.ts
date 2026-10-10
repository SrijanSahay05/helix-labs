import type { Data, Layout } from '../plotTypes';
import type { Dataset, GTrial, Parameter, ResultDef, Suggestion } from '../types';
import type { ViewState } from '../store';
import type { FitInfo } from '../model/engine';
import { BEST, fmt, scaleFor } from '../traces/colorscales';
import { placeLabels, TEXTPOS, type LabelInput } from '../traces/labels';

export interface Theme {
  text: string;
  text2: string;
  text3: string;
  line: string;
  surface: string;
  accent: string;
  suggest: string;
  pass: string;
  dark: boolean;
}

export function readTheme(): Theme {
  const cs = getComputedStyle(document.documentElement);
  const v = (n: string, d: string) => cs.getPropertyValue(n).trim() || d;
  return {
    text: v('--text', '#20212b'),
    text2: v('--text-2', '#5f6270'),
    text3: v('--text-3', '#8a8c9a'),
    line: v('--line', '#e5e6ee'),
    surface: v('--surface', '#ffffff'),
    accent: v('--accent', '#6d4aff'),
    suggest: v('--suggest', '#A855F7'),
    pass: v('--pass', '#26765c'),
    dark: document.documentElement.classList.contains('dark'),
  };
}

export interface Geom {
  l: number;
  t: number;
  w: number;
  h: number;
  width: number;
  height: number;
}

export interface VizCtx {
  key: string;
  ds: Dataset;
  visible: GTrial[];
  v: ViewState;
  bestId?: string;
  suggestion: Suggestion | null;
  batch: Suggestion[];
  selection: Set<string>;
  pinned: Set<string>;
  hovered?: string;
  theme: Theme;
  reduced: boolean;
  readOnly: boolean;
  fit?: FitInfo;
  geom: Geom | null;
  /** grid resolution: 50 default, 30 while a SLICE slider drags, 60 after release */
  gridN: number;
  params: Parameter[];
  constant: Parameter[];
  isResult: (id: string) => boolean;
  def: (id: string) => Parameter | ResultDef | undefined;
  name: (id: string) => string;
  unit: (id: string) => string;
  value: (t: GTrial, id: string) => number | null;
  /** Q's coordinate on an axis: parameter value, or predicted mean for a result */
  qValue: (q: Suggestion, id: string) => { v: number | null; sd: number | null };
}

export const MONO = 'JetBrains Mono, ui-monospace, monospace';
export const SANS = 'Inter, DM Sans, system-ui, sans-serif';

export function axisTitle(ctx: VizCtx, id: string, extra = ''): string {
  const u = ctx.unit(id);
  return `${ctx.name(id)}${u ? ` (${u})` : ''}${extra}`;
}

export function axis(ctx: VizCtx, id: string, opts: { log?: boolean; range?: [number, number]; title?: string; domain?: [number, number] } = {}): Partial<Layout['xaxis']> {
  const t = ctx.theme;
  return {
    title: { text: opts.title ?? axisTitle(ctx, id), font: { size: 12, color: t.text2, family: SANS }, standoff: 10 },
    type: opts.log ? 'log' : 'linear',
    range: opts.range,
    domain: opts.domain,
    gridcolor: hexA(t.line, 0.6),
    zerolinecolor: hexA(t.line, 0.9),
    linecolor: t.line,
    tickfont: { family: MONO, size: 11, color: t.text3 },
    automargin: true,
    fixedrange: false,
  };
}

export function baseLayout(ctx: VizCtx, extra: Partial<Layout> = {}): Partial<Layout> {
  const t = ctx.theme;
  return {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { family: SANS, size: 12, color: t.text2 },
    // top margin leaves room for the floating mini-toolbar so it never covers data or tick labels
    margin: { l: 64, r: 96, t: 48, b: 56 },
    hovermode: 'closest',
    showlegend: false,
    dragmode: ctx.v.dragmode === 'select' ? 'select' : ctx.v.dragmode === 'lasso' ? 'lasso' : ctx.v.dragmode === 'zoom' ? 'zoom' : 'pan',
    autosize: true,
    hoverlabel: { bgcolor: '#0E1116', font: { color: '#fff', family: SANS } },
    selectdirection: 'any',
    ...extra,
  };
}

/** Colour bar on the right: 12 px wide, 180 px tall, title rotated on the right, mono ticks. */
export function colorbar(ctx: VizCtx, id: string, x = 1.02): Record<string, unknown> {
  const t = ctx.theme;
  const def = ctx.def(id) as ResultDef | undefined;
  const sc = scaleFor(ctx.v.colorscale, ctx.isResult(id) ? def : undefined);
  return {
    thickness: 12,
    len: 180,
    lenmode: 'pixels',
    x,
    xanchor: 'left',
    y: 0.5,
    outlinewidth: 0,
    tickfont: { family: MONO, size: 10, color: t.text3 },
    title: { text: ctx.name(id) + (sc.note ? `<br><span style="font-size:9px">${sc.note}</span>` : ''), side: 'right', font: { size: 11, color: t.text2 } },
  };
}

export function colorProps(ctx: VizCtx, id: string, values: (number | null)[]) {
  const def = ctx.def(id) as ResultDef | undefined;
  const sc = scaleFor(ctx.v.colorscale, ctx.isResult(id) ? def : undefined);
  const finite = values.filter((v): v is number => v !== null && Number.isFinite(v));
  const all = ctx.ds.trials.map((t) => ctx.value(t, id)).filter((v): v is number => v !== null && Number.isFinite(v));
  const cmin = Math.min(...(all.length ? all : finite.length ? finite : [0]));
  const cmax = Math.max(...(all.length ? all : finite.length ? finite : [1]));
  return { colorscale: sc.colorscale, reversescale: sc.reversescale, cmin, cmax, ...(sc.cmid !== undefined ? { cmid: sc.cmid } : {}) };
}

export function hexA(c: string, a: number): string {
  if (c.startsWith('#') && (c.length === 7 || c.length === 4)) {
    const h = c.length === 4 ? c.replace(/#(.)(.)(.)/, '#$1$1$2$2$3$3') : c;
    return `rgba(${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)},${a})`;
  }
  return c;
}

export function paddedRange(vals: number[], pad = 0.06, log = false): [number, number] {
  const f = vals.filter((v) => Number.isFinite(v) && (!log || v > 0));
  if (!f.length) return [0, 1];
  let lo = Math.min(...f);
  let hi = Math.max(...f);
  if (log) {
    lo = Math.log10(lo);
    hi = Math.log10(hi);
  }
  const s = hi - lo || Math.abs(hi) * 0.1 || 1;
  return [lo - s * pad, hi + s * pad];
}

/** Map data → pixel (for label collision), given explicit axis ranges and the plot geometry. */
export function toPixel(geom: Geom, xr: [number, number], yr: [number, number], logX: boolean, logY: boolean) {
  return (x: number, y: number) => {
    const xv = logX ? Math.log10(Math.max(x, 1e-12)) : x;
    const yv = logY ? Math.log10(Math.max(y, 1e-12)) : y;
    return { px: geom.l + ((xv - xr[0]) / (xr[1] - xr[0] || 1)) * geom.w, py: geom.t + geom.h - ((yv - yr[0]) / (yr[1] - yr[0] || 1)) * geom.h };
  };
}

export function labelsMode(ctx: VizCtx, is3d = false): 'all' | 'key' | 'none' {
  if (ctx.v.labels === 'none') return 'none';
  if (ctx.v.labels === 'all') return 'all';
  if (is3d || ctx.visible.length > 60) return 'key';
  return 'all';
}

export interface Pt {
  t: GTrial;
  x: number;
  y: number;
}

/**
 * Scatter-family points: main (complete), pending (hollow), failed (×), Best (orange, 1.6×), Q (violet diamond),
 * selection rings and the hovered ring. Labels are short ('T19') and collision-avoided.
 */
export function pointTraces(
  ctx: VizCtx,
  xId: string,
  yId: string,
  colorId: string | undefined,
  opts: { xr: [number, number]; yr: [number, number]; sizes?: Map<string, number>; showColorbar?: boolean; xaxis?: string; yaxis?: string; gl?: boolean; intro?: number },
): Data[] {
  const th = ctx.theme;
  const ax = { xaxis: opts.xaxis ?? 'x', yaxis: opts.yaxis ?? 'y' };
  const anySel = ctx.selection.size > 0;
  const pts: Pt[] = [];
  const pending: Pt[] = [];
  const failed: Pt[] = [];
  for (const t of ctx.visible) {
    const x = ctx.value(t, xId);
    const y = ctx.value(t, yId);
    if (t.status === 'pending') {
      // pending trials have no results: only shown when both axes are parameters
      if (x !== null && y !== null) pending.push({ t, x, y });
      continue;
    }
    if (x === null || y === null) continue;
    (t.status === 'failed' ? failed : pts).push({ t, x, y });
  }
  const intro = opts.intro ?? Infinity;
  const main = pts.filter((p, i) => p.t.id !== ctx.bestId && i < intro);
  const best = ctx.v.showBest ? pts.find((p) => p.t.id === ctx.bestId) : undefined;
  const sizeBase = 9 * ctx.v.pointSize;

  // labels
  const mode = labelsMode(ctx);
  const labelPos = new Map<string, string>();
  const keyIds = new Set([ctx.bestId, ...ctx.pinned, ctx.hovered].filter(Boolean) as string[]);
  if (mode !== 'none' && ctx.geom) {
    const px = toPixel(ctx.geom, opts.xr, opts.yr, ctx.v.logX, ctx.v.logY);
    const items: LabelInput[] = [...pts, ...pending]
      .filter((p) => mode === 'all' || keyIds.has(p.t.id))
      .map((p) => ({ id: p.t.id, ...pxy(px(p.x, p.y)), text: p.t.label, priority: p.t.id === ctx.bestId ? 3 : ctx.pinned.has(p.t.id) ? 2 : p.t.id === ctx.hovered ? 2 : 0 }));
    const placed = placeLabels(items, { x0: ctx.geom.l - 20, y0: ctx.geom.t - 4, x1: ctx.geom.l + ctx.geom.w + 30, y1: ctx.geom.t + ctx.geom.h + 4 });
    placed.forEach((pos, id) => pos && labelPos.set(id, TEXTPOS[pos]));
  }
  const text = (p: Pt) => (labelPos.has(p.t.id) || (mode !== 'none' && !ctx.geom) ? p.t.label : '');
  const tpos = (p: Pt) => labelPos.get(p.t.id) ?? 'top center';
  const colorVals = main.map((p) => (colorId ? ctx.value(p.t, colorId) : null));
  const cprops = colorId ? colorProps(ctx, colorId, colorVals) : null;
  const type = opts.gl || ctx.visible.length > 500 ? 'scattergl' : 'scatter';
  const opacity = (id: string) => (!anySel || ctx.selection.has(id) ? 1 : 0.25);

  const traces: Data[] = [
    {
      type,
      ...ax,
      ids: main.map((p) => p.t.id),
      x: main.map((p) => p.x),
      y: main.map((p) => p.y),
      customdata: main.map((p) => p.t.id),
      mode: mode === 'none' || type === 'scattergl' ? 'markers' : 'markers+text',
      text: main.map(text),
      textposition: main.map(tpos),
      textfont: { family: MONO, size: 10, color: th.text2 },
      hoverinfo: 'none',
      marker: {
        size: main.map((p) => opts.sizes?.get(p.t.id) ?? sizeBase),
        color: colorId ? colorVals.map((v) => (v === null ? '#9aa0ab' : v)) : th.accent,
        ...(cprops ?? {}),
        showscale: !!colorId && opts.showColorbar !== false,
        ...(colorId && opts.showColorbar !== false ? { colorbar: colorbar(ctx, colorId) } : {}),
        opacity: main.map((p) => opacity(p.t.id)),
        line: { width: main.map((p) => (anySel && ctx.selection.has(p.t.id) ? 2 : 1)), color: main.map((p) => (anySel && ctx.selection.has(p.t.id) ? th.text : th.surface)) },
      },
      selectedpoints: null,
    } as Data,
  ];
  if (ctx.v.filters.status.includes('pending') && pending.length)
    traces.push({
      type: 'scatter',
      ...ax,
      ids: pending.map((p) => p.t.id),
      x: pending.map((p) => p.x),
      y: pending.map((p) => p.y),
      customdata: pending.map((p) => p.t.id),
      mode: mode === 'none' ? 'markers' : 'markers+text',
      text: pending.map(text),
      textposition: pending.map(tpos),
      textfont: { family: MONO, size: 10, color: th.text3 },
      hoverinfo: 'none',
      marker: { size: sizeBase, symbol: 'circle-open', color: '#9aa0ab', line: { width: 1.5, color: '#9aa0ab' }, opacity: pending.map((p) => opacity(p.t.id)) },
    } as Data);
  if (ctx.v.filters.status.includes('failed') && failed.length)
    traces.push({ type: 'scatter', ...ax, ids: failed.map((p) => p.t.id), x: failed.map((p) => p.x), y: failed.map((p) => p.y), customdata: failed.map((p) => p.t.id), mode: 'markers', hoverinfo: 'none', marker: { size: sizeBase, symbol: 'x-thin-open', color: '#9aa0ab', line: { width: 2, color: '#9aa0ab' } } } as Data);
  if (best && intro >= pts.length)
    traces.push({
      type: 'scatter',
      ...ax,
      ids: [best.t.id],
      x: [best.x],
      y: [best.y],
      customdata: [best.t.id],
      mode: mode === 'none' ? 'markers' : 'markers+text',
      text: [`${best.t.label} · Best`],
      textposition: [labelPos.get(best.t.id) ?? 'top center'],
      textfont: { family: MONO, size: 10, color: BEST, weight: 600 } as never,
      hoverinfo: 'none',
      marker: { size: (opts.sizes?.get(best.t.id) ?? sizeBase) * 1.6, color: BEST, line: { width: 1.5, color: '#ffffff' }, opacity: opacity(best.t.id) },
    } as Data);
  // suggestion(s)
  if (ctx.v.showSuggestion && intro >= pts.length) {
    for (const q of [ctx.suggestion, ...ctx.batch.filter((b) => b.id !== ctx.suggestion?.id)].filter(Boolean) as Suggestion[]) {
      const qx = ctx.qValue(q, xId);
      const qy = ctx.qValue(q, yId);
      if (qx.v === null || qy.v === null) continue;
      const tr = {
        type: 'scatter',
        ...ax,
        ids: [q.id],
        x: [qx.v],
        y: [qy.v],
        customdata: [q.id],
        mode: 'markers+text',
        text: [q.id === 'Q1' ? 'Q' : q.id],
        textposition: ['top center'],
        textfont: { family: MONO, size: 10, color: ctx.theme.suggest },
        hoverinfo: 'none',
        marker: { size: 16 * ctx.v.pointSize, symbol: 'diamond-open', color: ctx.theme.suggest, line: { width: 2, color: ctx.theme.suggest } },
      } as Record<string, unknown>;
      if (qx.sd) tr.error_x = { type: 'data', array: [qx.sd], color: hexA(ctx.theme.suggest, 0.7), thickness: 1.2, width: 4 };
      if (qy.sd) tr.error_y = { type: 'data', array: [qy.sd], color: hexA(ctx.theme.suggest, 0.7), thickness: 1.2, width: 4 };
      traces.push(tr as Data);
    }
  }
  // hovered ring (cross-highlight from other views / the Results table)
  const hp = [...pts, ...pending].find((p) => p.t.id === ctx.hovered);
  if (hp)
    traces.push({ type: 'scatter', ...ax, x: [hp.x], y: [hp.y], mode: 'markers', hoverinfo: 'skip', marker: { size: sizeBase * 2.2, color: 'rgba(0,0,0,0)', line: { width: 2, color: th.text } } } as Data);
  return traces;
}

function pxy(p: { px: number; py: number }) {
  return { x: p.px, y: p.py };
}

export function trialsSummary(ctx: VizCtx, what: string): string {
  const best = ctx.ds.trials.find((t) => t.id === ctx.bestId);
  const r = ctx.ds.results.find((x) => x.primary) ?? ctx.ds.results[0];
  return `${what}, ${ctx.visible.length} trials${best ? `; best ${best.label} at ${r.name} ${fmt(best.results[r.id])}` : ''}.`;
}
