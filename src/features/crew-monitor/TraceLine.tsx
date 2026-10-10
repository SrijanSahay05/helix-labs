import { useEffect, useState } from 'react';
import { prefersReducedMotion } from '@/lib/motion';
import { useUI } from '@/store/ui';

/** Latest engine line typed in at 28 ms/char with a blinking accent caret (instant under reduced motion). */
export function TraceLine({ text }: { text: string | null }) {
  const motion = useUI((s) => s.botMotion);
  const still = prefersReducedMotion() || motion === 'still';
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!text) return;
    if (still) return setN(text.length);
    setN(0);
    const t = setInterval(() => setN((x) => (x >= text.length ? (clearInterval(t), x) : x + 1)), 28);
    return () => clearInterval(t);
  }, [text, still]);
  if (!text) return null;
  return (
    <div className="mono mt-1.5 flex min-w-0 items-center text-[10.5px] leading-4 text-ink2" title={text} aria-live="polite">
      <span className="truncate">{text.slice(0, n)}</span>
      {!still && <span className="ml-px inline-block h-3 w-[2px] shrink-0 animate-pulse bg-accent" aria-hidden />}
    </div>
  );
}
