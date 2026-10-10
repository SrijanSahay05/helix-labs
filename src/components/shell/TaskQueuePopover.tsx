import { ListChecks, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { useTasks, useRunningCount } from '@/store/tasks';
import { useProjects } from '@/store/project';
import { agent } from '@/agent/engine';
import { AgentBadge } from '@/components/agents/AgentBadge';
import { CrewStack } from '@/components/agents/CrewStrip';
import type { AgentId, AgentStatus } from '@/agents/registry';
import { agentName } from '@/store/agents';
import { Popover } from '@/components/ui/primitives';
import type { RunState } from '@/agent/types';

/** A run's owner as seen from the queue: the agent working now, or the lead once it's over. */
export function runOwner(r: RunState): { id: AgentId; status: AgentStatus } {
  const id = (r.status === 'running' || r.status === 'paused' ? r.agent : r.lead) ?? 'conductor';
  const status: AgentStatus = r.status === 'running' ? 'working' : r.status === 'paused' ? 'paused' : r.status === 'failed' ? 'failed' : r.status === 'done' ? 'idle' : 'idle';
  return { id, status };
}

export function TaskRow({ r, projectName }: { r: RunState; projectName?: string }) {
  const active = r.status === 'running' || r.status === 'paused';
  const o = runOwner(r);
  return (
    <div className="flex items-center gap-2.5 py-2">
      <AgentBadge id={o.id} preset="compact" size={28} placement={`task-${r.id}`} status={o.status} orb={r.orb} quiet={!active} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-medium">
          {r.title} <span className="font-normal text-ink3">· {agentName(o.id)}</span>
        </div>
        <div className="truncate text-2xs text-ink3">
          {projectName ?? 'Intake'}
          {r.stage ? ` · ${r.stage}` : ''} · {active ? `ETA ${Math.ceil(r.etaMs / 1000)} s` : r.status}
        </div>
        <div className="mt-1 h-1 overflow-hidden rounded bg-surface2">
          <div className="h-full rounded bg-accent transition-[width]" style={{ width: `${Math.round(r.progress * 100)}%` }} />
        </div>
      </div>
      <span className="mono w-9 text-right text-2xs text-ink2">{Math.round(r.progress * 100)}%</span>
      {active && (
        <button title="Cancel" onClick={() => agent.cancel(r.id)} className="rounded p-0.5 text-ink3 hover:bg-surface2 hover:text-fail">
          <X size={12} />
        </button>
      )}
    </div>
  );
}

export function TaskQueuePopover() {
  const running = useRunningCount();
  const runs = useTasks(useShallow((s) => s.order.slice(0, 8).map((id) => s.runs[id])));
  const projects = useProjects((s) => s.projects);
  const working = useTasks(
    useShallow((s) => [...new Set(Object.values(s.runs).flatMap((r) => (r.status === 'running' ? r.crew.filter((a) => r.crewStatus[a] === 'working') : [])))]),
  );
  return (
    <Popover
      align="right"
      width={360}
      trigger={() => (
        <button className="flex h-9 items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 text-xs font-medium text-ink2 hover:bg-surface2 hover:text-ink" title="Task queue" aria-label="Task queue">
          {running > 0 && working.length > 0 ? <CrewStack ids={working} animate={working} max={3} size={22} scope="topbar" /> : <ListChecks size={15} />}
          <span className="hidden xl:inline">Task queue</span>
          {running > 0 && <span className="rounded-full bg-accent px-1.5 text-2xs font-semibold text-on-accent">{running}</span>}
        </button>
      )}
    >
      {(close) => (
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-semibold">Task queue</span>
            <Link to="/tasks" onClick={close} className="text-2xs text-accent">
              Open all
            </Link>
          </div>
          {runs.length === 0 && <div className="py-4 text-center text-xs text-ink3">No jobs yet.</div>}
          <div className="divide-y divide-line">
            {runs.map((r) => (
              <TaskRow key={r.id} r={r} projectName={projects.find((p) => p.id === r.projectId)?.name} />
            ))}
          </div>
        </div>
      )}
    </Popover>
  );
}
