import { motion } from 'framer-motion';
import { sankey, sankeyLinkHorizontal, type SankeyLink, type SankeyNode } from 'd3-sankey';
import { Table2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ResearchData } from '@/data/demo/research';
import { AgentBot } from '@/components/agents/AgentBot';
import { cn } from '@/lib/cn';
import { STEP_INDEX } from './script';
import { useInteract, usePlayback, useReduced } from './store';
import { ORANGE, useScientist } from './shared';

interface N {
  id: string;
  label: string;
  kind: 'cluster' | 'route';
  cluster?: number;
}
interface L {
  source: string;
  target: string;
  value: number;
  cluster: number;
  route: string;
  factIds: string[];
}

const H = 230;
const ML = 236;
const MR = 112;

export function scrollToCard(id: string) {
  const el = document.getElementById(`rp-card-${id}`);
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el?.focus({ preventScroll: true });
}

export function EvidenceBridge({ data, id }: { data: ResearchData; id: string }) {
  const sci = useScientist();
  const reduced = useReduced();
  const step = usePlayback((s) => s.step);
  const live = step >= STEP_INDEX.generate;
  const { hoverCite, hoverRoute, set } = useInteract();
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(1000);
  const [table, setTable] = useState(false);
  const [hover, setHover] = useState<{ i: number; x: number; y: number } | null>(null);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const routes = data.routes.filter((r) => r.feasible);
  const graph = useMemo(() => {
    const nodes: N[] = [...data.clusters.map((c) => ({ id: `c${c.id}`, label: sci ? c.name : c.plain, kind: 'cluster' as const, cluster: c.id })), ...routes.map((r) => ({ id: r.id, label: r.id, kind: 'route' as const }))];
    const links: L[] = data.flows.map((f) => ({ source: `c${f.cluster}`, target: f.route, value: f.value, cluster: f.cluster, route: f.route, factIds: f.factIds }));
    const gen = sankey<N, L>()
      .nodeId((d) => d.id)
      .nodeWidth(10)
      .nodePadding(8)
      .nodeSort(null)
      .extent([
        [ML, 6],
        [Math.max(ML + 200, w - MR), H - 6],
      ]);
    return gen({ nodes: nodes.map((d) => ({ ...d })), links: links.map((d) => ({ ...d })) });
  }, [data, routes, w, sci]);

  const citeCluster = hoverCite ? data.sources.find((s) => s.id === hoverCite.sourceId)?.cluster : undefined;
  const hotLink = (l: SankeyLink<N, L>) => {
    if (hover && graph.links[hover.i] === l) return true;
    if (hoverRoute && l.route === hoverRoute) return true;
    if (hoverCite && l.cluster === citeCluster && (!hoverCite.route || l.route === hoverCite.route)) return true;
    return false;
  };
  const anyHot = !!hover || !!hoverRoute || !!hoverCite;
  const hl = hover ? graph.links[hover.i] : null;
  const path = sankeyLinkHorizontal();

  return (
    <section id={id} aria-label="From evidence to recipes" className="scroll-mt-[140px] rounded-xl border border-line bg-surface shadow-card">
      <header className="flex min-h-14 flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-6 py-3">
        <div className="flex items-center gap-2">
          <AgentBot id="scholar" preset="micro" placement="rp-bridge-l" status={live ? 'done' : 'idle'} />
          <span className="text-ink3">→</span>
          <AgentBot id="weaver" preset="micro" placement="rp-bridge-w" status={live && step < STEP_INDEX.rank + 1 ? 'working' : 'idle'} />
        </div>
        <h3 className="text-[15px] font-semibold text-ink">{sci ? 'From evidence to recipes' : 'How the facts shape the recipes'}</h3>
        {live && (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mono min-w-0 truncate text-2xs text-ink2">
            <span className="font-semibold text-accent">HANDOFF</span> Lumen → Weave “{data.counts.facts} facts across {data.clusters.length} clusters. Build routes.”
          </motion.span>
        )}
        <button type="button" onClick={() => setTable((x) => !x)} disabled={!live} className="ml-auto inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium text-accent hover:bg-accent-soft disabled:opacity-40">
          <Table2 size={13} /> {table ? 'View as chart' : 'View as table'}
        </button>
      </header>
      <div ref={box} className="relative px-6 py-4">
        {!live ? (
          <div className="grid h-[230px] place-items-center rounded-lg border border-dashed border-line text-center text-xs text-ink3">
            <div>
              <div className="font-medium text-ink2">{sci ? 'Evidence → routes' : 'Facts → recipes'}</div>
              <div className="mt-1">Lumen hands the facts to Weave when Extract finishes.</div>
            </div>
          </div>
        ) : table ? (
          <div className="table-wrap">
            <table className="w-full text-xs">
              <caption className="sr-only">Facts used per cluster and pathway</caption>
              <thead>
                <tr>
                  <th className="th h-9 px-3">{sci ? 'Cluster' : 'Topic'}</th>
                  {routes.map((r) => (
                    <th key={r.id} className="th h-9 px-3 text-right">
                      {r.id}
                    </th>
                  ))}
                  <th className="th h-9 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.clusters.map((c) => (
                  <tr key={c.id}>
                    <td className="td px-3 py-1.5 text-xs">{sci ? c.name : c.plain}</td>
                    {routes.map((r) => (
                      <td key={r.id} className="td mono px-3 py-1.5 text-right text-xs">
                        {data.flows.find((f) => f.cluster === c.id && f.route === r.id)?.value ?? '—'}
                      </td>
                    ))}
                    <td className="td mono px-3 py-1.5 text-right text-xs font-semibold">{data.flows.filter((f) => f.cluster === c.id).reduce((a, f) => a + f.value, 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <svg height={H} viewBox={`0 0 ${w} ${H}`} className="block w-full overflow-visible" role="img" aria-label={`Sankey diagram: facts from ${data.clusters.length} clusters flowing into ${routes.length} pathways`} onPointerLeave={() => setHover(null)}>
            {graph.links.map((l, i) => {
              const hot = hotLink(l);
              return (
                <motion.path
                  key={i}
                  d={path(l) ?? ''}
                  fill="none"
                  stroke="var(--accent)"
                  strokeOpacity={hot ? 0.6 : anyHot ? 0.12 : 0.25}
                  strokeWidth={Math.max(1, l.width ?? 1)}
                  initial={reduced ? { opacity: 0 } : { pathLength: 0 }}
                  animate={reduced ? { opacity: 1 } : { pathLength: 1 }}
                  transition={reduced ? { duration: 0.15 } : { duration: 0.4, delay: 0.7 + i * 0.08, ease: 'easeOut' }}
                  onPointerMove={(e) => {
                    const r = box.current!.getBoundingClientRect();
                    setHover({ i, x: e.clientX - r.left, y: e.clientY - r.top });
                  }}
                  onPointerLeave={() => setHover(null)}
                  style={{ transition: 'stroke-opacity 150ms' }}
                />
              );
            })}
            {graph.nodes.map((n: SankeyNode<N, L>) => {
              const x0 = n.x0 ?? 0;
              const x1 = n.x1 ?? 0;
              const y0 = n.y0 ?? 0;
              const y1 = n.y1 ?? 0;
              const route = routes.find((r) => r.id === n.id);
              const isTop = route?.rank === 1;
              return (
                <g key={n.id}>
                  <rect x={x0} y={y0} width={x1 - x0} height={Math.max(2, y1 - y0)} rx={2} fill={isTop ? ORANGE : 'var(--accent)'} opacity={n.kind === 'cluster' ? 0.55 : 1} />
                  {n.kind === 'cluster' ? (
                    <text x={x0 - 8} y={(y0 + y1) / 2 + 4} textAnchor="end" fontSize={11.5} fill="var(--text-2)">
                      {n.label} <tspan className="mono" fill="var(--text-3)">{n.value}</tspan>
                    </text>
                  ) : (
                    <g
                      className="cursor-pointer"
                      role="button"
                      tabIndex={0}
                      onClick={() => scrollToCard(n.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.stopPropagation();
                          scrollToCard(n.id);
                        }
                      }}
                      onPointerEnter={() => set({ hoverRoute: n.id })}
                      onPointerLeave={() => set({ hoverRoute: undefined })}
                    >
                      <rect x={x1 + 4} y={(y0 + y1) / 2 - 11} width={96} height={22} fill="transparent" />
                      <text x={x1 + 8} y={(y0 + y1) / 2 + 4} fontSize={12} fontWeight={600} fill="var(--text)">
                        {n.id}
                        <tspan className="mono" fontWeight={400} fill="var(--text-3)">
                          {' '}
                          · {route?.scores.overall.toFixed(2)} · {n.value}
                        </tspan>
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        )}
        {hl && hover && !table && (
          <div className="pointer-events-none absolute z-10 w-[300px] rounded-lg border border-line bg-surface p-3 text-xs shadow-pop" style={{ left: Math.min(hover.x + 12, w - 320), top: Math.min(hover.y + 12, H - 40) }}>
            <div className="font-semibold text-ink">
              {sci ? data.clusters[hl.cluster].name : data.clusters[hl.cluster].plain} → {hl.route}: <span className="mono">{hl.value}</span> facts
            </div>
            <ul className={cn('mt-1.5 space-y-0.5 text-ink2')}>
              {hl.factIds.map((fid) => {
                const f = data.facts.find((x) => x.id === fid);
                return f ? (
                  <li key={fid} className="truncate">
                    · {sci ? f.fact : f.plain}
                  </li>
                ) : null;
              })}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
