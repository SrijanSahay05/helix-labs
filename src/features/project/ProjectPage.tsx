import { useEffect, useRef, useState } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import type { Project, StageId } from '@/types';
import { useProject } from '@/store/project';
import { useUI } from '@/store/ui';
import { useTasks } from '@/store/tasks';
import { useCrewMonitor } from '@/features/crew-monitor/selectors';
import { STAGES } from '@/data/projectFactory';
import { useCaseDisplay } from '@/agent/scripts/intake';
import { USE_CASE_LABEL } from '@/data/copy';
import { PROP } from '@/data/properties';
import { SCENARIO } from '@/data/scenarios';
import { TargetsTable } from '@/components/tables/TargetsTable';
import { Drawer } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { StateFrame } from '@/components/ui/StateFrame';
import { AgentBot } from '@/components/agents/AgentBot';
import { Markdown, TypeText } from '@/components/ai/TypeText';
import { useMode } from '@/lib/useModeText';
import { buildReport } from '@/lib/reports';
import { printPdf } from '@/lib/exporter';
import { targetText } from '@/lib/format';
import type { UseCase } from '@/types';
import { BriefHeader } from './BriefHeader';
import { FlowRail, type FlowNode } from './FlowRail';
import { StageShell } from './StageShell';
import { ActivityLog, CommentsThread } from './Comments';
import { StageLiterature } from './stages/StageLiterature';
import { StagePathways } from './stages/StagePathways';
import { StageTrials } from './stages/StageTrials';
import { StageResults } from './stages/StageResults';
import { StageAnalysis } from './stages/StageAnalysis';
import { StageFinal } from './stages/StageFinal';

function flowState(p: Project): { current: FlowNode; done: Set<FlowNode> } {
  const done = new Set<FlowNode>(['who', 'category', 'subcategory', 'usecase', 'brief']);
  const st = p.stages;
  if (st.literature === 'complete') done.add('literature');
  if (st.pathways === 'complete') done.add('pathways');
  if (st.trials === 'complete') done.add('trials');
  if (st.results === 'complete') done.add('results');
  if (st.final === 'running' || st.final === 'complete') done.add('met');
  if (st.final === 'complete') done.add('final');
  const map: Record<StageId, FlowNode> = { literature: 'literature', pathways: 'pathways', trials: 'trials', results: 'results', analysis: 'met', final: 'final' };
  const running = STAGES.find((s) => st[s] === 'running' || st[s] === 'failed' || st[s] === 'low-confidence');
  const firstWaiting = STAGES.find((s) => st[s] !== 'complete');
  return { current: map[running ?? firstWaiting ?? 'final'], done };
}

