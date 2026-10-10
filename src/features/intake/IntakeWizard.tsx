import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, FastForward, RotateCcw } from 'lucide-react';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
// d3 + the research theatre load only when the Research step opens
const ResearchPreview = lazy(() => import('./research-preview/ResearchPreview').then((m) => ({ default: m.ResearchPreview })));
import { useNavigate } from 'react-router-dom';
import { useProjects, INTAKE_STEPS, type IntakeStep } from '@/store/project';
import { useUI } from '@/store/ui';
import { useTasks } from '@/store/tasks';
import { routeScenario, SCENARIO } from '@/data/scenarios';
import { blankProject } from '@/data/projectFactory';
import { runAgent, agent } from '@/agent/engine';
import { magicStartScript, stepScript } from '@/agent/scripts/intake';
import { startLiterature } from '@/agent/controller';
import { AgentConsole } from '@/components/ai/AgentConsole';
import { HelixOrb } from '@/components/ai/HelixOrb';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/primitives';
import { domainOf, uid } from '@/lib/format';
import { cn } from '@/lib/cn';
import { EASE } from '@/lib/motion';
import { T, useMode } from '@/lib/useModeText';
import type { CopyKey } from '@/data/copy';
import type { AIMeta, Mode, Project } from '@/types';
import { FlowRail, type FlowNode } from '@/features/project/FlowRail';
import { MagicStart } from './MagicStart';
import { MagicLiveForm } from './MagicLiveForm';
import { BriefPanel } from './BriefPanel';
import { StepWho } from './steps/StepWho';
import { StepCategory } from './steps/StepCategory';
import { StepSubcategory } from './steps/StepSubcategory';
import { StepUseCase } from './steps/StepUseCase';
import { StepBenchmark } from './steps/StepBenchmark';
import { PreviewSummary } from './steps/PreviewSummary';
import { StepTargets } from './steps/StepTargets';
import { StepConstraints } from './steps/StepConstraints';
import { BriefReview, useLowConfidence } from './steps/BriefReview';
import { notifyInfo } from '@/agent/notify';
import { AgentBadge } from '@/components/agents/AgentBadge';
import { TypeText } from '@/components/ai/TypeText';
import { AGENTS, INTAKE_OWNER, type AgentStatus } from '@/agents/registry';
import { useAgentName } from '@/store/agents';
import type { RunState } from '@/agent/types';

/** The agent leading this step: its badge, name and role (Step 0: Helix asks how to talk to you). */
function StepHost({ step, run, mode }: { step: IntakeStep; run?: RunState; mode: Mode }) {
  const id = INTAKE_OWNER[step];
  const name = useAgentName(id);
  const mine = run && run.scriptId.startsWith(`intake.step.${step}`);
  const status: AgentStatus = mine ? (run.status === 'running' ? 'working' : run.status === 'paused' ? 'paused' : run.status === 'done' ? 'done' : 'idle') : step === 'who' ? 'waiting' : 'idle';
  return (
    <div className="flex items-center gap-3">
      <AgentBadge id={id} preset="console" size={40} placement={`step-host-${step}`} status={status} orb={mine ? run.orb : undefined} />
      <div className="min-w-0">
        <div className="text-sm font-semibold text-ink">
          {name} <span className="font-normal text-ink3">· {AGENTS[id].title}</span>
        </div>
        {step === 'who' ? (
          <TypeText inline text="Pick how you'd like me to talk to you." id="step0-helix" className="font-display text-[17px] leading-6 text-ink2" />
        ) : (
          <div className="truncate text-xs text-ink2">{mode === 'scientist' ? AGENTS[id].role : AGENTS[id].plainRole}</div>
        )}
      </div>
    </div>
  );
}

const STEP_COPY: Record<IntakeStep, CopyKey> = {
  who: 'step.who',
  category: 'step.category',
  subcategory: 'step.subcategory',
  usecase: 'step.usecase',
  benchmark: 'step.benchmark',
  preview: 'step.preview',
  targets: 'step.targets',
  constraints: 'step.constraints',
  showcase: 'step.showcase',
  review: 'step.review',
};
const STEP_LABEL: Record<IntakeStep, [string, string]> = {
  who: ['Who', 'Who'],
  category: ['Category', 'Product'],
  subcategory: ['Subcategory', 'Type'],
  usecase: ['Use case', 'Where used'],
  benchmark: ['Benchmark', 'Match'],
  preview: ['Preview', 'Summary'],
  targets: ['Targets', 'Performance'],
  constraints: ['Constraints', 'Budget'],
  showcase: ['Research', 'Getting ready'],
  review: ['Review', 'Check brief'],
};
const SUB: Partial<Record<IntakeStep, CopyKey>> = { usecase: 'usecase.sub', targets: 'targets.sub', constraints: 'constraints.sub' };
const SUGGESTABLE: IntakeStep[] = ['who', 'category', 'subcategory', 'usecase', 'benchmark', 'preview', 'targets', 'constraints'];

