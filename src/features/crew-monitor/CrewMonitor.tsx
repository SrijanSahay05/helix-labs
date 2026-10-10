import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AgentBot } from '@/components/agents/AgentBot';
import { CrewStack } from '@/components/agents/CrewStrip';
import { agent } from '@/agent/engine';
import { prefersReducedMotion } from '@/lib/motion';
import { cn } from '@/lib/cn';
import { useProjects } from '@/store/project';
import { useUI } from '@/store/ui';
import { NeedYouLine, AwaitingLabLine } from './AttentionLine';
import { FinishedRow, JobRow } from './JobRow';
import { useAwaitingLab, useCrewMonitor, useNeedsYou, useRecentlyFinished, useRunningJobs } from './selectors';

const MAX_ROWS = 3;

/**
 * Live instrument panel for the crew: who is working, on what, how far along, what just finished and what
 * needs the human. Animates only while work is happening.
 */
export function CrewMonitor({ variant = 'sidebar' }: { variant?: 'sidebar' | 'popover' }) {
  const running = useRunningJobs();
  const finished = useRecentlyFinished();
  const needs = useNeedsYou();
  const lab = useAwaitingLab();
  const projects = useProjects((s) => s.projects.length);
  const collapsedPref = useCrewMonitor((s) => s.collapsed);
  const setMon = useCrewMonitor((s) => s.set);
  const motionPref = useUI((s) => s.botMotion);
  const reduced = prefersReducedMotion() || motionPref === 'still';
  const collapsed = variant === 'sidebar' && collapsedPref;

  const active = running.filter((j) => j.status === 'running');
  const allPaused = running.length > 0 && active.length === 0;
  const ready = finished.filter((f) => f.status === 'complete').length;
  const failedN = finished.length - ready;
  const idle = running.length === 0 && finished.length === 0;
  const needsOnly = idle && needs.length > 0;

  const title = allPaused ? 'Paused' : running.length ? 'Crew at work' : needsOnly ? 'Waiting on you' : finished.length ? 'Crew finished' : 'Crew idle';
  const count = [running.length ? `${running.length} running` : '', ready ? `${ready} ready` : '', failedN ? `${failedN} failed` : ''].filter(Boolean).join(' · ');
  const shown = running.slice(0, MAX_ROWS);
  const hidden = running.slice(MAX_ROWS);

  return (
    <section aria-label="Crew monitor" className={cn('relative overflow-hidden rounded-xl border border-line bg-surface', variant === 'sidebar' && 'max-h-[340px]', variant === 'popover' && 'w-[256px] border-0')}>
      {/* activity hairline: only while something runs */}
      {active.length > 0 && !reduced && <span className="monitor-hairline pointer-events-none absolute inset-x-0 top-0 h-[2px]" aria-hidden />}

      <button onClick={() => variant === 'sidebar' && setMon({ collapsed: !collapsedPref })} aria-expanded={!collapsed} className="group flex h-11 w-full items-center gap-2.5 px-4 text-left">
        <span className="relative grid h-2 w-2 place-items-center">
          {active.length > 0 && !reduced && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />}
          <span className={cn('relative h-[7px] w-[7px] rounded-full', active.length || needsOnly ? 'bg-accent' : allPaused ? 'bg-borderline' : 'bg-ink3/60')} />
        </span>
        <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-ink">{title}</span>
        {count && <span className="mono shrink-0 text-[12px] text-ink2">{count}</span>}
        {variant === 'sidebar' && <ChevronDown size={14} className={cn('shrink-0 text-ink3 opacity-0 transition group-hover:opacity-100', collapsed && '-rotate-90')} />}
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="scroll-thin max-h-[268px] space-y-0.5 overflow-y-auto px-1 pb-1">
              {projects === 0 && idle ? (
                <div className="flex items-center gap-2 px-2 py-2 text-[12px] text-ink2">
                  No jobs yet ·{' '}
                  <Link to="/projects/new" className="font-medium text-accent hover:underline">
                    New formulation
                  </Link>
                </div>
              ) : idle && !needs.length ? (
                <div className="flex items-center gap-2.5 px-2 py-1.5">
                  <AgentBot id="conductor" preset="compact" size={28} placement="monitor-idle" status="queued" wakeOnHover override={{ interactive: true }} />
                  <span className="min-w-0 text-[11px] leading-4 text-ink2">
                    <span className="block font-medium text-ink">All caught up</span>
                    {projects} projects
                  </span>
                </div>
              ) : null}

              <AnimatePresence initial={false}>
                {shown.map((j, i) => (
                  <JobRow key={j.id} job={j} top={i === 0} />
                ))}
                {finished.slice(0, Math.max(1, MAX_ROWS - Math.min(shown.length, 2))).map((j) => (
                  <FinishedRow key={j.id} job={j} />
                ))}
              </AnimatePresence>

              {hidden.length > 0 && (
                <Link to="/tasks" className="flex h-8 items-center gap-2 rounded-lg px-2 text-[12px] text-ink2 hover:bg-surface2/70">
                  <CrewStack ids={hidden.map((h) => h.ownerAgent)} animate={[]} size={18} max={3} scope="monitor-more" />
                  +{hidden.length} more running
                </Link>
              )}
              {allPaused && (
                <button onClick={() => running.forEach((j) => agent.resume(j.id))} className="flex h-8 w-full items-center gap-1.5 rounded-lg px-2 text-[12px] font-medium text-accent hover:bg-accent-soft">
                  <Play size={12} /> Resume all
                </button>
              )}
            </div>
            {(needs.length > 0 || lab.length > 0) && (
              <div className="space-y-1 border-t border-line px-2 py-2">
                <NeedYouLine items={needs} highlight={needsOnly} />
                <AwaitingLabLine tests={lab} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="border-t border-line p-1.5">
        <Link to="/tasks" className="flex h-9 items-center justify-between rounded-lg px-2 text-[12px] font-medium text-ink2 transition-colors hover:bg-surface2 hover:text-ink">
          Open task queue
          <kbd className="mono rounded-md border border-line bg-surface2 px-1.5 py-0.5 text-[10px] shadow-sm">⌘⇧T</kbd>
        </Link>
      </div>
    </section>
  );
}
