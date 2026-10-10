import { motion } from 'framer-motion';
import { Columns3, Copy, ExternalLink, MessageSquare, X } from 'lucide-react';
import { AgentBadge } from '@/components/agents/AgentBadge';
import { AgentTag, HumanAvatar } from '@/components/agents/AgentTag';
import { TypeText } from '@/components/ai/TypeText';
import { StatusPill } from '@/components/ui/Pill';
import { Button } from '@/components/ui/Button';
import { openAskAgent } from '@/store/ask';
import type { AgentId } from '@/agents/registry';
import type { Status } from '@/types';
import { cn } from '@/lib/cn';
import { fmt } from './traces/colorscales';
import { middleEllipsis } from './traces/labels';
import type { Dataset, GTrial, Parameter, ResultDef, Suggestion } from './types';

export function resultStatus(v: number | null, r: ResultDef): Status {
  if (v === null || v === undefined) return 'pending';
  if (r.target === undefined) return 'pass';
  const t = r.target;
  if (r.direction === 'target') {
    const tol = r.tolerance ?? Math.abs(t) * 0.1;
    const d = Math.abs(v - t);
    return d <= tol ? 'pass' : d <= tol * 1.25 ? 'borderline' : 'fail';
  }
  const ok = r.direction === 'maximize' ? v >= t : v <= t;
  if (ok) return 'pass';
  const gap = Math.abs(v - t) / (Math.abs(t) || 1);
  return gap <= 0.1 ? 'borderline' : 'fail';
}

