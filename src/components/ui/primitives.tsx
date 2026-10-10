import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { EASE } from '@/lib/motion';

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('card', className)} {...rest}>
      {children}
    </div>
  );
}

/** Page header: serif title, muted description, actions on the right (stack on small screens). */
export function PageHeader({ eyebrow, title, sub, right }: { eyebrow?: ReactNode; title: ReactNode; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div className="page-header">
      <div className="min-w-0 max-w-3xl">
        {eyebrow && <div className="eyebrow mb-2 text-accent">{eyebrow}</div>}
        <h1 className="h1">{title}</h1>
        {sub && <p className="lead mt-2">{sub}</p>}
      </div>
      {right && <div className="flex flex-wrap items-center gap-2">{right}</div>}
    </div>
  );
}
export const SectionTitle = PageHeader;

/** Section heading inside a page or panel. */
export function SectionHeading({ title, sub, right }: { title: ReactNode; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="h3">{title}</h2>
        {sub && <p className="mt-0.5 text-xs text-ink2">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, items, className }: { value: T; onChange: (v: T) => void; items: { id: T; label: ReactNode }[]; className?: string }) {
  return (
    <div className={cn('scroll-thin inline-flex max-w-full overflow-x-auto rounded-lg bg-surface2 p-1', className)}>
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => onChange(it.id)}
          className={cn('relative h-8 whitespace-nowrap rounded-md px-3.5 text-xs font-medium transition-colors', value === it.id ? 'text-ink' : 'text-ink2 hover:text-ink')}
        >
          {value === it.id && <motion.span layoutId={`tab-${items.map((i) => i.id).join('')}`} className="absolute inset-0 rounded-md bg-surface shadow-[inset_0_0_0_1px_var(--line),0_1px_4px_#00000010]" transition={{ duration: 0.2, ease: EASE }} />}
          <span className="relative">{it.label}</span>
        </button>
      ))}
    </div>
  );
}

export function Chip({ active, onClick, children, className, disabled }: { active?: boolean; onClick?: () => void; children: ReactNode; className?: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-xs font-medium transition-colors disabled:opacity-40',
        active ? 'border-accent bg-accent-soft text-accent' : 'border-line bg-surface text-ink2 hover:border-ink3 hover:text-ink',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: ReactNode }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn('relative h-5 w-9 rounded-full transition-colors', checked ? 'bg-accent' : 'bg-line')}
      >
        <motion.span layout transition={{ type: 'spring', stiffness: 500, damping: 32 }} className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow', checked ? 'right-0.5' : 'left-0.5')} />
      </button>
      {label}
    </label>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton h-3', className)} />;
}

export function Drawer({ open, onClose, title, children, width = 520 }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; width?: number }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-40 bg-black/20" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            className="fixed right-0 top-0 z-50 flex h-full max-w-full flex-col border-l border-line bg-surface shadow-pop"
            style={{ width }}
            initial={{ x: width }}
            animate={{ x: 0 }}
            exit={{ x: width }}
            transition={{ duration: 0.26, ease: EASE }}
          >
            <div className="flex h-[60px] items-center justify-between border-b border-line px-5">
              <div className="font-display text-lg font-semibold">{title}</div>
              <button onClick={onClose} className="rounded p-1 text-ink3 hover:bg-surface2 hover:text-ink">
                <X size={16} />
              </button>
            </div>
            <div className="scroll-thin flex-1 overflow-auto p-5">{children}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export function Modal({ open, onClose, title, children, width = 560 }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; width?: number }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-start justify-center bg-[#11132266] p-4 pt-[10vh] backdrop-blur-[4px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[84vh] max-w-full overflow-auto rounded-xl border border-line bg-surface shadow-pop"
            style={{ width }}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            transition={{ duration: 0.22, ease: EASE }}
          >
            <div className="flex h-14 items-center justify-between border-b border-line px-6">
              <div className="font-display text-xl font-semibold">{title}</div>
              <button onClick={onClose} className="rounded p-1 text-ink3 hover:bg-surface2 hover:text-ink">
                <X size={16} />
              </button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Click-to-open popover anchored under its trigger. */
export function Popover({ trigger, children, align = 'left', width = 300 }: { trigger: (open: boolean) => ReactNode; children: (close: () => void) => ReactNode; align?: 'left' | 'right'; width?: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  return (
    <div ref={ref} className="relative inline-flex">
      <span onClick={() => setOpen((o) => !o)} className="inline-flex">
        {trigger(open)}
      </span>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className={cn('absolute top-full z-50 mt-1.5 rounded-lg border border-line bg-surface p-3 text-sm shadow-pop', align === 'right' ? 'right-0' : 'left-0')}
            style={{ width }}
          >
            {children(() => setOpen(false))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Field({ label, children, hint, className }: { label: ReactNode; children: ReactNode; hint?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="text-2xs text-ink3">{hint}</span>}
    </div>
  );
}

export function Select({ value, onChange, options, className }: { value: string; onChange: (v: string) => void; options: (string | { value: string; label: string })[]; className?: string }) {
  return (
    <select className={cn('input pr-7', className)} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => {
        const v = typeof o === 'string' ? o : o.value;
        const l = typeof o === 'string' ? o : o.label;
        return (
          <option key={v} value={v}>
            {l}
          </option>
        );
      })}
    </select>
  );
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('h-[2px] w-full overflow-hidden bg-line', className)}>
      <motion.div className="h-full bg-accent" initial={false} animate={{ width: `${Math.round(value * 100)}%` }} transition={{ duration: 0.3 }} />
    </div>
  );
}

export function ScoreBar({ value, label, tone = 'accent' }: { value: number; label: string; tone?: 'accent' | 'pass' | 'borderline' | 'fail' }) {
  return (
    <div className="flex items-center gap-2 text-2xs">
      <span className="w-20 text-ink3">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded bg-surface2">
        <motion.div className="h-full rounded" style={{ background: `var(--${tone})` }} initial={{ width: 0 }} animate={{ width: `${value * 100}%` }} transition={{ duration: 0.6, ease: EASE }} />
      </div>
      <span className="mono w-8 text-right text-ink2">{value.toFixed(2)}</span>
    </div>
  );
}
