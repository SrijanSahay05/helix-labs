import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Icon } from '@/components/ui/Icon';
import { useMemo, useState } from 'react';
import { CATEGORIES, GROUPS } from '@/data/categories';
import { useFillPhase } from '@/components/ai/AIField';
import { useMode } from '@/lib/useModeText';
import { cn } from '@/lib/cn';
import { SCENARIO } from '@/data/scenarios';
import { useDraft, userSet } from '../useDraft';
import { AgentBot } from '@/components/agents/AgentBot';
import { agentName } from '@/store/agents';

function highlight(text: string, q: string) {
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded bg-accent-soft px-0.5 text-accent">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

export function StepCategory() {
  const d = useDraft();
  const mode = useMode();
  const [q, setQ] = useState('');
  const [groupPhase] = useFillPhase('group');
  const [catPhase] = useFillPhase('categoryId');
  const group = d.group ?? 4;
  const list = useMemo(() => {
    if (q.trim()) {
      const t = q.toLowerCase();
      return CATEGORIES.filter((c) => [c.name, c.example, c.plainExample, ...c.subcategories.map((s) => s.name)].some((x) => x.toLowerCase().includes(t)));
    }
    return CATEGORIES.filter((c) => c.group === group);
  }, [q, group]);
  const scenario = SCENARIO[d.scenarioId];
  const alsoPossible = d.categoryId ? CATEGORIES.filter((c) => c.group === group && c.id !== d.categoryId).slice(0, 2).map((c) => c.id) : [];
  const meta = d.meta.categoryId;

  return (
    <div className="space-y-4">
      <div data-ai-path="group" className={cn('grid grid-cols-2 gap-1 rounded-lg bg-surface2 p-1 sm:grid-cols-3 2xl:grid-cols-6', groupPhase === 'filling' && 'ai-shimmer')}>
        {GROUPS.map((g) => (
          <button
            key={g.id}
            data-ai-target={`group:${g.id}`}
            onClick={() => {
              userSet('group', g.id, 'Group');
              setQ('');
            }}
            className={cn('relative rounded-md px-2 py-2 text-left transition-colors', group === g.id && !q ? 'text-ink' : 'text-ink2 hover:text-ink')}
          >
            {group === g.id && !q && <motion.span layoutId="group-pill" className="absolute inset-0 rounded-md bg-surface shadow-card" />}
            <span className="relative block">
              <span className="mono text-2xs text-ink3">{g.id}</span>
              <span className="block text-xs font-medium leading-tight">{mode === 'scientist' ? g.name : g.plain}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink3" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search all categories (e.g. “grout”)" className="input pl-9" />
        </div>
        <span className="text-xs text-ink3">{list.length} categories</span>
      </div>

      <div data-ai-path="categoryId" className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
        {list.map((c, i) => {
          const selected = d.categoryId === c.id;
          const also = alsoPossible.includes(c.id);
          return (
            <motion.button
              key={c.id}
              data-ai-target={`categoryId:${c.id}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => {
                userSet('categoryId', c.id, 'Category');
                if (c.group !== d.group) userSet('group', c.group, 'Group');
                userSet('subcategoryId', undefined, 'Subcategory');
              }}
              className={cn(
                'relative flex flex-col rounded-lg border bg-surface p-3 text-left transition-shadow',
                selected ? 'border-accent shadow-glow' : 'border-line hover:border-ink3',
                selected && catPhase === 'filling' && 'ai-shimmer',
                also && 'border-dashed',
              )}
            >
              <div className="flex items-center gap-2">
                <span className={cn('flex h-8 w-8 items-center justify-center rounded-md', selected ? 'bg-accent text-on-accent' : 'bg-surface2 text-ink2')}>
                  <Icon name={c.icon} size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{highlight(c.name, q)}</div>
                  <div className="text-2xs text-ink3">
                    {c.subcategories.length} sub-SKUs · group {c.group}
                  </div>
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-ink2">{mode === 'scientist' ? highlight(c.example, q) : c.plainExample}</p>
              {selected && meta?.by === 'helix' && (
                <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-accent-soft py-0.5 pl-0.5 pr-2 text-2xs font-medium text-accent">
                  <AgentBot id={meta.agent ?? 'classifier'} preset="micro" placement={`cat-${c.id}`} /> Picked by {agentName(meta.agent ?? 'classifier')} · {meta.confidence?.toFixed(2)}
                </span>
              )}
              {also && meta?.by === 'helix' && <span className="mt-2 text-2xs text-ink3">Also possible</span>}
            </motion.button>
          );
        })}
      </div>
      {scenario && !d.categoryId && <p className="text-xs text-ink3">Atlas will suggest a category from your request.</p>}
    </div>
  );
}
