import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { AgentBot } from '@/components/agents/AgentBot';
import { HumanAvatar } from '@/components/agents/AgentTag';
import { projectCrew } from '@/agents/projectCrew';
import { botMotionAllowed } from '@/agent/engine';
import { agentName } from '@/store/agents';
import { Check, Download, FileText, Lock, Send, ShieldCheck } from 'lucide-react';
import type { Project } from '@/types';
import { SCENARIO } from '@/data/scenarios';
import { PROP } from '@/data/properties';
import { useProjects } from '@/store/project';
import { useUI } from '@/store/ui';
import { TypeText } from '@/components/ai/TypeText';
import { RecipeTable } from '@/components/tables/RecipeTable';
import { SourceTypeTag } from '@/components/ai/CitationChip';
import { StatusPill, Tag } from '@/components/ui/Pill';
import { Button } from '@/components/ui/Button';
import { StateFrame } from '@/components/ui/StateFrame';
import { costPerKg } from '@/lib/cost';
import { buildReport } from '@/lib/reports';
import { downloadXlsx, printPdf } from '@/lib/exporter';
import { runAgent } from '@/agent/engine';
import { exportScript } from '@/agent/scripts/stages';
import { cn } from '@/lib/cn';

const STEPS = ['draft', 'submitted', 'approved'] as const;
const celebrated = new Set<string>();

/** "Targets met": the crew that worked on the project hops once; Helix whirls in a party hat. ≤ 2 s. */
function CrewCelebration({ p, frozen }: { p: Project; frozen: boolean }) {
  const crew = projectCrew(p);
  const [party, setParty] = useState(() => !celebrated.has(p.id) && !frozen && botMotionAllowed());
  useEffect(() => {
    celebrated.add(p.id);
    if (!party) return;
    const t = setTimeout(() => setParty(false), 1600);
    return () => clearTimeout(t);
  }, [party, p.id]);
  return (
    <div className="flex flex-wrap items-end gap-1" aria-label={`Crew on this project: ${crew.map(agentName).join(', ')}`}>
      {crew.map((id) => (
        <span key={id} className="flex flex-col items-center" title={agentName(id)}>
          <AgentBot
            id={id}
            preset="hero"
            size={64}
            placement={`final-${p.id}`}
            status={party ? 'working' : 'idle'}
            frozen={frozen}
            override={id === 'conductor' && party ? { whirl: 1, hat: 'party' } : { jumpEvery: 0 }}
          />
          <span className="text-[10px] leading-3 text-ink3">{agentName(id)}</span>
        </span>
      ))}
      {p.approvers?.map((a) => (
        <span key={a} className="ml-2 flex flex-col items-center gap-1" title={`Approved by ${a}`}>
          <HumanAvatar name={a} size={44} className="ring-2 ring-pass" />
          <span className="text-[10px] leading-3 text-ink3">{a.split(' ')[0]}</span>
        </span>
      ))}
    </div>
  );
}

