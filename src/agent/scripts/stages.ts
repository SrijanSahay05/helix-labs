import type { AgentEvent, AgentScript } from '../types';
import type { Pathway, Project, Result, Source, StageId, StageStatus, Trial } from '@/types';
import { SCENARIO, buildSources } from '@/data/scenarios';
import { MAT } from '@/data/rawMaterials';
import { PROP } from '@/data/properties';
import { useProjects } from '@/store/project';
import { useUI } from '@/store/ui';
import { buildResults, buildTrials, mustHavesMet, pendingResults, proposeNext, trialScore } from '@/lib/simulate';
import { costPerKg } from '@/lib/cost';
import { uid } from '@/lib/format';
import type { AgentId } from '@/agents/registry';
import { applyResearchPreviewChoices } from '@/features/intake/research-preview/store';

const upd = (id: string, fn: (p: Project) => Project) => useProjects.getState().update(id, fn);
const stage = (id: string, st: StageId, status: StageStatus, note?: string): AgentEvent => ({
  t: 'effect',
  run: () => useProjects.getState().setStage(id, st, status, note),
});
const log = (id: string, text: string, agent: AgentId): AgentEvent => ({ t: 'effect', run: () => useProjects.getState().log(id, 'helix', text, agent) });

export const LIT_STEPS = ['Analyse', 'Identify', 'Strategy', 'Search', 'Cluster', 'Extract'];

export function literatureScript(p: Project): AgentScript {
  const s = SCENARIO[p.scenarioId];
  const all = buildSources(s, useUI.getState().usePastFormulations);
  const id = p.id;
  const byType = (t: Source['type']) => all.filter((x) => x.type === t).length;
  const batches = [all.slice(0, 12), all.slice(12, 30), all.slice(30, 48), all.slice(48)];
  const ev: AgentEvent[] = [
    stage(id, 'literature', 'running', 'Analysing the brief…'),
    { t: 'effect', run: () => upd(id, (x) => ({ ...x, sources: [] })) },
    { t: 'orb', state: 'searching', label: 'Analysing the brief…' },
    { t: 'plan', steps: LIT_STEPS.map((x) => `${x}`) },
    { t: 'step', index: 0, status: 'running' },
    { t: 'think', text: `Brief: ${s.productGuess}; top-3 targets drive the search.` },
    { t: 'tool', name: 'analyse_brief', args: `"${p.code}"`, result: `${p.targets.length} targets · ${p.top3.length} priorities`, ms: 600 },
    { t: 'step', index: 0, status: 'done' },
    { t: 'step', index: 1, status: 'running' },
    { t: 'orb', state: 'searching', label: 'Identifying key concepts…' },
    { t: 'tool', name: 'identify_concepts', args: `top3=${p.top3.length}`, result: s.clusters.slice(0, 4).join(', '), ms: 500 },
    { t: 'step', index: 1, status: 'done' },
    { t: 'step', index: 2, status: 'running' },
    { t: 'orb', state: 'composing', label: 'Writing search strategy…' },
    { t: 'tool', name: 'build_strategy', args: 'sources=papers,patents,tds', result: '3 query families', ms: 400 },
    { t: 'type', target: 'lit.query', text: s.query },
    { t: 'step', index: 2, status: 'done' },
    { t: 'step', index: 3, status: 'running' },
    { t: 'orb', state: 'searching', label: 'Searching papers, patents, TDS and supplier sheets…' },
    { t: 'tool', name: 'search_literature', args: `q="${s.clusters[0].toLowerCase()} ${s.clusters[2]?.toLowerCase() ?? ''}", k=40`, result: `${byType('Paper')} papers`, ms: 1400 },
    { t: 'effect', run: () => upd(id, (x) => ({ ...x, sources: batches[0] })) },
    { t: 'count', key: 'sources', value: 140 },
    { t: 'tool', name: 'search_literature', args: 'type=patent, k=20', result: `${byType('Patent')} patents`, ms: 1000 },
    { t: 'effect', run: () => upd(id, (x) => ({ ...x, sources: [...batches[0], ...batches[1]] })) },
    { t: 'count', key: 'sources', value: 290 },
    { t: 'tool', name: 'search_literature', args: `type=tds, subcategory="${p.subcategoryId}"`, result: `${byType('TDS')} TDS · ${byType('Supplier sheet')} supplier sheets`, ms: 900 },
    { t: 'effect', run: () => upd(id, (x) => ({ ...x, sources: [...batches[0], ...batches[1], ...batches[2]] })) },
    { t: 'count', key: 'sources', value: 412 },
    { t: 'check', text: `412 scanned → ${all.length} relevant (relevance ≥ 0.35)`, ok: true },
    { t: 'step', index: 3, status: 'done' },
    { t: 'step', index: 4, status: 'running' },
    { t: 'orb', state: 'connecting', label: 'Clustering sources by mechanism…' },
    { t: 'tool', name: 'cluster_sources', args: `n=${s.clusters.length}`, result: s.clusters.join(' · '), ms: 1200 },
    { t: 'effect', run: () => upd(id, (x) => ({ ...x, sources: all })) },
    { t: 'step', index: 4, status: 'done' },
    { t: 'step', index: 5, status: 'running' },
    { t: 'orb', state: 'shaping', label: 'Extracting dosages and measured values…' },
    { t: 'tool', name: 'extract_findings', args: 'top=20', result: '41 extractions', ms: 1100 },
    { t: 'check', text: 'Every extraction linked to a source and page', ok: true },
    { t: 'step', index: 5, status: 'done' },
    // pins, exclusions and uploads made in the Research preview carry over
    { t: 'effect', run: () => upd(id, applyResearchPreviewChoices) },
    stage(id, 'literature', 'complete', `${all.length} sources · ${s.clusters.length} clusters · 41 extractions`),
    log(id, `Literature complete — ${all.length} sources, ${s.clusters.length} clusters`, 'scholar'),
    { t: 'done', summary: `${all.length} sources · ${s.clusters.length} clusters · 41 extractions` },
  ];
  return { id: `literature.${p.id}`, title: 'Literature review', agent: 'scholar', events: ev };
}

