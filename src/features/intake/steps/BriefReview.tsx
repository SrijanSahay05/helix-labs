import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, FileText, FlaskConical } from 'lucide-react';
import { findCategory, findSubcategory } from '@/data/categories';
import { PROP } from '@/data/properties';
import { MAT } from '@/data/rawMaterials';
import { USE_CASE_LABEL, COPY } from '@/data/copy';
import { useCaseDisplay } from '@/agent/scripts/intake';
import { Markdown } from '@/components/ai/TypeText';
import { AIChip } from '@/components/ai/AIField';
import { Tag } from '@/components/ui/Pill';
import { useMode } from '@/lib/useModeText';
import { targetText } from '@/lib/format';
import { useUI } from '@/store/ui';
import type { IntakeStep } from '@/store/project';
import type { UseCase } from '@/types';
import { draftUseCaseKeys, useDraft } from '../useDraft';
import { phraseToStep } from './PreviewSummary';
import { AgentTag } from '@/components/agents/AgentTag';

export function useLowConfidence() {
  const d = useDraft();
  const items: { path: string; label: string; step: IntakeStep; c: number }[] = [];
  for (const [path, m] of Object.entries(d.meta)) {
    if (m.by === 'helix' && (m.confidence ?? 1) < 0.7) {
      const key = path.split('.')[1] as keyof UseCase;
      items.push({ path, label: path.startsWith('useCase') ? (USE_CASE_LABEL[key]?.scientist ?? key) : path, step: path.startsWith('useCase') ? 'usecase' : path.startsWith('constraints') ? 'constraints' : 'targets', c: m.confidence ?? 0 });
    }
  }
  d.targets.forEach((t, i) => {
    if (t.meta.by === 'helix' && (t.meta.confidence ?? 1) < 0.7) items.push({ path: `targets.${i}`, label: `Target: ${PROP[t.propertyId]?.name}`, step: 'targets', c: t.meta.confidence ?? 0 });
  });
  return items;
}

