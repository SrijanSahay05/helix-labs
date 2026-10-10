import { useMemo } from 'react';
import type { Data } from '../plotTypes';
import { PlotHost } from '../PlotHost';
import { hypervolume, paretoFront } from '../selectors';
import { BEST, fmt } from '../traces/colorscales';
import type { GTrial, ResultDef } from '../types';
import { axis, axisTitle, baseLayout, hexA, MONO, paddedRange, trialsSummary, type VizCtx } from './common';
import type { VizAct } from './act';

type Dir = 'maximize' | 'minimize';
const dirOf = (r: ResultDef): Dir => (r.direction === 'minimize' ? 'minimize' : 'maximize');

/** Pareto front of two results; non-dominated trials in orange joined by a step line, hypervolume in the corner. */
export function Pareto({ ctx, act, pair }: { ctx: VizCtx; act: VizAct; pair: [string, string] }) {
  const [xa, ya] = pair;
  const dx = ctx.def(xa) as ResultDef;
  const dy = ctx.def(ya) as ResultDef;
  const dirs: [Dir, Dir] = [dirOf(dx), dirOf(dy)];

  const info = useMemo(() => {
    const rows = ctx.visible.filter((t) => t.status === 'complete' && t.results[xa] !== null && t.results[ya] !== null);
    const get = (t: GTrial): [number, number] => [t.results[xa] as number, t.results[ya] as number];
    const { front, dominatedCount } = paretoFront(rows, get, dirs);
    const xs = rows.map((t) => get(t)[0]);
    const ys = rows.map((t) => get(t)[1]);
    const ref: [number, number] = [dirs[0] === 'minimize' ? Math.max(...xs) : Math.min(...xs), dirs[1] === 'minimize' ? Math.max(...ys) : Math.min(...ys)];
    const hv = hypervolume(front.map(get), ref, dirs);
    return { rows, front, dominatedCount, hv, ref };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.visible, xa, ya]);

  const figure = useMemo(() => {
    const th = ctx.theme;
    const frontIds = new Set(info.front.map((t) => t.id));
    const sorted = [...info.front].sort((a, b) => (a.results[xa] as number) - (b.results[xa] as number));
    const anySel = ctx.selection.size > 0;
    const q = ctx.v.showSuggestion ? ctx.suggestion : null;
    const qx = q?.predicted[xa];
    const qy = q?.predicted[ya];
    const xr = paddedRange([...info.rows.map((t) => t.results[xa] as number), ...(qx ? [qx.mean] : [])]);
    const yr = paddedRange([...info.rows.map((t) => t.results[ya] as number), ...(qy ? [qy.mean] : [])]);
    const dom = info.rows.filter((t) => !frontIds.has(t.id));
    const data: Data[] = [
      { type: 'scatter', x: sorted.map((t) => t.results[xa]), y: sorted.map((t) => t.results[ya]), mode: 'lines', line: { shape: dirs[0] === dirs[1] ? 'vh' : 'hv', color: BEST, width: 2 }, hoverinfo: 'skip', name: 'Pareto front' },
      {
        type: 'scatter',
        x: dom.map((t) => t.results[xa]),
        y: dom.map((t) => t.results[ya]),
        customdata: dom.map((t) => t.id),
        mode: 'markers+text',
        text: dom.map((t) => (ctx.v.labels === 'none' ? '' : t.label)),
        textposition: 'top center',
        textfont: { family: MONO, size: 10, color: th.text3 },
        hoverinfo: 'none',
        marker: { size: 8, color: '#A3A8B3', opacity: dom.map((t) => (!anySel || ctx.selection.has(t.id) ? 1 : 0.25)), line: { width: 1, color: th.surface } },
      },
      {
        type: 'scatter',
        x: sorted.map((t) => t.results[xa]),
        y: sorted.map((t) => t.results[ya]),
        customdata: sorted.map((t) => t.id),
        mode: 'markers+text',
        text: sorted.map((t) => t.label + (t.id === ctx.bestId ? ' · Best' : '')),
        textposition: 'top center',
        textfont: { family: MONO, size: 10, color: BEST },
        hoverinfo: 'none',
        marker: { size: sorted.map((t) => (t.id === ctx.bestId ? 13 : 10)), color: BEST, line: { width: 1.5, color: '#fff' }, opacity: sorted.map((t) => (!anySel || ctx.selection.has(t.id) ? 1 : 0.3)) },
      },
    ];
    if (q && qx && qy)
      data.push({
        type: 'scatter',
        x: [qx.mean],
        y: [qy.mean],
        customdata: [q.id],
        mode: 'markers+text',
        text: ['Q'],
        textposition: 'top center',
        textfont: { family: MONO, size: 10, color: th.suggest },
        hoverinfo: 'none',
        error_x: qx.sd ? { type: 'data', array: [qx.sd], color: th.suggest, thickness: 1.2 } : undefined,
        error_y: qy.sd ? { type: 'data', array: [qy.sd], color: th.suggest, thickness: 1.2 } : undefined,
        marker: { size: 16, symbol: 'diamond-open', color: th.suggest, line: { width: 2, color: th.suggest } },
      });
    const arrowX = dirs[0] === 'minimize' ? '  ← better' : '  better →';
    const arrowY = dirs[1] === 'minimize' ? '  ↓ better' : '  ↑ better';
    return {
      data,
      layout: baseLayout(ctx, {
        xaxis: axis(ctx, xa, { range: xr, title: axisTitle(ctx, xa) + arrowX }),
        yaxis: axis(ctx, ya, { range: yr, title: axisTitle(ctx, ya) + arrowY }),
        margin: { l: 64, r: 24, t: 48, b: 56 },
        annotations: [
          { xref: 'paper', yref: 'paper', x: 0.99, y: 0.99, xanchor: 'right', yanchor: 'top', showarrow: false, align: 'right', text: `Hypervolume <b>${fmt(info.hv)}</b><br><span style="color:${th.text3}">ref = worst observed (${fmt(info.ref[0])}, ${fmt(info.ref[1])})</span>`, font: { family: MONO, size: 11, color: th.text2 }, bgcolor: hexA(th.surface, 0.8) },
          ...(sorted.length > 1 ? [{ x: sorted[Math.floor(sorted.length / 2)].results[xa], y: sorted[Math.floor(sorted.length / 2)].results[ya], text: 'Pareto front', showarrow: true, arrowcolor: BEST, ax: 40, ay: 30, font: { size: 10, color: BEST } }] : []),
        ],
        uirevision: `${ctx.key}:pareto:${xa}:${ya}`,
      }),
    };
  }, [ctx, info, xa, ya, dirs]);

  return (
    <PlotHost
      figure={figure}
      ariaLabel={trialsSummary(ctx, `Pareto front of ${ctx.name(ya)} against ${ctx.name(xa)}, ${info.front.length} non-dominated trials`)}
      onHover={(h) => {
        const t = info.rows.find((r) => r.id === h.id);
        const n = t ? info.dominatedCount.get(t) : undefined;
        act.hover({ ...h, extra: n !== undefined ? [`Dominates ${n} trial${n === 1 ? '' : 's'}`] : undefined });
      }}
      onUnhover={() => act.hover(null)}
      onClick={(id, e) => act.click(id, e)}
      onSelected={(ids) => act.select(ids)}
    />
  );
}
