import { useMemo, useRef } from 'react';
import type { Data } from '../plotTypes';
import { PlotHost, type Figure } from '../PlotHost';
import { BEST, fmt, GREYS, scaleFor } from '../traces/colorscales';
import { placeLabels, TEXTPOS } from '../traces/labels';
import type { ResultDef } from '../types';
import { axis, baseLayout, colorbar, hexA, MONO, paddedRange, toPixel, trialsSummary, type VizCtx } from './common';
import { useGrid } from './useGrid';
import { FittingOverlay } from './FittingOverlay';
import { ExtrapolatedNote } from './Surface';
import type { VizAct } from './act';

/** Contour: same semantics as Surface (Z = RESULT, SLICE holds the rest), gridded over the full visible axis range. */
export function Contour({ ctx, act, probe }: { ctx: VizCtx; act: VizAct; probe?: { x: number; y: number } | null }) {
  const { v } = ctx;
  const x = v.x!;
  const y = v.y!;
  const r = v.result!;
  const def = ctx.def(r) as ResultDef;
  const xr = useMemo(() => paddedRange(ctx.ds.trials.map((t) => t.params[x]).concat(ctx.suggestion ? [ctx.suggestion.params[x]] : []), 0.06), [ctx.ds, ctx.suggestion, x]);
  const yr = useMemo(() => paddedRange(ctx.ds.trials.map((t) => t.params[y]).concat(ctx.suggestion ? [ctx.suggestion.params[y]] : []), 0.06), [ctx.ds, ctx.suggestion, y]);
  const range = useMemo(() => ({ x: xr, y: yr }), [xr, yr]);
  const { grid, feasible, loading, error } = useGrid(ctx, { resultId: r, x, y, range, feasible: v.overlays.feasible });
  const last = useRef<Figure | null>(null);
  const lowConf = ctx.fit && ((ctx.fit.cvR2 !== null && ctx.fit.cvR2 < 0.5) || ctx.fit.trainedOn < 8);

  const figure = useMemo(() => {
    if (!grid) return last.current;
    const th = ctx.theme;
    const sc = scaleFor(v.colorscale, def);
    const zs = grid.mean.flat();
    const zmin = Math.min(...zs);
    const zmax = Math.max(...zs);
    const step = r === 'ph' ? 0.2 : niceStep((zmax - zmin) / 12);
    const data: Data[] = [
      {
        type: 'contour',
        x: grid.xs,
        y: grid.ys,
        z: grid.mean,
        colorscale: sc.colorscale,
        reversescale: sc.reversescale,
        ...(sc.cmid !== undefined ? { zmid: sc.cmid } : {}),
        opacity: lowConf ? 0.6 : 1,
        contours: { coloring: 'heatmap', showlabels: true, labelfont: { family: MONO, size: 10, color: 'rgba(14,17,22,.75)' }, start: Math.floor(zmin / step) * step, end: Math.ceil(zmax / step) * step, size: step },
        line: { color: 'rgba(14,17,22,.35)', width: 0.8 },
        colorbar: colorbar(ctx, r),
        hoverinfo: 'none',
        name: 'field',
      },
      // fade (not hide) the extrapolated area
      {
        type: 'heatmap',
        x: grid.xs,
        y: grid.ys,
        z: grid.extrapolated.map((row) => row.map((e) => (e ? 1 : 0))),
        colorscale: [
          [0, 'rgba(0,0,0,0)'],
          [1, hexA(th.surface, 0.55)],
        ],
        showscale: false,
        zsmooth: 'best',
        hoverinfo: 'skip',
        zmin: 0,
        zmax: 1,
      },
    ];
    if (v.overlays.sigma && grid.sd)
      data.push({ type: 'contour', x: grid.xs, y: grid.ys, z: grid.sd, colorscale: GREYS, showscale: false, contours: { coloring: 'none', showlabels: true, labelfont: { family: MONO, size: 9, color: th.text3 } }, line: { color: th.text3, width: 1, dash: 'dot' }, ncontours: 5, hoverinfo: 'skip' });
    if (v.overlays.isoline && def.target !== undefined && def.target > zmin && def.target < zmax)
      data.push({ type: 'contour', x: grid.xs, y: grid.ys, z: grid.mean, showscale: false, autocontour: false, contours: { coloring: 'none', start: def.target, end: def.target, size: 1, showlabels: true, labelfont: { family: MONO, size: 10, color: th.text } }, line: { color: th.text, width: 2.5, dash: 'dash' }, hoverinfo: 'skip' });
    if (v.overlays.feasible && feasible) {
      // hatch: short diagonal strokes in feasible cells, plus the region boundary
      const hx: (number | null)[] = [];
      const hy: (number | null)[] = [];
      const dx = (grid.xs[1] - grid.xs[0]) * 1.2;
      const dy = (grid.ys[1] - grid.ys[0]) * 1.2;
      feasible.forEach((row, i) => row.forEach((ok, j) => ok && (i + j) % 3 === 0 && (hx.push(grid.xs[j] - dx, grid.xs[j] + dx, null), hy.push(grid.ys[i] - dy, grid.ys[i] + dy, null))));
      data.push({ type: 'scatter', x: hx, y: hy, mode: 'lines', line: { color: hexA(th.pass, 0.55), width: 1 }, hoverinfo: 'skip' });
      data.push({ type: 'contour', x: grid.xs, y: grid.ys, z: feasible.map((row) => row.map((ok) => (ok ? 1 : 0))), showscale: false, autocontour: false, contours: { coloring: 'none', start: 0.5, end: 0.5, size: 1 }, line: { color: th.pass, width: 1.5 }, hoverinfo: 'skip' });
    }
    // trials: white circles with a dark outline and collision-avoided short labels
    if (v.showTrials) {
      const rows = ctx.visible.filter((t) => t.status !== 'failed').map((t) => ({ t, x: t.params[x], y: t.params[y] }));
      const main = rows.filter((q) => q.t.id !== ctx.bestId);
      const labelPos = new Map<string, string>();
      if (ctx.geom && v.labels !== 'none') {
        const px = toPixel(ctx.geom, xr, yr, false, false);
        placeLabels(rows.map((q) => ({ id: q.t.id, ...(({ px: X, py: Y }) => ({ x: X, y: Y }))(px(q.x, q.y)), text: q.t.label, priority: q.t.id === ctx.bestId ? 3 : 0 }))).forEach((pos, id) => pos && labelPos.set(id, TEXTPOS[pos]));
      }
      const anySel = ctx.selection.size > 0;
      data.push({
        type: 'scatter',
        ids: main.map((q) => q.t.id),
        x: main.map((q) => q.x),
        y: main.map((q) => q.y),
        customdata: main.map((q) => q.t.id),
        mode: 'markers+text',
        text: main.map((q) => (labelPos.has(q.t.id) ? q.t.label : '')),
        textposition: main.map((q) => labelPos.get(q.t.id) ?? 'top center'),
        textfont: { family: MONO, size: 10, color: '#0E1116' },
        hoverinfo: 'none',
        marker: {
          size: 9,
          color: main.map((q) => (q.t.status === 'pending' ? 'rgba(255,255,255,0.2)' : '#ffffff')),
          opacity: main.map((q) => (!anySel || ctx.selection.has(q.t.id) ? 1 : 0.35)),
          line: { width: main.map((q) => (ctx.selection.has(q.t.id) ? 2.5 : 1.5)), color: '#0E1116' },
          symbol: main.map((q) => (q.t.status === 'pending' ? 'circle-open' : 'circle')),
        },
      });
      const best = rows.find((q) => q.t.id === ctx.bestId);
      if (best && v.showBest)
        data.push({ type: 'scatter', x: [best.x], y: [best.y], customdata: [best.t.id], mode: 'markers+text', text: [`${best.t.label} · Best`], textposition: [labelPos.get(best.t.id) ?? 'top center'], textfont: { family: MONO, size: 10, color: BEST }, hoverinfo: 'none', marker: { size: 13, color: BEST, line: { width: 1.5, color: '#fff' } } });
    }
    const q = ctx.suggestion;
    if (q && v.showSuggestion)
      data.push({ type: 'scatter', x: [q.params[x]], y: [q.params[y]], customdata: [q.id], mode: 'markers+text', text: ['Q'], textposition: ['top center'], textfont: { family: MONO, size: 10, color: th.suggest }, hoverinfo: 'none', marker: { size: 16, symbol: 'diamond-open', color: th.suggest, line: { width: 2, color: th.suggest } } });
    if (probe) data.push({ type: 'scatter', x: [probe.x], y: [probe.y], mode: 'markers', hoverinfo: 'skip', marker: { size: 12, symbol: 'cross-thin-open', color: th.text, line: { width: 2, color: th.text } } });
    const hov = ctx.visible.find((t) => t.id === ctx.hovered);
    if (hov) data.push({ type: 'scatter', x: [hov.params[x]], y: [hov.params[y]], mode: 'markers', hoverinfo: 'skip', marker: { size: 20, color: 'rgba(0,0,0,0)', line: { width: 2, color: th.text } } });
    const annotations = [] as Record<string, unknown>[];
    if (v.overlays.isoline && def.target !== undefined) {
      // tag the dashed iso-line as "target" at the cell closest to the target value
      // tag the iso-line where it rings the peak: closest to the target value, preferring cells near the maximum
      let peak = { v: -Infinity, i: 0, j: 0 };
      grid.mean.forEach((row, i) => row.forEach((m, j) => m > peak.v && (peak = { v: m, i, j })));
      const n = grid.xs.length;
      let best = { d: Infinity, s: Infinity, i: 0, j: 0 };
      grid.mean.forEach((row, i) =>
        row.forEach((m, j) => {
          const d = Math.abs(m - def.target!);
          const s = d / step + Math.hypot(i - peak.i, j - peak.j) / n;
          if (d < step && s < best.s && !grid.extrapolated[i][j]) best = { d, s, i, j };
        }),
      );
      if (best.d < step) annotations.push({ x: grid.xs[best.j], y: grid.ys[best.i], text: `target ${fmt(def.target)}`, showarrow: false, yshift: 10, font: { family: MONO, size: 10, color: th.text }, bgcolor: hexA(th.surface, 0.8) });
    }
    const fig: Figure = {
      data,
      layout: baseLayout(ctx, {
        xaxis: { ...axis(ctx, x, { range: xr }), showgrid: false },
        yaxis: { ...axis(ctx, y, { range: yr }), showgrid: false },
        annotations,
        uirevision: `${ctx.key}:contour:${x}:${y}`,
      }),
    };
    last.current = fig;
    return fig;
  }, [grid, feasible, ctx, x, y, r, v, def, xr, yr, probe, lowConf]);

  return (
    <>
      {figure && (
        <PlotHost
          figure={figure}
          dimmed={loading && !!grid}
          ariaLabel={trialsSummary(ctx, `Contour map of ${ctx.name(r)} over ${ctx.name(x)} and ${ctx.name(y)}`)}
          onHover={(h) => act.hover(h)}
          onUnhover={() => act.hover(null)}
          onClick={(id, e, pt) => {
            if (id) return act.click(id, e);
            // click on the field (not a point): drop a probe
            if (pt && typeof pt.x === 'number' && typeof pt.y === 'number') act.probe(pt.x, pt.y);
          }}
          onSelected={(ids) => act.select(ids)}
        >
          {(geom) =>
            geom && (
              <>
                <button className="absolute h-6 -translate-x-1/2 rounded text-transparent hover:bg-accent-soft/60" style={{ left: geom.l + geom.w / 2, top: geom.t + geom.h + 26, width: Math.min(280, geom.w) }} onClick={() => act.openAxis('x')} aria-label="Change X axis" />
                <button className="absolute w-6 -translate-y-1/2 rounded text-transparent hover:bg-accent-soft/60" style={{ left: Math.max(0, geom.l - 60), top: geom.t + geom.h / 2, height: Math.min(220, geom.h) }} onClick={() => act.openAxis('y')} aria-label="Change Y axis" />
              </>
            )
          }
        </PlotHost>
      )}
      {(loading || error) && <FittingOverlay ctx={ctx} error={error} what="Fitting contours" />}
      {!loading && grid && <ExtrapolatedNote lowConf={!!lowConf} />}
    </>
  );
}

function niceStep(raw: number): number {
  const p = 10 ** Math.floor(Math.log10(Math.abs(raw) || 1));
  const m = raw / p;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
}
