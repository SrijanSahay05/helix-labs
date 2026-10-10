import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Lock, XCircle } from 'lucide-react';
import { TypeText } from '@/components/ai/TypeText';
import { AgentBot } from '@/components/agents/AgentBot';
import type { AgentId } from '@/agents/registry';
import { openAskAgent } from '@/store/ask';
import { useAgentName } from '@/store/agents';
import { Button } from './Button';
import { Skeleton } from './primitives';

export type FrameState = 'empty' | 'running' | 'complete' | 'failed' | 'low-confidence' | 'read-only';

/** Shared treatment for empty / running / complete / failed / low-confidence / read-only states. */
export function StateFrame({
  state,
  message,
  action,
  onRetry,
  onAsk,
  items,
  children,
  agent = 'conductor',
}: {
  /** the agent this state belongs to: it sleeps in empty states, explains failures, looks around when unsure */
  agent?: AgentId;
  state: FrameState;
  message?: string;
  action?: ReactNode;
  onRetry?: () => void;
  onAsk?: () => void;
  items?: string[];
  children?: ReactNode;
}) {
  const name = useAgentName(agent);
  if (state === 'empty')
    return (
      <div className="agent-grid flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-line px-6 py-14 text-center">
        <AgentBot id={agent} preset="hero" size={120} placement={`empty-${message ?? ''}`} status="queued" wakeOnHover override={{ shading: 'fabric' }} />
        <TypeText inline text={message ?? 'Nothing here yet.'} className="max-w-md font-display text-[19px] leading-7 text-ink2" />
        {action}
      </div>
    );
  if (state === 'running')
    return (
      <div className="space-y-2 p-1">
        {children}
        {[0.9, 0.75, 0.82, 0.6].map((w, i) => (
          <div key={i} style={{ width: `${w * 100}%` }}>
            <Skeleton className="h-7" />
          </div>
        ))}
      </div>
    );
  if (state === 'failed')
    return (
      <div className="flex items-start gap-3 rounded-lg border border-fail/30 bg-[var(--fail-soft)] p-4">
        <AgentBot id={agent} preset="compact" size={36} placement="failed" status="failed" />
        <div className="flex-1">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-fail">
            <XCircle size={14} /> Failed <span className="font-normal text-ink3">· {name}</span>
          </div>
          <TypeText text={message ?? 'Something went wrong.'} className="text-sm text-ink2" />
          <div className="mt-3 flex gap-2">
            {onRetry && (
              <Button size="sm" onClick={onRetry}>
                Retry
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={onAsk ?? (() => openAskAgent(agent, 'why did this fail?'))}>
              Ask {name}
            </Button>
          </div>
        </div>
      </div>
    );
  if (state === 'low-confidence')
    return (
      <div className="flex items-start gap-3 rounded-lg border border-borderline/30 bg-[var(--borderline-soft)] p-4">
        <AgentBot id={agent} preset="compact" size={36} placement="lowconf" status="low-confidence" />
        <div className="flex-1">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-borderline">
            <AlertTriangle size={14} /> Low confidence <span className="font-normal text-ink3">· {name}</span>
          </div>
          {message && <p className="text-sm text-ink2">{message}</p>}
          {items && (
            <ul className="mt-1 list-disc pl-5 text-sm text-ink2">
              {items.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          )}
          {action && <div className="mt-3">{action}</div>}
        </div>
      </div>
    );
  if (state === 'read-only')
    return (
      <div>
        <div className="mb-2 flex items-center gap-2 rounded-md border border-line bg-surface2 px-3 py-1.5 text-xs text-ink2">
          <Lock size={12} /> Read-only{message ? ` · ${message}` : ''}
        </div>
        {children}
      </div>
    );
  return (
    <div className="flex items-center gap-2 text-sm text-ink2">
      <CheckCircle2 size={14} className="text-accent" />
      {message}
      {action}
    </div>
  );
}
