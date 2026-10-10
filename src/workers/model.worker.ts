import * as Comlink from 'comlink';
import { ModelEngine } from '@/features/graphs/model/engine';

/** Surrogate model, gridding, LOO, suggestions, PCA and importance — off the main thread. */
const engine = new ModelEngine();

const api = {
  setDataset: engine.setDataset.bind(engine),
  fit: engine.fit.bind(engine),
  predictGrid: engine.predictGrid.bind(engine),
  feasibleGrid: engine.feasibleGrid.bind(engine),
  predictPoints: engine.predictPoints.bind(engine),
  looPredictions: engine.looPredictions.bind(engine),
  suggest: engine.suggest.bind(engine),
  describe: engine.describe.bind(engine),
  pca: engine.pca.bind(engine),
  importance: engine.importance.bind(engine),
  effect: engine.effect.bind(engine),
  ternaryGrid: engine.ternaryGrid.bind(engine),
  /** dev state switcher hooks */
  debug(opts: { failNext?: boolean; delayMs?: number }) {
    if (opts.failNext !== undefined) engine.failNext = opts.failNext;
    if (opts.delayMs !== undefined) engine.delayMs = opts.delayMs;
  },
};

export type ModelApi = typeof api;
Comlink.expose(api);
