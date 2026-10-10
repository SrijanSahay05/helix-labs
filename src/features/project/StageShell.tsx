import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, MessageSquare } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { StageId, StageStatus } from '@/types';
import { StagePill, Tag } from '@/components/ui/Pill';
import type { OrbState } from '@/components/ai/HelixOrb';
import { AgentBadge } from '@/components/agents/AgentBadge';
import { AgentBot } from '@/components/agents/AgentBot';
import { AGENTS, STAGE_OWNER, type AgentStatus } from '@/agents/registry';
import { useAgentName } from '@/store/agents';
import { TypeText } from '@/components/ai/TypeText';
import { ProgressBar } from '@/components/ui/primitives';
import { useStageRun } from '@/agent/useAgentRun';
import { T } from '@/lib/useModeText';
import { elapsed } from '@/lib/format';
import { cn } from '@/lib/cn';
import { EASE } from '@/lib/motion';
import { CommentsThread } from './Comments';

export const STAGE_ORB: Record<StageId, OrbState> = {
  literature: 'searching',
  pathways: 'weaving',
  trials: 'shaping',
  results: 'listening',
  analysis: 'solving',
  final: 'breathing',
};

export function StageShell({
  n,
  id,
  projectId,
  status,
  note,
  open,
  onToggle,
  children,
  right,
  frozen,
}: {
  n: number;
  id: StageId;
  projectId: string;
  status: StageStatus;
  note?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  right?: ReactNode;
  /** read-only project: bots stay still */
  frozen?: boolean;
}) {
  const run = useStageRun(projectId, id);
  const active = run && (run.status === 'running' || run.status === 'paused');
  // 'running' means the human is up next for these two stages, not the agent
  const special = status === 'running' && !active ? (id === 'results' ? 'Awaiting lab' : id === 'final' ? 'Ready to lock' : undefined) : undefined;
  const orb = active ? run.orb : STAGE_ORB[id];
  const [showComments, setShowComments] = useState(false);
  const owner = STAGE_OWNER[id];
  const ownerName = useAgentName(owner);
  const ownerStatus: AgentStatus =
    status === 'waiting'
      ? 'queued'
      : status === 'failed'
        ? 'failed'
        : status === 'low-confidence'
          ? 'low-confidence'
          : status === 'complete'
            ? 'idle'
            : active
              ? run.status === 'paused'
                ? 'paused'
                : 'working'
              : special
                ? 'waiting'
                : 'working';
  const duration = run ? elapsed((run.endedAt ?? Date.now()) - run.startedAt) : undefined;
  return (
    <section id={id} className={cn('card scroll-mt-[120px]', status === 'running' && 'border-accent/40')}>
      <div className="flex min-h-[72px] w-full items-center gap-3 px-5 py-3 text-left">
        {/* fixed columns (number · owner · title · status) so every stage header lines up */}
        <button onClick={onToggle} className="grid min-w-0 flex-1 grid-cols-[28px_40px_minmax(0,200px)_132px_minmax(0,1fr)] items-center gap-x-4 text-left">
          <span className="mono grid h-7 w-7 shrink-0 place-items-center rounded-md bg-surface2 text-xs font-semibold text-ink2">{n}</span>
          <span className="relative inline-flex items-center" title={`${ownerName} · ${AGENTS[owner].title}`}>
            <AgentBadge id={owner} preset="console" size={40} placement={`stage-${projectId}-${id}`} status={ownerStatus} orb={special ? STAGE_ORB[id] : orb} anchor={`project:${projectId}:${owner}`} frozen={frozen} />
            {status === 'complete' && (
              <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-surface shadow-card">
                <Check size={10} strokeWidth={3} className="text-accent" />
              </span>
            )}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-display text-[22px] font-semibold leading-7">
              <T k={`stage.${id}` as const} />
            </span>
            <span className="flex items-center gap-1 text-2xs text-ink3">
              {ownerName} · {AGENTS[owner].title}
              {id === 'final' && (
                <>
                  <span>+</span>
                  <AgentBot id="conductor" preset="micro" placement={`stage-final-${projectId}`} size={14} />
                  Helix
                </>
              )}
            </span>
          </span>
          <span className="flex">{special ? <Tag tone="accent">{special}</Tag> : <StagePill status={status} orb={orb} hideOrb />}</span>
          <span className="min-w-0 truncate text-sm text-ink2" title={note}>{note && <TypeText inline text={note} id={`note:${id}:${note}`} />}</span>
        </button>
        {right}
        {duration && <span className="mono hidden text-2xs text-ink3 md:inline">{duration}</span>}
        <button onClick={() => setShowComments((s) => !s)} className="grid h-8 w-8 place-items-center rounded-md text-ink3 hover:bg-surface2 hover:text-ink" title="Comments" aria-label="Comments">
          <MessageSquare size={14} />
        </button>
        <button onClick={onToggle} className="grid h-8 w-8 place-items-center rounded-md text-ink3 hover:bg-surface2" aria-label={open ? 'Collapse stage' : 'Expand stage'}>
          <ChevronDown size={16} className={cn('transition-transform', open && 'rotate-180')} />
        </button>
      </div>
      {status === 'running' && <ProgressBar value={run?.progress ?? 0.1} />}
      {showComments && (
        <div className="border-t border-line bg-surface2/50 px-4 py-3">
          <CommentsThread projectId={projectId} target={`stage:${id}`} />
        </div>
      )}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.26, ease: EASE }}>
            <div className="border-t border-line p-4 md:p-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