export function pathwaysScript(p: Project): AgentScript {
  const s = SCENARIO[p.scenarioId];
  const id = p.id;
  const ev: AgentEvent[] = [
    stage(id, 'pathways', 'running', 'Designing pathways…'),
    { t: 'effect', run: () => upd(id, (x) => ({ ...x, pathways: [], selectedPathway: undefined, compare: [] })) },
    { t: 'orb', state: 'weaving', label: 'Weaving sources into composition routes…' },
    { t: 'plan', steps: ['Load brief and pinned sources', 'Enumerate composition routes', 'Predict properties', 'Score and rank', 'Check constraints', 'Flag hazards and risks'] },
    { t: 'step', index: 0, status: 'running' },
    { t: 'tool', name: 'load_context', args: `sources=${p.sources.filter((x) => !x.excluded).length}`, result: 'ok', ms: 500 },
    { t: 'step', index: 0, status: 'done' },
    { t: 'step', index: 1, status: 'running' },
    { t: 'tool', name: 'generate_pathways', args: `materials=${Object.keys(MAT).length}`, result: `${s.pathways.length + 7} candidates → ${s.pathways.length} kept`, ms: 1300 },
    { t: 'step', index: 1, status: 'done' },
    { t: 'step', index: 2, status: 'running' },
    { t: 'orb', state: 'solving', label: 'Predicting properties and scoring…' },
  ];
  s.pathways.forEach((pw) => {
    ev.push({ t: 'think', text: `${pw.id}: ${pw.name}.` });
    ev.push({ t: 'tool', name: 'predict_properties', args: `"${pw.id}"`, result: pw.predicted.map((x) => `${PROP[x.propertyId]?.name.split(' — ').pop()?.slice(0, 14)} ${x.value}`).slice(0, 3).join(' · '), ms: 700 });
    ev.push({ t: 'effect', run: () => upd(id, (x) => ({ ...x, pathways: [...x.pathways, { ...pw }] })) });
  });
  ev.push({ t: 'step', index: 2, status: 'done' }, { t: 'step', index: 3, status: 'running' });
  ev.push({ t: 'tool', name: 'score_pathway', args: 'weights=top3', result: s.pathways.map((x) => `${x.id} ${x.scores.overall.toFixed(2)}`).join(' > '), ms: 700 });
  ev.push({ t: 'step', index: 3, status: 'done' }, { t: 'step', index: 4, status: 'running' });
  const over = s.pathways.filter((x) => p.constraints.costCeiling !== undefined && x.costPerKg > p.constraints.costCeiling);
  ev.push({ t: 'tool', agent: 'cost', name: 'check_ceiling', args: `ceiling=₹ ${p.constraints.costCeiling ?? '—'}`, result: `${over.length} over`, ms: 500 });
  over.forEach((x) => ev.push({ t: 'check', agent: 'cost', text: `${x.id} cost ₹ ${x.costPerKg.toFixed(2)} > ceiling ₹ ${p.constraints.costCeiling} — flagged`, ok: false }));
  ev.push({ t: 'check', agent: 'cost', text: 'All other pathways within cost ceiling', ok: true });
  ev.push({ t: 'step', index: 4, status: over.length ? 'warn' : 'done' }, { t: 'step', index: 5, status: 'running' });
  ev.push({ t: 'tool', agent: 'sentinel', name: 'check_hazards', args: 'GHS + supply', result: `${s.pathways.reduce((a, x) => a + x.hazards.length, 0)} flags`, ms: 600 });
  ev.push({ t: 'step', index: 5, status: 'done' });
  // selection, compare set and variants from the Research preview carry over
  ev.push({ t: 'effect', run: () => upd(id, applyResearchPreviewChoices) });
  ev.push(stage(id, 'pathways', 'complete', `${s.pathways.length} ranked pathways · top ${s.pathways[0].id} ${s.pathways[0].scores.overall.toFixed(2)}`));
  ev.push(log(id, `Pathways ready — ${s.pathways.length} ranked`, 'weaver'));
  ev.push({ t: 'done', summary: `${s.pathways.length} ranked pathways` });
  return { id: `pathways.${p.id}`, title: 'Synthesis pathways', agent: 'weaver', events: ev };
}

