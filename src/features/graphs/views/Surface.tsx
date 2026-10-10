import { useMemo, useRef } from 'react';
import type { Data } from '../plotTypes';
import { PlotHost, type Figure } from '../PlotHost';
import { BEST, GREYS, scaleFor } from '../traces/colorscales';
import type { Camera3D } from '../store';
import type { ResultDef } from '../types';
import { colorbar, hexA, MONO, trialsSummary, type VizCtx } from './common';
import { scene } from './Scatter3D';
import { useGrid } from './useGrid';
import { FittingOverlay } from './FittingOverlay';
import type { VizAct } from './act';

/** Grow a boolean mask by one cell so the in-range and extrapolated surfaces overlap without gaps. */
function dilate(m: boolean[][]): boolean[][] {
  return m.map((row, i) => row.map((v, j) => v || [-1, 0, 1].some((di) => [-1, 0, 1].some((dj) => m[i + di]?.[j + dj]))));
}

/** Surface: Z is always the modelled RESULT; other parameters are held at their SLICE values. */
export function Surface({ ctx, act }: { ctx: VizCtx; act: VizAct }) {
  const { v } = ctx;
  const x = v.x!;
  const y = v.y!;
  const r = v.result!;
  const { grid, trialZ, loading, error } = useGrid(ctx, { resultId: r, x, y });
  const last = useRef<Figure | null>(null);
  const def = ctx.def(r) as ResultDef;
  const lowConf = ctx.fit && ((ctx.fit.cvR2 !== null && ctx.fit.cvR2 < 0.5) || ctx.fit.trainedOn < 8);

  const figure = useMemo(() => {
    if (!grid) return last.current;
    const th = ctx.theme;
    const sc = scaleFor(v.colorscale, def);
    const base = lowConf ? 0.6 : 1;
    const inside = dilate(grid.extrapolated.map((row) => row.map((e) => !e)));
    const z = grid.mean;
    const zIn = z.map((row, i) => row.map((val, j) => (inside[i][j] ? val : NaN)));
    const colorBySd = v.showUncertainty === 'color' && grid.sd;
    const common = {
      type: 'surface',
      x: grid.xs,
      y: grid.ys,
      colorscale: colorBySd ? GREYS : sc.colorscale,
      reversescale: colorBySd ? false : sc.reversescale,
      ...(sc.cmid !== undefined && !colorBySd ? { cmid: sc.cmid } : {}),
      hoverinfo: 'none',
      ...(colorBySd ? { surfacecolor: grid.sd } : {}),
    };
    const data: Data[] = [
      // faded = extrapolated (farther than 0.25 normalised from any trial)
      { ...common, z, opacity: 0.35 * v.surfaceOpacity * base, showscale: false, contours: { z: { show: v.floorContours, project: { z: true }, usecolormap: true, width: 1 } } },
      { ...common, z: zIn, opacity: v.surfaceOpacity * base, showscale: true, colorbar: { ...colorbar(ctx, r, 0.98), title: { text: colorBySd ? `σ ${ctx.name(r)}` : ctx.name(r), side: 'right', font: { size: 11, color: th.text2 } } } },
    ];
    if (v.showUncertainty === 'band' && grid.sd) {
      const up = z.map((row, i) => row.map((m, j) => m + 2 * grid.sd![i][j]));
      const lo = z.map((row, i) => row.map((m, j) => m - 2 * grid.sd![i][j]));
      for (const zz of [up, lo]) data.push({ ...common, z: zz, opacity: 0.18, showscale: false, hoverinfo: 'skip' });
    }
    if (v.showTrials) {
      const rows = ctx.visible.filter((t) => t.status === 'complete' && t.results[r] !== null).map((t) => ({ t, x: t.params[x], y: t.params[y], z: t.results[r] as number }));
      // thin stems from each trial to the surface show the residual
      const sx: (number | null)[] = [];
      const sy: (number | null)[] = [];
      const sz: (number | null)[] = [];
      for (const row of rows) if (trialZ[row.t.id] !== undefined) sx.push(row.x, row.x, null), sy.push(row.y, row.y, null), sz.push(row.z, trialZ[row.t.id], null);
      data.push({ type: 'scatter3d', mode: 'lines', x: sx, y: sy, z: sz, line: { color: hexA(th.text, 0.4), width: 1.5 }, hoverinfo: 'skip' });
      const main = rows.filter((row) => row.t.id !== ctx.bestId);
      data.push({
        type: 'scatter3d',
        mode: 'markers+text',
        x: main.map((q) => q.x),
        y: main.map((q) => q.y),
        z: main.map((q) => q.z),
        customdata: main.map((q) => q.t.id),
        text: main.map((q) => (ctx.v.labels === 'all' || ctx.pinned.has(q.t.id) || q.t.id === ctx.hovered ? q.t.label : '')),
        textfont: { family: MONO, size: 10, color: th.text2 },
        hoverinfo: 'none',
        marker: { size: 4.5, color: '#ffffff', line: { width: 1.5, color: '#0E1116' }, opacity: ctx.selection.size ? 0.6 : 1 },
      });
      const best = rows.find((q) => q.t.id === ctx.bestId);
      if (best && v.showBest)
        data.push({ type: 'scatter3d', mode: 'markers+text', x: [best.x], y: [best.y], z: [best.z], customdata: [best.t.id], text: [`${best.t.label} · Best`], textposition: 'top center', textfont: { family: MONO, size: 11, color: BEST }, hoverinfo: 'none', marker: { size: 8, color: BEST, line: { width: 1.5, color: '#fff' } } });
    }
    const q = ctx.suggestion;
    if (q && v.showSuggestion && q.predicted[r]) {
      data.push({ type: 'scatter3d', mode: 'markers+text', x: [q.params[x]], y: [q.params[y]], z: [q.predicted[r].mean], customdata: [q.id], text: ['Q'], textposition: 'top center', textfont: { family: MONO, size: 11, color: th.suggest }, hoverinfo: 'none', marker: { size: 8, symbol: 'diamond-open', color: th.suggest, line: { width: 2, color: th.suggest } } });
      const sd = q.predicted[r].sd;
      if (sd) data.push({ type: 'scatter3d', mode: 'lines', x: [q.params[x], q.params[x]], y: [q.params[y], q.params[y]], z: [q.predicted[r].mean - sd, q.predicted[r].mean + sd], line: { color: th.suggest, width: 3 }, hoverinfo: 'skip' });
    }
    const fig: Figure = { data, layout: { ...baseLayoutFor(ctx), scene: scene(ctx, 'surface', x, y, r), uirevision: `${ctx.key}:surface` } };
    last.current = fig;
    return fig;
  }, [grid, trialZ, ctx, x, y, r, v, def, lowConf]);

  return (
    <>
      {figure && (
        <PlotHost
          figure={figure}
          is3d
          dimmed={loading && !!grid}
          ariaLabel={trialsSummary(ctx, `Response surface of ${ctx.name(r)} over ${ctx.name(x)} and ${ctx.name(y)}`)}
          onHover={(h) => act.hover(h)}
          onUnhover={() => act.hover(null)}
          onClick={(id, e) => act.click(id, e)}
          onRelayout={(e) => {
            const cam = e['scene.camera'] as Camera3D | undefined;
            if (cam) act.set((s) => ({ camera3d: { ...s.camera3d, surface: cam } }));
          }}
        />
      )}
      {(loading || error) && <FittingOverlay ctx={ctx} error={error} what="Fitting surface" />}
      {!loading && grid && <ExtrapolatedNote lowConf={!!lowConf} />}
    </>
  );
}

function baseLayoutFor(ctx: VizCtx) {
  return {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { family: 'Inter, DM Sans, system-ui, sans-serif', size: 12, color: ctx.theme.text2 },
    margin: { l: 0, r: 0, t: 0, b: 0 },
    showlegend: false,
    autosize: true,
  };
}

export function ExtrapolatedNote({ lowConf }: { lowConf: boolean }) {
  return (
    <div className="pointer-events-none absolute bottom-2 left-2 flex flex-col gap-1 text-[10px] text-ink3">
      {lowConf && <span className="rounded bg-[var(--borderline-soft)] px-1.5 py-0.5 font-semibold text-borderline">Model low confidence — shown at 60 % opacity</span>}
      <span className="rounded bg-surface/80 px-1.5 py-0.5">faded = extrapolated</span>
    </div>
  );
}
