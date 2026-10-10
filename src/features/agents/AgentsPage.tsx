import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AGENT_IDS, RESERVED_TYPES, type AgentId } from '@/agents/registry';
import { AgentCard } from '@/components/agents/AgentCard';
import { PageHeader } from '@/components/ui/primitives';
import { useUI } from '@/store/ui';
import { AgentDrawer } from './AgentDrawer';

/** The crew: 14 specialist agents, each with its own bot. Bot = who; the orb on it = what it's doing. */
export function AgentsPage() {
  const [open, setOpen] = useState<AgentId | null>(null);
  const mode = useUI((s) => s.mode);
  const motion = useUI((s) => s.botMotion);
  return (
    <div>
      <PageHeader
        title="Agents"
        sub={
          mode === 'scientist'
            ? 'Helix runs a crew of specialist agents. Each one signs the values it fills, the lines it logs and the jobs it runs — ask any of them why.'
            : 'Helix is a team. Each helper has its own job and signs its work, so you always know who did what.'
        }
        right={
          <Link to="/settings" className="text-xs text-ink2 hover:text-accent">
            Bot motion: <b className="capitalize text-ink">{motion}</b> · change in Settings
          </Link>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {AGENT_IDS.map((id) => (
          <AgentCard key={id} id={id} onOpen={() => setOpen(id)} />
        ))}
      </div>
      <p className="mt-6 text-xs text-ink3">
        Shapes reserved for agents you create later: <span className="mono">{RESERVED_TYPES.join(', ')}</span>.
      </p>
      <AgentDrawer id={open} onClose={() => setOpen(null)} />
    </div>
  );
}
