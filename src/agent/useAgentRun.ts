import { useTasks } from '@/store/tasks';
import { agent } from './engine';

export function useAgentRun(runId?: string) {
  const run = useTasks((s) => (runId ? s.runs[runId] : undefined));
  return {
    run,
    status: run?.status,
    progress: run?.progress ?? 0,
    events: run?.lines ?? [],
    skip: () => runId && agent.skip(runId),
    pause: () => runId && agent.pause(runId),
    resume: () => runId && agent.resume(runId),
    cancel: () => runId && agent.cancel(runId),
  };
}

/** Most recent active run for a project (any stage). */
export function useStageRunAny(projectId: string) {
  return useTasks((s) => {
    const id = s.order.find((k) => s.runs[k]?.projectId === projectId && (s.runs[k]?.status === 'running' || s.runs[k]?.status === 'paused'));
    return id ? s.runs[id] : undefined;
  });
}

/** Latest run for a project stage (running or finished). */
export function useStageRun(projectId: string, stage: string) {
  return useTasks((s) => {
    const id = s.order.find((k) => s.runs[k]?.projectId === projectId && s.runs[k]?.stage === stage);
    return id ? s.runs[id] : undefined;
  });
}
