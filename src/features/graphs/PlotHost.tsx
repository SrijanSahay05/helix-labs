import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import type { PlotMouseEvent, PlotSelectionEvent } from 'plotly.js';
import type { Data, Layout } from './plotTypes';
import Plotly from '@/charts/plotly';
import { cn } from '@/lib/cn';
import type { Geom } from './views/common';

export interface Figure {
  data: Data[];
  layout: Partial<Layout>;
}

export interface HoverInfo {
  id: string;
  /** container-relative pixel box of the hovered point */
  box: { x0: number; x1: number; y0: number; y1: number };
  point: Record<string, unknown>;
}

type GD = HTMLDivElement & {
  on: (ev: string, fn: (e: unknown) => void) => void;
  removeAllListeners?: (ev: string) => void;
  _fullLayout?: { _size?: { l: number; t: number; w: number; h: number }; width?: number; height?: number };
};

/**
 * Thin react wrapper over Plotly.react: theme-neutral, no mode bar, events routed to callbacks,
 * ResizeObserver → Plots.resize (100 ms debounce), page scroll wins unless ⌘/Ctrl is held on 2D plots.
 */
export function PlotHost({
  figure,
  ariaLabel,
  is3d,
  onHover,
  onUnhover,
  onClick,
  onSelected,
  onRelayout,
  onRestyle,
  onGeom,
  dimmed,
  className,
  children,
}: {
  figure: Figure;
  ariaLabel: string;
  is3d?: boolean;
  onHover?: (h: HoverInfo) => void;
  onUnhover?: () => void;
  onClick?: (id: string | null, e: MouseEvent | undefined, point: Record<string, unknown> | null) => void;
  onSelected?: (ids: string[] | null) => void;
  onRelayout?: (e: Record<string, unknown>) => void;
  onRestyle?: (e: unknown) => void;
  onGeom?: (g: Geom) => void;
  dimmed?: boolean;
  className?: string;
  children?: (geom: Geom | null) => ReactNode;
}) {
  const ref = useRef<GD>(null);
  const handlers = useRef({ onHover, onUnhover, onClick, onSelected, onRelayout, onRestyle, onGeom });
  useLayoutEffect(() => {
    handlers.current = { onHover, onUnhover, onClick, onSelected, onRelayout, onRestyle, onGeom };
  });
  const [geom, setGeom] = useState<Geom | null>(null);
  const bound = useRef(false);

  const readGeom = () => {
    const gd = ref.current;
    const s = gd?._fullLayout?._size;
    if (!gd || !s) return;
    const g = { l: s.l, t: s.t, w: s.w, h: s.h, width: gd.clientWidth, height: gd.clientHeight };
    setGeom((old) => (old && old.l === g.l && old.t === g.t && old.w === g.w && old.h === g.h && old.width === g.width ? old : g));
    handlers.current.onGeom?.(g);
  };

  useEffect(() => {
    const gd = ref.current;
    if (!gd) return;
    let alive = true;
    void Plotly.react(gd, figure.data as never, figure.layout as never, { displayModeBar: false, displaylogo: false, responsive: false, scrollZoom: true, doubleClick: 'reset' }).then(() => {
      if (!alive) return;
      readGeom();
      if (bound.current) return;
      bound.current = true;
      gd.on('plotly_hover', (ev) => {
        const e = ev as PlotMouseEvent & { points: (PlotMouseEvent['points'][number] & { bbox?: HoverInfo['box'] })[] };
        const p = e.points?.[0];
        if (!p) return;
        const id = (p.customdata as unknown as string) ?? (p.data as { customdata?: unknown })?.customdata;
        if (typeof id !== 'string') return;
        const box = p.bbox ?? { x0: 0, x1: 0, y0: 0, y1: 0 };
        handlers.current.onHover?.({ id, box, point: p as unknown as Record<string, unknown> });
      });
      gd.on('plotly_unhover', () => handlers.current.onUnhover?.());
      gd.on('plotly_click', (ev) => {
        const e = ev as PlotMouseEvent;
        const p = e.points?.[0];
        const id = p ? (p.customdata as unknown as string) : null;
        handlers.current.onClick?.(typeof id === 'string' ? id : null, e.event as MouseEvent | undefined, (p as unknown as Record<string, unknown>) ?? null);
      });
      gd.on('plotly_selected', (ev) => {
        const e = ev as PlotSelectionEvent | undefined;
        if (!e) return handlers.current.onSelected?.(null);
        const ids = e.points.map((p) => p.customdata as unknown as string).filter((x) => typeof x === 'string');
        handlers.current.onSelected?.([...new Set(ids)]);
      });
      gd.on('plotly_deselect', () => handlers.current.onSelected?.(null));
      gd.on('plotly_relayout', (ev) => {
        handlers.current.onRelayout?.(ev as Record<string, unknown>);
        readGeom();
      });
      gd.on('plotly_restyle', (ev) => handlers.current.onRestyle?.(ev));
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [figure]);

  // resize: debounced 100 ms
  useEffect(() => {
    const gd = ref.current;
    if (!gd) return;
    let t: ReturnType<typeof setTimeout>;
    const ro = new ResizeObserver(() => {
      clearTimeout(t);
      t = setTimeout(() => {
        void Promise.resolve(Plotly.Plots.resize(gd)).then(readGeom);
      }, 100);
    });
    ro.observe(gd);
    return () => {
      clearTimeout(t);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () => () => {
      if (ref.current) Plotly.purge(ref.current);
    },
    [],
  );

  // page scroll wins over wheel-zoom unless ⌘/Ctrl is held (2D only; 3D zooms on wheel)
  useEffect(() => {
    const gd = ref.current;
    if (!gd || is3d) return;
    const h = (e: WheelEvent) => {
      if (!e.metaKey && !e.ctrlKey) e.stopPropagation();
    };
    gd.addEventListener('wheel', h, { capture: true });
    return () => gd.removeEventListener('wheel', h, { capture: true });
  }, [is3d]);

  return (
    <div className={cn('relative h-full w-full', className)} role="img" aria-label={ariaLabel}>
      <div ref={ref} className={cn('absolute inset-0 transition-opacity duration-150', dimmed && 'opacity-40')} />
      {children?.(geom)}
    </div>
  );
}