function SpecCard({ p }: { p: Project }) {
  const s = SCENARIO[p.scenarioId];
  return (
    <div className="card agent-grid flex flex-col gap-4 p-5 md:flex-row">
      <div className="flex shrink-0 flex-col items-center gap-1">
        <AgentBot id="scribe" preset="hero" size={96} placement={`spec-${p.id}`} />
        <span className="text-xs font-semibold">Quill</span>
      </div>
      <div className="flex-1 space-y-2 rounded-lg bg-surface/90 p-1">
        <div className="label">Recommended product spec · written by Quill</div>
        <TypeText text={s.summary.plain} id={`spec:${p.id}`} className="text-sm leading-6 text-ink2" />
        <div className="flex flex-wrap gap-1.5 pt-1">
          {p.targets
            .filter((t) => t.priority === 'must')
            .map((t) => (
              <span key={t.propertyId} className="rounded border border-line bg-surface px-1.5 py-0.5 text-2xs">
                {PROP[t.propertyId]?.plainName}: <b className="mono">{targetText(t)}</b> {t.unit}
              </span>
            ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 md:flex-col">
        <Button variant="primary" size="sm" onClick={() => printPdf(`R&D brief — ${p.name}`, buildReport('dossier', p).slice(0, 1), s.summary.plain.replace(/\*\*/g, ''))}>
          <FileText size={13} /> Brief to hand to R&D
        </Button>
        <Link to="/settings" className="text-center text-2xs text-ink3 hover:text-accent">
          Output: spec · change in Settings
        </Link>
      </div>
    </div>
  );
}

function FullBrief({ p }: { p: Project }) {
  const mode = useMode();
  const keys = (Object.keys(p.useCase) as (keyof UseCase)[]).filter((k) => p.useCase[k] !== undefined);
  return (
    <div className="space-y-4 text-sm">
      <div className="leading-6 text-ink2">
        <Markdown text={mode === 'scientist' ? p.summary : SCENARIO[p.scenarioId].summary.plain} />
      </div>
      <div>
        <div className="label mb-1">Standard</div>
        <div className="mono">{p.standard}</div>
      </div>
      <div>
        <div className="label mb-1">Use case</div>
        <table className="w-full">
          <tbody>
            {keys.map((k) => (
              <tr key={k}>
                <td className="td w-48 text-ink2">{USE_CASE_LABEL[k]?.[mode]}</td>
                <td className="td mono">{useCaseDisplay(k, p.useCase[k])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TargetsTable rows={p.targets} mode={mode} readOnly pathPrefix={`p.${p.id}.targets`} onAdd={() => {}} onChange={() => {}} onRemove={() => {}} />
    </div>
  );
}

export function ProjectPage() {
  const { id } = useParams();
  const { hash } = useLocation();
  const p = useProject(id);
  const mode = useMode();
  const nsOutput = useUI((s) => s.nonScientistOutput);
  const role = useUI((s) => s.role);
  const [open, setOpen] = useState<Set<StageId>>(new Set());
  const [brief, setBrief] = useState(false);
  const [looping, setLooping] = useState(false);
  const lastIter = useRef(p?.iteration);

  // opening a stage marks its finished jobs as seen in the Crew Monitor
  useEffect(() => {
    if (!id || !hash) return;
    const st = hash.slice(1);
    const runs = useTasks.getState().runs;
    Object.values(runs).forEach((r) => r.projectId === id && (r.stage ?? '').split('-')[0] === st && (r.status === 'done' || r.status === 'failed') && useCrewMonitor.getState().open(r.id));
  }, [id, hash]);

  // open running stages + hash target
  const runningKey = p ? STAGES.filter((s) => p.stages[s] === 'running').join(',') : '';
  useEffect(() => {
    if (!p) return;
    setOpen((cur) => {
      const n = new Set(cur);
      STAGES.forEach((s) => p.stages[s] === 'running' && n.add(s));
      if (hash) n.add(hash.slice(1) as StageId);
      if (n.size === 0) {
        const last = [...STAGES].reverse().find((s) => p.stages[s] !== 'waiting');
        if (last) n.add(last);
      }
      return n;
    });
    if (hash) setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runningKey, hash, id]);

  useEffect(() => {
    if (p && lastIter.current !== undefined && p.iteration > lastIter.current) {
      setLooping(true);
      const t = setTimeout(() => setLooping(false), 3200);
      lastIter.current = p.iteration;
      return () => clearTimeout(t);
    }
    if (p) lastIter.current = p.iteration;
  }, [p?.iteration, p]);

  if (!p) return <StateFrame state="empty" message="Project not found." action={<Link to="/projects" className="text-sm text-accent">Back to projects</Link>} />;

  const { current, done } = flowState(p);
  const toggle = (s: StageId) =>
    setOpen((cur) => {
      const n = new Set(cur);
      if (n.has(s)) n.delete(s);
      else n.add(s);
      return n;
    });
  const BODY: Record<StageId, React.ReactNode> = {
    literature: <StageLiterature p={p} />,
    pathways: <StagePathways p={p} />,
    trials: <StageTrials p={p} />,
    results: <StageResults p={p} />,
    analysis: <StageAnalysis p={p} />,
    final: <StageFinal p={p} />,
  };
  const approved = p.approval === 'approved';

  return (
    <div className="space-y-5">
      <BriefHeader p={p} onViewBrief={() => setBrief(true)} onExport={() => printPdf(`Formulation brief — ${p.name}`, buildReport('dossier', p), p.summary.replace(/\*\*/g, ''))} />
      <div className="card px-4 py-4 md:px-6 md:pb-4 md:pt-5">
        <FlowRail current={current} done={done} iteration={p.iteration} looping={looping} anchorScope={`rail:${p.id}`} />
      </div>
      {approved && <StateFrame state="read-only" message="Approved project — changes require a new revision" />}
      {mode === 'non-scientist' && nsOutput === 'spec' && <SpecCard p={p} />}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-4">
          {STAGES.map((s, i) => (
            <StageShell key={s} n={i + 1} id={s} projectId={p.id} status={p.stages[s]} note={p.stageNotes?.[s]} open={open.has(s)} onToggle={() => toggle(s)} frozen={approved}>
              {BODY[s]}
            </StageShell>
          ))}
        </div>
        <aside className="grid gap-4 self-start md:grid-cols-2 xl:sticky xl:top-[150px] xl:grid-cols-1">
          <div className="card p-4">
            <div className="label mb-3">Activity · crew and team</div>
            <div className="scroll-thin max-h-[420px] overflow-auto">
              <ActivityLog projectId={p.id} />
            </div>
          </div>
          <div className="card p-4">
            <div className="label mb-3">Comments · project</div>
            <CommentsThread projectId={p.id} target="project" />
          </div>
          <div className="card p-4 text-2xs leading-4 text-ink3 md:col-span-2 xl:col-span-1">
            Signed in as <b className="capitalize text-ink2">{role}</b>. Technicians enter results · Reviewers approve · Admins edit templates.
          </div>
        </aside>
      </div>
      <Drawer open={brief} onClose={() => setBrief(false)} title="Full brief" width={760}>
        <FullBrief p={p} />
      </Drawer>
    </div>
  );
}
