import { ChevronDown, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import type { Dataset, Parameter } from './types';
import { fmt } from './traces/colorscales';
import { middleEllipsis } from './traces/labels';

/** SLICE: every other varying parameter held at a value (default: the Best trial's). Dragging previews at a coarser grid. */
export function SliceControl({
  params,
  ds,
  bestId,
  slice,
  onChange,
  onDrag,
}: {
  params: Parameter[];
  ds: Dataset;
  bestId?: string;
  slice: Record<string, number>;
  onChange: (s: Record<string, number>) => void;
  onDrag: (dragging: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, number>>({});
  const ref = useRef<HTMLDivElement>(null);
  const best = ds.trials.find((t) => t.id === bestId) ?? ds.trials[0];
  const val = (id: string) => draft[id] ?? slice[id] ?? best?.params[id] ?? 0;
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  const first = params[0];
  const custom = params.filter((p) => slice[p.id] !== undefined && Math.abs(slice[p.id] - (best?.params[p.id] ?? 0)) > 1e-9).length;
  const median = (id: string) => {
    const v = ds.trials.map((t) => t.params[id]).sort((a, b) => a - b);
    return v[Math.floor(v.length / 2)];
  };
  // live preview while dragging (30×30), full grid on release
  const commitTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const live = (id: string, v: number) => {
    setDraft((d) => ({ ...d, [id]: v }));
    onDrag(true);
    clearTimeout(commitTimer.current);
    commitTimer.current = setTimeout(() => onChange({ ...slice, ...draft, [id]: v }), 120);
  };
  const release = () => {
    clearTimeout(commitTimer.current);
    onChange({ ...slice, ...draft });
    setDraft({});
    onDrag(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="group flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface/80 px-3 text-xs shadow-sm transition-colors hover:border-ink3 hover:bg-surface"
        title="Other parameters held constant"
      >
        <span className="text-[10px] font-semibold uppercase tracking-wider text-ink3 group-hover:text-ink2">Slice:</span>
        <span className="min-w-[40px] max-w-[200px] truncate text-left font-medium text-ink">
          {first ? `${middleEllipsis(first.name, 20)} = ${fmt(val(first.id))}` : 'Nothing to hold'}
        </span>
        {params.length > 1 && <span className="shrink-0 text-[10px] text-ink3">+{params.length - 1}</span>}
        {custom > 0 && (
          <span className="shrink-0 rounded bg-accent-soft px-1 text-[10px] font-semibold text-accent">{custom} changed</span>
        )}
        <ChevronDown size={14} className={cn('ml-0.5 shrink-0 text-ink3 transition-transform group-hover:text-ink2', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-40 mt-1 w-[380px] rounded-lg border border-line bg-surface p-3 shadow-pop">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs font-semibold">Held constant</span>
            <span className="text-2xs text-ink3">default: {best?.label ?? 'best'}</span>
            <button onClick={() => onChange(Object.fromEntries(params.map((p) => [p.id, best?.params[p.id] ?? 0])))} className="ml-auto flex items-center gap-1 rounded px-1.5 py-0.5 text-2xs text-accent hover:bg-accent-soft">
              <RotateCcw size={10} /> All to Best
            </button>
            <button onClick={() => onChange(Object.fromEntries(params.map((p) => [p.id, median(p.id)])))} className="rounded px-1.5 py-0.5 text-2xs text-accent hover:bg-accent-soft">
              All to median
            </button>
          </div>
          <div className="scroll-thin max-h-[320px] space-y-2 overflow-auto pr-1">
            {params.map((p) => {
              const vals = ds.trials.map((t) => t.params[p.id]);
              const lo = Math.min(...vals);
              const hi = Math.max(...vals);
              return (
                <label key={p.id} className="block text-xs" title={p.name}>
                  <span className="flex justify-between gap-2">
                    <span className="truncate text-ink2">{middleEllipsis(p.name, 34)}</span>
                    <span className="mono text-ink">
                      {fmt(val(p.id))} {p.unit === '% w/w' ? '%' : p.unit}
                    </span>
                  </span>
                  <input type="range" min={lo} max={hi} step={(hi - lo) / 100 || 0.01} value={val(p.id)} onChange={(e) => live(p.id, Number(e.target.value))} onPointerUp={release} onKeyUp={release} className="w-full accent-[var(--accent)]" aria-label={p.name} />
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
