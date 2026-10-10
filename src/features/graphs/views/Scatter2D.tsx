import { useEffect, useMemo, useRef, useState } from 'react';
import type { Data, Layout } from '../plotTypes';
import { PlotHost } from '../PlotHost';
import { ensureDataset, latest, model } from '../modelClient';
import { fmt } from '../traces/colorscales';
import { axis, axisTitle, baseLayout, hexA, MONO, paddedRange, pointTraces, trialsSummary, type VizCtx } from './common';
import type { VizAct } from './act';
import type { ResultDef } from '../types';

function ols(xs: number[], ys: number[]) {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
    syy += (ys[i] - my) ** 2;
  }
  const b = sxy / (sxx || 1);
  return { a: my - b * mx, b, r2: syy ? (sxy * sxy) / (sxx * syy || 1) : 0 };
}

function histogram(vals: number[], bins = 12, range?: [number, number]) {
  const lo = range?.[0] ?? Math.min(...vals);
  const hi = range?.[1] ?? Math.max(...vals);
  const w = (hi - lo) / bins || 1;
  const counts = new Array(bins).fill(0);
  for (const v of vals) counts[Math.min(bins - 1, Math.max(0, Math.floor((v - lo) / w)))]++;
  return { centers: counts.map((_, i) => lo + w * (i + 0.5)), counts, w };
}

