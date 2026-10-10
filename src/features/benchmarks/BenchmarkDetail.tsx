import { motion } from 'framer-motion';
import { ArrowLeft, FileUp } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BENCHMARKS } from '@/data/benchmarks';
import { PROP } from '@/data/properties';
import { Tag } from '@/components/ui/Pill';
import { Button } from '@/components/ui/Button';
import { AgentConsole } from '@/components/ai/AgentConsole';
import { StateFrame } from '@/components/ui/StateFrame';
import { ExtractionReview } from '@/features/intake/steps/StepBenchmark';
import { runAgent } from '@/agent/engine';
import { useTasks } from '@/store/tasks';

function PdfPlaceholder({ highlight }: { highlight: number }) {
  return (
    <div className="relative aspect-[1/1.3] w-full overflow-hidden rounded-md border border-line bg-white p-6 shadow-card dark:bg-[#1b1f29]">
      <div className="mb-3 h-3 w-1/2 rounded bg-[#e3e6eb] dark:bg-[#2a3040]" />
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="mb-1.5 h-2 rounded bg-[#eef0f3] dark:bg-[#232836]" style={{ width: `${90 - i * 7}%` }} />
      ))}
      <div className="mt-4 space-y-1">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="relative flex gap-2">
            <div className="h-2.5 w-1/2 rounded bg-[#eef0f3] dark:bg-[#232836]" />
            <div className="h-2.5 w-1/5 rounded bg-[#eef0f3] dark:bg-[#232836]" />
            {i < highlight && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute -inset-0.5 rounded border border-accent bg-accent-soft" />
            )}
          </div>
        ))}
      </div>
      <div className="absolute bottom-3 right-4 mono text-[10px] text-ink3">p. 2</div>
    </div>
  );
}

export function BenchmarkDetail() {
  const { id } = useParams();
  const b = BENCHMARKS.find((x) => x.id === id);
  const [runId, setRunId] = useState<string>();
  const [extracted, setExtracted] = useState(false);
  const run = useTasks((s) => (runId ? s.runs[runId] : undefined));
  const ref = useRef<HTMLInputElement>(null);
  if (!b) return <StateFrame state="empty" agent="benchmark" message="I can't find that benchmark." />;
  const progress = run ? Math.round(run.progress * 12) : extracted ? 12 : 0;

  const upload = (name: string) => {
    setExtracted(false);
    setRunId(
      runAgent(
        {
          id: `bm.detail.${b.id}`,
          title: 'TDS extraction',
          agent: 'reader',
          events: [
            { t: 'orb', state: 'searching', label: `Reading ${name}…` },
            { t: 'plan', steps: ['Read PDF', 'Locate data table', 'Extract & tag values', 'Create version'] },
            { t: 'step', index: 0, status: 'running' },
            { t: 'tool', name: 'detect_doc_type', args: `"${name}"`, result: 'TDS · 4 pages', ms: 800 },
            { t: 'step', index: 0, status: 'done' },
            { t: 'step', index: 1, status: 'running' },
            { t: 'tool', name: 'extract_table', args: 'p.2', result: '12 rows', ms: 700 },
            { t: 'step', index: 1, status: 'done' },
            { t: 'step', index: 2, status: 'running' },
            ...b.values.map((v) => ({ t: 'think' as const, text: `${PROP[v.propertyId]?.name}: ${v.value} ${v.unit} (${v.tag})` })),
            { t: 'step', index: 2, status: 'done' },
            { t: 'step', index: 3, status: 'running' },
            { t: 'handoff', to: 'benchmark', note: 'Values extracted. Version the benchmark.' },
            { t: 'tool', name: 'create_benchmark', args: `version=${b.versions.length + 1}`, result: 'ok', ms: 400 },
            { t: 'effect', run: () => setExtracted(true) },
            { t: 'step', index: 3, status: 'done' },
            { t: 'done', summary: `v${b.versions.length + 1} ready for review` },
          ],
        },
        {},
      ),
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/benchmarks" className="rounded p-1 text-ink3 hover:bg-surface2">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold">{b.name}</h1>
          <p className="text-sm text-ink2">
            {b.maker} · <span className="mono">{b.standardClass}</span> · ₹ {b.pricePerKg}/kg
          </p>
        </div>
        <Button className="ml-auto" onClick={() => ref.current?.click()}>
          <FileUp size={14} /> Upload new TDS
        </Button>
        <Button variant="ghost" onClick={() => upload(`${b.name.toLowerCase().replace(/\s/g, '-')}-tds.pdf`)}>
          Use sample PDF
        </Button>
        <input ref={ref} type="file" accept="application/pdf" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0].name)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th className="th">Property</th>
                <th className="th text-right">Value</th>
                <th className="th">Unit</th>
                <th className="th">Source tag</th>
              </tr>
            </thead>
            <tbody>
              {b.values.map((v) => (
                <tr key={v.propertyId}>
                  <td className="td">{PROP[v.propertyId]?.name}</td>
                  <td className="td mono text-right">{String(v.value)}</td>
                  <td className="td text-xs text-ink3">{v.unit}</td>
                  <td className="td">
                    <Tag tone={v.tag === 'Lab-tested' ? 'pass' : v.tag === 'MSDS' ? 'borderline' : 'neutral'}>{v.tag}</Tag>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card p-4">
          <div className="label mb-3">Version history</div>
          <ol className="relative space-y-4 border-l border-line pl-4">
            {[...b.versions].reverse().map((v) => (
              <li key={v.v}>
                <span className="absolute -left-[5px] mt-1 h-2.5 w-2.5 rounded-full border-2 border-accent bg-surface" />
                <div className="mono text-xs font-semibold">v{v.v}</div>
                <div className="text-sm">{v.note}</div>
                <div className="mono text-2xs text-ink3">{v.date}</div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {runId && (
        <div className="space-y-3">
          <AgentConsole runId={runId} />
          <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
            <PdfPlaceholder highlight={progress} />
            <div className="card overflow-hidden">
              <div className="border-b border-line px-3 py-2 text-sm font-semibold">Extraction review</div>
              {extracted ? <ExtractionReview bm={b} /> : <div className="space-y-2 p-3">{Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton h-6" />)}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
