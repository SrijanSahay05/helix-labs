import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { AlertTriangle, RotateCcw, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { allMustPass, type ResearchData, type RRoute } from '@/data/demo/research';
import { AgentBadge } from '@/components/agents/AgentBadge';
import { AgentBot } from '@/components/agents/AgentBot';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/primitives';
import { cn } from '@/lib/cn';
import { EASE } from '@/lib/motion';
import { DesignSpace } from './DesignSpace';
import { NovyteShowcase, NovyteToggle } from './NovyteShowcase';
import { NOVYTE } from './novyte.config';
import { PathwayCard, ReconsideredRow } from './PathwayCard';
import { END, PHASE, STEP_INDEX, seg } from './script';
import { makeVariant, useChoices, usePlayback, useProg, useReduced } from './store';
import { Counter, useScientist } from './shared';

const G = STEP_INDEX.generate;

function RejectedDrawer({ data, open, onClose }: { data: ResearchData; open: boolean; onClose: () => void }) {
  const rejected = data.routes.filter((r) => !r.feasible);
  const reconsidered = useChoices((s) => s.reconsidered);
  const reconsider = useChoices((s) => s.reconsider);
  return (
    <Drawer open={open} onClose={onClose} title={`${rejected.length} rejected routes`} width={560}>
      <p className="mb-4 text-xs text-ink2">Weave generated {data.routes.length} routes and dropped these because they break a constraint in your brief.</p>
      <div className="space-y-2">
        {rejected.map((r) => {
          const back = reconsidered.includes(r.id);
          return (
            <div key={r.id} className="rounded-lg border border-line p-3">
              <div className="flex items-start gap-3">
                <span className="mono mt-0.5 text-xs text-ink3">{r.id}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-ink">{r.name}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-2xs">
                    <span className="inline-flex h-[22px] items-center gap-1 rounded-[6px] bg-[var(--fail-soft)] px-2 font-semibold text-fail">
                      <X size={11} strokeWidth={3} /> {r.reason}
                    </span>
                    <span className="text-ink2">Failed: {r.constraint}</span>
                  </div>
                </div>
                <Button size="sm" variant={back ? 'ghost' : 'secondary'} className="h-8" disabled={back} onClick={() => reconsider(r.id)}>
                  <RotateCcw size={12} /> {back ? 'Reconsidered' : 'Reconsider'}
                </Button>
              </div>
              {back && (
                <div className="mt-2 flex items-center gap-1.5 rounded-md bg-[var(--borderline-soft)] px-2.5 py-1.5 text-2xs font-medium text-borderline">
                  <AlertTriangle size={11} /> Moved to the feasible list — it still fails “{r.constraint}”.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Drawer>
  );
}

/** 12 ghost cards; 7 fail feasibility one by one, then collapse into a pill. */
function GenerationGrid({ data, t, order }: { data: ResearchData; t: number; order: RRoute[] }) {
  const sci = useScientist();
  const rejected = data.routes.filter((r) => !r.feasible);
  const appear = seg(t, PHASE.generate.appear);
  const rej = seg(t, PHASE.generate.reject);
  const collapse = seg(t, PHASE.generate.collapse);
  return (
    <div className="grid grid-cols-4 gap-3">
      <AnimatePresence>
        {order.map((r, i) => {
          const shown = appear >= (i + 0.5) / order.length;
          const j = rejected.indexOf(r);
          const failed = j >= 0 && rej >= (j + 0.6) / rejected.length;
          if (failed && collapse > 0.2) return null;
          return (
            <motion.div key={r.id} layoutId={`rp-c-${r.id}`} layout="position" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: shown ? (failed ? 0.55 : 1) : 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.3, ease: EASE }} className={cn('flex h-[118px] flex-col rounded-lg border p-3', failed ? 'border-dashed border-line bg-surface2/50' : 'border-line bg-surface')}>
              <div className="flex items-center gap-2">
                <span className="mono text-2xs font-semibold text-ink3">{r.feasible ? 'Route' : r.id}</span>
                {failed ? (
                  <span className="ml-auto inline-flex h-[22px] items-center gap-1 rounded-[6px] bg-[var(--fail-soft)] px-2 text-2xs font-semibold text-fail">
                    <X size={11} strokeWidth={3} /> {r.reason}
                  </span>
                ) : (
                  j < 0 && rej >= 1 && <span className="ml-auto inline-flex h-[22px] items-center rounded-[6px] bg-accent-soft px-2 text-2xs font-semibold text-accent">feasible</span>
                )}
              </div>
              <div className={cn('mt-1.5 line-clamp-2 text-xs font-semibold leading-4', failed ? 'text-ink3 line-through' : 'text-ink')}>{sci ? r.name : r.plain}</div>
              <div className="mt-auto space-y-1.5">
                <div className={cn('h-2 w-full rounded', failed ? 'bg-line' : 'skeleton')} />
                <div className={cn('h-2 w-2/3 rounded', failed ? 'bg-line' : 'skeleton')} />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export function ActPathways({ data, id }: { data: ResearchData; id: string }) {
  const sci = useScientist();
  const reduced = useReduced();
  const step = usePlayback((s) => s.step);
  const gen = useProg(G, 120);
  const pred = useProg(STEP_INDEX.predict, 120);
  const score = useProg(STEP_INDEX.score, 120);
  const rank = useProg(STEP_INDEX.rank, 60);
  const variants = useChoices((s) => s.variants);
  const reconsidered = useChoices((s) => s.reconsidered);
  const [rejOpen, setRejOpen] = useState(false);
  const [novyte, setNovyte] = useState(false);
  const wrap = useRef<HTMLElement>(null);
  const [wide, setWide] = useState(true);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWide(e.contentRect.width >= 1040));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const feasible = useMemo(() => data.routes.filter((r) => r.feasible).sort((a, b) => (a.rank ?? 9) - (b.rank ?? 9)), [data.routes]);
  const rejected = useMemo(() => data.routes.filter((r) => !r.feasible), [data.routes]);
  /** unranked order used while generating / predicting */
  const genOrder = useMemo(() => {
    const out: RRoute[] = [];
    const f = [feasible[2], feasible[0], feasible[4], feasible[1], feasible[3]].filter(Boolean);
    const r = [...rejected];
    while (f.length || r.length) {
      if (r.length) out.push(r.shift()!);
      if (f.length) out.push(f.shift()!);
      if (r.length) out.push(r.shift()!);
    }
    return out;
  }, [feasible, rejected]);
  const evalOrder = genOrder.filter((r) => r.feasible);

  const phase = step < G ? 'dormant' : step === G ? 'generate' : step < STEP_INDEX.rank || (step === STEP_INDEX.rank && rank < 0.25 && !reduced) ? 'eval' : 'final';
  const predT = (k: number) => (step > STEP_INDEX.predict ? 1 : step < STEP_INDEX.predict ? 0 : seg(pred, [k * 0.08, 0.6 + k * 0.08]));
  const scoreT = step > STEP_INDEX.score ? 1 : step < STEP_INDEX.score ? 0 : seg(score, [0, 0.8]);

  /* counters */
  const generated = step < G ? 0 : step === G ? Math.round(data.routes.length * seg(gen, PHASE.generate.appear)) : data.routes.length;
  const rejectedN = step < G ? 0 : step === G ? Math.floor(rejected.length * seg(gen, PHASE.generate.reject) + 0.4) : rejected.length;
  const feasibleN = generated === data.routes.length ? data.routes.length - Math.min(rejected.length, rejectedN) : 0;
  const mustN = evalOrder.filter((r, k) => allMustPass(r) && predT(k) >= 1).length;
  const best = Math.max(0, ...feasible.map((r) => r.scores.overall)) * scoreT;

  const showRejectedPill = step > G || (step === G && seg(gen, PHASE.generate.collapse) > 0);
  const others = feasible.slice(1);
  const vlist = Object.entries(variants)
    .map(([base, prompt]) => {
      const b = feasible.find((r) => r.id === base);
      return b ? makeVariant(b, prompt) : null;
    })
    .filter((x): x is RRoute => !!x);
  const side = wide ? vlist.slice(0, 2) : [];
  const rowVariants = wide ? vlist.slice(2) : vlist;
  const back = rejected.filter((r) => reconsidered.includes(r.id));
  const typing = step >= END || (step === STEP_INDEX.rank && rank > 0.3);
  const vtag = <span className="inline-flex h-[22px] items-center rounded-[6px] bg-accent-soft px-2 text-2xs font-semibold text-accent">Variant</span>;

  return (
    <section id={id} ref={wrap} aria-label={sci ? 'Act 2: Synthesis pathways' : 'Recipe options'} className="scroll-mt-[140px] overflow-hidden rounded-xl border border-line bg-surface shadow-card">
      <header className="flex min-h-[88px] flex-wrap items-center gap-x-6 gap-y-3 border-b border-line px-6 py-4">
        <AgentBadge id="weaver" preset="console" size={56} placement="rp-act-path" status={step < G ? 'idle' : step < END ? 'working' : 'idle'} orb={step === STEP_INDEX.predict || step === STEP_INDEX.score ? 'solving' : 'weaving'} anchor="rp-act:weaver" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-2xs font-semibold text-accent">Act 2</span>
            <h3 className="text-2xl font-semibold leading-8 tracking-[-0.02em] text-ink" style={{ fontSize: 24 }}>
              {sci ? 'Synthesis pathways' : 'Recipe options'}
            </h3>
            <span className="text-sm text-ink3">· Weave · Formulator</span>
          </div>
          <p className="mt-0.5 max-w-[560px] text-xs leading-5 text-ink2">Turns the evidence into ranked composition routes and predicts how each will perform against your targets.</p>
        </div>
        {NOVYTE.pathways.src && <NovyteToggle value={novyte} onChange={setNovyte} />}
        <div className="flex items-start gap-6">
          <Counter label={sci ? 'Routes generated' : 'Recipe ideas'} value={generated} />
          <Counter label={sci ? 'Feasible' : 'Workable'} value={feasibleN} />
          <Counter label="Meet all must-haves" value={mustN} />
          <Counter label={sci ? 'Best overall' : 'Best score'} value={best} decimals={2} strong />
        </div>
      </header>

      {novyte && NOVYTE.pathways.src ? (
        <NovyteShowcase kind="pathways" src={NOVYTE.pathways.src} />
      ) : (
        <>
          <div className="agent-grid min-h-[720px] px-6 py-5" style={{ backgroundSize: '16px 16px' }}>
            <div className="mb-4 flex h-8 items-center gap-3">
              <span className="text-sm font-semibold text-ink">
                {phase === 'dormant' ? (sci ? 'Waiting for evidence' : 'Waiting for the facts') : phase === 'generate' ? (sci ? 'Generating routes' : 'Drafting recipes') : phase === 'eval' ? (step === STEP_INDEX.score ? (sci ? 'Scoring' : 'Scoring') : sci ? 'Predicting performance' : 'Predicting how they’ll do') : sci ? 'Ranked pathways' : 'Recipe options, best first'}
              </span>
              <AnimatePresence>
                {showRejectedPill && (
                  <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} type="button" onClick={() => setRejOpen(true)} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-xs font-medium text-ink2 hover:border-ink3 hover:text-ink">
                    <X size={12} className="text-fail" strokeWidth={3} /> {rejected.length} rejected <span className="text-accent">(view)</span>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
            <LayoutGroup>
              {phase === 'dormant' && (
                <div className="grid h-[640px] place-items-center rounded-lg border border-dashed border-line bg-surface/60">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <AgentBot id="weaver" preset="console" placement="rp-path-sleep" status="queued" wakeOnHover />
                    <div className="text-sm font-medium text-ink2">Weave starts when Lumen hands over the evidence.</div>
                    <div className="text-xs text-ink3">{data.routes.length} routes will be generated, predicted, scored and ranked.</div>
                  </div>
                </div>
              )}
              {phase === 'generate' && <GenerationGrid data={data} t={gen} order={genOrder} />}
              {phase === 'eval' && (
                <div className={cn('grid gap-3', wide ? 'grid-cols-5' : 'grid-cols-3')}>
                  {evalOrder.map((r, k) => (
                    <motion.div key={r.id} layoutId={`rp-c-${r.id}`} layout="position" transition={{ duration: 0.5, ease: EASE }}>
                      <PathwayCard r={r} size="gen" data={data} predictT={predT(k)} scoreT={scoreT} />
                    </motion.div>
                  ))}
                </div>
              )}
              {phase === 'final' && (
                <div className="space-y-4">
                  <div className={cn('grid gap-4', wide ? 'grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]' : 'grid-cols-2')}>
                    {feasible.slice(0, 3).map((r, i) => (
                      <motion.div key={r.id} layoutId={`rp-c-${r.id}`} layout="position" transition={{ duration: 0.55, ease: EASE }} className={cn('min-w-0', i === 0 && !wide && 'col-span-2', i === 0 && side.length > 0 && 'row-span-2')}>
                        <PathwayCard r={r} size={i === 0 ? 'hero' : 'medium'} data={data} others={others} split={i === 0 && !wide} />
                      </motion.div>
                    ))}
                    <AnimatePresence>
                      {side.map((v) => (
                        <motion.div key={v.id} initial={{ opacity: 0, x: -16, scale: 0.98 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ duration: 0.4, ease: EASE }} className={cn('min-w-0', side.length === 1 && 'col-span-2')}>
                          <PathwayCard r={v} size="medium" data={data} tag={vtag} />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                  {[...feasible.slice(3), ...rowVariants].map((r) => (
                    <motion.div key={r.id} layoutId={r.id.endsWith('-b') ? undefined : `rp-c-${r.id}`} layout="position" initial={r.id.endsWith('-b') ? { opacity: 0, y: 8 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
                      <PathwayCard r={r} size="row" data={data} tag={r.id.endsWith('-b') ? vtag : undefined} />
                    </motion.div>
                  ))}
                  {back.map((r) => (
                    <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                      <ReconsideredRow r={r} />
                    </motion.div>
                  ))}
                </div>
              )}
            </LayoutGroup>
          </div>
          {phase === 'final' && <DesignSpace data={data} routes={[...data.routes, ...vlist]} typing={typing} />}
        </>
      )}
      <RejectedDrawer data={data} open={rejOpen} onClose={() => setRejOpen(false)} />
    </section>
  );
}
