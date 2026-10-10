import { useRef, useState } from 'react';
import { fmt } from './traces/colorscales';
import type { Geom } from './views/common';

/**
 * Drag on the colour bar to filter points to a value range. Sits over Plotly's colour bar
 * (x = 1.02 paper, 180 px tall, vertically centred) and writes filters.ranges[colorBy].
 */
export function ColorbarBrush({ geom, min, max, range, onRange, x = 1.02 }: { geom: Geom; min: number; max: number; range?: [number, number]; onRange: (r: [number, number] | null) => void; x?: number }) {
  const top = geom.t + geom.h / 2 - 90;
  const left = geom.l + geom.w * x;
  const [drag, setDrag] = useState<[number, number] | null>(null);
  const start = useRef<number | null>(null);
  const toVal = (py: number) => max - (Math.min(180, Math.max(0, py)) / 180) * (max - min);
  const toPy = (v: number) => ((max - v) / (max - min || 1)) * 180;
  const shown = drag ?? (range ? [toPy(range[1]), toPy(range[0])] : null);
  return (
    <div
      className="absolute z-10 cursor-ns-resize"
      style={{ left: left - 4, top, width: 22, height: 180 }}
      title="Drag to filter by value · double-click to clear"
      onPointerDown={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        start.current = e.clientY - r.top;
        setDrag([start.current, start.current]);
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (start.current === null) return;
        const r = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - r.top;
        setDrag([Math.min(start.current, y), Math.max(start.current, y)]);
      }}
      onPointerUp={() => {
        if (drag && drag[1] - drag[0] > 4) onRange([toVal(drag[1]), toVal(drag[0])]);
        start.current = null;
        setDrag(null);
      }}
      onDoubleClick={() => onRange(null)}
    >
      {shown && (
        <>
          <div className="absolute left-0 right-0 rounded-sm border-2 border-[var(--text)] bg-white/10" style={{ top: shown[0], height: Math.max(2, shown[1] - shown[0]) }} />
          <span className="mono absolute right-full mr-1 whitespace-nowrap rounded bg-surface/90 px-1 text-[10px] text-ink" style={{ top: shown[0] - 6 }}>
            {fmt(toVal(shown[0]))}
          </span>
          <span className="mono absolute right-full mr-1 whitespace-nowrap rounded bg-surface/90 px-1 text-[10px] text-ink" style={{ top: shown[1] - 6 }}>
            {fmt(toVal(shown[1]))}
          </span>
        </>
      )}
    </div>
  );
}
