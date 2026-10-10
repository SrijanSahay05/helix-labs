import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { BENCHMARKS } from '@/data/benchmarks';
import { findSubcategory } from '@/data/categories';
import { Tag } from '@/components/ui/Pill';
import { SectionTitle } from '@/components/ui/primitives';

export function BenchmarksPage() {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const list = BENCHMARKS.filter((b) => `${b.name} ${b.maker} ${b.standardClass}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-4">
      <SectionTitle
        title="Benchmark library"
        sub="Competitor products with values tagged by source. Maker names are placeholders."
        right={
          <div className="relative w-full sm:w-72">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink3" />
            <input className="input pl-9" placeholder="Search benchmarks" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        }
      />
      <div className="table-wrap bg-surface shadow-card">
        <table className="w-full min-w-[1000px] [&_td]:whitespace-nowrap">
          <thead>
            <tr>
              <th className="th">Product</th>
              <th className="th">Maker</th>
              <th className="th">Subcategory</th>
              <th className="th">Standard class</th>
              <th className="th text-right"># values</th>
              <th className="th">Value sources</th>
              <th className="th text-right">₹ / kg</th>
              <th className="th">Last updated</th>
              <th className="th text-right">Version</th>
            </tr>
          </thead>
          <tbody>
            {list.map((b) => (
              <tr key={b.id} onClick={() => nav(`/benchmarks/${b.id}`)} className="cursor-pointer hover:bg-surface2/70">
                <td className="td font-medium">{b.name}</td>
                <td className="td text-ink2">{b.maker}</td>
                <td className="td text-ink2">{findSubcategory(b.subcategoryId)?.sub.name}</td>
                <td className="td mono text-xs">{b.standardClass}</td>
                <td className="td mono text-right">{b.values.length}</td>
                <td className="td">
                  <div className="flex gap-1">
                    {(['TDS', 'MSDS', 'Lab-tested'] as const).map((t) => {
                      const n = b.values.filter((v) => v.tag === t).length;
                      return n ? (
                        <Tag key={t} tone={t === 'Lab-tested' ? 'pass' : t === 'MSDS' ? 'borderline' : 'neutral'}>
                          {t} {n}
                        </Tag>
                      ) : null;
                    })}
                  </div>
                </td>
                <td className="td mono text-right">{b.pricePerKg ?? '—'}</td>
                <td className="td mono text-xs">{b.updated}</td>
                <td className="td mono text-right">v{b.versions.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
