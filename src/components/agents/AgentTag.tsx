import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { AGENTS, type AgentId, type AgentStatus } from '@/agents/registry';
import { useAgentName } from '@/store/agents';
import { useUI } from '@/store/ui';
import { cn } from '@/lib/cn';
import { AgentBot } from './AgentBot';

/** Inline signature: `[micro bot] Iris · Reader`. Used in log lines, field chips, comments and citations. */
export function AgentTag({
  id,
  placement,
  status,
  title = true,
  prefix,
  done,
  size = 18,
  className,
}: {
  id: AgentId;
  placement: string;
  status?: AgentStatus;
  /** show "· Reader" after the name */
  title?: boolean;
  /** e.g. "Filled by" */
  prefix?: ReactNode;
  done?: boolean;
  size?: number;
  className?: string;
}) {
  const name = useAgentName(id);
  const mode = useUI((s) => s.mode);
  const a = AGENTS[id];
  return (
    <span className={cn('inline-flex min-w-0 items-center gap-1 align-middle text-[12px] leading-4', className)} title={mode === 'scientist' ? a.role : a.plainRole}>
      <AgentBot id={id} preset="micro" placement={placement} status={status ?? 'idle'} size={size} />
      <span className="truncate">
        {prefix && <span className="text-ink3">{prefix} </span>}
        <b className="font-semibold text-ink">{name}</b>
        {title && <span className="text-ink3"> · {a.title}</span>}
      </span>
      {done && <Check size={11} strokeWidth={3} className="shrink-0 text-accent" />}
    </span>
  );
}

/** Humans get round initials avatars; agents always get bots. */
export function HumanAvatar({ name, size = 20, className }: { name: string; size?: number; className?: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((x) => x[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      title={name}
      className={cn('inline-grid shrink-0 place-items-center rounded-full bg-surface2 font-semibold text-ink2 ring-1 ring-line', className)}
      style={{ width: size, height: size, fontSize: Math.max(8, Math.round(size * 0.42)) }}
    >
      {initials}
    </span>
  );
}