export function StageFinal({ p }: { p: Project }) {
  const s = SCENARIO[p.scenarioId];
  const role = useUI((st) => st.role);
  const user = useUI((st) => st.userName);
  const { update, setStage, log } = useProjects();
  const status = p.stages.final;
  if (status === 'waiting') return <StateFrame state="empty" agent="scribe" message="Final unlocks when every must-have target passes. Then I'll write the dossier." />;
  const trial = p.trials.find((t) => t.id === p.finalTrial) ?? p.trials[p.trials.length - 1];
  const locked = status === 'complete';
  const canApprove = role === 'reviewer' || role === 'admin';
  const tests = p.results.filter((r) => r.trialId === trial?.id);
  const days = Math.max(1, Math.round((Date.now() - new Date(p.activity[p.activity.length - 1]?.at ?? Date.now()).getTime()) / 86400000)) || 11;

  const lock = () => {
    const code = p.finalCode ?? `${s.codePrefix}-014`;
    update(p.id, (x) => ({ ...x, finalCode: code, approval: 'submitted', stageNotes: { ...x.stageNotes, final: `Formulation ${code} locked · ${x.iteration} iterations · ${days} days` } }));
    setStage(p.id, 'final', 'complete');
    log(p.id, user, `Locked ${code} and submitted for approval`);
  };
  const approve = () => {
    update(p.id, (x) => ({ ...x, approval: 'approved', approvers: [...new Set([...(x.approvers ?? []), user])] }));
    log(p.id, user, 'Approved final formulation');
  };
  const exportDossier = (fmt: 'xlsx' | 'pdf') => {
    const sheets = buildReport('dossier', p);
    runAgent(exportScript('Final dossier', 'dossier', sheets.length), {
      projectId: p.id,
      stage: 'final-export',
      onDone: () => (fmt === 'xlsx' ? downloadXlsx(`${p.finalCode ?? p.code}-dossier`, sheets) : printPdf(`Final dossier — ${p.finalCode ?? p.code}`, sheets, p.summary.replace(/\*\*/g, ''))),
      notify: { title: `Final dossier ready · ${p.finalCode ?? p.code}` },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-5 rounded-lg border border-pass/30 bg-[var(--pass-soft)] p-5">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 16 }} className="w-full">
          <CrewCelebration p={p} frozen={p.approval === 'approved'} />
        </motion.div>
        <div className="flex-1">
          {locked ? (
            <TypeText inline text={p.stageNotes?.final ?? `Formulation ${p.finalCode} locked`} id={`final:${p.id}:${p.finalCode}`} className="font-display text-[24px] font-semibold leading-8" />
          ) : (
            <span className="font-display text-[24px] font-semibold leading-8">Targets met by {trial?.id} — ready to lock</span>
          )}
          <div className="mt-1 flex items-center gap-2 text-sm text-ink2">
            <span className="mono">₹ {trial ? costPerKg(trial.recipe).toFixed(2) : '—'} / kg</span>·<span>ceiling ₹ {p.constraints.costCeiling}</span>·<span>{p.iteration} iterations</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {STEPS.map((st, i) => {
            const reached = STEPS.indexOf(p.approval) >= i;
            return (
              <div key={st} className="flex items-center gap-1">
                <span className={cn('flex h-6 items-center gap-1 rounded-full border px-2 text-2xs font-semibold capitalize', reached ? 'border-accent bg-accent-soft text-accent' : 'border-line text-ink3')}>
                  {reached && <Check size={10} strokeWidth={3} />}
                  {st}
                </span>
                {i < 2 && <span className="h-px w-3 bg-line" />}
              </div>
            );
          })}
          {p.approvers?.map((a) => (
            <HumanAvatar key={a} name={a} size={24} className="-ml-1 ring-2 ring-surface" />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Lock size={13} className="text-ink3" />
        <span className="text-sm font-medium">Locked recipe · {trial?.id}</span>
        <Tag>Read-only</Tag>
      </div>
      {trial && <RecipeTable trials={[trial]} ceiling={p.constraints.costCeiling} readOnly />}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-line">
          <div className="label px-3 pt-3">Test summary</div>
          <table className="mt-2 w-full">
            <tbody>
              {tests.map((r) => (
                <tr key={r.propertyId}>
                  <td className="td text-xs">{PROP[r.propertyId]?.name}</td>
                  <td className="td mono text-right text-xs">{Number.isFinite(r.mean) ? r.mean.toFixed(2) : '—'}</td>
                  <td className="td text-right">
                    <StatusPill status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="label mb-2">Sources</div>
          <div className="space-y-1.5">
            {[...p.sources.filter((x) => x.pinned), ...p.sources.filter((x) => !x.pinned)].slice(0, 6).map((x) => (
              <div key={x.id} className="flex items-center gap-2 text-xs">
                <SourceTypeTag type={x.type} />
                <span className="truncate text-ink2">{x.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
        {!locked && (
          <Button variant="primary" onClick={lock}>
            <Send size={13} /> Lock & submit
          </Button>
        )}
        {locked && p.approval === 'submitted' && (
          <Button variant="primary" onClick={approve} disabled={!canApprove} title={canApprove ? '' : 'Only Reviewer or Admin can approve'}>
            <ShieldCheck size={13} /> Approve
          </Button>
        )}
        {locked && p.approval === 'submitted' && !canApprove && <span className="text-xs text-ink3">Only a Reviewer or Admin can approve (switch role in Settings).</span>}
        <div className="ml-auto flex gap-2">
          <Button onClick={() => exportDossier('pdf')}>
            <FileText size={13} /> Export PDF
          </Button>
          <Button onClick={() => exportDossier('xlsx')}>
            <Download size={13} /> Export Excel
          </Button>
        </div>
      </div>
    </div>
  );
}
