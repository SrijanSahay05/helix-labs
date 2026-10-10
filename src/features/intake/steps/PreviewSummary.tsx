import { useState } from 'react';
import { AgentBadge } from '@/components/agents/AgentBadge';
import { Markdown, TypeText } from '@/components/ai/TypeText';
import { useTasks } from '@/store/tasks';
import type { IntakeStep } from '@/store/project';
import { useDraft } from '../useDraft';

export function phraseToStep(t: string): IntakeStep {
  const s = t.toLowerCase();
  if (/\bis\s?\d|\ben\s?\d|astm|class/.test(s)) return 'subcategory';
  if (/benchmark|match/.test(s)) return 'benchmark';
  if (/₹|cost|budget|mid|premium|economy/.test(s)) return 'constraints';
  if (/adhesion|deformation|grip|flex|strength|pressure|flow|slump|reduction|healing|absorption|pot life|setting/.test(s)) return 'targets';
  if (/tile|facade|wall|climate|humid|hot|trowel|grout|spray|pour|brush|jacket|basement|kitchen|°c|floor|interior|exterior|ready-mix/.test(s)) return 'usecase';
  return 'category';
}

export function PreviewSummary({ onJump }: { onJump: (s: IntakeStep) => void }) {
  const d = useDraft();
  const run = useTasks((s) => (d.runId ? s.runs[d.runId] : undefined));
  const writing = run?.status === 'running' && run.orb === 'composing';
  const [typed, setTyped] = useState(false);
  const musts = d.targets.filter((t) => t.priority === 'must').length;
  return (
    <div className="space-y-4">
      <div className="card agent-grid p-5 md:p-7" data-ai-path="summary">
        <div className="flex flex-col gap-5 md:flex-row md:items-start">
          <div className="flex shrink-0 flex-col items-center gap-1">
            <AgentBadge id="scribe" preset="hero" placement="preview" size={96} status={!d.summary || writing || !typed ? 'working' : 'done'} orb={!d.summary ? 'weaving' : 'composing'} />
            <span className="text-xs font-semibold text-ink">Quill</span>
            <span className="text-2xs text-ink3">writes the brief</span>
          </div>
          <div className="min-w-0 flex-1 rounded-lg bg-surface/90 p-1 font-display text-[21px] leading-[34px] text-ink2">
            {d.summary ? (
              typed ? (
                <Markdown text={d.summary} onBold={(t) => onJump(phraseToStep(t))} />
              ) : (
                <TypeText text={d.summary} id={`preview:${d.summary}`} onDone={() => setTyped(true)} />
              )
            ) : (
              <div className="space-y-2 pt-2">
                <div className="skeleton h-4 w-11/12" />
                <div className="skeleton h-4 w-10/12" />
                <div className="skeleton h-4 w-8/12" />
                <span className="text-xs text-ink3">Quill is weaving your inputs into a summary…</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {[
          { label: 'Targets', v: d.targets.length },
          { label: 'Must-haves', v: musts },
          { label: 'Benchmarks', v: d.benchmarks.length },
        ].map((x) => (
          <div key={x.label} className="card p-4 md:p-5">
            <div className="text-xs text-ink2">{x.label}</div>
            <div className="mono mt-1 text-xl font-medium">{x.v}</div>
          </div>
        ))}
      </div>
      <p className="text-xs text-ink3">Edit any highlighted phrase — click it to jump to its step.</p>
    </div>
  );
}
