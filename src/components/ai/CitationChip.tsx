import { ExternalLink } from 'lucide-react';
import type { Source } from '@/types';
import { Popover } from '@/components/ui/primitives';
import { Tag } from '@/components/ui/Pill';

export function SourceTypeTag({ type }: { type: Source['type'] }) {
  const tone = type === 'Paper' ? 'accent' : type === 'Patent' ? 'borderline' : type === 'Uploaded' || type === 'Internal formulation' ? 'pass' : 'neutral';
  return <Tag tone={tone}>{type}</Tag>;
}

export function CitationChip({ n, source, onOpen }: { n: number | string; source?: Source; onOpen?: () => void }) {
  return (
    <Popover
      width={320}
      trigger={() => (
        <button type="button" className="mono inline-flex h-5 items-center rounded border border-accent/30 bg-accent-soft px-1 text-[10px] font-semibold text-accent hover:brightness-95">
          [{n}]
        </button>
      )}
    >
      {(close) =>
        source ? (
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <SourceTypeTag type={source.type} />
              <span className="mono text-ink3">{source.year}</span>
            </div>
            <div className="font-medium text-ink">{source.title}</div>
            <div className="text-ink2">{source.snippet ?? source.finding}</div>
            {onOpen && (
              <button className="flex items-center gap-1 pt-1 font-medium text-accent" onClick={() => (onOpen(), close())}>
                <ExternalLink size={12} /> Open
              </button>
            )}
          </div>
        ) : (
          <div className="text-xs text-ink2">Source not loaded yet — run Literature first.</div>
        )
      }
    </Popover>
  );
}
