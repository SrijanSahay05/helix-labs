import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, Legend, ResponsiveContainer } from 'recharts';
import { useProject } from '@/store/project';
import { MAT } from '@/data/rawMaterials';
import { PROP } from '@/data/properties';
import { StatusPill } from '@/components/ui/Pill';
import { StateFrame } from '@/components/ui/StateFrame';
import { Button } from '@/components/ui/Button';
import { startTrials } from '@/agent/controller';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { CompositionBar } from './stages/StagePathways';

const COLORS = ['var(--accent)', 'var(--borderline)', 'var(--pass)'];

export function PathwayCompare() {
  const { id } = useParams();
  const p = useProject(id);
  const nav = useNavigate();
  if (!p) return null;
  const list = p.pathways.filter((x) => p.compare.includes(x.id));
  if (list.length < 2)
    return <StateFrame state="empty" agent="weaver" message="Pick 2–3 pathways with the Compare checkbox first." action={<Link to={`/projects/${p.id}#pathways`} className="text-sm text-accent">Back to pathways</Link>} />;

  const mats = [...new Set(list.flatMap((x) => x.composition.map((c) => c.materialId)))];
  const props = [...new Set(list.flatMap((x) => x.predicted.map((c) => c.propertyId)))];
  const radar = [
    { k: 'Target match', ...Object.fromEntries(list.map((x) => [x.id, x.scores.targetMatch])) },
    { k: 'Cost', ...Object.fromEntries(list.map((x) => [x.id, x.scores.cost])) },
    { k: 'Availability', ...Object.fromEntries(list.map((x) => [x.id, x.scores.availability])) },
    { k: 'Overall', ...Object.fromEntries(list.map((x) => [x.id, x.scores.overall])) },
    ...props.slice(0, 4).map((pid) => {
      const t = p.targets.find((y) => y.propertyId === pid);
      const tv = t ? (Array.isArray(t.value) ? t.value[0] : t.value) : 1;
      return {
        k: PROP[pid]?.name.replace('Tensile adhesion — ', 'Adh. ') ?? pid,
        ...Object.fromEntries(list.map((x) => {
          const v = x.predicted.find((y) => y.propertyId === pid)?.value ?? 0;
          return [x.id, Math.min(1.2, t?.operator === '<=' ? tv / (v || 1) : v / (tv || 1))];
        })),
      };
    }),
  ];
  const differs = (vals: string[]) => new Set(vals).size > 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to={`/projects/${p.id}#pathways`} className="rounded p-1 text-ink3 hover:bg-surface2 hover:text-ink">
          <ArrowLeft size={16} />
        </Link>
        <h1 className="text-xl font-semibold">Compare pathways</h1>
        <span className="text-sm text-ink2">{list.map((x) => x.id).join(' · ')} — differences highlighted</span>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th className="th w-56" />
                {list.map((x) => (
                  <th key={x.id} className="th">
                    <div className="normal-case tracking-normal">
                      <span className="mono text-accent">{x.id}</span> <span className="text-ink">{x.name}</span>
                    </div>
                    <div className="mt-1.5 w-full">
                      <CompositionBar pw={x} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={list.length + 1} className="bg-surface2/50 px-2.5 py-1 text-2xs font-semibold text-ink3">
                  Composition (% w/w)
                </td>
              </tr>
              {mats.map((m) => {
                const vals = list.map((x) => {
                  const c = x.composition.find((y) => y.materialId === m);
                  return c ? `${c.range[0]}–${c.range[1]}` : '—';
                });
                return (
                  <tr key={m} className={cn(differs(vals) && 'bg-accent-soft/50')}>
                    <td className="td">{MAT[m]?.name}</td>
                    {vals.map((v, i) => (
                      <td key={i} className={cn('td mono', differs(vals) && 'font-semibold')}>
                        {v}
                      </td>
                    ))}
                  </tr>
                );
              })}
              <tr>
                <td colSpan={list.length + 1} className="bg-surface2/50 px-2.5 py-1 text-2xs font-semibold text-ink3">
                  Predicted
                </td>
              </tr>
              {props.map((pid) => {
                const vals = list.map((x) => x.predicted.find((y) => y.propertyId === pid));
                return (
                  <tr key={pid} className={cn(differs(vals.map((v) => v?.status ?? '')) && 'bg-accent-soft/50')}>
                    <td className="td">{PROP[pid]?.name}</td>
                    {vals.map((v, i) => (
                      <td key={i} className="td">
                        {v ? (
                          <span className="flex items-center gap-2">
                            <span className="mono">{v.value}</span>
                            <StatusPill status={v.status} />
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
              <tr className="bg-surface2">
                <td className="td font-semibold">Cost / kg</td>
                {list.map((x) => (
                  <td key={x.id} className={cn('td mono font-semibold', p.constraints.costCeiling !== undefined && x.costPerKg > p.constraints.costCeiling && 'text-fail')}>
                    ₹ {x.costPerKg.toFixed(2)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="td" />
                {list.map((x) => (
                  <td key={x.id} className="td">
                    <Button size="sm" variant="primary" onClick={() => (startTrials(p.id, x.id), nav(`/projects/${p.id}#trials`))}>
                      Select {x.id}
                    </Button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <div className="card p-3">
          <div className="label">Target match radar</div>
          <div className="h-[360px]">
            <ResponsiveContainer>
              <RadarChart data={radar} outerRadius="70%">
                <PolarGrid stroke="var(--line)" />
                <PolarAngleAxis dataKey="k" tick={{ fontSize: 10, fill: 'var(--text-2)' }} />
                <PolarRadiusAxis domain={[0, 1.2]} tick={false} axisLine={false} />
                {list.map((x, i) => (
                  <Radar key={x.id} name={x.id} dataKey={x.id} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.12} strokeWidth={1.5} />
                ))}
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
