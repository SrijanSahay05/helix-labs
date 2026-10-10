import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Check, ChevronDown, Circle, FastForward, Pause, Play, Square } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '@/store/tasks';
import { useProjects } from '@/store/project';
import { useUI } from '@/store/ui';
import { agent } from '@/agent/engine';
import type { LineKind, RunState } from '@/agent/types';
import { BRAND } from '@/data/copy';
import { elapsed, stamp } from '@/lib/format';
import { cn } from '@/lib/cn';
import { EASE } from '@/lib/motion';
import { HelixOrb } from './HelixOrb';
import { renderInline, TypeText } from './TypeText';
import { ProgressBar } from '@/components/ui/primitives';
import { AgentBadge } from '@/components/agents/AgentBadge';
import { AgentTag, HumanAvatar } from '@/components/agents/AgentTag';
import { CrewStrip } from '@/components/agents/CrewStrip';
import { AGENTS, type AgentId, type AgentStatus } from '@/agents/registry';
import { useAgentName } from '@/store/agents';

const TAG: Record<LineKind, string> = {
  THINK: 'text-ink2 border-line',
  TOOL: 'text-accent border-accent/40',
  FILL: 'text-pass border-pass/40',
  CHECK: 'text-borderline border-borderline/40',
  USER: 'text-ink border-ink3',
  DONE: 'text-accent border-accent/40',
  JOIN: 'text-ink2 border-line',
  HANDOFF: 'text-accent border-accent/40',
  ASK: 'text-borderline border-borderline/40',
};

/** The active agent's status inside this run, from the run's own state. */
function headStatus(run: RunState): AgentStatus {
  if (run.status === 'done') return 'done';
  if (run.status === 'paused') return 'paused';
  if (run.status === 'failed') return 'failed';
  if (run.status === 'cancelled') return 'idle';
  return run.crewStatus[run.agent] ?? 'working';
}

function useNow(active: boolean) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, [active]);
  return now;
}

