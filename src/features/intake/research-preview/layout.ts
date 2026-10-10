import { forceCollide, forceManyBody, forceSimulation, forceX, forceY, type SimulationNodeDatum } from 'd3-force';
import seedrandom from 'seedrandom';
import type { ResearchData, RSource } from '@/data/demo/research';

/** Virtual map space; the SVG scales it to the container (preserveAspectRatio meet). */
export const VW = 860;
export const VH = 600;
export const CX = 430;
export const CY = 318;
/** rendered screened-out nodes are capped; the rest become a ghost cloud */
export const OUT_CAP = 250;

export interface Pt {
  x: number;
  y: number;
}

export interface MapNode {
  src: RSource;
  /** final radius */
  r: number;
  start: Pt;
  search: Pt;
  screen: Pt;
  cluster: Pt;
  /** where an excluded relevant node drifts to */
  drop: Pt;
  /** 0 → 1: when the node lands during the rain */
  batch: number;
}

export interface MapLayout {
  nodes: MapNode[];
  index: Map<string, number>;
  centers: Pt[];
  labels: (Pt & { anchor: 'start' | 'middle' | 'end' })[];
  edges: [number, number][];
  ghost: number;
  ghostAt: Pt;
}

type SimNode = SimulationNodeDatum & { i: number; r: number; tx: number; ty: number };

function run(nodes: SimNode[], setup: (sim: ReturnType<typeof forceSimulation<SimNode>>) => void, ticks = 300) {
  const sim = forceSimulation(nodes).stop();
  setup(sim);
  for (let i = 0; i < ticks; i++) sim.tick();
}

export function radiusOf(s: RSource): number {
  if (s.status !== 'relevant') return 2.4;
  return 4.6 + Math.max(0, Math.min(1, (s.relevance - 0.6) / 0.36)) * 4.4;
}

const TYPE_EDGE: Record<string, (rnd: () => number) => Pt> = {
  Paper: (r) => ({ x: 60 + r() * (VW - 120), y: -30 }),
  Patent: (r) => ({ x: VW + 30, y: 60 + r() * (VH - 120) }),
  TDS: (r) => ({ x: 60 + r() * (VW - 120), y: VH + 30 }),
  'Supplier sheet': (r) => ({ x: -30, y: 60 + r() * (VH - 120) }),
  Uploaded: () => ({ x: VW / 2, y: -30 }),
};
const TYPE_WINDOW: Record<string, [number, number]> = { Paper: [0, 0.5], Patent: [0.3, 0.72], TDS: [0.5, 0.86], 'Supplier sheet': [0.66, 0.92], Uploaded: [0, 0] };

const cache = new Map<string, MapLayout>();

