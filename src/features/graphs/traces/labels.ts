export type LabelPos = 'top' | 'top-right' | 'right' | 'bottom';

export interface LabelInput {
  id: string;
  /** pixel position of the point */
  x: number;
  y: number;
  text: string;
  /** placed first (Best, Q, pinned) */
  priority?: number;
}

export interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

const CHAR_W = 6.2; // mono 10 px
const H = 12;
const GAP = 7;

export function labelBox(l: LabelInput, pos: LabelPos): Box {
  const w = l.text.length * CHAR_W + 2;
  switch (pos) {
    case 'top':
      return { x0: l.x - w / 2, x1: l.x + w / 2, y0: l.y - GAP - H, y1: l.y - GAP };
    case 'top-right':
      return { x0: l.x + 4, x1: l.x + 4 + w, y0: l.y - GAP - H + 2, y1: l.y - GAP + 2 };
    case 'right':
      return { x0: l.x + GAP, x1: l.x + GAP + w, y0: l.y - H / 2, y1: l.y + H / 2 };
    case 'bottom':
      return { x0: l.x - w / 2, x1: l.x + w / 2, y0: l.y + GAP, y1: l.y + GAP + H };
  }
}

export const overlaps = (a: Box, b: Box) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

/**
 * Place short labels without collisions: try top, top-right, right, bottom; hide the label if every spot collides
 * (hidden labels still show on hover). Points themselves count as obstacles.
 */
export function placeLabels(items: LabelInput[], bounds?: Box, pointRadius = 5): Map<string, LabelPos | null> {
  const out = new Map<string, LabelPos | null>();
  const placed: Box[] = [];
  const dots: Box[] = items.map((p) => ({ x0: p.x - pointRadius, x1: p.x + pointRadius, y0: p.y - pointRadius, y1: p.y + pointRadius }));
  const order = [...items].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  for (const l of order) {
    let chosen: LabelPos | null = null;
    for (const pos of ['top', 'top-right', 'right', 'bottom'] as LabelPos[]) {
      const b = labelBox(l, pos);
      if (bounds && (b.x0 < bounds.x0 || b.x1 > bounds.x1 || b.y0 < bounds.y0 || b.y1 > bounds.y1)) continue;
      if (placed.some((p) => overlaps(p, b))) continue;
      if (dots.some((d, i) => items[i].id !== l.id && overlaps(d, b))) continue;
      chosen = pos;
      placed.push(b);
      break;
    }
    out.set(l.id, chosen);
  }
  return out;
}

/** Plotly `textposition` for a label spot. */
export const TEXTPOS: Record<LabelPos, string> = { top: 'top center', 'top-right': 'top right', right: 'middle right', bottom: 'bottom center' };

/** "Triethanolamine (forms soap with stearic acid)" → "Triethanolamine…Stearic Acid" style middle ellipsis. */
export function middleEllipsis(s: string, max = 30): string {
  if (s.length <= max) return s;
  const head = Math.ceil((max - 1) * 0.55);
  const tail = max - 1 - head;
  const cutHead = s.slice(0, head).replace(/\s+\S*$/, '') || s.slice(0, head);
  const tailRaw = s.slice(s.length - tail);
  const cutTail = tailRaw.replace(/^\S*\s+/, '') || tailRaw;
  return `${cutHead.trimEnd()}…${cutTail.replace(/[()]/g, '').trimStart()}`;
}
