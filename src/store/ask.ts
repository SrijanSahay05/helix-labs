import { create } from 'zustand';
import type { AgentId } from '@/agents/registry';
import { useUI } from './ui';
import { agentName } from './agents';

export interface AskMessage {
  id: string;
  role: 'user' | 'helix';
  /** which agent answered (an @-mentioned specialist), Helix otherwise */
  agent?: AgentId;
  /** the specialist proposing the diff (signs the card) */
  diffAgent?: AgentId;
  /** trial references to pin in Graphs */
  trialRefs?: string[];
  text: string;
  thought?: string[];
  thoughtMs?: number;
  diffs?: { id: string; label: string; from: string; to: string; apply?: () => void; state?: 'open' | 'accepted' | 'rejected' }[];
  typing?: boolean;
}

interface AskState {
  messages: AskMessage[];
  draft: string;
  context: string[];
  thinking: 'idle' | 'searching' | 'solving' | 'composing';
  /** agent currently answering */
  speaker: AgentId;
  push: (m: AskMessage) => void;
  patch: (id: string, p: Partial<AskMessage>) => void;
  set: (p: Partial<AskState>) => void;
}

export const useAsk = create<AskState>()((set) => ({
  messages: [],
  draft: '',
  context: [],
  thinking: 'idle',
  speaker: 'conductor',
  push: (m) => set((s) => ({ messages: [...s.messages, m] })),
  patch: (id, p) => set((s) => ({ messages: s.messages.map((m) => (m.id === id ? { ...m, ...p } : m)) })),
  set: (p) => set(p),
}));

/** Open Ask Helix, optionally pre-filling a question about a specific field/row. */
export function openAsk(prefill?: string, context?: string[]) {
  useUI.getState().set({ askOpen: true });
  if (prefill !== undefined) useAsk.getState().set({ draft: prefill });
  if (context) useAsk.getState().set({ context });
}

/** Open Ask Helix addressed to a specialist: "@Terra why …". */
export function openAskAgent(id: AgentId, question = '', context?: string[]) {
  openAsk(id === 'conductor' && !question ? '' : `@${agentName(id)} ${question}`.trimEnd() + (question ? '' : ' '), context);
}
