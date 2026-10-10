import { useEffect, useRef } from 'react';
import { setAgentStatus } from '@/store/agents';
import { datasetHash, primaryResult, splitParameters } from './selectors';
import { ensureDataset, latest, model } from './modelClient';
import { useGraphsRuntime } from './store';
import type { Dataset } from './types';

export interface Peak {
  x: string;
  y: string;
  at: [number, number];
  value: number;
}

/** Ranked parameters for default axes: design levers first (ranked by the model among themselves), then the rest. */
export function rankForAxes(ds: Dataset, importance: { paramId: string; score: number }[]): string[] {
  const { varying } = splitParameters(ds);
  const score = new Map(importance.map((i) => [i.paramId, i.score]));
  const order = (ids: string[]) => ids.sort((a, b) => (score.get(b) ?? 0) - (score.get(a) ?? 0));
  const levers = order(varying.filter((p) => p.lever).map((p) => p.id));
  // keep the declared lever order when the model can't separate them
  const declared = varying.filter((p) => p.lever).map((p) => p.id);
  const spread = levers.length ? Math.max(...levers.map((l) => score.get(l) ?? 0)) - Math.min(...levers.map((l) => score.get(l) ?? 0)) : 0;
  // the two leading levers go on the axes in the order the formulation declares them (Water before Stearic)
  const lev = spread < 0.02 ? declared : [...levers.slice(0, 2).sort((a, b) => declared.indexOf(a) - declared.indexOf(b)), ...levers.slice(2)];
  return [...lev, ...order(varying.filter((p) => !p.lever).map((p) => p.id))];
}

/**
 * Fits the surrogate in the worker whenever the data changes (debounced 800 ms after the first fit),
 * then importance, the Q Suggestion and Delta's "peak" caption. Delta is `working` while it fits.
 */
export function useGraphModel(ds: Dataset, enabled: boolean) {
  const set = useGraphsRuntime((s) => s.set);
  const retry = useGraphsRuntime((s) => s.retry);
  const hash = datasetHash(ds);
  const first = useRef(true);
  const dsRef = useRef(ds);
  dsRef.current = ds;

  useEffect(() => {
    if (useGraphsRuntime.getState().hash !== hash) set({ hash, fits: {}, suggestion: null, batch: [], regenIndex: 0, fitError: undefined, importance: [] });
  }, [hash, set]);

  useEffect(() => {
    if (!enabled) return;
    const ds = dsRef.current;
    const complete = ds.trials.filter((t) => t.status === 'complete').length;
    if (complete < 2) return;
    let alive = true;
    const run = async () => {
      set({ fitting: true, fitError: undefined });
      setAgentStatus('analyst', 'working', { orb: 'solving', label: `Fitting on ${complete} trials` });
      try {
        const r = await latest('fit', async () => {
          await ensureDataset(ds);
          const pr = primaryResult(ds);
          const info = await model().fit(pr.id);
          const importance = await model().importance(pr.id);
          let suggestion = null;
          try {
            // the dataset's reference suggestion, unless it has already become a trial
            const pinned = ds.suggestion && !ds.trials.some((t) => Object.keys(ds.suggestion!.params).every((k) => Math.abs((t.params[k] ?? 0) - ds.suggestion!.params[k]) < 1e-6));
            suggestion = pinned ? await model().describe(ds.suggestion!.params, 'Q1') : ((await model().suggest({ count: 1 }))[0] ?? null);
          } catch {
            /* no suggestion when the model can't propose one */
          }
          // Delta's caption: where the primary result peaks over the two leading levers
          const ranked = rankForAxes(ds, importance);
          let peak: Peak | null = null;
          if (ranked.length >= 2) {
            const g = await model().predictGrid({ resultId: pr.id, x: ranked[0], y: ranked[1], n: 30 });
            let best = -Infinity;
            g.mean.forEach((row, i) =>
              row.forEach((v, j) => {
                const s = pr.direction === 'minimize' ? -v : v;
                if (s > best) {
                  best = s;
                  peak = { x: ranked[0], y: ranked[1], at: [g.xs[j], g.ys[i]], value: v };
                }
              }),
            );
          }
          return { info, importance, suggestion, peak };
        });
        if (!alive || !r) return;
        set({ fitting: false, fits: { ...useGraphsRuntime.getState().fits, [r.info.resultId]: r.info }, trainedOn: r.info.trainedOn, importance: r.importance, suggestion: r.suggestion, peak: r.peak });
        setAgentStatus('analyst', 'done');
      } catch (e) {
        if (!alive) return;
        set({ fitting: false, fitError: e instanceof Error ? e.message : String(e) });
        setAgentStatus('analyst', 'failed');
      }
    };
    // an abandoned fit must not leave the card saying "Training…"
    const stop = () => {
      alive = false;
      if (useGraphsRuntime.getState().fitting) set({ fitting: false });
    };
    if (first.current) {
      first.current = false;
      void run();
      return stop;
    }
    const t = setTimeout(run, 800);
    return () => {
      clearTimeout(t);
      stop();
    };
  }, [hash, enabled, retry, set]);
}
