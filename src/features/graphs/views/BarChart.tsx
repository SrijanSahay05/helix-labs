import { useMemo } from 'react';
import type { Data } from '../plotTypes';
import { PlotHost } from '../PlotHost';
import { BEST, fmt } from '../traces/colorscales';
import type { ResultDef } from '../types';
import { axis, baseLayout, colorbar, colorProps, hexA, MONO, paddedRange, trialsSummary, type VizCtx } from './common';
import type { VizAct } from './act';

/**
 * Bar chart: one bar per trial for the chosen result or parameter, coloured by COLOR BY.
 * Best is orange, the Q Suggestion is a hatched violet bar at its predicted value (± σ), the target is a dashed line.
 */
export function BarChart({ ctx, act, metric, sort }: { ctx: VizCtx; act: VizAct; metric: string; sort: 'trial' | 'value' }) {
  const figure = useMemo(() => {
    const th = ctx.theme;
    const def = ctx.isResult(metric) ? (ctx.def(metric) as ResultDef) : undefined;
    const better = def?.direction === 'minimize' ? -1 : 1;
    let rows = ctx.visible.map((t) => ({ t, v: ctx.value(t, metric) })).filter((r): r is { t: typeof r.t; v: number } => r.v !== null);
    const num = (id: string) => Number(id.replace(/\D/g, '')) || 0;
    rows = sort === 'value' ? [...rows].sort((a, b) => (b.v - a.v) * better) : [...rows].sort((a, b) => num(a.t.id) - num(b.t.id));
    const colorId = ctx.v.colorBy;
    const cv = rows.map((r) => (colorId ? ctx.value(r.t, colorId) : null));
    const anySel = ctx.selection.size > 0;
    const q = ctx.v.showSuggestion ? ctx.suggestion : null;
    const qv = q ? ctx.qValue(q, metric) : null;
    const labels = [...rows.map((r) => r.t.label), ...(q && qv?.v !== null && qv ? ['Q'] : [])];
    const data: Data[] = [
      {
        type: 'bar',
        x: rows.map((r) => r.t.label),
        y: rows.map((r) => r.v),
        customdata: rows.map((r) => r.t.id),
        hoverinfo: 'none',
        marker: {
          color: rows.map((r, i) => (r.t.id === ctx.bestId && ctx.v.showBest ? BEST : r.t.status === 'pending' ? hexA(th.text3, 0.25) : (cv[i] ?? th.accent))),
          ...(colorId ? colorProps(ctx, colorId, cv) : {}),
          showscale: !!colorId,
          ...(colorId ? { colorbar: colorbar(ctx, colorId) } : {}),
          opacity: rows.map((r) => (!anySel || ctx.selection.has(r.t.id) ? 1 : 0.3)),
          line: { width: rows.map((r) => (r.t.id === ctx.hovered || ctx.selection.has(r.t.id) ? 2 : 0)), color: th.text },
        },
        text: rows.map((r) => fmt(r.v)),
        textposition: rows.length <= 30 ? 'outside' : 'none',
        textfont: { family: MONO, size: 10, color: th.text2 },
        cliponaxis: false,
      },
    ];
    if (q && qv && qv.v !== null)
      data.push({
        type: 'bar',
        x: ['Q'],
        y: [qv.v],
        customdata: [q.id],
        hoverinfo: 'none',
        marker: { color: hexA(th.suggest, 0.18), line: { color: th.suggest, width: 2 }, pattern: { shape: '/', fgcolor: hexA(th.suggest, 0.5), size: 6 } },
        error_y: qv.sd ? { type: 'data', array: [qv.sd], color: th.suggest, thickness: 1.5, width: 6 } : undefined,
        text: [fmt(qv.v)],
        textposition: 'outside',
        textfont: { family: MONO, size: 10, color: th.suggest },
        cliponaxis: false,
      });
    const vals = [...rows.map((r) => r.v), ...(qv?.v != null ? [qv.v + (qv.sd ?? 0)] : []), ...(def?.target !== undefined ? [def.target] : [])];
    const lo = Math.min(...vals);
    const range = paddedRange([lo > 0 && lo / Math.max(...vals) > 0.6 ? lo * 0.97 : Math.min(0, lo), ...vals], 0.1);
    const shapes = def?.target !== undefined ? [{ type: 'line', xref: 'paper', yref: 'y', x0: 0, x1: 1, y0: def.target, y1: def.target, line: { color: hexA(th.pass, 0.75), width: 1.5, dash: 'dash' } }] : [];
    const annotations = def?.target !== undefined ? [{ xref: 'paper', yref: 'y', x: 1, y: def.target, xanchor: 'right', yanchor: 'bottom', showarrow: false, text: `target ${fmt(def.target)}`, font: { size: 10, color: th.pass } }] : [];
    return {
      data,
      layout: baseLayout(ctx, {
        xaxis: { ...axis(ctx, metric, { title: sort === 'value' ? 'Trials, best first' : 'Trials' }), type: 'category', categoryorder: 'array', categoryarray: labels, tickfont: { family: MONO, size: 10, color: th.text3 }, showgrid: false },
        yaxis: axis(ctx, metric, { range }),
        bargap: 0.28,
        shapes,
        annotations,
        uirevision: `${ctx.key}:bar:${metric}:${sort}`,
      }),
    };
  }, [ctx, metric, sort]);

  return (
    <PlotHost
      figure={figure}
      ariaLabel={trialsSummary(ctx, `Bar chart of ${ctx.name(metric)} by trial${sort === 'value' ? ', sorted best first' : ''}`)}
      onHover={(h) => act.hover(h)}
      onUnhover={() => act.hover(null)}
      onClick={(id, e) => act.click(id, e)}
      onSelected={(ids) => act.select(ids)}
    />
  );
}
