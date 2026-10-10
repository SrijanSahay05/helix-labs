import type { AIMeta } from '@/types';
import type { AgentId, AgentStatus } from '@/agents/registry';
import { useTasks } from '@/store/tasks';
import { speedFactor, useUI } from '@/store/ui';
import { setAgentStatus, useAgents } from '@/store/agents';
import { prefersReducedMotion, seeded, hashString } from '@/lib/motion';
import { uid } from '@/lib/format';
import { bus } from './bus';
import type { AgentEvent, AgentScript, LineKind, RunState } from './types';
import { notifyDone } from './notify';

interface Ctl {
  paused: boolean;
  skip: boolean;
  abort: boolean;
}
const controllers = new Map<string, Ctl>();
let lineSeq = 0;
let handoffSeq = 0;

export interface RunOptions {
  id?: string;
  projectId?: string;
  stage?: string;
  background?: boolean;
  onFill?: (path: string, value: unknown, meta: AIMeta) => void;
  onDone?: (run: RunState) => void;
  onFail?: (run: RunState, err: unknown) => void;
  notify?: { title: string; href?: string; action?: string };
}

const CURSOR_MS = 320;
const HANDOFF_MS = 520;

function baseDelay(e: AgentEvent): number {
  switch (e.t) {
    case 'think':
      return 220 + Math.min(e.text.length * 4, 300);
    case 'tool':
      return e.ms;
    case 'fill':
      return CURSOR_MS + 200;
    case 'check':
      return 220;
    case 'type':
      return Math.min(e.text.length * 22, 4200);
    case 'wait':
      return e.ms;
    case 'orb':
      return 160;
    case 'step':
      return 120;
    case 'join':
      return 120;
    case 'handoff':
      return HANDOFF_MS;
    default:
      return 40;
  }
}

export function estimateMs(script: AgentScript): number {
  return script.events.reduce((a, e) => a + baseDelay(e), 0);
}

function sleep(ms: number, ctl: Ctl): Promise<void> {
  return new Promise((resolve) => {
    let left = ms;
    const tick = () => {
      if (ctl.abort || ctl.skip) return resolve();
      if (ctl.paused) return void setTimeout(tick, 80);
      if (left <= 0) return resolve();
      const step = Math.min(50, left);
      left -= step;
      setTimeout(tick, step);
    };
    tick();
  });
}

const patch = (id: string, fn: (r: RunState) => Partial<RunState>) => useTasks.getState().patch(id, fn);

function push(id: string, kind: LineKind, text: string, agent: AgentId | undefined, extra: { pending?: boolean; ok?: boolean; to?: AgentId } = {}): number {
  const lid = ++lineSeq;
  patch(id, (r) => ({ lines: [...r.lines, { id: lid, at: Date.now() - r.startedAt, kind, text, agent, ...extra }].slice(-300) }));
  return lid;
}

/** Set an agent's status inside a run and mirror it to the agent's global status. */
function crewSet(runId: string, agent: AgentId, status: AgentStatus) {
  patch(runId, (r) => ({ crew: r.crew.includes(agent) ? r.crew : [...r.crew, agent], crewStatus: { ...r.crewStatus, [agent]: status } }));
  const live = useAgents.getState().live[agent];
  const mine = !live?.runId || live.runId === runId;
  // another run's work wins over this run's idle states
  if (status === 'working' || status === 'waiting' || mine || live?.status !== 'working') setAgentStatus(agent, status, { runId });
}

export function runAgent(script: AgentScript, opts: RunOptions = {}): string {
  const id = opts.id ?? uid('run');
  const prev = controllers.get(id);
  if (prev) prev.abort = true;
  const ctl: Ctl = { paused: false, skip: false, abort: false };
  controllers.set(id, ctl);
  const lead: AgentId = script.agent ?? 'conductor';
  const run: RunState = {
    id,
    scriptId: script.id,
    title: script.title,
    projectId: opts.projectId,
    stage: opts.stage,
    status: 'running',
    orb: 'working',
    label: 'Starting…',
    plan: [],
    lines: [],
    progress: 0,
    startedAt: Date.now(),
    etaMs: estimateMs(script),
    counters: { sources: 0, fields: 0, confidence: 0 },
    typed: {},
    background: opts.background,
    lead,
    agent: lead,
    crew: [lead],
    crewStatus: { [lead]: 'working' },
    greetings: {},
    fills: {},
  };
  useTasks.getState().upsert(run);
  useAgents.getState().startRun(lead);
  setAgentStatus(lead, 'working', { runId: id });
  void loop(id, script, ctl, opts);
  return id;
}

