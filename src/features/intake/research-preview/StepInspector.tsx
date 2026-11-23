import { motion } from 'framer-motion';
import { ArrowLeft, Check, EyeOff, ExternalLink, MessageCircle, Pin, PinOff, Table2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { R_TYPES, type ResearchData, type RSource } from '@/data/demo/research';
import { HelixOrb } from '@/components/ai/HelixOrb';
import { TypeText } from '@/components/ai/TypeText';
import { Button } from '@/components/ui/Button';
import { openAskAgent } from '@/store/ask';
import { cn } from '@/lib/cn';
import { LIT_COUNT, PHASE, STEPS, STEP_INDEX, litCounts, seg } from './script';
import { useChoices, useInteract, usePlayback, useProg, useReduced } from './store';
import { CiteChip, ProgText, ShapeIcon, TypeTag, useScientist } from './shared';

function Title({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-3">
      <div className="text-sm font-semibold text-ink">{children}</div>
      {sub && <div className="mt-0.5 text-xs text-ink2">{sub}</div>}
    </div>
  );
}

/* ------------------------------------------------------------ steps */

function Analyse({ data }: { data: ResearchData }) {
  const t = useProg(STEP_INDEX.analyse);
  const sci = useScientist();
  return (
    <>
      <Title sub={sci ? 'Three concepts Lumen reads from your brief.' : 'Three things your request is about.'}>What the brief asks for</Title>
      <div className="space-y-2">
        {data.concepts.map((c, i) => {
          const local = seg(t, [0.12 + i * 0.16, 0.12 + i * 0.16 + 0.3]);
          return (
            <div key={i} className={cn('rounded-lg border p-3 transition-colors', local > 0 ? 'border-accent/30 bg-accent-soft/40' : 'border-dashed border-line')}>
              <div className="text-2xs font-semibold text-accent">Concept {i + 1}</div>
              <ProgText t={local} text={sci ? c.title : c.plain} className="mt-0.5 block min-h-5 text-sm font-medium text-ink" />
            </div>
          );
        })}
      </div>
    </>
  );
}

function Identify({ data }: { data: ResearchData }) {
  const t = useProg(STEP_INDEX.identify);
  const sci = useScientist();
  return (
    <>
      <Title sub={sci ? 'Each concept expands into the terms authors actually use.' : 'The words Helix will look for.'}>Keywords and synonyms</Title>
      <div className="table-wrap">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="th h-8 px-3">{sci ? 'Concept' : 'Topic'}</th>
              <th className="th h-8 px-3">{sci ? 'Synonyms / terms' : 'Words to search'}</th>
            </tr>
          </thead>
          <tbody>
            {data.keywords.map((k, j) => {
              const kt = seg(t, [0.1 + j * 0.15, 0.3 + j * 0.15]);
              return (
                <tr key={j} className="align-top">
                  <td className="td px-3 py-2 text-xs font-medium text-ink">
                    <span className="mono mr-1.5 text-2xs text-ink3">C{k.concept + 1}</span>
                    {k.term}
                  </td>
                  <td className="td px-3 py-2">
                    <ProgText t={kt} text={k.synonyms.join(', ')} className="mono text-[11px] leading-4 text-ink2" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Query({ text }: { text: string }) {
  const toks = text.match(/("[^"]*"?|\bAND\b|\bOR\b|\bNOT\b|[()]|\n|\s+|[^\s()"]+)/g) ?? [];
  return (
    <>
      {toks.map((tk, i) =>
        tk === '\n' ? (
          <br key={i} />
        ) : /^"/.test(tk) ? (
          <span key={i} className="text-accent">{tk}</span>
        ) : /^(AND|OR|NOT)$/.test(tk) ? (
          <span key={i} className="font-semibold text-ink">{tk}</span>
        ) : /^[()]$/.test(tk) ? (
          <span key={i} className="text-ink3">{tk}</span>
        ) : (
          <span key={i} className={tk.endsWith('*') ? 'italic text-ink2' : 'text-ink2'}>
            {tk}
          </span>
        ),
      )}
    </>
  );
}

function Strategy({ data }: { data: ResearchData }) {
  const t = useProg(STEP_INDEX.strategy);
  const sci = useScientist();
  const n = Math.round(data.query.length * seg(t, [0.05, 0.7]));
  const shown = data.query.slice(0, n);
  return (
    <>
      <Title sub={sci ? 'Boolean query, run across every source type.' : 'How Helix will search.'}>Search strategy</Title>
      <div className="mono min-h-[96px] rounded-lg border border-line bg-surface2/60 p-3 text-[12px] leading-5">
        <Query text={shown} />
        {n < data.query.length && n > 0 && <span className="caret">▍</span>}
      </div>
      <div className="mt-4">
        <div className="label mb-2">Source plan</div>
        <div className="flex flex-wrap gap-1.5">
          {data.plan.map((p, i) => (
            <motion.span key={p} initial={false} animate={{ opacity: seg(t, [0.7 + i * 0.05, 0.78 + i * 0.05]) }} className="inline-flex h-7 items-center rounded-full border border-accent/30 bg-accent-soft px-3 text-2xs font-medium text-accent">
              {p}
            </motion.span>
          ))}
        </div>
        <div className="label mb-2 mt-3">Filters</div>
        <div className="flex flex-wrap gap-1.5">
          {data.filters.map((p, i) => (
            <motion.span key={p} initial={false} animate={{ opacity: seg(t, [0.85 + i * 0.04, 0.9 + i * 0.04]) }} className="inline-flex h-7 items-center rounded-full border border-line px-3 text-2xs font-medium text-ink2">
              {p}
            </motion.span>
          ))}
        </div>
      </div>
    </>
  );
}

const TYPE_PLURAL: Record<string, string> = { Paper: 'Papers', Patent: 'Patents', TDS: 'TDS', 'Supplier sheet': 'Supplier sheets' };
const TYPE_WINDOW: Record<string, [number, number]> = { Paper: [0, 0.66], Patent: [0.3, 0.88], TDS: [0.5, 0.95], 'Supplier sheet': [0.66, 1] };

export function Funnel({ data, fill, asTable }: { data: ResearchData; fill: number[]; asTable: boolean }) {
  const sci = useScientist();
  const rows = [
    { label: sci ? 'Scanned' : 'Looked at', v: data.counts.scanned },
    { label: sci ? 'Screened' : 'Worth a look', v: data.counts.screened },
    { label: sci ? 'Relevant' : 'Useful', v: data.counts.relevant },
    { label: sci ? 'Facts extracted' : 'Facts noted', v: data.counts.facts },
  ];
  if (asTable)
    return (
      <table className="w-full text-xs">
        <caption className="sr-only">Relevance funnel</caption>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <td className="td px-3 py-1.5">{r.label}</td>
              <td className="td mono px-3 py-1.5 text-right font-semibold">{r.v}</td>
              <td className="td mono px-3 py-1.5 text-right text-ink3">{Math.round((r.v / data.counts.scanned) * 100)} %</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  return (
    <div className="space-y-1.5" aria-hidden>
      {rows.map((r, i) => {
        const w = Math.max(0.16, r.v / data.counts.scanned);
        return (
          <div key={r.label} className="flex items-center gap-3">
            <div className="flex flex-1 justify-center">
              <div className="relative h-8 overflow-hidden rounded-md border border-dashed border-line" style={{ width: `${w * 100}%` }}>
                <div className="absolute inset-y-0 left-0 bg-accent" style={{ width: `${fill[i] * 100}%`, opacity: 0.16 + 0.12 * i }} />
                <div className="relative flex h-full items-center justify-center gap-1.5 whitespace-nowrap px-2 text-2xs">
                  <span className="mono font-semibold text-ink">{fill[i] > 0 ? Math.round(r.v * fill[i]) : '—'}</span>
                </div>
              </div>
            </div>
            <span className="w-[96px] shrink-0 text-2xs text-ink2">{r.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function Search({ data }: { data: ResearchData }) {
  const t = useProg(STEP_INDEX.search);
  const sci = useScientist();
  const [table, setTable] = useState(false);
  const rain = seg(t, PHASE.search.rain);
  const total = R_TYPES.reduce((a, ty) => a + Math.round(data.counts.byType[ty] * seg(rain, TYPE_WINDOW[ty])), 0);
  const lc = litCounts(data, STEP_INDEX.search, t, 0);
  const fill = [lc.scanned / data.counts.scanned, lc.screened / data.counts.screened, lc.relevant / data.counts.relevant, 0];
  return (
    <>
      <Title sub={sci ? 'Every source type in parallel, then screened for relevance.' : 'Helix looks through papers, patents and data sheets.'}>{sci ? 'Searching sources' : 'Looking'}</Title>
      <div className="space-y-2">
        {R_TYPES.map((ty) => {
          const p = seg(rain, TYPE_WINDOW[ty]);
          return (
            <div key={ty} className="flex items-center gap-3 text-xs">
              <span className="flex w-[118px] shrink-0 items-center gap-1.5 text-ink2">
                <ShapeIcon type={ty} size={10} color="var(--accent)" /> {TYPE_PLURAL[ty]}
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface2">
                <div className="h-full rounded-full bg-accent" style={{ width: `${p * 100}%` }} />
              </div>
              <span className="mono w-9 text-right font-semibold text-ink">{Math.round(data.counts.byType[ty] * p)}</span>
            </div>
          );
        })}
        <div className="flex items-center justify-end gap-2 border-t border-line pt-2 text-xs">
          <span className="text-ink2">Total</span>
          <span className="mono w-9 text-right font-semibold text-accent">{total}</span>
        </div>
      </div>
      <div className="mb-2 mt-4 flex items-center justify-between">
        <span className="label">{sci ? 'Relevance funnel' : 'From many to the useful few'}</span>
        <button type="button" onClick={() => setTable((x) => !x)} className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-2xs font-medium text-accent hover:bg-accent-soft">
          <Table2 size={12} /> {table ? 'View as chart' : 'View as table'}
        </button>
      </div>
      <Funnel data={data} fill={fill} asTable={table} />
    </>
  );
}

function Cluster({ data }: { data: ResearchData }) {
  const t = useProg(STEP_INDEX.cluster);
  const sci = useScientist();
  const set = useInteract((s) => s.set);
  const hot = useInteract((s) => s.hoverCluster);
  return (
    <>
      <Title sub={sci ? 'Relevant sources grouped by mechanism, with the signal from each.' : 'Useful sources grouped by topic.'}>{sci ? 'Clusters' : 'Topics'}</Title>
      <div className="space-y-1.5">
        {data.clusters.map((c, i) => {
          const local = seg(t, [0.25 + i * 0.09, 0.45 + i * 0.09]);
          const srcs = data.sources.filter((s) => s.cluster === c.id);
          return (
            <div
              key={c.id}
              onPointerEnter={() => set({ hoverCluster: c.id })}
              onPointerLeave={() => set({ hoverCluster: undefined })}
              className={cn('rounded-lg border px-3 py-2 transition-colors', hot === c.id ? 'border-accent bg-accent-soft/50' : 'border-line')}
              style={{ opacity: 0.35 + 0.65 * Math.min(1, local * 2) }}
            >
              <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-ink">{sci ? c.name : c.plain}</span>
                <div className="flex h-1.5 w-16 overflow-hidden rounded-full bg-surface2" title="Source types">
                  {R_TYPES.map((ty, k) => {
                    const n = srcs.filter((s) => s.type === ty).length;
                    return <div key={ty} style={{ width: `${(n / Math.max(1, srcs.length)) * 100}%`, background: 'var(--accent)', opacity: 1 - k * 0.22 }} />;
                  })}
                </div>
                <span className="mono w-6 text-right text-xs font-semibold text-ink">{c.count}</span>
              </div>
              <ProgText t={local} text={sci ? c.signal : c.plainSignal} className="mt-0.5 block min-h-4 text-[11px] leading-4 text-ink2" />
            </div>
          );
        })}
      </div>
    </>
  );
}

export function FactsTable({ data, count, compact }: { data: ResearchData; count: number; compact?: boolean }) {
  const sci = useScientist();
  const [tech, setTech] = useState(false);
  const technical = sci || tech;
  const box = useRef<HTMLDivElement>(null);
  const playing = usePlayback((s) => s.step === STEP_INDEX.extract && s.playing);
  useEffect(() => {
    if (playing && box.current) box.current.scrollTop = box.current.scrollHeight;
  }, [count, playing]);
  const rows = data.facts.slice(0, count);
  return (
    <div>
      {!sci && (
        <div className="mb-2 flex justify-end">
          <button type="button" onClick={() => setTech((x) => !x)} className="inline-flex h-7 items-center rounded-md px-2 text-2xs font-medium text-accent hover:bg-accent-soft">
            {tech ? 'Hide technical' : 'Show technical'}
          </button>
        </div>
      )}
      <div ref={box} className={cn('table-wrap', compact ? 'max-h-[260px]' : 'max-h-[400px]')}>
        <table className="w-full table-fixed text-[11px] leading-4">
          <thead className="sticky top-0 z-[1]">
            <tr>
              <th className="th h-8 px-2.5">Fact</th>
              {technical && <th className="th h-8 w-[34%] px-2.5">Value · condition</th>}
              <th className="th h-8 w-[76px] px-2.5">Source</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((f) => {
              const s = data.sources.find((x) => x.id === f.sourceId)!;
              return (
                <motion.tr key={f.id} data-fact-row={f.id} initial={{ opacity: 0, backgroundColor: 'var(--accent-soft)' }} animate={{ opacity: 1, backgroundColor: 'rgba(0,0,0,0)' }} transition={{ duration: 0.6 }} className="align-top">
                  <td className="td px-2.5 py-1.5 text-[11px] leading-4 text-ink">{sci ? f.fact : f.plain}</td>
                  {technical && (
                    <td className="td px-2.5 py-1.5 text-[11px] leading-4">
                      <span className="mono block font-semibold text-ink">{f.value}</span>
                      {f.condition !== '—' && <span className="block text-ink3">{f.condition}</span>}
                    </td>
                  )}
                  <td className="td px-2.5 py-1.5 text-[11px] leading-4">
                    <CiteChip refLabel={s.ref} data={data} />
                    <span className="block text-2xs text-ink3">
                      {s.type === 'Supplier sheet' ? 'Supplier' : s.type} {s.type === 'Paper' || s.type === 'Patent' ? s.year : ''}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Extract({ data }: { data: ResearchData }) {
  const t = useProg(STEP_INDEX.extract, 200);
  const sci = useScientist();
  const count = Math.min(data.facts.length, Math.ceil(seg(t, PHASE.extract.facts) * data.facts.length));
  return (
    <>
      <Title sub={sci ? 'Dosages and measured values, each linked to its source.' : 'Useful facts, each with where it came from.'}>
        {sci ? 'Facts extracted' : 'Facts noted'} <span className="mono ml-1 text-accent">{count}</span>
      </Title>
      <FactsTable data={data} count={count} />
    </>
  );
}

function Summary({ data }: { data: ResearchData }) {
  const sci = useScientist();
  return (
    <>
      <div className="rounded-lg border border-accent/30 bg-accent-soft/40 p-4">
        <div className="flex items-center gap-2 text-2xs font-semibold text-accent">
          <Check size={13} strokeWidth={3} /> {sci ? 'Literature review complete' : 'Reading done'}
        </div>
        <TypeText text={sci ? data.summary : data.plainSummary} id={`rp-summary:${data.scenarioId}:${sci}`} className="mt-1.5 text-sm leading-6 text-ink" />
        <Button size="sm" variant="secondary" className="mt-3 h-8" onClick={() => openAskAgent('scholar', 'What is the strongest evidence for this brief?')}>
          <MessageCircle size={13} /> Ask Lumen
        </Button>
      </div>
      <div className="label mb-2 mt-4">{sci ? 'Facts table' : 'Facts noted'}</div>
      <FactsTable data={data} count={data.facts.length} compact />
    </>
  );
}

/* ------------------------------------------------------------ source detail */

function Highlighted({ text, values }: { text: string; values: string[] }) {
  if (!values.length) return <>{text}</>;
  const esc = values.map((v) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const parts = text.split(new RegExp(`(${esc})`, 'g'));
  return (
    <>
      {parts.map((p, i) =>
        values.includes(p) ? (
          <mark key={i} className="rounded bg-accent-soft px-0.5 font-semibold text-accent">
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

export function SourceActions({ src, size = 'sm' }: { src: RSource; size?: 'sm' | 'xs' }) {
  const pinned = useChoices((s) => s.pinned.includes(src.id));
  const excluded = useChoices((s) => s.excluded.includes(src.id));
  const { togglePin, toggleExclude } = useChoices();
  const set = useInteract((s) => s.set);
  const cls = size === 'xs' ? 'h-7 px-2 text-2xs' : 'h-8 px-2.5 text-xs';
  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={() => set({ openSource: src.id })} className={cn('inline-flex items-center gap-1 rounded-md font-medium text-ink2 hover:bg-surface2 hover:text-ink', cls)}>
        <ExternalLink size={12} /> Open
      </button>
      <button type="button" aria-pressed={pinned} onClick={() => togglePin(src.id)} className={cn('inline-flex items-center gap-1 rounded-md font-medium hover:bg-surface2', cls, pinned ? 'text-[#B45309]' : 'text-ink2 hover:text-ink')}>
        {pinned ? <PinOff size={12} /> : <Pin size={12} />} {pinned ? 'Pinned' : 'Pin'}
      </button>
      <button type="button" aria-pressed={excluded} onClick={() => toggleExclude(src.id)} className={cn('inline-flex items-center gap-1 rounded-md font-medium hover:bg-surface2', cls, excluded ? 'text-fail' : 'text-ink2 hover:text-ink')}>
        <EyeOff size={12} /> {excluded ? 'Excluded' : 'Exclude'}
      </button>
    </div>
  );
}

function SourceDetail({ data, src }: { data: ResearchData; src: RSource }) {
  const set = useInteract((s) => s.set);
  const facts = data.facts.filter((f) => f.sourceId === src.id);
  const values = [...(src.extracted?.map((e) => e.value) ?? []), ...facts.map((f) => f.value)].filter((v) => src.snippet?.includes(v));
  const cluster = data.clusters[src.cluster];
  return (
    <>
      <button type="button" onClick={() => set({ selectSource: undefined })} className="mb-3 inline-flex h-7 items-center gap-1 rounded-md px-1.5 text-2xs font-medium text-ink2 hover:bg-surface2 hover:text-ink">
        <ArrowLeft size={12} /> Back to step
      </button>
      <div className="flex flex-wrap items-center gap-2">
        <TypeTag type={src.type} />
        <span className="mono text-xs text-ink3">[{src.ref}]</span>
        <span className="mono text-xs text-ink3">{src.year}</span>
      </div>
      <div className="mt-2 text-sm font-semibold leading-5 text-ink">{src.title}</div>
      <div className="mt-2 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface2">
          <div className="h-full rounded-full bg-accent" style={{ width: `${src.relevance * 100}%` }} />
        </div>
        <span className="mono text-2xs text-ink2">relevance {Math.round(src.relevance * 100)} %</span>
      </div>
      {cluster && <div className="mt-2 inline-flex h-6 items-center rounded-full bg-accent-soft px-2.5 text-2xs font-medium text-accent">{cluster.name}</div>}
      <div className="label mb-1 mt-4">Abstract</div>
      <p className="text-xs leading-5 text-ink2">
        <Highlighted text={src.snippet ?? src.finding} values={values} />
      </p>
      {(src.extracted?.length || facts.length) > 0 && (
        <>
          <div className="label mb-1.5 mt-4">Extracted values</div>
          <div className="space-y-1">
            {src.extracted?.map((e) => (
              <div key={e.label} className="flex items-center justify-between gap-3 rounded-md bg-surface2/60 px-2.5 py-1.5 text-xs">
                <span className="text-ink2">{e.label}</span>
                <span className="mono font-semibold text-ink">{e.value}</span>
              </div>
            ))}
            {!src.extracted?.length &&
              facts.map((f) => (
                <div key={f.id} className="flex items-center justify-between gap-3 rounded-md bg-surface2/60 px-2.5 py-1.5 text-xs">
                  <span className="text-ink2">{f.fact}</span>
                  <span className="mono font-semibold text-ink">{f.value}</span>
                </div>
              ))}
          </div>
        </>
      )}
      <div className="mt-4 border-t border-line pt-3">
        <SourceActions src={src} />
      </div>
    </>
  );
}

/* ------------------------------------------------------------ panel */

export function StepInspector({ data }: { data: ResearchData }) {
  const step = usePlayback((s) => s.step);
  const playing = usePlayback((s) => s.playing);
  const selected = useInteract((s) => s.selectSource);
  const uploads = useChoices((s) => s.uploads);
  const reduced = useReduced();
  const sci = useScientist();
  const src = useMemo(() => (selected ? [...data.sources, ...uploads].find((s) => s.id === selected) : undefined), [selected, data.sources, uploads]);
  const litStep = Math.min(step, LIT_COUNT - 1);
  const done = step >= LIT_COUNT;
  const view = src ? 'source' : done ? 'summary' : STEPS[litStep].id;
  const label = src ? (sci ? 'Source detail' : 'Source') : done ? (sci ? 'Summary' : 'What Helix found') : sci ? STEPS[litStep].label : STEPS[litStep].plain;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-line px-4">
        {!done && !src ? <HelixOrb state="searching" size={20} paused={!playing} /> : <span className="grid h-5 w-5 place-items-center rounded-full bg-accent text-on-accent"><Check size={12} strokeWidth={3} /></span>}
        <span className="text-sm font-semibold text-ink">{label}</span>
        {!src && <span className="mono ml-auto text-xs text-ink3">{done ? `${LIT_COUNT} / ${LIT_COUNT}` : `${litStep + 1} / ${LIT_COUNT}`}</span>}
      </div>
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-4">
        <motion.div key={view} initial={{ opacity: 0, y: reduced ? 0 : 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
            {src ? (
              <SourceDetail data={data} src={src} />
            ) : view === 'summary' ? (
              <Summary data={data} />
            ) : view === 'analyse' ? (
              <Analyse data={data} />
            ) : view === 'identify' ? (
              <Identify data={data} />
            ) : view === 'strategy' ? (
              <Strategy data={data} />
            ) : view === 'search' ? (
              <Search data={data} />
            ) : view === 'cluster' ? (
              <Cluster data={data} />
            ) : (
              <Extract data={data} />
            )}
        </motion.div>
      </div>
    </div>
  );
}
