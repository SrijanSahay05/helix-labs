import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AgentBot } from '@/components/agents/AgentBot';
import { cn } from '@/lib/cn';
import { FloatingPanel } from './FloatingPanel';
import { shortDue, type AttentionItem, type PendingTest } from './selectors';


/** "2 · Need you · Approve, check fields" → popover of items with the agent's micro bot and a jump link. */
export function NeedYouLine({ items, highlight }: { items: AttentionItem[]; highlight?: boolean }) {
  const nav = useNavigate();
  if (!items.length) return null;
  const kinds = [...new Set(items.map((i) => i.text.split(' ')[0]))].join(', ');
  return (
    <FloatingPanel
      label="Needs you"
      trigger={(open) => (
        <button className={cn('flex h-10 w-full items-center gap-3 rounded-[10px] px-2.5 text-left text-[13px] transition-colors', (open || highlight) ? 'bg-[#F6F4FF]' : 'hover:bg-surface2/70')} title={`${items.length} need you: ${kinds}`}>
          <span className="grid h-6 min-w-[24px] place-items-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-white">{items.length}</span>
          <span className="font-semibold text-ink">Need you</span>
          <span className="flex flex-1 items-center justify-end gap-1 text-[12px] font-medium text-ink3">
            Check <ChevronRight size={14} className="opacity-70" />
          </span>
        </button>
      )}
    >
      {(close) => (
        <div>
          <div className="mb-2 text-xs font-semibold text-ink">Waiting on you</div>
          <ul className="space-y-1">
            {items.map((i) => (
              <li key={i.id}>
                <button onClick={() => (close(), nav(i.href))} className="flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-left text-xs hover:bg-surface2">
                  <AgentBot id={i.agent} preset="micro" placement="needyou" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-ink">{i.text}</span>
                    <span className="block truncate text-[11px] text-ink3">{i.project}</span>
                  </span>
                  <ChevronRight size={13} className="text-ink3" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </FloatingPanel>
  );
}

/** "3 · Awaiting lab · due 14 Oct" with Probe asleep; overdue turns the pill red. */
export function AwaitingLabLine({ tests }: { tests: PendingTest[] }) {
  const nav = useNavigate();
  if (!tests.length) return null;
  const overdue = tests.filter((t) => t.daysLeft < 0).length;
  return (
    <FloatingPanel
      label="Awaiting lab"
      width={320}
      trigger={(open) => (
        <button className={cn('flex h-10 w-full items-center gap-3 rounded-[10px] px-2.5 text-left text-[13px] transition-colors', open ? 'bg-surface2/70' : 'hover:bg-surface2/70')} title={`${tests.length} aged tests awaiting the lab, earliest due ${shortDue(tests[0].dueDate)}`}>
          <span className={cn('grid h-6 min-w-[24px] place-items-center rounded-full px-1.5 text-[11px] font-bold', overdue ? 'bg-fail text-white' : 'bg-[#FFF2DA] text-[#B45309]')}>{tests.length}</span>
          <span className="font-semibold text-ink">{overdue ? `${overdue} overdue` : 'Awaiting lab'}</span>
          <span className="mono min-w-0 flex-1 truncate whitespace-nowrap text-right text-[11px] font-medium text-ink3">due {shortDue(tests[0].dueDate)}</span>
          <div className="shrink-0 grayscale opacity-80"><AgentBot id="lab" preset="micro" placement="awaiting-lab" status="queued" size={16} /></div>
        </button>
      )}
    >
      {(close) => (
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-ink">
            <AgentBot id="lab" preset="micro" placement="awaiting-lab-pop" status="queued" /> Probe is waiting for the lab
          </div>
          <ul className="scroll-thin max-h-72 space-y-1 overflow-auto">
            {tests.map((t) => (
              <li key={t.id}>
                <button onClick={() => (close(), nav(t.href))} className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 rounded-md px-1.5 py-1.5 text-left text-xs hover:bg-surface2">
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-ink">{t.property}</span>
                    <span className="block truncate text-[11px] text-ink3">
                      {t.project} · {t.trials.join(', ')}
                    </span>
                  </span>
                  <span className={cn('mono text-right text-[11px]', t.daysLeft < 0 ? 'font-semibold text-fail' : t.daysLeft <= 2 ? 'text-borderline' : 'text-ink2')}>
                    {shortDue(t.dueDate)}
                    <span className="block text-[10px]">{t.daysLeft < 0 ? `${-t.daysLeft} d overdue` : t.daysLeft === 0 ? 'today' : `in ${t.daysLeft} d`}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </FloatingPanel>
  );
}
