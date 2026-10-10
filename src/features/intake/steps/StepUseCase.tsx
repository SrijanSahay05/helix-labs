import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AIField } from '@/components/ai/AIField';
import { Chip, Select } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { AgentBot } from '@/components/agents/AgentBot';
import { CLIMATES, LOADS, MATERIAL_TYPES, METHODS, SUBSTRATES, SURFACES } from '@/data/useCaseOptions';
import { STANDARD_CLASSES } from '@/data/standards';
import { USE_CASE_LABEL } from '@/data/copy';
import { SCENARIO } from '@/data/scenarios';
import { useCaseDisplay } from '@/agent/scripts/intake';
import { useMode } from '@/lib/useModeText';
import { cn } from '@/lib/cn';
import type { UseCase } from '@/types';
import { acceptMeta, useDraft, userSet } from '../useDraft';

const L = (k: keyof UseCase, mode: 'scientist' | 'non-scientist') => USE_CASE_LABEL[k]?.[mode] ?? k;

function NumberInput({ value, onChange, suffix, className }: { value?: number; onChange: (v: number) => void; suffix?: string; className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <input type="number" className="input mono pr-8 text-right" value={value ?? ''} onChange={(e) => onChange(Number(e.target.value))} />
      {suffix && <span className="pointer-events-none absolute right-2 top-1.5 text-2xs text-ink3">{suffix}</span>}
    </div>
  );
}

function RangeInput({ value, onChange, min, max, unit }: { value: [number, number]; onChange: (v: [number, number]) => void; min: number; max: number; unit: string }) {
  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  return (
    <div className="flex items-center gap-2">
      <NumberInput value={value[0]} onChange={(v) => onChange([v, value[1]])} suffix={unit} className="w-20" />
      <div className="relative h-1.5 flex-1 rounded bg-surface2">
        <div className="absolute inset-y-0 rounded bg-accent" style={{ left: `${pct(value[0])}%`, right: `${100 - pct(value[1])}%` }} />
        <span className="absolute -top-1 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-accent bg-surface" style={{ left: `${pct(value[0])}%` }} />
        <span className="absolute -top-1 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-accent bg-surface" style={{ left: `${pct(value[1])}%` }} />
      </div>
      <NumberInput value={value[1]} onChange={(v) => onChange([value[0], v])} suffix={unit} className="w-20" />
    </div>
  );
}

