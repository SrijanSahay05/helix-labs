import { motion } from 'framer-motion';
import { Check, EyeOff, ExternalLink, FileUp, Pin, PinOff, Undo2 } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import type { Project, Source } from '@/types';
import { SCENARIO } from '@/data/scenarios';
import { useProjects } from '@/store/project';
import { AgentConsole } from '@/components/ai/AgentConsole';
import { HelixOrb } from '@/components/ai/HelixOrb';
import { TypeText, CountUp } from '@/components/ai/TypeText';
import { SourceTypeTag } from '@/components/ai/CitationChip';
import { Drawer } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { StateFrame } from '@/components/ui/StateFrame';
import { Tag } from '@/components/ui/Pill';
import { useStageRun } from '@/agent/useAgentRun';
import { LIT_STEPS, uploadSourceScript } from '@/agent/scripts/stages';
import { runAgent } from '@/agent/engine';
import { startLiterature } from '@/agent/controller';
import { seeded } from '@/lib/motion';
import { cn } from '@/lib/cn';

function Tracker({ p }: { p: Project }) {
  const run = useStageRun(p.id, 'literature');
  const plan = run?.plan.length ? run.plan : LIT_STEPS.map((text) => ({ text, status: p.stages.literature === 'complete' ? ('done' as const) : ('pending' as const) }));
  return (
    <div className="scroll-thin flex items-center overflow-x-auto pb-1">
      {plan.map((s, i) => (
        <div key={s.text} className="flex flex-1 items-center last:flex-none">
          <div className={cn('flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium', s.status === 'done' ? 'border-accent/30 bg-accent-soft text-accent' : s.status === 'running' ? 'border-accent text-ink shadow-glow' : 'border-line text-ink3')}>
            {s.status === 'running' ? <HelixOrb state={run?.orb ?? 'searching'} size={20} /> : s.status === 'done' ? <Check size={12} strokeWidth={3} /> : <span className="mono text-2xs">{i + 1}</span>}
            {s.text}
          </div>
          {i < plan.length - 1 && <div className={cn('mx-1 h-px flex-1', s.status === 'done' ? 'bg-accent' : 'bg-line')} />}
        </div>
      ))}
    </div>
  );
}

function ClusterChart({ sources, clusters, clustered }: { sources: Source[]; clusters: string[]; clustered: boolean }) {
  const pts = useMemo(() => {
    const r = seeded(7);
    return sources.map((s) => ({ s, rx: 20 + r() * 560, ry: 15 + r() * 170, a: r() * Math.PI * 2, d: 6 + r() * 26 }));
  }, [sources]);
  const centers = clusters.map((_, i) => ({ x: 70 + (i % 4) * 160 + (i >= 4 ? 75 : 0), y: i < 4 ? 60 : 150 }));
  return (
    <svg viewBox="0 0 660 220" className="h-[220px] w-full rounded-lg border border-line bg-surface">
      {clustered &&
        clusters.map((c, i) => (
          <motion.g key={c} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
            <circle cx={centers[i].x} cy={centers[i].y} r={40} fill="var(--accent-soft)" stroke="var(--accent)" strokeOpacity={0.25} />
            <foreignObject x={centers[i].x - 70} y={centers[i].y + 44} width={140} height={40}>
              <div className="flex h-full w-full items-start justify-center text-center">
                <span className="text-[12px] font-medium leading-[1.2] tracking-tight text-ink">
                  {c}
                </span>
              </div>
            </foreignObject>
          </motion.g>
        ))}
      {pts.map(({ s, rx, ry, a, d }, i) => {
        const ci = Math.max(0, clusters.indexOf(s.cluster));
        const cx = clustered ? centers[ci].x + Math.cos(a) * d : rx;
        const cy = clustered ? centers[ci].y + Math.sin(a) * d : ry;
        return (
          <motion.circle
            key={s.id}
            r={s.pinned ? 4.5 : 3}
            fill={s.excluded ? 'var(--text-3)' : s.relevance > 0.75 ? 'var(--accent)' : 'var(--text-2)'}
            fillOpacity={s.excluded ? 0.3 : 0.85}
            initial={{ cx: rx, cy: ry, opacity: 0 }}
            animate={{ cx, cy, opacity: 1 }}
            transition={{ duration: 0.9, delay: clustered ? i * 0.006 : i * 0.01, ease: [0.2, 0.8, 0.2, 1] }}
          />
        );
      })}
    </svg>
  );
}

