import { useNavigate } from 'react-router-dom';
import { AgentBot } from '@/components/agents/AgentBot';
import { CrewMonitor } from './CrewMonitor';
import { FloatingPanel } from './FloatingPanel';
import { useAwaitingLab, useNeedsYou, useRunningJobs } from './selectors';

/** Collapsed sidebar: one progress ring per running job (bot inside) + attention badge; hover opens the full monitor. */
export function RailStack() {
  const nav = useNavigate();
  const running = useRunningJobs().slice(0, 3);
  const attention = useNeedsYou().length + useAwaitingLab().length;
  return (
    <FloatingPanel
      hover
      label="Crew monitor"
      width={272}
      trigger={() => (
        <div className="flex flex-col items-center gap-2 py-1" aria-label={`${running.length} jobs running, ${attention} items need attention`}>
          {running.map((j) => {
            const p = Math.round((j.progress ?? 0.3) * 100);
            return (
              <button key={j.id} onClick={() => nav(j.href)} title={`${j.title} · ${p}%`} className="relative grid h-[38px] w-[38px] place-items-center rounded-full" style={{ background: `conic-gradient(var(--accent) ${p * 3.6}deg, var(--secondary) 0deg)` }}>
                <span className="grid h-[32px] w-[32px] place-items-center rounded-full bg-surface">
                  <AgentBot id={j.ownerAgent} preset="compact" size={20} placement={`rail-${j.id}`} status="working" />
                </span>
              </button>
            );
          })}
          {attention > 0 && <span className="mono grid h-5 min-w-5 place-items-center rounded-full bg-[var(--borderline-soft)] px-1.5 text-[10.5px] font-semibold text-borderline ring-1 ring-borderline/30">{attention}</span>}
          {!running.length && !attention && <AgentBot id="conductor" preset="compact" size={24} placement="rail-idle" status="queued" />}
        </div>
      )}
    >
      {() => <CrewMonitor variant="popover" />}
    </FloatingPanel>
  );
}
