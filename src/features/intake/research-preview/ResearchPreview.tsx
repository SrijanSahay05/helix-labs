import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowLeft, ArrowRight, FastForward, FileText, Pause, Play, RotateCcw, SkipBack, SkipForward } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { buildResearch } from '@/data/demo/research';
import { SCENARIO } from '@/data/scenarios';
import { findSubcategory } from '@/data/categories';
import { PROP } from '@/data/properties';
import { MAT } from '@/data/rawMaterials';
import { INTAKE_STEPS } from '@/store/project';
import { useUI } from '@/store/ui';
import { bus } from '@/agent/bus';
import type { AgentStatus } from '@/agents/registry';
import { TypeText, Markdown } from '@/components/ai/TypeText';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/primitives';
import { targetText } from '@/lib/format';
import { cn } from '@/lib/cn';
import { EASE } from '@/lib/motion';
import { useDraft } from '../useDraft';
import { ActLiterature } from './ActLiterature';
import { ActPathways } from './ActPathways';
import { EvidenceBridge } from './EvidenceBridge';
import { MiniMapPeek } from './KnowledgeMap';
import { PipelineRail } from './PipelineRail';
import { END, LIT_COUNT, STEPS, followTarget } from './script';
import { isReduced, useChoices, useInteract, usePlayback } from './store';
import { useScientist } from './shared';

const IDS = { 'act-lit': 'rp-act-lit', bridge: 'rp-bridge', 'act-path': 'rp-act-path' } as const;
const OFFSET = 136;

