import { useEffect, useMemo, useRef, useState } from 'react';
import type { Data } from '../plotTypes';
import { PlotHost } from '../PlotHost';
import { ensureDataset, latest, model } from '../modelClient';
import { BEST, fmt, scaleFor } from '../traces/colorscales';
import { middleEllipsis } from '../traces/labels';
import type { ResultDef } from '../types';
import { baseLayout, colorbar, colorProps, hexA, MONO, trialsSummary, type VizCtx } from './common';
import type { VizAct } from './act';

/** Ternary composition of three ingredients renormalised to their own sum, with an optional surrogate underlay. */
export function Ternary({ ctx, act, comps, underlay }: { ctx: VizCtx; act: VizAct; comps: [string, string, string]; underlay: boolean }) {
  const colorId = ctx.v.colorBy ?? ctx.ds.results[0].id;
  const [mesh, setMesh] = useState<{ a: number[]; b: number[]; c: number[]; v: number[] } | null>(null);
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;
  useEffect(() => {
    if (!underlay || !ctx.isResult(colorId)) return void setMesh(null);
    let alive = true;
    void latest('ternary', async () => {
      await ensureDataset(ctxRef.current.ds);
      return model().ternaryGrid(colorId, comps, 22);
    })
      .then((m) => alive && m && setMesh(m))
      .catch(() => alive && setMesh(null));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [underlay, colorId, comps.join(','), ctx.ds]);

  const figure = useMemo(() => {
    const th = ctx.theme;
    const rows = ctx.visible.filter((t) => t.status !== 'failed');
    const frac = (p: Record<string, number>) => {
      const s = comps.reduce((a, c) => a + (p[c] ?? 0), 0) || 1;
      return comps.map((c) => (p[c] ?? 0) / s) as [number, number, number];
    };
    const cv = rows.map((t) => ctx.value(t, colorId));
    const def = ctx.def(colorId) as ResultDef | undefined;
    const sc = scaleFor(ctx.v.colorscale, ctx.isResult(colorId) ? def : undefined);
    const anySel = ctx.selection.size > 0;
    const data: Data[] = [];
    if (mesh) data.push({ type: 'scatterternary', a: mesh.a, b: mesh.b, c: mesh.c, mode: 'markers', hoverinfo: 'skip', marker: { symbol: 'triangle-up', size: 11, color: mesh.v, colorscale: sc.colorscale, reversescale: sc.reversescale, opacity: 0.45, line: { width: 0 } } });
    const fr = rows.map((t) => frac(t.params));
    data.push({
      type: 'scatterternary',
      a: fr.map((f) => f[0]),
      b: fr.map((f) => f[1]),
      c: fr.map((f) => f[2]),
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
        ...colorProps(ctx, colorId, cv),
        showscale: true,
        colorbar: colorbar(ctx, colorId),
        opacity: rows.map((t) => (!anySel || ctx.selection.has(t.id) ? 1 : 0.25)),
        line: { width: 1, color: th.surface },
      },
    });
    const q = ctx.v.showSuggestion ? ctx.suggestion : null;
    if (q) {
      const f = frac(q.params);
      data.push({ type: 'scatterternary', a: [f[0]], b: [f[1]], c: [f[2]], customdata: [q.id], mode: 'markers+text', text: ['Q'], textposition: 'top center', textfont: { family: MONO, size: 10, color: th.suggest }, hoverinfo: 'none', marker: { size: 16, symbol: 'diamond-open', color: th.suggest, line: { width: 2, color: th.suggest } } });
    }
    const ax = (id: string) => ({ title: { text: middleEllipsis(ctx.name(id), 24), font: { size: 11, color: th.text2 } }, tickfont: { family: MONO, size: 9, color: th.text3 }, gridcolor: hexA(th.line, 0.7), linecolor: th.line, tickformat: '.0%' });
    return {
      data,
      layout: baseLayout(ctx, { ternary: { sum: 1, aaxis: ax(comps[0]), baxis: ax(comps[1]), caxis: ax(comps[2]), bgcolor: 'rgba(0,0,0,0)' }, margin: { l: 60, r: 110, t: 64, b: 50 }, uirevision: `${ctx.key}:ternary` }),
    };
  }, [ctx, comps, colorId, mesh]);

  return (
    <>
      <PlotHost
        figure={figure}
        ariaLabel={trialsSummary(ctx, `Ternary composition of ${comps.map((c) => ctx.name(c)).join(', ')}`)}
        onHover={(h) => {
          const t = ctx.ds.trials.find((x) => x.id === h.id);
          const p = t?.params ?? (ctx.suggestion?.id === h.id ? ctx.suggestion.params : undefined);
          if (!p) return act.hover(h);
          const s = comps.reduce((a, c) => a + p[c], 0);
          act.hover({ ...h, extra: comps.map((c) => `${middleEllipsis(ctx.name(c), 22)}: ${((p[c] / s) * 100).toFixed(1)} % (true ${fmt(p[c])} % w/w)`) });
        }}
        onUnhover={() => act.hover(null)}
        onClick={(id, e) => act.click(id, e)}
        onSelected={(ids) => act.select(ids)}
      />
      <p className="pointer-events-none absolute bottom-1 left-2 text-[10px] text-ink3">Renormalised to the 3 selected components (other ingredients excluded)</p>
    </>
  );
}
