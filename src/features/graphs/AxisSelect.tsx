import { Command } from 'cmdk';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { AgentBot } from '@/components/agents/AgentBot';
import { cn } from '@/lib/cn';
import { fmt } from './traces/colorscales';
import { middleEllipsis } from './traces/labels';

export interface AxisOption {
  id: string;
  name: string;
  unit: string;
  group: 'Parameters' | 'Results' | 'Constant' | 'Trials' | 'Suggestions';
  values: number[];
  /** reason it can't be picked, e.g. "Already on Y" */
  disabled?: string;
}

function Sparkline({ values }: { values: number[] }) {
  const bins = 10;
  const f = values.filter(Number.isFinite);
  if (f.length < 2) return <span className="w-10" />;
  const lo = Math.min(...f);
  const hi = Math.max(...f);
  const counts = new Array(bins).fill(0);
  f.forEach((v) => counts[Math.min(bins - 1, Math.floor(((v - lo) / (hi - lo || 1)) * bins))]++);
  const max = Math.max(...counts);
  return (
    <svg width="40" height="14" viewBox="0 0 40 14" aria-hidden className="shrink-0">
      {counts.map((c, i) => (
        <rect key={i} x={i * 4} y={14 - (c / max) * 13} width={3} height={(c / max) * 13} rx={0.5} fill="var(--accent)" opacity={0.5} />
      ))}
    </svg>
  );
}

/** "Prefixed select": grey label cell joined to a searchable value cell (cmdk) with sparklines and ranges. */
export function AxisSelect({
  label,
  value,
  options,
  onChange,
  picked,
  open: openProp,
  onOpenChange,
  allowNone,
}: {
  label: string;
  value?: string | null;
  options: AxisOption[];
  onChange: (id: string | null) => void;
  picked?: boolean;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
  allowNone?: boolean;
}) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = (o: boolean) => (onOpenChange ? onOpenChange(o) : setOpenState(o));
  const [showConst, setShowConst] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listId = useId();
  const cur = options.find((o) => o.id === value);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const groups = useMemo(() => (['Suggestions', 'Trials', 'Parameters', 'Results', 'Constant'] as const).map((g) => ({ g, items: options.filter((o) => o.group === g) })).filter((x) => x.items.length), [options]);
  const text = cur ? cur.name : allowNone ? 'None' : '—';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${label}: ${cur?.name ?? 'none'}`}
        title={cur ? `${cur.name}${cur.unit ? ` (${cur.unit})` : ''}` : undefined}
        onClick={() => setOpen(!open)}
        className="group flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface/80 px-3 text-xs shadow-sm transition-colors hover:border-ink3 hover:bg-surface"
      >
        <span className="text-[10px] font-semibold uppercase tracking-wider text-ink3 group-hover:text-ink2">{label}:</span>
        <span className="min-w-[40px] max-w-[160px] truncate font-medium text-ink text-left">{middleEllipsis(text, 30)}</span>
        {picked && (
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent" title="✦ Picked by Delta" aria-label="Picked by Delta">
            <AgentBot id="analyst" preset="micro" placement="axis-pick" size={12} />
          </span>
        )}
        <ChevronDown size={14} className={cn('ml-0.5 shrink-0 text-ink3 transition-transform group-hover:text-ink2', open && 'rotate-180')} />
      </button>
      {open && (
        <Command id={listId} className="absolute left-0 top-full z-40 mt-1 w-[360px] overflow-hidden rounded-lg border border-line bg-surface shadow-pop" label={`${label} options`}>
          <Command.Input autoFocus placeholder="Search parameters and results…" className="w-full border-b border-line bg-transparent px-3 py-2 text-sm outline-none placeholder:text-ink3" onKeyDown={(e) => e.key === 'Escape' && setOpen(false)} />
          <Command.List className="scroll-thin max-h-[320px] overflow-auto p-1">
            <Command.Empty className="px-3 py-4 text-center text-xs text-ink3">No match</Command.Empty>
            {allowNone && (
              <Command.Item value="none" onSelect={() => (onChange(null), setOpen(false))} className="flex cursor-pointer items-center rounded px-2 py-1.5 text-xs text-ink2 data-[selected=true]:bg-surface2">
                None
              </Command.Item>
            )}
            {groups.map(({ g, items }) => (
              <Command.Group
                key={g}
                heading={
                  g === 'Constant' ? (
                    <button type="button" onClick={() => setShowConst((s) => !s)} className="flex items-center gap-1">
                      <ChevronRight size={11} className={cn('transition-transform', showConst && 'rotate-90')} /> Constant ({items.length})
                    </button>
                  ) : (
                    g
                  )
                }
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-ink3"
              >
                {(g !== 'Constant' || showConst) &&
                  items.map((o) => {
                    const f = o.values.filter(Number.isFinite);
                    const dis = g === 'Constant' ? 'Constant — not selectable' : o.disabled;
                    return (
                      <Command.Item
                        key={o.id}
                        value={`${o.name} ${o.unit} ${o.id}`}
                        disabled={!!dis}
                        onSelect={() => {
                          onChange(o.id);
                          setOpen(false);
                        }}
                        title={dis ?? o.name}
                        className={cn('flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs data-[selected=true]:bg-surface2', o.id === value && 'font-semibold text-accent', dis && 'cursor-not-allowed opacity-45')}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">{middleEllipsis(o.name, 36)}</span>
                          <span className="mono block text-[10px] text-ink3">
                            {o.unit && `${o.unit}${f.length || o.group !== 'Trials' ? ' · ' : ''}`}
                            {f.length ? `${fmt(Math.min(...f))} – ${fmt(Math.max(...f))}` : o.group === 'Trials' || o.group === 'Suggestions' ? '' : 'no data'}
                            {dis && ` · ${dis}`}
                          </span>
                        </span>
                        <Sparkline values={o.values} />
                      </Command.Item>
                    );
                  })}
              </Command.Group>
            ))}
          </Command.List>
        </Command>
      )}
    </div>
  );
}
