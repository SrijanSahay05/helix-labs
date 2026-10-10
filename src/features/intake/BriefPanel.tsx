import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { HelixOrb } from '@/components/ai/HelixOrb';
import { AgentBot } from '@/components/agents/AgentBot';
import type { AgentId } from '@/agents/registry';
import { TypeText } from '@/components/ai/TypeText';
import { Skeleton } from '@/components/ui/primitives';
import { findCategory, findSubcategory } from '@/data/categories';
import { PROP } from '@/data/properties';
import { useCaseDisplay } from '@/agent/scripts/intake';
import { useUI } from '@/store/ui';
import { useTasks } from '@/store/tasks';
import type { UseCase } from '@/types';
import { useDraft } from './useDraft';
import { cn } from '@/lib/cn';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

function Ring({ value }: { value: number }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  return (
    <svg width="40" height="40" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r={r} fill="none" stroke="var(--line)" strokeWidth="3" />
      <motion.circle cx="20" cy="20" r={r} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeDasharray={c} initial={false} animate={{ strokeDashoffset: c * (1 - value) }} transform="rotate(-90 20 20)" transition={{ duration: 0.5 }} />
      <text x="20" y="24" textAnchor="middle" className="mono" fontSize="10" fill="var(--text)">
        {Math.round(value * 100)}
      </text>
    </svg>
  );
}

function Section({ title, agent, waiting, filled, writing, children }: { title: string; agent: AgentId; waiting: string; filled: boolean; writing: boolean; children: ReactNode }) {
  return (
    <div className="border-b border-line py-3 last:border-0">
      <div className="mb-1 flex items-center gap-1.5">
        {(filled || writing) && <AgentBot id={agent} preset="micro" placement={`brief-${title}`} status={writing ? 'working' : 'idle'} />}
        <span className="label">{title}</span>
        {writing && <HelixOrb state="composing" size={20} />}
      </div>
      {filled ? (
        <div className="text-sm text-ink">{children}</div>
      ) : (
        <div className="space-y-1.5">
          <Skeleton className="w-3/4" />
          <span className="text-2xs text-ink3">{waiting}</span>
        </div>
      )}
    </div>
  );
}

const Line = ({ text, id }: { text: string; id: string }) => <TypeText inline text={text} id={`brief:${id}:${text}`} className="block" />;

