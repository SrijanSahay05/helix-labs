import { AnimatePresence, motion } from 'framer-motion';
import { HelixOrb, type OrbState } from '@/components/ai/HelixOrb';
import { AGENTS, type AgentStatus } from '@/agents/registry';
import { useAgentStatus } from '@/agents/useAgentStatus';
import { useAgents } from '@/store/agents';
import type { Preset } from '@/agents/presets';
import { cn } from '@/lib/cn';
import { AgentBot, type AgentBotProps } from './AgentBot';

/** Which orb (if any) docks on the bot for a status. Bot = who, orb = what. */
export function orbFor(status: AgentStatus, orb: OrbState | undefined, fallback: OrbState): { state: OrbState; paused?: boolean; speed?: number } | null {
  switch (status) {
    case 'working':
      return { state: orb ?? fallback };
    case 'waiting':
      return { state: 'listening' };
    case 'paused':
      return { state: orb ?? fallback, paused: true };
    case 'done':
      return { state: 'breathing', speed: 0.7 };
    case 'low-confidence':
      return { state: 'solving' };
    default:
      return null;
  }
}

/** The agent's bot with a small 20 px activity orb docked on its bottom-right corner. */
export function AgentBadge({
  id,
  preset = 'console',
  placement,
  status: statusProp,
  orb,
  hideOrb,
  className,
  ...rest
}: Omit<AgentBotProps, 'preset'> & { preset?: Preset; orb?: OrbState; hideOrb?: boolean }) {
  const globalStatus = useAgentStatus(id);
  const liveOrb = useAgents((s) => s.live[id]?.orb);
  const status = statusProp ?? globalStatus;
  const o = hideOrb ? null : orbFor(status, orb ?? liveOrb, AGENTS[id].defaultOrb);
  // small badges dock a scaled-down orb so the bot (who) stays recognisable next to the activity (what)
  const sz = typeof rest.size === 'number' ? rest.size : undefined;
  const small = sz !== undefined && sz <= 28;
  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      <AgentBot id={id} preset={preset} placement={placement} status={status} {...rest} />
      <AnimatePresence>
        {o && (
          <motion.span
            key="orb"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.18 }}
            className={cn('absolute grid place-items-center rounded-full bg-surface shadow-card', small ? '-bottom-1.5 -right-1.5 h-[14px] w-[14px] overflow-hidden' : '-bottom-1 -right-1 p-[2px]')}
          >
            <span className={cn('inline-flex', small && 'origin-center scale-[0.6]')}>
              <HelixOrb state={o.state} size={20} paused={o.paused} speed={o.speed} />
            </span>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
