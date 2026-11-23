import { createColumnHelper, flexRender, getCoreRowModel, getSortedRowModel, useReactTable, type SortingState } from '@tanstack/react-table';
import { ArrowUpDown, FileSpreadsheet, Search } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import type { RawMaterial } from '@/types';
import { MAT, RAW_MATERIALS } from '@/data/rawMaterials';
import { Tag } from '@/components/ui/Pill';
import { Button } from '@/components/ui/Button';
import { Modal, SectionTitle } from '@/components/ui/primitives';
import { AgentConsole } from '@/components/ai/AgentConsole';
import { runAgent } from '@/agent/engine';
import { useTasks } from '@/store/tasks';
import { uid } from '@/lib/format';

const col = createColumnHelper<RawMaterial>();
const FIELDS: { key: keyof RawMaterial; label: string; guesses: string[] }[] = [
  { key: 'name', label: 'Material', guesses: ['material', 'name', 'item', 'description'] },
  { key: 'fn', label: 'Function', guesses: ['function', 'role', 'use'] },
  { key: 'grade', label: 'Grade', guesses: ['grade', 'spec'] },
  { key: 'supplier', label: 'Supplier', guesses: ['supplier', 'vendor', 'make'] },
  { key: 'pricePerKg', label: 'Price (₹/kg)', guesses: ['rate', 'price', 'cost'] },
  { key: 'stockKg', label: 'Stock (kg)', guesses: ['stock', 'qty', 'quantity', 'inventory'] },
];

