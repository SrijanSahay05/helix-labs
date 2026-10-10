import { useEffect, useRef, useState } from 'react';
import type { GridResult } from '../model/engine';
import { ensureDataset, latest, model } from '../modelClient';
import type { VizCtx } from './common';
import { useGraphsRuntime } from '../store';

export interface GridState {
  grid: GridResult | null;
  feasible: boolean[][] | null;
  trialZ: Record<string, number>;
  loading: boolean;
  error?: string;
}

/** Surrogate grid for Surface / Contour. The previous grid stays on screen (dimmed) while the next one computes. */
export function useGrid(ctx: VizCtx, opts: { resultId: string; x: string; y: string; pad?: number; feasible?: boolean; range?: { x: [number, number]; y: [number, number] } }): GridState {
  const [state, setState] = useState<GridState>({ grid: null, feasible: null, trialZ: {}, loading: true });
  const sliceKey = JSON.stringify(ctx.v.slice);
  const retry = useGraphsRuntime((s) => s.retry);
  const rangeKey = JSON.stringify(opts.range ?? null);
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;
  useEffect(() => {
    const c = ctxRef.current;
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: undefined }));
    void latest(`grid:${c.key}:${c.v.view}`, async () => {
      await ensureDataset(c.ds);
      const args = { resultId: opts.resultId, x: opts.x, y: opts.y, slice: c.v.slice, n: c.gridN, pad: opts.pad, range: opts.range };
      const grid = await model().predictGrid(args);
      const feasible = opts.feasible ? await model().feasibleGrid({ x: opts.x, y: opts.y, slice: c.v.slice, n: c.gridN, range: opts.range ?? { x: [grid.xs[0], grid.xs[grid.xs.length - 1]], y: [grid.ys[0], grid.ys[grid.ys.length - 1]] } }) : null;
      // where each trial would sit on this slice of the surface (stems show the residual)
      const done = c.visible.filter((t) => t.status === 'complete');
      const preds = await model().predictPoints(opts.resultId, done.map((t) => ({ ...c.v.slice, ...sliceBase(c), [opts.x]: t.params[opts.x], [opts.y]: t.params[opts.y] })));
      return { grid, feasible, trialZ: Object.fromEntries(done.map((t, i) => [t.id, preds[i].mean])) };
    })
      .then((r) => alive && r && setState({ ...r, loading: false }))
      .catch((e: unknown) => alive && setState((s) => ({ ...s, loading: false, error: e instanceof Error ? e.message : String(e) })));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.resultId, opts.x, opts.y, opts.pad, opts.feasible, ctx.ds, ctx.gridN, sliceKey, rangeKey, retry]);
  return state;
}

function sliceBase(c: VizCtx): Record<string, number> {
  const best = c.ds.trials.find((t) => t.id === c.bestId) ?? c.ds.trials[0];
  return { ...best.params, ...c.v.slice };
}
