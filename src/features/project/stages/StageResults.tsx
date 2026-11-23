import { Camera, Clipboard, Clock, FlaskRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Project, Result } from '@/types';
import { PROP } from '@/data/properties';
import { SCENARIO } from '@/data/scenarios';
import { profileFor } from '@/data/useCaseProfiles';
import { useProjects } from '@/store/project';
import { AgentConsole } from '@/components/ai/AgentConsole';
import { Button } from '@/components/ui/Button';
import { Drawer, Modal } from '@/components/ui/primitives';
import { StatusPill, Tag } from '@/components/ui/Pill';
import { StateFrame } from '@/components/ui/StateFrame';
import { useStageRun } from '@/agent/useAgentRun';
import { startAnalysis, startResults } from '@/agent/controller';
import { statusFor } from '@/lib/status';
import { daysUntil, shortDate, targetText } from '@/lib/format';
import { useMode } from '@/lib/useModeText';
import { cn } from '@/lib/cn';
import { AgentBadge } from '@/components/agents/AgentBadge';
import { ProjectGraphs } from '@/features/graphs/ProjectGraphs';
import { useGraphs, useGraphsRuntime } from '@/features/graphs/store';
import { useUI } from '@/store/ui';

/** Results grid ↔ Graphs: hovering/selecting trial columns drives the plot, and plot selections highlight columns. */
function useResultsSync(projectId: string) {
  const key = `${projectId}:project`;
  const active = useUI((s) => s.graphsDataset) === 'project';
  const selection = useGraphs((s) => s.views[key]?.selection);
  const hovered = useGraphsRuntime((s) => s.hovered);
  const patch = useGraphs((s) => s.patch);
  const selected = new Set(active ? (selection ?? []) : []);
  const first = active ? selection?.[0] : undefined;
  useEffect(() => {
    if (first) document.querySelector(`[data-trial-col="${first}"]`)?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [first]);
  return {
    selected,
    hovered: active ? hovered : undefined,
    hover: (id?: string) => active && useGraphsRuntime.getState().set({ hovered: id }),
    toggle: (id: string) => active && patch(key, (v) => ({ selection: v.selection.includes(id) ? v.selection.filter((x) => x !== id) : [...v.selection, id] })),
  };
}

export function ResultCell({ r, onOpen }: { r?: Result; onOpen?: () => void }) {
  if (!r) return <span className="text-ink3">—</span>;
  if (r.status === 'pending')
    return (
      <button onClick={onOpen} title="Results pending" className="ml-auto flex items-center justify-end gap-1 whitespace-nowrap rounded-[6px] border border-dashed border-line px-2 py-1 text-2xs text-ink2 hover:border-accent">
        <Clock size={11} /> {r.dueDate ? `Due ${shortDate(r.dueDate)}` : 'Pending'}
      </button>
    );
  return (
    <button onClick={onOpen} className="flex w-full items-center justify-end gap-1.5 rounded px-1 py-0.5 hover:bg-surface2">
      <span className="mono text-sm">{r.mean.toFixed(2)}</span>
      <StatusPill status={r.status} />
    </button>
  );
}

export function StageResults({ p }: { p: Project }) {
  const graphsSync = useResultsSync(p.id);
  const s = SCENARIO[p.scenarioId];
  const mode = useMode();
  const run = useStageRun(p.id, 'results');
  const update = useProjects((st) => st.update);
  const [open, setOpen] = useState<{ t: string; prop: string } | null>(null);
  const [paste, setPaste] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const status = p.stages.results;
  const trials = p.trials;
  const pending = p.results.filter((r) => r.status === 'pending');
  const dueChips = [...new Map(pending.filter((r) => r.dueDate).map((r) => [r.propertyId, r])).values()];

  if (!trials.length) return <StateFrame state="empty" message="Results appear here once trials are designed and the lab starts testing." agent="lab" />;

  const cur = open ? p.results.find((r) => r.trialId === open.t && r.propertyId === open.prop) : undefined;
  const sync = graphsSync;
  const target = open ? p.targets.find((t) => t.propertyId === open.prop) : undefined;
  const setResult = (patch: Partial<Result>) =>
    update(p.id, (x) => ({
      ...x,
      results: x.results.map((r) => {
        if (r.trialId !== open!.t || r.propertyId !== open!.prop) return r;
        const n = { ...r, ...patch };
        if (patch.readings) {
          const vals = patch.readings.filter((v) => Number.isFinite(v));
          n.mean = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100 : NaN;
          n.status = target && vals.length ? statusFor(n.mean, target.operator, target.value) : 'pending';
        }
        return n;
      }),
    }));

  return (
    <div className="space-y-4">
      {run && (run.status === 'running' || run.status === 'paused') && <AgentConsole runId={run.id} />}
      <div className="flex flex-wrap items-center gap-2">
        {status === 'running' && run?.status !== 'running' && pending.length > 0 && (
          <span className="flex items-center gap-2 text-sm text-ink2">
            <AgentBadge id="lab" preset="compact" placement={`results-${p.id}`} status="waiting" /> <b className="font-semibold text-ink">Probe</b> is waiting for the lab
          </span>
        )}
        {dueChips.map((r) => {
          const days = r.dueDate ? daysUntil(r.dueDate) : 0;
          return (
            <Tag key={r.propertyId} tone="pending">
              <Clock size={10} /> {mode === 'scientist' ? PROP[r.propertyId]?.name.replace('Tensile adhesion — ', '') : PROP[r.propertyId]?.plainName} · due {shortDate(r.dueDate!)} · {days} d
            </Tag>
          );
        })}
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => setPaste(true)} disabled={!pending.length}>
            <Clipboard size={13} /> Paste from Excel
          </Button>
          <Button size="sm" variant="primary" onClick={() => startResults(p.id, 'sample')} disabled={!pending.length}>
            <FlaskRound size={13} /> Import lab results
          </Button>
          {!pending.length && p.stages.analysis !== 'running' && (
            <Button size="sm" onClick={() => startAnalysis(p.id)}>
              Re-run analysis
            </Button>
          )}
        </div>
      </div>

      <div className="scroll-thin overflow-auto rounded-lg border border-line">
        <table className="w-full">
          <thead>
            <tr>
              <th className="th min-w-[220px]">Property</th>
              <th className="th">Target</th>
              {trials.map((t) => (
                <th
                  key={t.id}
                  data-trial-col={t.id}
                  className={cn('th min-w-[120px] cursor-pointer text-right transition-colors', sync.selected.has(t.id) && 'bg-accent-soft text-accent', sync.hovered === t.id && 'outline outline-1 -outline-offset-1 outline-accent')}
                  onMouseEnter={() => sync.hover(t.id)}
                  onMouseLeave={() => sync.hover(undefined)}
                  onClick={() => sync.toggle(t.id)}
                  title="Click to select this trial in Graphs (when Graphs shows this project's data)"
                >
                  {t.id}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {s.measured.map((pid) => {
              const t = p.targets.find((x) => x.propertyId === pid);
              return (
                <tr key={pid}>
                  <td className="td">
                    {mode === 'scientist' ? PROP[pid]?.name : PROP[pid]?.plainName} <span className="text-2xs text-ink3">{PROP[pid]?.unit}</span>
                  </td>
                  <td className="td mono whitespace-nowrap text-xs text-ink2">{t ? targetText(t) : '—'}</td>
                  {trials.map((tr) => {
                    const r = p.results.find((x) => x.trialId === tr.id && x.propertyId === pid);
                    return (
                      <td key={tr.id} className={cn('td text-right', r?.status === 'pending' && 'bg-surface2/40')}>
                        <ResultCell r={r} onOpen={() => setOpen({ t: tr.id, prop: pid })} />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ProjectGraphs p={p} placement="results" />

      <Drawer open={!!open} onClose={() => setOpen(null)} title={open ? `${open.t} · ${PROP[open.prop]?.name}` : ''} width={460}>
        {cur && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-ink2">Target</span>
              <b className="mono">{target ? targetText(target) : '—'}</b>
              <span className="text-ink3">{PROP[open!.prop]?.unit}</span>
              <span className="ml-auto">{cur.status !== 'pending' && <StatusPill status={cur.status} />}</span>
            </div>
            <div>
              <div className="label mb-1">Specimen readings</div>
              <div className="grid grid-cols-5 gap-1.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <input
                    key={i}
                    type="number"
                    step="0.01"
                    className="input mono text-right"
                    value={Number.isFinite(cur.readings[i]) ? cur.readings[i] : ''}
                    onChange={(e) => {
                      const rd = [...cur.readings];
                      while (rd.length < 5) rd.push(NaN);
                      rd[i] = e.target.value === '' ? NaN : Number(e.target.value);
                      setResult({ readings: rd, testDate: cur.testDate ?? new Date().toISOString().slice(0, 10) });
                    }}
                  />
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-ink2">Mean</span>
                <span className="mono text-lg font-semibold">{Number.isFinite(cur.mean) ? cur.mean.toFixed(2) : '—'}</span>
              </div>
            </div>
            <label className="block">
              <span className="label">Failure mode</span>
              <select className="input mt-1" value={cur.failureMode ?? ''} onChange={(e) => setResult({ failureMode: e.target.value })}>
                <option value="">—</option>
                {profileFor(p.subcategoryId).failureModes.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label">Test date</span>
              <input type="date" className="input mono mt-1" value={cur.testDate ?? ''} onChange={(e) => setResult({ testDate: e.target.value })} />
            </label>
            {cur.dueDate && cur.status === 'pending' && (
              <div className="flex items-center gap-2 rounded-md border border-dashed border-line p-2 text-xs text-ink2">
                <Clock size={12} /> Aged test due {shortDate(cur.dueDate)} ({daysUntil(cur.dueDate)} days)
              </div>
            )}
            <div>
              <div className="label mb-1">Photos</div>
              <div className="flex gap-2">
                {(cur.photos ?? []).map((ph) => (
                  <img key={ph} src={ph} className="h-16 w-16 rounded-md border border-line object-cover" />
                ))}
                <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-md border border-dashed border-line text-ink3 hover:text-ink">
                  <Camera size={16} />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setResult({ photos: [...(cur.photos ?? []), URL.createObjectURL(f)] });
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      <Modal open={paste} onClose={() => setPaste(false)} title="Paste from Excel">
        <div className="space-y-3">
          <p className="text-xs text-ink2">Paste a block of readings (rows = properties, columns = trials). Helix maps them automatically.</p>
          <textarea className="input mono h-40 py-2 text-xs" value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder={'1.12\t1.28\t1.34\t1.41\n0.92\t1.04\t1.08\t1.12\n…'} />
          <div className="flex justify-between">
            <button className="text-xs text-accent" onClick={() => setPasteText(s.measured.map((pid) => p.trials.map((t) => (s.resultMeans?.[pid]?.[t.id] ?? 1).toFixed(2)).join('\t')).join('\n'))}>
              Fill from latest lab sheet
            </button>
            <Button
              variant="primary"
              onClick={() => {
                const n = (pasteText.match(/-?\d+(\.\d+)?/g) ?? []).length;
                setPaste(false);
                startResults(p.id, 'paste', n || undefined);
              }}
            >
              Parse with Helix
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
