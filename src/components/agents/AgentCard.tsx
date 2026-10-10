import { MessageSquare } from 'lucide-react';
import { AGENTS, type AgentId } from '@/agents/registry';
import { useAgentStatus } from '@/agents/useAgentStatus';
import { useAgentName, useAgents } from '@/store/agents';
import { openAskAgent } from '@/store/ask';
import { useUI } from '@/store/ui';
import { cn } from '@/lib/cn';
import { AgentBadge } from './AgentBadge';

export function relTime(at?: number) {
  if (!at) return 'never';
  const m = (Date.now() - at) / 60000;
  if (m < 1) return 'just now';
  if (m < 60) return `${Math.round(m)} min ago`;
  if (m < 1440) return `${Math.round(m / 60)} h ago`;
  return `${Math.round(m / 1440)} d ago`;
}

/** Agents page / hero card: bot, name, role, tools, stats, recent activity, Ask {name}. */
export function AgentCard({ id, onOpen }: { id: AgentId; onOpen?: () => void }) {
  const a = AGENTS[id];
  const name = useAgentName(id);
  const mode = useUI((s) => s.mode);
  const stats = useAgents((s) => s.stats[id]);
  const status = useAgentStatus(id);
  const avg = stats?.fills ? (stats.confSum / stats.fills).toFixed(2) : '—';
  return (
    <div className={cn('card flex flex-col p-5 transition-colors', status === 'working' && 'border-accent/40')}>
      <button onClick={onOpen} className="flex items-start gap-4 text-left" aria-label={`Open ${name}`}>
        {/* fixed box: hats, headphones and hops stay inside the card */}
        <span className="grid h-[96px] w-[96px] shrink-0 place-items-center">
          <AgentBadge id={id} preset="hero" size={84} placement="agents-page" />
        </span>
        <div className="min-w-0 flex-1 pt-1">
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-xl font-semibold leading-6">{name}</span>
            <span className="text-xs text-ink3">· {a.title}</span>
          </div>
          {/* two lines reserved so tools and stats line up across a row of cards */}
          <p className="mt-1 line-clamp-2 min-h-[40px] text-xs leading-5 text-ink2" title={mode === 'scientist' ? a.role : a.plainRole}>
            {mode === 'scientist' ? a.role : a.plainRole}
          </p>
          <div className="mt-1 text-2xs capitalize text-ink3">{status === 'idle' ? 'Idle' : status}</div>
        </div>
      </button>
      <div className="mt-4 flex min-h-[46px] flex-wrap content-start gap-1">
        {a.tools.map((t) => (
          <span key={t} className="mono rounded border border-line bg-surface2 px-1 text-[10px] text-ink2">
            {t}
          </span>
        ))}
      </div>
      <dl className="mt-3 grid grid-cols-4 gap-2 border-t border-line pt-3 text-center">
        {[
          ['Runs', stats?.runs ?? 0],
          ['Fields', stats?.fills ?? 0],
          ['Avg conf.', avg],
          ['Last active', relTime(stats?.lastActive)],
        ].map(([k, v]) => (
          <div key={k as string}>
            <dt className="text-[10px] text-ink3">{k}</dt>
            <dd className="mono truncate text-xs font-medium text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      <ul className="mt-3 min-h-[54px] space-y-0.5 text-2xs text-ink2">
        {(stats?.recent ?? []).slice(0, 3).map((r, i) => (
          <li key={i} className="truncate">
            <span className="mono text-ink3">{relTime(r.at)}</span> · {r.text}
          </li>
        ))}
        {!stats?.recent.length && <li className="text-ink3">No activity this session yet.</li>}
      </ul>
      <div className="mt-auto flex gap-2 pt-3">
        <button onClick={() => openAskAgent(id)} className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1 text-xs font-medium hover:border-accent hover:text-accent">
          <MessageSquare size={12} /> Ask {name}
        </button>
        {onOpen && (
          <button onClick={onOpen} className="rounded-md px-2.5 py-1 text-xs text-ink2 hover:bg-surface2">
            Details & settings
          </button>
        )}
      </div>
    </div>
  );
}