export function variantScript(p: Project, base: Pathway, prompt: string): AgentScript {
  const cheaper = /cheap|cost|lower/i.test(prompt);
  const pct = Number(prompt.match(/(\d+)\s*%/)?.[1] ?? 10) / 100;
  const s = SCENARIO[p.scenarioId];
  const lever = base.composition.find((c) => c.materialId === s.leverMaterial) ?? base.composition[1];
  const variant: Pathway = {
    ...base,
    id: `${base.id}-b`,
    variantOf: base.id,
    rank: base.rank,
    name: `${base.name} — variant (${prompt.slice(0, 40)})`,
    composition: base.composition.map((c) => (c === lever && cheaper ? { ...c, range: [Math.round(c.range[0] * (1 - pct) * 100) / 100, Math.round(c.range[1] * (1 - pct) * 100) / 100] } : c)),
    predicted: base.predicted.map((x) => (cheaper ? { ...x, value: Math.round(x.value * (1 - pct / 3) * 100) / 100, status: x.status === 'pass' && pct > 0.08 && x.propertyId === s.top3[0].id ? ('borderline' as const) : x.status } : x)),
    costPerKg: Math.round(base.costPerKg * (cheaper ? 1 - pct : 1.04) * 100) / 100,
    scores: { ...base.scores, cost: Math.min(1, base.scores.cost + (cheaper ? pct : -0.03)), overall: Math.round((base.scores.overall - (cheaper ? 0.02 : 0)) * 100) / 100 },
  };
  return {
    id: `variant.${p.id}.${base.id}`,
    title: `Variant of ${base.id}`,
    agent: 'weaver',
    events: [
      { t: 'orb', state: 'weaving', label: `Designing a variant of ${base.id}…` },
      { t: 'plan', steps: ['Understand request', 'Adjust composition', 'Re-predict and re-score'] },
      { t: 'step', index: 0, status: 'running' },
      { t: 'think', text: `“${prompt}” → ${cheaper ? `cut ${MAT[lever.materialId]?.name} by ${Math.round(pct * 100)} %` : 'adjust lever material'}.` },
      { t: 'step', index: 0, status: 'done' },
      { t: 'step', index: 1, status: 'running' },
      { t: 'tool', name: 'make_variant', args: `"${lever.materialId}"`, result: `${lever.range.join('–')} → ${variant.composition.find((c) => c.materialId === lever.materialId)?.range.join('–')} %`, ms: 800 },
      { t: 'step', index: 1, status: 'done' },
      { t: 'step', index: 2, status: 'running' },
      { t: 'tool', name: 'predict_properties', args: `"${variant.id}"`, result: `₹ ${variant.costPerKg.toFixed(2)}/kg · overall ${variant.scores.overall.toFixed(2)}`, ms: 900 },
      { t: 'effect', run: () => upd(p.id, (x) => ({ ...x, pathways: [...x.pathways.filter((y) => y.id !== variant.id), variant] })) },
      { t: 'step', index: 2, status: 'done' },
      log(p.id, `Variant ${variant.id} created: ${prompt}`, 'weaver'),
      { t: 'done', summary: `Variant ${variant.id} ready · ₹ ${variant.costPerKg.toFixed(2)}/kg` },
    ],
  };
}

