import { AnimatePresence, motion } from 'framer-motion';
import { Check, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { EASE } from '@/lib/motion';
import { useMode } from '@/lib/useModeText';
import type { AgentId } from '@/agents/registry';

/** Rail nodes owned by an agent: anchors for handoff arcs (e.g. Delta → Batch on a new iteration). */
const NODE_AGENT: Partial<Record<FlowNode, AgentId>> = { literature: 'scholar', pathways: 'weaver', trials: 'mixer', results: 'lab', met: 'analyst', final: 'scribe' };

export type FlowNode = 'who' | 'category' | 'subcategory' | 'usecase' | 'brief' | 'literature' | 'pathways' | 'trials' | 'results' | 'met' | 'final';

const NODES: { id: FlowNode; scientist: string; plain: string }[] = [
  { id: 'who', scientist: 'Who', plain: 'Who' },
  { id: 'category', scientist: 'Category', plain: 'Product' },
  { id: 'subcategory', scientist: 'Subcategory', plain: 'Type' },
  { id: 'usecase', scientist: 'Use case', plain: 'Where used' },
  { id: 'brief', scientist: 'Brief review', plain: 'Brief' },
  { id: 'literature', scientist: 'Literature', plain: 'Research' },
  { id: 'pathways', scientist: 'Pathways', plain: 'Recipe ideas' },
  { id: 'trials', scientist: 'Trials', plain: 'Test batches' },
  { id: 'results', scientist: 'Lab results', plain: 'Lab results' },
  { id: 'met', scientist: 'Targets met?', plain: 'Good enough?' },
  { id: 'final', scientist: 'Final', plain: 'Final product' },
];

/** Live mini-map of "Four inputs, two modes, one lab loop". */
export function FlowRail({ current, done, iteration = 1, looping, branch, compact, anchorScope }: { current: FlowNode; done: Set<FlowNode>; iteration?: number; looping?: boolean; branch?: string; compact?: boolean; anchorScope?: string }) {
  const mode = useMode();
  const label = (n: (typeof NODES)[number]) => (mode === 'scientist' ? n.scientist : n.plain);
  const idx = NODES.findIndex((n) => n.id === current);
  const trialsIdx = NODES.findIndex((n) => n.id === 'trials');
  const metIdx = NODES.findIndex((n) => n.id === 'met');
  return (
    <div>
      {/* compact (< 768 px) */}
      <div className={compact ? '' : 'md:hidden'}>
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-ink2">
            Workflow stage <b className="mono text-ink">{idx + 1}</b> of {NODES.length} · <b className="text-accent">{label(NODES[idx])}</b>
            {branch && <span className="hidden text-ink3 sm:inline"> · {branch}</span>}
          </span>
          {compact && <span className="hidden text-2xs text-ink3 md:inline">{NODES.slice(idx + 1, idx + 4).map(label).join(' → ')} →</span>}
          {iteration > 1 && <span className="mono rounded bg-accent px-1.5 text-2xs font-semibold text-on-accent">Iteration {iteration}</span>}
        </div>
        <div className="mt-2 flex gap-1">
          {NODES.map((n) => (
            <span key={n.id} className={cn('h-1.5 flex-1 rounded-full', n.id === current ? 'bg-accent' : done.has(n.id) ? 'bg-accent/40' : 'bg-surface2')} />
          ))}
        </div>
      </div>

      {/* full rail */}
      <div className={cn('scroll-thin hidden overflow-x-auto', !compact && 'md:block')}>
        <div className="relative min-w-[820px] pt-8">
          <motion.div
            className="pointer-events-none absolute top-3 h-4 rounded-t-[10px] border border-b-0 border-dashed"
            style={{ left: `calc(32px + (100% - 64px) * ${trialsIdx / (NODES.length - 1)})`, width: `calc((100% - 64px) * ${(metIdx - trialsIdx) / (NODES.length - 1)})` }}
            animate={{ borderColor: looping ? 'var(--accent)' : 'var(--line)' }}
            transition={{ duration: 0.3 }}
          >
            <span className={cn('absolute -top-2.5 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap bg-surface px-1.5 text-[10px]', looping ? 'font-semibold text-accent' : 'text-ink3')}>
              <RotateCcw size={10} className={looping ? 'animate-[spin_1.5s_linear_infinite]' : ''} /> no → next iteration
            </span>

            <AnimatePresence>
              {looping && (
                <motion.div
                  className="absolute h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_10px_var(--accent)]"
                  initial={{ right: -6, opacity: 0, top: 16 }}
                  animate={{ 
                    right: ['-6px', '-6px', 'calc(100% - 6px)', 'calc(100% - 6px)'],
                    top: [16, -5, -5, 16],
                    opacity: [0, 1, 1, 0]
                  }}
                  transition={{ duration: 1.8, ease: "easeInOut", times: [0, 0.15, 0.85, 1] }}
                />
              )}
            </AnimatePresence>
          </motion.div>
          <div className="flex items-start">
            {NODES.map((n, i) => {
              const isDone = done.has(n.id);
              const isCur = current === n.id;
              return (
                <div key={n.id} className="flex min-w-0 flex-1 items-start last:flex-none">
                  <div className="relative flex w-[64px] flex-col items-center">
                    <motion.div
                      data-bot-anchor={anchorScope && NODE_AGENT[n.id] ? `${anchorScope}:${NODE_AGENT[n.id]}` : undefined}
                      className={cn(
                        'relative z-10 grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold',
                        isCur ? 'bg-accent text-on-accent ring-4 ring-[color:var(--accent-soft)]' : isDone ? 'bg-pass text-on-accent' : 'bg-surface2 text-ink3',
                      )}
                      animate={isCur ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                      transition={isCur ? { repeat: Infinity, duration: 2.2 } : {}}
                    >
                      {isDone && !isCur ? <Check size={13} strokeWidth={3} /> : i + 1}
                      {n.id === 'trials' && iteration > 1 && (
                        <motion.span 
                          className="mono absolute -right-[42px] -top-1.5 rounded bg-accent px-1.5 py-0.5 text-[9px] font-semibold text-on-accent shadow-sm"
                          animate={looping ? { scale: [1, 1.25, 1], backgroundColor: ['var(--accent)', '#4F46E5', 'var(--accent)'] } : {}}
                          transition={{ duration: 0.6, delay: 1.8 }}
                        >
                          Iter {iteration}
                        </motion.span>
                      )}
                    </motion.div>
                    <span className={cn('mt-1.5 whitespace-nowrap text-[11px] leading-4', isCur ? 'font-semibold text-accent' : isDone ? 'text-ink' : 'text-ink3')}>{label(n)}</span>
                    {n.id === 'usecase' && branch && <span className="whitespace-nowrap text-[10px] leading-3 text-ink3">{branch}</span>}
                  </div>
                  {i < NODES.length - 1 && (
                    <div className="relative mt-3.5 h-0.5 flex-1 rounded bg-surface2">
                      <motion.div className="absolute inset-y-0 left-0 rounded bg-pass" initial={false} animate={{ width: isDone ? '100%' : '0%' }} transition={{ duration: 0.4, ease: EASE }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
