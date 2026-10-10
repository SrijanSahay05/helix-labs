import { useMemo } from 'react';
import type { Data } from '../plotTypes';
import { PlotHost } from '../PlotHost';
import { BEST } from '../traces/colorscales';
import type { Camera3D } from '../store';
import type { ViewId } from '../types';
import { axisTitle, baseLayout, colorbar, colorProps, hexA, labelsMode, MONO, trialsSummary, type VizCtx } from './common';
import type { VizAct } from './act';

// tighter than Plotly's default so the cube fills ~85 % of the plot height
export const DEFAULT_EYE = { x: 1.3, y: 1.3, z: 0.75 };
export const CAMERA_PRESETS: Record<'iso' | 'top' | 'front' | 'side', Camera3D> = {
  iso: { eye: DEFAULT_EYE, up: { x: 0, y: 0, z: 1 } },
  top: { eye: { x: 0, y: 0, z: 2.3 }, up: { x: 0, y: 1, z: 0 } },
  front: { eye: { x: 0, y: -2.3, z: 0.1 }, up: { x: 0, y: 0, z: 1 } },
  side: { eye: { x: 2.3, y: 0, z: 0.1 }, up: { x: 0, y: 0, z: 1 } },
};

export function sceneAxis(ctx: VizCtx, id: string, title?: string) {
  const t = ctx.theme;
  return {
    title: { text: title ?? axisTitle(ctx, id), font: { size: 12, color: t.text2 } },
    gridcolor: hexA(t.line, 0.8),
    zerolinecolor: t.line,
    linecolor: t.line,
    showbackground: true,
    backgroundcolor: 'rgba(0,0,0,0)',
    tickfont: { family: MONO, size: 10, color: t.text3 },
  };
}

/** Fill the plot area (fix vs reference): full-domain scene, cube aspect, default eye so the cube fills ~85 % height. */
export function scene(ctx: VizCtx, view: ViewId, x: string, y: string, z: string, zTitle?: string) {
  return {
    domain: { x: [0, 1], y: [0, 1] },
    aspectmode: 'cube',
    xaxis: sceneAxis(ctx, x),
    yaxis: sceneAxis(ctx, y),
    zaxis: sceneAxis(ctx, z, zTitle),
    camera: ctx.v.camera3d[view] ?? CAMERA_PRESETS.iso,
    dragmode: 'orbit',
  };
}

