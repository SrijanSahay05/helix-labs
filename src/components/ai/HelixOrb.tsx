import { ThinkingOrb } from 'thinking-orbs';
import { useTheme } from '@/store/theme';
import { prefersReducedMotion } from '@/lib/motion';
import { cn } from '@/lib/cn';

export type OrbState = 'working' | 'searching' | 'solving' | 'listening' | 'connecting' | 'weaving' | 'composing' | 'breathing' | 'shaping';
export type OrbSize = 20 | 32 | 64 | 96 | 128 | 168;

const ACCENT = { light: '#6D4AFF', dark: '#AA97FF' };

/**
 * The only loading indicator in Helix — never use a spinner.
 * thinking-orbs ships tuned 20 / 32 / 64 px designs; larger "presence" sizes
 * render the 64 px design and scale it up, with a soft halo behind it.
 */
export function HelixOrb({
  state,
  size = 64,
  speed = 1,
  paused = false,
  className,
}: {
  state: OrbState;
  size?: OrbSize;
  speed?: number;
  paused?: boolean;
  /** breathing glow behind the orb (default on for sizes ≥ 96) */
  halo?: boolean;
  className?: string;
}) {
  const { theme } = useTheme();
  const base: 20 | 32 | 64 = size <= 20 ? 20 : size <= 32 ? 32 : 64;
  const scale = size / base;
  return (
    <span className={cn('relative inline-flex shrink-0 items-center justify-center', className)} style={{ width: size, height: size }} aria-label={`Helix ${state}`} role="img">
      <span style={{ width: base, height: base, transform: scale !== 1 ? `scale(${scale})` : undefined, transformOrigin: 'center', display: 'inline-flex' }}>
        <ThinkingOrb state={state} size={base} speed={speed} theme={theme === 'dark' ? 'dark' : 'light'} color={ACCENT[theme]} paused={paused || prefersReducedMotion()} dotSize={scale > 1 ? 1 / Math.sqrt(scale) + 0.25 : 1} />
      </span>
    </span>
  );
}