export function trialsScript(p: Project, pathwayId: string): AgentScript {
  const s = SCENARIO[p.scenarioId];
  const pw = p.pathways.find((x) => x.id === pathwayId) ?? p.pathways[0];
  const trials = buildTrials(s, pw);
  const id = p.id;
  const ev: AgentEvent[] = [
    stage(id, 'trials', 'running', 'Designing trial recipes…'),
    { t: 'effect', run: () => upd(id, (x) => ({ ...x, selectedPathway: pw.id, trials: [], results: [] })) },
    { t: 'orb', state: 'shaping', label: `Building trial recipes around ${pw.id}…` },
    { t: 'plan', steps: ['Select pathway', 'Design DOE (4 trials)', 'Compute recipes', 'Check 100 % and cost', 'Write mixing protocol', 'Build test plan'] },
    { t: 'step', index: 0, status: 'done' },
    { t: 'step', index: 1, status: 'running' },
    { t: 'think', text: `Vary ${MAT[s.leverMaterial]?.name ?? 'lever'} across its range; balance with ${MAT[s.balanceMaterial]?.name}.` },
    { t: 'tool', name: 'design_trials', args: `factors=2, levels=4`, result: 'T1–T4', ms: 700 },
    { t: 'step', index: 1, status: 'done' },
    { t: 'step', index: 2, status: 'running' },
  ];
  trials.forEach((t) => {
    ev.push({ t: 'effect', run: () => upd(id, (x) => ({ ...x, trials: [...x.trials, t] })) });
    ev.push({ t: 'tool', name: 'balance_recipe', args: `"${t.id}"`, result: `₹ ${costPerKg(t.recipe).toFixed(2)}/kg`, ms: 550 });
  });
  ev.push({ t: 'step', index: 2, status: 'done' }, { t: 'step', index: 3, status: 'running' });
  ev.push({ t: 'tool', agent: 'sentinel', name: 'validate_recipe', args: `trials=${trials.length}`, result: 'Σ = 100.00 %', ms: 400 });
  ev.push({ t: 'check', agent: 'sentinel', text: 'Recipe sums to 100.00 % ✓ (all trials)', ok: true });
  const ceil = p.constraints.costCeiling;
  trials.forEach((t) => {
    const c = costPerKg(t.recipe);
    if (ceil !== undefined && c > ceil) ev.push({ t: 'check', agent: 'cost', text: `${t.id} ₹ ${c.toFixed(2)} over ceiling ₹ ${ceil}`, ok: false });
  });
  ev.push({ t: 'step', index: 3, status: 'done' }, { t: 'step', index: 4, status: 'running' });
  ev.push({ t: 'orb', state: 'composing', label: 'Writing mixing protocol…' });
  ev.push({ t: 'tool', name: 'write_protocol', args: `steps=${s.mixingProtocol.length}`, result: 'ok', ms: 300 });
  ev.push({ t: 'type', target: 'trials.protocol', text: s.mixingProtocol.map((x, i) => `${i + 1}. ${x}`).join('\n') });
  ev.push({ t: 'step', index: 4, status: 'done' }, { t: 'step', index: 5, status: 'running' });
  ev.push({ t: 'tool', name: 'plan_tests', args: `standard="${p.standard.split(' / ')[0]}"`, result: `${s.testPlan.length} tests · ${s.testPlan.reduce((a, b) => a + b.specimens, 0)} specimens per trial`, ms: 700 });
  ev.push({ t: 'step', index: 5, status: 'done' });
  ev.push({ t: 'effect', run: () => upd(id, (x) => ({ ...x, results: pendingResults(s, x.trials) })) });
  ev.push(stage(id, 'trials', 'complete', `${trials.length} trials · DOE around ${pw.id} · test plan ready`));
  ev.push(stage(id, 'results', 'running', 'Waiting for lab · aged tests pending'));
  ev.push(log(id, `Trials T1–T${trials.length} designed around ${pw.id}`, 'mixer'));
  ev.push({ t: 'done', summary: `${trials.length} trials ready · export the trial sheet for the lab` });
  return { id: `trials.${p.id}`, title: 'Trial recipes', agent: 'mixer', events: ev };
}

