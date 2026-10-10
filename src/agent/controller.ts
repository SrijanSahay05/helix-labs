import type { Project, StageId } from '@/types';
import { useProjects } from '@/store/project';
import { useTasks } from '@/store/tasks';
import { runAgent, agent } from './engine';
import type { AgentEvent, AgentScript } from './types';
import { analysisScript, exportScript, iterationScript, literatureScript, pathwaysScript, resultsParseScript, trialsScript, variantScript } from './scripts/stages';

const get = (id: string) => useProjects.getState().projects.find((p) => p.id === id);
const runKey = (id: string, stage: string) => `stage:${id}:${stage}`;
const href = (id: string, stage: StageId) => `/projects/${id}#${stage}`;

export function stageRunId(projectId: string, stage: string) {
  return runKey(projectId, stage);
}

export function startLiterature(id: string, chain = true) {
  const p = get(id);
  if (!p) return;
  runAgent(literatureScript(p), {
    id: runKey(id, 'literature'),
    projectId: id,
    stage: 'literature',
    background: true,
    notify: { title: `Literature ready · ${p.name}`, href: href(id, 'literature') },
    onDone: (r) => {
      if (chain && r.status === 'done') startPathways(id);
    },
  });
}

export function startPathways(id: string) {
  const p = get(id);
  if (!p) return;
  runAgent(pathwaysScript(p), {
    id: runKey(id, 'pathways'),
    projectId: id,
    stage: 'pathways',
    background: true,
    notify: { title: `Pathways ready · ${p.pathways.length || 5} ranked pathways`, href: href(id, 'pathways') },
  });
}

export function startVariant(id: string, pathwayId: string, prompt: string) {
  const p = get(id);
  const base = p?.pathways.find((x) => x.id === pathwayId);
  if (!p || !base) return;
  runAgent(variantScript(p, base, prompt), { id: runKey(id, 'pathways-variant'), projectId: id, stage: 'pathways-variant' });
}

export function startTrials(id: string, pathwayId: string) {
  const p = get(id);
  if (!p) return;
  runAgent(trialsScript(p, pathwayId), {
    id: runKey(id, 'trials'),
    projectId: id,
    stage: 'trials',
    background: true,
    notify: { title: `Trial recipes ready · ${p.name}`, href: href(id, 'trials') },
  });
}

export function startResults(id: string, source: 'sample' | 'paste', count?: number) {
  const p = get(id);
  if (!p) return;
  runAgent(resultsParseScript(p, source, count), {
    id: runKey(id, 'results'),
    projectId: id,
    stage: 'results',
    onDone: () => startAnalysis(id),
  });
}

export function startAnalysis(id: string) {
  const p = get(id);
  if (!p) return;
  runAgent(analysisScript(p), {
    id: runKey(id, 'analysis'),
    projectId: id,
    stage: 'analysis',
    background: true,
    notify: { title: `Analysis ready · ${p.name}`, href: href(id, 'analysis') },
  });
}

export function acceptIteration(id: string) {
  const p = get(id);
  if (!p?.proposal) return;
  runAgent(iterationScript(p), { id: runKey(id, 'trials'), projectId: id, stage: 'trials' });
}

/** Re-start any stage persisted as "running" without a live run (e.g. after reload). */
export function resumeOrphanedRuns() {
  for (const p of useProjects.getState().projects as Project[]) {
    if (p.stages.literature === 'running' && !agent.isActive(runKey(p.id, 'literature'))) startLiterature(p.id);
    else if (p.stages.pathways === 'running' && !agent.isActive(runKey(p.id, 'pathways'))) startPathways(p.id);
    else if (p.stages.trials === 'running' && !agent.isActive(runKey(p.id, 'trials')) && p.selectedPathway) startTrials(p.id, p.selectedPathway);
    else if (p.stages.analysis === 'running' && !agent.isActive(runKey(p.id, 'analysis'))) startAnalysis(p.id);
  }
}

export function stageRun(projectId: string, stage: string) {
  return useTasks.getState().runs[runKey(projectId, stage)];
}

/**
 * Crew Monitor demo (once per session): a Batch "Trial sheet" export on the micro-concrete project that
 * finishes after ~25 s, next to the Lumen → Weave run resumed on the waterproofing project. Never edits seed data.
 */
export function startCrewDemo() {
  if (typeof sessionStorage === 'undefined' || sessionStorage.getItem('helix:crew-demo')) return;
  sessionStorage.setItem('helix:crew-demo', '1');
  const p = get('p-mc');
  if (!p) return;
  const base = exportScript('Trial sheet', 'trial-sheet', p.trials.length || 6, 'mixer');
  // pace the export to finish around the 25 s mark at 1× speed
  const paced: AgentScript = { ...base, id: `demo.${base.id}`, events: base.events.flatMap((e): AgentEvent[] => (e.t === 'tool' ? [e, { t: 'wait', ms: 6500 }] : [e])) };
  runAgent(paced, { id: runKey(p.id, 'trials-export'), projectId: p.id, stage: 'trials-export', notify: { title: `Trial sheet ready · ${p.name}`, href: href(p.id, 'trials') } });
}
