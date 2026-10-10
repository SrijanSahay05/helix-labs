import type { Project } from '@/types';
import { AGENT_IDS, STAGE_OWNER, type AgentId } from './registry';

/** Agents that worked on a project: Helix, every stage owner that has started, and anyone who signed activity. */
export function projectCrew(p: Project): AgentId[] {
  const set = new Set<AgentId>(['conductor', 'scribe']);
  (Object.keys(STAGE_OWNER) as (keyof typeof STAGE_OWNER)[]).forEach((s) => p.stages[s] !== 'waiting' && set.add(STAGE_OWNER[s]));
  p.activity.forEach((a) => a.agent && set.add(a.agent));
  if (p.pathways.length) (['cost', 'sentinel'] as AgentId[]).forEach((a) => set.add(a));
  return AGENT_IDS.filter((a) => set.has(a));
}

/** Agent working on a project right now (from its live runs). */
export function workingOn(crewStatus: Partial<Record<AgentId, string>> | undefined): AgentId[] {
  return crewStatus ? (Object.keys(crewStatus) as AgentId[]).filter((a) => crewStatus[a] === 'working') : [];
}
