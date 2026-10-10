import { Check } from 'lucide-react';
import { AIField } from '@/components/ai/AIField';
import { findCategory, findSubcategory, GROUPS } from '@/data/categories';
import { USE_CASE_LABEL } from '@/data/copy';
import { PROP } from '@/data/properties';
import { useCaseDisplay } from '@/agent/scripts/intake';
import { getIn } from '@/lib/path';
import { cn } from '@/lib/cn';
import type { IntakeStep } from '@/store/project';
import type { UseCase } from '@/types';
import { useDraft } from './useDraft';

const UC: (keyof UseCase)[] = ['substrate', 'surfaces', 'materialType', 'size', 'exposure', 'climate', 'appTemp', 'load', 'method', 'timeToGroutH', 'timeToTrafficH', 'standardClass'];

function fmt(path: string, v: unknown): string {
  if (v === undefined || v === null || (Array.isArray(v) && v.length === 0)) return '';
  if (path === 'mode') return v === 'scientist' ? 'Scientist' : 'Non-scientist';
  if (path === 'group') return `${v} · ${GROUPS[(v as number) - 1]?.name}`;
  if (path === 'categoryId') return findCategory(v as string)?.name ?? '';
  if (path === 'subcategoryId') return findSubcategory(v as string)?.sub.name ?? '';
  if (path.startsWith('useCase.')) return useCaseDisplay(path.split('.')[1] as keyof UseCase, v);
  if (path === 'benchmarks') return (v as { name: string }[]).map((b) => b.name).join(', ');
  if (path === 'targets') return `${(v as unknown[]).length} targets`;
  if (path === 'top3') return (v as string[]).map((x) => (x === 'cost' ? 'Cost / kg' : PROP[x]?.name)).join(' › ');
  if (path === 'constraints.costCeiling') return `₹ ${v} / kg`;
  if (path === 'constraints.site') {
    const s = v as { tMin: number; tMax: number; rhMax: number };
    return `${s.tMin}–${s.tMax} °C · RH ≤ ${s.rhMax} %`;
  }
  if (path === 'constraints.materialLimits') return `${(v as unknown[]).length} limits`;
  if (path === 'summary') return 'Written ✓';
  if (Array.isArray(v)) return v.join(', ');
  return String(v);
}

const GROUPS_LIVE: { step: IntakeStep; title: string; fields: [string, string][]; cols?: number }[] = [
  { step: 'who', title: 'Who is using Helix', fields: [['mode', 'Who is using']] },
  { step: 'category', title: 'Category', fields: [['group', 'Group'], ['categoryId', 'Category']] },
  { step: 'subcategory', title: 'Subcategory & standard', fields: [['subcategoryId', 'Subcategory'], ['chemistry', 'Chemistry'], ['forms', 'Form'], ['standard', 'Standard']] },
  { step: 'usecase', title: 'Exact use case', fields: UC.map((k) => [`useCase.${k}`, USE_CASE_LABEL[k]?.scientist ?? k]), cols: 3 },
  { step: 'benchmark', title: 'Closest benchmark', fields: [['benchmarks', 'Benchmark']] },
  { step: 'targets', title: 'Property targets', fields: [['targets', 'Targets'], ['top3', 'Top 3']] },
  {
    step: 'constraints',
    title: 'Constraints',
    fields: [
      ['constraints.costCeiling', 'Cost ceiling'],
      ['constraints.budgetBand', 'Budget band'],
      ['constraints.compliance', 'Compliance'],
      ['constraints.site', 'Site'],
      ['constraints.materialLimits', 'Material limits'],
      ['constraints.mustHaves', 'Must-haves'],
    ],
    cols: 3,
  },
  { step: 'preview', title: 'Formulation summary', fields: [['summary', 'Summary']] },
];

/** Compact mirror of every intake step — the agent cursor visibly fills it during Magic Start. */
export function MagicLiveForm({ onOpen }: { onOpen: (s: IntakeStep) => void }) {
  const d = useDraft();
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {GROUPS_LIVE.map((g) => {
        const done = !!d.done[g.step];
        return (
          <div key={g.step} className={cn('card p-4', (g.cols ?? 0) >= 3 && 'md:col-span-2')}>
            <div className="mb-3 flex items-center gap-2">
              <span className={cn('grid h-5 w-5 place-items-center rounded-full', done ? 'bg-pass text-on-accent' : 'bg-surface2')}>{done && <Check size={11} strokeWidth={3} />}</span>
              <span className="text-[13px] font-semibold">{g.title}</span>
              {done && (
                <button onClick={() => onOpen(g.step)} className="ml-auto text-2xs text-accent">
                  Open step
                </button>
              )}
            </div>
            <div className={cn('grid gap-3', g.cols === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : g.fields.length > 1 ? 'sm:grid-cols-2' : 'grid-cols-1')}>
              {g.fields.map(([path, label]) => {
                const v = getIn(d, path);
                const text = fmt(path, v);
                return (
                  <AIField key={path} path={path} label={label} meta={d.meta[path]} display={text} compact>
                    <div className={cn('flex h-9 items-center truncate rounded-md border border-line bg-surface px-3 text-[13px]', text ? 'text-ink' : 'text-ink3')}>{text || '—'}</div>
                  </AIField>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
