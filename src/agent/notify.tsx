import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { HelixOrb } from '@/components/ai/HelixOrb';
import { AgentBot } from '@/components/agents/AgentBot';
import { navigateTo } from '@/app/navigation';
import { agentName } from '@/store/agents';
import type { AgentId } from '@/agents/registry';

/** The owner bot does one hop (working 700 ms → default) when its toast appears. */
function HopBot({ id, placement }: { id: AgentId; placement: string }) {
  const [hop, setHop] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setHop(false), 700);
    return () => clearTimeout(t);
  }, []);
  return <AgentBot id={id} preset="compact" placement={placement} status={hop ? 'working' : 'idle'} />;
}

/** Completion toast: owner bot + "Weave finished: …" + "Review results". */
export function notifyDone(title: string, href?: string, action = 'Review results', agent: AgentId = 'conductor', summary?: string) {
  const name = agentName(agent);
  toast.custom(
    (t) => (
      <div className="flex w-[360px] items-center gap-3 rounded-lg border border-line bg-surface p-3 shadow-pop">
        <HopBot id={agent} placement={`toast-${String(t)}`} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-ink">{summary ? `${name} finished: ${summary}` : title}</div>
          <div className="truncate text-2xs text-ink3">{summary ? title : `${name} · background job complete`}</div>
        </div>
        {href && (
          <button
            className="rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-on-accent"
            onClick={() => {
              navigateTo(href);
              toast.dismiss(t);
            }}
          >
            {action}
          </button>
        )}
      </div>
    ),
    { duration: 8000 },
  );
}

export function notifyRunning(title: string, agent: AgentId = 'conductor') {
  toast.custom(
    (t) => (
      <div className="flex w-[360px] items-center gap-3 rounded-lg border border-line bg-surface p-3 shadow-pop">
        <AgentBot id={agent} preset="compact" placement={`toast-${String(t)}`} status="working" />
        <div className="text-sm text-ink">{title}</div>
      </div>
    ),
    { duration: 3000 },
  );
}

/** Plain system notice — no agent did anything, so it gets an orb, not a bot. */
export function notifyInfo(title: string, agent?: AgentId) {
  toast.custom(
    (t) => (
      <div className="flex w-[360px] items-center gap-3 rounded-lg border border-line bg-surface p-3 shadow-pop">
        {agent ? <HopBot id={agent} placement={`toast-${String(t)}`} /> : <HelixOrb state="breathing" size={20} speed={0.7} />}
        <div className="text-sm text-ink">{title}</div>
      </div>
    ),
    { duration: 3000 },
  );
}
