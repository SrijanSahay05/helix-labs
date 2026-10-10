import { useAgents } from '@/store/agents';
import type { AgentId, AgentStatus } from './registry';

/** Global status of an agent (set by the engine as runs progress). */
export function useAgentStatus(id: AgentId): AgentStatus {
  return useAgents((s) => s.live[id]?.status ?? 'idle');
}

export function useAgentLive(id: AgentId) {
  return useAgents((s) => s.live[id]);
}
