import { Plus, RotateCcw, Sparkles, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CATEGORIES, findSubcategory } from '@/data/categories';
import { GROUP_LABEL, GROUP_ORDER, PROP, PROPERTIES, methodFor } from '@/data/properties';
import { SCENARIOS } from '@/data/scenarios';
import { useTemplates } from '@/store/templates';
import { useUI } from '@/store/ui';
import { Button } from '@/components/ui/Button';
import { SectionTitle } from '@/components/ui/primitives';
import { AgentConsole } from '@/components/ai/AgentConsole';
import { StateFrame } from '@/components/ui/StateFrame';
import { Tag } from '@/components/ui/Pill';
import { runAgent } from '@/agent/engine';

export function TemplatesPage() {
  const [sub, setSub] = useState('ta-c2te-s1');
  const { overrides, set, reset } = useTemplates();
  const standards = useUI((s) => s.standards);
  const role = useUI((s) => s.role);
  const [runId, setRunId] = useState<string>();
  const found = findSubcategory(sub);
  const props = overrides[sub] ?? found?.sub.propertyTemplate ?? [];
  const canEdit = role === 'admin';
  const limits = Object.fromEntries(SCENARIOS.flatMap((s) => s.targets.filter((t) => t.std).map((t) => [`${s.subcategoryId}:${t.propertyId}`, t.std!])));

  const suggest = () => {
    const extra = PROPERTIES.filter((p) => !props.includes(p.id) && p.id !== 'cost' && (p.group === 'durability' || p.group === 'mechanical')).slice(0, 2);
    setRunId(
      runAgent({
        id: `tpl.${sub}`,
        title: 'Suggest template',
        agent: 'classifier',
        events: [
          { t: 'orb', state: 'connecting', label: `Reviewing ${found?.sub.name} template…` },
          { t: 'plan', steps: ['Read standard', 'Compare with similar products', 'Suggest properties'] },
          { t: 'step', index: 0, status: 'running' },
          { t: 'tool', name: 'lookup_standard', args: `"${found?.sub.defaultStandard}"`, result: 'clauses loaded', ms: 600 },
          { t: 'step', index: 0, status: 'done' },
          { t: 'step', index: 1, status: 'running' },
          { t: 'tool', agent: 'benchmark', name: 'compare_values', args: `"${sub}"`, result: `${extra.length} gaps`, ms: 700 },
          { t: 'step', index: 1, status: 'done' },
          { t: 'step', index: 2, status: 'running' },
          ...extra.map((e) => ({ t: 'think' as const, text: `Add ${e.name} — commonly reported by competitors.` })),
          { t: 'effect', run: () => set(sub, [...props, ...extra.map((e) => e.id)]) },
          { t: 'step', index: 2, status: 'done' },
          { t: 'done', summary: `Added ${extra.length} suggested properties` },
        ],
      }),
    );
  };

  return (
    <div className="space-y-4">
      <SectionTitle
        title="Property templates"
        sub="Each subcategory loads its own subset of the property library as default targets."
        right={
          <div className="flex gap-2">
            <Button onClick={suggest}>
              <Sparkles size={14} /> Helix suggest template
            </Button>
            {overrides[sub] && (
              <Button variant="ghost" onClick={() => reset(sub)}>
                <RotateCcw size={14} /> Reset
              </Button>
            )}
          </div>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <div className="card scroll-thin max-h-[70vh] overflow-auto p-2">
          {CATEGORIES.map((c) => (
            <div key={c.id} className="mb-2">
              <div className="label px-2 py-1">{c.name}</div>
              {c.subcategories.map((s) => (
                <button key={s.id} onClick={() => setSub(s.id)} className={`block w-full rounded px-2 py-1 text-left text-sm ${sub === s.id ? 'bg-accent-soft font-medium text-accent' : 'text-ink2 hover:bg-surface2'}`}>
                  {s.name}
                  {overrides[s.id] && <span className="ml-1 text-2xs text-borderline">edited</span>}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {runId && <AgentConsole runId={runId} />}
          {!canEdit && <StateFrame state="read-only" message="Only Admins can edit templates (switch role in Settings)" />}
          <div className="card overflow-hidden">
            <div className="flex items-center gap-2 border-b border-line px-3 py-2">
              <span className="font-semibold">{found?.sub.name}</span>
              <Tag tone="accent" className="mono">
                {found?.sub.defaultStandard}
              </Tag>
              <span className="ml-auto text-xs text-ink3">{props.length} properties</span>
            </div>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="th">Property</th>
                  <th className="th">Unit</th>
                  <th className="th">Default test method</th>
                  <th className="th">Standard limit</th>
                  <th className="th w-10" />
                </tr>
              </thead>
              {GROUP_ORDER.map((g) => {
                const rows = props.filter((id) => PROP[id]?.group === g);
                if (!rows.length) return null;
                return (
                  <tbody key={g}>
                    <tr>
                      <td colSpan={5} className="border-b border-line bg-surface2/60 px-2.5 py-1 text-xs font-semibold">
                        {GROUP_LABEL[g]} · {rows.length}
                      </td>
                    </tr>
                    {rows.map((id) => (
                      <tr key={id}>
                        <td className="td">{PROP[id]?.name}</td>
                        <td className="td text-xs text-ink3">{PROP[id]?.unit}</td>
                        <td className="td mono text-xs">{methodFor(id, standards)}</td>
                        <td className="td mono text-xs text-ink2">{limits[`${sub}:${id}`] ?? '—'}</td>
                        <td className="td">
                          {canEdit && (
                            <button onClick={() => set(sub, props.filter((x) => x !== id))} className="text-ink3 hover:text-fail">
                              <Trash2 size={13} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                );
              })}
            </table>
            {canEdit && (
              <div className="flex items-center gap-2 border-t border-line px-3 py-2">
                <Plus size={13} className="text-ink3" />
                <select className="input h-7 w-72 text-xs" value="" onChange={(e) => e.target.value && set(sub, [...props, e.target.value])}>
                  <option value="">Add property from library…</option>
                  {PROPERTIES.filter((p) => !props.includes(p.id) && p.id !== 'cost').map((p) => (
                    <option key={p.id} value={p.id}>
                      {GROUP_LABEL[p.group].split(' ')[0]} · {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