export function BriefPanel({ className }: { className?: string }) {
  const d = useDraft();
  const [open, setOpen] = useState(false);
  const mode = useUI((s) => s.mode);
  const running = useTasks((s) => (d.runId ? s.runs[d.runId]?.status === 'running' : false));
  const cat = findCategory(d.categoryId);
  const sub = findSubcategory(d.subcategoryId)?.sub;
  const uc = d.useCase;
  const ucKeys = (Object.keys(uc) as (keyof UseCase)[]).filter((k) => uc[k] !== undefined && k !== 'standardClass');
  const sections = [
    { k: 'who', filled: !!d.mode },
    { k: 'product', filled: !!cat },
    { k: 'standard', filled: !!d.standard },
    { k: 'usecase', filled: ucKeys.length > 0 },
    { k: 'benchmark', filled: d.benchmarks.length > 0 },
    { k: 'targets', filled: d.targets.length > 0 },
    { k: 'constraints', filled: d.constraints.costCeiling !== undefined || !!d.constraints.budgetBand },
    { k: 'summary', filled: !!d.summary },
  ];
  const completeness = sections.filter((s) => s.filled).length / sections.length;
  const firstEmpty = running ? sections.find((s) => !s.filled)?.k : undefined;
  const w = (k: string) => firstEmpty === k;

  return (
    <aside className={cn('card agent-grid flex flex-col self-start overflow-hidden xl:sticky xl:top-[76px] xl:max-h-[calc(100vh-96px)]', className)}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-3 border-b border-line bg-surface px-5 py-4 text-left xl:pointer-events-none">
        <Ring value={completeness} />
        <div className="min-w-0 flex-1">
          <div className="font-display text-lg font-semibold leading-6">Formulation brief</div>
          <div className="text-2xs text-ink3">{completeness === 1 ? 'Complete — ready to review' : 'Fills in as Helix works'}</div>
        </div>
        {running && <HelixOrb state="weaving" size={32} speed={1.3} />}
        <ChevronDown size={16} className={cn('text-ink3 transition-transform xl:hidden', open && 'rotate-180')} />
      </button>
      <div className={cn('scroll-thin flex-1 overflow-auto bg-surface/90 px-5', !open && 'hidden xl:block')}>
        <Section title="Who" agent="conductor" waiting="Waiting for step 0" filled={!!d.mode} writing={w('who')}>
          <Line id="who" text={d.mode === 'scientist' ? 'Scientist — technical terms' : 'Non-scientist — plain site terms'} />
        </Section>
        <Section title="Product" agent="classifier" waiting="Waiting for steps 1–2" filled={!!cat} writing={w('product')}>
          <Line id="cat" text={`${cat?.groupName ?? ''} › ${cat?.name ?? ''}${sub ? ` › ${sub.name}` : ''}`} />
          {d.chemistry.length > 0 && <Line id="chem" text={`${d.chemistry.join(', ')} · ${d.forms.join(', ')}`} />}
        </Section>
        <Section title="Standard" agent="classifier" waiting="Waiting for step 2" filled={!!d.standard} writing={w('standard')}>
          <Line id="std" text={d.standard ?? ''} />
        </Section>
        <Section title="Use case" agent="site" waiting="Waiting for step 3" filled={ucKeys.length > 0} writing={w('usecase')}>
          <div className="mono space-y-0.5 text-xs">
            {ucKeys.map((k) => (
              <div key={k} className="flex gap-2">
                <span className="w-24 shrink-0 text-ink3">{k}</span>
                <Line id={`uc-${k}`} text={useCaseDisplay(k, uc[k])} />
              </div>
            ))}
          </div>
        </Section>
        <Section title="Benchmark" agent="benchmark" waiting="Waiting for benchmark step" filled={d.benchmarks.length > 0} writing={w('benchmark')}>
          {d.benchmarks.map((b) => (
            <Line key={b.id} id={b.id} text={`${b.name} · ${b.standardClass} · ${b.values.length} values`} />
          ))}
        </Section>
        <Section title="Targets" agent="targets" waiting="Waiting for targets step" filled={d.targets.length > 0} writing={w('targets')}>
          <Line id="tcount" text={`${d.targets.length} targets · ${d.targets.filter((t) => t.priority === 'must').length} must-haves`} />
          {d.top3.length > 0 && <Line id="top3" text={`Top 3: ${d.top3.map((id, i) => `${i + 1} ${id === 'cost' ? 'Cost per kg' : mode === 'scientist' ? PROP[id]?.name : PROP[id]?.plainName}`).join(' · ')}`} />}
        </Section>
        <Section title="Constraints" agent="cost" waiting="Waiting for constraints step" filled={d.constraints.costCeiling !== undefined || !!d.constraints.budgetBand} writing={w('constraints')}>
          <Line id="cost" text={mode === 'scientist' ? `≤ ₹ ${d.constraints.costCeiling ?? '—'} / kg · ${(d.constraints.compliance ?? []).join(', ')}` : `Budget: ${d.constraints.budgetBand ?? 'mid'} · ${(d.constraints.mustHaves ?? []).join(', ')}`} />
        </Section>
        <Section title="Summary" agent="scribe" waiting="Waiting for preview" filled={!!d.summary} writing={w('summary')}>
          <TypeText text={d.summary ?? ''} id={`brief-summary:${d.summary}`} className="text-xs leading-relaxed text-ink2" />
        </Section>
      </div>
    </aside>
  );
}
