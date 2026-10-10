import { motion } from 'framer-motion';
import { Check, Pencil, X } from 'lucide-react';
import { useState } from 'react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Project } from '@/types';
import { PROP } from '@/data/properties';
import { MAT } from '@/data/rawMaterials';
import { SCENARIO } from '@/data/scenarios';
import { useProjects } from '@/store/project';
import { useUI } from '@/store/ui';
import { AgentConsole } from '@/components/ai/AgentConsole';
import { TypeText } from '@/components/ai/TypeText';
import { DiffPreview } from '@/components/ai/DiffPreview';
import { CitationChip } from '@/components/ai/CitationChip';
import { RecipeTable } from '@/components/tables/RecipeTable';
import { StatusPill } from '@/components/ui/Pill';
import { Button } from '@/components/ui/Button';
import { StateFrame } from '@/components/ui/StateFrame';
import { useStageRun } from '@/agent/useAgentRun';
import { acceptIteration, startAnalysis } from '@/agent/controller';
import { costPerKg } from '@/lib/cost';
import { trialScore } from '@/lib/simulate';
import { targetText } from '@/lib/format';
import { useMode } from '@/lib/useModeText';
import { checkCost } from '@/lib/validate';
import { AgentBadge } from '@/components/agents/AgentBadge';
import { ProjectGraphs } from '@/features/graphs/ProjectGraphs';
import { AgentTag } from '@/components/agents/AgentTag';

