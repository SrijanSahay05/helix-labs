import { useProjects } from '@/store/project';
import { agent } from '@/agent/engine';
import { getIn } from '@/lib/path';
import type { AIMeta, UseCase } from '@/types';
import { SCENARIO } from '@/data/scenarios';
import { profileFor } from '@/data/useCaseProfiles';

export function useDraft() {
  return useProjects((s) => s.draft);
}

/** Record a user override: value + "Edited by you" meta + USER line in the agent trace. */
/** The draft's subcategory decides which use-case fields it has. */
export const draftProfile = (d: { subcategoryId?: string; scenarioId: string }) => profileFor(d.subcategoryId ?? SCENARIO[d.scenarioId]?.subcategoryId);

/** Use-case fields filled on the draft, in its profile's order. */
export const draftUseCaseKeys = (d: { subcategoryId?: string; scenarioId: string; useCase: Partial<UseCase> }): (keyof UseCase)[] =>
  draftProfile(d).fields.filter((k) => d.useCase[k] !== undefined);

export function userSet(path: string, value: unknown, label?: string) {
  const st = useProjects.getState();
  const prev = st.draft.meta[path];
  st.setDraft(path, value, { by: 'user', confidence: 1, reason: 'Set by you' });
  if (prev?.by === 'helix') agent.userLine(st.draft.runId, `override: ${label ?? path} = ${Array.isArray(value) ? value.join(', ') : typeof value === 'object' ? JSON.stringify(value) : String(value)}`);
}

export function useField<T>(path: string): [T, AIMeta | undefined] {
  const draft = useDraft();
  return [getIn(draft, path) as T, draft.meta[path]];
}

export function acceptMeta(path: string) {
  const st = useProjects.getState();
  const m = st.draft.meta[path];
  if (m) st.patchDraft({ meta: { ...st.draft.meta, [path]: { ...m, confidence: Math.max(m.confidence ?? 0, 0.95), reason: `${m.reason ?? ''} · accepted` } } });
}