function ScientistFields() {
  const d = useDraft();
  const uc = d.useCase;
  const mode = useMode();
  const f = (k: keyof UseCase) => ({
    path: `useCase.${k}`,
    label: L(k, mode),
    meta: d.meta[`useCase.${k}`],
    display: uc[k] !== undefined ? useCaseDisplay(k, uc[k]) : undefined,
    pending: uc[k] === undefined && d.runId !== undefined && !d.done.usecase,
    onAccept: () => acceptMeta(`useCase.${k}`),
  });
  const set = (k: keyof UseCase, v: unknown) => userSet(`useCase.${k}`, v, L(k, 'scientist'));
  return (
    <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
      <AIField {...f('substrate')}>
        <Select value={uc.substrate ?? ''} onChange={(v) => set('substrate', v)} options={['', ...SUBSTRATES]} />
      </AIField>
      <AIField {...f('surfaces')}>
        <div className="flex flex-wrap gap-1.5">
          {SURFACES.map((s) => (
            <Chip key={s} active={uc.surfaces?.includes(s)} onClick={() => set('surfaces', uc.surfaces?.includes(s) ? uc.surfaces.filter((x) => x !== s) : [...(uc.surfaces ?? []), s])}>
              {s}
            </Chip>
          ))}
        </div>
      </AIField>
      <AIField {...f('materialType')}>
        <Select value={uc.materialType ?? ''} onChange={(v) => set('materialType', v)} options={['', ...MATERIAL_TYPES]} />
      </AIField>
      <AIField {...f('size')}>
        <div className="flex items-center gap-1.5">
          <NumberInput value={uc.size?.w} onChange={(v) => set('size', { ...(uc.size ?? { w: 0, h: 0, t: 0 }), w: v })} suffix="W" />
          <span className="text-ink3">×</span>
          <NumberInput value={uc.size?.h} onChange={(v) => set('size', { ...(uc.size ?? { w: 0, h: 0, t: 0 }), h: v })} suffix="H" />
          <span className="text-ink3">×</span>
          <NumberInput value={uc.size?.t} onChange={(v) => set('size', { ...(uc.size ?? { w: 0, h: 0, t: 0 }), t: v })} suffix="mm" />
        </div>
      </AIField>
      <AIField {...f('exposure')}>
        <div className="inline-flex rounded-md border border-line bg-surface2 p-0.5">
          {(['interior', 'exterior'] as const).map((x) => (
            <button key={x} onClick={() => set('exposure', x)} className={cn('h-7 rounded px-4 text-xs font-medium capitalize', uc.exposure === x ? 'bg-surface text-ink shadow-card' : 'text-ink2')}>
              {x}
            </button>
          ))}
        </div>
      </AIField>
      <AIField {...f('climate')}>
        <Select value={uc.climate ?? ''} onChange={(v) => set('climate', v)} options={['', ...CLIMATES]} />
      </AIField>
      <AIField {...f('appTemp')}>
        <RangeInput value={uc.appTemp ?? [10, 35]} onChange={(v) => set('appTemp', v)} min={-10} max={50} unit="°C" />
      </AIField>
      <AIField {...f('load')}>
        <Select value={uc.load ?? ''} onChange={(v) => set('load', v)} options={['', ...LOADS]} />
      </AIField>
      <AIField {...f('method')}>
        <Select value={uc.method ?? ''} onChange={(v) => set('method', v)} options={['', ...METHODS]} />
      </AIField>
      <div className="grid grid-cols-2 gap-3">
        <AIField {...f('timeToGroutH')}>
          <NumberInput value={uc.timeToGroutH} onChange={(v) => set('timeToGroutH', v)} suffix="h" />
        </AIField>
        <AIField {...f('timeToTrafficH')}>
          <NumberInput value={uc.timeToTrafficH} onChange={(v) => set('timeToTrafficH', v)} suffix="h" />
        </AIField>
      </div>
      <AIField {...f('standardClass')} className="md:col-span-2">
        <Select value={uc.standardClass ?? ''} onChange={(v) => set('standardClass', v)} options={['', ...STANDARD_CLASSES]} />
      </AIField>
    </div>
  );
}