const col = createColumnHelper<Source>();

export function StageLiterature({ p }: { p: Project }) {
  const s = SCENARIO[p.scenarioId];
  const update = useProjects((st) => st.update);
  const run = useStageRun(p.id, 'literature');
  const [open, setOpen] = useState<Source | null>(null);
  const [showExcluded, setShowExcluded] = useState(false);
  const [uploadRun, setUploadRun] = useState<string>();
  const fileRef = useRef<HTMLInputElement>(null);
  const status = p.stages.literature;
  const setSource = (id: string, patch: Partial<Source>) => update(p.id, (x) => ({ ...x, sources: x.sources.map((y) => (y.id === id ? { ...y, ...patch } : y)) }));

  const visible = useMemo(() => [...p.sources.filter((x) => !x.excluded)].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.relevance - a.relevance), [p.sources]);
  const excluded = p.sources.filter((x) => x.excluded);
  const counts = (['Paper', 'Patent', 'TDS', 'Supplier sheet', 'Uploaded', 'Internal formulation'] as const).map((t) => [t, p.sources.filter((x) => x.type === t).length] as const).filter(([, n]) => n);

  const columns = useMemo(
    () => [
      col.accessor('type', { header: 'Type', cell: (c) => <SourceTypeTag type={c.getValue()} /> }),
      col.accessor('title', {
        header: 'Title',
        cell: (c) => (
          <div className="flex items-center gap-1.5">
            {c.row.original.pinned && <Pin size={11} className="shrink-0 text-accent" />}
            <span className="line-clamp-2 min-w-[240px]">{c.getValue()}</span>
            <Tag className="shrink-0">Demo</Tag>
          </div>
        ),
      }),
      col.accessor('year', { header: 'Year', cell: (c) => <span className="mono text-xs">{c.getValue()}</span> }),
      col.accessor('relevance', {
        header: 'Relevance',
        cell: (c) => (
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-14 overflow-hidden rounded bg-surface2">
              <div className="h-full rounded bg-accent" style={{ width: `${c.getValue() * 100}%` }} />
            </div>
            <span className="mono text-2xs text-ink2">{c.getValue().toFixed(2)}</span>
          </div>
        ),
      }),
      col.accessor('finding', { header: 'Key finding', cell: (c) => <TypeText inline text={c.getValue()} id={`find:${c.row.original.id}`} className="line-clamp-1 text-xs text-ink2" /> }),
      col.accessor('cluster', { header: 'Cluster', cell: (c) => <span className="text-xs text-ink2">{c.getValue()}</span> }),
      col.display({
        id: 'actions',
        header: '',
        cell: (c) => {
          const src = c.row.original;
          return (
            <div className="flex justify-end gap-0.5 text-ink3">
              <button title="Open" onClick={() => setOpen(src)} className="rounded p-1 hover:bg-surface2 hover:text-ink">
                <ExternalLink size={13} />
              </button>
              <button title={src.pinned ? 'Unpin' : 'Pin'} onClick={() => setSource(src.id, { pinned: !src.pinned })} className="rounded p-1 hover:bg-surface2 hover:text-accent">
                {src.pinned ? <PinOff size={13} /> : <Pin size={13} />}
              </button>
              <button title="Exclude" onClick={() => setSource(src.id, { excluded: true, pinned: false })} className="rounded p-1 hover:bg-surface2 hover:text-fail">
                <EyeOff size={13} />
              </button>
            </div>
          );
        },
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [p.id],
  );
  const table = useReactTable({ data: visible, columns, getCoreRowModel: getCoreRowModel() });

  if (status === 'waiting')
    return <StateFrame state="empty" agent="scholar" message="I start reading as soon as the brief is approved." action={<Button variant="primary" size="sm" onClick={() => startLiterature(p.id)}>Run literature now</Button>} />;
  if (status === 'failed')
    return <StateFrame state="failed" agent="scholar" message={p.stageNotes?.literature ?? "I couldn't finish the literature search."} onRetry={() => startLiterature(p.id)} />;

  const query = run?.typed['lit.query'] ?? (status === 'complete' ? s.query : undefined);
  const clustered = status === 'complete' || (run?.plan[4]?.status === 'done') || run?.plan[4]?.status === 'running';

  return (
    <div className="space-y-4">
      <Tracker p={p} />
      {run && (run.status === 'running' || run.status === 'paused') && <AgentConsole runId={run.id} />}
      {query && (
        <div className="rounded-md border border-line bg-surface2 px-3 py-2">
          <div className="label mb-1">Search strategy</div>
          <TypeText inline text={query} id={`q:${p.id}`} className="mono block text-xs text-ink" />
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
        {p.sources.length ? <ClusterChart sources={p.sources} clusters={s.clusters} clustered={!!clustered} /> : <div className="skeleton h-[200px]" />}
        <div className="space-y-1.5 rounded-lg border border-line p-3">
          <div className="label">Sources</div>
          <div className="mono text-xl font-semibold">
            <CountUp value={p.sources.length} />
          </div>
          {counts.map(([t, n]) => (
            <div key={t} className="flex items-center justify-between text-xs">
              <SourceTypeTag type={t} />
              <span className="mono">{n}</span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-1 text-xs text-ink2">
            <span>Clusters</span>
            <span className="mono">{s.clusters.length}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold">Source list</span>
        <span className="text-xs text-ink3">{visible.length} shown · pinned first</span>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => setShowExcluded(true)}>
            <EyeOff size={13} /> Excluded ({excluded.length})
          </Button>
          <Button size="sm" onClick={() => fileRef.current?.click()}>
            <FileUp size={13} /> Upload own source
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setUploadRun(runAgent(uploadSourceScript(p, f.name), { projectId: p.id }));
            }}
          />
        </div>
      </div>
      {uploadRun && <AgentConsole runId={uploadRun} />}

      <div className="scroll-thin max-h-[420px] overflow-auto rounded-lg border border-line">
        <table className="w-full">
          <thead className="sticky top-0 z-10">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th key={h.id} className="th">
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((r) => (
              <motion.tr layout key={r.id} className={cn('hover:bg-surface2/60', r.original.pinned && 'bg-accent-soft')}>
                {r.getVisibleCells().map((c) => (
                  <td key={c.id} className="td max-w-[360px]">
                    {flexRender(c.column.columnDef.cell, c.getContext())}
                  </td>
                ))}
              </motion.tr>
            ))}
            {status === 'running' &&
              Array.from({ length: 3 }, (_, i) => (
                <tr key={`sk${i}`}>
                  <td colSpan={7} className="td">
                    <div className="skeleton h-3" style={{ width: `${80 - i * 15}%` }} />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Drawer open={!!open} onClose={() => setOpen(null)} title={open ? <span className="flex items-center gap-2"><SourceTypeTag type={open.type} /> Source detail</span> : ''}>
        {open && (
          <div className="space-y-3 text-sm">
            <h3 className="text-md font-semibold">{open.title}</h3>
            <div className="flex gap-2 text-xs text-ink2">
              <span className="mono">{open.year}</span>·<span>{open.cluster}</span>·<span className="mono">relevance {open.relevance.toFixed(2)}</span>
            </div>
            <div className="rounded-md border border-line bg-surface2 p-3 leading-6">
              {open.snippet ?? open.finding}{' '}
              <mark className="rounded bg-accent-soft px-0.5 text-accent">{open.finding}</mark>
            </div>
            {open.extracted && (
              <div>
                <div className="label mb-1">Extracted values</div>
                <table className="w-full">
                  <tbody>
                    {open.extracted.map((e) => (
                      <tr key={e.label}>
                        <td className="td text-ink2">{e.label}</td>
                        <td className="td mono text-right font-semibold text-accent">{e.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-2xs text-ink3">Demo source — titles are generic placeholders, not real publications.</p>
          </div>
        )}
      </Drawer>
      <Drawer open={showExcluded} onClose={() => setShowExcluded(false)} title={`Excluded (${excluded.length})`} width={460}>
        {excluded.length === 0 && <p className="text-sm text-ink3">Nothing excluded.</p>}
        {excluded.map((x) => (
          <div key={x.id} className="flex items-center gap-2 border-b border-line py-2 text-sm">
            <span className="flex-1 text-ink3 line-through">{x.title}</span>
            <button onClick={() => setSource(x.id, { excluded: false })} className="flex items-center gap-1 text-xs text-accent">
              <Undo2 size={12} /> Restore
            </button>
          </div>
        ))}
      </Drawer>
    </div>
  );
}
