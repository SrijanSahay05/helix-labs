import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { useState } from 'react';
import { useProjects } from '@/store/project';
import { useTasks } from '@/store/tasks';
import { Button } from '@/components/ui/Button';
import { SectionTitle, Select, Tabs } from '@/components/ui/primitives';
import { AgentConsole } from '@/components/ai/AgentConsole';
import { StateFrame } from '@/components/ui/StateFrame';
import { TypeText } from '@/components/ai/TypeText';
import { runAgent } from '@/agent/engine';
import { exportScript } from '@/agent/scripts/stages';
import { buildReport, REPORT_LABEL, type ReportKind } from '@/lib/reports';
import { downloadXlsx, printPdf, type Sheet } from '@/lib/exporter';
import { cn } from '@/lib/cn';
import { useChartSnapshots } from '@/features/graphs/reportSnapshots';

export function ReportsPage() {
  const projects = useProjects((s) => s.projects).filter((p) => p.trials.length > 0);
  const [pid, setPid] = useState(projects[0]?.id ?? '');
  const [kind, setKind] = useState<ReportKind>('trial-sheet');
  const [fmt, setFmt] = useState<'pdf' | 'xlsx'>('xlsx');
  const [runId, setRunId] = useState<string>();
  const [sheets, setSheets] = useState<Sheet[] | null>(null);
  const run = useTasks((s) => (runId ? s.runs[runId] : undefined));
  const p = projects.find((x) => x.id === pid);

  if (!projects.length) return <StateFrame state="empty" agent="scribe" message="Reports appear once a project has trial recipes." />;

  const generate = () => {
    if (!p) return;
    const sh = buildReport(kind, p);
    setSheets(null);
    setRunId(runAgent(exportScript(REPORT_LABEL[kind], kind, sh.reduce((a, s) => a + s.rows.length, 0)), { projectId: p.id, stage: 'report', onDone: () => setSheets(sh), notify: { title: `${REPORT_LABEL[kind]} ready · ${p.name}`, href: '/reports' } }));
  };
  const download = () => {
    if (!p || !sheets) return;
    if (fmt === 'xlsx') downloadXlsx(`${p.code}-${kind}`, sheets);
    else printPdf(`${REPORT_LABEL[kind]} — ${p.name}`, sheets);
  };

  return (
    <div className="space-y-4">
      <SectionTitle title="Reports" sub="Trial sheet, results comparison and final dossier — PDF or Excel." />
      <div className="grid gap-3 md:grid-cols-3">
        {(Object.keys(REPORT_LABEL) as ReportKind[]).map((k) => (
          <button key={k} onClick={() => setKind(k)} className={cn('card p-4 text-left transition-shadow', kind === k ? 'border-accent shadow-glow' : 'hover:border-ink3')}>
            <FileText size={18} className="text-accent" />
            <div className="mt-2 font-semibold">{REPORT_LABEL[k]}</div>
            <div className="text-xs text-ink2">
              {k === 'trial-sheet' ? 'Recipes, mixing protocol and test plan for the lab' : k === 'results' ? 'Properties × trials with pass / borderline / fail' : 'Locked recipe, test summary, sources and approvals'}
            </div>
          </button>
        ))}
      </div>
      <div className="card flex flex-wrap items-center gap-3 p-4">
        <Select value={pid} onChange={setPid} options={projects.map((x) => ({ value: x.id, label: x.name }))} className="w-full sm:w-80" />
        <Tabs
          value={fmt}
          onChange={setFmt}
          items={[
            { id: 'pdf', label: 'PDF' },
            { id: 'xlsx', label: 'Excel' },
          ]}
        />
        <Button variant="primary" className="ml-auto" onClick={generate}>
          Generate
        </Button>
      </div>
      {kind === 'results' && <ChartGallery />}
      {!runId && <StateFrame state="empty" agent="scribe" message="Pick a report type and a project — I'll lay it out, fill every table and hand you the file." />}
      {runId && <AgentConsole runId={runId} />}
      {sheets && run?.status === 'done' && (
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-line px-3 py-2">
            {fmt === 'xlsx' ? <FileSpreadsheet size={14} className="text-pass" /> : <FileText size={14} className="text-fail" />}
            <span className="text-sm font-semibold">Preview · {REPORT_LABEL[kind]}</span>
            <Button size="sm" variant="primary" className="ml-auto" onClick={download}>
              <Download size={13} /> Download {fmt.toUpperCase()}
            </Button>
          </div>
          <div className="space-y-4 p-4">
            {sheets.map((s) => (
              <div key={s.name}>
                <div className="label mb-1">{s.name}</div>
                <table className="w-full">
                  <tbody>
                    {s.rows.slice(0, 14).map((r, i) => (
                      <tr key={i}>
                        {r.map((c, k) =>
                          i === 0 ? (
                            <th key={k} className="th">
                              {c}
                            </th>
                          ) : (
                            <td key={k} className={cn('td text-xs', typeof c === 'number' || /^[\d.]+/.test(String(c)) ? 'mono' : '')}>
                              <TypeText inline text={String(c)} id={`rep:${s.name}:${i}:${k}:${c}`} />
                            </td>
                          ),
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Charts sent from Graphs → Export → "Add to report". */
function ChartGallery() {
  const items = useChartSnapshots((s) => s.items);
  const remove = useChartSnapshots((s) => s.remove);
  if (!items.length) return <p className="text-xs text-ink3">Tip: in Graphs, use ⋯ → Export → Add to report to include charts here.</p>;
  return (
    <div className="card p-4">
      <div className="label mb-2">Charts from Graphs · included in the Results comparison</div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((c) => (
          <figure key={c.id} className="rounded-lg border border-line p-2">
            <img src={c.image} alt={`${c.view} — ${c.axes}`} className="w-full rounded bg-white" />
            <figcaption className="mt-1 flex items-start gap-2 text-2xs text-ink2">
              <span className="flex-1">
                <b className="text-ink">{c.view}</b> · {c.axes}
                {c.selection ? ` · ${c.selection} selected` : ''}
                <br />
                <span className="text-ink3">{c.dataset}</span>
              </span>
              <button onClick={() => remove(c.id)} className="text-ink3 hover:text-fail">
                Remove
              </button>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
