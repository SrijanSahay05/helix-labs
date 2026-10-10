import { motion } from 'framer-motion';
import { ArrowRight, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useProjects } from '@/store/project';
import { useTasks } from '@/store/tasks';
import { useUI } from '@/store/ui';
import { findSubcategory } from '@/data/categories';
import { STAGES } from '@/data/projectFactory';
import { usePresence } from '@/agent/usePresence';
import { TypeText } from '@/components/ai/TypeText';
import { StagePill, Tag } from '@/components/ui/Pill';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/primitives';
import { StateFrame } from '@/components/ui/StateFrame';
import { STAGE_ORB } from '@/features/project/StageShell';
import { COPY } from '@/data/copy';
import type { Project, StageId } from '@/types';
import type { OrbState } from '@/components/ai/HelixOrb';
import { AgentBadge } from '@/components/agents/AgentBadge';
import { CrewStack } from '@/components/agents/CrewStrip';
import { projectCrew } from '@/agents/projectCrew';

function currentStage(p: Project): StageId {
  return STAGES.find((s) => ['running', 'failed', 'low-confidence'].includes(p.stages[s])) ?? [...STAGES].reverse().find((s) => p.stages[s] === 'complete') ?? 'literature';
}

/** 'running' on Lab results / Final means the people are up next, not the agent. */
function Status({ p, st, orb, active }: { p: Project; st: StageId; orb?: OrbState; active: boolean }) {
  if (p.approval === 'approved') return <Tag tone="pass">Approved</Tag>;
  if (p.stages[st] === 'running' && !active && st === 'results') return <Tag tone="pending">Awaiting lab results</Tag>;
  if (p.stages[st] === 'running' && !active && st === 'final') return <Tag tone="accent">Ready to lock</Tag>;
  return <StagePill status={p.stages[st]} orb={orb ?? STAGE_ORB[st]} />;
}

function relTime(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 60000;
  if (d < 1) return 'just now';
  if (d < 60) return `${Math.round(d)} min ago`;
  if (d < 1440) return `${Math.round(d / 60)} h ago`;
  return `${Math.round(d / 1440)} d ago`;
}

