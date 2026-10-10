import type { ResultDef } from '../types';
import type { Colorscale } from '../store';

/** "Helix Lab" — matches the reference: deep navy → teal → sage → orange. */
export const HELIX_LAB: [number, string][] = [
  [0, '#1E2A47'],
  [0.35, '#2C5F73'],
  [0.6, '#4E9A97'],
  [0.8, '#9DB38A'],
  [1, '#F59E0B'],
];
export const DIVERGING: [number, string][] = [
  [0, '#2C5F73'],
  [0.5, '#EDEAE2'],
  [1, '#B4462F'],
];
export const GREYS: [number, string][] = [
  [0, '#F1F2F5'],
  [1, '#3A3F4B'],
];

export const BEST = '#F59E0B';

export interface ScaleSpec {
  colorscale: string | [number, string][];
  reversescale: boolean;
  cmid?: number;
  note?: string;
}

/** Direction-aware: "good" is always orange; target results use a diverging scale centred on the target. */
export function scaleFor(choice: Colorscale, def?: ResultDef): ScaleSpec {
  if (def?.direction === 'target' && (choice === 'helix' || choice === 'diverging') && def.target !== undefined) {
    return { colorscale: DIVERGING, reversescale: false, cmid: def.target, note: `centred on target ${fmt(def.target)}` };
  }
  if (choice === 'diverging' && def?.target !== undefined) return { colorscale: DIVERGING, reversescale: false, cmid: def.target, note: `centred on target ${fmt(def.target)}` };
  const reverse = def?.direction === 'minimize';
  if (choice === 'viridis') return { colorscale: 'Viridis', reversescale: reverse };
  if (choice === 'cividis') return { colorscale: 'Cividis', reversescale: reverse };
  return { colorscale: HELIX_LAB, reversescale: reverse };
}

/** Sample a colour scale at t ∈ [0, 1] (for parcoords composite scales and legends). */
export function sample(scale: [number, string][], t: number): string {
  const x = Math.min(1, Math.max(0, t));
  for (let i = 1; i < scale.length; i++) {
    const [p1, c1] = scale[i];
    const [p0, c0] = scale[i - 1];
    if (x <= p1) {
      const k = (x - p0) / (p1 - p0 || 1);
      const a = hex(c0);
      const b = hex(c1);
      return `rgb(${a.map((v, j) => Math.round(v + (b[j] - v) * k)).join(',')})`;
    }
  }
  return scale[scale.length - 1][1];
}

function hex(c: string): [number, number, number] {
  const h = c.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function fmt(v: number | null | undefined, unit?: string): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—';
  const a = Math.abs(v);
  const s = a >= 1000 ? Math.round(v).toLocaleString('en-US') : a >= 100 ? v.toFixed(1) : v.toFixed(2);
  return unit ? `${s} ${unit}` : s;
}