export function AnalysisMatrix({ p }: { p: Project }) {
  const s = SCENARIO[p.scenarioId];
  const mode = useMode();
  const bm = s.benchmarks[0];
  const trials = p.trials.filter((t) => p.results.some((r) => r.trialId === t.id && r.status !== 'pending'));
  return (
    <div className="scroll-thin overflow-auto rounded-lg border border-line">
      <table className="w-full">
        <thead>
          <tr>
            <th className="th min-w-[200px]">Property</th>
            <th className="th">Target</th>
            <th className="th text-right">{bm?.name ?? 'Benchmark'}</th>
            {trials.map((t) => (
              <th key={t.id} className="th min-w-[118px] text-right">
                {t.id} <span className="font-normal text-ink3">it{t.iteration}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {s.measured.map((pid) => {
            const t = p.targets.find((x) => x.propertyId === pid);
            const bv = bm?.values.find((v) => v.propertyId === pid)?.value;
            return (
              <tr key={pid}>
                <td className="td">
                  {mode === 'scientist' ? PROP[pid]?.name : PROP[pid]?.plainName}
                  {t?.priority === 'must' && <span className="ml-1 text-2xs font-semibold text-accent">must</span>}
                </td>
                <td className="td mono text-xs">{t ? targetText(t) : '—'}</td>
                <td className="td mono text-right text-xs text-ink2">{bv ?? '—'}</td>
                {trials.map((tr) => {
                  const r = p.results.find((x) => x.trialId === tr.id && x.propertyId === pid);
                  return (
                    <td key={tr.id} className="td text-right" style={{ background: r && r.status !== 'pending' ? `var(--${r.status}-soft)` : undefined }}>
                      {r && r.status !== 'pending' ? (
                        <span className="flex items-center justify-end gap-1.5">
                          <span className="mono">{r.mean.toFixed(2)}</span>
                          <StatusPill status={r.status} />
                        </span>
                      ) : (
                        <span className="text-2xs text-ink3">Pending</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          <tr>
            <td className="td font-medium">{mode === 'scientist' ? 'Cost (₹/kg)' : 'Price per kg'}</td>
            <td className="td mono text-xs">≤ {p.constraints.costCeiling}</td>
            <td className="td mono text-right text-xs text-ink2">{bm?.pricePerKg ?? '—'}</td>
            {trials.map((tr) => {
              const c = costPerKg(tr.recipe);
              const over = checkCost(c, p.constraints.costCeiling);
              return (
                <td key={tr.id} className="td text-right" style={{ background: over ? 'var(--fail-soft)' : 'var(--pass-soft)' }}>
                  <span className="flex items-center justify-end gap-1.5">
                    <span className="mono">{c.toFixed(2)}</span>
                    <StatusPill status={over ? 'fail' : 'pass'} />
                  </span>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function PassChart({ p }: { p: Project }) {
  const ids = [...new Set(p.results.filter((r) => r.status !== 'pending').map((r) => r.trialId))];
  const data = ids.map((id) => ({ id, ...trialScore(id, p.results) }));
  return (
    <div className="h-[150px] rounded-lg border border-line p-2">
      <div className="label px-1">Targets passed per trial</div>
      <ResponsiveContainer width="100%" height="88%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
          <XAxis dataKey="id" tick={{ fontSize: 11, fill: 'var(--text-2)' }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: 'var(--surface-2)' }} contentStyle={{ fontSize: 12, background: 'var(--surface)', border: '1px solid var(--line)' }} />
          <Bar dataKey="pass" radius={[3, 3, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.id} fill={d.pass === d.total ? 'var(--pass)' : 'var(--accent)'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StageAnalysis({ p }: { p: Project }) {
  const run = useStageRun(p.id, 'analysis');
  const role = useUI((s) => s.role);
  const update = useProjects((s) => s.update);
  const [editing, setEditing] = useState(false);
  const status = p.stages.analysis;
  const readOnly = role === 'technician';
  const hasResults = p.results.some((r) => r.status !== 'pending');

  if (!hasResults) return <StateFrame state="empty" message="Analysis runs automatically when lab results are in." agent="analyst" />;
  if (status === 'failed') return <StateFrame state="failed" message={p.stageNotes?.analysis ?? "I couldn't finish the analysis."} onRetry={() => startAnalysis(p.id)} agent="analyst" />;

  const met = !!p.finalTrial && !p.proposal && (p.stages.final === 'running' || p.stages.final === 'complete');
  const summary = run?.typed['analysis.summary'] ?? (met ? `**Targets met ✓** — ${p.finalTrial} passes all must-have targets.` : p.proposal?.summary);
  const prop = p.proposal;
  const highlight = prop ? Object.fromEntries(prop.trials.map((t) => [t.id, new Set(prop.changes.filter((c) => c.trialId === t.id).map((c) => c.materialId))])) : undefined;

  return (
    <div className="space-y-4">
      {readOnly && <StateFrame state="read-only" message="Technicians can view analysis but not accept iterations" />}
      {run && (run.status === 'running' || run.status === 'paused') && <AgentConsole runId={run.id} />}
      <AnalysisMatrix p={p} />
      <ProjectGraphs p={p} placement="analysis" defaultCollapsed />
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      {summary ? (
        <div className="flex flex-col gap-4 rounded-lg border border-line bg-surface2/60 p-5 sm:flex-row">
          <div className="flex shrink-0 flex-col items-center gap-1">
            <AgentBadge id="analyst" preset="hero" size={88} placement={`analysis-${p.id}`} status={run?.status === 'running' ? 'working' : 'idle'} orb="composing" />
            <span className="text-xs font-semibold text-ink">Delta</span>
            <span className="text-2xs text-ink3">Analyst</span>
          </div>
          <div className="flex-1">
            <TypeText text={summary} id={`analysis:${p.id}:${summary}`} className="font-display text-[20px] leading-8 text-ink" />
            <div className="mt-2 flex gap-1">
              {['s1', 's6', 's7'].map((id) => {
                const idx = p.sources.findIndex((x) => x.id === id);
                return idx >= 0 ? <CitationChip key={id} n={Number(id.slice(1))} source={p.sources[idx]} /> : null;
              })}
            </div>
          </div>
        </div>
      ) : <div />}
        <PassChart p={p} />
      </div>
      {prop && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="flex items-center gap-2">
            <AgentTag id="analyst" placement={`prop-${p.id}`} title={false} />
            <span className="text-sm font-semibold">Proposed next trials · iteration {p.iteration + 1}</span>
            <span className="text-xs text-ink3">changes highlighted in green</span>
          </div>
          <RecipeTable
            trials={prop.trials}
            ceiling={p.constraints.costCeiling}
            readOnly={!editing}
            highlight={highlight}
            onCell={(tid, m, v) =>
              update(p.id, (x) => ({ ...x, proposal: x.proposal && { ...x.proposal, trials: x.proposal.trials.map((t) => (t.id === tid ? { ...t, recipe: { ...t.recipe, [m]: v } } : t)) } }))
            }
          />
          <DiffPreview
            agent="analyst"
            title="Changes vs best trial"
            items={prop.changes.map((c) => ({ label: `${c.trialId} · ${MAT[c.materialId]?.name ?? c.materialId}`, from: `${c.from.toFixed(2)} %`, to: `${c.to.toFixed(2)} %` }))}
          />
          {!readOnly && (
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={() => acceptIteration(p.id)}>
                <Check size={14} /> Accept next iteration
              </Button>
              <Button onClick={() => setEditing((e) => !e)}>
                <Pencil size={13} /> {editing ? 'Done editing' : 'Edit'}
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  update(p.id, (x) => ({ ...x, proposal: undefined }));
                  useProjects.getState().setStage(p.id, 'analysis', 'complete', 'Next iteration rejected');
                  useProjects.getState().log(p.id, useUI.getState().userName, 'Rejected proposed iteration');
                }}
              >
                <X size={13} /> Reject next iteration
              </Button>
            </div>
          )}
        </motion.div>
      )}
      {met && (
        <div className="flex items-center gap-3 rounded-lg border border-pass/30 bg-[var(--pass-soft)] p-3 text-sm">
          <Check size={16} className="text-pass" />
          <b className="text-pass">Targets met ✓</b>
          <span className="text-ink2">{p.finalTrial} is ready to lock. Final formulation unlocked below.</span>
          <a href="#final" className="ml-auto text-xs font-medium text-accent">
            Go to Final →
          </a>
        </div>
      )}
    </div>
  );
}
