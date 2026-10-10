import { confidenceBand } from '@/lib/status';
import { cn } from '@/lib/cn';

export function ConfidenceMeter({ value, className }: { value: number; className?: string }) {
  const band = confidenceBand(value);
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="relative h-1 w-12 overflow-hidden rounded bg-surface2">
        <span className="absolute inset-y-0 left-0 rounded" style={{ width: `${value * 100}%`, background: `var(--${band})` }} />
      </span>
      <span className="mono text-2xs text-ink2">{value.toFixed(2)}</span>
      {band === 'fail' && <span className="text-2xs font-semibold text-fail">Low</span>}
    </span>
  );
}
