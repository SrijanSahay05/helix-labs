import { useEffect, useState } from 'react';

/** Bots are canvases: at most this many animate at once; the rest render paused. */
export const MAX_ANIMATED = 12;

const holders = new Set<number>();
const waiters = new Set<() => void>();
let seq = 0;

/** Returns true when this bot may animate. First come, first served; slots free up on unmount. */
export function useAnimSlot(want: boolean): boolean {
  const [me] = useState(() => ++seq);
  const [granted, setGranted] = useState(false);
  useEffect(() => {
    if (!want) return;
    const tryAcquire = () => {
      if (holders.has(me)) return;
      if (holders.size < MAX_ANIMATED) {
        holders.add(me);
        setGranted(true);
      }
    };
    tryAcquire();
    waiters.add(tryAcquire);
    return () => {
      waiters.delete(tryAcquire);
      setGranted(false);
      if (holders.delete(me)) waiters.forEach((w) => w());
    };
  }, [want, me]);
  return want && granted;
}

export function animatedCount() {
  return holders.size;
}
