import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AGENT_IDS, AGENTS, type AgentId, type AgentStatus } from '@/agents/registry';
import type { Preset } from '@/agents/presets';
import { MAX_ANIMATED } from '@/agents/animSlots';
import { AgentBot } from '@/components/agents/AgentBot';
import { AgentBadge } from '@/components/agents/AgentBadge';
import { PageHeader, Tabs } from '@/components/ui/primitives';
import type { Mode } from '@/types';
import { cn } from '@/lib/cn';

const PRESETS: Preset[] = ['hero', 'console', 'compact', 'micro', 'cursor'];
const STATUSES: AgentStatus[] = ['idle', 'working', 'waiting', 'queued', 'done', 'failed', 'paused', 'low-confidence'];
const PANES: { mode: Mode; theme: 'light' | 'dark' }[] = [
  { mode: 'scientist', theme: 'light' },
  { mode: 'non-scientist', theme: 'light' },
  { mode: 'scientist', theme: 'dark' },
  { mode: 'non-scientist', theme: 'dark' },
];
const SIZE: Record<Preset, number> = { hero: 72, console: 48, compact: 30, micro: 18, cursor: 28 };

/** Review sheet: every agent × preset × status, in light and dark, Scientist and Non-scientist. */
export function BotsPlayground() {
  const [preset, setPreset] = useState<Preset>('compact');
  const [focus, setFocus] = useState<AgentId>('conductor');
  const [pane, setPane] = useState<'all' | '0' | '1' | '2' | '3'>('all');
  const panes = pane === 'all' ? PANES : [PANES[Number(pane)]];
  return (
    <div className="space-y-6">
      <PageHeader
        title="Bot playground"
        sub={`All 14 agents × every preset × every status. Hero and console render smaller here to fit; at most ${MAX_ANIMATED} bots animate at once, the rest hold still.`}
        right={
          <Link to="/playground" className="text-xs text-accent">
            ← Component playground
          </Link>
        }
      />
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={preset} onChange={setPreset} items={PRESETS.map((p) => ({ id: p, label: p }))} />
        <Tabs
          value={pane}
          onChange={setPane}
          items={[
            { id: 'all', label: 'All four' },
            { id: '0', label: 'Scientist · light' },
            { id: '1', label: 'Non-scientist · light' },
            { id: '2', label: 'Scientist · dark' },
            { id: '3', label: 'Non-scientist · dark' },
          ]}
        />
      </div>

      <div className={cn('grid gap-4', panes.length > 1 && '2xl:grid-cols-2')}>
        {panes.map((p) => (
          <section key={`${p.mode}-${p.theme}`} data-theme={p.theme} className={cn('overflow-x-auto rounded-xl border p-4', p.theme === 'dark' ? 'dark border-[#343946] bg-[#181a20] text-[#f3f4f7]' : 'border-line bg-white text-[#20212b]')}>
            <div className="mb-3 text-xs font-semibold">
              {p.mode === 'scientist' ? 'Scientist · plastic' : 'Non-scientist · plush, mouths, hats'} · {p.theme}
            </div>
            <table className="text-[10px]">
              <thead>
                <tr>
                  <th className="pr-2 text-left font-medium opacity-60">Agent</th>
                  {STATUSES.map((s) => (
                    <th key={s} className="px-1 pb-1 font-medium opacity-60">
                      {s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {AGENT_IDS.map((id) => (
                  <tr key={id}>
                    <td className="whitespace-nowrap pr-2">
                      <button onClick={() => setFocus(id)} className={cn('text-left', focus === id && 'font-semibold')}>
                        {AGENTS[id].name} <span className="opacity-50">{AGENTS[id].type}</span>
                      </button>
                    </td>
                    {STATUSES.map((s) => (
                      <td key={s} className="px-1 py-0.5 text-center">
                        <AgentBot id={id} preset={preset} size={SIZE[preset]} placement={`pg-${p.mode}-${p.theme}-${s}`} status={s} mode={p.mode} theme={p.theme} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>

      <section className="card p-4">
        <div className="mb-3 text-sm font-semibold">
          {AGENTS[focus].name} · every preset, with its activity orb (AgentBadge)
        </div>
        <div className="flex flex-wrap items-end gap-6">
          {PRESETS.map((pr) => (
            <div key={pr} className="flex flex-col items-center gap-1">
              <AgentBadge id={focus} preset={pr} placement={`pg-focus-${pr}`} status="working" />
              <span className="mono text-[10px] text-ink3">{pr}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