export function resultsParseScript(p: Project, source: 'sample' | 'paste', pastedCount?: number): AgentScript {
  const s = SCENARIO[p.scenarioId];
  const id = p.id;
  const pendingTrials = p.trials.filter((t) => p.results.some((r) => r.trialId === t.id && r.status === 'pending'));
  const target = pendingTrials.length ? pendingTrials : p.trials;
  const fresh = buildResults(s, target, p.targets);
  const n = pastedCount ?? fresh.length;
  return {
    id: `results.${p.id}`,
    title: 'Parsing lab results',
    agent: 'lab',
    events: [
      stage(id, 'results', 'running', 'Parsing lab results…'),
      { t: 'orb', state: 'working', label: source === 'paste' ? `Parsing ${n} values…` : 'Loading sample lab results…' },
      { t: 'plan', steps: ['Parse block', 'Map to trials × properties', 'Compute means', 'Classify pass / borderline / fail'] },
      { t: 'step', index: 0, status: 'running' },
      { t: 'tool', name: 'parse_paste', args: source === 'paste' ? 'clipboard' : '"sample-lab-sheet.xlsx"', result: `${fresh.length * 5} readings`, ms: 800 },
      { t: 'step', index: 0, status: 'done' },
      { t: 'step', index: 1, status: 'running' },
      { t: 'think', text: `Mapped to ${target.length} trials × ${s.measured.length} properties.` },
      { t: 'step', index: 1, status: 'done' },
      { t: 'step', index: 2, status: 'running' },
      { t: 'tool', name: 'compute_mean', args: `n=${fresh.length}`, result: `${fresh.length} means`, ms: 400 },
      ...target.map(
        (t): AgentEvent => ({
          t: 'effect',
          run: () =>
            upd(id, (x) => ({
              ...x,
              results: [...x.results.filter((r) => r.trialId !== t.id), ...fresh.filter((r) => r.trialId === t.id)],
            })),
        }),
      ).flatMap((e) => [e, { t: 'wait', ms: 450 } as AgentEvent]),
      { t: 'step', index: 2, status: 'done' },
      { t: 'step', index: 3, status: 'running' },
      { t: 'check', text: `${fresh.filter((r) => r.status === 'pass').length} pass · ${fresh.filter((r) => r.status === 'borderline').length} borderline · ${fresh.filter((r) => r.status === 'fail').length} fail`, ok: true },
      { t: 'step', index: 3, status: 'done' },
      stage(id, 'results', 'complete', `${fresh.length} results · ${target.map((t) => t.id).join(', ')}`),
      log(id, `Lab results entered for ${target.map((t) => t.id).join(', ')}`, 'lab'),
      { t: 'done', summary: `Mapped to ${target.length} trials × ${s.measured.length} properties` },
    ],
  };
}

