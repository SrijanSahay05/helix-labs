import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Plus, RotateCcw, Trash2, XCircle } from 'lucide-react';
import { useState } from 'react';
import type { AIMeta, Operator, Priority, PropertyGroup, TargetRow } from '@/types';
import { GROUP_LABEL, GROUP_ORDER, GROUP_PLAIN, PROP, PROPERTIES } from '@/data/properties';
import { AIChip, useFillPhase } from '@/components/ai/AIField';
import { checkTargetVsStandard, errorLabel } from '@/lib/validate';
import { OP_LABEL } from '@/lib/format';
import { cn } from '@/lib/cn';
import { COPY } from '@/data/copy';
import type { Mode } from '@/types';
import { Popover, Toggle } from '@/components/ui/primitives';
import { HelixOrb } from '@/components/ai/HelixOrb';
import { AgentBot } from '@/components/agents/AgentBot';

const PRIORITIES: Priority[] = ['must', 'important', 'nice'];

function MiniSlider({ row }: { row: TargetRow }) {
  const v = Array.isArray(row.value) ? row.value : [row.value, row.value];
  const bench = typeof row.benchmarkValue === 'number' ? row.benchmarkValue : undefined;
  const std = row.standardMin ?? row.standardMax;
  const pts = [v[0], v[1], bench, std].filter((x): x is number => typeof x === 'number' && Number.isFinite(x));
  if (!pts.length) return null;
  let lo = Math.min(...pts);
  let hi = Math.max(...pts);
  const pad = (hi - lo || Math.abs(hi) || 1) * 0.4;
  lo -= pad;
  hi += pad;
  const x = (n: number) => `${((n - lo) / (hi - lo)) * 100}%`;
  return (
    <div className="relative h-4 w-24" title="Target handle · Std limit (grey) · Benchmark (dashed)">
      <div className="absolute top-1/2 h-px w-full bg-line" />
      {row.operator === 'between' ? (
        <div className="absolute top-[6px] h-1 rounded bg-accent" style={{ left: x(v[0]), width: `calc(${x(v[1])} - ${x(v[0])})` }} />
      ) : (
        <div className="absolute top-[6px] h-1 rounded bg-accent/40" style={row.operator === '>=' ? { left: x(v[0]), right: 0 } : { left: 0, width: x(v[0]) }} />
      )}
      {std !== undefined && <div className="absolute top-0 h-4 w-px bg-ink3" style={{ left: x(std) }} />}
      {bench !== undefined && <div className="absolute top-0 h-4 w-px border-l border-dashed border-borderline" style={{ left: x(bench) }} />}
      <div className="absolute top-[3px] h-2.5 w-2.5 -translate-x-1/2 rounded-full border-2 border-accent bg-surface" style={{ left: x(v[0]) }} />
    </div>
  );
}

