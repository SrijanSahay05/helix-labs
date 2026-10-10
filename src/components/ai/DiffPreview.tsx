import { Check, Pencil, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import type { AgentId } from '@/agents/registry';
import { agentName } from '@/store/agents';
import { AgentBadge } from '@/components/agents/AgentBadge';

export interface DiffItem {
  label: string;
  from: string;
  to: string;
}

/** Agent-proposed change: old → new with Accept / Reject / Edit. */
export function DiffPreview({
  title,
  items,
  state = 'open',
  onAccept,
  onReject,
  onEdit,
  className,
  agent = 'conductor',
}: {
  /** the agent proposing the change signs the card */
  agent?: AgentId;
  title?: string;
  items: DiffItem[];
  state?: 'open' | 'accepted' | 'rejected';
  onAccept?: () => void;
  onReject?: () => void;
  onEdit?: () => void;
  className?: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={cn('rounded-lg border border-line bg-surface', className)}>
      {title && (
        <div className="flex items-center gap-2 border-b border-line px-3 py-2 text-xs font-semibold">
          <AgentBadge id={agent} preset="compact" size={24} placement={`diff-${title}`} status={state === 'open' ? 'working' : 'idle'} orb="shaping" hideOrb={state !== 'open'} />
          <span>
            {title}
            <span className="ml-1 font-normal text-ink3">· proposed by {agentName(agent)}</span>
          </span>
          {state !== 'open' && <span className={cn('ml-auto text-2xs', state === 'accepted' ? 'text-pass' : 'text-ink3')}>{state === 'accepted' ? 'Accepted' : 'Rejected'}</span>}
        </div>
      )}
      <div className="divide-y divide-line">
        {items.map((it, i) => (
          <div key={i} className="mono flex items-center gap-2 px-3 py-1.5 text-xs">
            <span className="w-40 shrink-0 truncate font-sans text-ink2">{it.label}</span>
            <span className="rounded bg-[var(--fail-soft)] px-1 text-fail line-through">{it.from}</span>
            <span className="text-ink3">→</span>
            <span className="rounded bg-[var(--pass-soft)] px-1 font-semibold text-pass">{it.to}</span>
          </div>
        ))}
      </div>
      {state === 'open' && (onAccept || onReject || onEdit) && (
        <div className="flex gap-1.5 border-t border-line px-3 py-2">
          {onAccept && (
            <button onClick={onAccept} className="inline-flex items-center gap-1 rounded bg-accent px-2 py-1 text-xs font-medium text-on-accent">
              <Check size={12} /> Accept
            </button>
          )}
          {onReject && (
            <button onClick={onReject} className="inline-flex items-center gap-1 rounded border border-line px-2 py-1 text-xs">
              <X size={12} /> Reject
            </button>
          )}
          {onEdit && (
            <button onClick={onEdit} className="inline-flex items-center gap-1 rounded border border-line px-2 py-1 text-xs">
              <Pencil size={12} /> Edit
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
