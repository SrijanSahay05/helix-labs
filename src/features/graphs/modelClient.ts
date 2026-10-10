import * as Comlink from 'comlink';
import type { ModelApi } from '@/workers/model.worker';
import type { Dataset } from './types';
import { datasetHash } from './selectors';

let worker: Worker | null = null;
let api: Comlink.Remote<ModelApi> | null = null;
let currentHash = '';

/** The worker, created on first use (Graphs is lazy-loaded, so the model only starts when the card opens). */
export function model(): Comlink.Remote<ModelApi> {
  if (!api) {
    worker = new Worker(new URL('../../workers/model.worker.ts', import.meta.url), { type: 'module' });
    api = Comlink.wrap<ModelApi>(worker);
  }
  return api;
}

/** Make sure the worker holds this dataset (no-op when unchanged). */
export async function ensureDataset(ds: Dataset): Promise<void> {
  const h = datasetHash(ds);
  if (h === currentHash) return;
  currentHash = h;
  await model().setDataset(ds);
}

const tokens = new Map<string, number>();

/**
 * Latest request wins: run `fn` for a channel; resolves to null if a newer request on the same channel started meanwhile.
 * (The worker finishes stale work, but its answer is dropped.)
 */
export async function latest<T>(channel: string, fn: () => Promise<T>): Promise<T | null> {
  const tok = (tokens.get(channel) ?? 0) + 1;
  tokens.set(channel, tok);
  const out = await fn();
  return tokens.get(channel) === tok ? out : null;
}
