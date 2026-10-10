import type { Project, StageId, StageStatus, StandardFamily } from '@/types';
import type { Scenario } from './scenarios/types';
import { buildSources, SCENARIO } from './scenarios';
import { findSubcategory } from './categories';
import { buildResults, buildTargets, buildTrials, pendingResults, proposeNext } from '@/lib/simulate';

export const STAGES: StageId[] = ['literature', 'pathways', 'trials', 'results', 'analysis', 'final'];

const waiting = (): Record<StageId, StageStatus> => ({ literature: 'waiting', pathways: 'waiting', trials: 'waiting', results: 'waiting', analysis: 'waiting', final: 'waiting' });

export function blankProject(s: Scenario, id: string, standards: StandardFamily[] = ['IS', 'EN']): Project {
  const sub = findSubcategory(s.subcategoryId);
  return {
    id,
    code: `${s.codePrefix}-${String(10 + Math.floor(Math.random() * 80)).padStart(3, '0')}`,
    name: s.projectName,
    owner: 'Saijal R.',
    updated: new Date().toISOString(),
    scenarioId: s.id,
    mode: 'scientist',
    categoryId: sub?.cat.id ?? s.categoryId,
    subcategoryId: s.subcategoryId,
    standard: s.standardAlt ? `${s.standard} / ${s.standardAlt}` : s.standard,
    useCase: s.useCase,
    benchmarks: s.benchmarks.map((b) => b.id),
    targets: buildTargets(s, standards),
    top3: s.top3.map((t) => t.id),
    constraints: s.constraints,
    summary: s.summary.scientist,
    stages: waiting(),
    sources: [],
    pathways: [],
    compare: [],
    trials: [],
    results: [],
    iteration: 1,
    approval: 'draft',
    activity: [{ id: 'a0', at: new Date().toISOString(), who: 'helix', agent: 'scribe', text: 'Brief drafted from intake' }],
    comments: [],
  };
}

/** Advance a project's data to "stage complete" for seeding and for the dev state switcher. */
export function advanceTo(p: Project, upTo: StageId | 'final-approved'): Project {
  const s = SCENARIO[p.scenarioId];
  const out: Project = { ...p, stages: { ...p.stages }, activity: [...p.activity] };
  const sign = (agent: NonNullable<Project['activity'][number]['agent']>, text: string) => out.activity.unshift({ id: `a-${agent}-${out.activity.length}`, at: new Date().toISOString(), who: 'helix', agent, text });
  const order = [...STAGES, 'final-approved'];
  const idx = order.indexOf(upTo);
  const done = (st: StageId) => order.indexOf(st) <= idx;
  if (done('literature')) {
    out.sources = buildSources(s);
    out.stages.literature = 'complete';
    out.stageNotes = { ...out.stageNotes, literature: `${out.sources.length} sources · ${s.clusters.length} clusters · 41 extractions` };
    sign('scholar', `Literature complete — ${out.sources.length} sources, ${s.clusters.length} clusters`);
  }
  if (done('pathways')) {
    out.pathways = s.pathways.map((x) => ({ ...x }));
    out.selectedPathway = 'P1';
    out.stages.pathways = 'complete';
    out.stageNotes = { ...out.stageNotes, pathways: `${out.pathways.length} ranked pathways · P1 selected` };
    sign('weaver', `Pathways ready — ${out.pathways.length} ranked`);
  }
  if (done('trials')) {
    out.trials = buildTrials(s, out.pathways[0]);
    out.stages.trials = 'complete';
    out.stageNotes = { ...out.stageNotes, trials: `${out.trials.length} trials · DOE around P1 · test plan ready` };
    out.results = pendingResults(s, out.trials);
    out.stages.results = 'running';
    out.stageNotes = { ...out.stageNotes, results: 'Waiting for lab · aged tests pending' };
    sign('mixer', `Trials T1–T${out.trials.length} designed around P1`);
  }
  if (done('results')) {
    out.results = buildResults(s, out.trials, out.targets);
    out.stages.results = 'complete';
    out.stageNotes = { ...out.stageNotes, results: `${out.results.length} results entered` };
    sign('lab', `Lab results entered for ${out.trials.map((t) => t.id).join(', ')}`);
  }
  if (done('analysis')) {
    out.proposal = proposeNext(s, out.trials, out.results, 1);
    out.stages.analysis = 'complete';
    out.stageNotes = { ...out.stageNotes, analysis: 'Iteration 2 proposed' };
    sign('analyst', `Proposed ${out.proposal.trials.map((t) => t.id).join(', ')}`);
  }
  if (done('final')) {
    const next = out.proposal!.trials;
    out.trials = [...out.trials, ...next];
    out.results = [...out.results, ...buildResults(s, next, out.targets)];
    out.iteration = 2;
    out.proposal = undefined;
    out.finalCode = `${s.codePrefix}-014`;
    out.finalTrial = next[0].id;
    out.stages.final = 'complete';
    out.stageNotes = { ...out.stageNotes, analysis: 'Targets met ✓', final: `Formulation ${s.codePrefix}-014 locked · 2 iterations · 11 days` };
    out.approval = 'submitted';
    sign('analyst', `Targets met by ${out.finalTrial}`);
  }
  if (upTo === 'final-approved') {
    out.approval = 'approved';
    out.approvers = ['Saijal R.', 'Atul K.'];
  }
  return out;
}

export function seedProjects(): Project[] {
  const mk = (sid: string, id: string, owner: string, daysAgo: number) => {
    const p = blankProject(SCENARIO[sid], id);
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return { ...p, owner, updated: d.toISOString() };
  };
  const tile = advanceTo({ ...mk('tile', 'p-tile', 'Saijal R.', 0), code: 'HX-TA-014' }, 'trials');
  tile.comments = [{ id: 'c-guard-voc', target: 'project', author: 'Guard', agent: 'sentinel', text: 'VOC check pending supplier MSDS for RDP grade B.', at: new Date().toISOString() }];
  const wp = { ...mk('crystalline', 'p-wp', 'Atul K.', 0), stages: { ...blankProject(SCENARIO.crystalline, 'x').stages, literature: 'running' as StageStatus } };
  const mc = advanceTo(mk('microconcrete', 'p-mc', 'Atul K.', 12), 'final-approved');
  const pce = { ...mk('pce', 'p-pce', 'Priya S.', 2), stages: { ...blankProject(SCENARIO.pce, 'x').stages, literature: 'failed' as StageStatus }, stageNotes: { literature: 'Supplier sheet could not be parsed (scanned image, no text layer)' } };
  const gyp = advanceTo(mk('gypsum', 'p-gyp', 'Priya S.', 4), 'literature');
  gyp.pathways = SCENARIO.gypsum.pathways;
  gyp.stages.pathways = 'low-confidence';
  gyp.stageNotes = { ...gyp.stageNotes, pathways: 'Only 2 sources support P3; retarder dosage extrapolated' };
  const epoxy = { ...mk('epoxy', 'p-epoxy', 'Saijal R.', 6), name: 'Epoxy grout — Commercial kitchens (draft)' };
  return [tile, wp, mc, pce, gyp, epoxy];
}
