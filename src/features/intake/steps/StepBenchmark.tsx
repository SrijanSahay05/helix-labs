import { motion } from 'framer-motion';
import { Check, FileUp, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { BENCHMARKS } from '@/data/benchmarks';
import { PROP } from '@/data/properties';
import { SCENARIO } from '@/data/scenarios';
import { Tabs, Chip } from '@/components/ui/primitives';
import { Tag } from '@/components/ui/Pill';
import { Button } from '@/components/ui/Button';
import { AgentConsole } from '@/components/ai/AgentConsole';
import { ConfidenceMeter } from '@/components/ai/ConfidenceMeter';
import { TypeText } from '@/components/ai/TypeText';
import { runAgent } from '@/agent/engine';
import { benchmarkFromSource } from '@/agent/scripts/intake';
import { useProjects } from '@/store/project';
import { useMode } from '@/lib/useModeText';
import { cn } from '@/lib/cn';
import type { Benchmark } from '@/types';
import { useDraft, userSet } from '../useDraft';
import { AgentBot } from '@/components/agents/AgentBot';
import { AgentTag } from '@/components/agents/AgentTag';

export function ExtractionReview({ bm, animate = true }: { bm: Benchmark; animate?: boolean }) {
  return (
    <div className="scroll-thin overflow-x-auto">
    <table className="w-full min-w-[680px]">
      <thead>
        <tr>
          <th className="th">Property</th>
          <th className="th text-right">Extracted value</th>
          <th className="th">Unit</th>
          <th className="th">Tag</th>
          <th className="th text-right">Page</th>
          <th className="th">Confidence</th>
          <th className="th w-16" />
        </tr>
      </thead>
      <tbody>
        {bm.values.map((v, i) => (
          <motion.tr key={v.propertyId} initial={animate ? { opacity: 0, x: -6 } : false} animate={{ opacity: 1, x: 0 }} transition={{ delay: animate ? i * 0.12 : 0 }}>
            <td className="td min-w-[220px]">{PROP[v.propertyId]?.name ?? v.propertyId}</td>
            <td className="td mono text-right">{animate ? <TypeText inline text={String(v.value)} id={`ex:${bm.id}:${v.propertyId}`} /> : String(v.value)}</td>
            <td className="td text-xs text-ink3">{v.unit}</td>
            <td className="td">
              <Tag tone={v.tag === 'Lab-tested' ? 'pass' : v.tag === 'MSDS' ? 'borderline' : 'neutral'}>{v.tag}</Tag>
            </td>
            <td className="td mono text-right text-xs text-ink3">{v.page ? `p.${v.page}` : '—'}</td>
            <td className="td">{v.confidence !== undefined && <ConfidenceMeter value={v.confidence} />}</td>
            <td className="td">
              <div className="flex gap-1 text-ink3">
                <button className="rounded p-0.5 hover:bg-surface2 hover:text-pass" title="Accept">
                  <Check size={13} />
                </button>
                <button className="rounded p-0.5 hover:bg-surface2 hover:text-ink" title="Edit">
                  <Pencil size={13} />
                </button>
              </div>
            </td>
          </motion.tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}

function Library() {
  const d = useDraft();
  const [q, setQ] = useState('');
  const list = BENCHMARKS.filter((b) => !q || `${b.name} ${b.standardClass} ${b.maker}`.toLowerCase().includes(q.toLowerCase()));
  const ids = d.benchmarks.map((b) => b.id);
  const toggle = (b: Benchmark) => {
    if (ids.includes(b.id)) userSet('benchmarks', d.benchmarks.filter((x) => x.id !== b.id), 'Benchmarks');
    else if (ids.length < 3) userSet('benchmarks', [...d.benchmarks, b], 'Benchmarks');
  };
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink3" />
        <input className="input pl-9" placeholder="Search benchmark library" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="table-wrap">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr>
              <th className="th w-8" />
              <th className="th">Product</th>
              <th className="th">Maker</th>
              <th className="th">Class</th>
              <th className="th">Value sources</th>
              <th className="th text-right"># values</th>
            </tr>
          </thead>
          <tbody>
            {list.map((b) => {
              const sel = ids.includes(b.id);
              const tags = [...new Set(b.values.map((v) => v.tag))];
              return (
                <tr key={b.id} onClick={() => toggle(b)} className={cn('cursor-pointer hover:bg-surface2', sel && 'bg-accent-soft')}>
                  <td className="td">
                    <input type="checkbox" readOnly checked={sel} className="accent-[var(--accent)]" />
                  </td>
                  <td className="td font-medium">{b.name}</td>
                  <td className="td text-ink2">{b.maker}</td>
                  <td className="td mono text-xs">{b.standardClass}</td>
                  <td className="td">
                    <div className="flex gap-1">
                      {tags.map((t) => (
                        <Tag key={t}>{t}</Tag>
                      ))}
                    </div>
                  </td>
                  <td className="td mono text-right">{b.values.length}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Upload() {
  const d = useDraft();
  const [runId, setRunId] = useState<string>();
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const start = (name: string) => {
    const s = SCENARIO[d.scenarioId];
    const bm = { ...benchmarkFromSource(s, name), id: `bm-up-${Date.now()}`, name: `Benchmark — ${name.replace(/\.pdf$/i, '')}` };
    const id = runAgent(
      {
        id: `bm.upload.${name}`,
        title: 'Extracting TDS',
        agent: 'reader',
        events: [
          { t: 'orb', state: 'searching', label: `Reading ${name}…` },
          { t: 'plan', steps: ['Read PDF', 'Find property table', 'Extract values', 'Tag sources'] },
          { t: 'step', index: 0, status: 'running' },
          { t: 'tool', name: 'detect_doc_type', args: `"${name}"`, result: 'TDS · 4 pages', ms: 900 },
          { t: 'step', index: 0, status: 'done' },
          { t: 'step', index: 1, status: 'running' },
          { t: 'tool', name: 'extract_table', args: 'kind="technical data"', result: 'p.2–3', ms: 700 },
          { t: 'step', index: 1, status: 'done' },
          { t: 'step', index: 2, status: 'running' },
          { t: 'tool', name: 'extract_tds', args: 'pages=2-3', result: `${bm.values.length} properties`, ms: 1100 },
          { t: 'step', index: 2, status: 'done' },
          { t: 'step', index: 3, status: 'running' },
          { t: 'handoff', to: 'benchmark', note: 'Values extracted. Compare them with the brief.' },
          { t: 'tool', name: 'compare_values', args: `values=${bm.values.length}`, result: 'tagged TDS / MSDS / lab', ms: 600 },
          { t: 'effect', run: () => useProjects.getState().setDraft('benchmarks', [...useProjects.getState().draft.benchmarks, bm].slice(0, 3), { by: 'helix', agent: 'benchmark', confidence: 0.88, reason: `Extracted by Iris from ${name}, compared by Echo` }) },
          { t: 'step', index: 3, status: 'done' },
          { t: 'done', summary: `${bm.values.length} values extracted — review below` },
        ],
      },
      {},
    );
    setRunId(id);
  };
  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => (e.preventDefault(), setDrag(true))}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files[0];
          if (f) start(f.name);
        }}
        onClick={() => ref.current?.click()}
        className={cn('flex h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-sm text-ink2', drag ? 'border-accent bg-accent-soft' : 'border-line hover:border-ink3')}
      >
        <FileUp size={18} />
        Drop a TDS PDF here or click to choose
        <span className="text-2xs text-ink3">or</span>
        <button onClick={(e) => (e.stopPropagation(), start('competitor-tds-sample.pdf'))} className="text-xs font-medium text-accent">
          use a sample TDS
        </button>
        <input ref={ref} type="file" accept="application/pdf" className="hidden" onChange={(e) => e.target.files?.[0] && start(e.target.files[0].name)} />
      </div>
      {runId && <AgentConsole runId={runId} />}
    </div>
  );
}

function OwnValues() {
  const d = useDraft();
  const s = SCENARIO[d.scenarioId];
  const [rows, setRows] = useState(s.targets.slice(0, 4).map((t) => ({ propertyId: t.propertyId, value: '' })));
  const save = () => {
    const bm: Benchmark = {
      id: `bm-own-${Date.now()}`,
      name: 'Own lab values',
      maker: 'In-house',
      subcategoryId: s.subcategoryId,
      standardClass: s.standard,
      updated: new Date().toISOString().slice(0, 10),
      values: rows.filter((r) => r.value).map((r) => ({ propertyId: r.propertyId, value: Number(r.value), unit: PROP[r.propertyId]?.unit ?? '', tag: 'Lab-tested' as const })),
      versions: [{ v: 1, date: new Date().toISOString().slice(0, 10), note: 'Entered by user' }],
    };
    if (d.benchmarks.length < 3) userSet('benchmarks', [...d.benchmarks, bm], 'Benchmarks');
  };
  return (
    <div className="space-y-2">
      <table className="w-full overflow-hidden rounded-lg border border-line">
        <thead>
          <tr>
            <th className="th">Property</th>
            <th className="th w-40 text-right">Value</th>
            <th className="th w-24">Unit</th>
            <th className="th w-10" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="td">
                <select className="input" value={r.propertyId} onChange={(e) => setRows(rows.map((x, k) => (k === i ? { ...x, propertyId: e.target.value } : x)))}>
                  {s.targets.map((t) => (
                    <option key={t.propertyId} value={t.propertyId}>
                      {PROP[t.propertyId]?.name}
                    </option>
                  ))}
                </select>
              </td>
              <td className="td">
                <input className="input mono text-right" value={r.value} onChange={(e) => setRows(rows.map((x, k) => (k === i ? { ...x, value: e.target.value } : x)))} />
              </td>
              <td className="td text-xs text-ink3">{PROP[r.propertyId]?.unit}</td>
              <td className="td">
                <button onClick={() => setRows(rows.filter((_, k) => k !== i))} className="text-ink3 hover:text-fail">
                  <Trash2 size={13} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={() => setRows([...rows, { propertyId: s.targets[0].propertyId, value: '' }])}>
          <Plus size={13} /> Add row
        </Button>
        <Button size="sm" onClick={save} disabled={!rows.some((r) => r.value)}>
          Save as benchmark
        </Button>
      </div>
    </div>
  );
}

export function StepBenchmark() {
  const d = useDraft();
  const mode = useMode();
  const [tab, setTab] = useState<'library' | 'upload' | 'own'>('library');
  const created = d.benchmarks.find((b) => b.name.includes('created from') || b.id.includes('-src'));

  if (mode === 'non-scientist') {
    return (
      <div className="card space-y-4 p-6" data-ai-path="benchmarks">
        <h3 className="text-xl font-semibold">Which product do you use or want to match?</h3>
        <div className="flex flex-wrap gap-2">
          {BENCHMARKS.slice(0, 7).map((b) => (
            <Chip key={b.id} active={d.benchmarks.some((x) => x.id === b.id || x.name.startsWith(b.name))} onClick={() => userSet('benchmarks', [b], 'Benchmark')}>
              {b.name}
            </Chip>
          ))}
        </div>
        {d.benchmarks[0] && (
          <p className="flex items-center gap-2 text-sm text-ink2">
            <AgentBot id="benchmark" preset="micro" placement="bm-plain" /> Matching <b className="text-ink">{d.benchmarks[0].name}</b> — Echo will make sure yours grips and lasts at least as well.
          </p>
        )}
        <button onClick={() => userSet('benchmarks', [], 'Benchmark')} className="text-sm text-ink3 underline-offset-2 hover:underline">
          Skip — this is optional
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-ai-path="benchmarks">
      {created && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-line px-3 py-2">
            <span className="text-sm font-semibold">{created.name}</span>
            <span className="ml-auto flex items-center gap-3 text-2xs text-ink3">
              <AgentTag id="reader" placement="bm-review" prefix="Extracted by" title={false} />
              <AgentTag id="benchmark" placement="bm-review" prefix="compared by" title={false} />
              <span>· {created.values.length} values</span>
            </span>
          </div>
          <ExtractionReview bm={created} />
        </motion.div>
      )}
      <div className="flex items-center justify-between">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { id: 'library', label: 'Pick from library' },
            { id: 'upload', label: 'Upload TDS' },
            { id: 'own', label: 'Enter own lab values' },
          ]}
        />
        <span className={cn('mono text-xs', d.benchmarks.length >= 3 ? 'text-borderline' : 'text-ink2')}>{d.benchmarks.length} / 3 benchmarks</span>
      </div>
      {tab === 'library' && <Library />}
      {tab === 'upload' && <Upload />}
      {tab === 'own' && <OwnValues />}
      {d.benchmarks.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {d.benchmarks.map((b, i) => (
            <span key={b.id} className="flex items-center gap-1.5 rounded-md border border-line bg-surface px-2 py-1 text-xs">
              <span className="mono font-semibold text-accent">{String.fromCharCode(65 + i)}</span> {b.name}
              <button onClick={() => userSet('benchmarks', d.benchmarks.filter((x) => x.id !== b.id), 'Benchmarks')} className="text-ink3 hover:text-fail">
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
