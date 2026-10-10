import type { Project } from '@/types';
import { MAT } from '@/data/rawMaterials';
import { PROP } from '@/data/properties';
import { SCENARIO } from '@/data/scenarios';
import { costPerKg, recipeTotal } from './cost';
import { targetText } from './format';
import { STATUS_LABEL } from './status';
import type { Sheet } from './exporter';
import { useChartSnapshots } from '@/features/graphs/reportSnapshots';

export type ReportKind = 'trial-sheet' | 'results' | 'dossier';

export const REPORT_LABEL: Record<ReportKind, string> = {
  'trial-sheet': 'Trial sheet',
  results: 'Results comparison',
  dossier: 'Final dossier',
};

function recipeSheet(p: Project, trialIds?: string[]): Sheet {
  const trials = p.trials.filter((t) => !trialIds || trialIds.includes(t.id));
  const mats = [...new Set(trials.flatMap((t) => Object.keys(t.recipe)))];
  return {
    name: 'Recipe (% w-w)',
    rows: [
      ['Material', ...trials.map((t) => t.id)],
      ...mats.map((m) => [MAT[m]?.name ?? m, ...trials.map((t) => (t.recipe[m] ?? 0).toFixed(2))]),
      ['Total', ...trials.map((t) => recipeTotal(t.recipe).toFixed(2))],
      ['Cost / kg (₹)', ...trials.map((t) => costPerKg(t.recipe).toFixed(2))],
    ],
  };
}

export function buildReport(kind: ReportKind, p: Project): Sheet[] {
  const s = SCENARIO[p.scenarioId];
  if (kind === 'trial-sheet') {
    return [
      recipeSheet(p),
      { name: 'Mixing protocol', rows: [['Step', 'Instruction'], ...s.mixingProtocol.map((x, i) => [i + 1, x])] },
      { name: 'Test plan', rows: [['Test', 'Method', 'Specimens', 'Ages'], ...s.testPlan.map((t) => [t.test, t.method, t.specimens, t.ages])] },
    ];
  }
  const trialIds = [...new Set(p.results.map((r) => r.trialId))];
  const results: Sheet = {
    name: 'Results',
    rows: [
      ['Property', 'Target', 'Unit', ...trialIds],
      ...s.measured.map((pid) => {
        const t = p.targets.find((x) => x.propertyId === pid);
        return [
          PROP[pid]?.name ?? pid,
          t ? targetText(t) : '',
          PROP[pid]?.unit ?? '',
          ...trialIds.map((tid) => {
            const r = p.results.find((x) => x.trialId === tid && x.propertyId === pid);
            return r && r.status !== 'pending' ? `${r.mean.toFixed(2)} ${STATUS_LABEL[r.status]}` : 'Pending';
          }),
        ];
      }),
    ],
  };
  if (kind === 'results') {
    const charts = useChartSnapshots.getState().items;
    return charts.length ? [results, { name: 'Charts (from Graphs)', rows: [['Added', 'Dataset', 'View', 'Axes', 'Selected trials'], ...charts.map((c) => [new Date(c.at).toLocaleString('en-GB'), c.dataset, c.view, c.axes, c.selection])] }] : [results];
  }
  const final = p.finalTrial ? [p.finalTrial] : p.trials.slice(-1).map((t) => t.id);
  return [
    {
      name: 'Brief',
      rows: [
        ['Field', 'Value'],
        ['Project', p.name],
        ['Code', p.finalCode ?? p.code],
        ['Standard', p.standard],
        ['Approval', p.approval],
        ['Iterations', p.iteration],
      ],
    },
    { ...recipeSheet(p, final), name: 'Locked recipe' },
    results,
    { name: 'Sources', rows: [['Type', 'Title', 'Year'], ...p.sources.filter((x) => x.pinned).concat(p.sources.slice(0, 8)).map((x) => [x.type, x.title, x.year])] },
  ];
}
