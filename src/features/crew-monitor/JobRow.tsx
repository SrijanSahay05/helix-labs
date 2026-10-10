import { motion } from 'framer-motion';
import { Check, ExternalLink, Pause, Play, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AgentBadge } from '@/components/agents/AgentBadge';
import { AgentBot } from '@/components/agents/AgentBot';
import { HelixOrb } from '@/components/ai/HelixOrb';
import { agent } from '@/agent/engine';
import { startAnalysis, startLiterature, startPathways, startTrials } from '@/agent/controller';
import { useProjects } from '@/store/project';
import { agentName } from '@/store/agents';
import { cn } from '@/lib/cn';
import { EASE } from '@/lib/motion';
import { useCrewMonitor, useLatestTrace, type Job } from './selectors';
import { TraceLine } from './TraceLine';

const ROW = { layout: true, initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -6 }, transition: { duration: 0.22, ease: EASE } } as const;

function eta(job: Job) {
  if (job.status === 'paused') return 'paused';
  if (job.etaSec !== undefined) return job.etaSec >= 60 ? `~${Math.round(job.etaSec / 60)}m` : `~${Math.max(1, job.etaSec)}s`;
  return job.step ? `${job.step.index}/${job.step.total}` : '–';
}

/** Running job: owner bot (working) + activity orb, title, agent · project, ETA, progress, steps on hover. */
export function JobRow({ job, top, compact }: { job: Job; top: boolean; compact?: boolean }) {
  const nav = useNavigate();
  const trace = useLatestTrace(top ? job.id : undefined);
  const [hover, setHover] = useState(false);
  const sub = `${agentName(job.ownerAgent)} · ${job.projectName}`;
  return (
    <motion.div {...ROW} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} className="group rounded-lg px-2 py-2 hover:bg-surface2/70">
      <button onClick={() => nav(job.href)} className="grid w-full grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-x-2.5 text-left" title={`${job.title} — ${sub}`}>
        <AgentBadge id={job.ownerAgent} preset="compact" size={24} placement={`monitor-${job.id}`} status={job.status === 'paused' ? 'paused' : 'working'} orb={job.orb} />
        <span className="min-w-0">
          <span className="block truncate text-[12px] font-semibold leading-4 text-ink">{job.title}</span>
          <span className="block truncate text-[11px] leading-4 text-ink2">{sub}</span>
        </span>
        <span className="mono self-start pt-px text-[10.5px] leading-4 text-ink3">{eta(job)}</span>
      </button>
      <div className="relative mt-2 h-[3px] overflow-hidden rounded-full bg-surface2" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={job.progress === null ? undefined : Math.round(job.progress * 100)} aria-label={`${job.title} progress`}>
        {job.progress === null ? (
          <span className="monitor-indeterminate absolute inset-y-0 w-[30%] rounded-full bg-accent" />
        ) : (
          <motion.span className="monitor-shimmer absolute inset-y-0 left-0 rounded-full bg-accent" animate={{ width: `${Math.max(4, job.progress * 100)}%` }} transition={{ type: 'spring', stiffness: 120, damping: 24 }} />
        )}
      </div>
      {top && !compact && <TraceLine text={trace} />}
      <motion.div initial={false} animate={{ height: hover ? 'auto' : 0, opacity: hover ? 1 : 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
        <div className="flex items-center gap-2 pt-2">
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1" aria-label="Steps">
            {job.steps.map((s, i) => (
              <span key={i} title={s.text} className="grid h-3.5 w-3.5 place-items-center">
                {s.status === 'running' ? <HelixOrb state={job.orb} size={20} className="scale-[0.7]" /> : <span className={cn('h-1.5 w-1.5 rounded-full', s.status === 'pending' ? 'border border-ink3' : s.status === 'warn' ? 'bg-borderline' : 'bg-accent')} />}
              </span>
            ))}
          </span>
          <button onClick={() => (job.status === 'paused' ? agent.resume(job.id) : agent.pause(job.id))} className="grid h-6 w-6 place-items-center rounded-md text-ink2 hover:bg-surface hover:text-ink" title={job.status === 'paused' ? 'Resume' : 'Pause'} aria-label={job.status === 'paused' ? 'Resume' : 'Pause'}>
            {job.status === 'paused' ? <Play size={12} /> : <Pause size={12} />}
          </button>
          <button onClick={() => nav(job.href)} className="grid h-6 w-6 place-items-center rounded-md text-ink2 hover:bg-surface hover:text-ink" title="Open" aria-label="Open">
            <ExternalLink size={12} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function retry(job: Job) {
  if (!job.projectId) return;
  const base = (job.stage ?? '').split('-')[0];
  const p = useProjects.getState().projects.find((x) => x.id === job.projectId);
  if (base === 'literature') startLiterature(job.projectId);
  else if (base === 'pathways') startPathways(job.projectId);
  else if (base === 'trials' && p?.selectedPathway) startTrials(job.projectId, p.selectedPathway);
  else if (base === 'analysis') startAnalysis(job.projectId);
}

/** Just finished (10 min, until opened): ✓ + output + Review — or Failed + Retry. */
export function FinishedRow({ job }: { job: Job }) {
  const nav = useNavigate();
  const markOpened = useCrewMonitor((s) => s.open);
  const failed = job.status === 'failed';
  const [hop, setHop] = useState(!failed);
  useEffect(() => {
    if (!hop) return;
    const t = setTimeout(() => setHop(false), 700);
    return () => clearTimeout(t);
  }, [hop]);
  const label = failed ? 'Failed' : job.outputLabel ? job.outputLabel : `${job.title} ready`;
  const open = () => {
    markOpened(job.id);
    nav(job.href);
  };
  return (
    <motion.div {...ROW} className={cn('grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-x-2.5 rounded-lg px-2 py-2', failed ? 'bg-[var(--fail-soft)]' : 'bg-[color-mix(in_srgb,var(--pass)_6%,transparent)]')}>
      <span className="relative">
        <AgentBot id={job.ownerAgent} preset="compact" size={24} placement={`monitor-done-${job.id}`} status={failed ? 'failed' : hop ? 'working' : 'idle'} />
        {!failed && (
          <span className="absolute -bottom-1 -right-1 grid h-3.5 w-3.5 place-items-center rounded-full bg-surface">
            <Check size={9} strokeWidth={3} className="text-pass" />
          </span>
        )}
      </span>
      <button onClick={open} className="min-w-0 text-left" title={`${label} — ${job.projectName}`}>
        <span className={cn('block truncate text-[12px] font-semibold leading-4', failed ? 'text-fail' : 'text-ink')}>{failed ? `${job.title} · Failed` : label}</span>
        <span className="block truncate text-[11px] leading-4 text-ink2">
          {agentName(job.ownerAgent)} · {job.projectName}
        </span>
      </button>
      {failed ? (
        <button onClick={() => (markOpened(job.id), retry(job))} className="flex h-6 items-center gap-1 rounded-md bg-surface px-2 text-[11px] font-medium text-fail ring-1 ring-fail/30 hover:bg-[var(--fail-soft)]">
          <RotateCcw size={10} /> Retry
        </button>
      ) : (
        <button onClick={open} className="h-6 rounded-md bg-accent-soft px-2 text-[11px] font-semibold text-accent hover:brightness-95">
          Review
        </button>
      )}
    </motion.div>
  );
}