function ParamBars({ params, values, compare: refVals, ds, compareLabel }: { params: Parameter[]; values: Record<string, number>; compare?: Record<string, number>; ds: Dataset; compareLabel?: string }) {
  return (
    <div className="space-y-1">
      {params.map((p) => {
        const vals = ds.trials.map((t) => t.params[p.id]);
        const lo = Math.min(...vals, p.min);
        const hi = Math.max(...vals, p.max);
        const v = values[p.id] ?? 0;
        const d = refVals ? v - (refVals[p.id] ?? 0) : 0;
        const changed = refVals && Math.abs(d) > 0.005 * (hi - lo || 1);
        return (
          <div key={p.id} className={cn('grid grid-cols-[1fr_auto] items-center gap-x-2 rounded px-1 py-0.5 text-[11px]', changed && (d > 0 ? 'bg-[var(--pass-soft)]' : 'bg-[var(--fail-soft)]'))} title={p.name}>
            <span className="truncate text-ink2">{middleEllipsis(p.name, 30)}</span>
            <span className="mono text-ink">
              {fmt(v)}
              {changed && (
                <span className={cn('ml-1', d > 0 ? 'text-pass' : 'text-fail')} title={`vs ${compareLabel}`}>
                  {d > 0 ? '+' : ''}
                  {fmt(d)}
                </span>
              )}
            </span>
            <span className="col-span-2 h-1 overflow-hidden rounded bg-surface2">
              <span className="block h-full rounded bg-accent/60" style={{ width: `${((v - lo) / (hi - lo || 1)) * 100}%` }} />
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Shell({ title, onClose, children, tabs }: { title: React.ReactNode; onClose: () => void; children: React.ReactNode; tabs?: React.ReactNode }) {
  return (
    <motion.aside initial={{ x: 380, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 380, opacity: 0 }} transition={{ duration: 0.22 }} className="absolute bottom-0 right-0 top-0 z-30 flex w-[360px] max-w-full flex-col border-l border-line bg-surface shadow-pop">
      <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
        <div className="min-w-0 flex-1 text-sm font-semibold">{title}</div>
        <button onClick={onClose} className="rounded p-1 text-ink3 hover:bg-surface2 hover:text-ink" aria-label="Close drawer">
          <X size={15} />
        </button>
      </div>
      {tabs}
      <div className="scroll-thin flex-1 overflow-auto p-3">{children}</div>
    </motion.aside>
  );
}

/** Pinned trial: parameters vs Best, results with pass/borderline/fail, actions. Tabs between up to 4 pins. */
export function TrialDrawer({ ds, trial, best, pinned, onTab, onUnpin, onClose, onDuplicate, onOpenInTrials, onCompare, readOnly }: { ds: Dataset; trial: GTrial; best?: GTrial; pinned: GTrial[]; onTab: (id: string) => void; onUnpin: (id: string) => void; onClose: () => void; onDuplicate: () => void; onOpenInTrials?: () => void; onCompare: () => void; readOnly?: boolean }) {
  return (
    <Shell
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          {trial.name} <span className="mono text-2xs font-normal text-ink3">{trial.label}</span>
          {trial.id === best?.id && <span className="rounded bg-[#F59E0B] px-1 text-[10px] text-[#0E1116]">★ Best</span>}
        </span>
      }
      tabs={
        pinned.length > 1 && (
          <div role="tablist" className="flex gap-1 border-b border-line px-2 py-1.5">
            {pinned.map((p) => (
              <span key={p.id} className={cn('flex items-center rounded-md text-xs', p.id === trial.id ? 'bg-accent-soft text-accent' : 'text-ink2 hover:bg-surface2')}>
                <button role="tab" aria-selected={p.id === trial.id} onClick={() => onTab(p.id)} className="mono px-2 py-0.5">
                  {p.label}
                </button>
                <button onClick={() => onUnpin(p.id)} className="pr-1 opacity-60 hover:opacity-100" aria-label={`Unpin ${p.label}`}>
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )
      }
    >
      <div className="mb-3 flex items-center gap-2 text-2xs text-ink3">
        Iteration {trial.iteration} ·{' '}
        {trial.createdBy.kind === 'agent' ? <AgentTag id={trial.createdBy.id as AgentId} placement="trial-drawer" title={false} className="text-2xs" /> : <span className="flex items-center gap-1"><HumanAvatar name={trial.createdBy.id} size={14} /> {trial.createdBy.id}</span>}
        · {new Date(trial.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
      </div>
      <div className="label mb-1">Results</div>
      <table className="mb-4 w-full text-xs">
        <tbody>
          {ds.results.map((r) => (
            <tr key={r.id} className="border-b border-line last:border-0">
              <td className="py-1 text-ink2">{r.name}</td>
              <td className="mono py-1 text-right">{fmt(trial.results[r.id], r.unit)}</td>
              <td className="py-1 pl-2 text-right">
                <StatusPill status={resultStatus(trial.results[r.id], r)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="label mb-1">
        Parameters <span className="font-normal normal-case text-ink3">{best && trial.id !== best.id ? `· changes vs ${best.label} highlighted` : ''}</span>
      </div>
      <ParamBars params={ds.parameters} values={trial.params} compare={best && trial.id !== best.id ? best.params : undefined} ds={ds} compareLabel={best?.label} />
      <div className="label mb-1 mt-4">Notes</div>
      <p className="text-xs text-ink3">{trial.status === 'pending' ? 'Waiting for lab results.' : trial.status === 'failed' ? 'Batch failed in the lab (phase separation). Excluded from the model.' : 'No notes yet.'}</p>
      <div className="sticky -bottom-3 -mx-3 -mb-3 mt-4 flex flex-wrap gap-1.5 border-t border-line bg-surface px-3 pb-3 pt-3">
        {onOpenInTrials && (
          <Button size="sm" onClick={onOpenInTrials}>
            <ExternalLink size={12} /> Open in Trials
          </Button>
        )}
        {!readOnly && (
          <Button size="sm" onClick={onDuplicate}>
            <Copy size={12} /> Duplicate as new trial
          </Button>
        )}
        <Button size="sm" onClick={onCompare}>
          <Columns3 size={12} /> Compare
        </Button>
        <Button size="sm" variant="ghost" onClick={() => openAskAgent('analyst', `tell me about ${trial.label}.`, [trial.label])}>
          <MessageSquare size={12} /> Ask Delta about this trial
        </Button>
      </div>
    </Shell>
  );
}

/** Q Suggestion: "Why here?" typed by Delta, diff vs Best, and the actions that turn it into a real trial. */
export function SuggestionDrawer({ ds, q, best, batch, fitting, onClose, onAdd, onRegenerate, onBatch, onPick, readOnly, nextLabel }: { ds: Dataset; q: Suggestion; best?: GTrial; batch: Suggestion[]; fitting: boolean; onClose: () => void; onAdd: () => void; onRegenerate: () => void; onBatch: () => void; onPick: (s: Suggestion) => void; readOnly?: boolean; nextLabel: string }) {
  const r = ds.results.find((x) => x.primary) ?? ds.results[0];
  const changed = ds.parameters.filter((p) => best && Math.abs((q.params[p.id] ?? 0) - (best.params[p.id] ?? 0)) > 1e-6);
  return (
    <Shell
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <span className="text-[var(--suggest)]">◇</span> {q.id === 'Q1' ? 'Q Suggestion' : q.id} <span className="font-normal text-ink3">· next trial proposed by Delta</span>
        </span>
      }
    >
      <div className="mb-3 rounded-lg border border-line bg-surface2/50 p-3">
        <div className="mb-2 flex items-center gap-2">
          <AgentBadge id="analyst" preset="console" size={44} placement="suggest-why" status={fitting ? 'working' : 'idle'} orb="composing" />
          <div>
            <div className="text-sm font-semibold">Why here?</div>
            <div className="text-2xs text-ink3">
              Delta · {q.acquisition.kind} {fmt(q.acquisition.value)}
            </div>
          </div>
        </div>
        <TypeText text={q.rationale.join(' ')} id={`why:${q.id}:${q.rationale.join('|')}`} className="text-[13px] leading-6 text-ink2" />
      </div>
      <div className="label mb-1">Predicted</div>
      <table className="mb-3 w-full text-xs">
        <tbody>
          {ds.results.map((res) => {
            const p = q.predicted[res.id];
            return (
              <tr key={res.id} className={cn('border-b border-line last:border-0', res.id === r.id && 'font-semibold')}>
                <td className="py-1 text-ink2">{res.name}</td>
                <td className="mono py-1 text-right">{p ? `${fmt(p.mean)}${p.sd !== null ? ` ± ${fmt(p.sd)}` : ''}` : '—'}</td>
                <td className="py-1 pl-2 text-right">{p && <StatusPill status={resultStatus(p.mean, res)} />}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="label mb-1">Changes vs {best?.label ?? 'Best'}</div>
      <table className="mb-3 w-full text-xs">
        <tbody>
          {changed.length === 0 && (
            <tr>
              <td className="py-1 text-ink3">Same recipe as {best?.label}.</td>
            </tr>
          )}
          {changed.map((p) => {
            const d = q.params[p.id] - (best?.params[p.id] ?? 0);
            return (
              <tr key={p.id} className="border-b border-line last:border-0">
                <td className="py-1 text-ink2" title={p.name}>
                  {middleEllipsis(p.name, 26)}
                </td>
                <td className="mono py-1 text-right text-ink3">{fmt(best?.params[p.id])}</td>
                <td className="mono py-1 text-right">→ {fmt(q.params[p.id])}</td>
                <td className={cn('mono py-1 pl-2 text-right font-semibold', d > 0 ? 'text-pass' : 'text-fail')}>
                  {d > 0 ? '+' : ''}
                  {fmt(d)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {batch.length > 1 && (
        <>
          <div className="label mb-1">Batch for the next lab run</div>
          <div className="mb-3 flex flex-wrap gap-1">
            {batch.map((b) => (
              <button key={b.id} onClick={() => onPick(b)} className={cn('mono rounded-md border px-2 py-0.5 text-xs', b.id === q.id ? 'border-[var(--suggest)] text-[var(--suggest)]' : 'border-line text-ink2 hover:border-ink3')}>
                {b.id} · {fmt(b.predicted[r.id]?.mean)}
              </button>
            ))}
          </div>
        </>
      )}
      <div className="sticky -bottom-3 -mx-3 -mb-3 flex flex-wrap gap-1.5 border-t border-line bg-surface px-3 pb-3 pt-3">
        {!readOnly && (
          <Button size="sm" variant="primary" onClick={onAdd}>
            Add as Trial {nextLabel}
          </Button>
        )}
        <Button size="sm" onClick={onRegenerate} disabled={fitting}>
          Regenerate
        </Button>
        <Button size="sm" onClick={onBatch} disabled={fitting}>
          Batch suggest (5)
        </Button>
        <Button size="sm" variant="ghost" onClick={() => openAskAgent('analyst', `why did you suggest ${q.id} here?`, [q.id])}>
          <MessageSquare size={12} /> Ask Delta
        </Button>
      </div>
    </Shell>
  );
}

/** Lasso a cluster in the PCA map → the parameters whose mean differs most from the rest, typed by Delta. */
export function TraitsDrawer({ ds, ids, onClose }: { ds: Dataset; ids: string[]; onClose: () => void }) {
  const inSet = ds.trials.filter((t) => ids.includes(t.id));
  const rest = ds.trials.filter((t) => !ids.includes(t.id));
  const traits = ds.parameters
    .map((p) => {
      const all = ds.trials.map((t) => t.params[p.id]);
      const m = all.reduce((a, b) => a + b, 0) / all.length;
      const sd = Math.sqrt(all.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, all.length - 1)) || 1;
      const mi = inSet.reduce((a, t) => a + t.params[p.id], 0) / (inSet.length || 1);
      const mr = rest.reduce((a, t) => a + t.params[p.id], 0) / (rest.length || 1);
      return { p, mi, mr, z: (mi - mr) / sd };
    })
    .sort((a, b) => Math.abs(b.z) - Math.abs(a.z))
    .slice(0, 5);
  const text = `These ${inSet.length} recipes (${inSet.map((t) => t.label).join(', ')}) share ${traits
    .slice(0, 3)
    .map((t) => `${t.z > 0 ? 'more' : 'less'} ${t.p.name.split(' (')[0]} (${fmt(t.mi)} vs ${fmt(t.mr)})`)
    .join(', ')}.`;
  return (
    <Shell onClose={onClose} title="Common traits">
      <div className="mb-3 flex items-start gap-2">
        <AgentBadge id="analyst" preset="compact" placement="traits" status="idle" />
        <TypeText text={text} id={`traits:${ids.join(',')}`} className="text-[13px] leading-6 text-ink2" />
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="th">Parameter</th>
            <th className="th text-right">Selected</th>
            <th className="th text-right">Rest</th>
          </tr>
        </thead>
        <tbody>
          {traits.map((t) => (
            <tr key={t.p.id}>
              <td className="td" title={t.p.name}>
                {middleEllipsis(t.p.name, 24)}
              </td>
              <td className={cn('td mono text-right', t.z > 0 ? 'text-pass' : 'text-fail')}>{fmt(t.mi)}</td>
              <td className="td mono text-right text-ink3">{fmt(t.mr)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Shell>
  );
}
