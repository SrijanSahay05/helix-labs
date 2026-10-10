import { hashString } from '@/lib/motion';

/** Stable 0..1 seed from a string, so rows of bots don't blink or hop in unison. */
export function hash01(s: string): number {
  return (hashString(s) % 10007) / 10007;
}
