import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import { NOVYTE } from './novyte.config';

/** "Live preview / Novyte" segmented toggle shown in an act header when a screenshot exists. */
export function NovyteToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="inline-flex h-8 rounded-lg bg-surface2 p-0.5" role="tablist" aria-label="Preview source">
      {[
        { v: false, label: 'Live preview' },
        { v: true, label: 'Novyte' },
      ].map((o) => (
        <button key={o.label} type="button" role="tab" aria-selected={value === o.v} onClick={() => onChange(o.v)} className={cn('h-7 rounded-md px-3 text-xs font-medium transition-colors', value === o.v ? 'bg-surface text-ink shadow-[inset_0_0_0_1px_var(--line)]' : 'text-ink2 hover:text-ink')}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Novyte screenshot in a browser frame with numbered callouts; click to zoom. */
export function NovyteShowcase({ kind, src }: { kind: 'literature' | 'pathways'; src?: string }) {
  const cfg = NOVYTE[kind];
  const url = src ?? cfg.src;
  const [zoom, setZoom] = useState(false);
  const [hot, setHot] = useState<number | null>(null);
  if (!url) return null;
  return (
    <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-card">
        <div className="flex h-8 items-center gap-1.5 border-b border-line bg-surface2 px-3">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-2.5 w-2.5 rounded-full bg-line" />
          ))}
          <span className="mono ml-3 truncate text-2xs text-ink3">novyte.app / {kind === 'literature' ? 'literature-review' : 'synthesis-pathways'}</span>
        </div>
        <button type="button" onClick={() => setZoom(true)} className="relative block w-full cursor-zoom-in" aria-label="Zoom screenshot">
          <img src={url} alt={cfg.alt} className="block max-h-[640px] w-full object-contain" />
          {cfg.callouts.map((c) => (
            <span
              key={c.n}
              onPointerEnter={() => setHot(c.n)}
              onPointerLeave={() => setHot(null)}
              className={cn('absolute grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-surface text-xs font-bold shadow-pop transition-transform', hot === c.n ? 'scale-110 bg-accent text-on-accent' : 'bg-accent text-on-accent')}
              style={{ left: `${c.x}%`, top: `${c.y}%` }}
            >
              {c.n}
            </span>
          ))}
        </button>
      </div>
      <ol className="space-y-2">
        {cfg.callouts.map((c) => (
          <li key={c.n} onPointerEnter={() => setHot(c.n)} onPointerLeave={() => setHot(null)} className={cn('flex items-start gap-3 rounded-lg border p-3 text-sm transition-colors', hot === c.n ? 'border-accent bg-accent-soft/50' : 'border-line')}>
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-2xs font-bold text-on-accent">{c.n}</span>
            <span className="leading-6 text-ink">{c.caption}</span>
          </li>
        ))}
      </ol>
      <AnimatePresence>
        {zoom && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setZoom(false)} className="fixed inset-0 z-[60] grid cursor-zoom-out place-items-center bg-[#111322cc] p-8">
            <img src={url} alt={cfg.alt} className="max-h-full max-w-full rounded-lg object-contain shadow-pop" />
            <button type="button" className="absolute right-6 top-6 grid h-9 w-9 place-items-center rounded-full bg-surface text-ink" aria-label="Close">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
