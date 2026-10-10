import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Columns3, Wand2, Wrench } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Pathway, Project } from '@/types';
import { SCENARIO } from '@/data/scenarios';
import { MAT } from '@/data/rawMaterials';
import { PROP } from '@/data/properties';
import { useProjects } from '@/store/project';
import { AgentConsole } from '@/components/ai/AgentConsole';
import { CitationChip } from '@/components/ai/CitationChip';
import { CountUp } from '@/components/ai/TypeText';
import { StatusPill, Tag } from '@/components/ui/Pill';
import { Button } from '@/components/ui/Button';
import { Modal, ScoreBar } from '@/components/ui/primitives';
import { StateFrame } from '@/components/ui/StateFrame';
import { useStageRun } from '@/agent/useAgentRun';
import { startPathways, startTrials, startVariant } from '@/agent/controller';
import { checkCost, errorLabel } from '@/lib/validate';
import { useMode } from '@/lib/useModeText';
import { cn } from '@/lib/cn';
import { targetText } from '@/lib/format';
import { AgentBot } from '@/components/agents/AgentBot';
import { AgentBadge } from '@/components/agents/AgentBadge';
import { AgentTag } from '@/components/agents/AgentTag';

export const COMP_COLORS = ['#3D5AFE', '#5C77FF', '#7D92FF', '#9EADFF', '#BFC9FF', '#8A93A3', '#B7BFCC', '#D6DBE3', '#5A6270'];

export function CompositionBar({ pw }: { pw: Pathway }) {
  const mids = pw.composition.map((c) => (c.range[0] + c.range[1]) / 2);
  const total = mids.reduce((a, b) => a + b, 0);
  return (
    <div className="flex h-2.5 overflow-hidden rounded">
      {pw.composition.map((c, i) => (
        <motion.div
          key={c.materialId}
          title={`${MAT[c.materialId]?.name} ${c.range[0]}–${c.range[1]} %`}
          initial={{ width: 0 }}
          animate={{ width: `${(mids[i] / total) * 100}%` }}
          transition={{ duration: 0.5, delay: i * 0.05 }}
          style={{ background: COMP_COLORS[i % COMP_COLORS.length], minWidth: 2 }}
        />
      ))}
    </div>
  );
}