function OutputCard() {
  const mode = useMode();
  const out = useUI((s) => s.nonScientistOutput);
  const items =
    mode === 'scientist'
      ? ['Ranked synthesis pathways', 'Trial recipes (DOE)', 'Test plan', 'Iteration until targets are met']
      : out === 'spec'
        ? ['Recommended product spec', 'A brief to hand to R&D']
        : ['Recommended product spec', 'A brief to hand to R&D', 'Full formulation workflow (pathways → trials → final)'];
  return (
    <div className="card p-4">
      <div className="label mb-2">{COPY['output.title'][mode]}</div>
      <ul className="space-y-1.5 text-sm">
        {items.map((i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-accent-soft text-accent">{mode === 'scientist' ? <FlaskConical size={12} /> : <FileText size={12} />}</span>
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BriefReview({ onJump, onStart }: { onJump: (s: IntakeStep) => void; onStart: () => void }) {
  const d = useDraft();
  const mode = useMode();
  const cat = findCategory(d.categoryId);
  const sub = findSubcategory(d.subcategoryId)?.sub;
  const lows = useLowConfidence();
  const ucKeys = draftUseCaseKeys(d);

  const H = ({ children, step }: { children: string; step: IntakeStep }) => (
    <div className="mb-2 mt-6 flex items-center justify-between border-b border-line pb-1">
      <h4 className="text-sm font-semibold tracking-wide text-ink2">{children}</h4>
      <button onClick={() => onJump(step)} className="text-2xs text-accent">
        Edit
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      {lows.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-borderline/30 bg-[var(--borderline-soft)] p-3">
          <AlertTriangle size={16} className="mt-0.5 text-borderline" />
          <div className="flex-1 text-sm">
            <b className="text-borderline">{lows.length} items need your check</b>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {lows.map((l) => (
                <button key={l.path} onClick={() => onJump(l.step)} className="rounded border border-borderline/40 bg-surface px-1.5 py-0.5 text-xs text-ink hover:border-borderline">
                  {l.label} · {l.c.toFixed(2)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <motion.article layoutId="brief-doc" className="card px-8 py-6">
        <div className="flex items-center gap-2">
          <AgentTag id="scribe" placement="brief-review" prefix="Written by" title={false} />
          <span className="label">· Formulation brief · draft</span>
          <Tag className="ml-auto">{mode === 'scientist' ? 'Scientist' : 'Non-scientist'}</Tag>
        </div>
        <h2 className="mt-2 text-xl font-semibold">{sub?.name ?? cat?.name ?? 'Untitled'} </h2>
        <p className="text-sm text-ink2">
          {cat?.groupName} › {cat?.name} › {sub?.name}
        </p>

        <H step="subcategory">Standard</H>
        <p className="mono text-sm">{d.standard}</p>

        <H step="usecase">Use case</H>
        <table className="w-full">
          <tbody>
            {ucKeys.map((k) => (
              <tr key={k}>
                <td className="w-56 py-1 text-sm text-ink2">{USE_CASE_LABEL[k]?.[mode] ?? k}</td>
                <td className="mono py-1 text-sm">{useCaseDisplay(k, d.useCase[k])}</td>
                <td className="w-24 py-1 text-right">{d.meta[`useCase.${k}`] && <AIChip meta={d.meta[`useCase.${k}`]} label={k} path={`useCase.${k}`} />}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <H step="benchmark">Benchmarks</H>
        {d.benchmarks.length ? (
          <ul className="text-sm">
            {d.benchmarks.map((b, i) => (
              <li key={b.id}>
                <span className="mono font-semibold text-accent">{String.fromCharCode(65 + i)}</span> {b.name} · {b.standardClass} · {b.values.length} values
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink3">None (optional)</p>
        )}

        <H step="targets">Targets</H>
        <table className="w-full">
          <thead>
            <tr>
              <th className="py-1 text-left text-2xs font-semibold text-ink3">Property</th>
              <th className="py-1 text-right text-2xs font-semibold text-ink3">Target</th>
              <th className="py-1 pl-3 text-left text-2xs font-semibold text-ink3">Unit</th>
              <th className="py-1 text-left text-2xs font-semibold text-ink3">Method</th>
              <th className="py-1 text-left text-2xs font-semibold text-ink3">Priority</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {d.targets.map((t) => (
              <tr key={t.propertyId} className="border-t border-line">
                <td className="py-1 text-sm">
                  {d.top3.includes(t.propertyId) && <span className="mono mr-1 rounded bg-accent px-1 text-2xs font-bold text-on-accent">{d.top3.indexOf(t.propertyId) + 1}</span>}
                  {mode === 'scientist' ? PROP[t.propertyId]?.name : PROP[t.propertyId]?.plainName}
                </td>
                <td className="mono py-1 text-right text-sm">{targetText(t)}</td>
                <td className="py-1 pl-3 text-xs text-ink3">{t.unit}</td>
                <td className="mono py-1 text-xs text-ink2">{t.testMethod}</td>
                <td className="py-1 text-xs capitalize">{t.priority}</td>
                <td className="py-1 text-right">
                  <AIChip meta={t.meta} label={PROP[t.propertyId]?.name} path="targets" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {d.top3.includes('cost') && <p className="mt-1 text-2xs text-ink3">Top-3 also includes cost per kg (rank {d.top3.indexOf('cost') + 1}).</p>}

        <H step="constraints">Constraints</H>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <span className="text-ink2">Cost ceiling:</span> <b className="mono">₹ {d.constraints.costCeiling ?? '—'} / kg</b>
          </div>
          <div>
            <span className="text-ink2">Budget band:</span> <b className="capitalize">{d.constraints.budgetBand ?? '—'}</b>
          </div>
          <div>
            <span className="text-ink2">Compliance:</span> {(d.constraints.compliance ?? []).join(', ') || '—'}
          </div>
          <div>
            <span className="text-ink2">Site:</span> {d.constraints.site ? `${d.constraints.site.tMin}–${d.constraints.site.tMax} °C · RH ≤ ${d.constraints.site.rhMax} %` : '—'}
          </div>
          <div className="col-span-2">
            <span className="text-ink2">Material limits:</span> {(d.constraints.materialLimits ?? []).map((l) => `${MAT[l.materialId]?.name} ${l.exclude ? 'excluded' : `≤ ${l.maxPct} %`}`).join(' · ') || '—'}
          </div>
        </div>

        <H step="preview">Summary</H>
        <div className="text-sm leading-6 text-ink2">{d.summary ? <Markdown text={d.summary} onBold={(t) => onJump(phraseToStep(t))} /> : '—'}</div>
      </motion.article>

      <div className="grid items-end gap-4 md:grid-cols-[1fr_auto]">
        <OutputCard />
        <motion.button
          layoutId="start-cta"
          onClick={onStart}
          whileTap={{ scale: 0.98 }}
          className="flex h-14 items-center gap-2 rounded-xl bg-accent px-8 text-md font-semibold text-on-accent shadow-glow hover:brightness-110"
        >
          {COPY['start.cta'][mode]} <ArrowRight size={18} />
        </motion.button>
      </div>
    </div>
  );
}
