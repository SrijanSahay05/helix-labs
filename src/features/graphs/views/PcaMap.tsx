import { useEffect, useMemo, useRef, useState } from 'react';
import type { Data } from '../plotTypes';
import { PlotHost } from '../PlotHost';
import { ensureDataset, latest, model } from '../modelClient';
import type { PcaResult } from '../model/engine';
import { BEST } from '../traces/colorscales';
import { middleEllipsis } from '../traces/labels';
import { baseLayout, colorbar, colorProps, hexA, MONO, paddedRange, trialsSummary, type VizCtx } from './common';
import type { VizAct } from './act';
import { FittingOverlay } from './FittingOverlay';

/** Similarity map: all varying parameters (z-scored) projected to 2D with PCA; loadings arrows show what drives each axis. */
export function PcaMap({ ctx, act, onTraits }: { ctx: VizCtx; act: VizAct; onTraits: (ids: string[]) => void }) {
  const [pca, setPca] = useState<PcaResult | null>(null);
  const [error, setError] = useState<string>();
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;
  const qParams = ctx.suggestion?.params;
  useEffect(() => {
    let alive = true;
    void latest('pca', async () => {
      await ensureDataset(ctxRef.current.ds);
      return model().pca(qParams ? [qParams] : undefined);
    })
      .then((r) => alive && r && setPca(r))
      .catch((e: unknown) => alive && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      alive = false;
    };
  }, [ctx.ds, qParams]);

  const figure = useMemo(() => {
    if (!pca) return null;
    const th = ctx.theme;
    const rows = ctx.visible.filter((t) => pca.coords[t.id]);
    const colorId = ctx.v.colorBy;
    const cv = rows.map((t) => (colorId ? ctx.value(t, colorId) : null));
    const xs = Object.values(pca.coords).map((c) => c[0]);
    const ys = Object.values(pca.coords).map((c) => c[1]);
    const anySel = ctx.selection.size > 0;
    const data: Data[] = [
      {
        type: 'scatter',
        x: rows.map((t) => pca.coords[t.id][0]),
        y: rows.map((t) => pca.coords[t.id][1]),
        customdata: rows.map((t) => t.id),
        mode: ctx.v.labels === 'none' ? 'markers' : 'markers+text',
        text: rows.map((t) => t.label),
        textposition: 'top center',
        textfont: { family: MONO, size: 10, color: th.text2 },
        hoverinfo: 'none',
        marker: {
          size: rows.map((t) => (t.id === ctx.bestId ? 14 : 9)),
          symbol: rows.map((t) => (t.status === 'pending' ? 'circle-open' : 'circle')),
          color: rows.map((t, i) => (t.id === ctx.bestId ? BEST : (cv[i] ?? '#9aa0ab'))),
          ...(colorId ? colorProps(ctx, colorId, cv) : {}),
          showscale: !!colorId,
          ...(colorId ? { colorbar: colorbar(ctx, colorId) } : {}),
          opacity: rows.map((t) => (!anySel || ctx.selection.has(t.id) ? 1 : 0.25)),
          line: { width: rows.map((t) => (ctx.selection.has(t.id) ? 2 : 1)), color: rows.map((t) => (ctx.selection.has(t.id) ? th.text : th.surface)) },
        },
      },
    ];
    const q = ctx.v.showSuggestion && ctx.suggestion && pca.coords.__extra0;
    if (q) data.push({ type: 'scatter', x: [q[0]], y: [q[1]], customdata: [ctx.suggestion!.id], mode: 'markers+text', text: ['Q'], textposition: 'top center', textfont: { family: MONO, size: 10, color: th.suggest }, hoverinfo: 'none', marker: { size: 16, symbol: 'diamond-open', color: th.suggest, line: { width: 2, color: th.suggest } } });
    const span = Math.max(...xs.map(Math.abs), ...ys.map(Math.abs)) || 1;
    const top = [...pca.loadings].sort((a, b) => Math.hypot(b.pc1, b.pc2) - Math.hypot(a.pc1, a.pc2)).slice(0, 6);
    const annotations = ctx.v.overlays.loadings
      ? // Plotly draws annotation text at the arrow's tail: tail at the loading tip, head-side at the tip too (arrowside start)
        top.map((l) => ({ x: 0, y: 0, ax: l.pc1 * span * 0.9, ay: l.pc2 * span * 0.9, axref: 'x', ayref: 'y', showarrow: true, arrowside: 'start', arrowhead: 2, arrowsize: 1, arrowwidth: 1.2, startstandoff: 6, arrowcolor: hexA(th.text2, 0.7), text: middleEllipsis(ctx.name(l.paramId), 18), font: { size: 10, color: th.text2 }, bgcolor: hexA(th.surface, 0.75) }))
      : [];
    return {
      data,
      layout: baseLayout(ctx, {
        xaxis: { title: { text: `PC1 (${Math.round(pca.explained[0] * 100)} %)`, font: { size: 12, color: th.text2 } }, range: paddedRange(xs, 0.12), gridcolor: hexA(th.line, 0.6), zerolinecolor: th.line, tickfont: { family: MONO, size: 11, color: th.text3 } },
        yaxis: { title: { text: `PC2 (${Math.round(pca.explained[1] * 100)} %)`, font: { size: 12, color: th.text2 } }, range: paddedRange(ys, 0.12), gridcolor: hexA(th.line, 0.6), zerolinecolor: th.line, tickfont: { family: MONO, size: 11, color: th.text3 } },
        annotations,
        uirevision: `${ctx.key}:pca`,
      }),
    };
  }, [pca, ctx]);

  return (
    <>
      {figure && (
        <PlotHost
          figure={figure}
          ariaLabel={trialsSummary(ctx, `Similarity map (PCA) of ${ctx.params.length} parameters`)}
          onHover={(h) => act.hover(h)}
          onUnhover={() => act.hover(null)}
          onClick={(id, e) => act.click(id, e)}
          onSelected={(ids) => {
            act.select(ids);
            if (ids && ids.length >= 2) onTraits(ids);
          }}
        />
      )}
      {(!pca || error) && <FittingOverlay ctx={ctx} error={error} what="Projecting recipes" />}
    </>
  );
}
