import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Search as SearchIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ResearchData, RSource } from '@/data/demo/research';
import { AgentBadge } from '@/components/agents/AgentBadge';
import { Drawer, Modal } from '@/components/ui/primitives';
import { cn } from '@/lib/cn';
import { KnowledgeMap } from './KnowledgeMap';
import { StepInspector, SourceActions } from './StepInspector';
import { NovyteShowcase, NovyteToggle } from './NovyteShowcase';
import { NOVYTE } from './novyte.config';
import { LIT_COUNT, PHASE, STEP_INDEX, litCounts, seg } from './script';
import { useChoices, useInteract, usePlayback, useProg, useReduced } from './store';
import { Counter, ORANGE, TypeTag, useScientist, useTyping } from './shared';

function useLitCounters(data: ResearchData) {
  const step = usePlayback((s) => s.step);
  const search = useProg(STEP_INDEX.search, 60);
  const extract = useProg(STEP_INDEX.extract, 60);
  return litCounts(data, step, search, extract);
}

/** A thin line flies from the source node to the new row in the facts table (Extract). */
function FactFlyer({ data }: { data: ResearchData }) {
  const reduced = useReduced();
  const t = useProg(STEP_INDEX.extract, 200);
  const step = usePlayback((s) => s.step);
  const count = step === STEP_INDEX.extract ? Math.ceil(seg(t, PHASE.extract.facts) * data.facts.length) : 0;
  const [lines, setLines] = useState<{ key: string; d: string }[]>([]);
  const last = useRef(0);
  useEffect(() => {
    if (reduced || count <= last.current || count === 0) {
      last.current = count;
      return;
    }
    last.current = count;
    const f = data.facts[count - 1];
    const raf = requestAnimationFrame(() => {
      const a = document.querySelector(`[data-node="${f.sourceId}"]`)?.getBoundingClientRect();
      const b = document.querySelector(`[data-fact-row="${f.id}"]`)?.getBoundingClientRect();
      if (!a || !b || b.width === 0) return;
      const x1 = a.left + a.width / 2;
      const y1 = a.top + a.height / 2;
      const x2 = b.left + 6;
      const y2 = b.top + b.height / 2;
      const d = `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${Math.min(y1, y2) - 40} ${x2} ${y2}`;
      const key = `${f.id}-${Date.now()}`;
      setLines((x) => [...x.slice(-1), { key, d }]);
      setTimeout(() => setLines((x) => x.filter((l) => l.key !== key)), 650);
    });
    return () => cancelAnimationFrame(raf);
  }, [count, reduced, data.facts]);
  return (
    <svg className="pointer-events-none fixed inset-0 z-30 h-full w-full" aria-hidden>
      <AnimatePresence>
        {lines.map((l) => (
          <motion.path key={l.key} d={l.d} fill="none" stroke="var(--accent)" strokeWidth={1.2} initial={{ pathLength: 0, opacity: 0.9 }} animate={{ pathLength: 1, opacity: 0.9 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} />
        ))}
      </AnimatePresence>
    </svg>
  );
}

/* ------------------------------------------------------------ top sources */

function SourceCard({ data, src, index }: { data: ResearchData; src: RSource; index: number }) {
  const sci = useScientist();
  const excluded = useChoices((s) => s.excluded.includes(src.id));
  const set = useInteract((s) => s.set);
  const hot = useInteract((s) => s.hoverSource === src.id || s.hoverCite?.sourceId === src.id);
  const n = useTyping(src.finding, `rp-find:${src.id}`, true);
  const cluster = data.clusters[src.cluster];
  return (
    <motion.div
      tabIndex={0}
      role="group"
      aria-label={`${src.type}: ${src.title}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: excluded ? 0.5 : 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      onPointerEnter={() => set({ hoverSource: src.id })}
      onPointerLeave={() => set({ hoverSource: undefined })}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && e.target === e.currentTarget) {
          e.preventDefault();
          e.stopPropagation();
          set({ selectSource: src.id });
        }
      }}
      className={cn('flex min-w-0 flex-col rounded-lg border bg-surface p-3 outline-none transition-shadow focus-visible:shadow-glow', hot ? 'border-accent' : 'border-line')}
      style={{ boxShadow: src.top && !excluded ? `inset 3px 0 0 ${ORANGE}` : undefined }}
    >
      <div className="flex items-center gap-2">
        <TypeTag type={src.type} />
        <span className="mono text-2xs text-ink3">[{src.ref}]</span>
        <span className="mono ml-auto text-2xs text-ink3">{src.year}</span>
      </div>
      <button type="button" onClick={() => set({ selectSource: src.id })} className="mt-2 line-clamp-2 min-h-10 text-left text-xs font-semibold leading-5 text-ink hover:text-accent">
        {src.title}
      </button>
      <div className="mt-1.5 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface2">
          <div className="h-full rounded-full bg-accent" style={{ width: `${src.relevance * 100}%` }} />
        </div>
        <span className="mono text-2xs font-semibold text-ink2">{Math.round(src.relevance * 100)} %</span>
      </div>
      <p className="mt-2 line-clamp-3 min-h-[45px] text-[11px] leading-[15px] text-ink2">
        {src.finding.slice(0, n)}
        {n < src.finding.length && <span className="caret">▍</span>}
      </p>
      {cluster && <span className="mt-2 inline-flex h-6 max-w-full items-center self-start truncate rounded-full bg-accent-soft px-2.5 text-2xs font-medium text-accent">{sci ? cluster.name : cluster.plain}</span>}
      <div className="mt-2 border-t border-line pt-2">
        <SourceActions src={src} size="xs" />
      </div>
    </motion.div>
  );
}

function AllSources({ data, open, onClose }: { data: ResearchData; open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('');
  const uploads = useChoices((s) => s.uploads);
  const excluded = useChoices((s) => s.excluded);
  const sci = useScientist();
  const rows = useMemo(() => {
    const all = [...uploads, ...data.sources.filter((s) => s.status === 'relevant')].sort((a, b) => b.relevance - a.relevance);
    const t = q.trim().toLowerCase();
    return t ? all.filter((s) => `${s.title} ${s.finding} ${s.ref} ${s.type} ${data.clusters[s.cluster]?.name ?? ''}`.toLowerCase().includes(t)) : all;
  }, [q, uploads, data]);
  return (
    <Drawer open={open} onClose={onClose} title={`All relevant sources (${data.counts.relevant + uploads.length})`} width={1000}>
      <div className="mb-3 flex items-center gap-3">
        <label className="relative flex-1">
          <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink3" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, finding, cluster or [ref]" className="input h-9 pl-8 text-xs" />
        </label>
      </div>
      <div className="table-wrap">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-[1]">
            <tr>
              <th className="th h-9 px-3">Type</th>
              <th className="th h-9 px-3">Title</th>
              <th className="th h-9 px-3">Year</th>
              <th className="th h-9 px-3">Relevance</th>
              <th className="th h-9 px-3">{sci ? 'Cluster' : 'Topic'}</th>
              <th className="th h-9 px-3">Finding</th>
              <th className="th h-9 px-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className={cn('align-top', excluded.includes(s.id) && 'opacity-50')}>
                <td className="td whitespace-nowrap px-3 py-2 text-xs">
                  <TypeTag type={s.type} />
                  <div className="mono mt-1 text-2xs text-ink3">[{s.ref}]</div>
                </td>
                <td className="td px-3 py-2 text-xs font-medium leading-5 text-ink">{s.title}</td>
                <td className="td mono px-3 py-2 text-xs">{s.year}</td>
                <td className="td mono px-3 py-2 text-xs">{Math.round(s.relevance * 100)} %</td>
                <td className="td px-3 py-2 text-xs text-ink2">{sci ? data.clusters[s.cluster]?.name : data.clusters[s.cluster]?.plain}</td>
                <td className="td px-3 py-2 text-xs leading-5 text-ink2">{s.finding}</td>
                <td className="td px-2 py-1.5">
                  <SourceActions src={s} size="xs" />
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={7} className="td py-8 text-center text-xs text-ink3">
                  No sources match “{q}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Drawer>
  );
}

function SourceModal({ data }: { data: ResearchData }) {
  const id = useInteract((s) => s.openSource);
  const set = useInteract((s) => s.set);
  const uploads = useChoices((s) => s.uploads);
  const src = id ? [...data.sources, ...uploads].find((s) => s.id === id) : undefined;
  return (
    <Modal open={!!src} onClose={() => set({ openSource: undefined })} title={src ? `[${src.ref}] ${src.type}` : ''} width={620}>
      {src && (
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <TypeTag type={src.type} />
            <span className="mono text-xs text-ink3">{src.year}</span>
          </div>
          <div className="font-semibold leading-6 text-ink">{src.title}</div>
          <p className="leading-6 text-ink2">{src.snippet ?? src.finding}</p>
          <p className="rounded-md bg-surface2 px-3 py-2 text-xs text-ink2">The full text opens in the Literature stage once the formulation starts.</p>
          <SourceActions src={src} />
        </div>
      )}
    </Modal>
  );
}

/* ------------------------------------------------------------ act */

export function ActLiterature({ data, id }: { data: ResearchData; id: string }) {
  const sci = useScientist();
  const step = usePlayback((s) => s.step);
  const c = useLitCounters(data);
  const running = step < LIT_COUNT;
  const [allOpen, setAllOpen] = useState(false);
  const [novyte, setNovyte] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const [wide, setWide] = useState(true);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWide(e.contentRect.width >= 1060));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const top = useMemo(() => data.sources.filter((s) => s.top), [data.sources]);
  const showTop = step > STEP_INDEX.search;

  return (
    <section id={id} aria-label={sci ? 'Act 1: Literature review' : 'Helix reads what is already known'} ref={wrap} className="scroll-mt-[140px] overflow-hidden rounded-xl border border-line bg-surface shadow-card">
      <header className="flex min-h-[88px] flex-wrap items-center gap-x-6 gap-y-3 border-b border-line px-6 py-4">
        <AgentBadge id="scholar" preset="console" size={56} placement="rp-act-lit" status={running ? 'working' : 'idle'} orb="searching" anchor="rp-act:scholar" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-2xs font-semibold text-accent">Act 1</span>
            <h3 className="text-2xl font-semibold leading-8 tracking-[-0.02em] text-ink" style={{ fontSize: 24 }}>
              {sci ? 'Literature review' : 'Helix reads what’s already known'}
            </h3>
            <span className="text-sm text-ink3">· Lumen · Scholar</span>
          </div>
          <p className="mt-0.5 max-w-[560px] text-xs leading-5 text-ink2">Reads papers, patents, technical data sheets and supplier sheets, then pulls out what matters for this brief.</p>
        </div>
        {NOVYTE.literature.src && <NovyteToggle value={novyte} onChange={setNovyte} />}
        <div className="flex items-start gap-6">
          <Counter label={sci ? 'Scanned' : 'Looked at'} value={c.scanned} />
          <Counter label={sci ? 'Screened' : 'Worth a look'} value={c.screened} />
          <Counter label={sci ? 'Relevant' : 'Useful'} value={c.relevant} strong />
          <Counter label={sci ? 'Facts extracted' : 'Facts noted'} value={c.facts} />
        </div>
      </header>

      {novyte && NOVYTE.literature.src ? (
        <NovyteShowcase kind="literature" src={NOVYTE.literature.src} />
      ) : (
        <>
          <div className={cn(wide ? 'grid grid-cols-[minmax(720px,64fr)_minmax(320px,36fr)]' : 'flex flex-col')}>
            <div className={cn('relative min-w-0', wide ? 'h-[600px]' : 'h-[540px]')}>
              <KnowledgeMap data={data} />
            </div>
            <div className={cn('min-w-0 bg-surface', wide ? 'h-[600px] border-l border-line' : 'h-[480px] border-t border-line')}>
              <StepInspector data={data} />
            </div>
          </div>
          <div className="border-t border-line px-6 py-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-ink">{sci ? 'Top sources' : 'Most useful sources'}</span>
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: ORANGE }} aria-hidden />
                <span className="text-2xs text-ink3">ringed on the map</span>
              </div>
              <button type="button" onClick={() => setAllOpen(true)} disabled={!showTop} className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium text-accent hover:bg-accent-soft disabled:opacity-40">
                View all {data.counts.relevant} <ArrowRight size={13} />
              </button>
            </div>
            <div className={cn(wide ? 'grid grid-cols-5 gap-3' : 'scroll-thin grid auto-cols-[260px] grid-flow-col gap-3 overflow-x-auto pb-1')}>
              {showTop
                ? top.map((s, i) => <SourceCard key={s.id} data={data} src={s} index={i} />)
                : top.map((s) => (
                    <div key={s.id} className="flex h-[226px] flex-col gap-2 rounded-lg border border-dashed border-line p-3">
                      <div className="skeleton h-5 w-20" />
                      <div className="skeleton h-3 w-full" />
                      <div className="skeleton h-3 w-2/3" />
                      <div className="mt-auto text-2xs text-ink3">Appears after screening</div>
                    </div>
                  ))}
            </div>
          </div>
        </>
      )}
      <FactFlyer data={data} />
      <AllSources data={data} open={allOpen} onClose={() => setAllOpen(false)} />
      <SourceModal data={data} />
    </section>
  );
}