function GuidedQuestions() {
  const d = useDraft();
  const s = SCENARIO[d.scenarioId];
  const [idx, setIdx] = useState(0);
  const qs = s.guided;
  const q = qs[Math.min(idx, qs.length - 1)];
  const answered = d.guided[q.id];
  // Terra hops for 600 ms when you answer, then the next card slides in
  const [hop, setHop] = useState(false);
  useEffect(() => {
    if (!hop) return;
    const t = setTimeout(() => setHop(false), 600);
    return () => clearTimeout(t);
  }, [hop]);

  const choose = (i: number) => {
    userSet(`guided.${q.id}`, i, q.q);
    for (const [k, v] of Object.entries(q.options[i].sets)) userSet(`useCase.${k}`, v, k);
    setHop(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-ink3">
        {qs.map((x, i) => (
          <button key={x.id} onClick={() => setIdx(i)} className={cn('h-1.5 flex-1 rounded-full', i < idx ? 'bg-accent' : i === idx ? 'bg-accent/60' : 'bg-line')} aria-label={x.q} />
        ))}
        <span className="mono ml-2">
          {Math.min(idx + 1, qs.length)} / {qs.length}
        </span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={q.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }} className="card flex gap-5 p-6" data-ai-path={`guided.${q.id}`}>
          <div className="hidden w-[104px] shrink-0 flex-col items-center gap-1 pt-1 sm:flex">
            <AgentBot id="site" preset="hero" placement="guided-host" size={96} status={hop ? 'working' : 'idle'} override={{ interactive: true }} />
            <span className="text-xs font-semibold text-ink">Terra</span>
            <span className="text-center text-2xs leading-4 text-ink3">asks about your site</span>
          </div>
          <div className="min-w-0 flex-1">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Icon name={q.picture} size={30} />
            </span>
            <h3 className="font-display text-[28px] font-semibold leading-8">{q.q}</h3>
          </div>
          <div className={cn('mt-5 grid gap-3', q.options.length > 3 ? 'grid-cols-4' : q.options.length === 3 ? 'grid-cols-3' : 'grid-cols-2')}>
            {q.options.map((o, i) => {
              const sel = answered === i;
              const helix = sel && d.meta[`guided.${q.id}`]?.by !== 'user';
              return (
                <button
                  key={o.label}
                  data-ai-target={`guided.${q.id}:${i}`}
                  onClick={() => choose(i)}
                  className={cn('relative flex h-32 flex-col items-center justify-center gap-2 rounded-xl border bg-surface p-3 text-center transition-shadow', sel ? 'border-accent shadow-glow' : 'border-line hover:border-ink3')}
                >
                  <Icon name={o.icon} size={28} className={sel ? 'text-accent' : 'text-ink2'} />
                  <span className="text-sm font-medium">{o.label}</span>
                  {helix && (
                    <span className="absolute right-2 top-2 inline-flex items-center gap-0.5 rounded bg-accent-soft py-px pl-0.5 pr-1 text-[10px] font-semibold text-accent">
                      <AgentBot id="site" preset="micro" placement={`guided-opt-${q.id}`} size={14} /> Terra
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-5 flex items-center gap-2">
            {answered !== undefined && (
              <button
                onClick={() => {
                  choose(answered);
                  setIdx((x) => Math.min(x + 1, qs.length));
                }}
                className="flex h-9 items-center gap-1.5 rounded-md bg-accent px-4 text-sm font-medium text-on-accent"
              >
                <Check size={14} /> Yes, right
              </button>
            )}
            {idx > 0 && (
              <button onClick={() => setIdx((x) => x - 1)} className="h-9 rounded-md px-3 text-sm text-ink2 hover:bg-surface2">
                Back
              </button>
            )}
            {answered !== undefined && d.meta[`guided.${q.id}`]?.by !== 'user' && (
              <span className="ml-auto flex items-center gap-1.5 text-xs text-ink3">
                <AgentBot id="site" preset="micro" placement="guided-note" /> Terra answered this from your request — confirm or pick another.
              </span>
            )}
          </div>
          </div>
        </motion.div>
      </AnimatePresence>
      {idx >= qs.length && <p className="text-sm text-pass">All questions answered ✓</p>}
    </div>
  );
}

export function UnderstoodTable() {
  const d = useDraft();
  const [open, setOpen] = useState(false);
  const keys = (Object.keys(d.useCase) as (keyof UseCase)[]).filter((k) => d.useCase[k] !== undefined);
  return (
    <div className="card overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium">
        <AgentBot id="site" preset="micro" placement="understood" /> What Terra understood
        <span className="text-2xs text-ink3">· {keys.length} technical fields — same brief in both modes</span>
        <ChevronDown size={14} className={cn('ml-auto transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.26 }} className="overflow-hidden">
            <table className="w-full">
              <tbody>
                {keys.map((k) => (
                  <tr key={k}>
                    <td className="td w-48 text-ink2">{USE_CASE_LABEL[k]?.scientist ?? k}</td>
                    <td className="td mono">{useCaseDisplay(k, d.useCase[k])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function StepUseCase() {
  const mode = useMode();
  return (
    <div className="space-y-4">
      {mode === 'scientist' ? <ScientistFields /> : <GuidedQuestions />}
      {mode === 'non-scientist' && <UnderstoodTable />}
    </div>
  );
}