export function ProjectsPage() {
  const projects = useProjects((s) => s.projects);
  const presence = usePresence();
  const mode = useUI((s) => s.mode);
  const nav = useNavigate();
  const runs = useTasks((s) => s.runs);
  const ready = projects.find((p) => p.stages.pathways === 'complete' && p.stages.trials === 'waiting');
  const awaiting = projects.filter((p) => p.stages.results === 'running');
  const strip = presence.running
    ? presence.sentence
    : `All quiet. ${awaiting.length ? `Probe is waiting for lab results on ${awaiting.length} project${awaiting.length > 1 ? 's' : ''}.` : ''} ${ready ? `Weave's pathways for ${ready.name} are ready to review.` : 'Tell me what to formulate next.'}`;

  const stats = [
    { label: 'Active projects', value: projects.filter((p) => p.approval !== 'approved').length },
    { label: 'Agent jobs running', value: presence.running },
    { label: 'Awaiting lab results', value: awaiting.length },
    { label: 'Approved formulations', value: projects.filter((p) => p.approval === 'approved').length },
  ];

  return (
    <div>
      <PageHeader
        title="Projects"
        sub={
          mode === 'scientist'
            ? 'Every formulation from brief to locked recipe. Helix runs literature, pathways, trial design and analysis; you review and approve each step.'
            : 'All your products in one place. Helix does the research and the recipe work — you check and approve.'
        }
        right={
          <Button variant="primary" onClick={() => nav('/projects/new')}>
            <Plus size={16} /> New formulation
          </Button>
        }
      />

      <section className="card agent-grid relative mb-6 overflow-hidden p-5 md:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          <AgentBadge id="conductor" preset="console" placement="home-strip" status={presence.running ? 'working' : 'idle'} orb={presence.orb} />
          <div className="min-w-0 flex-1">
            <div className="eyebrow flex items-center gap-2 text-accent">
              Helix · runs the crew
              {presence.jobs.length > 0 && <CrewStack ids={[...new Set(presence.jobs.map((j) => j.agent))]} animate={presence.jobs.filter((j) => !j.waiting).map((j) => j.agent)} size={22} scope="home" />}
            </div>
            <p className="mt-1.5 font-display text-[22px] leading-8 text-ink">
              <TypeText inline text={strip.replace(/\s+/g, ' ').trim()} id={`strip:${strip}`} />
            </p>
          </div>
          <div className="flex gap-2">
            {presence.href && (
              <Link to={presence.href}>
                <Button>Watch the run</Button>
              </Link>
            )}
            {ready && (
              <Link to={`/projects/${ready.id}#pathways`}>
                <Button variant="primary">
                  Review pathways <ArrowRight size={14} />
                </Button>
              </Link>
            )}
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-5 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-xs text-ink2">{s.label}</div>
              <div className="mono mt-1 text-xl font-medium">{s.value}</div>
            </div>
          ))}
        </div>
      </section>

      {projects.length === 0 ? (
        <StateFrame state="empty" message="No projects yet. Tell Helix what you want to formulate." action={<Button variant="primary" onClick={() => nav('/projects/new')}>New formulation</Button>} />
      ) : (
        <>
          {/* table ≥ 1280 px */}
          <div className="table-wrap hidden bg-surface shadow-card xl:block">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="th">Project</th>
                  <th className="th">Product</th>
                  <th className="th">Standard</th>
                  <th className="th">Current stage</th>
                  <th className="th">Crew</th>
                  <th className="th text-right">Iteration</th>
                  <th className="th">Owner</th>
                  <th className="th text-right">Updated</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p, i) => {
                  const st = currentStage(p);
                  const run = Object.values(runs).find((r) => r.projectId === p.id && r.status === 'running');
                  return (
                    <motion.tr key={p.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} onClick={() => nav(`/projects/${p.id}`)} className="cursor-pointer hover:bg-surface2/50">
                      <td className="td">
                        <div className="font-medium text-ink">{p.name}</div>
                        <div className="mono mt-0.5 text-2xs text-ink3">
                          {p.finalCode ?? p.code} · {p.mode === 'scientist' ? 'Scientist' : 'Non-scientist'}
                        </div>
                      </td>
                      <td className="td text-ink2">{findSubcategory(p.subcategoryId)?.sub.name}</td>
                      <td className="td mono whitespace-nowrap text-xs">{p.standard.split(' / ')[0]}</td>
                      <td className="td">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="min-w-[96px] text-xs text-ink2">{COPY[`stage.${st}` as const][mode]}</span>
                          <Status p={p} st={st} orb={run?.orb} active={!!run} />
                        </div>
                      </td>
                      <td className="td">
                        <CrewStack ids={projectCrew(p)} animate={run ? [run.agent] : []} scope={`row-${p.id}`} size={24} />
                      </td>
                      <td className="td mono text-right">{p.iteration}</td>
                      <td className="td whitespace-nowrap text-ink2">{p.owner}</td>
                      <td className="td whitespace-nowrap text-right text-xs text-ink3">{relTime(p.updated)}</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* cards < 1280 px */}
          <div className="grid gap-4 sm:grid-cols-2 xl:hidden">
            {projects.map((p) => {
              const st = currentStage(p);
              const run = Object.values(runs).find((r) => r.projectId === p.id && r.status === 'running');
              return (
                <Link key={p.id} to={`/projects/${p.id}`} className="card block p-5 transition-colors hover:border-accent/50">
                  <div className="flex items-start justify-between gap-3">
                    <span className="mono text-2xs text-ink3">{p.finalCode ?? p.code}</span>
                    <Status p={p} st={st} orb={run?.orb} active={!!run} />
                  </div>
                  <h2 className="mt-2 font-display text-lg font-semibold leading-6">{p.name}</h2>
                  <p className="mt-1 text-xs text-ink2">
                    {findSubcategory(p.subcategoryId)?.sub.name} · <span className="mono">{p.standard.split(' / ')[0]}</span>
                  </p>
                  <div className="mt-3">
                    <CrewStack ids={projectCrew(p)} animate={run ? [run.agent] : []} scope={`card-${p.id}`} size={24} />
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-2xs text-ink3">
                    <span>
                      {COPY[`stage.${st}` as const][mode]} · iteration {p.iteration}
                    </span>
                    <span>{relTime(p.updated)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
