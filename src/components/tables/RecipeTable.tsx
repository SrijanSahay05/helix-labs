import { motion } from 'framer-motion';
import { Copy, Repeat2 } from 'lucide-react';
import type { Trial } from '@/types';
import { MAT } from '@/data/rawMaterials';
import { costPerKg, recipeTotal } from '@/lib/cost';
import { checkCost, checkRecipe, errorLabel } from '@/lib/validate';
import { StatusPill } from '@/components/ui/Pill';
import { cn } from '@/lib/cn';
import { AgentBot } from '@/components/agents/AgentBot';

/** Ingredients as rows, trials as columns, % by weight. Cost is computed live from master prices. */
export function RecipeTable({
  trials,
  ceiling,
  readOnly,
  highlight,
  onCell,
  onDuplicate,
  onSwap,
}: {
  trials: Trial[];
  ceiling?: number;
  readOnly?: boolean;
  /** trialId → set of changed materialIds (for diff highlighting) */
  highlight?: Record<string, Set<string>>;
  onCell?: (trialId: string, materialId: string, v: number) => void;
  onDuplicate?: (trialId: string) => void;
  onSwap?: (materialId: string) => void;
}) {
  const mats = [...new Set(trials.flatMap((t) => Object.keys(t.recipe)))];
  return (
    <div className="scroll-thin overflow-auto rounded-lg border border-line">
      <table className="w-full border-separate border-spacing-0">
        <thead>
          <tr>
            <th className="th sticky left-0 z-10 min-w-[170px] sm:min-w-[240px]">Material</th>
            {trials.map((t) => (
              <th key={t.id} className="th min-w-[88px] text-right">
                <div className="flex items-center justify-end gap-1">
                  <span className="mono text-[10px] font-normal text-ink3">it{t.iteration}</span>
                  {t.id}
                  {!readOnly && onDuplicate && (
                    <button title={`Duplicate ${t.id}`} onClick={() => onDuplicate(t.id)} className="rounded p-0.5 text-ink3 hover:text-accent">
                      <Copy size={11} />
                    </button>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {mats.map((m) => (
            <tr key={m} className="group">
              <td className="td sticky left-0 z-10 bg-surface">
                <div className="flex items-center gap-2">
                  <span className="flex-1">{MAT[m]?.name ?? m}</span>
                  <span className="mono text-2xs text-ink3">₹ {MAT[m]?.pricePerKg}</span>
                  {!readOnly && onSwap && (
                    <button title="Swap material" onClick={() => onSwap(m)} className="rounded p-0.5 text-ink3 opacity-0 hover:text-accent group-hover:opacity-100">
                      <Repeat2 size={12} />
                    </button>
                  )}
                </div>
              </td>
              {trials.map((t) => {
                const v = t.recipe[m];
                const meta = t.meta[m];
                const changed = highlight?.[t.id]?.has(m);
                return (
                  <motion.td key={t.id} layout className={cn('td p-0 text-right', meta?.by === 'helix' && 'bg-accent-soft/60', changed && 'bg-[var(--pass-soft)]')}>
                    {readOnly || v === undefined ? (
                      <span className={cn('mono block px-2.5', v === undefined && 'text-ink3', changed && 'font-semibold text-pass')}>{v === undefined ? '—' : v.toFixed(2)}</span>
                    ) : (
                      <div className="relative">
                        <input
                          key={v.toFixed(2)}
                          inputMode="decimal"
                          defaultValue={v.toFixed(2)}
                          aria-label={`${MAT[m]?.name ?? m} in ${t.id} (% w/w)`}
                          onBlur={(e) => {
                            const n = Math.round(Number(e.target.value) * 100) / 100;
                            if (Number.isFinite(n) && n !== v) onCell?.(t.id, m, n);
                            else e.target.value = v.toFixed(2);
                          }}
                          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                          className={cn('mono h-9 w-full bg-transparent px-2.5 text-right text-sm outline-none focus:bg-surface focus:shadow-glow', changed && 'font-semibold text-pass')}
                        />
                        {meta?.by === 'user' && <span className="pointer-events-none absolute left-1 top-0.5 text-[9px] text-ink3">Edited</span>}
                      </div>
                    )}
                  </motion.td>
                );
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-surface2">
            <td className="td sticky left-0 bg-surface2 font-semibold">
              <span className="flex items-center gap-1.5">
                Total <AgentBot id="sentinel" preset="micro" placement="recipe-total" className="ml-auto" />
              </span>
            </td>
            {trials.map((t) => {
              const err = checkRecipe(t.recipe);
              return (
                <td key={t.id} className={cn('td mono text-right font-semibold', err && 'bg-[var(--fail-soft)] text-fail')}>
                  {recipeTotal(t.recipe).toFixed(2)}
                  {err && <div className="text-[10px] font-semibold">Fail · Recipe not 100 %</div>}
                </td>
              );
            })}
          </tr>
          <tr className="bg-surface2">
            <td className="td sticky left-0 bg-surface2 font-semibold">
              <span className="flex items-center gap-1.5">
                Cost / kg (₹) <AgentBot id="cost" preset="micro" placement="recipe-cost" className="ml-auto" />
              </span>
            </td>
            {trials.map((t) => {
              const c = costPerKg(t.recipe);
              const err = checkCost(c, ceiling);
              return (
                <td key={t.id} className={cn('td mono text-right font-semibold', err && 'text-fail')} title={err ? errorLabel(err) : undefined}>
                  {c.toFixed(2)}
                </td>
              );
            })}
          </tr>
          <tr className="bg-surface2">
            <td className="td sticky left-0 bg-surface2 font-semibold">
              <span className="flex items-center gap-1.5">
                Constraint check <AgentBot id="sentinel" preset="micro" placement="recipe-check" className="ml-auto" />
              </span>
            </td>
            {trials.map((t) => {
              const rec = checkRecipe(t.recipe);
              const cost = checkCost(costPerKg(t.recipe), ceiling);
              const near = !cost && ceiling !== undefined && costPerKg(t.recipe) > ceiling * 0.97;
              return (
                <td key={t.id} className="td text-right">
                  <StatusPill status={rec || cost ? 'fail' : near ? 'borderline' : 'pass'} label={rec ? 'Fail · 100 %' : cost && cost.kind === 'cost-over-ceiling' ? `Fail · +${cost.overPct} %` : near ? 'Borderline' : 'Pass'} />
                </td>
              );
            })}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
