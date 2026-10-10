import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BotAvatarGlasses, BotAvatarHat } from 'bot-avatars';
import type { OrbState } from '@/components/ai/HelixOrb';
import { AGENT_IDS, AGENTS, type AgentId, type AgentStatus, type BotType } from '@/agents/registry';

export type Personality = 'lively' | 'calm' | 'still';

export interface AgentLive {
  status: AgentStatus;
  orb?: OrbState;
  label?: string;
  runId?: string;
}

export interface AgentStats {
  runs: number;
  fills: number;
  confSum: number;
  lastActive?: number;
  recent: { at: number; text: string }[];
}

export interface AgentCustom {
  name?: string;
  color?: string;
  brightness?: number;
  saturation?: number;
  type?: BotType;
  path?: string;
  hat?: BotAvatarHat;
  glasses?: BotAvatarGlasses;
  headphones?: boolean;
  bowTie?: boolean;
  /** undefined = follow the global "Bot motion" setting */
  personality?: Personality;
}

interface AgentsState {
  live: Record<AgentId, AgentLive>;
  stats: Record<AgentId, AgentStats>;
  custom: Partial<Record<AgentId, AgentCustom>>;
  setLive: (id: AgentId, p: Partial<AgentLive>) => void;
  record: (id: AgentId, text: string, fill?: number) => void;
  startRun: (id: AgentId) => void;
  setCustom: (id: AgentId, p: Partial<AgentCustom> | null) => void;
}

const initLive = () => Object.fromEntries(AGENT_IDS.map((id) => [id, { status: 'idle' as AgentStatus }])) as Record<AgentId, AgentLive>;
const initStats = () => Object.fromEntries(AGENT_IDS.map((id): [AgentId, AgentStats] => [id, { runs: 0, fills: 0, confSum: 0, recent: [] }])) as Record<AgentId, AgentStats>;

export const useAgents = create<AgentsState>()(
  persist(
    (set) => ({
      live: initLive(),
      stats: initStats(),
      custom: {},
      setLive: (id, p) => set((s) => ({ live: { ...s.live, [id]: { ...s.live[id], ...p } } })),
      record: (id, text, fill) =>
        set((s) => {
          const st = s.stats[id] ?? { runs: 0, fills: 0, confSum: 0, recent: [] };
          return {
            stats: {
              ...s.stats,
              [id]: {
                ...st,
                fills: st.fills + (fill !== undefined ? 1 : 0),
                confSum: st.confSum + (fill ?? 0),
                lastActive: Date.now(),
                recent: [{ at: Date.now(), text }, ...st.recent].slice(0, 20),
              },
            },
          };
        }),
      startRun: (id) => set((s) => ({ stats: { ...s.stats, [id]: { ...s.stats[id], runs: (s.stats[id]?.runs ?? 0) + 1, lastActive: Date.now() } } })),
      setCustom: (id, p) =>
        set((s) => {
          const custom = { ...s.custom };
          if (p === null) delete custom[id];
          else custom[id] = { ...custom[id], ...p };
          return { custom };
        }),
    }),
    {
      name: 'helix:v1:agents',
      // live statuses are per-session; stats and customisation persist
      partialize: (s) => ({ stats: s.stats, custom: s.custom }),
      merge: (persisted, cur) => {
        const p = persisted as Partial<AgentsState> | undefined;
        return { ...cur, stats: { ...cur.stats, ...(p?.stats ?? {}) }, custom: p?.custom ?? {} };
      },
    },
  ),
);

/** Display name, honouring a rename from the Agents page. */
export function agentName(id: AgentId): string {
  return useAgents.getState().custom[id]?.name || AGENTS[id].name;
}

export function useAgentName(id: AgentId): string {
  const custom = useAgents((s) => s.custom[id]?.name);
  return custom || AGENTS[id].name;
}

const doneTimers = new Map<AgentId, ReturnType<typeof setTimeout>>();

/** Set an agent's global status; `done` falls back to `idle` after 3 s. */
export function setAgentStatus(id: AgentId, status: AgentStatus, extra: Partial<AgentLive> = {}) {
  const t = doneTimers.get(id);
  if (t) clearTimeout(t);
  useAgents.getState().setLive(id, { status, ...extra });
  if (status === 'done') {
    doneTimers.set(
      id,
      setTimeout(() => {
        if (useAgents.getState().live[id]?.status === 'done') useAgents.getState().setLive(id, { status: 'idle', orb: undefined, label: undefined });
      }, 3000),
    );
  }
}
