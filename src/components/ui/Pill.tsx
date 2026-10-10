import { CheckCircle2, AlertTriangle, XCircle, Clock, Circle, Lock } from 'lucide-react';
import type { StageStatus, Status } from '@/types';
import { cn } from '@/lib/cn';
import { HelixOrb, type OrbState } from '@/components/ai/HelixOrb';
import { STATUS_LABEL } from '@/lib/status';

const TONE: Record<string, string> = {
  pass: 'text-pass bg-[var(--pass-soft)]',
  borderline: 'text-borderline bg-[var(--borderline-soft)]',
  fail: 'text-fail bg-[var(--fail-soft)]',
  pending: 'text-ink2 bg-surface2 border border-dashed border-line',
  accent: 'text-accent bg-accent-soft',
  neutral: 'text-ink2 bg-surface2',
};
const RING = 'shadow-[inset_0_0_0_1px_color-mix(in_srgb,currentColor_14%,transparent)]';

/** Pass / borderline / fail — always colour plus a text label. */
export function StatusPill({ status, className, label }: { status: Status; className?: string; label?: string }) {
  const Icon = status === 'pass' ? CheckCircle2 : status === 'borderline' ? AlertTriangle : status === 'fail' ? XCircle : Clock;
  return (
    <span data-status={status} className={cn('inline-flex h-[22px] items-center gap-1 whitespace-nowrap rounded-[6px] px-2 text-2xs font-semibold', RING, TONE[status], className)}>
      <Icon size={11} strokeWidth={2.5} />
      {label ?? STATUS_LABEL[status]}
    </span>
  );
}

export function Tag({ tone = 'neutral', children, className }: { tone?: keyof typeof TONE; children: React.ReactNode; className?: string }) {
  return <span className={cn('inline-flex h-[22px] items-center gap-1 whitespace-nowrap rounded-[6px] px-2 text-2xs font-medium', RING, TONE[tone], className)}>{children}</span>;
}

const STAGE_LABEL: Record<StageStatus, string> = {
  waiting: 'Waiting',
  running: 'Running',
  complete: 'Complete',
  failed: 'Failed',
  'low-confidence': 'Low confidence',
};

export function StagePill({ status, orb = 'working', className, hideOrb }: { status: StageStatus; orb?: OrbState; className?: string; hideOrb?: boolean }) {
  const tone = status === 'complete' ? 'accent' : status === 'failed' ? 'fail' : status === 'low-confidence' ? 'borderline' : status === 'running' ? 'accent' : 'neutral';
  return (
    <span className={cn('inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-2xs font-semibold transition-colors duration-300', RING, TONE[tone], className)}>
      {status === 'running' ? (
        hideOrb ? <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" /> : <HelixOrb state={orb} size={20} />
      ) : status === 'complete' ? (
        <CheckCircle2 size={12} />
      ) : status === 'failed' ? (
        <XCircle size={12} />
      ) : status === 'low-confidence' ? (
        <AlertTriangle size={12} />
      ) : (
        <Circle size={11} />
      )}
      {STAGE_LABEL[status]}
    </span>
  );
}

export function ReadOnlyBanner({ text = 'Read-only' }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-line bg-surface2 px-3 py-1.5 text-xs text-ink2">
      <Lock size={12} /> {text}
    </div>
  );
}
