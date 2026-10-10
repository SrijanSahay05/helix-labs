import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Check, ChevronDown, Sparkles } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { ResearchData, RRoute } from '@/data/demo/research';
import { AgentBot } from '@/components/agents/AgentBot';
import { HelixOrb } from '@/components/ai/HelixOrb';
import { StatusPill } from '@/components/ui/Pill';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { useChoices, useInteract } from './store';
import { Bar, CiteChip, ORANGE, ScoreRing, useScientist } from './shared';

export type CardSize = 'hero' | 'medium' | 'row' | 'gen';

const SHORT: Record<string, string> = { 'adh-initial': 'Adhesion, initial', 'adh-water': 'Adhesion, water', 'adh-heat': 'Adhesion, heat', 'adh-ft': 'Adhesion, freeze-thaw', 'open-time': 'Open time', slip: 'Slip', 'transverse-def': 'Deformation' };
const short = (id: string, name: string) => SHORT[id] ?? name.replace('Tensile adhesion — ', 'Adhesion, ');
const fmtV = (v: number) => (Math.abs(v) >= 10 ? v.toFixed(0) : v.toFixed(2).replace(/0$/, ''));

export function scoreLabels(sci: boolean) {
  return sci ? { targetMatch: 'Target match', cost: 'Cost', availability: 'Availability', overall: 'Overall' } : { targetMatch: 'Fits your needs', cost: 'Price', availability: 'Easy to source', overall: 'Overall' };
}

function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="border-t border-line pt-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="label">{title}</span>
        {right}
      </div>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------ pieces */

function StackedBar({ r }: { r: RRoute }) {
  const mids = r.composition.map((c) => (c.range[0] + c.range[1]) / 2);
  const sum = mids.reduce((a, b) => a + b, 0) || 1;
  return (
    <div className="flex h-3 overflow-hidden rounded-full bg-surface2" role="img" aria-label={`Composition: ${r.composition.map((c) => `${c.name} ${c.range[0]}–${c.range[1]} %`).join(', ')}`}>
      {r.composition.map((c, i) => (
        <motion.div
          key={c.materialId}
          title={`${c.name} · ${c.range[0]}–${c.range[1]} %`}
          initial={{ width: 0 }}
          animate={{ width: `${(mids[i] / sum) * 100}%` }}
          transition={{ duration: 0.5, delay: i * 0.04 }}
          className="h-full border-r border-surface last:border-0"
          style={{ background: 'var(--accent)', opacity: Math.max(0.25, 1 - i * 0.11) }}
        />
      ))}
    </div>
  );
}

function RangeBar({ range, lit }: { range: [number, number]; lit: [number, number] }) {
  const span = lit[1] - lit[0] || 1;
  const a = Math.max(0, (range[0] - lit[0]) / span);
  const b = Math.min(1, (range[1] - lit[0]) / span);
  return (
    <div className="relative h-1.5 w-full rounded-full bg-surface2" title={`Literature ${lit[0]}–${lit[1]} %`}>
      <div className="absolute inset-y-0 rounded-full bg-accent" style={{ left: `${a * 100}%`, width: `${Math.max(2, (b - a) * 100)}%`, minWidth: 4 }} />
    </div>
  );
}

const rng = (r: [number, number]) => (r[0] === r[1] ? `${r[0]}` : `${r[0]}–${r[1]}`);