export function Scatter3D({ ctx, act }: { ctx: VizCtx; act: VizAct }) {
  const { v } = ctx;
  const x = v.x!;
  const y = v.y!;
  const z = v.z!;
  const colorId = v.colorBy;
  const figure = useMemo(() => {
    const th = ctx.theme;
    const anySel = ctx.selection.size > 0;
    const rows = ctx.visible
      .map((t) => ({ t, x: ctx.value(t, x), y: ctx.value(t, y), z: ctx.value(t, z) }))
      .filter((r): r is { t: typeof r.t; x: number; y: number; z: number } => r.x !== null && r.y !== null && r.z !== null);
    const main = rows.filter((r) => r.t.id !== ctx.bestId && r.t.status === 'complete');
    const pending = rows.filter((r) => r.t.status === 'pending');
    const best = v.showBest ? rows.find((r) => r.t.id === ctx.bestId) : undefined;
    const lm = labelsMode(ctx, true);
    const keep = (id: string) => lm === 'all' || (lm === 'key' && (id === ctx.bestId || ctx.pinned.has(id) || id === ctx.hovered));
    const cvals = main.map((r) => (colorId ? ctx.value(r.t, colorId) : null));
    const zmin = Math.min(...rows.map((r) => r.z));
    const data: Data[] = [];
    if (v.dropLines) {
      const lx: (number | null)[] = [];
      const ly: (number | null)[] = [];
      const lz: (number | null)[] = [];
      for (const r of rows) lx.push(r.x, r.x, null), ly.push(r.y, r.y, null), lz.push(r.z, zmin, null);
      data.push({ type: 'scatter3d', mode: 'lines', x: lx, y: ly, z: lz, line: { color: hexA(th.text3, 0.45), width: 1.5 }, hoverinfo: 'skip' });
    }
    data.push({
      type: 'scatter3d',
      mode: 'markers+text',
      x: main.map((r) => r.x),
      y: main.map((r) => r.y),
      z: main.map((r) => r.z),
      customdata: main.map((r) => r.t.id),
      text: main.map((r) => (keep(r.t.id) ? r.t.label : '')),
      textposition: 'top center',
      textfont: { family: MONO, size: 10, color: th.text2 },
      hoverinfo: 'none',
      marker: {
        size: 6 * v.pointSize,
        color: colorId ? cvals.map((c) => c ?? '#9aa0ab') : th.accent,
        ...(colorId ? colorProps(ctx, colorId, cvals) : {}),
        showscale: !!colorId,
        ...(colorId ? { colorbar: colorbar(ctx, colorId, 0.98) } : {}),
        opacity: anySel ? 0.9 : 1,
        line: { width: main.map((r) => (ctx.selection.has(r.t.id) ? 2 : 0.5)), color: main.map((r) => (ctx.selection.has(r.t.id) ? th.text : th.surface)) },
      },
    });
    if (anySel) {
      const dim = main.filter((r) => !ctx.selection.has(r.t.id));
      // scatter3d can't vary opacity per point: unselected trials are overdrawn in a faded grey
      data.push({ type: 'scatter3d', mode: 'markers', x: dim.map((r) => r.x), y: dim.map((r) => r.y), z: dim.map((r) => r.z), customdata: dim.map((r) => r.t.id), hoverinfo: 'none', marker: { size: 6.5 * v.pointSize, color: hexA(th.surface, 0.75) } });
    }
    if (pending.length && v.filters.status.includes('pending'))
      data.push({ type: 'scatter3d', mode: 'markers', x: pending.map((r) => r.x), y: pending.map((r) => r.y), z: pending.map((r) => r.z), customdata: pending.map((r) => r.t.id), hoverinfo: 'none', marker: { size: 6, symbol: 'circle-open', color: '#9aa0ab' } });
    if (best)
      data.push({ type: 'scatter3d', mode: 'markers+text', x: [best.x], y: [best.y], z: [best.z], customdata: [best.t.id], text: [`${best.t.label} · Best`], textposition: 'top center', textfont: { family: MONO, size: 11, color: BEST }, hoverinfo: 'none', marker: { size: 9 * v.pointSize, color: BEST, line: { width: 1.5, color: '#fff' } } });
    if (v.showSuggestion && ctx.suggestion) {
      const qx = ctx.qValue(ctx.suggestion, x).v;
      const qy = ctx.qValue(ctx.suggestion, y).v;
      const qz = ctx.qValue(ctx.suggestion, z).v;
      if (qx !== null && qy !== null && qz !== null)
        data.push({ type: 'scatter3d', mode: 'markers+text', x: [qx], y: [qy], z: [qz], customdata: [ctx.suggestion.id], text: ['Q'], textposition: 'top center', textfont: { family: MONO, size: 11, color: th.suggest }, hoverinfo: 'none', marker: { size: 9, symbol: 'diamond-open', color: th.suggest, line: { width: 2, color: th.suggest } } });
    }
    const hov = rows.find((r) => r.t.id === ctx.hovered);
    if (hov) data.push({ type: 'scatter3d', mode: 'markers', x: [hov.x], y: [hov.y], z: [hov.z], hoverinfo: 'skip', marker: { size: 13, color: 'rgba(0,0,0,0)', line: { width: 2, color: th.text } } });
    const layout = baseLayout(ctx, { margin: { l: 0, r: 0, t: 0, b: 0 }, scene: scene(ctx, '3d', x, y, z), uirevision: `${ctx.key}:3d` });
    return { data, layout };
  }, [ctx, x, y, z, colorId, v]);

  return (
    <PlotHost
      figure={figure}
      is3d
      ariaLabel={trialsSummary(ctx, `3D scatter of ${ctx.name(z)} against ${ctx.name(x)} and ${ctx.name(y)}`)}
      onHover={(h) => act.hover(h)}
      onUnhover={() => act.hover(null)}
      onClick={(id, e) => act.click(id, e)}
      onRelayout={(e) => {
        const cam = e['scene.camera'] as Camera3D | undefined;
        if (cam) act.set((s) => ({ camera3d: { ...s.camera3d, '3d': cam } }));
      }}
    />
  );
}
