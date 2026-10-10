import type { OrbState } from '@/components/ai/HelixOrb';
import type { AgentId, AgentStatus } from '@/agents/registry';

type BaseEvent =
  | { t: 'orb'; state: OrbState; label: string }
  | { t: 'plan'; steps: string[] }
  | { t: 'step'; index: number; status: 'running' | 'done' | 'warn' }
  | { t: 'think'; text: string }
  | { t: 'tool'; name: string; args: string; result: string; ms: number }
  | { t: 'fill'; path: string; value: unknown; confidence: number; reason: string; source?: string; label?: string; display?: string }
  | { t: 'check'; text: string; ok: boolean }
  | { t: 'type'; target: string; text: string }
  | { t: 'wait'; ms: number }
  | { t: 'count'; key: 'sources' | 'fields' | 'confidence'; value: number }
  | { t: 'effect'; run: () => void; label?: string }
  | { t: 'done'; summary: string }
  /** bot pops into the CrewStrip and types its greeting */
  | { t: 'join'; agent: AgentId; greeting?: string }
  /** work passes to another agent (dotted arc) */
  | { t: 'handoff'; from?: AgentId; to: AgentId; note: string; /** where to draw the arc first */ via?: 'run' | 'project' | 'rail' }
  | { t: 'status'; agent: AgentId; status: AgentStatus }
  /** the agent needs the human → status 'waiting' */
  | { t: 'ask'; question: string; field: string };

/** Every event is signed by an agent; when omitted, the run's current agent (last handoff) did it. */
export type AgentEvent = BaseEvent & { agent?: AgentId };

export interface AgentScript {
  id: string;
  title: string;
  /** the agent that owns the run (starts it, gets the toast) */
  agent?: AgentId;
  events: AgentEvent[];
}

export type LineKind = 'THINK' | 'TOOL' | 'FILL' | 'CHECK' | 'USER' | 'DONE' | 'JOIN' | 'HANDOFF' | 'ASK';

export interface TraceLine {
  id: number;
  at: number;
  kind: LineKind;
  text: string;
  /** who wrote it; absent on human lines */
  agent?: AgentId;
  /** HANDOFF lines: who received the work */
  to?: AgentId;
  pending?: boolean;
  ok?: boolean;
}

export type RunStatus = 'running' | 'paused' | 'done' | 'failed' | 'cancelled';

export interface RunState {
  id: string;
  scriptId: string;
  title: string;
  projectId?: string;
  stage?: string;
  status: RunStatus;
  orb: OrbState;
  label: string;
  plan: { text: string; status: 'pending' | 'running' | 'done' | 'warn' }[];
  lines: TraceLine[];
  progress: number;
  startedAt: number;
  endedAt?: number;
  etaMs: number;
  counters: { sources: number; fields: number; confidence: number };
  typed: Record<string, string>;
  summary?: string;
  skipped?: boolean;
  background?: boolean;
  /** owner of the run */
  lead: AgentId;
  /** agent doing the work right now */
  agent: AgentId;
  /** everyone on this run, in the order they joined */
  crew: AgentId[];
  crewStatus: Partial<Record<AgentId, AgentStatus>>;
  greetings: Partial<Record<AgentId, string>>;
  /** fields filled per agent on this run */
  fills: Partial<Record<AgentId, { n: number; conf: number }>>;
  handoff?: { from: AgentId; to: AgentId; note: string; seq: number };
}