export function AgentConsole({ runId, idleLabel = 'Waiting for your input', className, autoCollapse = true }: { runId?: string; idleLabel?: string; className?: string; autoCollapse?: boolean }) {
  const run = useTasks((s) => (runId ? s.runs[runId] : undefined));
  const nav = useNavigate();
  const deleteProject = useProjects((s) => s.deleteProject);
  const resetDraft = useProjects((s) => s.resetDraft);
  const showReasoning = useUI((s) => s.showReasoning);
  const activeName = useAgentName(run?.agent ?? 'conductor');
  const setUI = useUI((s) => s.set);
  const [collapsed, setCollapsed] = useState(false);
  const active = run?.status === 'running' || run?.status === 'paused';
  const now = useNow(active);

  useEffect(() => {
    if (autoCollapse && run?.status === 'done') {
      const t = setTimeout(() => setCollapsed(true), 1400);
      return () => clearTimeout(t);
    }
    if (active) setCollapsed(false);
  }, [run?.status, active, autoCollapse]);

  if (!run)
    return (
      <div className={cn('card agent-grid flex items-center gap-3 p-4', className)}>
        <span data-agent-origin>
          <AgentBadge id="conductor" preset="compact" placement="console-idle" status="waiting" size={32} />
        </span>
        <span className="text-sm text-ink2">{BRAND.agentName}</span>
        <span className="text-sm text-ink3">· {idleLabel}</span>
      </div>
    );

  const time = elapsed((run.endedAt ?? now) - run.startedAt);
  const stepIdx = run.plan.findIndex((p) => p.status === 'running');
  const doneCount = run.plan.filter((p) => p.status === 'done' || p.status === 'warn').length;
  const stepNo = stepIdx >= 0 ? stepIdx + 1 : doneCount;

  if (collapsed)
    return (
      <motion.button
        layout
        onClick={() => setCollapsed(false)}
        className={cn('card flex w-full items-center gap-3 px-4 py-2.5 text-left', className)}
      >
        <span data-agent-origin>
          <AgentBadge id={run.agent} preset="compact" placement={`console-${run.id}`} status={headStatus(run)} orb={run.orb} size={32} />
        </span>
        <span className="text-sm font-medium">{run.title}</span>
        <span className="hidden truncate text-sm text-ink2 sm:inline">· {run.summary ?? run.label}</span>
        <span className="mono ml-auto text-2xs text-ink3">{time}</span>
        <ChevronDown size={14} className="text-ink3" />
      </motion.button>
    );

  return (
    <motion.div layout className={cn('card agent-grid overflow-hidden', className)} transition={{ duration: 0.26, ease: EASE }}>
      <div className="flex items-start gap-4 border-b border-line bg-surface/85 p-4 md:gap-5 md:p-5">
        <span data-agent-origin>
          <AgentSwap id={run.agent}>
            <AgentBadge id={run.agent} preset="console" placement={`console-${run.id}`} status={headStatus(run)} orb={run.orb} anchor={`${run.id}:head:${run.agent}`} />
          </AgentSwap>
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">
              {activeName} <span className="font-normal text-ink3">· {AGENTS[run.agent].title}</span>
            </span>
            <span className="mono rounded border border-line bg-surface2 px-1.5 text-2xs text-ink2">{BRAND.model}</span>
            {run.plan.length > 0 && (
              <span className="mono text-2xs text-ink3">
                Step {Math.max(1, stepNo)} / {run.plan.length}
              </span>
            )}
            <span className="mono ml-auto text-xs tabular-nums text-ink2">{time}</span>
          </div>
          <div className="mt-2 font-display text-[22px] leading-7 text-ink">
            {run.status === 'done' ? (
              <span className="flex items-center gap-1.5">
                <Check size={16} className="text-accent" /> {run.summary ?? 'Done'}
              </span>
            ) : run.status === 'failed' ? (
              <span className="text-fail">Failed · {run.label}</span>
            ) : (
              <TypeText key={run.label} inline text={run.label} id={`${run.id}-${run.label}`} />
            )}
          </div>
          <div className="mt-3">
            <ProgressBar value={run.progress} />
          </div>
          {run.crew.length > 1 && <CrewStrip run={run} className="mt-3" />}
        </div>
        <button onClick={() => setCollapsed(true)} className="rounded p-1 text-ink3 hover:bg-surface2" title="Collapse">
          <ChevronDown size={14} className="rotate-180" />
        </button>
      </div>

      <div className="grid md:grid-cols-[minmax(220px,0.8fr)_2fr]">
        <Plan run={run} />
        <Trace run={run} showReasoning={showReasoning} />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line bg-surface/85 px-4 py-2.5 text-2xs text-ink2">
        <span className="mono">Sources read <b className="text-ink">{run.counters.sources}</b></span>
        <span className="mono">Fields filled <b className="text-ink">{run.counters.fields}</b></span>
        <span className="mono">
          Confidence <b className="text-ink">{run.counters.fields ? run.counters.confidence.toFixed(2) : '—'}</b>
        </span>
        <div className="ml-auto flex items-center gap-1">
          <label className="mr-2 flex cursor-pointer items-center gap-1.5">
            <input type="checkbox" className="accent-[var(--accent)]" checked={showReasoning} onChange={(e) => setUI({ showReasoning: e.target.checked })} />
            Show reasoning
          </label>
          {active && (
            <>
              {run.status === 'paused' ? (
                <button className="flex items-center gap-1 rounded px-2 py-1 hover:bg-surface2" onClick={() => agent.resume(run.id)}>
                  <Play size={12} /> Resume
                </button>
              ) : (
                <button className="flex items-center gap-1 rounded px-2 py-1 hover:bg-surface2" onClick={() => agent.pause(run.id)}>
                  <Pause size={12} /> Pause
                </button>
              )}
              <button className="flex items-center gap-1 rounded px-2 py-1 font-medium text-accent hover:bg-accent-soft" onClick={() => agent.skip(run.id)}>
                <FastForward size={12} /> Skip animation
              </button>
              <div className="w-px h-3 bg-line mx-1" />
              <button className="flex items-center gap-1 rounded px-2 py-1 hover:bg-fail-soft text-fail transition-colors" onClick={() => agent.cancel(run.id)}>
                <Square size={12} /> Stop Process
              </button>
              <button className="flex items-center gap-1 rounded px-2 py-1 hover:bg-fail-soft text-fail transition-colors font-medium" onClick={() => {
                agent.cancel(run.id);
                if (run.projectId) {
                  deleteProject(run.projectId);
                  nav('/projects');
                } else {
                  resetDraft();
                  nav('/');
                }
              }}>
                Cancel Project
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function Plan({ run }: { run: RunState }) {
  return (
    <ol className="space-y-1.5 border-b border-line p-4 md:border-b-0 md:border-r">
      {run.plan.length === 0 && <li className="text-xs text-ink3">Planning…</li>}
      {run.plan.map((p, i) => (
        <motion.li key={i} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="flex items-center gap-2 text-xs">
          <span className="flex h-5 w-5 items-center justify-center">
            {p.status === 'running' ? (
              <HelixOrb state={run.orb} size={20} />
            ) : p.status === 'done' ? (
              <Check size={14} className="text-accent" strokeWidth={2.5} />
            ) : p.status === 'warn' ? (
              <AlertTriangle size={13} className="text-borderline" />
            ) : (
              <Circle size={11} className="text-ink3" />
            )}
          </span>
          <span className={cn(p.status === 'pending' ? 'text-ink3' : p.status === 'running' ? 'font-medium text-ink' : 'text-ink2')}>{p.text}</span>
        </motion.li>
      ))}
    </ol>
  );
}

function HandoffText({ note, from, to }: { note: string; from: AgentId; to: AgentId }) {
  const fromName = useAgentName(from);
  const toName = useAgentName(to);
  return (
    <span>
      <b className="font-semibold">{fromName}</b> <span className="text-accent">→</span> <b className="font-semibold">{toName}</b> <span className="text-ink2">“{note}”</span>
    </span>
  );
}

/** When the active agent changes, the head bot scales out and the next one scales in (150 ms). */
function AgentSwap({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span key={id} className="inline-flex" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={{ duration: 0.15 }}>
        {children}
      </motion.span>
    </AnimatePresence>
  );
}

function Trace({ run, showReasoning }: { run: RunState; showReasoning: boolean }) {
  const user = useUI((s) => s.userName);
  const ref = useRef<HTMLDivElement>(null);
  const lines = showReasoning ? run.lines : run.lines.filter((l) => l.kind !== 'THINK');
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines.length, run.lines]);
  return (
    <div ref={ref} className="scroll-thin fade-top mono max-h-[240px] min-h-[150px] overflow-auto p-4 text-[12px] leading-[19px]">
      <AnimatePresence initial={false}>
        {lines.map((l) => (
          <motion.div key={l.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className="flex items-start gap-2 py-[1px]">
            <span className="hidden w-[62px] shrink-0 text-ink3 sm:inline">{stamp(l.at)}</span>
            <span className="flex w-[78px] shrink-0 items-center overflow-hidden">
              {l.agent ? <AgentTag id={l.agent} placement={`trace-${run.id}`} title={false} status={l.pending ? 'working' : 'idle'} size={16} className="text-[11px]" /> : <span className="inline-flex items-center gap-1 text-[11px]"><HumanAvatar name={user} size={16} /> You</span>}
            </span>
            <span className={cn('w-[58px] shrink-0 rounded-sm border px-1 text-center text-[10px] font-semibold leading-[16px]', TAG[l.kind])}>{l.kind}</span>
            <span className={cn('min-w-0 flex-1 break-words', l.kind === 'THINK' ? 'text-ink2' : 'text-ink', l.ok === false && 'text-fail')}>
              {l.kind === 'HANDOFF' && l.agent && l.to ? <HandoffText note={l.text} from={l.agent} to={l.to} /> : l.kind === 'JOIN' ? <span className="text-ink2">“{l.text}”</span> : renderInline(l.text)}
              {l.pending && (
                <span className="ml-1 inline-flex translate-y-[5px]">
                  <HelixOrb state="working" size={20} />
                </span>
              )}
              {l.kind === 'CHECK' && l.ok !== false && <span className="ml-1 text-pass">✓</span>}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
      {run.status === 'running' && <span className="caret">▍</span>}
    </div>
  );
}
