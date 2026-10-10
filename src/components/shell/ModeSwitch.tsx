import { motion } from 'framer-motion';
import { FlaskConical, HardHat } from 'lucide-react';
import { useUI } from '@/store/ui';
import { useProjects } from '@/store/project';
import type { Mode } from '@/types';
import { notifyInfo } from '@/agent/notify';
import { COPY } from '@/data/copy';
import { cn } from '@/lib/cn';

export function switchMode(m: Mode) {
  const ui = useUI.getState();
  if (ui.mode === m) return;
  ui.setMode(m, true);
  const pr = useProjects.getState();
  if (pr.draft.mode) pr.patchDraft({ mode: m });
  notifyInfo(COPY['mode.toast'][m]);
}

export function ModeSwitch({ full }: { full?: boolean }) {
  const mode = useUI((s) => s.mode);
  const opts: { id: Mode; label: string; icon: typeof FlaskConical }[] = [
    { id: 'scientist', label: 'Scientist', icon: FlaskConical },
    { id: 'non-scientist', label: 'Non-scientist', icon: HardHat },
  ];
  return (
    <div className={cn('inline-flex rounded-[10px] bg-surface2 p-1', full && 'w-full')} role="radiogroup" aria-label="Who is using Helix">
      {opts.map((o) => (
        <button
          key={o.id}
          role="radio"
          aria-checked={mode === o.id}
          onClick={() => switchMode(o.id)}
          className={cn('relative flex h-7 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 text-xs font-medium', mode === o.id ? 'text-ink' : 'text-ink2 hover:text-ink')}
        >
          {mode === o.id && <motion.span layoutId={full ? 'mode-pill-full' : 'mode-pill'} className="absolute inset-0 rounded-md bg-surface shadow-[0_2px_8px_rgba(0,0,0,0.06)]" />}
          <o.icon size={13} className="relative" />
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  );
}