/** Pre-computes every phase of the map off-screen (300 ticks each); the view only interpolates. */
export function computeLayout(d: ResearchData): MapLayout {
  const hit = cache.get(d.scenarioId);
  if (hit) return hit;
  const rnd = seedrandom(`helix-research-map:${d.scenarioId}`);
  const relevant = d.sources.filter((s) => s.status === 'relevant');
  const others = [...d.sources.filter((s) => s.status === 'screened'), ...d.sources.filter((s) => s.status === 'out')];
  const shownOthers = others.slice(0, OUT_CAP);
  const list = [...relevant, ...shownOthers];

  /* cluster centres on an ellipse round the brief */
  const k = d.clusters.length;
  const centers: Pt[] = d.clusters.map((_, i) => {
    const a = -Math.PI / 2 + (i / k) * Math.PI * 2;
    return { x: CX + Math.cos(a) * 262, y: CY + Math.sin(a) * 182 };
  });

  /* search: one loose cloud */
  const sNodes: SimNode[] = list.map((_, i) => ({ i, r: 3.4, tx: CX, ty: CY, x: CX + (rnd() - 0.5) * 600, y: CY + (rnd() - 0.5) * 420 }));
  run(sNodes, (sim) => {
    sim.force('x', forceX<SimNode>(CX).strength(0.045)).force('y', forceY<SimNode>(CY).strength(0.06)).force('c', forceCollide<SimNode>((x) => x.r + 2.6)).force('m', forceManyBody<SimNode>().strength(-5));
  });

  /* screen: relevant pulled in, the rest pushed to an outer ring */
  const scNodes: SimNode[] = list.map((s, i) => {
    const rel = s.status === 'relevant';
    const a = rnd() * Math.PI * 2;
    const rx = rel ? 120 : 395;
    const ry = rel ? 92 : 266;
    return { i, r: radiusOf(s), tx: CX + Math.cos(a) * rx, ty: CY + Math.sin(a) * ry, x: sNodes[i].x, y: sNodes[i].y };
  });
  run(scNodes, (sim) => {
    sim
      .force('x', forceX<SimNode>((x) => x.tx).strength(0.3))
      .force('y', forceY<SimNode>((x) => x.ty).strength(0.3))
      .force('c', forceCollide<SimNode>((x) => x.r + 2.2));
  });

  /* cluster: relevant to their centres; screened-out keep the ring */
  const brief: SimNode = { i: -1, r: 46, tx: CX, ty: CY, x: CX, y: CY, fx: CX, fy: CY };
  const cNodes: SimNode[] = list.map((s, i) => {
    const rel = s.status === 'relevant';
    const c = rel ? centers[s.cluster] : null;
    return { i, r: radiusOf(s), tx: c ? c.x : scNodes[i].x!, ty: c ? c.y : scNodes[i].y!, x: scNodes[i].x, y: scNodes[i].y, ...(rel ? {} : { fx: scNodes[i].x, fy: scNodes[i].y }) };
  });
  run([...cNodes, brief], (sim) => {
    sim
      .force('x', forceX<SimNode>((x) => x.tx).strength(0.28))
      .force('y', forceY<SimNode>((x) => x.ty).strength(0.28))
      .force('c', forceCollide<SimNode>((x) => (x.i < 0 ? x.r : list[x.i].status === 'relevant' ? x.r + 4 : x.r + 0.5)).strength(0.9))
      .force('m', forceManyBody<SimNode>().strength((x) => (x.i >= 0 && list[x.i].status === 'relevant' ? -10 : 0)));
  });

  const clamp = (p: Pt, pad = 10): Pt => ({ x: Math.max(pad, Math.min(VW - pad, p.x)), y: Math.max(pad, Math.min(VH - pad, p.y)) });

  const nodes: MapNode[] = list.map((s, i) => {
    const w = TYPE_WINDOW[s.type];
    const cl = clamp({ x: cNodes[i].x!, y: cNodes[i].y! });
    const dir = s.cluster >= 0 ? { x: cl.x - CX, y: cl.y - CY } : { x: 0, y: 0 };
    const len = Math.hypot(dir.x, dir.y) || 1;
    return {
      src: s,
      r: radiusOf(s),
      start: TYPE_EDGE[s.type](rnd),
      search: clamp({ x: sNodes[i].x!, y: sNodes[i].y! }),
      screen: clamp({ x: scNodes[i].x!, y: scNodes[i].y! }),
      cluster: cl,
      drop: clamp({ x: cl.x + (dir.x / len) * 70, y: cl.y + (dir.y / len) * 46 }, 16),
      batch: w[0] + rnd() * (w[1] - w[0]),
    };
  });

  /* cluster labels just outside each hull, pointing away from the brief */
  const labels = centers.map((c, ci) => {
    const pts = nodes.filter((nd) => nd.src.cluster === ci && nd.src.status === 'relevant');
    const ys = pts.map((nd) => nd.cluster.y);
    const above = c.y <= CY + 20;
    const y = above ? Math.min(...ys, c.y) - 34 : Math.max(...ys, c.y) + 34;
    const x = pts.reduce((a, nd) => a + nd.cluster.x, 0) / Math.max(1, pts.length);
    return { x, y: Math.max(16, Math.min(VH - 16, y)), anchor: 'middle' as const };
  });


  /* citation / similarity edges */
  const edges: [number, number][] = [];
  const byCluster = d.clusters.map((_, ci) => nodes.map((nd, i) => (nd.src.cluster === ci ? i : -1)).filter((i) => i >= 0));
  byCluster.forEach((ids) => {
    ids.forEach((i, j) => {
      const links = 1 + (rnd() < 0.5 ? 1 : 0);
      for (let l = 0; l < links && ids.length > 1; l++) {
        const o = ids[(j + 1 + Math.floor(rnd() * (ids.length - 1))) % ids.length];
        if (o !== i) edges.push([i, o]);
      }
    });
  });
  const tops = nodes.map((nd, i) => (nd.src.status === 'relevant' ? i : -1)).filter((i) => i >= 0);
  for (let e = 0; e < 14; e++) {
    const a = tops[Math.floor(rnd() * tops.length)];
    const b = tops[Math.floor(rnd() * tops.length)];
    if (a !== b && nodes[a].src.cluster !== nodes[b].src.cluster) edges.push([a, b]);
  }

  const out: MapLayout = { nodes, index: new Map(nodes.map((nd, i) => [nd.src.id, i])), centers, labels, edges, ghost: others.length - shownOthers.length, ghostAt: { x: VW - 80, y: 36 } };
  cache.set(d.scenarioId, out);
  return out;
}

/** a free spot near a cluster centre for an uploaded source */
export function uploadSpot(layout: MapLayout, cluster: number, k: number): Pt {
  const c = layout.centers[cluster] ?? { x: CX, y: CY };
  const a = k * 2.4 + 0.6;
  return { x: c.x + Math.cos(a) * (34 + k * 6), y: c.y + Math.sin(a) * (26 + k * 4) };
}
