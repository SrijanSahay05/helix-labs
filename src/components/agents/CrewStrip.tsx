import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AGENTS, type AgentId, type AgentStatus } from '@/agents/registry';
import type { RunState } from '@/agent/types';
import { useAgentName, useAgents } from '@/store/agents';
import { openAskAgent } from '@/store/ask';
import { useUI } from '@/store/ui';
import { TypeText } from '@/components/ai/TypeText';
import { cn } from '@/lib/cn';
import { AgentBot } from './AgentBot';

/** Hover card: name, role, tools, what it did on this run, Ask {name}. */
export function AgentHoverCard({ id, did, children, align = 'center' }: { id: AgentId; did?: string; children: React.ReactNode; align?: 'center' | 'left' }) {
  const [open, setOpen] = useState(false);
  const name = useAgentName(id);
  const mode = useUI((s) => s.mode);
  const stats = useAgents((s) => s.stats[id]);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const a = AGENTS[id];
  const show = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(true), 180);
  };
  const hide = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), 120);
  };
  return (
    <span className="relative inline-flex" onPointerEnter={show} onPointerLeave={hide} onFocus={show} onBlur={hide}>
      {children}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.14 }}
            className={cn('absolute top-full z-50 mt-2 w-64 rounded-lg border border-line bg-surface p-3 text-left shadow-pop', align === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-0')}
          >
            <div className="text-sm font-semibold text-ink">
              {name} <span className="font-normal text-ink3">· {a.title}</span>
            </div>
            <p className="mt-0.5 text-xs leading-5 text-ink2">{mode === 'scientist' ? a.role : a.plainRole}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {a.tools.map((t) => (
                <span key={t} className="mono rounded border border-line bg-surface2 px-1 text-[10px] text-ink2">
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-2 text-2xs text-ink3">{did ?? (stats?.fills ? `${stats.fills} fields filled · ${(stats.confSum / stats.fills).toFixed(2)} avg confidence` : 'No work on this run yet')}</div>
            <button onClick={() => openAskAgent(id)} className="mt-2 rounded border border-line px-2 py-1 text-2xs font-medium text-ink hover:border-accent hover:text-accent">
              Ask {name}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

function CrewMember({ id, status, scope, index, celebrate, run }: { id: AgentId; status: AgentStatus; scope: string; index: number; celebrate: boolean; run: RunState }) {
  const name = useAgentName(id);
  const active = status === 'working';
  const done = status === 'done';
  const upcoming = status === 'queued' || status === 'idle';
  const f = run.fills[id];
  const did = f ? `Filled ${f.n} field${f.n === 1 ? '' : 's'} · ${(f.conf / f.n).toFixed(2)} avg confidence` : done ? 'Finished its part of this run' : upcoming ? 'Up next on this run' : undefined;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: upcoming && !celebrate ? 0.6 : 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index, 8) * 0.03 }}
      className="flex flex-col items-center"
    >
      <AgentHoverCard id={id} did={did}>
        <span className={cn('relative flex flex-col items-center rounded-md px-1 pt-1 transition-transform duration-200', active && 'scale-[1.15]')}>
          <AgentBot id={id} preset="compact" placement={`crew-${scope}`} status={celebrate ? 'working' : status} anchor={`${scope}:${id}`} />
          <span className={cn('mt-0.5 h-[2px] w-6 rounded-full', active ? 'bg-accent' : 'bg-transparent')} />
          {done && !celebrate && (
            <span className="absolute -right-0.5 top-0 grid h-3 w-3 place-items-center rounded-full bg-surface">
              <Check size={9} strokeWidth={3} className="text-accent" />
            </span>
          )}
        </span>
      </AgentHoverCard>
      <span className={cn('mt-0.5 max-w-[56px] truncate text-[10px] leading-3', active ? 'font-semibold text-ink' : 'text-ink3')}>{name}</span>
    </motion.div>
  );
}

/** Who's on this run: compact bots in plan order. Active hops, finished ✓, upcoming sleeps. */
export function CrewStrip({ run, className }: { run: RunState; className?: string }) {
  const [celebrate, setCelebrate] = useState(false);
  const prev = useRef(run.status);
  useEffect(() => {
    // end of run: one simultaneous hop; seeds make it ripple, not sync
    if (prev.current !== 'done' && run.status === 'done' && !run.skipped && run.crew.length > 1) {
      setCelebrate(true);
      const t = setTimeout(() => setCelebrate(false), 900);
      prev.current = run.status;
      return () => clearTimeout(t);
    }
    prev.current = run.status;
  }, [run.status, run.skipped, run.crew.length]);

  const latestJoin = [...run.lines].reverse().find((l) => l.kind === 'JOIN');
  const joining = latestJoin && run.status === 'running' && run.lines.length - run.lines.indexOf(latestJoin) <= 2;
  const latestName = latestJoin?.agent ? AGENTS[latestJoin.agent].name : '';

  return (
    <div className={cn('flex flex-wrap items-end gap-x-1.5 gap-y-2', className)} aria-label="Agents on this run">
      <AnimatePresence initial={false}>
        {run.crew.map((id, i) => (
          <CrewMember key={id} id={id} index={i} scope={run.id} status={run.crewStatus[id] ?? 'queued'} celebrate={celebrate} run={run} />
        ))}
      </AnimatePresence>
      {joining && latestJoin && (
        <span className="mb-4 ml-2 min-w-0 truncate text-xs text-ink2">
          <b className="font-semibold text-ink">{latestName}:</b> <TypeText inline text={latestJoin.text} id={`join:${latestJoin.id}`} />
        </span>
      )}
    </div>
  );
}

/** Overlapping stack of compact bots (projects list, top bar). Only agents in `animate` move. */
export function CrewStack({ ids, animate = [], max = 5, size = 26, scope }: { ids: AgentId[]; animate?: AgentId[]; max?: number; size?: number; scope: string }) {
  const shown = ids.slice(0, max);
  const extra = ids.length - shown.length;
  return (
    <span className="inline-flex items-center">
      {shown.map((id, i) => (
        <span key={id} className="relative rounded-full bg-surface ring-2 ring-surface" style={{ marginLeft: i ? -8 : 0, zIndex: shown.length - i }}>
          <AgentBot id={id} preset="compact" placement={`stack-${scope}`} size={size} quiet status={animate.includes(id) ? 'working' : 'idle'} />
        </span>
      ))}
      {extra > 0 && <span className="mono ml-1 text-2xs text-ink3">+{extra}</span>}
    </span>
  );
}