function Composition({ r, compact }: { r: RRoute; compact?: boolean }) {
  const sci = useScientist();
  return (
    <>
      <StackedBar r={r} />
      <table className="mt-2 w-full text-[11px] leading-4">
        <thead>
          <tr className="text-left text-2xs text-ink3">
            <th className="py-1 font-medium">{sci ? 'Ingredient' : 'Ingredient'}</th>
            {!compact && <th className="py-1 font-medium">{sci ? 'Function' : 'What it does'}</th>}
            <th className="py-1 text-right font-medium">% w/w</th>
            <th className="w-[30%] py-1 pl-3 font-medium">{compact ? 'vs lit.' : 'vs literature'}</th>
          </tr>
        </thead>
        <tbody>
          {r.composition.map((c) => (
            <tr key={c.materialId} className="border-t border-line/70">
              <td className={cn('py-1 pr-2 text-ink', compact ? 'break-words' : 'max-w-0 truncate')} title={c.name}>
                {c.name}
              </td>
              {!compact && <td className="max-w-0 truncate py-1 pr-2 text-ink2">{c.fn}</td>}
              <td className="mono whitespace-nowrap py-1 text-right font-semibold text-ink">{rng(c.range)}</td>
              <td className="py-1 pl-3">
                <RangeBar range={c.range} lit={c.lit} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function Predicted({ r, t = 1, compact }: { r: RRoute; t?: number; compact?: boolean }) {
  const sci = useScientist();
  const n = r.predicted.length;
  return (
    <table className="w-full text-[11px] leading-4">
      <thead>
        <tr className="text-left text-2xs text-ink3">
          <th className="py-1 font-medium">{sci ? 'Property' : 'What we test'}</th>
          {!compact && <th className="py-1 text-right font-medium">Target</th>}
          <th className="py-1 text-right font-medium">{sci ? 'Predicted' : 'Expected'}</th>
          <th className="py-1 pl-2 text-right font-medium">Status</th>
        </tr>
      </thead>
      <tbody>
        {r.predicted.map((p, i) => {
          const shown = t >= (i + 0.2) / n;
          const flipped = t >= (i + 0.8) / n;
          const gap = p.status !== 'pass' ? p.value - p.target : 0;
          return (
            <tr key={p.propertyId} className="border-t border-line/70" style={{ opacity: shown ? 1 : 0.25 }}>
              <td className={cn('py-1 pr-2 text-ink', compact ? 'break-words' : 'max-w-0 truncate')} title={p.name}>
                {sci ? short(p.propertyId, p.name) : p.plain}
                {p.must && !compact && <span className="ml-1 text-2xs text-ink3">must</span>}
              </td>
              {!compact && (
                <td className="mono whitespace-nowrap py-1 text-right text-ink2">
                  {p.op === '>=' ? '≥' : '≤'} {fmtV(p.target)}
                </td>
              )}
              <td className="mono whitespace-nowrap py-1 text-right font-semibold text-ink">
                {shown ? (
                  <>
                    {fmtV(p.value)}
                    {!compact && <span className="font-normal text-ink3"> ± {fmtV(p.unc)}</span>}
                    {gap !== 0 && <span className={cn('ml-1 font-normal', p.status === 'fail' ? 'text-fail' : 'text-borderline')}>{gap > 0 ? '+' : '−'}{fmtV(Math.abs(gap))}</span>}
                  </>
                ) : (
                  '—'
                )}
              </td>
              <td className="py-0.5 pl-2 text-right">{flipped ? <StatusPill status={p.status} /> : <StatusPill status="pending" label="…" />}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function Scores({ r, t = 1 }: { r: RRoute; t?: number }) {
  const L = scoreLabels(useScientist());
  return (
    <div className="space-y-1.5">
      {(['targetMatch', 'cost', 'availability', 'overall'] as const).map((k) => (
        <div key={k} className="flex items-center gap-2 text-2xs">
          <span className={cn('w-[92px] shrink-0 truncate', k === 'overall' ? 'font-semibold text-ink' : 'text-ink2')}>{L[k]}</span>
          <Bar value={r.scores[k] * t} className="flex-1" />
          <span className="mono w-8 text-right font-semibold text-ink">{(r.scores[k] * t).toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

function Radar({ r, others }: { r: RRoute; others: RRoute[] }) {
  const sci = useScientist();
  const L = scoreLabels(sci);
  const axes: { k: string; label: string; v: (x: RRoute) => number }[] = [
    { k: 'tm', label: L.targetMatch, v: (x) => x.scores.targetMatch },
    { k: 'c', label: L.cost, v: (x) => x.scores.cost },
    { k: 'a', label: L.availability, v: (x) => x.scores.availability },
    { k: 'e', label: sci ? 'Evidence' : 'Backed by studies', v: (x) => x.evidence },
    { k: 'o', label: L.overall, v: (x) => x.scores.overall },
  ];
  const R = 52;
  const C = 80;
  const pt = (i: number, v: number) => {
    const a = -Math.PI / 2 + (i / axes.length) * Math.PI * 2;
    return [C + Math.cos(a) * R * v, C + Math.sin(a) * R * v];
  };
  const poly = (f: (i: number) => number) => axes.map((_, i) => pt(i, f(i)).join(',')).join(' ');
  const best = (i: number) => Math.max(0, ...others.map((o) => axes[i].v(o)));
  return (
    <div className="flex items-center gap-3">
      <svg width={160} height={160} viewBox="0 0 160 160" role="img" aria-label={`Radar: ${r.id} against the best of the other routes`} className="shrink-0 overflow-visible">
        {[0.33, 0.66, 1].map((g) => (
          <polygon key={g} points={poly(() => g)} fill="none" stroke="var(--line)" />
        ))}
        {axes.map((a, i) => {
          const [x, y] = pt(i, 1.28);
          return (
            <text key={a.k} x={x} y={y + 3} textAnchor={x < C - 5 ? 'end' : x > C + 5 ? 'start' : 'middle'} fontSize={9.5} fill="var(--text-3)">
              {a.label}
            </text>
          );
        })}
        <polygon points={poly(best)} fill="none" stroke="var(--text-3)" strokeDasharray="3 3" />
        <polygon points={poly((i) => axes[i].v(r))} fill="var(--accent)" fillOpacity={0.18} stroke="var(--accent)" strokeWidth={1.5} />
      </svg>
      <div className="space-y-1 text-2xs text-ink2">
        <div className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-accent" /> {r.id}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 border-t border-dashed border-ink3" /> Best of others
        </div>
      </div>
    </div>
  );
}

function CostBullet({ cost, ceiling }: { cost: number; ceiling: number }) {
  const max = Math.max(ceiling * 1.3, cost * 1.08);
  const over = cost > ceiling;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className={cn('mono text-lg font-semibold leading-6', over ? 'text-fail' : 'text-ink')}>₹{cost.toFixed(1)} / kg</span>
        <span className="mono text-2xs text-ink3">ceiling ₹{ceiling}</span>
      </div>
      <div className="relative mt-1.5 h-3 rounded-sm bg-surface2">
        <div className="absolute inset-y-0 left-0 rounded-sm bg-surface2" style={{ width: `${(ceiling / max) * 100}%`, background: 'color-mix(in srgb, var(--text-3) 18%, transparent)' }} />
        <motion.div className="absolute inset-y-[3px] left-0 rounded-sm" style={{ background: over ? 'var(--fail)' : 'var(--accent)' }} initial={{ width: 0 }} animate={{ width: `${(cost / max) * 100}%` }} transition={{ duration: 0.6 }} />
        <div className="absolute -inset-y-1 w-0.5 bg-ink" style={{ left: `${(ceiling / max) * 100}%` }} />
      </div>
      {over && (
        <div className="mt-1.5 inline-flex items-center gap-1 text-2xs font-semibold text-fail">
          <AlertTriangle size={11} /> Cost over ceiling
        </div>
      )}
    </div>
  );
}

function Hazards({ r }: { r: RRoute }) {
  return (
    <ul className="space-y-1">
      {r.hazards.map((h) => (
        <li key={h.text} className="flex items-start gap-1.5 text-[11px] leading-4 text-ink2">
          <AlertTriangle size={11} className={cn('mt-0.5 shrink-0', h.kind === 'hazard' ? 'text-borderline' : 'text-ink3')} />
          <span>
            <span className="sr-only">{h.kind}: </span>
            {h.text}
          </span>
        </li>
      ))}
    </ul>
  );
}

function VariantPrompt({ r }: { r: RRoute }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('Make it cheaper by 10 %');
  const [busy, setBusy] = useState(false);
  const add = useChoices((s) => s.addVariant);
  const has = useChoices((s) => !!s.variants[r.id]);
  if (has) return <span className="inline-flex h-8 items-center gap-1 text-2xs font-medium text-accent"><Check size={12} /> Variant {r.id}-b added</span>;
  if (!open)
    return (
      <Button size="sm" variant="ghost" className="h-8" onClick={() => setOpen(true)}>
        <Sparkles size={13} /> Request a variant
      </Button>
    );
  return (
    <form
      className="flex w-full items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!q.trim()) return;
        setBusy(true);
        setTimeout(() => {
          add(r.id, q.trim());
          setBusy(false);
          setOpen(false);
        }, 1100);
      }}
    >
      <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} className="input input-sm h-8 min-w-0 flex-1" aria-label={`Variant request for ${r.id}`} />
      {busy ? (
        <span className="inline-flex h-8 items-center gap-1.5 text-2xs text-ink2">
          <HelixOrb state="weaving" size={20} /> Weave…
        </span>
      ) : (
        <Button size="sm" variant="primary" type="submit" className="h-8">
          Ask Weave
        </Button>
      )}
    </form>
  );
}

function Actions({ r }: { r: RRoute }) {
  const selected = useChoices((s) => s.selected === r.id);
  const comparing = useChoices((s) => s.compare.includes(r.id));
  const full = useChoices((s) => s.compare.length >= 3);
  const { select, toggleCompare } = useChoices();
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
      <Button size="sm" variant={selected ? 'primary' : 'secondary'} className="h-8" onClick={() => select(selected ? undefined : r.id)} aria-pressed={selected}>
        {selected ? (
          <>
            <Check size={13} /> Selected
          </>
        ) : (
          'Select'
        )}
      </Button>
      <label className={cn('inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-2 text-xs font-medium text-ink2 hover:bg-surface2', !comparing && full && 'cursor-not-allowed opacity-50')}>
        <input type="checkbox" checked={comparing} disabled={!comparing && full} onChange={() => toggleCompare(r.id)} />
        Compare
      </label>
      {!r.id.endsWith('-b') && <VariantPrompt r={r} />}
    </div>
  );
}

/* ------------------------------------------------------------ the card */

export function PathwayCard({ r, size, data, predictT = 1, scoreT = 1, others = [], tag, split }: { r: RRoute; size: CardSize; data: ResearchData; predictT?: number; scoreT?: number; others?: RRoute[]; tag?: ReactNode; split?: boolean }) {
  const sci = useScientist();
  const set = useInteract((s) => s.set);
  const selected = useChoices((s) => s.selected === r.id);
  const select = useChoices((s) => s.select);
  const [open, setOpen] = useState(false);
  const isTop = r.rank === 1 && !r.id.endsWith('-b');
  const hero = size === 'hero';
  const compact = size !== 'hero';

  const header = (
    <div className="flex items-start gap-3">
      <span className={cn('grid shrink-0 place-items-center rounded-lg font-semibold', hero ? 'h-9 w-9 text-sm' : 'h-8 w-8 text-xs', isTop ? 'text-on-accent' : 'bg-accent-soft text-accent')} style={isTop ? { background: 'var(--accent)' } : undefined}>
        {r.id.replace('-b', 'b')}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {isTop && size !== 'gen' && (
            <span className="inline-flex h-[22px] items-center gap-1 rounded-[6px] px-2 text-2xs font-semibold" style={{ background: `color-mix(in srgb, ${ORANGE} 16%, transparent)`, color: '#B45309' }}>
              Recommended
            </span>
          )}
          {tag}
          {selected && <span className="inline-flex h-[22px] items-center gap-1 rounded-[6px] bg-accent px-2 text-2xs font-semibold text-on-accent"><Check size={11} /> Selected</span>}
        </div>
        {hero && <div className="mt-1 text-[17px] font-semibold leading-6 text-ink">{r.name}</div>}
      </div>
      <ScoreRing value={r.scores.overall * scoreT} size={hero ? 56 : 44} best={isTop && scoreT >= 1} />
    </div>
  );
  const title = !hero && <div className="-mt-1 text-[13px] font-semibold leading-5 text-ink">{r.name}</div>;

  if (size === 'gen')
    return (
      <div className="flex h-full flex-col gap-3 rounded-lg border border-line bg-surface p-3">
        {header}
        {title}
        <Predicted r={r} t={predictT} compact />
        {scoreT > 0 && <Scores r={r} t={scoreT} />}
      </div>
    );

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.target === e.currentTarget) {
      e.preventDefault();
      e.stopPropagation();
      if (size === 'row') setOpen((o) => !o);
      else select(selected ? undefined : r.id);
    }
  };

  const sComp = (
    <Section title={sci ? 'Composition sketch' : 'Recipe sketch'}>
      <Composition r={r} compact={compact} />
    </Section>
  );
  const sPred = (
    <Section title={sci ? 'Predicted vs targets' : 'Expected vs needed'}>
      <Predicted r={r} compact={compact} />
    </Section>
  );
  const sScores = (
    <Section title="Scores">
      <div className={cn(hero && 'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4')}>
        <Scores r={r} />
        {hero && <Radar r={r} others={others} />}
      </div>
    </Section>
  );
  const sCost = (
    <Section title={sci ? 'Cost per kg' : 'Price per kg'}>
      <CostBullet cost={r.costPerKg} ceiling={data.ceiling} />
    </Section>
  );
  const sEquip = (
    <Section title="Equipment">
      <div className="flex flex-wrap gap-1.5">
        {r.equipment.map((e) => (
          <span key={e} className="inline-flex h-6 items-center rounded-full border border-line px-2.5 text-2xs text-ink2">
            {e}
          </span>
        ))}
      </div>
    </Section>
  );
  const sHaz = (
    <Section title={sci ? 'Hazards and risks' : 'Safety and risks'} right={<span className="inline-flex items-center gap-1 text-2xs text-ink3"><AgentBot id="sentinel" preset="micro" placement={`rp-guard-${r.id}`} status="idle" /> Guard</span>}>
      <Hazards r={r} />
    </Section>
  );
  const sCite = (
    <Section title="Citations">
      <div className="flex flex-wrap gap-1">
        {r.citations.map((c) => (
          <CiteChip key={c} refLabel={c} data={data} route={r.id.replace('-b', '')} />
        ))}
      </div>
    </Section>
  );
  const plainLine = !sci && <p className="rounded-md bg-surface2/70 px-3 py-2 text-sm leading-5 text-ink">{r.plain}</p>;
  const body = split ? (
    <>
      {plainLine}
      <div className="grid grid-cols-2 gap-x-6">
        <div className="space-y-3">
          {sComp}
          {sScores}
          {sCost}
        </div>
        <div className="space-y-3">
          {sPred}
          {sEquip}
          {sHaz}
          {sCite}
        </div>
      </div>
      <Actions r={r} />
    </>
  ) : (
    <>
      {plainLine}
      {sComp}
      {sPred}
      {sScores}
      {sCost}
      {sEquip}
      {sHaz}
      {sCite}
      <Actions r={r} />
    </>
  );

  if (size === 'row')
    return (
      <div
        id={`rp-card-${r.id}`}
        tabIndex={0}
        onKeyDown={onKey}
        onPointerEnter={() => set({ hoverRoute: r.id })}
        onPointerLeave={() => set({ hoverRoute: undefined })}
        className={cn('scroll-mt-[150px] rounded-lg border bg-surface outline-none focus-visible:shadow-glow', selected ? 'border-accent' : 'border-line')}
      >
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex h-14 w-full items-center gap-3 px-4 text-left">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-xs font-semibold text-accent">{r.id.replace('-b', 'b')}</span>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{sci ? r.name : r.plain}</span>
          {tag}
          {r.note && <span className="hidden h-[22px] items-center rounded-[6px] bg-[var(--borderline-soft)] px-2 text-2xs font-semibold text-borderline md:inline-flex">{r.note}</span>}
          <span className="mono w-20 text-right text-xs text-ink2">₹{r.costPerKg.toFixed(1)}/kg</span>
          <span className="mono w-10 text-right text-sm font-semibold text-ink">{r.scores.overall.toFixed(2)}</span>
          <ChevronDown size={16} className={cn('shrink-0 text-ink3 transition-transform', open && 'rotate-180')} />
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="grid gap-x-6 gap-y-3 border-t border-line p-4 lg:grid-cols-2">
                <div className="space-y-3">
                  {!sci && <p className="rounded-md bg-surface2/70 px-3 py-2 text-sm leading-5 text-ink">{r.plain}</p>}
                  <Section title={sci ? 'Composition sketch' : 'Recipe sketch'}>
                    <Composition r={r} />
                  </Section>
                  <Section title="Scores">
                    <Scores r={r} />
                  </Section>
                  <Section title={sci ? 'Cost per kg' : 'Price per kg'}>
                    <CostBullet cost={r.costPerKg} ceiling={data.ceiling} />
                  </Section>
                </div>
                <div className="space-y-3">
                  <Section title={sci ? 'Predicted vs targets' : 'Expected vs needed'}>
                    <Predicted r={r} />
                  </Section>
                  <Section title="Equipment">
                    <div className="flex flex-wrap gap-1.5">
                      {r.equipment.map((e) => (
                        <span key={e} className="inline-flex h-6 items-center rounded-full border border-line px-2.5 text-2xs text-ink2">
                          {e}
                        </span>
                      ))}
                    </div>
                  </Section>
                  <Section title={sci ? 'Hazards and risks' : 'Safety and risks'}>
                    <Hazards r={r} />
                  </Section>
                  <Section title="Citations">
                    <div className="flex flex-wrap gap-1">
                      {r.citations.map((c) => (
                        <CiteChip key={c} refLabel={c} data={data} route={r.id} />
                      ))}
                    </div>
                  </Section>
                  <Actions r={r} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );

  return (
    <div
      id={`rp-card-${r.id}`}
      tabIndex={0}
      onKeyDown={onKey}
      onPointerEnter={() => set({ hoverRoute: r.id })}
      onPointerLeave={() => set({ hoverRoute: undefined })}
      className={cn('flex h-full scroll-mt-[150px] flex-col gap-3 rounded-lg border bg-surface outline-none focus-visible:shadow-glow', hero ? 'min-h-[640px] p-5' : 'p-4', selected ? 'border-accent shadow-[0_0_0_1px_var(--accent)]' : 'border-line')}
      style={isTop ? { boxShadow: selected ? undefined : `inset 0 3px 0 ${ORANGE}` } : undefined}
    >
      {header}
      {title}
      {body}
    </div>
  );
}

/** Row for a rejected route that the user moved back to the feasible list. */
export function ReconsideredRow({ r }: { r: RRoute }) {
  return (
    <div id={`rp-card-${r.id}`} tabIndex={0} className="flex h-14 items-center gap-3 rounded-lg border border-dashed border-borderline/50 bg-[var(--borderline-soft)]/40 px-4 outline-none focus-visible:shadow-glow">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface2 text-xs font-semibold text-ink2">{r.id}</span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{r.name}</span>
      <span className="inline-flex h-[22px] items-center gap-1 rounded-[6px] bg-[var(--borderline-soft)] px-2 text-2xs font-semibold text-borderline">
        <AlertTriangle size={11} /> Reconsidered — {r.reason}
      </span>
      <span className="mono w-20 text-right text-xs text-ink2">₹{r.costPerKg.toFixed(1)}/kg</span>
      <span className="mono w-10 text-right text-xs text-ink2">{r.scores.targetMatch.toFixed(2)}</span>
    </div>
  );
}
