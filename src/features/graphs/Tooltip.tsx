import { useEffect, useState } from 'react';
import { agentName } from '@/store/agents';
import type { AgentId } from '@/agents/registry';
import { fmt } from './traces/colorscales';
import { middleEllipsis } from './traces/labels';
import type { GTrial, Suggestion } from './types';

export interface TipData {
  box: { x0: number; x1: number; y0: number; y1: number };
  trial?: GTrial;
  suggestion?: Suggestion;
  lines: { name: string; value: string }[];
  extra?: string[];
  best?: boolean;
  ei?: number;
}

/** Dark tooltip that follows the point (not the mouse), shown after 60 ms. */
export function Tooltip({ tip, width }: { tip: TipData | null; width: number }) {
  const [shown, setShown] = useState<TipData | null>(null);
  useEffect(() => {
    if (!tip) return setShown(null);
    const t = setTimeout(() => setShown(tip), 60);
    return () => clearTimeout(t);
  }, [tip]);
  if (!shown) return null;
  const cx = (shown.box.x0 + shown.box.x1) / 2;
  const right = cx > width - 260;
  const style = { left: right ? undefined : cx + 14, right: right ? width - cx + 14 : undefined, top: Math.max(4, shown.box.y0 - 10) };
  const t = shown.trial;
  const q = shown.suggestion;
  return (
    <div role="tooltip" className="pointer-events-none absolute z-30 w-max max-w-[300px] rounded-lg bg-[#0E1116] px-3 py-2 text-[12px] leading-5 text-white shadow-pop" style={style}>
      <div className="flex items-center gap-2">
        <b className="font-semibold">{q ? 'Q Suggestion' : t?.name}</b>
        {shown.best && <span className="rounded bg-[#F59E0B] px-1 text-[10px] font-semibold text-[#0E1116]">★ Best</span>}
        {t?.status === 'pending' && <span className="rounded border border-white/30 px-1 text-[10px]">Pending</span>}
        {t?.status === 'failed' && <span className="rounded bg-white/15 px-1 text-[10px]">Failed</span>}
      </div>
      {q && <div className="text-[11px] text-white/60">next trial proposed by Delta</div>}
      {shown.lines.map((l) => (
        <div key={l.name} className="flex justify-between gap-4">
          <span className="text-white/70">{middleEllipsis(l.name, 28)}:</span>
          <span className="mono">{l.value}</span>
        </div>
      ))}
      {shown.extra?.map((e) => (
        <div key={e} className="text-white/85">
          {e}
        </div>
      ))}
      {q && shown.ei !== undefined && <div className="mono text-[11px] text-white/70">Expected improvement {fmt(shown.ei)}</div>}
      {t && (
        <div className="mt-0.5 text-[11px] text-white/50">
          Iteration {t.iteration} · by {t.createdBy.kind === 'agent' ? agentName(t.createdBy.id as AgentId) : t.createdBy.id}
        </div>
      )}
      <div className="text-[11px] text-white/40">{q ? 'Click for “Why here?”' : 'Click to pin'}</div>
    </div>
  );
}
