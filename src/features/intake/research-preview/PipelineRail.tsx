import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Fragment, useEffect, useRef, useState } from 'react';
import type { ResearchData } from '@/data/demo/research';
import type { AgentStatus } from '@/agents/registry';
import { AgentBot } from '@/components/agents/AgentBot';
import { HelixOrb } from '@/components/ai/HelixOrb';
import { cn } from '@/lib/cn';
import { LIT_COUNT, STEPS } from './script';
import { usePlayback } from './store';
import { useScientist } from './shared';

function NodeBtn({ i, data, compact }: { i: number; data: ResearchData; compact: boolean }) {
  const sci = useScientist();
  const step = usePlayback((s) => s.step);
  const playing = usePlayback((s) => s.playing);
  const goto = usePlayback((s) => s.goto);
  const def = STEPS[i];
  const state = step > i ? 'done' : step === i ? 'running' : 'pending';
  return (
    <button
      type="button"
      onClick={() => goto(i)}
      aria-current={state === 'running' ? 'step' : undefined}
      aria-label={`${def.label}: ${state}${state === 'done' ? `, ${def.metric(data)}` : ''}`}
      title={state === 'done' ? def.metric(data) : undefined}
      className={cn('group flex h-12 shrink-0 items-center rounded-lg text-left outline-none transition-colors hover:bg-surface2 focus-visible:shadow-glow', compact ? 'gap-1 px-0.5' : 'gap-1.5 px-1')}
    >
      <span className="grid h-5 w-5 shrink-0 place-items-center">
        {state === 'running' ? (
          <HelixOrb state={def.orb} size={20} paused={!playing} />
        ) : state === 'done' ? (
          <span className="grid h-[18px] w-[18px] place-items-center rounded-full bg-accent text-on-accent">
            <Check size={11} strokeWidth={3} />
          </span>
        ) : (
          <span className="h-3.5 w-3.5 rounded-full border-[1.5px] border-ink3" />
        )}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className={cn('whitespace-nowrap text-xs font-semibold leading-4', state === 'pending' ? 'text-ink3' : 'text-ink')}>{sci ? def.label : def.plain}</span>
        {!compact && <span className={cn('mono h-[14px] whitespace-nowrap text-[10px] leading-[14px]', state === 'done' ? 'text-ink2' : 'text-transparent')}>{state === 'done' ? def.metric(data) : '·'}</span>}
      </span>
    </button>
  );
}

function Link({ on }: { on: boolean }) {
  return <span className={cn('h-px min-w-1 flex-1 transition-colors duration-300', on ? 'bg-accent' : 'bg-line')} aria-hidden />;
}

/** 10 nodes in one line: Lumen's six literature steps, the handoff, Weave's four pathway steps. */
export function PipelineRail({ data, lumen, weave }: { data: ResearchData; lumen: AgentStatus; weave: AgentStatus }) {
  const step = usePlayback((s) => s.step);
  const handed = step >= LIT_COUNT;
  const ref = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setCompact(e.contentRect.width < 1040));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <nav aria-label="Research pipeline" className="sticky top-[68px] z-20 rounded-xl border border-line bg-surface/95 shadow-card backdrop-blur-md">
      <div ref={ref} className={cn('scroll-thin flex h-14 items-center overflow-x-auto px-2', compact ? 'gap-0.5' : 'gap-1')}>
        <AgentBot id="scholar" preset="compact" size={28} placement="rp-rail-lumen" status={lumen} anchor="rp-rail:scholar" />
        {STEPS.slice(0, LIT_COUNT).map((_, i) => (
          <Fragment key={i}>
            {i > 0 && <Link on={step >= i} />}
            <NodeBtn i={i} data={data} compact={compact} />
          </Fragment>
        ))}
        <span className="relative mx-1 flex h-12 min-w-[36px] flex-[1.6] items-center" aria-label={handed ? 'Handoff: Lumen to Weave done' : 'Handoff pending'}>
          <span className="relative mt-3 h-1 w-full" aria-hidden>
            <span className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, var(--text-3) 1.2px, transparent 1.6px)', backgroundSize: '6px 4px', opacity: 0.6 }} />
            <motion.span className="absolute inset-y-0 left-0" style={{ backgroundImage: 'radial-gradient(circle, var(--accent) 1.4px, transparent 1.8px)', backgroundSize: '6px 4px' }} initial={false} animate={{ width: handed ? '100%' : '0%' }} transition={{ duration: 0.6 }} />
          </span>
          <span className={cn('absolute inset-x-0 top-0.5 text-center text-[10px] font-semibold', handed ? 'text-accent' : 'text-ink3')}>handoff</span>
        </span>
        <AgentBot id="weaver" preset="compact" size={28} placement="rp-rail-weave" status={weave} anchor="rp-rail:weaver" />
        {STEPS.slice(LIT_COUNT).map((_, k) => {
          const i = LIT_COUNT + k;
          return (
            <Fragment key={i}>
              {k > 0 && <Link on={step >= i} />}
              <NodeBtn i={i} data={data} compact={compact} />
            </Fragment>
          );
        })}
      </div>
    </nav>
  );
}