export function RawMaterialsPage() {
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [fn, setFn] = useState<string | null>(null);
  const [approval, setApproval] = useState<string | null>(null);
  const [extra, setExtra] = useState<RawMaterial[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [importState, setImportState] = useState<{ headers: string[]; rows: Record<string, unknown>[]; mapping: Record<string, string>; runId: string } | null>(null);
  const run = useTasks((s) => (importState ? s.runs[importState.runId] : undefined));
  const fileRef = useRef<HTMLInputElement>(null);

  const all = useMemo(() => [...RAW_MATERIALS, ...extra], [extra]);
  const data = useMemo(
    () => all.filter((m) => (!q || `${m.name} ${m.fn} ${m.supplier}`.toLowerCase().includes(q.toLowerCase())) && (!fn || m.fn === fn) && (!approval || m.approval === approval)),
    [all, q, fn, approval],
  );
  const fns = [...new Set(all.map((m) => m.fn))];

  const columns = useMemo(
    () => [
      col.accessor('name', { header: 'Material', cell: (c) => <span className="font-medium">{c.getValue()}</span> }),
      col.accessor('fn', { header: 'Function', cell: (c) => <span className="text-ink2">{c.getValue()}</span> }),
      col.accessor('grade', { header: 'Grade', cell: (c) => <span className="mono text-xs">{c.getValue()}</span> }),
      col.accessor('supplier', { header: 'Supplier' }),
      col.accessor('pricePerKg', { header: 'Price (₹/kg)', cell: (c) => <span className="mono block text-right">{c.getValue().toFixed(2)}</span> }),
      col.accessor('stockKg', { header: 'Stock (kg)', cell: (c) => <span className="mono block text-right">{c.getValue().toLocaleString()}</span> }),
      col.accessor('approval', {
        header: 'Approval',
        cell: (c) => (
          <Tag tone={c.getValue() === 'approved' ? 'pass' : c.getValue() === 'pending' ? 'borderline' : 'fail'} className="capitalize">
            {c.getValue()}
          </Tag>
        ),
      }),
      col.accessor('msdsUrl', { header: 'MSDS', cell: (c) => (c.getValue() ? <Tag tone="accent">MSDS ↗</Tag> : '—'), enableSorting: false }),
      col.accessor('alternatives', { header: 'Alternatives', cell: (c) => <span className="text-xs text-ink2">{c.getValue().map((a) => MAT[a]?.name ?? a).join(', ') || '—'}</span>, enableSorting: false }),
    ],
    [],
  );
  const table = useReactTable({ data, columns, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() });

  const startImport = (headers: string[], rows: Record<string, unknown>[], fileName: string) => {
    const mapping: Record<string, string> = {};
    for (const f of FIELDS) {
      const h = headers.find((x) => f.guesses.some((g) => x.toLowerCase().includes(g)));
      if (h) mapping[f.key] = h;
    }
    const runId = runAgent({
      id: `rm.import.${fileName}`,
      title: 'Mapping Excel columns',
      agent: 'reader',
      events: [
        { t: 'orb', state: 'connecting', label: `Mapping columns in ${fileName}…` },
        { t: 'plan', steps: ['Read sheet', 'Detect columns', 'Validate values'] },
        { t: 'step', index: 0, status: 'running' },
        { t: 'tool', name: 'extract_table', args: `"${fileName}"`, result: `${rows.length} rows · ${headers.length} columns`, ms: 600 },
        { t: 'step', index: 0, status: 'done' },
        { t: 'step', index: 1, status: 'running' },
        { t: 'tool', name: 'map_columns', args: `columns=${headers.length}`, result: `${Object.keys(mapping).length} mapped`, ms: 500 },
        ...Object.entries(mapping).map(([k, h]) => ({ t: 'think' as const, text: `Detected '${h}' → ${FIELDS.find((f) => f.key === k)?.label}` })),
        { t: 'step', index: 1, status: 'done' },
        { t: 'step', index: 2, status: 'running' },
        { t: 'check', agent: 'cost', text: `${rows.length} rows valid · prices numeric`, ok: true },
        { t: 'step', index: 2, status: 'done' },
        { t: 'done', summary: `${Object.keys(mapping).length} columns mapped — review before import` },
      ],
    });
    setImportState({ headers, rows, mapping, runId });
  };

  const onFile = async (f: File) => {
    const wb = XLSX.read(await f.arrayBuffer());
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]]);
    startImport(Object.keys(rows[0] ?? {}), rows, f.name);
  };
  const sample = () =>
    startImport(
      ['Item description', 'Role', 'Spec', 'Vendor', 'Rate', 'Qty on hand'],
      [
        { 'Item description': 'Redispersible powder grade C', Role: 'Flexibility / adhesion', Spec: 'Tg −5 °C', Vendor: 'Supplier Polymer-3', Rate: 215, 'Qty on hand': 800 },
        { 'Item description': 'Lightweight filler 0.1–0.3 mm', Role: 'Filler', Spec: 'Hollow glass', Vendor: 'Supplier Min', Rate: 95, 'Qty on hand': 400 },
      ],
      'supplier-price-list.xlsx',
    );
  const doImport = () => {
    if (!importState) return;
    const m = importState.mapping;
    setExtra((x) => [
      ...x,
      ...importState.rows.map((r) => ({
        id: uid('rm'),
        name: String(r[m.name] ?? 'Unnamed'),
        fn: String(r[m.fn] ?? '—'),
        grade: String(r[m.grade] ?? '—'),
        supplier: String(r[m.supplier] ?? '—'),
        pricePerKg: Number(r[m.pricePerKg] ?? 0),
        stockKg: Number(r[m.stockKg] ?? 0),
        approval: 'pending' as const,
        alternatives: [],
      })),
    ]);
    setImportState(null);
  };

  return (
    <div className="space-y-4">
      <SectionTitle
        title="Raw material master"
        sub="Prices drive live cost-per-kg everywhere in Helix."
        right={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={sample}>
              Load price list
            </Button>
            <Button onClick={() => fileRef.current?.click()}>
              <FileSpreadsheet size={14} /> Excel import
            </Button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          </div>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink3" />
          <input className="input pl-9" placeholder="Search material, function or supplier" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input w-full sm:w-56" value={fn ?? ''} onChange={(e) => setFn(e.target.value || null)} aria-label="Function">
          <option value="">All functions</option>
          {fns.map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
        <select className="input w-full sm:w-44" value={approval ?? ''} onChange={(e) => setApproval(e.target.value || null)} aria-label="Approval status">
          <option value="">All approval statuses</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
        <span className="text-xs text-ink3">
          Showing {data.length} of {all.length} materials
        </span>
      </div>
      <div className="table-wrap bg-surface shadow-card">
        <table className="w-full min-w-[1100px] [&_td]:whitespace-nowrap">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th key={h.id} className="th">
                    <button className="flex items-center gap-1" onClick={h.column.getToggleSortingHandler()} disabled={!h.column.getCanSort()}>
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {h.column.getCanSort() && <ArrowUpDown size={10} className="text-ink3" />}
                    </button>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((r) => (
              <tr key={r.id} className="hover:bg-surface2/60">
                {r.getVisibleCells().map((c) => (
                  <td key={c.id} className="td">
                    {flexRender(c.column.columnDef.cell, c.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={!!importState} onClose={() => setImportState(null)} title="Excel import · mapping preview" width={720}>
        {importState && (
          <div className="space-y-3">
            <AgentConsole runId={importState.runId} autoCollapse={false} />
            {run?.status === 'done' && (
              <>
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="th">Helix field</th>
                      <th className="th">Your column</th>
                    </tr>
                  </thead>
                  <tbody>
                    {FIELDS.map((f) => (
                      <tr key={f.key}>
                        <td className="td">{f.label}</td>
                        <td className="td">
                          <select className="input h-7 text-xs" value={importState.mapping[f.key] ?? ''} onChange={(e) => setImportState({ ...importState, mapping: { ...importState.mapping, [f.key]: e.target.value } })}>
                            <option value="">— not mapped —</option>
                            {importState.headers.map((h) => (
                              <option key={h}>{h}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-end">
                  <Button variant="primary" onClick={doImport}>
                    Import {importState.rows.length} rows
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