async function loop(id: string, script: AgentScript, ctl: Ctl, opts: RunOptions) {
  const rnd = seeded(hashString(script.id));
  const n = script.events.length;
  const total = estimateMs(script);
  let elapsedBase = 0;
  let cur: AgentId = script.agent ?? 'conductor';
  const reduced = prefersReducedMotion();
  const wait = (ms: number) => {
    const f = speedFactor();
    if (!Number.isFinite(f) || ctl.skip) return Promise.resolve();
    return sleep((ms * (0.85 + rnd() * 0.3)) / f, ctl);
  };
  const scopes = (r: RunState) => [id, ...(r.projectId ? [`project:${r.projectId}`, `rail:${r.projectId}`] : [])];
  try {
    for (let i = 0; i < n; i++) {
      if (ctl.abort) {
        const r = useTasks.getState().runs[id];
        r?.crew.forEach((a) => crewSet(id, a, 'idle'));
        patch(id, () => ({ status: 'cancelled', endedAt: Date.now() }));
        return;
      }
      const e = script.events[i];
      const instant = ctl.skip || !Number.isFinite(speedFactor()) || reduced;
      // a guest agent (explicit `agent`, no handoff) works for this one event, then steps back
      const who: AgentId = e.t === 'join' ? e.agent : e.t === 'handoff' ? cur : (e.agent ?? cur);
      const guest = e.t !== 'join' && e.t !== 'handoff' && e.t !== 'status' && who !== cur;
      if (guest) crewSet(id, who, 'working');
      switch (e.t) {
        case 'join': {
          patch(id, (r) => ({ greetings: { ...r.greetings, [e.agent]: e.greeting ?? '' } }));
          crewSet(id, e.agent, e.agent === cur ? 'working' : 'queued');
          if (e.greeting) push(id, 'JOIN', e.greeting, e.agent);
          await wait(baseDelay(e));
          break;
        }
        case 'handoff': {
          const from = e.from ?? cur;
          const seq = ++handoffSeq;
          crewSet(id, from, 'done');
          crewSet(id, e.to, 'working');
          useAgents.getState().startRun(e.to);
          cur = e.to;
          patch(id, () => ({ agent: e.to, handoff: { from, to: e.to, note: e.note, seq } }));
          push(id, 'HANDOFF', e.note, from, { to: e.to });
          const r = useTasks.getState().runs[id];
          if (!instant && r) {
            const all = scopes(r);
            const first = e.via === 'rail' ? `rail:${r.projectId}` : e.via === 'project' ? `project:${r.projectId}` : id;
            bus.emit('handoff', { from, to: e.to, scopes: [first, ...all.filter((x) => x !== first)] });
          }
          await wait(HANDOFF_MS);
          break;
        }
        case 'status':
          crewSet(id, e.agent, e.status);
          break;
        case 'ask':
          crewSet(id, who, 'waiting');
          push(id, 'ASK', `${e.question}`, who);
          break;
        case 'orb':
          patch(id, () => ({ orb: e.state, label: e.label }));
          useAgents.getState().setLive(who, { orb: e.state, label: e.label });
          await wait(160);
          break;
        case 'plan':
          patch(id, () => ({ plan: e.steps.map((text) => ({ text, status: 'pending' as const })) }));
          await wait(e.steps.length * 140);
          break;
        case 'step':
          patch(id, (r) => ({ plan: r.plan.map((p, k) => (k === e.index ? { ...p, status: e.status } : p)) }));
          await wait(120);
          break;
        case 'think':
          push(id, 'THINK', e.text, who);
          await wait(baseDelay(e));
          break;
        case 'tool': {
          const lid = push(id, 'TOOL', `tool.${e.name}(${e.args})`, who, { pending: true });
          await wait(e.ms);
          patch(id, (r) => ({ lines: r.lines.map((l) => (l.id === lid ? { ...l, text: `${l.text} → ${e.result}`, pending: false } : l)) }));
          useAgents.getState().record(who, `${e.name} → ${e.result}`);
          break;
        }
        case 'fill': {
          if (!instant) {
            bus.emit('cursor', { path: e.path, runId: id, agent: who, value: typeof e.value === 'object' ? undefined : String(e.value) });
            await wait(CURSOR_MS);
          }
          opts.onFill?.(e.path, e.value, { by: 'helix', agent: who, confidence: e.confidence, reason: e.reason, source: e.source });
          bus.emit('fill', { path: e.path, runId: id, instant, agent: who });
          push(id, 'FILL', `Set **${e.label ?? e.path}** = ${e.display ?? String(e.value)} (confidence ${e.confidence.toFixed(2)})`, who);
          useAgents.getState().record(who, `Filled ${e.label ?? e.path}`, e.confidence);
          patch(id, (r) => {
            const fields = r.counters.fields + 1;
            const confidence = (r.counters.confidence * r.counters.fields + e.confidence) / fields;
            const f = r.fills[who] ?? { n: 0, conf: 0 };
            return { counters: { ...r.counters, fields, confidence }, fills: { ...r.fills, [who]: { n: f.n + 1, conf: f.conf + e.confidence } } };
          });
          await wait(200);
          break;
        }
        case 'check':
          push(id, 'CHECK', e.text, who, { ok: e.ok });
          await wait(220);
          break;
        case 'type':
          patch(id, (r) => ({ typed: { ...r.typed, [e.target]: e.text } }));
          await wait(baseDelay(e));
          break;
        case 'wait':
          await wait(e.ms);
          break;
        case 'count':
          patch(id, (r) => ({ counters: { ...r.counters, [e.key]: e.value } }));
          break;
        case 'effect':
          e.run();
          break;
        case 'done':
          patch(id, () => ({ summary: e.summary }));
          push(id, 'DONE', e.summary, who);
          break;
      }
      if (guest) crewSet(id, who, 'done');
      elapsedBase += baseDelay(e);
      const progress = Math.min(0.999, (i + 1) / n);
      const f = speedFactor();
      patch(id, () => ({ progress, etaMs: Number.isFinite(f) ? Math.max(0, (total - elapsedBase) / f) : 0 }));
    }
    bus.emit('cursor-hide', { runId: id });
    const r0 = useTasks.getState().runs[id];
    // anyone still waiting on a human stays waiting
    r0?.crew.filter((a) => r0.crewStatus[a] !== 'waiting').forEach((a) => crewSet(id, a, 'done'));
    patch(id, () => ({ status: 'done', progress: 1, endedAt: Date.now(), etaMs: 0, orb: 'breathing', skipped: ctl.skip }));
    const final = useTasks.getState().runs[id];
    opts.onDone?.(final);
    if (opts.notify) notifyDone(opts.notify.title, opts.notify.href, opts.notify.action, final.lead, final.summary);
  } catch (err) {
    bus.emit('cursor-hide', { runId: id });
    const r = useTasks.getState().runs[id];
    crewSet(id, cur, 'failed');
    patch(id, () => ({ status: 'failed', endedAt: Date.now() }));
    push(id, 'CHECK', `Run failed: ${err instanceof Error ? err.message : String(err)}`, cur, { ok: false });
    opts.onFail?.(r, err);
  } finally {
    controllers.delete(id);
  }
}

