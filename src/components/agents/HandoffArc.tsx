import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { bus } from '@/agent/bus';
import { botMotionAllowed } from '@/agent/engine';
import type { AgentId } from '@/agents/registry';

interface Arc {
  key: number;
  d: string;
}

function anchor(scope: string, agent: AgentId): DOMRect | null {
  const els = document.querySelectorAll(`[data-bot-anchor="${CSS.escape(`${scope}:${agent}`)}"]`);
  for (const el of Array.from(els)) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth) return r;
  }
  return null;
}

/** Short arc between two bots: rises from the outgoing bot and lands on the incoming one. */
export function arcPath(a: DOMRect, b: DOMRect): string {
  const x1 = a.left + a.width / 2;
  const y1 = a.top + a.height / 2;
  const x2 = b.left + b.width / 2;
  const y2 = b.top + b.height / 2;
  const dist = Math.hypot(x2 - x1, y2 - y1);
  const lift = Math.max(24, Math.min(120, dist * 0.35));
  const cx = (x1 + x2) / 2 + (Math.abs(x2 - x1) < 20 ? lift : 0);
  const cy = Math.min(y1, y2) - lift;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

let seq = 0;

/** Global overlay: draws an accent dotted arc whenever work passes between agents (≤ 700 ms). */
export function HandoffLayer() {
  const [arcs, setArcs] = useState<Arc[]>([]);
  useEffect(
    () =>
      bus.on('handoff', ({ from, to, scopes }) => {
        if (!botMotionAllowed()) return;
        for (const scope of scopes) {
          const a = anchor(scope, from);
          const b = anchor(scope, to);
          if (!a || !b) continue;
          const key = ++seq;
          setArcs((x) => [...x, { key, d: arcPath(a, b) }]);
          setTimeout(() => setArcs((x) => x.filter((y) => y.key !== key)), 700);
          return;
        }
      }),
    [],
  );
  return (
    <svg className="pointer-events-none fixed inset-0 z-[55] h-full w-full" aria-hidden>
      <AnimatePresence>
        {arcs.map((a) => (
          // the dotted stroke is revealed by a solid mask path whose length animates (pathLength owns the dasharray)
          <motion.g key={a.key} initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            <defs>
              <mask id={`handoff-${a.key}`} maskUnits="userSpaceOnUse">
                <motion.path d={a.d} fill="none" stroke="#fff" strokeWidth={8} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }} />
              </mask>
            </defs>
            <path d={a.d} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinecap="round" strokeDasharray="0.5 5" mask={`url(#handoff-${a.key})`} />
          </motion.g>
        ))}
      </AnimatePresence>
    </svg>
  );
}
