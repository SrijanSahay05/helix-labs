import { HelixOrb } from '@/components/ai/HelixOrb';
import { AgentBot } from '@/components/agents/AgentBot';
import { Button } from '@/components/ui/Button';
import { openAskAgent } from '@/store/ask';
import { useGraphsRuntime } from '../store';
import type { VizCtx } from './common';

/** Never a blank flash: the previous render stays (dimmed) under this overlay while the worker fits. */
export function FittingOverlay({ ctx, error, what }: { ctx: VizCtx; error?: string; what: string }) {
  const retry = useGraphsRuntime((s) => s.retry);
  const set = useGraphsRuntime((s) => s.set);
  const n = ctx.ds.trials.filter((t) => t.status === 'complete').length;
  if (error)
    return (
      <div className="absolute inset-0 grid place-items-center">
        <div role="alert" className="flex max-w-sm items-start gap-3 rounded-lg border border-fail/30 bg-[var(--fail-soft)] p-4">
          <AgentBot id="analyst" preset="compact" size={36} placement="graphs-error" status="failed" />
          <div className="text-sm">
            <div className="font-semibold text-fail">Couldn't fit the model</div>
            <div className="text-xs text-ink2">{error}</div>
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={() => set({ retry: retry + 1, fitError: undefined })}>
                Retry
              </Button>
              <Button size="sm" variant="ghost" onClick={() => openAskAgent('analyst', `why couldn't you fit the model? (${error})`)}>
                Ask Delta
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center">
      <div className="flex flex-col items-center gap-2 rounded-xl bg-surface/70 px-5 py-4 backdrop-blur-[2px]">
        <HelixOrb state="solving" size={64} />
        <span className="text-sm text-ink2">
          {what} on {n} trials…
        </span>
      </div>
    </div>
  );
}