function fillDraft(path: string, value: unknown, meta: AIMeta) {
  useProjects.getState().setDraft(path, value, meta);
  if (path === 'mode') useUI.getState().setMode(value as Mode, true);
}

function flowNode(step: IntakeStep): FlowNode {
  if (step === 'who' || step === 'category' || step === 'subcategory') return step;
  if (step === 'review') return 'brief';
  return 'usecase';
}

export function IntakeWizard() {
  const nav = useNavigate();
  const draft = useProjects((s) => s.draft);
  const { patchDraft, resetDraft, addProject } = useProjects();
  const mode = useMode();
  const autopilot = useUI((s) => s.autopilot);
  const modeRemembered = useUI((s) => s.modeRemembered);
  const standards = useUI((s) => s.standards);
  const setUI = useUI((s) => s.set);
  const run = useTasks((s) => (draft.runId ? s.runs[draft.runId] : undefined));
  const [stepMode, setStepMode] = useState(false);
  const [step, setStep] = useState<IntakeStep>('who');
  const interacted = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const visitedLow = useRef<Set<Element>>(new Set());
  const lows = useLowConfidence();

  const view: 'hero' | 'magic' | 'steps' = stepMode ? 'steps' : draft.magic === 'idle' ? 'hero' : 'magic';

  const goto = useCallback((s: IntakeStep) => {
    interacted.current = false;
    visitedLow.current = new Set();
    setStep(s);
    setStepMode(true);
    document.getElementById('main-scroll')?.scrollTo({ top: 0 });
  }, []);

  const next = useCallback(() => {
    const i = INTAKE_STEPS.indexOf(step);
    patchDraft({ done: { ...useProjects.getState().draft.done, [step]: true } });
    if (i < INTAKE_STEPS.length - 1) goto(INTAKE_STEPS[i + 1]);
  }, [step, goto, patchDraft]);

  const prev = () => {
    const i = INTAKE_STEPS.indexOf(step);
    if (i > 0) goto(INTAKE_STEPS[i - 1]);
  };

  /* Magic Start */
  const onMagic = (input: string, kind: 'link' | 'pdf' | 'text') => {
    resetDraft();
    const s = routeScenario(input);
    const domain = kind === 'link' ? (domainOf(input) ?? undefined) : kind === 'pdf' ? input : undefined;
    const runId = runAgent(magicStartScript(s, input, kind, domain, standards), { id: uid('intake'), onFill: fillDraft });
    patchDraft({ request: input, source: { kind, value: input, domain }, scenarioId: s.id, magic: 'running', runId });
  };

  const onStepByStep = () => {
    resetDraft();
    patchDraft({ magic: 'done', request: '' });
    goto(modeRemembered ? 'category' : 'who');
    if (modeRemembered) patchDraft({ mode: useUI.getState().mode, done: { who: true }, magic: 'done' });
  };

  /* Step-by-step: Helix pre-suggests when a step is opened and still empty */
  useEffect(() => {
    if (view !== 'steps' || !SUGGESTABLE.includes(step)) return;
    const d = useProjects.getState().draft;
    if (d.done[step]) return;
    if (step === 'who' && !d.request) return;
    const s = SCENARIO[d.scenarioId];
    const sc = stepScript(step, s, d.request, standards, mode);
    if (!sc) return;
    const id = runAgent(sc, {
      id: uid('step'),
      onFill: fillDraft,
      onDone: () => {
        const cur = useProjects.getState().draft;
        useProjects.getState().patchDraft({ done: { ...cur.done, [step]: true } });
      },
    });
    patchDraft({ runId: id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, view]);

  /* Autopilot: after a filled step, pause 1.2 s for review then advance unless the user interacts */
  useEffect(() => {
    if (view !== 'steps' || !autopilot || step === 'review' || step === 'showcase') return;
    if (run && (run.status === 'running' || run.status === 'paused')) return;
    if (!draft.done[step]) return;
    const f = useUI.getState().speed;
    const t = setTimeout(() => {
      if (!interacted.current) next();
    }, f === 'instant' ? 300 : 1200 / (f as number) + 400);
    return () => clearTimeout(t);
  }, [view, autopilot, step, run?.status, draft.done, next, run]);

  /* Keyboard: Enter confirms; Tab visits low-confidence fields first */
  useEffect(() => {
    if (view !== 'steps') return;
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (e.key === 'Enter' && !['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(tag) && step !== 'review') {
        e.preventDefault();
        next();
      }
      if (e.key === 'Tab' && !e.shiftKey && containerRef.current) {
        const lowEls = Array.from(containerRef.current.querySelectorAll('[data-lowconf="true"]')).filter((x) => !visitedLow.current.has(x));
        if (lowEls.length) {
          const el = lowEls[0];
          visitedLow.current.add(el);
          const focusable = el.querySelector<HTMLElement>('input, select, textarea, button');
          if (focusable) {
            e.preventDefault();
            focusable.focus();
            el.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
        }
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [view, step, next]);

  const start = () => {
    const d = useProjects.getState().draft;
    const s = SCENARIO[d.scenarioId];
    const id = uid('p');
    const base = blankProject(s, id, standards);
    const p: Project = {
      ...base,
      mode,
      categoryId: d.categoryId ?? base.categoryId,
      subcategoryId: d.subcategoryId ?? base.subcategoryId,
      standard: d.standard ?? base.standard,
      useCase: { ...base.useCase, ...d.useCase },
      benchmarks: d.benchmarks.map((b) => b.id),
      targets: d.targets.length ? d.targets : base.targets,
      top3: d.top3.length ? d.top3 : base.top3,
      constraints: { ...base.constraints, ...d.constraints } as Project['constraints'],
      summary: d.summary ?? base.summary,
      activity: [
        { id: uid('a'), at: new Date().toISOString(), who: useUI.getState().userName, text: 'Approved brief and started formulation' },
        { id: uid('a'), at: new Date().toISOString(), who: 'helix', agent: 'scribe', text: `Brief drafted from ${d.source?.domain ?? (d.request ? 'your request' : 'intake')}` },
      ],
    };
    addProject(p);
    resetDraft();
    nav(`/projects/${id}`);
    setTimeout(() => startLiterature(id), 400);
    notifyInfo('Formulation started · Lumen is searching the literature', 'scholar');
  };

  /* ---------- render ---------- */

  if (view === 'hero') return <MagicStart onSubmit={onMagic} onStepByStep={onStepByStep} />;

  const doneSet = new Set<FlowNode>();
  if (draft.done.who) doneSet.add('who');
  if (draft.done.category) doneSet.add('category');
  if (draft.done.subcategory) doneSet.add('subcategory');
  if (draft.done.constraints) doneSet.add('usecase');
  const stepIdx = INTAKE_STEPS.indexOf(step);
  // the targets table needs the full width; the brief panel returns on the next step
  const wide = view === 'steps' && (step === 'targets' || step === 'showcase');
  const doneCount = INTAKE_STEPS.filter((s) => draft.done[s]).length;

  return (
    <div className="space-y-5">
      {/* request + flow rail + controls */}
      <section className="card p-4 md:p-5">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="eyebrow">New formulation</div>
            <div className="mt-0.5 flex min-w-0 items-center gap-2">
              <h1 className="font-display text-[26px] font-semibold leading-8 md:text-xl">{view === 'magic' ? (run?.status === 'done' ? 'The crew drafted your brief' : 'The crew is drafting your brief') : 'Formulation brief'}</h1>
            </div>
          </div>
          {draft.request && (
            <motion.div layoutId="magic-request" className="flex max-w-full items-center gap-2 truncate rounded-md bg-surface2 px-3 py-1.5 text-xs text-ink2 sm:max-w-[360px]">
              <span className="eyebrow">Request</span>
              <span className="mono truncate">{draft.source?.domain ?? draft.request}</span>
            </motion.div>
          )}
          <Toggle checked={autopilot} onChange={(v) => setUI({ autopilot: v })} label={<span className="whitespace-nowrap text-xs font-medium text-ink">Autopilot {autopilot ? 'on' : 'off'}</span>} />
          {run?.status === 'running' && (
            <Button size="sm" variant="ghost" onClick={() => draft.runId && agent.skip(draft.runId)} className="text-accent">
              <FastForward size={13} /> Skip animation
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (draft.runId) agent.cancel(draft.runId);
              resetDraft();
              setStepMode(false);
            }}
            title="Start over"
          >
            <RotateCcw size={13} /> <span className="hidden sm:inline">Start over</span>
          </Button>
        </div>
      <nav aria-label="Intake steps">
        <ol className="flex flex-wrap gap-1 rounded-[14px] bg-surface2/70 p-1.5">
          {INTAKE_STEPS.map((s, i) => {
            const done = !!draft.done[s];
            const cur = view === 'steps' && step === s;
            return (
              <li key={s}>
                <button
                  onClick={() => goto(s)}
                  className={cn('flex h-9 items-center gap-1.5 whitespace-nowrap rounded-[10px] pl-1 pr-2.5 text-xs font-medium transition-colors', cur ? 'bg-accent text-on-accent' : 'text-ink hover:bg-surface')}
                >
                  <span className={cn('grid h-[26px] w-[26px] place-items-center rounded-full text-[11px] font-bold', cur ? 'bg-surface text-accent' : done ? 'bg-pass text-on-accent' : 'bg-surface2 text-ink3')}>
                    {done && !cur ? <Check size={13} strokeWidth={3} /> : i + 1}
                  </span>
                  <T scientist={STEP_LABEL[s][0]} plain={STEP_LABEL[s][1]} />
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
      <div className="mt-4 border-t border-line pt-4">
        <FlowRail compact current={view === 'magic' ? (run?.status === 'done' ? 'brief' : 'usecase') : flowNode(step)} done={doneSet} branch={mode === 'scientist' ? 'benchmark & targets' : 'guided questions'} />
      </div>
      </section>

      <div className={cn('grid gap-5', !wide && 'xl:grid-cols-[minmax(0,1fr)_380px]')}>
        <div ref={containerRef} className="min-w-0 space-y-5" onPointerDown={() => (interacted.current = true)} onKeyDown={() => (interacted.current = true)}>
          {view === 'magic' && (
            <>
              <AgentConsole runId={draft.runId} autoCollapse={false} />
              {run?.status === 'done' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card flex flex-col gap-4 border-accent/40 p-5 md:flex-row md:items-center">
                  <AgentBadge id="conductor" preset="console" placement="magic-done" status="done" />
                  <div className="flex-1">
                    <div className="eyebrow text-accent">Brief drafted</div>
                    <div className="mt-1 font-display text-xl font-semibold">
                      <TypeText inline text={run.summary ?? 'Brief drafted'} id={`magic-done:${run.id}`} />
                    </div>
                    <p className="lead mt-1">Everything is pre-filled. Walk through each step to approve it, or jump straight to the brief.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => goto('who')}>Review step by step</Button>
                    <Button variant="primary" onClick={() => goto('review')}>
                      Jump to review <ArrowRight size={14} />
                    </Button>
                  </div>
                </motion.div>
              )}
              <MagicLiveForm onOpen={goto} />
            </>
          )}

          {view === 'steps' && (
            <>
              {run && SUGGESTABLE.includes(step) && run.scriptId.startsWith('intake.step') && <AgentConsole runId={draft.runId} />}
              <section className="panel">
                {/* the Research preview carries its own header (Lumen and Weave) */}
                {step !== 'showcase' && (
                  <div className="mb-5 border-b border-line pb-4">
                    <StepHost step={step} run={run} mode={mode} />
                  </div>
                )}
                {step !== 'showcase' && <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                  <div className="max-w-2xl">
                    <div className="eyebrow text-accent">
                      Step {stepIdx + 1} of {INTAKE_STEPS.length} · {doneCount} done
                    </div>
                    <h2 className="h1 mt-1">
                      <T k={STEP_COPY[step]} />
                    </h2>
                    {SUB[step] && (
                      <p className="lead mt-1.5">
                        <T k={SUB[step]!} />
                      </p>
                    )}
                  </div>
                </div>}
                <AnimatePresence mode="wait">
                  <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22, ease: EASE }}>
                    {step === 'who' && <StepWho />}
                    {step === 'category' && <StepCategory />}
                    {step === 'subcategory' && <StepSubcategory />}
                    {step === 'usecase' && <StepUseCase />}
                    {step === 'benchmark' && <StepBenchmark />}
                    {step === 'preview' && <PreviewSummary onJump={goto} />}
                    {step === 'targets' && <StepTargets />}
                    {step === 'constraints' && <StepConstraints />}
                    {step === 'showcase' && (
                      <Suspense fallback={<div className="flex h-[480px] items-center justify-center gap-2 text-sm text-ink2"><HelixOrb state="searching" size={20} /> Preparing the research preview…</div>}>
                        <ResearchPreview onContinue={next} onBack={prev} />
                      </Suspense>
                    )}
                    {step === 'review' && <BriefReview onJump={goto} onStart={start} />}
                  </motion.div>
                </AnimatePresence>
                {step !== 'review' && step !== 'showcase' && (
                  <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
                    <Button variant="ghost" onClick={prev} disabled={step === 'who'}>
                      <ArrowLeft size={14} /> Back
                    </Button>
                    <div className="flex flex-wrap items-center gap-3">
                      {autopilot && draft.done[step] && !interacted.current && (
                        <span className="flex items-center gap-1.5 text-xs text-ink2">
                          <HelixOrb state="breathing" size={20} speed={0.7} /> Autopilot advancing…
                        </span>
                      )}
                      {lows.length > 0 && <span className="hidden text-2xs text-ink3 md:inline">Tab visits low-confidence fields first</span>}
                      <kbd className="mono hidden rounded border border-line px-1.5 text-2xs text-ink3 sm:inline">Enter</kbd>
                      <Button variant="primary" onClick={next}>
                        <Check size={14} /> Confirm and continue
                      </Button>
                    </div>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
        {!wide && <BriefPanel />}
      </div>
    </div>
  );
}
