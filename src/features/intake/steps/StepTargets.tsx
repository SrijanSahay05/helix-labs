import { useState } from 'react';
import { TargetsTable } from '@/components/tables/TargetsTable';
import { AIField } from '@/components/ai/AIField';
import { PROP, methodFor } from '@/data/properties';
import { SCENARIO } from '@/data/scenarios';
import { buildTargets } from '@/lib/simulate';
import { useMode } from '@/lib/useModeText';
import { useUI } from '@/store/ui';
import { useTasks } from '@/store/tasks';
import { useProjects } from '@/store/project';
import { cn } from '@/lib/cn';
import type { TargetRow } from '@/types';
import { useDraft, userSet } from '../useDraft';
import { AgentBot } from '@/components/agents/AgentBot';

const nameOf = (id: string, mode: string) => (id === 'cost' ? (mode === 'scientist' ? 'Cost per kg' : 'Price per kg') : mode === 'scientist' ? PROP[id]?.name : PROP[id]?.plainName);

function Top3() {
  const d = useDraft();
  const mode = useMode();
  const s = SCENARIO[d.scenarioId];
  const [drag, setDrag] = useState<string | null>(null);
  const place = (slot: number, id: string) => {
    const next = d.top3.filter((x) => x !== id);
    next.splice(slot, 0, id);
    userSet('top3', next.slice(0, 3), 'Top 3');
  };
  return (
    <AIField path="top3" label="What should Helix optimise most?" meta={d.meta.top3} display={d.top3.map((x) => nameOf(x, mode)).join(' › ')}>
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((slot) => {
            const id = d.top3[slot];
            const reason = s.top3.find((t) => t.id === id)?.reason;
            return (
              <div
                key={slot}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => drag && place(slot, drag)}
                draggable={!!id}
                onDragStart={() => id && setDrag(id)}
                className={cn('min-h-[96px] cursor-grab rounded-lg border p-3.5', id ? 'border-accent/30 bg-accent-soft' : 'border-dashed border-line')}
              >
                <div className="flex items-start gap-2">
                  <span className="mono grid h-6 w-6 shrink-0 place-items-center rounded-md bg-accent text-xs font-bold text-on-accent">{slot + 1}</span>
                  <span className="text-sm font-semibold leading-6 text-ink">{id ? nameOf(id, mode) : 'Drop a property here'}</span>
                </div>
                {reason && (
                  <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-ink2">
                    <AgentBot id="targets" preset="micro" placement={`top3-${slot}`} className="mt-0.5" />
                    <span>{reason}</span>
                  </p>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </AIField>
  );
}

/** Targets (brief p. 5). Owner: Atul — confirms the property template and limits with R&D. */
export function StepTargets() {
  const d = useDraft();
  const mode = useMode();
  const standards = useUI((s) => s.standards);
  const running = useTasks((s) => (d.runId ? s.runs[d.runId]?.status === 'running' && s.runs[d.runId]?.scriptId.startsWith('intake.step.targets') : false));
  const s = SCENARIO[d.scenarioId];
  const helixRows = buildTargets(s, standards);
  const setRows = (rows: TargetRow[]) => useProjects.getState().setDraft('targets', rows);
  return (
    <div className="space-y-4">
      {mode === 'scientist' && d.targets.length > 0 && <Top3 />}
      {mode === 'non-scientist' && d.top3.length > 0 && (
        <div className="card flex items-center gap-3 p-3 text-sm" data-ai-path="top3">
          <AgentBot id="targets" preset="micro" placement="top3-plain" />
          Vega will focus most on: {d.top3.map((x, i) => <b key={x} className="text-ink">{i + 1}. {nameOf(x, mode)}{i < 2 ? ' · ' : ''}</b>)}
        </div>
      )}
      <TargetsTable
        rows={d.targets}
        mode={mode}
        pendingCount={running ? Math.max(0, s.targets.length - d.targets.length) : 0}
        onChange={(i, r) => {
          const next = d.targets.map((x, k) => (k === i ? { ...r, meta: { by: 'user' as const, confidence: 1, reason: 'Set by you' } } : x));
          setRows(next);
          userSet(`targets.${i}`, next[i], PROP[r.propertyId]?.name);
        }}
        onRemove={(i) => setRows(d.targets.filter((_, k) => k !== i))}
        onReset={(i) => {
          const h = helixRows.find((x) => x.propertyId === d.targets[i].propertyId);
          if (h) setRows(d.targets.map((x, k) => (k === i ? h : x)));
        }}
        onAdd={(pid) =>
          setRows([
            ...d.targets,
            { propertyId: pid, testMethod: methodFor(pid, standards), unit: PROP[pid]?.unit ?? '', operator: '>=', value: 0, priority: 'nice', meta: { by: 'user', confidence: 1, reason: 'Added by you' } },
          ])
        }
      />
    </div>
  );
}
