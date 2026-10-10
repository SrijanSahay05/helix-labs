import { motion } from 'framer-motion';
import { Check, FlaskConical, HardHat } from 'lucide-react';
import { AIChip, useFillPhase } from '@/components/ai/AIField';
import { useUI } from '@/store/ui';
import type { Mode } from '@/types';
import { cn } from '@/lib/cn';
import { useDraft, userSet } from '../useDraft';
import { AgentBot } from '@/components/agents/AgentBot';

const CARDS: { id: Mode; title: string; sub: string; icon: typeof FlaskConical; bullets: string[] }[] = [
  {
    id: 'scientist',
    title: 'Scientist',
    sub: 'Technical: standards, classes, units, test methods',
    icon: FlaskConical,
    bullets: ['Structured use-case fields + standard class', 'Pick / upload up to 3 benchmarks', 'Full targets table with operators and methods'],
  },
  {
    id: 'non-scientist',
    title: 'Non-scientist',
    sub: 'Plain: site situations and outcomes',
    icon: HardHat,
    bullets: ['Picture questions about the site', 'One optional “product to match”', 'Budget band and must-haves'],
  },
];

function Illustration({ kind }: { kind: Mode }) {
  return kind === 'scientist' ? (
    <svg viewBox="0 0 120 70" className="h-[70px] w-[120px]" fill="none" stroke="var(--accent)" strokeWidth="1.4">
      <path d="M48 8h24M54 8v20L36 60a4 4 0 0 0 3.5 6h41a4 4 0 0 0 3.5-6L66 28V8" />
      <path d="M42 50h36" strokeDasharray="2 3" />
      <circle cx="56" cy="56" r="2" />
      <circle cx="64" cy="52" r="1.5" />
      <path d="M90 20h18M90 28h12M90 36h16" stroke="var(--text-3)" />
    </svg>
  ) : (
    <svg viewBox="0 0 120 70" className="h-[70px] w-[120px]" fill="none" stroke="var(--accent)" strokeWidth="1.4">
      <path d="M10 66h100M20 66V30h30v36M50 66V18h32v48" />
      <path d="M26 38h6M38 38h6M26 48h6M38 48h6M56 26h6M70 26h6M56 36h6M70 36h6M56 46h6M70 46h6" stroke="var(--text-3)" />
      <path d="M92 66V40l10-8v34" />
      <path d="M86 12l8-6 8 6" stroke="var(--text-3)" />
    </svg>
  );
}

export function StepWho() {
  const d = useDraft();
  const setMode = useUI((s) => s.setMode);
  const meta = d.meta.mode;
  const [phase] = useFillPhase('mode');
  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2">
        {CARDS.map((c, i) => {
          const selected = d.mode === c.id;
          return (
            <motion.button
              key={c.id}
              data-ai-target={`mode:${c.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => {
                userSet('mode', c.id, 'Who is using');
                setMode(c.id, true);
              }}
              className={cn(
                'relative flex h-[280px] flex-col rounded-xl border bg-surface p-5 text-left transition-shadow',
                selected ? 'border-accent shadow-glow' : 'border-line hover:border-ink3',
                selected && phase === 'filling' && 'ai-shimmer',
              )}
            >
              <div className="flex items-start justify-between">
                <Illustration kind={c.id} />
                {selected && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-on-accent">
                    <Check size={14} />
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <c.icon size={18} className="text-accent" />
                <span className="text-lg font-semibold">{c.title}</span>
              </div>
              <p className="mt-1 text-sm text-ink2">{c.sub}</p>
              <ul className="mt-3 space-y-1 text-xs text-ink2">
                {c.bullets.map((b) => (
                  <li key={b} className="flex gap-1.5">
                    <span className="text-accent">·</span>
                    {b}
                  </li>
                ))}
              </ul>
              {selected && meta?.by === 'helix' && (
                <div className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-accent-soft py-1 pl-1 pr-2 text-2xs text-accent" onClick={(e) => e.stopPropagation()}>
                  <AgentBot id="conductor" preset="micro" placement="who-suggest" />
                  Helix suggests — {meta.reason}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-ink3">
        <span>You can switch any time from the top bar.</span>
        {meta && <AIChip meta={meta} label="Who is using" path="mode" />}
      </div>
      <div data-ai-path="mode" className="h-0" />
    </div>
  );
}
