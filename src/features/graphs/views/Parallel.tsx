import { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { PlotHost } from '../PlotHost';
import { BEST, fmt, HELIX_LAB, sample, scaleFor } from '../traces/colorscales';
import { middleEllipsis } from '../traces/labels';
import type { ResultDef } from '../types';
import { baseLayout, MONO, trialsSummary, type VizCtx } from './common';
import type { VizAct } from './act';

type Ranges = Record<string, [number, number][]>;

/** Parallel coordinates: top-6 influential parameters then every result; brushing writes the shared selection. */
export function Parallel({ ctx, act, importance }: { ctx: VizCtx; act: VizAct; importance: { paramId: string; score: number }[] }) {
  const { v } = ctx;
  const [ranges, setRanges] = useState<Ranges>({});
  const hoveredIdx = useRef<number | null>(null);
  const dims = useMemo(() => {
    if (v.parallelDims?.length) return v.parallelDims;
    const top = importance.filter((i) => ctx.params.some((p) => p.id === i.paramId)).slice(0, 6).map((i) => i.paramId);
    const params = top.length ? top : ctx.params.slice(0, 6).map((p) => p.id);
    return [...params, ...ctx.ds.results.map((r) => r.id)];
  }, [v.parallelDims, importance, ctx.params, ctx.ds.results]);

  // a selection cleared elsewhere clears the brushes too
  useEffect(() => {
    if (!ctx.selection.size && Object.keys(ranges).length) setRanges({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.selection.size]);

  const rows = useMemo(() => ctx.visible.filter((t) => t.status === 'complete'), [ctx.visible]);
  const colorId = v.colorBy ?? dims[dims.length - 1];

  const figure = useMemo(() => {
    const th = ctx.theme;
    const cdef = ctx.isResult(colorId) ? (ctx.def(colorId) as ResultDef) : undefined;
    const sc = scaleFor(v.colorscale, cdef);
    const base = (Array.isArray(sc.colorscale) ? sc.colorscale : HELIX_LAB) as [number, string][];
    const cv = rows.map((t) => ctx.value(t, colorId) ?? 0);
    const lo = Math.min(...cv);
    const hi = Math.max(...cv);
    const ownBrush = Object.keys(ranges).length > 0;
    const foreign = ctx.selection.size > 0 && !ownBrush;
    // composite scale: [0, 0.04] grey (outside a selection made in another view) · data · orange (Best) · violet (Q)
    const scale: [number, string][] = [
      [0, '#C9CCD3'],
      [0.04, '#C9CCD3'],
      ...[0, 0.25, 0.5, 0.75, 1].map((k): [number, string] => [0.05 + k * 0.85, sample(base, sc.reversescale ? 1 - k : k)]),
      [0.93, BEST],
      [0.96, BEST],
      [0.97, th.suggest],
      [1, th.suggest],
    ];
    const order = [...rows].sort((a, b) => (a.id === ctx.bestId ? 1 : b.id === ctx.bestId ? -1 : 0)); // Best drawn last
    const q = v.showSuggestion ? ctx.suggestion : null;
    const values = (id: string) => {
      const vals = order.map((t) => ctx.value(t, id) ?? NaN);
      if (q) vals.push(ctx.qValue(q, id).v ?? NaN);
      return vals;
    };
    const color = order.map((t) => {
      if (t.id === ctx.bestId && v.showBest) return 0.945;
      if (foreign && !ctx.selection.has(t.id)) return 0.02;
      const c = ctx.value(t, colorId) ?? lo;
      return 0.05 + ((c - lo) / (hi - lo || 1)) * 0.85;
    });
    if (q) color.push(0.985);
    const firstResult = dims.findIndex((d) => ctx.isResult(d));
    const data = [
      {
        type: 'parcoords',
        customdata: order.map((t) => t.id),
        line: { color, colorscale: scale, cmin: 0, cmax: 1, showscale: false },
        // parcoords defaults to an 'auto' text halo that smudges grey labels
        labelfont: { size: 11, color: th.text2, shadow: 'none' },
        tickfont: { family: MONO, size: 10, color: th.text3, shadow: 'none' },
        rangefont: { family: MONO, size: 9, color: th.text3, shadow: 'none' },
        labelangle: -18,
        labelside: 'top',
        dimensions: dims.map((id) => {
          const vals = values(id);
          const fin = vals.filter(Number.isFinite);
          return {
            label: middleEllipsis(ctx.name(id), 22),
            values: vals,
            range: [Math.min(...fin), Math.max(...fin)],
            ...(ranges[id] ? { constraintrange: ranges[id].length === 1 ? ranges[id][0] : ranges[id] } : {}),
          };
        }),
      },
    ];
    const n = dims.length;
    const shapes =
      firstResult > 0
        ? [{ type: 'line', xref: 'paper', yref: 'paper', x0: (firstResult - 0.5) / (n - 1), x1: (firstResult - 0.5) / (n - 1), y0: -0.02, y1: 1.02, line: { color: th.text3, width: 2.5 } }]
        : [];
    const annotations = firstResult > 0 ? [{ xref: 'paper', yref: 'paper', x: (firstResult - 0.5) / (n - 1), y: -0.08, text: 'RESULTS →', showarrow: false, xanchor: 'left', font: { size: 10, color: th.text2, family: MONO } }] : [];
    return { data, layout: baseLayout(ctx, { margin: { l: 80, r: 60, t: 96, b: 40 }, shapes, annotations, uirevision: `${ctx.key}:parallel:${dims.join(',')}` }) };
  }, [ctx, rows, dims, colorId, ranges, v]);

  const applyRanges = (next: Ranges) => {
    setRanges(next);
    const keys = Object.keys(next);
    if (!keys.length) return act.select(null);
    const ids = rows.filter((t) => keys.every((k) => next[k].some(([a, b]) => {
      const val = ctx.value(t, k);
      return val !== null && val >= Math.min(a, b) && val <= Math.max(a, b);
    }))).map((t) => t.id);
    act.select(ids);
  };

  return (
    <div className="flex h-full flex-col">
      {Object.keys(ranges).length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-2 pt-2">
          {Object.entries(ranges).map(([id, rs]) => (
            <span key={id} className="flex items-center gap-1 rounded-full border border-line bg-surface2 py-0.5 pl-2 pr-1 text-2xs text-ink">
              {middleEllipsis(ctx.name(id), 18)} <span className="mono">{rs.map(([a, b]) => `${fmt(Math.min(a, b))}–${fmt(Math.max(a, b))}`).join(', ')}</span>
              <button
                aria-label={`Clear ${ctx.name(id)} range`}
                className="rounded-full p-0.5 hover:bg-surface"
                onClick={() => {
                  const next = { ...ranges };
                  delete next[id];
                  applyRanges(next);
                }}
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div
        className="relative min-h-0 flex-1"
        onClick={(e) => {
          // parcoords has no click event: pin the line under the pointer
          const i = hoveredIdx.current;
          if (i !== null) {
            const sorted = [...rows].sort((a, b) => (a.id === ctx.bestId ? 1 : b.id === ctx.bestId ? -1 : 0));
            const t = sorted[i];
            if (t) act.click(t.id, e.nativeEvent);
            else if (ctx.suggestion) act.click(ctx.suggestion.id, e.nativeEvent);
          }
        }}
      >
        <PlotHost
          figure={figure}
          ariaLabel={trialsSummary(ctx, `Parallel coordinates of ${dims.length} axes`)}
          onHover={() => {}}
          onRestyle={(ev) => {
            const [upd] = ev as [Record<string, unknown>];
            const key = Object.keys(upd ?? {}).find((k) => /dimensions\[(\d+)\]\.constraintrange/.test(k));
            if (!key) return;
            const idx = Number(key.match(/\[(\d+)\]/)![1]);
            const raw = (upd[key] as unknown[] | null)?.[0] as number[] | number[][] | null | undefined;
            const id = dims[idx];
            const next = { ...ranges };
            if (!raw) delete next[id];
            else next[id] = Array.isArray(raw[0]) ? (raw as number[][]).map((r) => [r[0], r[1]] as [number, number]) : [[(raw as number[])[0], (raw as number[])[1]]];
            applyRanges(next);
          }}
        >
          {() => <ParcoordsHover rows={rows} ctx={ctx} act={act} dims={dims} onIndex={(i) => (hoveredIdx.current = i)} />}
        </PlotHost>
      </div>
    </div>
  );
}

/** Parcoords emits hover with the line index; we show the shared tooltip at the pointer. */
function ParcoordsHover({ rows, ctx, act, dims, onIndex }: { rows: VizCtx['visible']; ctx: VizCtx; act: VizAct; dims: string[]; onIndex: (i: number | null) => void }) {
  const ref = useRef<HTMLSpanElement>(null);
  const live = useRef({ rows, ctx, act, dims, onIndex });
  live.current = { rows, ctx, act, dims, onIndex };
  useEffect(() => {
    const host = ref.current?.parentElement;
    const gd = host?.firstElementChild as (HTMLElement & { on?: (e: string, f: (x: unknown) => void) => void }) | null;
    if (!host || !gd) return;
    const t = setInterval(() => {
      if (!gd.on) return;
      clearInterval(t);
      gd.on('plotly_hover', (e) => {
        const { rows, ctx, act, dims, onIndex } = live.current;
        const sorted = [...rows].sort((a, b) => (a.id === ctx.bestId ? 1 : b.id === ctx.bestId ? -1 : 0));
        const ev = e as { curveNumber?: number | null; clientX: number; clientY: number };
        if (ev.curveNumber === null || ev.curveNumber === undefined) return;
        onIndex(ev.curveNumber);
        const tr = sorted[ev.curveNumber];
        const id = tr?.id ?? ctx.suggestion?.id;
        if (!id) return;
        const rect = host.getBoundingClientRect();
        const x = ev.clientX - rect.left;
        const y = ev.clientY - rect.top;
        act.hover({ id, box: { x0: x, x1: x, y0: y, y1: y }, point: {}, extra: dims.map((d) => `${ctx.name(d)}: ${fmt(tr ? ctx.value(tr, d) : ctx.suggestion ? ctx.qValue(ctx.suggestion, d).v : null)}`) });
      });
      gd.on('plotly_unhover', () => {
        live.current.onIndex(null);
        live.current.act.hover(null);
      });
    }, 50);
    return () => clearInterval(t);
  }, []);
  return <span ref={ref} className="hidden" />;
}
