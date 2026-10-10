import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { seeded } from '@/lib/motion';
import { CountUp } from './TypeText';
import { AgentBadge } from '@/components/agents/AgentBadge';

/**
 * Placeholder visuals; replace with Novyte screenshots per brief when available.
 * Pass `src` to show the screenshot instead of the animated placeholder.
 */
export function NovyteShowcase({ kind, src, caption }: { kind: 'literature' | 'pathways'; src?: string; caption?: string }) {
  if (src)
    return (
      <figure className="card overflow-hidden">
        <img src={src} alt={caption ?? kind} className="w-full" />
        {caption && <figcaption className="border-t border-line px-3 py-2 text-xs text-ink2">{caption}</figcaption>}
      </figure>
    );
  return kind === 'literature' ? <LiteraturePlaceholder caption={caption} /> : <PathwaysPlaceholder caption={caption} />;
}

const SHAPES = ['circle', 'square', 'triangle', 'diamond'] as const;
const SHAPE_LABEL = { circle: 'Paper', square: 'Patent', triangle: 'TDS', diamond: 'Supplier sheet' };

function Node({ shape, x, y, delay, hot }: { shape: (typeof SHAPES)[number]; x: number; y: number; delay: number; hot: boolean }) {
  const fill = hot ? 'var(--accent)' : 'var(--text-3)';
  const s = hot ? 7 : 5;
  return (
    <motion.g initial={{ opacity: 0, scale: 0 }} animate={{ opacity: hot ? 1 : 0.55, scale: 1 }} transition={{ delay, duration: 0.3 }} style={{ transformOrigin: `${x}px ${y}px` }}>
      {shape === 'circle' && <circle cx={x} cy={y} r={s / 1.4} fill={fill} />}
      {shape === 'square' && <rect x={x - s / 2} y={y - s / 2} width={s} height={s} fill={fill} />}
      {shape === 'triangle' && <polygon points={`${x},${y - s / 1.5} ${x + s / 1.5},${y + s / 2} ${x - s / 1.5},${y + s / 2}`} fill={fill} />}
      {shape === 'diamond' && <polygon points={`${x},${y - s / 1.4} ${x + s / 1.4},${y} ${x},${y + s / 1.4} ${x - s / 1.4},${y}`} fill={fill} />}
    </motion.g>
  );
}

function LiteraturePlaceholder({ caption }: { caption?: string }) {
  const nodes = useMemo(() => {
    const r = seeded(42);
    const centers = [
      [90, 70],
      [230, 60],
      [330, 120],
      [140, 170],
      [270, 190],
    ];
    return Array.from({ length: 70 }, (_, i) => {
      const c = centers[i % centers.length];
      const a = r() * Math.PI * 2;
      const d = 10 + r() * 42;
      return { x: c[0] + Math.cos(a) * d, y: c[1] + Math.sin(a) * d, shape: SHAPES[Math.floor(r() * 4)], hot: r() > 0.8, delay: i * 0.06, c };
    });
  }, []);
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setPhase(1), 2600);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="card agent-grid relative overflow-hidden p-4">
      <div className="flex items-center gap-3">
        <AgentBadge id="scholar" preset="console" placement="showcase-lit" status="working" orb="searching" />
        <div>
          <div className="text-sm font-semibold">Literature review <span className="font-normal text-ink3">· Lumen</span></div>
          <div className="text-xs text-ink2">{caption}</div>
          <div className="mono mt-1 text-xs text-ink2">
            Sources scanned <b className="text-ink"><CountUp value={phase ? 412 : 180} /></b> → Relevant <b className="text-accent"><CountUp value={phase ? 63 : 21} /></b>
          </div>
        </div>
      </div>
      <svg viewBox="0 0 420 240" className="mt-2 h-[220px] w-full">
        {nodes
          .filter((n) => n.hot)
          .map((n, i) => (
            <motion.line key={`l${i}`} x1={n.x} y1={n.y} x2={n.c[0]} y2={n.c[1]} stroke="var(--accent)" strokeOpacity={0.25} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: n.delay + 0.4, duration: 0.5 }} />
          ))}
        {nodes.map((n, i) => (
          <Node key={i} {...n} />
        ))}
      </svg>
      <div className="flex gap-3 text-2xs text-ink3">
        {SHAPES.map((s) => (
          <span key={s} className="flex items-center gap-1">
            <svg width="10" height="10">
              <Node shape={s} x={5} y={5} delay={0} hot={false} />
            </svg>
            {SHAPE_LABEL[s]}
          </span>
        ))}
      </div>
    </div>
  );
}

function PathwaysPlaceholder({ caption }: { caption?: string }) {
  return (
    <div className="card agent-grid p-4">
      <div className="flex items-center gap-3">
        <AgentBadge id="weaver" preset="console" placement="showcase-pw" status="working" orb="weaving" />
        <div>
          <div className="text-sm font-semibold">Synthesis pathways <span className="font-normal text-ink3">· Weave</span></div>
          <div className="text-xs text-ink2">{caption}</div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {[0.87, 0.81, 0.78].map((score, i) => (
          <motion.div key={i} initial={{ opacity: 0.2 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 + i * 0.7 }} className="rounded-md border border-dashed border-line bg-surface p-2.5">
            <div className="flex items-center gap-2">
              <span className="mono text-2xs text-ink3">P{i + 1}</span>
              <motion.div className="skeleton h-2.5" initial={{ width: 0 }} animate={{ width: 140 - i * 20 }} transition={{ delay: 0.8 + i * 0.7, duration: 0.5 }} />
              <span className="mono ml-auto text-xs font-semibold text-accent">
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 + i * 0.7 }}>
                  {score.toFixed(2)}
                </motion.span>
              </span>
            </div>
            <div className="mt-2 flex h-2 overflow-hidden rounded">
              {[34, 56, 4, 3, 1, 2].map((w, k) => (
                <motion.div
                  key={k}
                  initial={{ width: 0 }}
                  animate={{ width: `${w}%` }}
                  transition={{ delay: 1 + i * 0.7 + k * 0.08, duration: 0.4 }}
                  style={{ background: `color-mix(in srgb, var(--accent) ${90 - k * 13}%, var(--surface-2))` }}
                />
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