function activeCrew(id: string) {
  const r = useTasks.getState().runs[id];
  return r ? r.crew.filter((a) => r.crewStatus[a] === 'working' || r.crewStatus[a] === 'paused') : [];
}

export const agent = {
  pause(id: string) {
    const c = controllers.get(id);
    if (c) c.paused = true;
    activeCrew(id).forEach((a) => crewSet(id, a, 'paused'));
    patch(id, () => ({ status: 'paused' }));
  },
  resume(id: string) {
    const c = controllers.get(id);
    if (c) c.paused = false;
    activeCrew(id).forEach((a) => crewSet(id, a, 'working'));
    patch(id, () => ({ status: 'running' }));
  },
  skip(id: string) {
    const c = controllers.get(id);
    if (c) {
      c.skip = true;
      c.paused = false;
    }
  },
  cancel(id: string) {
    const c = controllers.get(id);
    if (c) c.abort = true;
    else patch(id, () => ({ status: 'cancelled' }));
  },
  isActive(id?: string) {
    return !!id && controllers.has(id);
  },
  userLine(id: string | undefined, text: string) {
    if (!id || !useTasks.getState().runs[id]) return;
    push(id, 'USER', text, undefined);
  },
};

/** Whether bots should fly and arcs should draw (reduced motion and "Still" turn them off). */
export function botMotionAllowed() {
  return !prefersReducedMotion() && useUI.getState().botMotion !== 'still';
}