function scrollToId(id: string, instant = false) {
  const main = document.getElementById('main-scroll');
  const el = document.getElementById(id);
  if (!main || !el) return;
  const to = Math.max(0, el.getBoundingClientRect().top - main.getBoundingClientRect().top + main.scrollTop - OFFSET);
  const from = main.scrollTop;
  if (Math.abs(to - from) < 24) return;
  if (instant || isReduced()) return void (main.scrollTop = to);
  const start = performance.now();
  const step = (t: number) => {
    const p = Math.min(1, (t - start) / 600);
    main.scrollTop = from + (to - from) * (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function BriefDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const d = useDraft();
  const mode = useUI((s) => s.mode);
  const s = SCENARIO[d.scenarioId] ?? SCENARIO.tile;
  const sub = findSubcategory(d.subcategoryId ?? s.subcategoryId)?.sub;
  const uc = { ...s.useCase, ...d.useCase };
  const targets = (d.targets.length ? d.targets : []).filter((t) => t.priority === 'must');
  const ceiling = d.constraints.costCeiling ?? s.constraints.costCeiling;
  const rows: [string, string][] = [
    ['Product', sub?.name ?? s.label],
    ['Standard', d.standard ?? s.standard],
    ['Use case', `${uc.materialType} ${uc.size?.w ?? ''}×${uc.size?.h ?? ''} mm on ${uc.substrate}, ${uc.exposure}, ${uc.climate}`],
    ['Cost ceiling', ceiling !== undefined ? `≤ ₹${ceiling}/kg` : '—'],
    ['Compliance', (d.constraints.compliance ?? s.constraints.compliance).join(', ') || '—'],
    ['Material limits', (d.constraints.materialLimits ?? s.constraints.materialLimits).map((m) => `${MAT[m.materialId]?.name ?? m.materialId} ${m.exclude ? 'excluded' : `≤ ${m.maxPct} %`}`).join(', ') || '—'],
  ];
  return (
    <Drawer open={open} onClose={onClose} title="Your brief" width={480}>
      <Markdown text={d.summary ?? s.summary[mode === 'scientist' ? 'scientist' : 'plain']} className="text-sm leading-6 text-ink2" />
      <dl className="mt-4 divide-y divide-line rounded-lg border border-line">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[120px_1fr] gap-3 px-3 py-2 text-xs">
            <dt className="text-ink3">{k}</dt>
            <dd className="text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      {targets.length > 0 && (
        <>
          <div className="label mb-2 mt-4">Must-have targets</div>
          <ul className="space-y-1">
            {targets.map((t) => (
              <li key={t.propertyId} className="flex justify-between gap-3 rounded-md bg-surface2/60 px-3 py-1.5 text-xs">
                <span className="text-ink2">{PROP[t.propertyId]?.name ?? t.propertyId}</span>
                <span className="mono font-semibold text-ink">
                  {targetText(t)} {t.unit}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Drawer>
  );
}

function Transport() {
  const sci = useScientist();
  const { step, playing, rate, set, goto } = usePlayback();
  const ended = step >= END;
  const iconBtn = 'grid h-8 w-8 place-items-center rounded-md border border-line bg-surface text-ink2 transition-colors hover:text-ink disabled:opacity-40';
  return (
    <div className="flex items-center gap-2" role="group" aria-label="Preview playback">
      <button type="button" className={iconBtn} onClick={() => goto(step - 1)} disabled={step === 0} aria-label="Previous step" title="Previous step (←)">
        <SkipBack size={14} />
      </button>
      <button
        type="button"
        className={cn(iconBtn, 'w-9 border-accent/40 text-accent hover:text-accent')}
        onClick={() => (ended ? usePlayback.getState().reset() : set({ playing: !playing }))}
        aria-label={ended ? 'Replay' : playing ? 'Pause' : 'Play'}
        title={ended ? 'Replay' : `${playing ? 'Pause' : 'Play'} (Space)`}
      >
        {ended ? <RotateCcw size={14} /> : playing ? <Pause size={14} /> : <Play size={14} />}
      </button>
      <button type="button" className={iconBtn} onClick={() => goto(step + 1)} disabled={ended} aria-label="Next step" title="Next step (→)">
        <SkipForward size={14} />
      </button>
      <div className="inline-flex h-8 rounded-md bg-surface2 p-0.5" role="radiogroup" aria-label="Speed">
        {([1, 2] as const).map((r) => (
          <button key={r} type="button" role="radio" aria-checked={rate === r} onClick={() => set({ rate: r })} className={cn('mono h-7 w-9 rounded-[5px] text-xs font-semibold transition-colors', rate === r ? 'bg-surface text-ink shadow-[inset_0_0_0_1px_var(--line)]' : 'text-ink3 hover:text-ink')}>
            {r}×
          </button>
        ))}
      </div>
      <Button size="sm" variant="ghost" className="h-8 text-accent" onClick={() => goto(END)} disabled={ended}>
        <FastForward size={13} /> {sci ? 'Skip preview' : 'Skip'}
      </Button>
    </div>
  );
}

/** Step 9 of 10 — a guided, two-act research theatre: Literature review → evidence bridge → Synthesis pathways. */
export function ResearchPreview({ onContinue, onBack }: { onContinue: () => void; onBack: () => void }) {
  const draft = useDraft();
  const sci = useScientist();
  const data = useMemo(() => buildResearch(draft.scenarioId), [draft.scenarioId]);
  const step = usePlayback((s) => s.step);
  const following = usePlayback((s) => s.following);
  const compare = useChoices((s) => s.compare);
  const hoverCite = useInteract((s) => s.hoverCite);
  const [briefOpen, setBriefOpen] = useState(false);
  const [hop, setHop] = useState(false);
  const [mapVisible, setMapVisible] = useState(true);
  const prevStep = useRef(step);

  /* setup: fresh choices per draft; replay on first visit, end state on revisit */
  useEffect(() => {
    useChoices.getState().ensure(draft.id, draft.scenarioId);
    useInteract.setState({ hoverSource: undefined, selectSource: undefined, hoverCite: undefined, hoverCluster: undefined, hoverRoute: undefined, openSource: undefined });
    const pb = usePlayback.getState();
    if (draft.done.showcase) pb.set({ step: END, t: 1, playing: false, following: false });
    else pb.set({ step: 0, t: 0, playing: true, following: true });
    prevStep.current = usePlayback.getState().step;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* clock */
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      usePlayback.getState().tick(Math.min(100, t - last));
      last = t;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* handoff + end hop */
  useEffect(() => {
    const before = prevStep.current;
    prevStep.current = step;
    if (before < LIT_COUNT && step >= LIT_COUNT && step <= LIT_COUNT) bus.emit('handoff', { from: 'scholar', to: 'weaver', scopes: ['rp-rail', 'rp-act'] });
    if (before < END && step === END) {
      setHop(true);
      const t = setTimeout(() => setHop(false), 1300);
      return () => clearTimeout(t);
    }
  }, [step]);

  /* auto-follow */
  useEffect(() => {
    if (!following) return;
    const target = followTarget(step);
    if (target === 'end') return;
    const delay = step === 0 ? 1400 : 80;
    const t = setTimeout(() => scrollToId(IDS[target]), delay);
    return () => clearTimeout(t);
  }, [step, following]);
  useEffect(() => {
    const main = document.getElementById('main-scroll');
    if (!main) return;
    const stop = () => usePlayback.getState().following && usePlayback.getState().set({ following: false });
    const onKey = (e: KeyboardEvent) => ['PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown'].includes(e.key) && stop();
    main.addEventListener('wheel', stop, { passive: true });
    main.addEventListener('touchmove', stop, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => {
      main.removeEventListener('wheel', stop);
      main.removeEventListener('touchmove', stop);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  /* keyboard: ← / → step, Space play/pause */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el?.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return;
      const pb = usePlayback.getState();
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        pb.goto(pb.step + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        pb.goto(pb.step - 1);
      } else if (e.key === ' ' && !el?.closest('button, a, [role="button"]')) {
        e.preventDefault();
        if (pb.step >= END) pb.reset();
        else pb.set({ playing: !pb.playing });
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  /* mini-map peek when the map is off screen */
  useEffect(() => {
    const el = document.getElementById(IDS['act-lit']);
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setMapVisible(e.intersectionRatio > 0.15), { threshold: [0, 0.15, 0.5] });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const lumen: AgentStatus = hop ? 'working' : step < LIT_COUNT ? 'working' : 'idle';
  const weave: AgentStatus = hop ? 'working' : step < LIT_COUNT ? 'queued' : step < END ? 'working' : 'idle';
  const doneCount = INTAKE_STEPS.filter((s) => draft.done[s]).length;
  const stepIdx = INTAKE_STEPS.indexOf('showcase');
  const s = SCENARIO[draft.scenarioId] ?? SCENARIO.tile;
  const ceiling = draft.constraints.costCeiling ?? data.ceiling;
  const chip = `${data.briefLabel} · ${draft.standard ?? s.standard} · ≤ ₹${ceiling}/kg`;
  const p1 = data.routes.find((r) => r.rank === 1)!;
  const feasibleN = data.routes.filter((r) => r.feasible).length;
  const ended = step >= END;
  const cur = STEPS[Math.min(step, END - 1)];

  return (
    <div className="space-y-4">
      {/* header */}
      <header>
        <div className="max-w-[720px]">
          <div className="text-xs font-semibold text-accent">
            Step {stepIdx + 1} of {INTAKE_STEPS.length} · {doneCount} done
          </div>
          <h2 className="mt-1 font-display font-semibold tracking-[-0.03em] text-ink" style={{ fontSize: 40, lineHeight: '46px' }}>
            Research preview
          </h2>
          <TypeText inline id="rp-subtitle" text="Helix is preparing your research — a preview of what runs as soon as you start the formulation." className="mt-1.5 block text-sm leading-6 text-ink2" />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <Transport />
          <button type="button" onClick={() => setBriefOpen(true)} className="inline-flex h-8 max-w-full items-center gap-2 rounded-full border border-line bg-surface px-3 text-xs font-medium text-ink hover:border-accent" title="Open the brief summary">
            <FileText size={13} className="shrink-0 text-accent" />
            <span className="truncate">{chip}</span>
          </button>
        </div>
      </header>

      <PipelineRail data={data} lumen={lumen} weave={weave} />
      <div className="sr-only" aria-live="polite">
        {ended ? 'Preview complete' : `Step ${step + 1} of ${END}: ${cur.label}`}
      </div>

      <ActLiterature data={data} id={IDS['act-lit']} />
      <EvidenceBridge data={data} id={IDS.bridge} />
      <ActPathways data={data} id={IDS['act-path']} />

      {/* follow along */}
      <AnimatePresence>
        {!following && !ended && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            onClick={() => {
              usePlayback.getState().set({ following: true });
              const t = followTarget(usePlayback.getState().step);
              if (t !== 'end') scrollToId(IDS[t]);
            }}
            className="fixed bottom-28 left-1/2 z-30 inline-flex h-9 -translate-x-1/2 items-center gap-1.5 rounded-full bg-ink px-4 text-xs font-semibold text-bg shadow-pop lg:ml-[118px]"
          >
            <ArrowDown size={13} /> Follow along · {sci ? cur.label : cur.plain}
          </motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence>{hoverCite && !mapVisible && <MiniMapPeek data={data} sourceId={hoverCite.sourceId} />}</AnimatePresence>

      {/* footer: always available; becomes the summary bar at the end */}
      <div className="sticky bottom-3 z-20">
        <div className="flex h-14 items-center gap-3 rounded-xl border border-line bg-surface/95 px-3 shadow-pop backdrop-blur-md">
          <Button variant="ghost" onClick={onBack} className="h-9 shrink-0">
            <ArrowLeft size={14} /> Back
          </Button>
          {compare.length > 0 && (
            <span className="inline-flex h-8 shrink-0 items-center gap-2 rounded-full bg-accent-soft px-3 text-xs text-accent">
              Comparing <b>{compare.join(', ')}</b> <span className="text-ink3">({compare.length}/3)</span>
              <button type="button" onClick={() => useChoices.setState({ compare: [] })} className="text-2xs font-medium text-ink2 hover:text-ink">
                Clear
              </button>
            </span>
          )}
          <div className="min-w-0 flex-1 overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              {ended ? (
                <motion.div key="sum" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease: EASE }} className="truncate text-right text-sm text-ink2">
                  <b className="mono text-ink">{data.counts.relevant}</b> sources · <b className="mono text-ink">{data.clusters.length}</b> clusters · <b className="mono text-ink">{data.counts.facts}</b> facts
                  <ArrowRight size={14} className="mx-1 inline-block align-[-2px] text-accent" />
                  <b className="mono text-ink">{feasibleN}</b> feasible routes · <b className="text-ink">{p1.id}</b> recommended
                  <span className="mono">
                    ({p1.scores.overall.toFixed(2)}, ₹{p1.costPerKg.toFixed(1)}/kg)
                  </span>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
          <Button variant="primary" onClick={onContinue} className="h-10 shrink-0">
            Continue to review <ArrowRight size={14} />
          </Button>
        </div>
      </div>
      <p className="px-1 text-center text-xs leading-5 text-ink3">This is a preview built from your brief. The full run starts when you press Start formulation, and your pins, exclusions and selections carry over.</p>
      <BriefDrawer open={briefOpen} onClose={() => setBriefOpen(false)} />
    </div>
  );
}
