import type { AgentId } from '@/agents/registry';

/** Tiny typed event bus that syncs agent FILL lines with on-screen field animations. */
type BusEvents = {
  cursor: { path: string; runId: string; value?: string; agent: AgentId };
  fill: { path: string; runId: string; instant: boolean; agent?: AgentId };
  'cursor-hide': { runId: string };
  /** draw a dotted arc between two bots; scopes are tried in order until both anchors are on screen */
  handoff: { from: AgentId; to: AgentId; scopes: string[]; reverse?: boolean };
};

type Handler<K extends keyof BusEvents> = (e: BusEvents[K]) => void;

const handlers: { [K in keyof BusEvents]?: Set<Handler<K>> } = {};

export const bus = {
  on<K extends keyof BusEvents>(k: K, h: Handler<K>): () => void {
    const set = (handlers[k] ??= new Set() as never) as Set<Handler<K>>;
    set.add(h);
    return () => set.delete(h);
  },
  emit<K extends keyof BusEvents>(k: K, e: BusEvents[K]) {
    (handlers[k] as Set<Handler<K>> | undefined)?.forEach((h) => h(e));
  },
};
