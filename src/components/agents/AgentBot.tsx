import { memo, useEffect, useRef, useState, type CSSProperties } from 'react';
import { BotAvatar, type BotAvatarProps, type BotAvatarState } from 'bot-avatars';
import { AGENTS, type AgentId, type AgentStatus } from '@/agents/registry';
import { PERSONALITY, presetProps, wearsAccessories, type Preset } from '@/agents/presets';
import { hash01 } from '@/agents/hash';
import { useAgentStatus } from '@/agents/useAgentStatus';
import { useAnimSlot } from '@/agents/animSlots';
import { useAgents } from '@/store/agents';
import { useUI } from '@/store/ui';
import { cn } from '@/lib/cn';
import type { Mode } from '@/types';

export type BotOverride = Partial<Omit<BotAvatarProps, 'type' | 'state' | 'seed'>>;

const STATUS_LABEL: Record<AgentStatus, string> = {
  idle: 'idle',
  working: 'working',
  waiting: 'waiting for you',
  queued: 'queued',
  done: 'done',
  failed: 'failed',
  paused: 'paused',
  'low-confidence': 'low confidence',
};

function botState(status: AgentStatus, wake: boolean): BotAvatarState {
  if (status === 'working') return 'working';
  if (status === 'waiting') return wake ? 'default' : 'sleeping';
  if (status === 'queued' || status === 'paused') return 'sleeping';
  return 'default';
}

export interface AgentBotProps {
  id: AgentId;
  preset?: Preset;
  /** where the bot sits; part of the stable key and the seed */
  placement: string;
  size?: number | string;
  /** contextual status (a stage, a run, a row); falls back to the agent's global status */
  status?: AgentStatus;
  /** paused unless the agent is working (tables, logs, calm lists) */
  quiet?: boolean;
  /** read-only screens: paused, no pointer play */
  frozen?: boolean;
  /** a sleeping bot wakes to `default` on hover (empty states, "waiting for you") */
  wakeOnHover?: boolean;
  /** DOM anchor for the agent cursor and handoff arcs */
  anchor?: string;
  className?: string;
  style?: CSSProperties;
  override?: BotOverride;
  /** review surfaces only (playground): render as if in this mode / theme */
  mode?: Mode;
  theme?: 'light' | 'dark';
}

/** The only way to render a bot. Every BotAvatar in Helix goes through here. */
export const AgentBot = memo(function AgentBot({ id, preset = 'compact', placement, size, status: statusProp, quiet, frozen, wakeOnHover, anchor, className, style, override, mode: modeProp, theme: themeProp }: AgentBotProps) {
  const a = AGENTS[id];
  const globalStatus = useAgentStatus(id);
  const status = statusProp ?? globalStatus;
  const uiMode = useUI((s) => s.mode);
  const uiTheme = useUI((s) => s.theme);
  const mode = modeProp ?? uiMode;
  const theme = themeProp ?? uiTheme;
  const motion = useUI((s) => s.botMotion);
  const custom = useAgents((s) => s.custom[id]);
  const [hover, setHover] = useState(false);
  const p = presetProps(preset, mode, theme);

  const personality = custom?.personality ?? (motion === 'calm' ? undefined : motion);
  const still = personality === 'still';
  const big = preset === 'hero' || preset === 'console';
  const personalityProps = personality && big ? PERSONALITY[personality] : undefined;

  const wantsMotion = !frozen && !still && status !== 'paused' && !((quiet || preset === 'micro') && status !== 'working') && !(override?.paused ?? false);
  const animate = useAnimSlot(wantsMotion);

  const wake = (wakeOnHover || status === 'waiting') && hover && !frozen;
  const state = botState(status, wake);
  const sizePx = size ?? p.size;

  // cross-fade when the user switches Scientist ↔ Non-scientist (same canvas, no remount)
  const ref = useRef<HTMLSpanElement>(null);
  const firstMode = useRef(mode);
  useEffect(() => {
    if (firstMode.current === mode) return;
    firstMode.current = mode;
    ref.current?.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });
  }, [mode]);

  const wear = wearsAccessories(preset, mode);
  const acc = a.accessories ?? {};
  const name = custom?.name || a.name;

  return (
    <span
      ref={ref}
      role="group"
      aria-label={`${name}, ${a.title} agent, ${STATUS_LABEL[status]}`}
      title={preset === 'micro' ? `${name} · ${a.title}` : undefined}
      data-bot-anchor={anchor}
      onPointerEnter={wakeOnHover || status === 'waiting' ? () => setHover(true) : undefined}
      onPointerLeave={wakeOnHover || status === 'waiting' ? () => setHover(false) : undefined}
      className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: sizePx, height: sizePx, ...style }}
    >
      <BotAvatar
        key={`${id}-${placement}`}
        tabIndex={-1}
        type={custom?.type ?? a.type}
        path={custom?.path || undefined}
        face={mode === 'non-scientist' ? 'mouth' : a.face}
        state={state}
        seed={hash01(id + placement)}
        hat={wear ? (custom?.hat ?? acc.hat ?? 'none') : 'none'}
        glasses={wear ? (custom?.glasses ?? acc.glasses ?? 'none') : 'none'}
        headphones={wear ? (custom?.headphones ?? acc.headphones ?? false) : false}
        bowTie={wear ? (custom?.bowTie ?? acc.bowTie ?? false) : false}
        {...p}
        {...(custom?.color ? { color: custom.color } : {})}
        {...(custom?.brightness !== undefined ? { brightness: custom.brightness } : {})}
        {...(custom?.saturation !== undefined ? { saturation: custom.saturation } : {})}
        {...personalityProps}
        {...(status === 'low-confidence' ? { turn: 1.4 } : {})}
        {...(status === 'failed' ? { saturation: 0.6, brightness: 0.85 } : {})}
        {...(frozen || still ? { interactive: false } : {})}
        size={sizePx}
        {...(themeProp ? { theme: themeProp } : {})}
        {...override}
        paused={!animate}
      />
    </span>
  );
});
