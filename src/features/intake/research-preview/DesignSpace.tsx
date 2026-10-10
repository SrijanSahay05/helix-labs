import { Table2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { paretoFront, type ResearchData, type RRoute } from '@/data/demo/research';
import { AgentBot } from '@/components/agents/AgentBot';
import { cn } from '@/lib/cn';
import { scrollToCard } from './EvidenceBridge';
import { scoreLabels } from './PathwayCard';
import { CitedText, ORANGE, useScientist } from './shared';

const H = 320;
const M = { l: 48, r: 20, t: 16, b: 40 };

export function DesignSpace({ data, routes, typing }: { data: ResearchData; routes: RRoute[]; typing: boolean }) {
  const sci = useScientist();
  const L = scoreLabels(sci);
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(700);
  const [hover, setHover] = useState<RRoute | null>(null);
  const [table, setTable] = useState(false);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const costs = routes.map((r) => r.costPerKg);
  const x0 = Math.floor(Math.min(...costs, data.ceiling) - 1);
  const x1 = Math.ceil(Math.max(...costs, data.ceiling) + 1);
  const y0 = 0.3;
  const y1 = 1;
  const X = (v: number) => M.l + ((v - x0) / (x1 - x0)) * (w - M.l - M.r);
  const Y = (v: number) => M.t + (1 - (v - y0) / (y1 - y0)) * (H - M.t - M.b);
  const front = paretoFront(routes);
  const xt: number[] = [];
  for (let v = Math.ceil(x0); v <= x1; v += x1 - x0 > 12 ? 2 : 1) xt.push(v);
  const top = routes.find((r) => r.rank === 1);

  return (
    <div className="grid border-t border-line xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 px-6 py-5">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-ink">{sci ? 'Design space' : 'All recipe ideas'}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-ink3">
              <span>
                {routes.length} generated · {sci ? `${L.targetMatch} vs cost per kg` : 'how well each fits vs its price'}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-accent" /> Feasible
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="font-semibold">×</span> Rejected
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-0.5 w-3 bg-accent" /> Pareto front
              </span>
              <span className="inline-flex items-center gap-1 text-fail">
                <span className="h-3 border-l border-dashed border-fail" /> Cost ceiling
              </span>
            </div>
          </div>
          <button type="button" onClick={() => setTable((x) => !x)} className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium text-accent hover:bg-accent-soft">
            <Table2 size={13} /> {table ? 'View as chart' : 'View as table'}
          </button>
        </div>
        <div ref={box} className="relative">
          {table ? (
            <div className="table-wrap max-h-[320px]">
              <table className="w-full text-xs">
                <thead className="sticky top-0">
                  <tr>
                    <th className="th h-9 px-3">Route</th>
                    <th className="th h-9 px-3">Name</th>
                    <th className="th h-9 px-3 text-right">₹/kg</th>
                    <th className="th h-9 px-3 text-right">{L.targetMatch}</th>
                    <th className="th h-9 px-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {routes.map((r) => (
                    <tr key={r.id}>
                      <td className="td mono px-3 py-1.5 text-xs">{r.id}</td>
                      <td className="td px-3 py-1.5 text-xs">{r.name}</td>
                      <td className="td mono px-3 py-1.5 text-right text-xs">{r.costPerKg.toFixed(1)}</td>
                      <td className="td mono px-3 py-1.5 text-right text-xs">{r.scores.targetMatch.toFixed(2)}</td>
                      <td className="td px-3 py-1.5 text-xs text-ink2">{r.feasible ? (front.includes(r) ? 'Feasible · Pareto front' : 'Feasible') : `Rejected — ${r.reason}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <svg width="100%" height={H} viewBox={`0 0 ${w} ${H}`} role="img" aria-label={`Scatter of ${routes.length} routes: cost per kg against target match, with the cost ceiling at ₹${data.ceiling} and the Pareto front`} className="block overflow-visible">
              {[0.4, 0.6, 0.8, 1].map((v) => (
                <g key={v}>
                  <line x1={M.l} x2={w - M.r} y1={Y(v)} y2={Y(v)} stroke="var(--line)" />
                  <text x={M.l - 8} y={Y(v) + 4} textAnchor="end" fontSize={10.5} fill="var(--text-3)" className="mono">
                    {v.toFixed(1)}
                  </text>
                </g>
              ))}
              {xt.map((v) => (
                <text key={v} x={X(v)} y={H - M.b + 16} textAnchor="middle" fontSize={10.5} fill="var(--text-3)" className="mono">
                  ₹{v}
                </text>
              ))}
              <text x={(M.l + w - M.r) / 2} y={H - 4} textAnchor="middle" fontSize={11} fill="var(--text-2)">
                {sci ? 'Cost per kg' : 'Price per kg'}
              </text>
              <text transform={`translate(12 ${(M.t + H - M.b) / 2}) rotate(-90)`} textAnchor="middle" fontSize={11} fill="var(--text-2)">
                {L.targetMatch}
              </text>
              {/* ceiling */}
              <line x1={X(data.ceiling)} x2={X(data.ceiling)} y1={M.t} y2={H - M.b} stroke="var(--fail)" strokeDasharray="5 4" strokeWidth={1.2} />
              <text x={X(data.ceiling) + 6} y={H - M.b - 6} fontSize={10.5} fill="var(--fail)" fontWeight={600}>
                Ceiling ₹{data.ceiling}
              </text>
              {/* pareto */}
              <polyline points={front.map((r) => `${X(r.costPerKg)},${Y(r.scores.targetMatch)}`).join(' ')} fill="none" stroke="var(--accent)" strokeWidth={1.5} strokeOpacity={0.7} />
              {routes.map((r) => {
                const x = X(r.costPerKg);
                const y = Y(Math.max(y0, r.scores.targetMatch));
                const best = r === top;
                return (
                  <g key={r.id} transform={`translate(${x} ${y})`} onPointerEnter={() => setHover(r)} onPointerLeave={() => setHover(null)} onClick={() => r.feasible && scrollToCard(r.id)} className={r.feasible ? 'cursor-pointer' : 'cursor-default'}>
                    <circle r={12} fill="transparent" />
                    {r.feasible ? (
                      <>
                        {best && <circle r={10} fill="none" stroke={ORANGE} strokeWidth={2} />}
                        <circle r={6} fill="var(--accent)" />
                        <text x={10} y={-8} fontSize={11.5} fontWeight={600} fill="var(--text)">
                          {r.id}
                        </text>
                      </>
                    ) : (
                      <path d="M -4 -4 L 4 4 M 4 -4 L -4 4" stroke="var(--text-3)" strokeWidth={1.8} strokeLinecap="round" />
                    )}
                  </g>
                );
              })}
            </svg>
          )}
          {hover && !table && (
            <div className="pointer-events-none absolute z-10 w-[260px] rounded-lg border border-line bg-surface p-3 text-xs shadow-pop" style={{ left: Math.min(X(hover.costPerKg) + 14, w - 270), top: Math.max(0, Y(hover.scores.targetMatch) - 20) }}>
              <div className="flex items-center gap-2">
                <span className="mono font-semibold text-ink">{hover.id}</span>
                <span className={cn('ml-auto text-2xs font-semibold', hover.feasible ? 'text-accent' : 'text-ink3')}>{hover.feasible ? 'Feasible' : 'Rejected'}</span>
              </div>
              <div className="mt-1 font-medium leading-4 text-ink">{hover.name}</div>
              <div className="mono mt-1.5 text-ink2">
                ₹{hover.costPerKg.toFixed(1)}/kg · {L.targetMatch.toLowerCase()} {hover.scores.targetMatch.toFixed(2)}
                {hover.feasible && ` · overall ${hover.scores.overall.toFixed(2)}`}
              </div>
              {!hover.feasible && <div className="mt-1 text-fail">{hover.reason}</div>}
              {hover.feasible && <div className="mt-1 text-2xs text-ink3">Click to open its card</div>}
            </div>
          )}
        </div>
      </div>
      <aside className="border-t border-line bg-surface2/40 px-6 py-5 xl:border-l xl:border-t-0">
        <div className="flex items-center gap-2">
          <AgentBot id="weaver" preset="micro" placement="rp-why" status={typing ? 'working' : 'idle'} />
          <span className="text-sm font-semibold text-ink">Why {top?.id ?? 'P1'} is first</span>
        </div>
        <p className="mt-3 text-sm leading-6 text-ink2">{typing || top ? <CitedText text={sci ? data.why : data.plainWhy} id={`rp-why:${data.scenarioId}:${sci}`} data={data} route={top?.id} active={typing} /> : null}</p>
      </aside>
    </div>
  );
}
