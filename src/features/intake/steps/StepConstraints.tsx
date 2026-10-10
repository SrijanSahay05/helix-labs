import { Plus, Trash2 } from 'lucide-react';
import { AIField } from '@/components/ai/AIField';
import { Chip } from '@/components/ui/primitives';
import { COMPLIANCE, MUST_HAVES } from '@/data/standards';
import { MAT, RAW_MATERIALS } from '@/data/rawMaterials';
import { useMode } from '@/lib/useModeText';
import { cn } from '@/lib/cn';
import type { Constraints } from '@/types';
import { acceptMeta, useDraft, userSet } from '../useDraft';
import { SCENARIO } from '@/data/scenarios';
import { checkCost } from '@/lib/validate';
import { AgentBot } from '@/components/agents/AgentBot';

const BANDS: { id: NonNullable<Constraints['budgetBand']>; label: string; sub: string; range: string }[] = [
  { id: 'economy', label: 'Economy', sub: 'Lowest price, meets the standard', range: '₹' },
  { id: 'mid', label: 'Mid', sub: 'Balanced — beats most competitors', range: '₹₹' },
  { id: 'premium', label: 'Premium', sub: 'Best performance, higher price', range: '₹₹₹' },
];

/** Constraints (brief p. 5). Owner: Atul — confirms cost ceilings, material limits and compliance rules. */
export function StepConstraints() {
  const d = useDraft();
  const mode = useMode();
  const c = d.constraints;
  const f = (k: string, label: string, display?: string) => ({ path: `constraints.${k}`, label, meta: d.meta[`constraints.${k}`], display, onAccept: () => acceptMeta(`constraints.${k}`) });
  const set = (k: keyof Constraints, v: unknown, label: string) => userSet(`constraints.${k}`, v, label);
  const toggle = (k: 'compliance' | 'mustHaves', v: string, label: string) => {
    const cur = (c[k] ?? []) as string[];
    set(k, cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v], label);
  };

  if (mode === 'non-scientist') {
    return (
      <div className="space-y-5">
        <AIField {...f('budgetBand', 'Budget band', c.budgetBand)}>
          <div className="grid gap-3 sm:grid-cols-3">
            {BANDS.map((b) => (
              <button
                key={b.id}
                data-ai-target={`constraints.budgetBand:${b.id}`}
                onClick={() => set('budgetBand', b.id, 'Budget band')}
                className={cn('rounded-xl border bg-surface p-4 text-left transition-shadow', c.budgetBand === b.id ? 'border-accent shadow-glow' : 'border-line hover:border-ink3')}
              >
                <div className="mono text-lg font-semibold text-accent">{b.range}</div>
                <div className="mt-1 text-md font-semibold">{b.label}</div>
                <div className="text-xs text-ink2">{b.sub}</div>
              </button>
            ))}
          </div>
        </AIField>
        <AIField {...f('mustHaves', 'Must-haves', (c.mustHaves ?? []).join(', '))}>
          <div className="flex flex-wrap gap-2">
            {MUST_HAVES.map((m) => (
              <Chip key={m} active={c.mustHaves?.includes(m)} onClick={() => toggle('mustHaves', m, 'Must-haves')}>
                {m}
              </Chip>
            ))}
          </div>
        </AIField>
      </div>
    );
  }

  const limits = c.materialLimits ?? [];
  const cost = c.costCeiling ?? 18;
  const cheapest = Math.min(...(SCENARIO[d.scenarioId]?.pathways.map((x) => x.costPerKg) ?? [0]));
  const over = Number.isFinite(cheapest) ? checkCost(cheapest, c.costCeiling) : null;
  return (
    <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
      <AIField {...f('costCeiling', 'Cost ceiling (raw material)', `₹ ${c.costCeiling} / kg`)} className="md:col-span-2">
        <div className="flex items-center gap-3">
          <input type="range" min={5} max={Math.max(150, cost * 2)} step={0.5} value={cost} onChange={(e) => set('costCeiling', Number(e.target.value), 'Cost ceiling')} className="flex-1 accent-[var(--accent)]" />
          <div className="relative w-28">
            <span className="absolute left-2 top-1.5 text-xs text-ink3">₹</span>
            <input type="number" className="input mono pl-5 pr-9 text-right" value={cost} onChange={(e) => set('costCeiling', Number(e.target.value), 'Cost ceiling')} />
            <span className="absolute right-2 top-1.5 text-2xs text-ink3">/ kg</span>
          </div>
        </div>
        {over && over.kind === 'cost-over-ceiling' && (
          <div role="alert" className="mt-2 flex items-center gap-2 rounded-md border border-fail/30 bg-[var(--fail-soft)] px-2.5 py-1.5 text-xs text-fail">
            <AgentBot id="sentinel" preset="compact" placement="constraints-over" size={24} status="low-confidence" />
            <span>
              <b className="font-semibold">Guard:</b> cost over ceiling — the cheapest known route is ₹ {cheapest.toFixed(2)}/kg (+{over.overPct} %). Raise the ceiling or relax a target.
            </span>
          </div>
        )}
      </AIField>

      <AIField {...f('materialLimits', 'Raw material limits')} className="md:col-span-2">
        <div className="overflow-hidden rounded-lg border border-line">
          <table className="w-full">
            <thead>
              <tr>
                <th className="th">Material</th>
                <th className="th w-32 text-right">Max % w/w</th>
                <th className="th w-24">Exclude</th>
                <th className="th w-10" />
              </tr>
            </thead>
            <tbody>
              {limits.map((l, i) => (
                <tr key={i}>
                  <td className="td">
                    <select className="input h-7 text-xs" value={l.materialId} onChange={(e) => set('materialLimits', limits.map((x, k) => (k === i ? { ...x, materialId: e.target.value } : x)), 'Material limits')}>
                      {RAW_MATERIALS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="td">
                    <input disabled={l.exclude} type="number" className="input mono h-7 text-right text-xs" value={l.maxPct ?? ''} onChange={(e) => set('materialLimits', limits.map((x, k) => (k === i ? { ...x, maxPct: Number(e.target.value) } : x)), 'Material limits')} />
                  </td>
                  <td className="td">
                    <input type="checkbox" className="accent-[var(--accent)]" checked={!!l.exclude} onChange={(e) => set('materialLimits', limits.map((x, k) => (k === i ? { ...x, exclude: e.target.checked } : x)), 'Material limits')} />
                  </td>
                  <td className="td">
                    <button onClick={() => set('materialLimits', limits.filter((_, k) => k !== i), 'Material limits')} className="text-ink3 hover:text-fail">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={() => set('materialLimits', [...limits, { materialId: RAW_MATERIALS[0].id, maxPct: 5 }], 'Material limits')} className="flex w-full items-center gap-1 px-3 py-1.5 text-xs text-ink2 hover:bg-surface2">
            <Plus size={12} /> Add limit
          </button>
        </div>
        {limits.length > 0 && <p className="mt-1 text-2xs text-ink3">{limits.map((l) => `${MAT[l.materialId]?.name}: ${l.exclude ? 'excluded' : `≤ ${l.maxPct} %`}`).join(' · ')}</p>}
      </AIField>

      <AIField {...f('compliance', 'Compliance', (c.compliance ?? []).join(', '))}>
        <div className="flex flex-wrap gap-1.5">
          {COMPLIANCE.map((x) => (
            <Chip key={x} active={c.compliance?.includes(x)} onClick={() => toggle('compliance', x, 'Compliance')}>
              {x}
            </Chip>
          ))}
        </div>
      </AIField>

      <AIField {...f('site', 'Site conditions', c.site ? `${c.site.tMin}–${c.site.tMax} °C · RH ≤ ${c.site.rhMax} %` : undefined)}>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ['tMin', 'Min °C'],
              ['tMax', 'Max °C'],
              ['rhMax', 'RH max %'],
            ] as const
          ).map(([k, lab]) => (
            <label key={k} className="text-2xs text-ink3">
              {lab}
              <input
                type="number"
                className="input mono mt-0.5 text-right"
                value={c.site?.[k] ?? ''}
                onChange={(e) => set('site', { ...(c.site ?? { tMin: 10, tMax: 40, rhMax: 90 }), [k]: Number(e.target.value) }, 'Site conditions')}
              />
            </label>
          ))}
        </div>
      </AIField>

      <AIField {...f('remark', 'Remark (general constraints)', c.remark)} className="md:col-span-2">
        <textarea rows={2} className="input h-auto py-1.5" value={c.remark ?? ''} onChange={(e) => set('remark', e.target.value, 'Remark')} placeholder="e.g. Grey colour only; 20 kg valve bag" />
      </AIField>
    </div>
  );
}
