import { BarChart3, ChevronDown, CircleDot, Gauge, Grid3x3, Layers, LineChart, Network, PieChart, ScatterChart, Target, Triangle, TrendingUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import type { ViewId } from './types';

export const PRIMARY: { id: ViewId; label: string }[] = [
  { id: 'parallel', label: 'Parallel' },
  { id: '2d', label: '2D Scatter' },
  { id: '3d', label: '3D Scatter' },
  { id: 'surface', label: 'Surface' },
  { id: 'contour', label: 'Contour' },
];

export const MORE: { group: string; items: { id: ViewId; label: string; desc: string; icon: typeof ScatterChart }[] }[] = [
  {
    group: 'Compare',
    items: [
      { id: 'bar', label: 'Bar chart', desc: 'One bar per trial for any result or parameter', icon: BarChart3 },
      { id: 'pie', label: 'Pie · recipe composition', desc: 'Ingredient shares (% w/w), trial vs Q', icon: PieChart },
    ],
  },
  {
    group: 'Explore',
    items: [
      { id: 'bubble', label: 'Bubble scatter', desc: 'Two results plus bubble size for a third', icon: CircleDot },
      { id: 'splom', label: 'Scatter matrix', desc: 'Every pair of 3–6 dimensions at once', icon: Grid3x3 },
    ],
  },
  {
    group: 'Optimise',
    items: [
      { id: 'pareto', label: 'Pareto front', desc: 'Trade-off between two results', icon: Target },
      { id: 'progress', label: 'Optimisation progress', desc: 'Running best by trial — are we converging?', icon: TrendingUp },
    ],
  },
  {
    group: 'Composition',
    items: [
      { id: 'ternary', label: 'Ternary composition', desc: 'Three ingredients, renormalised', icon: Triangle },
      { id: 'pca', label: 'Similarity map (PCA)', desc: 'Cluster similar recipes', icon: Network },
    ],
  },
  {
    group: 'Model',
    items: [{ id: 'parity', label: 'Predicted vs actual', desc: 'Can I trust the model? (LOO)', icon: Gauge }],
  },
];

export const MODEL_VIEWS: ViewId[] = ['surface', 'contour', 'parity', 'pca', 'pareto'];
export const VIEW_LABEL: Record<ViewId, string> = Object.fromEntries([...PRIMARY.map((p) => [p.id, p.label]), ...MORE.flatMap((g) => g.items.map((i) => [i.id, i.label]))]) as Record<ViewId, string>;
export const VIEW_ICON: Partial<Record<ViewId, typeof ScatterChart>> = { parallel: LineChart, '2d': ScatterChart, '3d': Layers };

/** Segmented control (role=tablist): the five reference views, then "More ▾" grouped by purpose. */
export function ViewSwitcher({ view, onChange, disabled, onPrefetch, moreOpen, setMoreOpen }: { view: ViewId; onChange: (v: ViewId) => void; disabled: (v: ViewId) => string | undefined; onPrefetch?: (v: ViewId) => void; moreOpen: boolean; setMoreOpen: (o: boolean) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [focus, setFocus] = useState(0);
  const inMore = !PRIMARY.some((p) => p.id === view);
  useEffect(() => {
    if (!moreOpen) return;
    const h = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setMoreOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [moreOpen, setMoreOpen]);
  return (
    <div ref={ref} className="relative">
      <div role="tablist" aria-label="Graph view" className="scroll-thin flex max-w-full overflow-x-auto rounded-lg bg-surface2 p-1">
        {PRIMARY.map((p, i) => {
          const dis = disabled(p.id);
          return (
            <button
              key={p.id}
              role="tab"
              aria-selected={view === p.id}
              aria-disabled={!!dis}
              tabIndex={focus === i ? 0 : -1}
              title={dis ?? `${p.label} (${i + 1})`}
              onMouseEnter={() => onPrefetch?.(p.id)}
              onFocus={() => setFocus(i)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                  const n = (i + (e.key === 'ArrowRight' ? 1 : PRIMARY.length - 1)) % PRIMARY.length;
                  (e.currentTarget.parentElement?.children[n] as HTMLElement)?.focus();
                }
              }}
              onClick={() => !dis && onChange(p.id)}
              className={cn('h-8 whitespace-nowrap rounded-md px-3 text-xs font-medium transition-colors', view === p.id ? 'bg-surface text-ink shadow-card' : 'text-ink2 hover:text-ink', dis && 'cursor-not-allowed opacity-40')}
            >
              {p.label}
            </button>
          );
        })}
        <button
          role="tab"
          aria-selected={inMore}
          aria-haspopup="menu"
          aria-expanded={moreOpen}
          title="More views (M)"
          onClick={() => setMoreOpen(!moreOpen)}
          className={cn('flex h-8 items-center gap-1 whitespace-nowrap rounded-md px-3 text-xs font-medium', inMore ? 'bg-surface text-ink shadow-card' : 'text-ink2 hover:text-ink')}
        >
          {inMore && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
          {inMore ? VIEW_LABEL[view] : 'More'} <ChevronDown size={12} />
        </button>
      </div>
      {moreOpen && (
        <div role="menu" className="absolute right-0 top-full z-40 mt-1 w-[300px] rounded-lg border border-line bg-surface p-1 shadow-pop">
          {MORE.map((g) => (
            <div key={g.group} className="py-1">
              <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-ink3">{g.group}</div>
              {g.items.map((it) => {
                const dis = disabled(it.id);
                return (
                  <button
                    key={it.id}
                    role="menuitem"
                    disabled={!!dis}
                    title={dis}
                    onClick={() => {
                      onChange(it.id);
                      setMoreOpen(false);
                    }}
                    className={cn('flex w-full items-start gap-2.5 rounded px-2 py-1.5 text-left hover:bg-surface2 disabled:cursor-not-allowed disabled:opacity-40', view === it.id && 'bg-accent-soft')}
                  >
                    <it.icon size={15} className="mt-0.5 shrink-0 text-accent" />
                    <span>
                      <span className="block text-xs font-medium text-ink">{it.label}</span>
                      <span className="block text-[11px] leading-4 text-ink3">{dis ?? it.desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
