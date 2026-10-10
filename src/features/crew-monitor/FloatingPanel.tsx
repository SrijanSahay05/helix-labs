import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Popover rendered in a portal and anchored to the right of its trigger, so it escapes the sidebar's
 * scroll container. Opens on click (or hover when `hover`), closes on outside click / Escape.
 */
export function FloatingPanel({ trigger, children, width = 300, hover = false, label }: { trigger: (open: boolean) => ReactNode; children: (close: () => void) => ReactNode; width?: number; hover?: boolean; label: string }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });
  const anchor = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useLayoutEffect(() => {
    if (!open || !anchor.current) return;
    const r = anchor.current.getBoundingClientRect();
    const h = panel.current?.offsetHeight ?? 240;
    setPos({ left: r.right + 8, top: Math.max(8, Math.min(window.innerHeight - h - 8, r.top - 8)) });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const click = (e: MouseEvent) => !anchor.current?.contains(e.target as Node) && !panel.current?.contains(e.target as Node) && setOpen(false);
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', click);
    window.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', click);
      window.removeEventListener('keydown', key);
    };
  }, [open]);

  const enter = () => {
    clearTimeout(closeTimer.current);
    if (hover) setOpen(true);
  };
  const leave = () => {
    if (!hover) return;
    closeTimer.current = setTimeout(() => setOpen(false), 180);
  };

  return (
    <>
      <div ref={anchor} onClick={() => !hover && setOpen((o) => !o)} onMouseEnter={enter} onMouseLeave={leave}>
        {trigger(open)}
      </div>
      {open &&
        createPortal(
          <div ref={panel} role="dialog" aria-label={label} onMouseEnter={enter} onMouseLeave={leave} className="fixed z-[80] rounded-xl border border-line bg-surface p-3 shadow-pop" style={{ left: pos.left, top: pos.top, width }}>
            {children(() => setOpen(false))}
          </div>,
          document.body,
        )}
    </>
  );
}
