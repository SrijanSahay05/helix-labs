import { motion } from 'framer-motion';
import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import type { ResearchData, RType } from '@/data/demo/research';
import { useUI } from '@/store/ui';
import { cn } from '@/lib/cn';
import { useInteract, useReduced } from './store';

/* ------------------------------------------------------------ source-type shapes */

export const TYPE_SHAPE: Record<RType, string> = { Paper: '●', Patent: '■', TDS: '▲', 'Supplier sheet': '◆', Uploaded: '⬟' };

/** SVG path centred on 0,0 for a source type at radius r. */
export function shapePath(type: RType, r: number): string {
  switch (type) {
    case 'Paper':
      return `M ${-r} 0 a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
    case 'Patent': {
      const s = r * 0.88;
      return `M ${-s} ${-s} H ${s} V ${s} H ${-s} Z`;
    }
    case 'TDS': {
      const h = r * 1.15;
      return `M 0 ${-h} L ${h} ${h * 0.75} L ${-h} ${h * 0.75} Z`;
    }
    case 'Supplier sheet': {
      const s = r * 1.2;
      return `M 0 ${-s} L ${s} 0 L 0 ${s} L ${-s} 0 Z`;
    }
    case 'Uploaded': {
      const s = r * 1.15;
      return Array.from({ length: 5 }, (_, i) => {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        return `${i ? 'L' : 'M'} ${(Math.cos(a) * s).toFixed(2)} ${(Math.sin(a) * s).toFixed(2)}`;
      }).join(' ') + ' Z';
    }
  }
}

export function ShapeIcon({ type, size = 10, color = 'currentColor', className }: { type: RType; size?: number; color?: string; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="-6 -6 12 12" className={cn('shrink-0', className)} aria-hidden>
      <path d={shapePath(type, 4.4)} fill={color} />
    </svg>
  );
}

export function TypeTag({ type }: { type: RType }) {
  return (
    <span className="inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-[6px] bg-surface2 px-2 text-2xs font-medium text-ink2">
      <ShapeIcon type={type} size={9} color={type === 'Uploaded' ? 'var(--pass)' : 'var(--accent)'} />
      {type}
    </span>
  );
}


/** orange is reserved for top sources / best highlights */
export const ORANGE = '#F59E0B';

/* ------------------------------------------------------------ numbers */

/** Number that tweens to its new value over ~700 ms (instant with reduced motion). */
export function AnimatedNumber({ value, decimals = 0, className }: { value: number; decimals?: number; className?: string }) {
  const reduced = useReduced();
  const [v, setV] = useState(value);
  const from = useRef(value);
  const lastAt = useRef(0);
  useEffect(() => {
    const now = performance.now();
    const streaming = now - lastAt.current < 120;
    lastAt.current = now;
    if (reduced || streaming) {
      from.current = value;
      return setV(value);
    }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / 700);
      const x = a + (value - a) * (1 - Math.pow(1 - p, 3));
      setV(x);
      from.current = x;
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, reduced]);
  return <span className={cn('tabular-nums', className)}>{v.toFixed(decimals)}</span>;
}

export function Counter({ label, value, decimals = 0, strong }: { label: string; value: number; decimals?: number; strong?: boolean }) {
  return (
    <div className="min-w-[84px]">
      <div className={cn('mono text-[28px] font-semibold leading-8', strong ? 'text-accent' : 'text-ink')}>
        <AnimatedNumber value={value} decimals={decimals} />
      </div>
      <div className="mt-0.5 whitespace-nowrap text-2xs font-medium text-ink3">{label}</div>
    </div>
  );
}

/* ------------------------------------------------------------ typing */

/** Text revealed by timeline progress (scrubbable). */
export function ProgText({ text, t, className }: { text: string; t: number; className?: string }) {
  const n = Math.round(text.length * Math.max(0, Math.min(1, t)));
  return (
    <span className={className}>
      {text.slice(0, n)}
      {n > 0 && n < text.length && <span className="caret">▍</span>}
    </span>
  );
}

const typed = new Set<string>();

/** Wall-clock typing at ~22 ms/char, scaled by demo speed; instant on revisit or reduced motion. */
export function useTyping(text: string, id: string, active = true): number {
  const reduced = useReduced();
  const demo = useUI((s) => s.speed);
  const instant = reduced || demo === 'instant' || typed.has(id);
  const [n, setN] = useState(instant ? text.length : 0);
  useEffect(() => {
    if (!active) return;
    if (instant) {
      typed.add(id);
      return setN(text.length);
    }
    let i = 0;
    const f = typeof demo === 'number' ? demo : 1;
    const h = setInterval(() => {
      i = Math.min(text.length, i + 1);
      setN(i);
      if (i >= text.length) {
        typed.add(id);
        clearInterval(h);
      }
    }, 22 / f);
    return () => clearInterval(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, active]);
  return active ? n : 0;
}

/** Typed paragraph with **bold** and [REF] citation chips. */
export function CitedText({ text, id, data, active = true, className, route }: { text: string; id: string; data: ResearchData; active?: boolean; className?: string; route?: string }) {
  const n = useTyping(text, id, active);
  const shown = text.slice(0, n);
  const parts: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\[[A-Z]{1,2}\d{2,3}\])/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(shown))) {
    if (m.index > last) parts.push(<Fragment key={k++}>{shown.slice(last, m.index)}</Fragment>);
    const tok = m[0];
    if (tok.startsWith('**')) parts.push(<strong key={k++} className="font-semibold text-ink">{tok.slice(2, -2)}</strong>);
    else parts.push(<CiteChip key={k++} refLabel={tok.slice(1, -1)} data={data} route={route} />);
    last = m.index + tok.length;
  }
  if (last < shown.length) parts.push(<Fragment key={k++}>{shown.slice(last).replace(/\*+$/, '').replace(/\[[A-Z0-9]*$/, '')}</Fragment>);
  return (
    <span className={className}>
      {parts}
      {n < text.length && active && <span className="caret">▍</span>}
    </span>
  );
}

/** Citation chip: hover highlights the source node on the map and the Sankey flow; click opens the source. */
export function CiteChip({ refLabel, data, route, className }: { refLabel: string; data: ResearchData; route?: string; className?: string }) {
  const src = data.sources.find((s) => s.ref === refLabel);
  const set = useInteract((s) => s.set);
  const active = useInteract((s) => !!src && s.hoverCite?.sourceId === src.id);
  if (!src) return <span className="mono text-2xs text-ink3">[{refLabel}]</span>;
  return (
    <button
      type="button"
      onPointerEnter={() => set({ hoverCite: { sourceId: src.id, route } })}
      onPointerLeave={() => set({ hoverCite: undefined })}
      onFocus={() => set({ hoverCite: { sourceId: src.id, route } })}
      onBlur={() => set({ hoverCite: undefined })}
      onClick={() => set({ selectSource: src.id })}
      title={`${src.type} · ${src.title}`}
      className={cn(
        'mono mx-[1px] inline-flex h-5 items-center rounded border px-1 align-baseline text-[10px] font-semibold transition-colors',
        active ? 'border-accent bg-accent text-on-accent' : 'border-accent/30 bg-accent-soft text-accent hover:border-accent',
        className,
      )}
    >
      [{refLabel}]
    </button>
  );
}

/* ------------------------------------------------------------ rings and bars */

export function ScoreRing({ value, size = 56, best }: { value: number; size?: number; best?: boolean }) {
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0" role="img" aria-label={`Overall score ${value.toFixed(2)}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={4} />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={best ? ORANGE : 'var(--accent)'}
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={c}
        initial={false}
        animate={{ strokeDashoffset: c * (1 - value) }}
        transition={{ duration: 0.7 }}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x={size / 2} y={size / 2 + (size >= 56 ? 5 : 4)} textAnchor="middle" className="mono" fontSize={size >= 56 ? 15 : 11} fontWeight={600} fill="var(--text)">
        {value.toFixed(2)}
      </text>
    </svg>
  );
}

export function Bar({ value, tone = 'accent', className }: { value: number; tone?: 'accent' | 'pass' | 'borderline' | 'fail' | 'ink3'; className?: string }) {
  const color = tone === 'ink3' ? 'var(--text-3)' : `var(--${tone})`;
  return (
    <div className={cn('h-1.5 overflow-hidden rounded-full bg-surface2', className)}>
      <motion.div className="h-full rounded-full" style={{ background: color }} initial={false} animate={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} transition={{ duration: 0.6 }} />
    </div>
  );
}

/** Step text by mode */
export function useScientist(): boolean {
  return useUI((s) => s.mode === 'scientist');
}