/** 2D Scatter (and Bubble, with SIZE BY mapped to a second result). */
export function Scatter2D({ ctx, act, bubble, intro }: { ctx: VizCtx; act: VizAct; bubble?: boolean; intro?: number }) {
  const { v } = ctx;
  const xId = v.x!;
  const yId = v.y!;
  const colorId = v.colorBy;
  const sizeId = bubble ? v.sizeBy ?? undefined : v.sizeBy ?? undefined;
  const yDef = ctx.isResult(yId) ? (ctx.def(yId) as ResultDef) : undefined;

  // model band: surrogate prediction of Y along X with the slice held (Y a result, X a parameter)
  const [band, setBand] = useState<{ xs: number[]; mean: number[]; sd: (number | null)[] } | null>(null);
  const wantBand = v.overlays.band && !!yDef && !ctx.isResult(xId);
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;
  const sliceKey = JSON.stringify(v.slice);
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!wantBand) return void setBand(null);
    let alive = true;
    const xs = (() => {
      const vals = ctx.ds.trials.map((t) => ctx.value(t, xId)).filter((x): x is number => x !== null);
      const lo = Math.min(...vals);
      const hi = Math.max(...vals);
      return Array.from({ length: 60 }, (_, i) => lo + ((hi - lo) * i) / 59);
    })();
    const base = ctx.ds.trials.find((t) => t.id === ctx.bestId)?.params ?? {};
    void latest('band', async () => {
      await ensureDataset(ctx.ds);
      return model().predictPoints(yId, xs.map((x) => ({ ...base, ...ctx.v.slice, [xId]: x })));
    }).then((r) => alive && r && setBand({ xs, mean: r.map((p) => p.mean), sd: r.map((p) => p.sd) }));
    return () => {
      alive = false;
    };
  }, [wantBand, xId, yId, ctx.ds, ctx.bestId, sliceKey]);

  const prevAxes = useRef(`${xId}|${yId}`);
  const figure = useMemo(() => {
    const vals = (id: string) => ctx.visible.map((t) => ctx.value(t, id)).filter((x): x is number => x !== null);
    const qx = ctx.suggestion ? ctx.qValue(ctx.suggestion, xId).v : null;
    const qy = ctx.suggestion ? ctx.qValue(ctx.suggestion, yId).v : null;
    const xr = paddedRange([...vals(xId), ...(qx !== null ? [qx] : [])], 0.06, v.logX);
    const yr = paddedRange([...vals(yId), ...(qy !== null ? [qy] : []), ...(yDef?.target !== undefined && v.overlays.target ? [yDef.target - (yDef.tolerance ?? 0), yDef.target + (yDef.tolerance ?? 0)] : [])], 0.08, v.logY);
    const marg = v.overlays.marginals;
    const xDom: [number, number] = marg ? [0, 0.86] : [0, 1];
    const yDom: [number, number] = marg ? [0, 0.86] : [0, 1];

    let sizes: Map<string, number> | undefined;
    if (sizeId) {
      const sv = ctx.visible.map((t) => ctx.value(t, sizeId)).filter((x): x is number => x !== null);
      const lo = Math.min(...sv);
      const hi = Math.max(...sv);
      // area-proportional, 6–28 px
      sizes = new Map(ctx.visible.map((t) => {
        const s = ctx.value(t, sizeId);
        const k = s === null ? 0 : (s - lo) / (hi - lo || 1);
        return [t.id, Math.sqrt(36 + k * (28 * 28 - 36))];
      }));
    }
    const data: Data[] = [];
    const shapes: Partial<Layout>['shapes'] = [];
    const annotations: Partial<Layout>['annotations'] = [];

    if (yDef?.target !== undefined && v.overlays.target) {
      const tol = yDef.tolerance ?? 0;
      if (tol) shapes.push({ type: 'rect', xref: 'paper', yref: 'y', x0: 0, x1: marg ? 0.86 : 1, y0: yDef.target - tol, y1: yDef.target + tol, fillcolor: hexA(ctx.theme.pass, 0.08), line: { width: 0 }, layer: 'below' });
      shapes.push({ type: 'line', xref: 'paper', yref: 'y', x0: 0, x1: marg ? 0.86 : 1, y0: yDef.target, y1: yDef.target, line: { color: hexA(ctx.theme.pass, 0.6), width: 1, dash: 'dash' }, layer: 'below' });
      annotations.push({ xref: 'paper', yref: 'y', x: 0.005, y: yDef.target + tol, text: 'Target', showarrow: false, xanchor: 'left', yanchor: 'bottom', font: { size: 10, color: ctx.theme.pass } });
    }
    if (band) {
      const up = band.mean.map((m, i) => m + 2 * (band.sd[i] ?? 0));
      const lo = band.mean.map((m, i) => m - 2 * (band.sd[i] ?? 0));
      data.push({ type: 'scatter', x: [...band.xs, ...band.xs.slice().reverse()], y: [...up, ...lo.reverse()], fill: 'toself', fillcolor: hexA(ctx.theme.accent, 0.12), line: { width: 0 }, hoverinfo: 'skip', mode: 'lines' } as Data);
      data.push({ type: 'scatter', x: band.xs, y: band.mean, mode: 'lines', line: { color: hexA(ctx.theme.accent, 0.8), width: 1.5 }, hoverinfo: 'skip' } as Data);
    }
    if (v.overlays.trend) {
      const pts = ctx.visible.filter((t) => t.status === 'complete').map((t) => [ctx.value(t, xId), ctx.value(t, yId)]).filter((p): p is [number, number] => p[0] !== null && p[1] !== null);
      if (pts.length > 2) {
        const f = ols(pts.map((p) => p[0]), pts.map((p) => p[1]));
        const xs = [Math.min(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[0]))];
        data.push({ type: 'scatter', x: xs, y: xs.map((x) => f.a + f.b * x), mode: 'lines', line: { color: ctx.theme.text3, width: 1.2, dash: 'dot' }, hoverinfo: 'skip' } as Data);
        annotations.push({ xref: 'paper', yref: 'paper', x: marg ? 0.855 : 0.995, y: marg ? 0.855 : 0.99, xanchor: 'right', yanchor: 'top', showarrow: false, text: `OLS  R² = ${f.r2.toFixed(2)}`, font: { family: MONO, size: 11, color: ctx.theme.text2 } });
      }
    }
    data.push(...pointTraces(ctx, xId, yId, colorId, { xr, yr, sizes, intro }));
    if (marg) {
      const hx = histogram(vals(xId), 14);
      const hy = histogram(vals(yId), 14);
      data.push({ type: 'bar', x: hx.centers, y: hx.counts, width: hx.w * 0.9, xaxis: 'x', yaxis: 'y2', marker: { color: hexA(ctx.theme.text3, 0.35) }, hoverinfo: 'skip' } as Data);
      data.push({ type: 'bar', y: hy.centers, x: hy.counts, width: hy.w * 0.9, orientation: 'h', xaxis: 'x2', yaxis: 'y', marker: { color: hexA(ctx.theme.text3, 0.35) }, hoverinfo: 'skip' } as Data);
    }
    const changed = prevAxes.current !== `${xId}|${yId}`;
    prevAxes.current = `${xId}|${yId}`;
    const animate = changed && !ctx.reduced && ctx.visible.length <= 500;
    const layout = baseLayout(ctx, {
      xaxis: axis(ctx, xId, { log: v.logX, range: xr, domain: xDom }) as Layout['xaxis'],
      yaxis: axis(ctx, yId, { log: v.logY, range: yr, domain: yDom }) as Layout['yaxis'],
      ...(marg
        ? {
            xaxis2: { domain: [0.88, 1], showgrid: false, showticklabels: false, zeroline: false, fixedrange: true } as Layout['xaxis'],
            yaxis2: { domain: [0.88, 1], showgrid: false, showticklabels: false, zeroline: false, fixedrange: true } as Layout['yaxis'],
          }
        : {}),
      shapes,
      annotations,
      bargap: 0.05,
      ...(animate ? { transition: { duration: 450, easing: 'cubic-in-out' } } : {}),
      uirevision: `${ctx.key}:${xId}:${yId}:${v.logX}:${v.logY}`,
    });
    return { data, layout };
  }, [ctx, xId, yId, colorId, sizeId, yDef, band, intro, v.logX, v.logY, v.overlays]);

  const sizeLegend = useMemo(() => {
    if (!sizeId) return null;
    const sv = ctx.visible.map((t) => ctx.value(t, sizeId)).filter((x): x is number => x !== null);
    if (!sv.length) return null;
    const lo = Math.min(...sv);
    const hi = Math.max(...sv);
    return [lo, (lo + hi) / 2, hi].map((val, i) => ({ val, px: Math.sqrt(36 + (i / 2) * (28 * 28 - 36)) }));
  }, [ctx, sizeId]);

  return (
    <PlotHost
      figure={figure}
      ariaLabel={trialsSummary(ctx, `${bubble ? 'Bubble' : '2D'} scatter of ${ctx.name(yId)} against ${ctx.name(xId)}${sizeId ? `, sized by ${ctx.name(sizeId)}` : ''}`)}
      onHover={(h) => act.hover(h)}
      onUnhover={() => act.hover(null)}
      onClick={(id, e) => act.click(id, e)}
      onSelected={(ids) => act.select(ids)}
      onGeom={() => {}}
      dimmed={false}
    >
      {(geom) => (
        <>
          {geom && (
            <>
              <button className="absolute h-6 -translate-x-1/2 rounded px-2 text-[12px] text-transparent hover:bg-accent-soft/60" style={{ left: geom.l + geom.w / 2, top: geom.t + geom.h + 26, width: Math.min(280, geom.w) }} onClick={() => act.openAxis('x')} title={`Change X axis (${axisTitle(ctx, xId)})`} aria-label="Change X axis" />
              <button className="absolute w-6 -translate-y-1/2 rounded py-2 text-transparent hover:bg-accent-soft/60" style={{ left: Math.max(0, geom.l - 60), top: geom.t + geom.h / 2, height: Math.min(220, geom.h) }} onClick={() => act.openAxis('y')} title={`Change Y axis (${axisTitle(ctx, yId)})`} aria-label="Change Y axis" />
            </>
          )}
          {sizeLegend && geom && (
            <div className="pointer-events-none absolute flex items-end gap-2 rounded-md bg-surface/80 px-2 py-1 text-[10px] text-ink2" style={{ left: geom.l + 8, top: geom.t + 6 }}>
              <span className="self-center">{ctx.name(sizeId!)}</span>
              {sizeLegend.map((s, i) => (
                <span key={i} className="flex flex-col items-center gap-0.5">
                  <span className="rounded-full border border-ink3" style={{ width: s.px, height: s.px }} />
                  <span className="mono">{fmt(s.val)}</span>
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </PlotHost>
  );
}