function Row({
  row,
  i,
  mode,
  showTech,
  readOnly,
  pathPrefix,
  meta,
  onChange,
  onRemove,
  onReset,
}: {
  row: TargetRow;
  i: number;
  mode: Mode;
  showTech: boolean;
  readOnly?: boolean;
  pathPrefix: string;
  meta: AIMeta;
  onChange: (r: TargetRow) => void;
  onRemove: () => void;
  onReset?: () => void;
}) {
  const p = PROP[row.propertyId];
  const path = `${pathPrefix}.${i}`;
  const [phase] = useFillPhase(path);
  const err = checkTargetVsStandard(row);
  const low = meta.by === 'helix' && (meta.confidence ?? 1) < 0.7;
  const setVal = (k: 0 | 1, n: number) => {
    if (row.operator === 'between') {
      const v = Array.isArray(row.value) ? [...row.value] : [row.value, row.value];
      v[k] = n;
      onChange({ ...row, value: v as [number, number] });
    } else onChange({ ...row, value: n });
  };
  const v = Array.isArray(row.value) ? row.value : [row.value, row.value];
  return (
    <motion.tr
      layout
      data-ai-path={path}
      data-lowconf={low ? 'true' : undefined}
      className={cn('group', phase === 'filling' && 'ai-shimmer bg-accent-soft', phase === 'fresh' && 'ai-fresh', err && 'bg-[var(--fail-soft)]')}
    >
      <td className="td">
        <div className="flex items-center gap-2">
          <span className={cn('font-medium', low && 'border-b border-dashed border-borderline')}>{mode === 'scientist' ? p?.name : p?.plainName}</span>
          {mode === 'non-scientist' && showTech && <span className="text-2xs text-ink3">{p?.name}</span>}
        </div>
        {err && (
          <div className="mt-0.5 flex items-center gap-1 text-2xs font-semibold text-fail">
            <AgentBot id="targets" preset="micro" placement={`tgt-err-${row.propertyId}`} size={14} /> <XCircle size={11} /> {errorLabel(err)}
          </div>
        )}
        {low && !err && <div className="text-2xs font-medium text-borderline">Low confidence — please check</div>}
      </td>
      {(mode === 'scientist' || showTech) && (
        <td className="td py-1.5 w-[110px]">
          <select disabled={readOnly} className="h-8 w-full bg-transparent text-xs outline-none hover:bg-secondary focus:bg-surface focus:shadow-glow rounded px-1" value={row.operator} onChange={(e) => onChange({ ...row, operator: e.target.value as Operator, value: e.target.value === 'between' ? [v[0], v[1] === v[0] ? v[0] * 1.2 : v[1]] : v[0] })}>
            {(Object.keys(OP_LABEL) as Operator[]).map((o) => (
              <option key={o} value={o}>
                {OP_LABEL[o]}
              </option>
            ))}
          </select>
        </td>
      )}
      <td className="td py-1.5 w-[160px]">
        <div className="flex items-center gap-1">
          {mode === 'non-scientist' && !showTech && <span className="w-4 text-xs text-ink3">{OP_LABEL[row.operator] === 'between' ? '' : OP_LABEL[row.operator]}</span>}
          <input disabled={readOnly} type="number" step="any" className={cn('h-8 w-[64px] bg-transparent px-2 text-right text-xs mono rounded outline-none transition-colors hover:bg-secondary focus:bg-surface focus:shadow-glow', err && 'ring-1 ring-fail')} value={v[0]} onChange={(e) => setVal(0, Number(e.target.value))} />
          {row.operator === 'between' && (
            <>
              <span className="text-ink3">–</span>
              <input disabled={readOnly} type="number" step="any" className="h-8 w-[64px] bg-transparent px-2 text-right text-xs mono rounded outline-none transition-colors hover:bg-secondary focus:bg-surface focus:shadow-glow" value={v[1]} onChange={(e) => setVal(1, Number(e.target.value))} />
            </>
          )}
        </div>
      </td>
      <td className="td py-1.5 w-[80px] text-xs text-ink3">{p?.unit}</td>
      {(mode === 'scientist' || showTech) && (
        <>
          <td className="td py-1.5 mono w-[110px] text-xs text-ink2">{row.testMethod}</td>
          <td className="td py-1.5 mono w-[90px] text-xs text-ink2">{row.standardLimit ?? '—'}</td>
          <td className="td py-1.5 mono w-[90px] text-right text-xs text-ink2">{row.benchmarkValue ?? '—'}</td>
          <td className="td py-1.5 w-[110px]">
            <MiniSlider row={row} />
          </td>
        </>
      )}
      <td className="td py-1.5 w-[130px]">
        {mode === 'scientist' ? (
          <select disabled={readOnly} className="h-8 w-full bg-transparent px-2 text-xs capitalize outline-none hover:bg-secondary focus:bg-surface focus:shadow-glow rounded" value={row.priority} onChange={(e) => onChange({ ...row, priority: e.target.value as Priority })}>
            {PRIORITIES.map((pr) => (
              <option key={pr} value={pr}>
                {COPY[`priority.${pr}` as const].scientist}
              </option>
            ))}
          </select>
        ) : (
          <div className="flex gap-1">
            {PRIORITIES.map((pr) => (
              <button
                key={pr}
                disabled={readOnly}
                onClick={() => onChange({ ...row, priority: pr })}
                className={cn('h-7 flex-1 whitespace-nowrap rounded-full border px-1.5 text-[10.5px] font-medium', row.priority === pr ? (pr === 'must' ? 'border-accent bg-accent text-on-accent' : 'border-accent bg-accent-soft text-accent') : 'border-line text-ink2 hover:border-ink3 hover:text-ink')}
              >
                {COPY[`priority.${pr}` as const]['non-scientist']}
              </button>
            ))}
          </div>
        )}
      </td>
      <td className="td py-1.5 w-[140px]">
        <div className="flex items-center justify-end gap-2">
          <AIChip meta={meta} label={p?.name} path="targets" />
          {!readOnly && (
            <span className="flex opacity-0 transition-opacity group-hover:opacity-100">
              {onReset && meta.by === 'user' && (
                <button title="Reset to Helix suggestion" onClick={onReset} className="rounded p-1 text-ink3 hover:bg-surface2 hover:text-accent">
                  <RotateCcw size={14} />
                </button>
              )}
              <button title="Remove" onClick={onRemove} className="rounded p-1 text-ink3 hover:bg-surface2 hover:text-fail">
                <Trash2 size={14} />
              </button>
            </span>
          )}
        </div>
      </td>
    </motion.tr>
  );
}

