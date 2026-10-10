import { AnimatePresence, motion } from 'framer-motion';
import { polygonHull } from 'd3-polygon';
import { curveCatmullRomClosed, line } from 'd3-shape';
import { Maximize2, Upload, X } from 'lucide-react';
import { memo, useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { R_TYPES, type ResearchData, type RSource, type RType } from '@/data/demo/research';
import { AgentBot } from '@/components/agents/AgentBot';
import { HelixOrb } from '@/components/ai/HelixOrb';
import { hashString } from '@/lib/motion';
import { cn } from '@/lib/cn';
import { CX, CY, VH, VW, computeLayout, uploadSpot, type MapLayout, type MapNode, type Pt } from './layout';
import { PHASE, STEP_INDEX, easeInOut, easeOut, seg } from './script';
import { useChoices, useInteract, usePlayback, useProg, useReduced } from './store';
import { ORANGE, ShapeIcon, ProgText, shapePath, useScientist } from './shared';

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpPt = (a: Pt, b: Pt, t: number): Pt => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });

interface NodeView {
  x: number;
  y: number;
  r: number;
  fill: string;
  opacity: number;
  visible: boolean;
}

/** Position and look of a node for the current timeline position. */
function viewOf(nd: MapNode, step: number, search: number, cluster: number, excluded: boolean): NodeView {
  const rel = nd.src.status === 'relevant';
  if (step < STEP_INDEX.search) return { ...nd.search, r: 0, fill: 'var(--text-2)', opacity: 0, visible: false };
  const rain = step === STEP_INDEX.search ? seg(search, PHASE.search.rain) : 1;
  const screen = step === STEP_INDEX.search ? seg(search, PHASE.search.screen) : 1;
  const land = Math.max(0, Math.min(1, (rain - nd.batch) / 0.16));
  if (land <= 0) return { ...nd.start, r: 0, fill: 'var(--text-2)', opacity: 0, visible: false };
  let p = land < 1 ? lerpPt(nd.start, nd.search, easeOut(land)) : nd.search;
  if (screen > 0) p = lerpPt(nd.search, nd.screen, easeInOut(screen));
  if (step >= STEP_INDEX.cluster) {
    const m = step === STEP_INDEX.cluster ? easeInOut(seg(cluster, PHASE.cluster.move)) : 1;
    p = lerpPt(nd.screen, nd.cluster, m);
    if (excluded && rel) p = nd.drop;
  }
  const r = lerp(3.2, nd.r, screen);
  const fill = excluded ? 'var(--text-3)' : screen > 0.35 ? (rel ? (nd.src.type === 'Uploaded' ? 'var(--pass)' : 'var(--accent)') : 'var(--text-3)') : 'var(--text-2)';
  const opacity = excluded ? 0.45 : rel ? lerp(0.7, 1, screen) : lerp(0.7, 0.4, screen);
  return { x: p.x, y: p.y, r, fill, opacity: opacity * Math.min(1, land * 1.6), visible: true };
}

function hullPath(pts: Pt[], pad = 18): string | null {
  if (!pts.length) return null;
  const ring: [number, number][] = [];
  pts.forEach((p) => {
    for (let a = 0; a < 12; a++) ring.push([p.x + Math.cos((a / 12) * Math.PI * 2) * pad, p.y + Math.sin((a / 12) * Math.PI * 2) * pad]);
  });
  const h = polygonHull(ring);
  if (!h) return null;
  return line().curve(curveCatmullRomClosed.alpha(0.5))(h);
}

const Node = memo(function Node({ nd, v, ring, highlight, flash, dim, hidden, settled, onEnter, onLeave, onClick }: { nd: MapNode; v: NodeView; ring: boolean; highlight: boolean; flash: number; dim: boolean; hidden: boolean; settled: boolean; onEnter: (e: RPointerEvent, s: RSource) => void; onLeave: () => void; onClick: (s: RSource) => void }) {
  if (!v.visible) return null;
  return (
    <g
      data-node={nd.src.id}
      style={{ transform: `translate(${v.x}px, ${v.y}px)`, transition: settled ? 'transform 450ms cubic-bezier(.2,.8,.2,1), opacity 300ms' : 'opacity 300ms', opacity: hidden ? 0 : dim ? 0.18 : 1, pointerEvents: hidden ? 'none' : undefined }}
      onPointerEnter={(e) => onEnter(e, nd.src)}
      onPointerLeave={onLeave}
      onClick={(e) => {
        e.stopPropagation();
        onClick(nd.src);
      }}
      className="cursor-pointer"
    >
      <circle r={Math.max(8, v.r + 4)} fill="transparent" />
      {flash > 0 && <circle r={v.r + 2 + (1 - flash) * 12} fill="none" stroke="var(--accent)" strokeWidth={2} opacity={flash} />}
      {ring && <circle r={v.r + 3.2} fill="none" stroke={ORANGE} strokeWidth={2} />}
      {highlight && <circle r={v.r + 6} fill="none" stroke="var(--accent)" strokeWidth={2.5} />}
      <path d={shapePath(nd.src.type, v.r)} fill={v.fill} opacity={v.opacity} />
    </g>
  );
});

