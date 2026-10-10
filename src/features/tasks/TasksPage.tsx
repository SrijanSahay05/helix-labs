import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { Check, X } from 'lucide-react';
import { useTasks } from '@/store/tasks';
import { useProjects } from '@/store/project';
import { SectionTitle, Tabs } from '@/components/ui/primitives';
import { StateFrame } from '@/components/ui/StateFrame';
import { cn } from '@/lib/cn';
import { agent } from '@/agent/engine';
import { AgentBadge } from '@/components/agents/AgentBadge';
import { runOwner } from '@/components/shell/TaskQueuePopover';
import { agentName } from '@/store/agents';

export function TasksPage() {
  const [tab, setTab] = useState<'running' | 'completed' | 'failed'>('running');
  const runs = useTasks(useShallow((s) => s.order.map((id) => s.runs[id])));
  const projects = useProjects((s) => s.projects);
  const list = runs.filter((r) => (tab === 'running' ? r.status === 'running' || r.status === 'paused' : tab === 'completed' ? r.status === 'done' : r.status === 'failed' || r.status === 'cancelled'));
  
  return (
    <div className="space-y-6">
      <SectionTitle
        title="Task Queue"
        sub="Long stages run in the background — you can keep working and Helix will notify you."
        right={
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { id: 'running', label: `Running (${runs.filter((r) => r.status === 'running' || r.status === 'paused').length})` },
              { id: 'completed', label: `Completed (${runs.filter((r) => r.status === 'done').length})` },
              { id: 'failed', label: `Failed (${runs.filter((r) => r.status === 'failed' || r.status === 'cancelled').length})` },
            ]}
          />
        }
      />
      
      {list.length === 0 ? (
        <StateFrame state="empty" message={tab === 'running' ? 'Nothing running right now.' : 'No jobs here yet.'} />
      ) : (
        <div className="bg-surface rounded-xl border border-line shadow-sm overflow-hidden">
          <div className="divide-y divide-line">
            {list.map((r) => {
              const active = r.status === 'running' || r.status === 'paused';
              const projectName = projects.find((p) => p.id === r.projectId)?.name;
              
              return (
                <div key={r.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 hover:bg-surface2/30 transition-colors">
                  {/* Left: Icon & Info */}
                  <div className="flex flex-1 items-center gap-4 min-w-0">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border border-line bg-surface shadow-xs">
                      <AgentBadge id={runOwner(r).id} preset="compact" size={32} placement={`tasks-${r.id}`} status={runOwner(r).status} orb={r.orb} quiet={!active} />
                    </div>
                    
                    <div className="flex flex-col min-w-0 justify-center">
                      <div className="truncate text-sm font-semibold text-ink">{r.title}</div>
                      <div className="truncate text-xs text-ink3 mt-1">
                        {agentName(runOwner(r).id)} · {projectName ?? 'Intake'}
                        {r.stage ? ` · ${r.stage}` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Right: Status, Progress, Actions */}
                  <div className="flex shrink-0 items-center justify-end gap-6 sm:w-auto w-full">
                    
                    {/* Status Badge */}
                    <div className="w-[140px] flex justify-start">
                      {active ? (
                        <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent border border-accent/20 shadow-sm">
                          <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span></span>
                          Running · ETA {Math.ceil(r.etaMs / 1000)}s
                        </span>
                      ) : r.status === 'done' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-pass-soft px-2.5 py-1 text-[11px] font-semibold text-pass border border-[color:var(--pass)]">
                          <Check size={14} /> Completed
                        </span>
                      ) : r.status === 'failed' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-fail-soft px-2.5 py-1 text-[11px] font-semibold text-fail border border-fail">
                          <X size={14} /> Failed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface2 px-2.5 py-1 text-[11px] font-semibold text-ink2 border border-line">
                          {r.status}
                        </span>
                      )}
                    </div>

                    {/* Fixed-width progress bar */}
                    <div className="hidden md:flex w-[140px] items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface2">
                        <div className={cn("h-full rounded-full transition-[width]", r.status === 'done' ? 'bg-pass' : r.status === 'failed' ? 'bg-fail' : 'bg-accent')} style={{ width: `${Math.round(r.progress * 100)}%` }} />
                      </div>
                      <span className="mono w-9 text-right text-[11px] font-medium text-ink2">{Math.round(r.progress * 100)}%</span>
                    </div>

                    {/* Actions */}
                    <div className="flex w-[80px] justify-end items-center">
                       {active && (
                         <button onClick={() => agent.cancel(r.id)} className="flex h-8 w-full items-center justify-center rounded-lg border border-line bg-surface px-3 text-xs font-medium text-fail hover:border-fail hover:bg-fail-soft transition-colors shadow-sm">
                           Cancel
                         </button>
                       )}
                       {r.projectId && !active && (
                         <Link to={`/projects/${r.projectId}${r.stage ? `#${r.stage}` : ''}`} className="flex h-8 w-full items-center justify-center rounded-lg border border-line bg-surface px-3 text-xs font-medium text-accent hover:border-accent hover:bg-surface2 transition-colors shadow-sm">
                           Review
                         </Link>
                       )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
