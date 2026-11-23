import { AnimatePresence, motion } from 'framer-motion';
import { CHEMISTRIES, FORMS, findCategory } from '@/data/categories';
import { PROP } from '@/data/properties';
import { scenarioForSub } from '@/data/scenarios';
import { useProjects } from '@/store/project';
import { useUI } from '@/store/ui';
import { AIField, useFillPhase } from '@/components/ai/AIField';
import { Chip } from '@/components/ui/primitives';
import { Tag } from '@/components/ui/Pill';
import { cn } from '@/lib/cn';
import { useDraft, userSet } from '../useDraft';
import type { PropertyGroup } from '@/types';
import { AgentBot } from '@/components/agents/AgentBot';

export function StepSubcategory() {
  const d = useDraft();
  const cat = findCategory(d.categoryId);
  const [phase] = useFillPhase('subcategoryId');
  if (!cat) return <p className="text-sm text-ink2">Pick a category first.</p>;
  const filtered = cat.subcategories.filter(
    (s) => (d.chemistry.length === 0 || s.chemistry.some((c) => d.chemistry.includes(c))) && (d.forms.length === 0 || s.forms.some((f) => d.forms.includes(f))),
  );
  const sub = cat.subcategories.find((s) => s.id === d.subcategoryId);
  const counts = sub
    ? sub.propertyTemplate.reduce<Record<PropertyGroup, number>>((a, id) => {
        const g = PROP[id]?.group;
        if (g) a[g] = (a[g] ?? 0) + 1;
        return a;
      }, { chemical: 0, rheological: 0, mechanical: 0, durability: 0 })
    : null;

  const toggle = (path: 'chemistry' | 'forms', v: string) => {
    const cur = d[path];
    userSet(path, cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v], path === 'chemistry' ? 'Chemistry' : 'Physical form');
  };

  return (
    <div className="grid gap-5 2xl:grid-cols-[1fr_280px]">
      <div className="space-y-3">
        <AIField path="chemistry" label="Chemistry" meta={d.meta.chemistry} display={d.chemistry.join(', ')}>
          <div className="flex flex-wrap gap-1.5">
            {CHEMISTRIES.map((c) => (
              <Chip key={c} active={d.chemistry.includes(c)} onClick={() => toggle('chemistry', c)}>
                {c}
              </Chip>
            ))}
          </div>
        </AIField>
        <AIField path="forms" label="Physical form" meta={d.meta.forms} display={d.forms.join(', ')}>
          <div className="flex flex-wrap gap-1.5">
            {FORMS.map((f) => (
              <Chip key={f} active={d.forms.includes(f)} onClick={() => toggle('forms', f)}>
                {f}
              </Chip>
            ))}
          </div>
        </AIField>
        <div data-ai-path="subcategoryId" className="overflow-hidden rounded-lg border border-line bg-surface">
          <table className="w-full">
            <thead>
              <tr>
                <th className="th w-8" />
                <th className="th">Subcategory</th>
                <th className="th">Chemistry · form</th>
                <th className="th">Default standard</th>
                <th className="th text-right"># properties</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const sel = s.id === d.subcategoryId;
                return (
                  <tr
                    key={s.id}
                    data-ai-target={`subcategoryId:${s.id}`}
                    onClick={() => {
                      userSet('subcategoryId', s.id, 'Subcategory');
                      userSet('standard', s.defaultStandard, 'Standard');
                      // a hand-picked subcategory runs its own demo, unless one is pinned in Settings
                      const next = scenarioForSub(s.id);
                      if (next && useUI.getState().demoScenario === 'auto') useProjects.getState().patchDraft({ scenarioId: next.id });
                    }}
                    className={cn('cursor-pointer transition-colors hover:bg-surface2', sel && 'bg-accent-soft', sel && phase === 'filling' && 'ai-shimmer')}
                  >
                    <td className="td">
                      <span className={cn('block h-3.5 w-3.5 rounded-full border', sel ? 'border-[4px] border-accent' : 'border-line')} />
                    </td>
                    <td className="td font-medium">
                      {s.name}
                      {sel && d.meta.subcategoryId?.by === 'helix' && <span className="ml-2 text-2xs font-semibold text-accent">✦ Helix</span>}
                    </td>
                    <td className="td text-xs text-ink2">
                      {s.chemistry.join(', ')} · {s.forms.join(', ')}
                    </td>
                    <td className="td mono text-xs">{s.defaultStandard}</td>
                    <td className="td mono text-right">{s.propertyTemplate.length}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="td py-6 text-center text-ink3">
                    No sub-SKU matches these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <AnimatePresence>
        {sub && counts && (
          <motion.div key={sub.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="card h-fit space-y-3 p-4">
            <div className="flex items-center gap-2">
              {d.meta.subcategoryId?.by === 'helix' ? <AgentBot id="classifier" preset="micro" placement="subcat-card" /> : null}
              <span className="text-sm font-semibold">{sub.name}</span>
              {d.meta.subcategoryId?.by === 'helix' && <span className="ml-auto text-2xs text-ink3">Picked by Atlas · {d.meta.subcategoryId.confidence?.toFixed(2)}</span>}
            </div>
            <AIField path="standard" label="Default standard" meta={d.meta.standard} display={d.standard}>
              <div className="mono rounded-md border border-line bg-surface2 px-2 py-1.5 text-xs">{d.standard ?? sub.defaultStandard}</div>
            </AIField>
            <div>
              <div className="label mb-1">Property template · {sub.propertyTemplate.length} properties</div>
              <div className="flex flex-wrap gap-1">
                {(Object.entries(counts) as [PropertyGroup, number][]).map(([g, n]) =>
                  n ? (
                    <Tag key={g} tone="accent">
                      {g[0].toUpperCase() + g.slice(1)} {n}
                    </Tag>
                  ) : null,
                )}
              </div>
            </div>
            <p className="text-2xs text-ink3">Selecting a subcategory sets the default standard and loads its property template into Targets.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
