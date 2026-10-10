import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState, type ReactNode } from 'react';
import type { AIMeta } from '@/types';
import { bus } from '@/agent/bus';
import { cn } from '@/lib/cn';
import { openAskAgent } from '@/store/ask';
import { useAgentName } from '@/store/agents';
import { useUI } from '@/store/ui';
import { AGENTS, agentForPath, type AgentId } from '@/agents/registry';
import { AgentBot } from '@/components/agents/AgentBot';
import { HumanAvatar } from '@/components/agents/AgentTag';
import { HelixOrb } from './HelixOrb';
import { TypeText } from './TypeText';
import { ConfidenceMeter } from './ConfidenceMeter';
import { Popover } from '@/components/ui/primitives';

const fillCount = new Map<string, number>();

export type AIFieldState = 'idle' | 'pending' | 'filling' | 'filled' | 'edited' | 'low-confidence';

/** Hook: animate when the agent fills `path`. Returns 'filling' | 'fresh' | null. */
export function useFillPhase(path: string) {
  const [phase, setPhase] = useState<'filling' | 'fresh' | null>(null);
  useEffect(
    () =>
      bus.on('fill', (e) => {
        if (e.path !== path) return;
        if (e.instant) return setPhase('fresh');
        fillCount.set(path, (fillCount.get(path) ?? 0) + 1);
        setPhase('filling');
      }),
    [path],
  );
  useEffect(() => {
    if (phase === 'fresh') {
      const t = setTimeout(() => setPhase(null), 3000);
      return () => clearTimeout(t);
    }
  }, [phase]);
  return [phase, setPhase] as const;
}

/** Which agent signed a value: the stored signature, or the owner of that field for older values. */
export function metaAgent(meta: AIMeta, path?: string): AgentId {
  return meta.agent ?? agentForPath(path);
}

export function AIChip({ meta, label, path, onAccept, onChange }: { meta: AIMeta; label?: string; path?: string; onAccept?: () => void; onChange?: () => void }) {
  const edited = meta.by === 'user';
  const id = metaAgent(meta, path);
  const name = useAgentName(id);
  const user = useUI((s) => s.userName);
  const low = !edited && (meta.confidence ?? 1) < 0.7;
  return (
    <Popover
      align="right"
      width={300}
      trigger={() => (
        <button
          type="button"
          className={cn(
            'inline-flex h-5 items-center gap-1 rounded pl-0.5 pr-1.5 text-[10px] font-semibold transition-colors',
            edited ? 'bg-surface2 text-ink3' : 'bg-accent-soft text-accent hover:brightness-95',
          )}
          title={edited ? 'Edited by you' : `Filled by ${name}`}
        >
          {edited ? <HumanAvatar name={user} size={16} /> : <AgentBot id={id} preset="micro" placement={`chip-${path ?? label ?? ''}`} status={low ? 'low-confidence' : 'idle'} size={16} />}
          {edited ? 'Edited by you' : `Filled by ${name}`}
        </button>
      )}
    >
      {(close) =>
        edited ? (
          <div className="flex items-start gap-2 text-xs text-ink2">
            <HumanAvatar name={user} size={24} />
            <span>You changed this value. The crew will treat it as a hard requirement.</span>
          </div>
        ) : (
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <AgentBot id={id} preset="compact" placement={`chip-pop-${path ?? label ?? ''}`} status={low ? 'low-confidence' : 'idle'} />
              <span className="min-w-0">
                <span className="block font-semibold text-ink">
                  {name} <span className="font-normal text-ink3">· {AGENTS[id].title}</span>
                </span>
                <span className="block text-2xs text-ink3">Filled this value</span>
              </span>
              {meta.confidence !== undefined && <ConfidenceMeter value={meta.confidence} className="ml-auto" />}
            </div>
            {meta.source && (
              <div className="text-ink2">
                from <i className="text-ink">{meta.source}</i>
              </div>
            )}
            {meta.reason && <div className="text-ink2">Reason: {meta.reason}</div>}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button className="rounded bg-accent px-2 py-1 font-medium text-on-accent" onClick={() => (onAccept?.(), close())}>
                Accept
              </button>
              <button className="rounded border border-line px-2 py-1" onClick={() => (onChange?.(), close())}>
                Change
              </button>
              <button
                className="rounded border border-line px-2 py-1"
                onClick={() => {
                  openAskAgent(id, `why did you set ${label ?? 'this field'}?`, [label ?? 'field']);
                  close();
                }}
              >
                Ask {name} why
              </button>
            </div>
          </div>
        )
      }
    </Popover>
  );
}

/**
 * Wraps any input the agent can fill. The field shimmers, the value types in,
 * then a ✦ Helix chip remains. User edits flip it to "Edited by you".
 */
export function AIField({
  path,
  label,
  meta,
  display,
  pending,
  children,
  className,
  compact,
  onAccept,
}: {
  path: string;
  label?: ReactNode;
  meta?: AIMeta;
  display?: string;
  pending?: boolean;
  children: ReactNode;
  className?: string;
  compact?: boolean;
  onAccept?: () => void;
}) {
  const [phase, setPhase] = useFillPhase(path);
  const low = meta?.by === 'helix' && (meta.confidence ?? 1) < 0.7;
  const labelText = typeof label === 'string' ? label : path;

  return (
    <div className={cn('group relative flex min-w-0 flex-col gap-1.5', className)} data-ai-path={path} data-lowconf={low ? 'true' : undefined}>
      {label && (
        <div className="flex items-center justify-between gap-2">
          <span className="label">{label}</span>
          <AnimatePresence>
            {meta && phase !== 'filling' && (
              <motion.span initial={{ opacity: 0, x: 4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <AIChip meta={meta} label={labelText} path={path} onAccept={onAccept} onChange={() => document.querySelector<HTMLElement>(`[data-ai-path="${path}"] input, [data-ai-path="${path}"] select, [data-ai-path="${path}"] button:not([title])`)?.focus()} />
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      )}
      <div
        className={cn(
          'relative rounded-md',
          phase === 'filling' && 'ai-shimmer bg-accent-soft ring-1 ring-accent',
          phase === 'fresh' && 'ai-fresh',
          low && 'pb-0.5',
        )}
      >
        {pending ? (
          <div className="flex h-8 items-center gap-2 rounded-md border border-dashed border-line px-2">
            <HelixOrb state="listening" size={20} />
            <div className="skeleton h-3 flex-1" />
          </div>
        ) : (
          children
        )}
        {phase === 'filling' && (
          <div className="absolute inset-0 z-10 flex items-center rounded-md bg-accent-soft px-2.5 text-sm text-ink backdrop-blur-[2px]">
            <TypeText inline text={display ?? '…'} instant={!display} id={`${path}:${display}:${fillCount.get(path) ?? 0}`} onDone={() => setTimeout(() => setPhase('fresh'), 250)} />
          </div>
        )}
        {low && <div className="pointer-events-none absolute -bottom-0.5 left-1 right-1 border-b border-dashed border-borderline" />}
      </div>
      {low && !compact && <span className="text-2xs font-medium text-borderline">Low confidence — please check</span>}
      {!label && meta && phase !== 'filling' && (
        <span className="absolute -top-2 right-1 z-10">
          <AIChip meta={meta} label={labelText} path={path} onAccept={onAccept} />
        </span>
      )}
    </div>
  );
}
