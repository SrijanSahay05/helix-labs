import { useEffect, useMemo, useRef, useState } from 'react';
import type { Data } from '../plotTypes';
import { PlotHost } from '../PlotHost';
import { ensureDataset, latest, model } from '../modelClient';
import { BEST, fmt } from '../traces/colorscales';
import { useGraphsRuntime } from '../store';
import { axisTitle, baseLayout, axis, hexA, MONO, paddedRange, trialsSummary, type VizCtx } from './common';
import { FittingOverlay } from './FittingOverlay';
import type { VizAct } from './act';

type Row = { id: string; measured: number; predicted: number; sd: number | null };

/** "Can I trust the model?" — leave-one-out predicted vs measured, y = x, ±10 % band, R² (LOO), RMSE, n. */
export function Parity({ ctx, act, resultId }: { ctx: VizCtx; act: VizAct; resultId: string }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string>();
  const retry = useGraphsRuntime((s) => s.retry);
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;
  useEffect(() => {
    let alive = true;
    setError(undefined);
    void latest('parity', async () => {
      await ensureDataset(ctxRef.current.ds);
      return model().looPredictions(resultId);
    })
      .then((r) => alive && r && setRows(r))
      .catch((e: unknown) => alive && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      alive = false;
    };
  }, [resultId, ctx.ds, retry]);

  const stats = useMemo(() => {
    if (!rows?.length) return null;
    const m = rows.reduce((a, r) => a + r.measured, 0) / rows.length;
    const ssRes = rows.reduce((a, r) => a + (r.measured - r.predicted) ** 2, 0);
    const ssTot = rows.reduce((a, r) => a + (r.measured - m) ** 2, 0) || 1;
    const outliers = rows.filter((r) => Math.abs(r.predicted - r.measured) > Math.max(0.1 * Math.abs(r.measured), 2 * (r.sd ?? 0)));
    return { r2: 1 - ssRes / ssTot, rmse: Math.sqrt(ssRes / rows.length), n: rows.length, outliers };
  }, [rows]);

  const figure = useMemo(() => {
    if (!rows) return null;
    const th = ctx.theme;
    const all = rows.flatMap((r) => [r.measured, r.predicted]);
    const rg = paddedRange(all, 0.08);
    const line = [rg[0], rg[1]];
    const anySel = ctx.selection.size > 0;
    const data: Data[] = [
      { type: 'scatter', x: [...line, ...line.slice().reverse()], y: [line[0] * 1.1, line[1] * 1.1, line[1] * 0.9, line[0] * 0.9], fill: 'toself', fillcolor: hexA(th.accent, 0.07), line: { width: 0 }, hoverinfo: 'skip', mode: 'lines' },
      { type: 'scatter', x: line, y: line, mode: 'lines', line: { color: th.text3, width: 1, dash: 'dash' }, hoverinfo: 'skip' },
      {
        type: 'scatter',
        x: rows.map((r) => r.measured),
        y: rows.map((r) => r.predicted),
        customdata: rows.map((r) => r.id),
        mode: 'markers+text',
        text: rows.map((r) => (ctx.v.labels === 'none' ? '' : r.id)),
        textposition: 'top center',
        textfont: { family: MONO, size: 10, color: th.text2 },
        hoverinfo: 'none',
        error_y: { type: 'data', array: rows.map((r) => r.sd ?? 0), color: hexA(th.text3, 0.6), thickness: 1, width: 3 },
        marker: { size: 9, color: rows.map((r) => (r.id === ctx.bestId ? BEST : th.accent)), opacity: rows.map((r) => (!anySel || ctx.selection.has(r.id) ? 1 : 0.25)), line: { width: 1, color: th.surface } },
      },
    ];
    return {
      data,
      layout: baseLayout(ctx, {
        xaxis: axis(ctx, resultId, { range: rg, title: `Measured ${axisTitle(ctx, resultId)}` }),
        yaxis: axis(ctx, resultId, { range: rg, title: `Predicted (LOO) ${axisTitle(ctx, resultId)}` }),
        margin: { l: 70, r: 24, t: 48, b: 56 },
        annotations: stats
          ? [{ xref: 'paper', yref: 'paper', x: 0.98, y: 0.03, xanchor: 'right', yanchor: 'bottom', showarrow: false, align: 'right', text: `R² (LOO) <b>${stats.r2.toFixed(2)}</b><br>RMSE <b>${fmt(stats.rmse)}</b><br>n <b>${stats.n}</b>`, font: { family: MONO, size: 11, color: th.text2 }, bgcolor: hexA(th.surface, 0.85) }]
          : [],
        uirevision: `${ctx.key}:parity:${resultId}`,
      }),
    };
  }, [rows, ctx, resultId, stats]);

  return (
    <>
      {figure && (
        <PlotHost
          figure={figure}
          ariaLabel={`Predicted versus measured ${ctx.name(resultId)} (leave-one-out)${stats ? `, R² ${stats.r2.toFixed(2)}, RMSE ${fmt(stats.rmse)}, n ${stats.n}` : ''}. ${trialsSummary(ctx, '')}`}
          onHover={(h) => {
            const r = rows?.find((x) => x.id === h.id);
            act.hover({ ...h, extra: r ? [`Measured ${fmt(r.measured)} · predicted ${fmt(r.predicted)}${r.sd ? ` ± ${fmt(r.sd)}` : ''}`] : undefined });
          }}
          onUnhover={() => act.hover(null)}
          onClick={(id, e) => act.click(id, e)}
          onSelected={(ids) => act.select(ids)}
        />
      )}
      {stats && stats.outliers.length > 0 && (
        <div className="absolute right-3 top-3 flex max-w-[50%] flex-wrap justify-end gap-1">
          {stats.outliers.slice(0, 4).map((o) => (
            <button key={o.id} onClick={() => act.click(o.id)} className="rounded-full border border-borderline/40 bg-[var(--borderline-soft)] px-2 py-0.5 text-2xs font-medium text-borderline">
              {o.id} · Outlier? ({o.predicted - o.measured > 0 ? '+' : ''}
              {fmt(o.predicted - o.measured)})
            </button>
          ))}
        </div>
      )}
      {(!rows || error) && <FittingOverlay ctx={ctx} error={error} what="Cross-validating" />}
    </>
  );
}
