import { Download, Plus } from 'lucide-react';
import { useState } from 'react';
import type { Project, Trial } from '@/types';
import { SCENARIO } from '@/data/scenarios';
import { MAT, RAW_MATERIALS } from '@/data/rawMaterials';
import { useProjects } from '@/store/project';
import { useUI } from '@/store/ui';
import { RecipeTable } from '@/components/tables/RecipeTable';
import { AgentConsole } from '@/components/ai/AgentConsole';
import { TypeText } from '@/components/ai/TypeText';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/primitives';
import { StateFrame } from '@/components/ui/StateFrame';
import { Tag } from '@/components/ui/Pill';
import { useStageRun } from '@/agent/useAgentRun';
import { runAgent } from '@/agent/engine';
import { exportScript } from '@/agent/scripts/stages';
import { buildReport } from '@/lib/reports';
import { downloadXlsx } from '@/lib/exporter';
import { shortDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { AgentBadge } from '@/components/agents/AgentBadge';
import { AgentBot } from '@/components/agents/AgentBot';

export function StageTrials({ p }: { p: Project }) {
  const s = SCENARIO[p.scenarioId];
  const run = useStageRun(p.id, 'trials');
  const exportRun = useStageRun(p.id, 'trials-export');
  const update = useProjects((st) => st.update);
  const role = useUI((st) => st.role);
  const [swap, setSwap] = useState<string | null>(null);
  const status = p.stages.trials;
  const readOnly = p.stages.final === 'complete' || role === 'reviewer';

  if (status === 'waiting' && !p.trials.length) return <StateFrame state="empty" message="Pick a pathway and I'll build trial recipes around it." agent="mixer" />;
  if (status === 'failed') return <StateFrame state="failed" message={p.stageNotes?.trials ?? "I couldn't build the recipes."} agent="mixer" />;

  const setCell = (tid: string, m: string, v: number) =>
    update(p.id, (x) => ({ ...x, trials: x.trials.map((t) => (t.id === tid ? { ...t, recipe: { ...t.recipe, [m]: v }, meta: { ...t.meta, [m]: { by: 'user' } } } : t)) }));
  const duplicate = (tid: string) =>
    update(p.id, (x) => {
      const src = x.trials.find((t) => t.id === tid)!;
      const id = `T${x.trials.length + 1}`;
      return { ...x, trials: [...x.trials, { ...src, id, iteration: x.iteration, recipe: { ...src.recipe }, meta: Object.fromEntries(Object.keys(src.recipe).map((k) => [k, { by: 'user' as const }])) }] };
    });
  const addTrial = () =>
    update(p.id, (x) => {
      const base = x.trials[x.trials.length - 1];
      const id = `T${x.trials.length + 1}`;
      const t: Trial = { id, iteration: x.iteration, recipe: Object.fromEntries(Object.keys(base?.recipe ?? {}).map((k) => [k, 0])), meta: {} };
      return { ...x, trials: [...x.trials, t] };
    });
  const doSwap = (from: string, to: string) =>
    update(p.id, (x) => ({
      ...x,
      trials: x.trials.map((t) => {
        if (!(from in t.recipe)) return t;
        const r = { ...t.recipe, [to]: t.recipe[from] };
        delete r[from];
        return { ...t, recipe: r, meta: { ...t.meta, [to]: { by: 'user' } } };
      }),
    }));
  const exportSheet = () => {
    const sheets = buildReport('trial-sheet', p);
    runAgent(exportScript('Trial sheet', 'trial-sheet', p.trials.length, 'mixer'), {
      id: `stage:${p.id}:trials-export`,
      projectId: p.id,
      stage: 'trials-export',
      onDone: () => downloadXlsx(`${p.code}-trial-sheet`, sheets),
    });
  };
  const protocol = run?.typed['trials.protocol'] ?? s.mixingProtocol.map((x, i) => `${i + 1}. ${x}`).join('\n');
  const alts = swap ? [...(MAT[swap]?.alternatives ?? []), ...RAW_MATERIALS.filter((m) => m.fn === MAT[swap]?.fn && m.id !== swap && !MAT[swap]?.alternatives.includes(m.id)).map((m) => m.id)] : [];

  return (
    <div className="space-y-4">
      {run && (run.status === 'running' || run.status === 'paused') && <AgentConsole runId={run.id} />}
      {readOnly && <StateFrame state="read-only" message={p.stages.final === 'complete' ? 'Formulation locked' : 'Reviewers cannot edit recipes'} />}
      <div className="flex flex-wrap items-center gap-2">
        <span className="whitespace-nowrap text-sm font-semibold">Recipe · % w/w</span>
        <Tag tone="accent">Iteration {p.iteration}</Tag>
        {p.selectedPathway && <Tag>Around {p.selectedPathway}</Tag>}
        <div className="ml-auto flex flex-wrap gap-2">
          {!readOnly && (
            <>
              <Button size="sm" variant="ghost" onClick={addTrial}>
                <Plus size={13} /> Add trial
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSwap(Object.keys(p.trials[0]?.recipe ?? {})[3] ?? null)}>
                Swap material
              </Button>
            </>
          )}
          <Button size="sm" onClick={exportSheet}>
            <Download size={13} /> Export trial sheet
          </Button>
        </div>
      </div>
      {exportRun && exportRun.status === 'running' && <AgentConsole runId={exportRun.id} />}
      {p.trials.length > 0 ? (
        <RecipeTable trials={p.trials} ceiling={p.constraints.costCeiling} readOnly={readOnly} onCell={setCell} onDuplicate={duplicate} onSwap={setSwap} />
      ) : (
        <StateFrame state="running">
          <div className="flex items-center gap-2 text-sm text-ink2">
            <AgentBadge id="mixer" preset="compact" placement={`trials-build-${p.id}`} status="working" orb="shaping" /> Batch is building recipes…
          </div>
        </StateFrame>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-line p-4">
          <div className="label mb-2">Mixing protocol</div>
          {protocol ? <TypeText text={protocol} id={`protocol:${p.id}:${protocol.length}`} className="space-y-1 text-sm leading-6 text-ink2" /> : <div className="skeleton h-16" />}
        </div>
        <div className="rounded-lg border border-line">
          <div className="label px-3 pt-3">Test plan</div>
          <table className="mt-2 w-full">
            <thead>
              <tr>
                <th className="th">Test</th>
                <th className="th">Method</th>
                <th className="th text-right">Specimens</th>
                <th className="th">Ages</th>
                <th className="th">Due</th>
              </tr>
            </thead>
            <tbody>
              {s.testPlan.map((t) => {
                const d = new Date();
                d.setDate(d.getDate() + t.dueInDays);
                return (
                  <tr key={t.test}>
                    <td className="td text-xs">{t.test}</td>
                    <td className="td mono text-xs">{t.method}</td>
                    <td className="td mono text-right text-xs">{t.specimens}</td>
                    <td className="td text-xs text-ink2">{t.ages}</td>
                    <td className="td mono text-xs">{shortDate(d.toISOString())}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!swap} onClose={() => setSwap(null)} title="Swap material" width={600}>
        {swap && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              Replace <b>{MAT[swap]?.name}</b>
              <select className="input ml-auto w-60" value={swap} onChange={(e) => setSwap(e.target.value)}>
                {Object.keys(p.trials[0]?.recipe ?? {}).map((m) => (
                  <option key={m} value={m}>
                    {MAT[m]?.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 text-xs text-ink2">
              <AgentBot id="mixer" preset="micro" placement="swap" /> Batch suggests alternatives with the same function ({MAT[swap]?.fn}); Ledger priced them.
            </div>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="th">Alternative</th>
                  <th className="th text-right">₹ / kg</th>
                  <th className="th text-right">Stock kg</th>
                  <th className="th">Approval</th>
                  <th className="th" />
                </tr>
              </thead>
              <tbody>
                {alts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="td text-center text-ink3">
                      No alternatives in the raw material master.
                    </td>
                  </tr>
                )}
                {alts.map((a, i) => (
                  <tr key={a}>
                    <td className="td">
                      {MAT[a]?.name} {i === 0 && <Tag tone="accent">✦ Helix pick</Tag>}
                    </td>
                    <td className={cn('td mono text-right', MAT[a]?.pricePerKg < (MAT[swap]?.pricePerKg ?? 0) && 'text-pass')}>{MAT[a]?.pricePerKg}</td>
                    <td className="td mono text-right">{MAT[a]?.stockKg.toLocaleString()}</td>
                    <td className="td">
                      <Tag tone={MAT[a]?.approval === 'approved' ? 'pass' : 'borderline'} className="capitalize">
                        {MAT[a]?.approval}
                      </Tag>
                    </td>
                    <td className="td text-right">
                      <Button size="sm" onClick={() => (doSwap(swap, a), setSwap(null))}>
                        Swap
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}
