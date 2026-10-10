import type { Operator, Status } from '@/types';

/** Borderline band = within 10 % short of the target. */
export const BORDERLINE_BAND = 0.1;

export function statusFor(value: number | undefined, operator: Operator, target: number | [number, number]): Status {
  if (value === undefined || Number.isNaN(value)) return 'pending';
  const eps = 1e-9;
  if (operator === 'between' && Array.isArray(target)) {
    const [a, b] = target;
    if (value >= a - eps && value <= b + eps) return 'pass';
    if (value >= a - Math.abs(a) * BORDERLINE_BAND && value <= b + Math.abs(b) * BORDERLINE_BAND) return 'borderline';
    return 'fail';
  }
  const t = Array.isArray(target) ? target[0] : target;
  if (operator === '>=') {
    if (value >= t - eps) return 'pass';
    if (value >= t * (1 - BORDERLINE_BAND) - eps) return 'borderline';
    return 'fail';
  }
  if (operator === '<=') {
    if (value <= t + eps) return 'pass';
    if (value <= t * (1 + BORDERLINE_BAND) + eps) return 'borderline';
    return 'fail';
  }
  // '='
  const dev = Math.abs(value - t) / (Math.abs(t) || 1);
  if (dev <= 0.02) return 'pass';
  if (dev <= BORDERLINE_BAND) return 'borderline';
  return 'fail';
}

export const STATUS_LABEL: Record<Status, string> = {
  pass: 'Pass',
  borderline: 'Borderline',
  fail: 'Fail',
  pending: 'Pending',
};

export function confidenceBand(c: number): 'pass' | 'borderline' | 'fail' {
  if (c >= 0.85) return 'pass';
  if (c >= 0.7) return 'borderline';
  return 'fail';
}