export function TargetsTable({
  rows,
  mode,
  pathPrefix = 'targets',
  readOnly,
  onChange,
  onRemove,
  onAdd,
  onReset,
  pendingCount = 0,
}: {
  rows: TargetRow[];
  pendingCount?: number;
  mode: Mode;
  pathPrefix?: string;
  readOnly?: boolean;
  onChange: (i: number, r: TargetRow) => void;
  onRemove: (i: number) => void;
  onAdd: (propertyId: string) => void;
  onReset?: (i: number) => void;
}) {
  const [showTech, setShowTech] = useState(false);
  const [closed, setClosed] = useState<Set<PropertyGroup>>(new Set());
  const tech = mode === 'scientist' || showTech;
  const cols = tech ? 10 : 5;
  const present = new Set(rows.map((r) => r.propertyId));
  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        <span className="text-xs text-ink2">
          {rows.length} targets · {rows.filter((r) => r.priority === 'must').length} must-haves
        </span>
        <div className="flex items-center gap-3">
          {mode === 'non-scientist' && <Toggle checked={showTech} onChange={setShowTech} label={<span className="text-xs">Show technical details</span>} />}
          {!readOnly && (
            <Popover
              align="right"
              width={320}
              trigger={() => (
                <button className="flex h-7 items-center gap-1 rounded-md border border-line px-2 text-xs text-ink2 hover:text-ink">
                  <Plus size={12} /> Add property
                </button>
              )}
            >
              {(close) => (
                <div className="scroll-thin max-h-72 overflow-auto">
                  {GROUP_ORDER.map((g) => (
                    <div key={g} className="mb-2">
                      <div className="label mb-1">{GROUP_LABEL[g]}</div>
                      {PROPERTIES.filter((p) => p.group === g && !present.has(p.id) && p.id !== 'cost').map((p) => (
                        <button key={p.id} onClick={() => (onAdd(p.id), close())} className="block w-full rounded px-1.5 py-1 text-left text-xs hover:bg-surface2">
                          {mode === 'scientist' ? p.name : p.plainName} <span className="text-ink3">· {p.unit}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </Popover>
          )}
        </div>
      </div>
      <div className="scroll-thin overflow-x-auto">
      <table className="w-full min-w-[920px]">
        <thead>
          <tr>
            <th className="th">{COPY['col.target'][mode]}</th>
            {tech && <th className="th">Operator</th>}
            <th className="th">Value</th>
            <th className="th">Unit</th>
            {tech && (
              <>
                <th className="th">Test method</th>
                <th className="th">Std limit</th>
                <th className="th text-right">Benchmark</th>
                <th className="th">Range</th>
              </>
            )}
            <th className="th">{COPY['col.priority'][mode]}</th>
            <th className="th" />
          </tr>
        </thead>
        {GROUP_ORDER.map((g, gi) => {
          const idx = rows.map((r, i) => ({ r, i })).filter(({ r }) => PROP[r.propertyId]?.group === g);
          if (!idx.length) return null;
          const isClosed = closed.has(g);
          return (
            <tbody key={g}>
              <tr>
                <td colSpan={cols} className="border-b border-line bg-surface2/60 px-2.5 py-1">
                  <button
                    onClick={() => setClosed((s) => {
                      const n = new Set(s);
                      if (n.has(g)) n.delete(g);
                      else n.add(g);
                      return n;
                    })}
                    className="flex items-center gap-1.5 text-xs font-semibold text-ink"
                  >
                    <ChevronDown size={13} className={cn('transition-transform', isClosed && '-rotate-90')} />
                    {gi + 1}. {mode === 'scientist' ? GROUP_LABEL[g] : GROUP_PLAIN[g]}
                    <span className="font-normal text-ink3">· {idx.length}</span>
                  </button>
                </td>
              </tr>
              <AnimatePresence initial={false}>
                {!isClosed &&
                  idx.map(({ r, i }) => (
                    <Row
                      key={r.propertyId}
                      row={r}
                      i={i}
                      mode={mode}
                      showTech={showTech}
                      readOnly={readOnly}
                      pathPrefix={pathPrefix}
                      meta={r.meta}
                      onChange={(nr) => onChange(i, nr)}
                      onRemove={() => onRemove(i)}
                      onReset={onReset ? () => onReset(i) : undefined}
                    />
                  ))}
              </AnimatePresence>
            </tbody>
          );
        })}
        {pendingCount > 0 && (
          <tbody>
            {Array.from({ length: pendingCount }, (_, k) => (
              <tr key={`pending-${k}`} data-ai-path={`${pathPrefix}.${rows.length + k}`}>
                <td colSpan={cols} className="td">
                  <div className="flex items-center gap-2">
                    {k === 0 ? <HelixOrb state="listening" size={20} /> : <span className="w-5" />}
                    <div className="skeleton h-3" style={{ width: `${70 - (k % 4) * 10}%` }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        )}
      </table>
      </div>
    </div>
  );
}