export function analysisScript(p: Project): AgentScript {
  const s = SCENARIO[p.scenarioId];
  const id = p.id;
  const current = p.trials.filter((t) => t.iteration === p.iteration);
  const metBy = current.find((t) => mustHavesMet(t.id, p.results, p.targets) && (p.constraints.costCeiling === undefined || costPerKg(t.recipe) <= p.constraints.costCeiling));
  const ev: AgentEvent[] = [
    stage(id, 'analysis', 'running', 'Comparing trials to targets…'),
    { t: 'orb', state: 'solving', label: 'Comparing trials with targets and benchmark…' },
    { t: 'plan', steps: ['Compare to targets', 'Compare to benchmark', 'Diagnose gaps', metBy ? 'Confirm targets met' : 'Propose next iteration'] },
    { t: 'step', index: 0, status: 'running' },
  ];
  ev.push({ t: 'tool', name: 'evaluate_targets', args: `trials=${current.map((t) => t.id).join(',')}`, result: 'pass / borderline / fail matrix', ms: 600 });
  current.forEach((t) => {
    const sc = trialScore(t.id, p.results);
    ev.push({ t: 'check', text: `${t.id}: ${sc.pass}/${sc.total} measured targets pass · ₹ ${costPerKg(t.recipe).toFixed(2)}/kg`, ok: sc.pass === sc.total });
  });
  ev.push({ t: 'step', index: 0, status: 'done' }, { t: 'step', index: 1, status: 'running' });
  ev.push({ t: 'tool', agent: 'benchmark', name: 'compare_values', args: `"${s.benchmarks[0].name}"`, result: 'delta table', ms: 700 });
  ev.push({ t: 'step', index: 1, status: 'done' }, { t: 'step', index: 2, status: 'running' });
  if (metBy) {
    ev.push({ t: 'think', text: `${metBy.id} passes every must-have target within cost ceiling.` });
    ev.push({ t: 'step', index: 2, status: 'done' }, { t: 'step', index: 3, status: 'running' });
    ev.push({ t: 'orb', state: 'composing', label: 'Writing the verdict…' });
    ev.push({ t: 'type', target: 'analysis.summary', text: `**Targets met ✓** — ${metBy.id} passes all must-have targets at ₹ ${costPerKg(metBy.recipe).toFixed(2)}/kg (ceiling ₹ ${p.constraints.costCeiling}). Heat-aged adhesion and deformation now beat ${s.benchmarks[0].name}. Ready to lock as the final formulation.` });
    ev.push({ t: 'effect', run: () => upd(id, (x) => ({ ...x, proposal: undefined, finalTrial: metBy.id, finalCode: x.finalCode ?? `${s.codePrefix}-014` })) });
    ev.push({ t: 'step', index: 3, status: 'done' });
    ev.push(stage(id, 'analysis', 'complete', `Targets met ✓ · ${metBy.id}`));
    ev.push(stage(id, 'final', 'running', 'Ready to lock'));
    ev.push(log(id, `Targets met by ${metBy.id}`, 'analyst'));
    ev.push({ t: 'done', summary: `Targets met ✓ · ${metBy.id}` });
  } else {
    const prop = proposeNext(s, p.trials, p.results, p.iteration);
    ev.push({ t: 'think', text: 'Must-have gaps found — proposing the next iteration.' });
    ev.push({ t: 'tool', name: 'propose_iteration', args: `iteration=${p.iteration + 1}`, result: prop.trials.map((t) => t.id).join(', '), ms: 600 });
    ev.push({ t: 'step', index: 2, status: 'warn' }, { t: 'step', index: 3, status: 'running' });
    ev.push({ t: 'orb', state: 'composing', label: 'Writing analysis and next trials…' });
    ev.push({ t: 'type', target: 'analysis.summary', text: prop.summary });
    ev.push({ t: 'effect', run: () => upd(id, (x) => ({ ...x, proposal: prop })) });
    ev.push({ t: 'step', index: 3, status: 'done' });
    ev.push(stage(id, 'analysis', 'complete', `Iteration ${p.iteration + 1} proposed · ${prop.trials.map((t) => t.id).join(', ')}`));
    ev.push(log(id, `Proposed ${prop.trials.map((t) => t.id).join(', ')}`, 'analyst'));
    ev.push({ t: 'done', summary: `Next iteration proposed · ${prop.trials.map((t) => t.id).join(', ')}` });
  }
  return { id: `analysis.${p.id}`, title: 'Analysis', agent: 'analyst', events: ev };
}