export function KnowledgeMap({ data, onSize }: { data: ResearchData; onSize?: (w: number) => void }) {
  const scientist = useScientist();
  const reduced = useReduced();
  const base = useMemo(() => computeLayout(data), [data]);
  const uploads = useChoices((s) => s.uploads);
  const excludedIds = useChoices((s) => s.excluded);
  const pinnedIds = useChoices((s) => s.pinned);
  const layout: MapLayout = useMemo(() => {
    if (!uploads.length) return base;
    const extra: MapNode[] = uploads.map((u, k) => {
      const p = uploadSpot(base, u.cluster, k);
      return { src: u, r: 6, start: p, search: p, screen: p, cluster: p, drop: p, batch: 0 };
    });
    const nodes = [...base.nodes, ...extra];
    return { ...base, nodes, index: new Map(nodes.map((n, i) => [n.src.id, i])) };
  }, [base, uploads]);

  const step = usePlayback((s) => s.step);
  const analyse = useProg(STEP_INDEX.analyse);
  const identify = useProg(STEP_INDEX.identify);
  const search = useProg(STEP_INDEX.search);
  const cluster = useProg(STEP_INDEX.cluster);
  const extract = useProg(STEP_INDEX.extract);
  const { hoverSource, hoverCite, hoverCluster, hiddenTypes, selectSource, set } = useInteract();

  /* size */
  const wrap = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 800, h: 520 });
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      setSize({ w: e.contentRect.width, h: e.contentRect.height });
      onSize?.(e.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [onSize]);

  const viewScale = Math.max(0.3, Math.min(size.w / VW, size.h / VH));

  /* zoom / pan */
  const [z, setZ] = useState({ k: 1, x: 0, y: 0 });
  const toView = (cx: number, cy: number): Pt => {
    const svg = svgRef.current;
    const m = svg?.getScreenCTM();
    if (!svg || !m) return { x: 0, y: 0 };
    const p = new DOMPoint(cx, cy).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  };
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const h = (e: WheelEvent) => {
      e.preventDefault();
      const v = toView(e.clientX, e.clientY);
      setZ((cur) => {
        const k = Math.max(0.6, Math.min(5, cur.k * Math.exp(-e.deltaY * 0.0015)));
        const px = (v.x - cur.x) / cur.k;
        const py = (v.y - cur.y) / cur.k;
        return { k, x: v.x - px * k, y: v.y - py * k };
      });
    };
    el.addEventListener('wheel', h, { passive: false });
    return () => el.removeEventListener('wheel', h);
  }, []);
  const drag = useRef<{ x: number; y: number; zx: number; zy: number } | null>(null);
  const onDown = (e: RPointerEvent<SVGSVGElement>) => {
    if ((e.target as Element).closest('[data-node],[data-label]')) return;
    const v = toView(e.clientX, e.clientY);
    drag.current = { x: v.x, y: v.y, zx: z.x, zy: z.y };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  };
  const onMove = (e: RPointerEvent<SVGSVGElement>) => {
    if (!drag.current) return;
    const v = toView(e.clientX, e.clientY);
    const d = drag.current;
    setZ((cur) => ({ ...cur, x: d.zx + (v.x - d.x), y: d.zy + (v.y - d.y) }));
    drag.current = { ...d, x: d.x, y: d.y };
  };
  const onUp = () => (drag.current = null);
  const fit = () => setZ({ k: 1, x: 0, y: 0 });

  /* tooltip */
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);
  const onEnter = (e: RPointerEvent, s: RSource) => {
    const r = wrap.current!.getBoundingClientRect();
    setTip({ x: e.clientX - r.left, y: e.clientY - r.top });
    set({ hoverSource: s.id });
  };
  const onLeave = () => {
    setTip(null);
    set({ hoverSource: undefined });
  };
  const onClick = (s: RSource) => set({ selectSource: s.id });

  /* timeline-derived */
  const excluded = useMemo(() => new Set(excludedIds), [excludedIds]);
  const pinned = useMemo(() => new Set(pinnedIds), [pinnedIds]);
  const hidden = useMemo(() => new Set(hiddenTypes), [hiddenTypes]);
  const views = layout.nodes.map((nd) => viewOf(nd, step, search, cluster, excluded.has(nd.src.id)));
  const settled = step > STEP_INDEX.cluster || (step === STEP_INDEX.cluster && cluster >= 1);
  const screenT = step > STEP_INDEX.search ? 1 : step === STEP_INDEX.search ? seg(search, PHASE.search.screen) : 0;
  const hullT = step > STEP_INDEX.cluster ? 1 : step === STEP_INDEX.cluster ? seg(cluster, PHASE.cluster.hulls) : 0;
  const factsT = step > STEP_INDEX.extract ? 1 : step === STEP_INDEX.extract ? seg(extract, PHASE.extract.facts) : 0;

  /* extraction flashes */
  const flashBy = useMemo(() => {
    const m = new Map<string, number>();
    if (step !== STEP_INDEX.extract || reduced) return m;
    data.facts.forEach((f, i) => {
      const ti = i / data.facts.length;
      const d = factsT - ti;
      if (d >= 0 && d < 0.05) m.set(f.sourceId, 1 - d / 0.05);
    });
    return m;
  }, [step, factsT, data.facts, reduced]);

  const hoverId = hoverSource ?? hoverCite?.sourceId;
  const hulls = useMemo(
    () =>
      data.clusters.map((c) => {
        const pts = layout.nodes.filter((nd) => nd.src.cluster === c.id && nd.src.status === 'relevant' && !excluded.has(nd.src.id) && !hidden.has(nd.src.type)).map((nd) => nd.cluster);
        return hullPath(pts);
      }),
    [data.clusters, layout.nodes, excluded, hidden],
  );

  /* legend counts tick during the rain */
  const typeCount = (t: RType) => {
    if (t === 'Uploaded') return uploads.length;
    const total = data.counts.byType[t];
    if (step < STEP_INDEX.search) return 0;
    if (step > STEP_INDEX.search) return total;
    const rain = seg(search, PHASE.search.rain);
    const nodesOfType = layout.nodes.filter((n) => n.src.type === t);
    const landed = nodesOfType.filter((n) => rain >= n.batch).length;
    return Math.round((landed / Math.max(1, nodesOfType.length)) * total);
  };

  const hoverNode = hoverSource ? layout.nodes[layout.index.get(hoverSource) ?? -1]?.src : undefined;
  const showDock = step <= STEP_INDEX.search && !(step === STEP_INDEX.search && search > 0.12);

  return (
    <div ref={wrap} className="agent-grid relative h-full min-h-[520px] w-full select-none overflow-hidden" style={{ backgroundSize: '16px 16px' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VW} ${VH}`}
        preserveAspectRatio="xMidYMid meet"
        className={cn('absolute inset-0 h-full w-full touch-none', drag.current ? 'cursor-grabbing' : 'cursor-grab')}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        onDoubleClick={fit}
        role="img"
        aria-label={`Knowledge map: ${data.counts.scanned} sources scanned, ${data.counts.relevant} relevant in ${data.clusters.length} clusters`}
      >
        <g transform={`translate(${z.x} ${z.y}) scale(${z.k})`}>
          {/* hulls */}
          {data.clusters.map((c, i) => {
            const local = Math.max(0, Math.min(1, (hullT - i / (data.clusters.length + 1)) * 3));
            const d = hulls[i];
            if (!d || local <= 0) return null;
            const hot = hoverCluster === c.id;
            return <path key={c.id} d={d} fill="var(--accent)" fillOpacity={hot ? 0.12 : 0.06} stroke="var(--accent)" strokeOpacity={hot ? 0.7 : 0.4} strokeDasharray="4 4" strokeWidth={1} opacity={local} style={{ transition: 'fill-opacity 200ms' }} />;
          })}
          {/* spokes from the brief */}
          {hullT > 0 &&
            layout.centers.map((c, i) => (
              <line key={i} x1={CX} y1={CY} x2={c.x} y2={c.y} stroke="var(--accent)" strokeOpacity={0.2 * hullT} strokeWidth={0.8 + (data.clusters[i].count / 14) * 2.4} strokeDasharray="2 5" strokeLinecap="round" />
            ))}
          {/* edges */}
          {screenT > 0 &&
            layout.edges.map(([a, b], i) => {
              const va = views[a];
              const vb = views[b];
              if (!va.visible || !vb.visible) return null;
              const sa = layout.nodes[a].src;
              const sb = layout.nodes[b].src;
              if (hidden.has(sa.type) || hidden.has(sb.type) || excluded.has(sa.id) || excluded.has(sb.id)) return null;
              const hot = hoverId === sa.id || hoverId === sb.id;
              return <line key={i} x1={va.x} y1={va.y} x2={vb.x} y2={vb.y} stroke={hot ? 'var(--accent)' : 'var(--text-2)'} strokeOpacity={hot ? 0.85 : 0.25 * screenT} strokeWidth={hot ? 1.4 : 1} vectorEffect="non-scaling-stroke" />;
            })}
          {/* brief */}
          <g transform={`translate(${CX} ${CY})`}>
            <motion.g animate={step === STEP_INDEX.analyse && !reduced ? { scale: [1, 1.07, 1] } : { scale: 1 }} transition={step === STEP_INDEX.analyse ? { duration: 1.4, repeat: Infinity } : { duration: 0.2 }}>
              <rect x={-46} y={-20} width={92} height={40} rx={12} fill="var(--surface)" stroke="var(--accent)" strokeWidth={1.5} />
              <text y={5} textAnchor="middle" fontSize={13} fontWeight={600} fill="var(--accent)">
                {scientist ? 'Your brief' : 'Your request'}
              </text>
            </motion.g>
          </g>
          {/* nodes */}
          {layout.nodes.map((nd, i) => (
            <Node
              key={nd.src.id}
              nd={nd}
              v={views[i]}
              ring={screenT > 0.5 && (!!nd.src.top || pinned.has(nd.src.id)) && !excluded.has(nd.src.id)}
              highlight={hoverId === nd.src.id || selectSource === nd.src.id}
              flash={flashBy.get(nd.src.id) ?? 0}
              dim={hoverCluster !== undefined && nd.src.cluster !== hoverCluster}
              hidden={hidden.has(nd.src.type)}
              settled={settled}
              onEnter={onEnter}
              onLeave={onLeave}
              onClick={onClick}
            />
          ))}
          {/* ghost cloud for the capped screened-out nodes */}
          {screenT > 0.5 && layout.ghost > 0 && (
            <g opacity={screenT} transform={`translate(${layout.ghostAt.x} ${layout.ghostAt.y})`} aria-hidden>
              {Array.from({ length: 18 }, (_, i) => (
                <circle key={i} cx={Math.cos(i * 2.39) * (6 + (i % 5) * 4)} cy={Math.sin(i * 2.39) * (4 + (i % 4) * 3)} r={1.6} fill="var(--text-3)" opacity={0.35} />
              ))}
              <text y={26} textAnchor="middle" fontSize={11} fill="var(--text-3)" className="mono">
                +{layout.ghost} more screened out
              </text>
            </g>
          )}
          {/* cluster labels (kept at constant size while zooming) */}
          {data.clusters.map((c, i) => {
            const local = Math.max(0, Math.min(1, (hullT - i / (data.clusters.length + 1)) * 3));
            if (local <= 0) return null;
            const L = layout.labels[i];
            const name = `${scientist ? c.name : c.plain} (${c.count})`;
            const hot = hoverCluster === c.id;
            const sub = `${c.count} sources · ${c.facts} facts`;
            const w = Math.max(name.length, hot ? sub.length : 0) * 6.4 + 20;
            const h = hot ? 40 : 24;
            const ls = 1 / (z.k * viewScale);
            let x0 = L.anchor === 'start' ? 0 : L.anchor === 'end' ? -w : -w / 2;
            // keep the chip inside the map at the current zoom
            const left = (6 - z.x) / z.k;
            const right = (VW - 6 - z.x) / z.k;
            if (L.x + x0 * ls < left) x0 = (left - L.x) / ls;
            if (L.x + (x0 + w) * ls > right) x0 = (right - L.x) / ls - w;
            return (
              <g key={c.id} data-label transform={`translate(${L.x} ${L.y}) scale(${ls})`} opacity={local} onPointerEnter={() => set({ hoverCluster: c.id })} onPointerLeave={() => set({ hoverCluster: undefined })} className="cursor-default">
                <rect x={x0} y={-12} width={w} height={h} rx={12} fill="var(--surface)" stroke={hot ? 'var(--accent)' : 'var(--line)'} />
                <text x={x0 + 10} y={4} fontSize={11.5} fontWeight={600} fill="var(--text)">
                  {name}
                </text>
                {hot && (
                  <text x={x0 + 10} y={20} fontSize={11} fill="var(--accent)" className="mono">
                    {sub}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* concept dock: Analyse → Identify → Strategy */}
      <AnimatePresence>
        {showDock && step >= STEP_INDEX.analyse && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} className="pointer-events-none absolute inset-x-4 top-4 grid grid-cols-3 gap-3">
            {data.concepts.map((c, i) => {
              const local = step > STEP_INDEX.analyse ? 1 : seg(analyse, [0.12 + i * 0.16, 0.12 + i * 0.16 + 0.3]);
              const fromX = size.w / 2 - ((i + 0.5) / 3) * size.w;
              const fromY = size.h / 2 - 40;
              const e = easeOut(local);
              const kws = data.keywords.filter((k) => k.concept === i);
              return (
                <div key={i} style={{ transform: `translate(${fromX * (1 - e)}px, ${fromY * (1 - e)}px) scale(${0.5 + 0.5 * e})`, opacity: local }} className="rounded-lg border border-accent/30 bg-surface/95 p-3 shadow-card">
                  <div className="text-2xs font-semibold text-accent">Concept {i + 1}</div>
                  <div className="mt-0.5 text-xs font-semibold leading-4 text-ink">{scientist ? c.title : c.plain}</div>
                  {step >= STEP_INDEX.identify && kws.length > 0 && (
                    <div className="mt-2 space-y-0.5 border-t border-line pt-2">
                      {kws.map((k, j) => {
                        const kt = step > STEP_INDEX.identify ? 1 : seg(identify, [0.1 + j * 0.12 + i * 0.2, 0.4 + j * 0.12 + i * 0.2]);
                        return <ProgText key={j} t={kt} text={k.synonyms.join(', ')} className="mono line-clamp-2 block text-[11px] leading-4 text-ink2" />;
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* map tools */}
      <div className="absolute bottom-3 right-3 flex items-center gap-2">
        {step > STEP_INDEX.search && <UploadButton data={data} />}
        <button type="button" onClick={fit} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 text-xs font-medium text-ink2 hover:text-ink" title="Fit (double-click the map)">
          <Maximize2 size={12} /> Fit
        </button>
      </div>

      {/* legend */}
      {step >= STEP_INDEX.search && (
        <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-1 rounded-lg border border-line bg-surface/95 p-1 shadow-card">
          {([...R_TYPES, ...(uploads.length ? (['Uploaded'] as const) : [])] as RType[]).map((t) => {
            const off = hidden.has(t);
            return (
              <button
                key={t}
                type="button"
                aria-pressed={!off}
                onClick={() => set({ hiddenTypes: off ? hiddenTypes.filter((x) => x !== t) : [...hiddenTypes, t] })}
                className={cn('inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-2xs font-medium transition-colors hover:bg-surface2', off ? 'text-ink3 line-through' : 'text-ink2')}
                title={off ? `Show ${t}` : `Hide ${t}`}
              >
                <ShapeIcon type={t} size={10} color={off ? 'var(--text-3)' : t === 'Uploaded' ? 'var(--pass)' : 'var(--accent)'} />
                {t}
                <span className="mono font-semibold text-ink">{typeCount(t)}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* hover tooltip */}
      {tip && hoverNode && (
        <div className="pointer-events-none absolute z-10 w-[280px] rounded-lg border border-line bg-surface p-3 text-xs shadow-pop" style={{ left: Math.min(tip.x + 14, size.w - 290), top: Math.max(8, Math.min(tip.y + 14, size.h - 150)) }}>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 font-semibold text-ink2">
              <ShapeIcon type={hoverNode.type} size={9} color="var(--accent)" />
              {hoverNode.type}
            </span>
            <span className="mono text-ink3">{hoverNode.ref}</span>
            <span className="mono ml-auto text-ink3">{hoverNode.year}</span>
          </div>
          <div className="mt-1 line-clamp-2 font-medium text-ink">{hoverNode.title}</div>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface2">
              <div className="h-full rounded-full bg-accent" style={{ width: `${hoverNode.relevance * 100}%` }} />
            </div>
            <span className="mono text-2xs text-ink2">{Math.round(hoverNode.relevance * 100)} %</span>
          </div>
          <div className="mt-1.5 line-clamp-2 text-ink2">{hoverNode.finding}</div>
        </div>
      )}

      {/* empty state before Search */}
      {step < STEP_INDEX.search && step >= STEP_INDEX.strategy && (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 text-center text-xs text-ink3">The map fills when Lumen starts searching.</div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ upload own source */

function UploadButton({ data }: { data: ResearchData }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<{ name: string; phase: 'reading' | 'clustering' | 'done'; cluster?: string } | null>(null);
  const add = useChoices((s) => s.addUpload);
  const count = useChoices((s) => s.uploads.length);
  const ref = useRef<HTMLInputElement>(null);
  const take = (name: string) => {
    const ci = hashString(name) % data.clusters.length;
    setState({ name, phase: 'reading' });
    setTimeout(() => setState({ name, phase: 'clustering' }), 1100);
    setTimeout(() => {
      add({ id: `up-${Date.now().toString(36)}`, ref: `U${String(count + 1).padStart(2, '0')}`, type: 'Uploaded', title: name, year: new Date().getFullYear(), relevance: 0.82, finding: `Your source — read by Iris and clustered into “${data.clusters[ci].name}”.`, cluster: ci, status: 'relevant', snippet: 'Uploaded by you. Values will be extracted when the formulation starts.' });
      setState({ name, phase: 'done', cluster: data.clusters[ci].name });
    }, 2000);
  };
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 text-xs font-medium text-ink2 hover:text-ink">
        <Upload size={12} /> Upload own source
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute bottom-full right-0 z-20 mb-2 w-[300px] rounded-lg border border-line bg-surface p-3 shadow-pop">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-ink">Add a paper, patent or data sheet</span>
              <button type="button" onClick={() => setOpen(false)} className="rounded p-1 text-ink3 hover:bg-surface2" aria-label="Close">
                <X size={13} />
              </button>
            </div>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f) take(f.name);
              }}
              onClick={() => ref.current?.click()}
              className="grid h-24 cursor-pointer place-items-center rounded-md border border-dashed border-line bg-surface2/60 text-center text-xs text-ink2 hover:border-accent"
            >
              <span>
                Drop a PDF here or <span className="font-semibold text-accent">browse</span>
              </span>
            </div>
            <input ref={ref} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={(e) => e.target.files?.[0] && take(e.target.files[0].name)} />
            <button type="button" onClick={() => take('Internal test report — heat ageing.pdf')} className="mt-2 text-2xs font-medium text-accent hover:underline">
              Use a sample file
            </button>
            {state && (
              <div className="mt-3 flex items-center gap-2 border-t border-line pt-3 text-xs text-ink2">
                <AgentBot id={state.phase === 'reading' ? 'reader' : 'scholar'} preset="micro" placement="upload-status" status={state.phase === 'done' ? 'done' : 'working'} />
                {state.phase !== 'done' && <HelixOrb state="searching" size={20} />}
                <span className="min-w-0 truncate">{state.phase === 'reading' ? `Iris is reading ${state.name}…` : state.phase === 'clustering' ? 'Lumen is clustering it…' : `Added to “${state.cluster}” as Uploaded`}</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------ mini-map peek for citation hover when the map is off screen */

export function MiniMapPeek({ data, sourceId }: { data: ResearchData; sourceId: string }) {
  const layout = computeLayout(data);
  const target = layout.nodes[layout.index.get(sourceId) ?? -1];
  const W = 260;
  const H = 156;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="pointer-events-none fixed bottom-24 right-6 z-40 w-[280px] rounded-lg border border-line bg-surface p-2.5 shadow-pop">
      <div className="mb-1.5 flex items-center justify-between text-2xs">
        <span className="font-semibold text-ink2">Knowledge map</span>
        {target && <span className="mono text-accent">{target.src.ref}</span>}
      </div>
      <svg viewBox={`0 0 ${VW} ${VH}`} width={W} height={H} className="agent-grid rounded-md">
        {layout.nodes
          .filter((n) => n.src.status === 'relevant')
          .map((n) => (
            <circle key={n.src.id} cx={n.cluster.x} cy={n.cluster.y} r={7} fill="var(--accent)" opacity={n === target ? 1 : 0.3} />
          ))}
        {target && <circle cx={target.cluster.x} cy={target.cluster.y} r={26} fill="none" stroke={ORANGE} strokeWidth={6} />}
      </svg>
      {target && <div className="mt-1.5 line-clamp-1 text-2xs text-ink2">{target.src.title}</div>}
    </motion.div>
  );
}
