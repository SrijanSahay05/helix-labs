import { useMemo } from 'react';
import type { Data } from '../plotTypes';
import { PlotHost } from '../PlotHost';
import { observedRange, overallDesirability } from '../selectors';
import { BEST, HELIX_LAB, sample } from '../traces/colorscales';
import type { GTrial, ResultDef } from '../types';
import { axis, baseLayout, hexA, MONO, paddedRange, trialsSummary, type VizCtx } from './common';
import type { VizAct } from './act';

export const DESIRABILITY = '__desirability';

/** "Are we converging?" — result by trial order, coloured by iteration, with the running best as an orange step. */
export function Progress({ ctx, act, metric }: { ctx: VizCtx; act: VizAct; metric: string }) {
  const figure = useMemo(() => {
    const th = ctx.theme;
    const def = metric === DESIRABILITY ? undefined : (ctx.def(metric) as ResultDef);
    const ranges = Object.fromEntries(ctx.ds.results.map((r) => [r.id, observedRange(ctx.ds, r.id)]));
    const val = (t: GTrial) => (metric === DESIRABILITY ? overallDesirability(t, ctx.ds, ranges) : (t.results[metric] ?? null));
    const ordered = [...ctx.visible].filter((t) => t.status === 'complete').sort((a, b) => a.createdAt.localeCompare(b.createdAt) || Number(a.id.replace(/\D/g, '')) - Number(b.id.replace(/\D/g, '')));
    const byIter = ctx.v.progressBy === 'iteration';
    const xOf = (t: GTrial, i: number) => (byIter ? t.iteration : i + 1);
    const pts = ordered.map((t, i) => ({ t, x: xOf(t, i), y: val(t) })).filter((p): p is { t: GTrial; x: number; y: number } => p.y !== null);
    const iters = [...new Set(pts.map((p) => p.t.iteration))].sort((a, b) => a - b);
    const good = (a: number, b: number) => (def?.direction === 'minimize' ? a < b : def?.direction === 'target' ? Math.abs(a - (def.target ?? a)) < Math.abs(b - (def.target ?? b)) : a > b);
    const run: { x: number; y: number }[] = [];
    let best: number | null = null;
    for (const p of pts) {
      if (best === null || good(p.y, best)) best = p.y;
      run.push({ x: p.x, y: best });
    }
    const anySel = ctx.selection.size > 0;
    const data: Data[] = [
      { type: 'scatter', x: run.map((r) => r.x), y: run.map((r) => r.y), mode: 'lines', line: { shape: 'hv', color: BEST, width: 2 }, hoverinfo: 'skip', name: 'Running best' },
      {
        type: 'scatter',
        x: pts.map((p) => p.x),
        y: pts.map((p) => p.y),
        customdata: pts.map((p) => p.t.id),
        mode: ctx.v.labels === 'none' ? 'markers' : 'markers+text',
        text: pts.map((p) => p.t.label),
        textposition: 'top center',
        textfont: { family: MONO, size: 10, color: th.text3 },
        hoverinfo: 'none',
        marker: {
          size: pts.map((p) => (p.t.id === ctx.bestId ? 13 : 9)),
          color: pts.map((p) => (p.t.id === ctx.bestId ? BEST : sample(HELIX_LAB.slice(0, 4).map(([k, c]) => [k / 0.8, c] as [number, string]), iters.length > 1 ? iters.indexOf(p.t.iteration) / (iters.length - 1) : 0.5))),
          opacity: pts.map((p) => (!anySel || ctx.selection.has(p.t.id) ? 1 : 0.25)),
          line: { width: 1, color: th.surface },
        },
      },
    ];
    const q = ctx.v.showSuggestion ? ctx.suggestion : null;
    const qp = q && def ? q.predicted[def.id] : null;
    const nextX = byIter ? Math.max(...iters, 0) + 1 : pts.length + 1;
    if (q && qp) data.push({ type: 'scatter', x: [nextX], y: [qp.mean], customdata: [q.id], mode: 'markers+text', text: ['Q (next)'], textposition: 'top center', textfont: { family: MONO, size: 10, color: th.suggest }, error_y: qp.sd ? { type: 'data', array: [qp.sd], color: th.suggest } : undefined, hoverinfo: 'none', marker: { size: 15, symbol: 'diamond-open', color: th.suggest, opacity: 0.8, line: { width: 2, color: th.suggest } } });
    const shapes = def?.target !== undefined ? [{ type: 'line', xref: 'paper', yref: 'y', x0: 0, x1: 1, y0: def.target, y1: def.target, line: { color: hexA(th.pass, 0.7), width: 1.2, dash: 'dash' } }] : [];
    const ys = [...pts.map((p) => p.y), ...(qp ? [qp.mean] : []), ...(def?.target !== undefined ? [def.target] : [])];
    return {
      data,
      layout: baseLayout(ctx, {
        xaxis: { ...axis(ctx, 'x', { title: byIter ? 'Iteration' : 'Trial order', range: [0.4, nextX + 0.6] }), dtick: 1 },
        yaxis: axis(ctx, metric, { range: paddedRange(ys, 0.1), title: def ? undefined : 'Overall desirability (0–1)' }),
        shapes,
        annotations: [
          ...iters.map((it, i) => ({ xref: 'paper', yref: 'paper', x: 0.01 + i * 0.09, y: 1.0, xanchor: 'left', yanchor: 'bottom', showarrow: false, text: `<span style="color:${sample(HELIX_LAB.slice(0, 4).map(([k, c]) => [k / 0.8, c] as [number, string]), iters.length > 1 ? i / (iters.length - 1) : 0.5)}">●</span> Iter ${it}`, font: { size: 10, color: th.text2 } })),
          ...(def?.target !== undefined ? [{ xref: 'paper', yref: 'y', x: 0.995, y: def.target, xanchor: 'right', yanchor: 'bottom', showarrow: false, text: 'target', font: { size: 10, color: th.pass } }] : []),
        ],
        margin: { l: 64, r: 24, t: 56, b: 56 },
        uirevision: `${ctx.key}:progress:${metric}:${byIter}`,
      }),
    };
  }, [ctx, metric]);

  return (
    <PlotHost
      figure={figure}
      ariaLabel={trialsSummary(ctx, `Optimisation progress of ${metric === DESIRABILITY ? 'overall desirability' : ctx.name(metric)} by ${ctx.v.progressBy}`)}
      onHover={(h) => act.hover(h)}
      onUnhover={() => act.hover(null)}
      onClick={(id, e) => act.click(id, e)}
      onSelected={(ids) => act.select(ids)}
    />
  );
}
