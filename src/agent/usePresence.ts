import { useTasks } from '@/store/tasks';
import { useProjects } from '@/store/project';
import { useAgents } from '@/store/agents';
import { AGENTS, type AgentId } from '@/agents/registry';
import type { OrbState } from '@/components/ai/HelixOrb';

export interface CrewJob {
  agent: AgentId;
  /** "is searching literature" */
  doing: string;
  project?: string;
  waiting?: boolean;
}

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1).replace(/…$/, '');

/** What the crew is doing across the whole workspace right now (sidebar, home strip). */
export function usePresence(): { orb: OrbState; title: string; detail: string; running: number; href?: string; jobs: CrewJob[]; sentence: string } {
  const runs = useTasks((s) => s.runs);
  const order = useTasks((s) => s.order);
  const projects = useProjects((s) => s.projects);
  const custom = useAgents((s) => s.custom);
  const name = (id: AgentId) => custom[id]?.name || AGENTS[id].name;
  const active = order.map((id) => runs[id]).filter((r) => r && (r.status === 'running' || r.status === 'paused'));
  const jobs: CrewJob[] = active.map((r) => ({ agent: r.agent, doing: r.status === 'paused' ? 'is paused' : `is ${lower(r.label)}`, project: projects.find((p) => p.id === r.projectId)?.name }));
  const waiting = projects.filter((p) => p.stages.results === 'running');
  if (waiting.length) jobs.push({ agent: 'lab', doing: `is waiting for lab results${waiting.length > 1 ? ` on ${waiting.length} projects` : ''}`, waiting: true });
  const sentence = jobs.length
    ? `${active.length ? `${active.length} job${active.length > 1 ? 's' : ''} running: ` : ''}${jobs
        .slice(0, 3)
        .map((j) => `${name(j.agent)} ${j.doing}`)
        .join(', ')}.`
    : '';
  if (active.length) {
    const r = active[0];
    const p = projects.find((x) => x.id === r.projectId);
    return {
      orb: r.orb,
      title: `${name(r.agent)} ${r.status === 'paused' ? 'is paused' : `is ${lower(r.label)}`}`,
      detail: p ? p.name : r.title,
      running: active.length,
      href: p ? `/projects/${p.id}${r.stage ? `#${r.stage}` : ''}` : undefined,
      jobs,
      sentence,
    };
  }
  return {
    orb: 'breathing',
    title: 'Watching your workspace',
    detail: `${projects.length} projects${waiting.length ? ` · ${waiting.length} awaiting lab results` : ''}`,
    running: 0,
    jobs,
    sentence,
  };
}
