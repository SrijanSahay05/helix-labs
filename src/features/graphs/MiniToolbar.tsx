import { BoxSelect, Hand, Lasso, Maximize2, RefreshCw, RotateCw, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { DragMode } from './store';

const BTN = 'grid h-7 w-7 place-items-center rounded-md text-ink2 hover:bg-surface2 hover:text-ink';

/** Floating mini-toolbar, top-left of the plot: interaction modes (2D) or camera presets (3D). */
export function MiniToolbar({
  is3d,
  mode,
  setMode,
  onReset,
  onCamera,
  autoRotate,
  setAutoRotate,
  canSelect = true,
}: {
  is3d: boolean;
  mode: DragMode;
  setMode: (m: DragMode) => void;
  onReset: () => void;
  onCamera?: (p: 'iso' | 'top' | 'front' | 'side') => void;
  autoRotate?: boolean;
  setAutoRotate?: (v: boolean) => void;
  canSelect?: boolean;
}) {
  return (
    <div className="absolute left-2 top-2 z-20 flex items-center gap-0.5 rounded-lg border border-line bg-surface/90 p-0.5 shadow-card backdrop-blur" role="toolbar" aria-label="Plot tools">
      {is3d ? (
        <>
          {(['iso', 'top', 'front', 'side'] as const).map((p) => (
            <button key={p} onClick={() => onCamera?.(p)} className="h-7 rounded-md px-2 text-[11px] font-medium text-ink2 hover:bg-surface2 hover:text-ink" title={`Camera: ${p === 'iso' ? 'Iso' : p === 'top' ? 'Top (XY)' : p === 'front' ? 'Front (XZ)' : 'Side (YZ)'}`}>
              {p === 'iso' ? 'Iso' : p === 'top' ? 'Top' : p === 'front' ? 'Front' : 'Side'}
            </button>
          ))}
          <span className="mx-0.5 h-4 w-px bg-line" />
          <button onClick={() => setAutoRotate?.(!autoRotate)} className={cn(BTN, autoRotate && 'bg-accent-soft text-accent')} title="Auto-rotate (8 s per turn, pauses on interaction)" aria-pressed={autoRotate}>
            <RotateCw size={14} />
          </button>
        </>
      ) : (
        <>
          {(
            [
              ['pan', Hand, 'Pan'],
              ['select', BoxSelect, 'Box select'],
              ['lasso', Lasso, 'Lasso'],
              ['zoom', ZoomIn, 'Zoom'],
            ] as const
          ).map(([m, Icon, label]) =>
            !canSelect && (m === 'select' || m === 'lasso') ? null : (
              <button key={m} onClick={() => setMode(m)} className={cn(BTN, mode === m && 'bg-accent-soft text-accent')} title={label} aria-pressed={mode === m}>
                <Icon size={14} />
              </button>
            ),
          )}
        </>
      )}
      <span className="mx-0.5 h-4 w-px bg-line" />
      <button onClick={onReset} className={BTN} title="Reset view">
        {is3d ? <RefreshCw size={13} /> : <Maximize2 size={13} />}
      </button>
    </div>
  );
}