/** Accepting the proposal loops back to Trials with the new iteration. */
export function iterationScript(p: Project): AgentScript {
  const s = SCENARIO[p.scenarioId];
  const prop = p.proposal!;
  const id = p.id;
  return {
    id: `iterate.${p.id}`,
    title: `Iteration ${p.iteration + 1}`,
    agent: 'analyst',
    events: [
      { t: 'handoff', to: 'mixer', via: 'rail', note: prop.changes.length ? `Apply ${prop.changes.length} changes and build ${prop.trials.map((t) => t.id).join(', ')}.` : `Build ${prop.trials.map((t) => t.id).join(', ')}.` },
      { t: 'effect', run: () => upd(id, (x) => ({ ...x, iteration: x.iteration + 1, proposal: undefined })) },
      stage(id, 'trials', 'running', `Adding ${prop.trials.map((t) => t.id).join(', ')}…`),
      stage(id, 'analysis', 'waiting', ''),
      { t: 'orb', state: 'shaping', label: `Adding iteration ${p.iteration + 1} trials…` },
      { t: 'plan', steps: ['Apply accepted changes', 'Re-check 100 % and cost', 'Schedule tests'] },
      { t: 'step', index: 0, status: 'running' },
      ...prop.trials.flatMap((t): AgentEvent[] => [
        { t: 'effect', run: () => upd(id, (x) => ({ ...x, trials: [...x.trials.filter((y) => y.id !== t.id), t] })) },
        { t: 'tool', name: 'balance_recipe', args: `"${t.id}"`, result: `₹ ${costPerKg(t.recipe).toFixed(2)}/kg`, ms: 500 },
      ]),
      { t: 'step', index: 0, status: 'done' },
      { t: 'step', index: 1, status: 'running' },
      { t: 'check', agent: 'sentinel', text: 'Recipe sums to 100.00 % ✓', ok: true },
      { t: 'step', index: 1, status: 'done' },
      { t: 'step', index: 2, status: 'running' },
      { t: 'effect', run: () => upd(id, (x) => ({ ...x, results: [...x.results, ...pendingResults(s, prop.trials)] })) },
      { t: 'step', index: 2, status: 'done' },
      stage(id, 'trials', 'complete', `${p.trials.length + prop.trials.length} trials · iteration ${p.iteration + 1}`),
      stage(id, 'results', 'running', `Waiting for lab · ${prop.trials.map((t) => t.id).join(', ')}`),
      log(id, `Iteration ${p.iteration + 1} accepted — Delta handed off to Batch`, 'mixer'),
      { t: 'done', summary: `${prop.trials.map((t) => t.id).join(', ')} added` },
    ],
  };
}

export function uploadSourceScript(p: Project, fileName: string): AgentScript {
  const src: Source = { id: uid('up'), type: 'Uploaded', title: fileName.replace(/\.pdf$/i, ''), year: 2026, relevance: 0.82, finding: 'User-provided source — key dosages extracted.', cluster: SCENARIO[p.scenarioId].clusters[0], pinned: true };
  return {
    id: `upload.${p.id}.${fileName}`,
    title: 'Reading your source',
    agent: 'reader',
    events: [
      { t: 'orb', state: 'searching', label: `Reading your source “${fileName}”…` },
      { t: 'plan', steps: ['Read PDF', 'Extract values', 'Cluster'] },
      { t: 'step', index: 0, status: 'running' },
      { t: 'tool', name: 'detect_doc_type', args: `"${fileName}"`, result: 'PDF · 8 pages', ms: 900 },
      { t: 'step', index: 0, status: 'done' },
      { t: 'step', index: 1, status: 'running' },
      { t: 'tool', name: 'extract_table', args: 'all', result: '6 values', ms: 700 },
      { t: 'step', index: 1, status: 'done' },
      { t: 'step', index: 2, status: 'running' },
      { t: 'handoff', to: 'scholar', note: 'New source read. File it with the others.' },
      { t: 'tool', name: 'cluster_sources', args: `"${src.title.slice(0, 30)}"`, result: src.cluster, ms: 400 },
      { t: 'effect', run: () => upd(p.id, (x) => ({ ...x, sources: [src, ...x.sources] })) },
      { t: 'step', index: 2, status: 'done' },
      { t: 'done', summary: 'Source added and pinned' },
    ],
  };
}

export function exportScript(title: string, kind: string, rows: number, agent: AgentId = 'scribe'): AgentScript {
  return {
    id: `export.${kind}.${Date.now()}`,
    title,
    agent,
    events: [
      { t: 'orb', state: 'shaping', label: `Building ${title.toLowerCase()}…` },
      { t: 'plan', steps: ['Collect data', 'Lay out document', 'Render file'] },
      { t: 'step', index: 0, status: 'running' },
      { t: 'tool', name: 'collect', args: kind, result: `${rows} rows`, ms: 500 },
      { t: 'step', index: 0, status: 'done' },
      { t: 'step', index: 1, status: 'running' },
      { t: 'tool', name: 'layout', args: '"A4, lab template"', result: 'ok', ms: 600 },
      { t: 'step', index: 1, status: 'done' },
      { t: 'step', index: 2, status: 'running' },
      { t: 'tool', name: 'render_report', args: kind, result: 'file ready', ms: 500 },
      { t: 'step', index: 2, status: 'done' },
      { t: 'done', summary: `${title} ready` },
    ],
  };
}

export type { Result, Trial };