function PathwayCard({ p, pw, onVariant }: { p: Project; pw: Pathway; onVariant: () => void }) {
  const mode = useMode();
  const update = useProjects((s) => s.update);
  const selected = p.selectedPathway === pw.id && p.stages.trials !== 'waiting';
  const comparing = p.compare.includes(pw.id);
  const costErr = checkCost(pw.costPerKg, p.constraints.costCeiling);
  const toggleCompare = () =>
    update(p.id, (x) => ({ ...x, compare: x.compare.includes(pw.id) ? x.compare.filter((y) => y !== pw.id) : x.compare.length < 3 ? [...x.compare, pw.id] : x.compare }));
  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn('rounded-lg border bg-surface p-4 md:p-5', selected ? 'border-accent shadow-glow' : 'border-line')}>
      <div className="flex items-start gap-3">
        <div className="mono flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent text-sm font-bold text-on-accent">{pw.rank}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="mono text-xs text-ink3">{pw.id}</span>
            <span className="font-semibold">{pw.name}</span>
            {pw.variantOf && <Tag tone="accent">Variant</Tag>}
            {selected && <Tag tone="pass">Selected</Tag>}
          </div>
          <div className="mt-2">
            <CompositionBar pw={pw} />
          </div>
        </div>
        <div className="text-right">
          <div className="label">Overall</div>
          <div className="mono text-xl font-semibold text-accent">
            <CountUp value={pw.scores.overall} decimals={2} />
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-5 md:grid-cols-2 2xl:grid-cols-[1.1fr_1.25fr_1fr]">
        <div>
          <div className="label mb-1">Composition (% w/w)</div>
          <table className="w-full">
            <tbody>
              {pw.composition.map((c, i) => (
                <tr key={c.materialId}>
                  <td className="py-0.5 pr-2 text-xs">
                    <span className="mr-1.5 inline-block h-2 w-2 rounded-sm" style={{ background: COMP_COLORS[i % COMP_COLORS.length] }} />
                    {MAT[c.materialId]?.name}
                  </td>
                  <td className="mono whitespace-nowrap py-0.5 pl-2 text-right text-xs">{c.range[0] === c.range[1] ? c.range[0].toFixed(2) : `${c.range[0]}–${c.range[1]}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <div className="label mb-1">Predicted vs target</div>
          <table className="w-full">
            <tbody>
              {pw.predicted.map((x) => {
                const t = p.targets.find((y) => y.propertyId === x.propertyId);
                return (
                  <tr key={x.propertyId}>
                    <td className="py-0.5 pr-2 text-xs text-ink2">{mode === 'scientist' ? PROP[x.propertyId]?.name.replace('Tensile adhesion — ', 'Adh. ') : PROP[x.propertyId]?.plainName}</td>
                    <td className="mono py-0.5 text-right text-xs">{x.value}</td>
                    <td className="mono whitespace-nowrap py-0.5 pl-1 text-2xs text-ink3">{t ? targetText(t) : ''}</td>
                    <td className="py-0.5 pl-2 text-right">
                      <StatusPill status={x.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="space-y-1.5">
          <div className="label">Scores</div>
          <ScoreBar label="Target match" value={pw.scores.targetMatch} />
          <ScoreBar label="Cost" value={pw.scores.cost} />
          <ScoreBar label="Availability" value={pw.scores.availability} tone={pw.scores.availability < 0.6 ? 'borderline' : 'accent'} />
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-xs text-ink2">Cost / kg</span>
            <span className={cn('mono text-md font-semibold', costErr && 'text-fail')}>₹ {pw.costPerKg.toFixed(2)}</span>
          </div>
          {costErr && (
            <div className="flex items-center gap-1 text-2xs font-semibold text-fail">
              <AgentBot id="sentinel" preset="micro" placement={`pw-cost-${pw.id}`} /> ✕ {errorLabel(costErr)}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
        <span className="flex items-center gap-1 text-xs text-ink2">
          <Wrench size={12} /> {pw.equipment.join(', ')}
        </span>
        {pw.hazards.map((h) => (
          <span key={h} title="Flagged by Guard" className="flex items-center gap-1 rounded border border-borderline/30 bg-[var(--borderline-soft)] py-px pl-0.5 pr-1.5 text-2xs text-borderline">
            <AgentBot id="sentinel" preset="micro" placement={`pw-hz-${pw.id}`} size={14} /> <AlertTriangle size={10} /> {h}
          </span>
        ))}
        <span className="ml-auto flex gap-1">
          {pw.citations.map((c) => {
            const idx = p.sources.findIndex((s) => s.id === c);
            return <CitationChip key={c} n={idx >= 0 ? idx + 1 : c.replace(/\D/g, '')} source={p.sources.find((s) => s.id === c)} />;
          })}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-2xs text-ink3">
        <AgentTag id="weaver" placement={`pw-sig-${pw.id}`} prefix="Designed by" title={false} className="text-2xs" />
        <span>· scored by</span>
        <AgentTag id="weaver" placement={`pw-sig-${pw.id}`} title={false} className="text-2xs" />
        <span>&</span>
        <AgentTag id="cost" placement={`pw-sig-${pw.id}`} title={false} className="text-2xs" />
        <span>· hazards checked by</span>
        <AgentTag id="sentinel" placement={`pw-sig-${pw.id}`} title={false} className="text-2xs" />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-ink2">
          <input type="checkbox" checked={comparing} onChange={toggleCompare} disabled={!comparing && p.compare.length >= 3} className="accent-[var(--accent)]" />
          Compare
        </label>
        <Button size="sm" variant="ghost" onClick={onVariant} className="ml-auto">
          <Wand2 size={13} /> Request a variant
        </Button>
        <Button size="sm" variant={selected ? 'secondary' : 'primary'} onClick={() => startTrials(p.id, pw.id)}>
          {selected ? 'Re-design trials' : 'Select & design trials'}
        </Button>
      </div>
    </motion.div>
  );
}

export function StagePathways({ p }: { p: Project }) {
  const s = SCENARIO[p.scenarioId];
  const run = useStageRun(p.id, 'pathways');
  const [variantFor, setVariantFor] = useState<Pathway | null>(null);
  const [prompt, setPrompt] = useState('');
  const variantRun = useStageRun(p.id, 'pathways-variant');
  const status = p.stages.pathways;
  const ghosts = status === 'running' ? Math.max(0, s.pathways.length - p.pathways.length) : 0;

  if (status === 'waiting' && !p.pathways.length)
    return <StateFrame state="empty" agent="weaver" message="I design pathways once Lumen finishes the literature review." action={p.stages.literature === 'complete' ? <Button size="sm" variant="primary" onClick={() => startPathways(p.id)}>Generate pathways</Button> : undefined} />;
  if (status === 'failed') return <StateFrame state="failed" agent="weaver" message={p.stageNotes?.pathways ?? "I couldn't generate pathways."} onRetry={() => startPathways(p.id)} />;

  return (
    <div className="space-y-3">
      {run && (run.status === 'running' || run.status === 'paused') && <AgentConsole runId={run.id} />}
      {status === 'low-confidence' && (
        <StateFrame state="low-confidence" agent="weaver" message={p.stageNotes?.pathways} items={['P3 retarder dosage extrapolated beyond source data', 'Only 2 supporting sources for P3']} action={<Button size="sm" onClick={() => useProjects.getState().setStage(p.id, 'pathways', 'complete', `${p.pathways.length} ranked pathways · reviewed`)}>Review</Button>} />
      )}
      {variantRun && variantRun.status === 'running' && <AgentConsole runId={variantRun.id} />}
      <AnimatePresence>
        {[...p.pathways]
          .sort((a, b) => a.rank - b.rank || a.id.localeCompare(b.id))
          .map((pw) => (
            <PathwayCard key={pw.id} p={p} pw={pw} onVariant={() => (setVariantFor(pw), setPrompt(`Make ${pw.id} cheaper by 10 %`))} />
          ))}
      </AnimatePresence>
      {Array.from({ length: ghosts }, (_, i) => (
        <div key={i} className="flex h-[140px] items-center gap-3 rounded-lg border border-dashed border-line p-4">
          {i === 0 ? <AgentBadge id="weaver" preset="compact" placement={`pw-ghost-${p.id}`} status="working" orb="weaving" /> : <span className="w-[30px]" />}
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3 w-1/3" />
            <div className="skeleton h-2.5 w-full" />
            <div className="skeleton h-2.5 w-2/3" />
          </div>
        </div>
      ))}
      <AnimatePresence>
        {p.compare.length > 0 && (
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} className="sticky bottom-3 z-10 mx-auto flex w-fit items-center gap-3 rounded-full border border-line bg-surface px-4 py-2 shadow-pop">
            <Columns3 size={14} className="text-accent" />
            <span className="text-sm">
              Comparing <b>{p.compare.join(', ')}</b> <span className="text-ink3">({p.compare.length}/3)</span>
            </span>
            <Link to={`/projects/${p.id}/compare`} className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-on-accent">
              Compare side by side
            </Link>
            <button onClick={() => useProjects.getState().update(p.id, (x) => ({ ...x, compare: [] }))} className="text-xs text-ink3">
              Clear
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <Modal open={!!variantFor} onClose={() => setVariantFor(null)} title={`Request a variant of ${variantFor?.id}`}>
        <div className="space-y-3">
          <textarea className="input h-20 py-2" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          <div className="flex flex-wrap gap-1.5">
            {['Make it cheaper by 10 %', 'Improve deformability', 'Avoid single-source suppliers'].map((x) => (
              <button key={x} onClick={() => setPrompt(`${x.replace('it', variantFor?.id ?? 'it')}`)} className="rounded-full border border-line px-2 py-0.5 text-2xs text-ink2 hover:text-accent">
                {x}
              </button>
            ))}
          </div>
          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={() => {
                if (variantFor) startVariant(p.id, variantFor.id, prompt);
                setVariantFor(null);
              }}
            >
              <Wand2 size={13} /> Generate variant
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
