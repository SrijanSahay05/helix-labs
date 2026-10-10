import { useMemo } from 'react';
import type { Data, Layout } from '../plotTypes';
import { PlotHost } from '../PlotHost';
import { BEST } from '../traces/colorscales';
import { middleEllipsis } from '../traces/labels';
import { baseLayout, colorbar, colorProps, hexA, MONO, paddedRange, trialsSummary, type VizCtx } from './common';
import type { VizAct } from './act';

/**
 * Scatter matrix: lower triangle of scatter cells, histograms on the diagonal. Built from explicit subplots
 * (Plotly's splom drops the diagonal when the upper half is hidden). Selection is linked across cells and views.
 */
export function Splom({ ctx, act, dims }: { ctx: VizCtx; act: VizAct; dims: string[] }) {
  const figure = useMemo(() => {
    const th = ctx.theme;
    const n = dims.length;
    const rows = ctx.visible.filter((t) => t.status === 'complete' && dims.every((d) => ctx.value(t, d) !== null));
    const colorId = ctx.v.colorBy;
    const cv = rows.map((t) => (colorId ? ctx.value(t, colorId) : null));
    const cprops = colorId ? colorProps(ctx, colorId, cv) : null;
    const anySel = ctx.selection.size > 0;
    const gap = 0.025;
    const size = (1 - gap * (n - 1)) / n;
    const dom = (k: number): [number, number] => [k * (size + gap), k * (size + gap) + size];
    const ranges = Object.fromEntries(dims.map((d) => [d, paddedRange(rows.map((t) => ctx.value(t, d) as number), 0.08)]));
    const data: Data[] = [];
    const layout: Layout = baseLayout(ctx, { margin: { l: 64, r: 96, t: 48, b: 56 }, dragmode: ctx.v.dragmode === 'lasso' ? 'lasso' : 'select', uirevision: `${ctx.key}:splom:${dims.join(',')}` });
    let k = 0;
    let colorbarShown = false;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j <= i; j++) {
        k++;
        const xa = `xaxis${k === 1 ? '' : k}`;
        const ya = `yaxis${k === 1 ? '' : k}`;
        const xr = `x${k === 1 ? '' : k}`;
        const yr = `y${k === 1 ? '' : k}`;
        const bottom = i === n - 1;
        const left = j === 0;
        const style = { gridcolor: hexA(th.line, 0.6), zerolinecolor: th.line, linecolor: th.line, tickfont: { family: MONO, size: 9, color: th.text3 }, automargin: true };
        layout[xa] = { ...style, domain: dom(j), anchor: yr, range: ranges[dims[j]], showticklabels: bottom, title: bottom ? { text: middleEllipsis(ctx.name(dims[j]), 18), font: { size: 11, color: th.text2 } } : undefined };
        if (i === j) {
          // diagonal: histogram of this dimension
          const vals = rows.map((t) => ctx.value(t, dims[i]) as number);
          const [lo, hi] = ranges[dims[i]];
          const bins = 8;
          const w = (hi - lo) / bins;
          const counts = new Array(bins).fill(0);
          vals.forEach((v) => counts[Math.min(bins - 1, Math.max(0, Math.floor((v - lo) / w)))]++);
          layout[ya] = { domain: dom(n - 1 - i), anchor: xr, range: [0, Math.max(...counts) * 1.15], showticklabels: false, showgrid: false, zeroline: false, title: left ? { text: middleEllipsis(ctx.name(dims[i]), 18), font: { size: 11, color: th.text2 } } : undefined, fixedrange: true };
          data.push({ type: 'bar', x: counts.map((_, b) => lo + w * (b + 0.5)), y: counts, width: w * 0.9, xaxis: xr, yaxis: yr, marker: { color: hexA(th.accent, 0.3) }, hoverinfo: 'skip' });
          continue;
        }
        layout[ya] = { ...style, domain: dom(n - 1 - i), anchor: xr, range: ranges[dims[i]], showticklabels: left, title: left ? { text: middleEllipsis(ctx.name(dims[i]), 18), font: { size: 11, color: th.text2 } } : undefined };
        data.push({
          type: 'scatter',
          xaxis: xr,
          yaxis: yr,
          x: rows.map((t) => ctx.value(t, dims[j])),
          y: rows.map((t) => ctx.value(t, dims[i])),
          customdata: rows.map((t) => t.id),
          mode: 'markers',
          hoverinfo: 'none',
          selectedpoints: anySel ? rows.map((t, r) => (ctx.selection.has(t.id) ? r : -1)).filter((r) => r >= 0) : null,
          selected: { marker: { opacity: 1 } },
          unselected: { marker: { opacity: 0.2 } },
          marker: {
            size: rows.map((t) => (t.id === ctx.bestId ? 10 : t.id === ctx.hovered ? 10 : 6)),
            color: rows.map((t, r) => (t.id === ctx.bestId && ctx.v.showBest ? BEST : (cv[r] ?? '#9aa0ab'))),
            ...(cprops ?? {}),
            showscale: !!colorId && !colorbarShown,
            ...(colorId && !colorbarShown ? { colorbar: colorbar(ctx, colorId) } : {}),
            line: { width: rows.map((t) => (t.id === ctx.hovered ? 2 : 0.5)), color: rows.map((t) => (t.id === ctx.hovered ? th.text : th.surface)) },
          },
        });
        colorbarShown = true;
      }
    }
    return { data, layout };
  }, [ctx, dims]);

  return (
    <PlotHost
      figure={figure}
      ariaLabel={trialsSummary(ctx, `Scatter matrix of ${dims.map((d) => ctx.name(d)).join(', ')}`)}
      onHover={(h) => act.hover(h)}
      onUnhover={() => act.hover(null)}
      onClick={(id, e) => act.click(id, e)}
      onSelected={(ids) => act.select(ids)}
    />
  );
}
