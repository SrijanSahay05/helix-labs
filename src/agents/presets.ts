import type { BotAvatarProps } from 'bot-avatars';
import type { Mode } from '@/types';
import type { Personality } from '@/store/agents';

export type Preset = 'hero' | 'console' | 'compact' | 'micro' | 'cursor';
export type PresetProps = Readonly<Pick<BotAvatarProps, 'size' | 'shading' | 'saturation' | 'brightness' | 'interactive' | 'turn' | 'jumpEvery' | 'jumpHeight' | 'jumpTime' | 'speed'>> & { size: number };

type Theme = 'light' | 'dark';

function build(preset: Preset, mode: Mode, theme: Theme): PresetProps {
  const plush = mode === 'non-scientist';
  const lift = theme === 'dark' ? { brightness: 1.1 } : {};
  switch (preset) {
    case 'hero':
      return { size: 112, shading: plush ? 'fabric' : 'plastic', interactive: true, turn: 1, jumpEvery: 10 };
    case 'console':
      return { size: 56, shading: plush ? 'fabric' : 'plastic', saturation: 1.2, interactive: true, turn: 0.6, jumpEvery: 0 };
    case 'compact':
      return { size: 30, shading: 'smooth', saturation: 1.1, interactive: false, turn: 0.3, jumpEvery: 0, ...lift };
    case 'micro':
      return { size: 18, shading: 'flat', saturation: 1.0, interactive: false, turn: 0, jumpEvery: 0, ...lift };
    case 'cursor':
      return { size: 28, shading: 'plastic', interactive: false, turn: 0, jumpEvery: 0, jumpHeight: 14, jumpTime: 0.45 };
  }
}

const MODES: Mode[] = ['scientist', 'non-scientist'];
const THEMES: Theme[] = ['light', 'dark'];
const ALL: Preset[] = ['hero', 'console', 'compact', 'micro', 'cursor'];

/** Frozen, pre-built objects so props stay referentially stable and canvases never re-initialise. */
const TABLE = Object.freeze(
  Object.fromEntries(ALL.map((p) => [p, Object.freeze(Object.fromEntries(MODES.map((m) => [m, Object.freeze(Object.fromEntries(THEMES.map((t) => [t, Object.freeze(build(p, m, t))])))])))])),
) as Readonly<Record<Preset, Readonly<Record<Mode, Readonly<Record<Theme, PresetProps>>>>>>;

export function presetProps(preset: Preset, mode: Mode, theme: Theme): PresetProps {
  return TABLE[preset][mode][theme];
}

/** Personality → motion. Applied from `console` size up; `still` freezes every size. */
export const PERSONALITY: Readonly<Record<Personality, Readonly<{ turn: number; jumpEvery: number; speed: number; paused?: boolean }>>> = Object.freeze({
  lively: Object.freeze({ turn: 1, jumpEvery: 8, speed: 1.1 }),
  calm: Object.freeze({ turn: 0.5, jumpEvery: 0, speed: 0.9 }),
  still: Object.freeze({ turn: 0, jumpEvery: 0, speed: 1, paused: true }),
});

/** Accessories show from `console` size up in Scientist mode, always in Non-scientist mode. */
export function wearsAccessories(preset: Preset, mode: Mode): boolean {
  if (mode === 'non-scientist') return true;
  return preset === 'hero' || preset === 'console';
}
