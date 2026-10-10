import type { Operator, TargetRow } from '@/types';

export const fmt = (n: number | undefined, d = 2) => (n === undefined || Number.isNaN(n) ? '—' : n.toFixed(d));
export const inr = (n: number | undefined, d = 2) => (n === undefined ? '—' : `₹ ${n.toFixed(d)}`);
export const pct = (n: number, d = 2) => `${n.toFixed(d)} %`;

export const OP_LABEL: Record<Operator, string> = { '>=': '≥', '<=': '≤', '=': '=', between: 'between' };

export function targetText(r: Pick<TargetRow, 'operator' | 'value'>): string {
  if (r.operator === 'between' && Array.isArray(r.value)) return `${r.value[0]} – ${r.value[1]}`;
  const v = Array.isArray(r.value) ? r.value[0] : r.value;
  return `${OP_LABEL[r.operator]} ${v}`;
}

export function elapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const ds = Math.floor((ms % 1000) / 100);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}.${ds}`;
}

export function stamp(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}.${String(ms % 1000).padStart(3, '0')}`;
}

export function shortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function daysUntil(iso: string, now = new Date()): number {
  return Math.ceil((new Date(iso).getTime() - now.getTime()) / 86400000);
}

export function uid(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function domainOf(input: string): string | null {
  try {
    const u = new URL(input.trim().startsWith('http') ? input.trim() : `https://${input.trim()}`);
    if (!u.hostname.includes('.')) return null;
    return u.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

export function isUrl(input: string): boolean {
  return /^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(input.trim());
}
