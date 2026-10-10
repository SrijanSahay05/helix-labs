import type { AgentEvent, AgentScript } from '../types';
import type { Scenario } from '@/data/scenarios/types';
import type { Benchmark, Mode, StandardFamily, UseCase } from '@/types';
import { findSubcategory, GROUPS } from '@/data/categories';
import { PROP } from '@/data/properties';
import { MAT } from '@/data/rawMaterials';
import { USE_CASE_LABEL } from '@/data/copy';
import { buildTargets } from '@/lib/simulate';
import { targetText } from '@/lib/format';
import { useProjects, type IntakeStep } from '@/store/project';
import { AGENTS, INTAKE_OWNER, MAGIC_CREW, type AgentId } from '@/agents/registry';

export const TECH_RE = /\b(c2|c2te|s1|s2|is\s?\d{3,5}|en\s?\d{3,5}|astm|pce|snf|mpa|n\/mm|rdp|vae|mhec|hpmc|tds|type\s?\d)\b/i;

export function suggestMode(input: string, kind: 'link' | 'pdf' | 'text'): { mode: Mode; reason: string } {
  const m = input.match(TECH_RE);
  if (m) return { mode: 'scientist', reason: `Your input used technical terms (${m[0].toUpperCase()})` };
  if (kind !== 'text') return { mode: 'scientist', reason: 'You shared a technical data sheet' };
  return { mode: 'non-scientist', reason: 'Your request describes a site situation in plain terms' };
}

export function useCaseDisplay(k: keyof UseCase, v: unknown): string {
  if (k === 'size') {
    const s = v as UseCase['size'];
    return s.w ? `${s.w} × ${s.h} × ${s.t} mm` : `${s.t} mm thick`;
  }
  if (k === 'appTemp') {
    const [a, b] = v as [number, number];
    return `${a}–${b} °C`;
  }
  if (k === 'timeToGroutH' || k === 'timeToTrafficH') return (v as number) ? `${v} h` : 'n/a';
  if (Array.isArray(v)) return v.join(', ');
  if (k === 'exposure') return v === 'exterior' ? 'Exterior' : 'Interior';
  return String(v);
}

const USE_CASE_ORDER: (keyof UseCase)[] = ['substrate', 'surfaces', 'materialType', 'size', 'exposure', 'climate', 'appTemp', 'load', 'method', 'timeToGroutH', 'timeToTrafficH', 'standardClass'];

const markDone = (steps: IntakeStep[]): AgentEvent => ({
  t: 'effect',
  run: () => {
    const d = useProjects.getState().draft;
    useProjects.getState().patchDraft({ done: { ...d.done, ...Object.fromEntries(steps.map((s) => [s, true])) } });
  },
});

export function benchmarkFromSource(s: Scenario, domain?: string): Benchmark {
  const b = s.benchmarks[0];
  return { ...b, id: `${b.id}-src`, name: domain ? `${b.name} — created from ${domain}` : b.name, values: b.values.map((v) => ({ ...v })) };
}

/* ---------- per-step fills (used by Magic Start and step-by-step) ---------- */

function whoFills(input: string, kind: 'link' | 'pdf' | 'text'): AgentEvent[] {
  const sm = suggestMode(input, kind);
  return [
    { t: 'think', agent: 'conductor', text: `${sm.reason} → suggest ${sm.mode === 'scientist' ? 'Scientist' : 'Non-scientist'} mode.` },
    { t: 'fill', agent: 'conductor', path: 'mode', value: sm.mode, confidence: 0.86, reason: sm.reason, label: 'Who is using', display: sm.mode === 'scientist' ? 'Scientist' : 'Non-scientist' },
  ];
}

function categoryFills(s: Scenario): AgentEvent[] {
  const found = findSubcategory(s.subcategoryId)!;
  return [
    { t: 'tool', name: 'classify_product', args: `"${s.productGuess}"`, result: `${found.cat.groupName} › ${found.cat.name}`, ms: 700 },
    { t: 'fill', path: 'group', value: found.cat.group, confidence: 0.95, reason: `${found.cat.name} belongs to “${GROUPS[found.cat.group - 1].name}”`, label: 'Group', display: `${found.cat.group} · ${GROUPS[found.cat.group - 1].name}` },
    { t: 'fill', path: 'categoryId', value: found.cat.id, confidence: 0.94, reason: `Document describes ${found.cat.example.toLowerCase()}`, label: 'Category', display: found.cat.name, source: s.docType },
  ];
}

function subcategoryFills(s: Scenario): AgentEvent[] {
  const found = findSubcategory(s.subcategoryId)!;
  return [
    { t: 'think', text: `${s.productGuess} → sub-SKU “${found.sub.name}”.` },
    { t: 'fill', path: 'subcategoryId', value: found.sub.id, confidence: 0.9, reason: `Classification on ${s.docType} matches ${found.sub.name}`, label: 'Subcategory', display: found.sub.name },
    { t: 'fill', path: 'chemistry', value: s.chemistry, confidence: 0.91, reason: 'Binder and polymer listed in composition section', label: 'Chemistry', display: s.chemistry.join(', ') },
    { t: 'fill', path: 'forms', value: [s.form], confidence: 0.96, reason: 'Packaging and mixing instructions', label: 'Physical form', display: s.form },
    { t: 'tool', name: 'lookup_standard', args: `"${found.sub.defaultStandard?.split(' / ')[0]}"`, result: s.standard, ms: 600 },
    { t: 'fill', path: 'standard', value: s.standardAlt ? `${s.standard} / ${s.standardAlt}` : s.standard, confidence: 0.93, reason: 'Default standard for this subcategory', label: 'Standard', display: s.standardAlt ? `${s.standard} / ${s.standardAlt}` : s.standard },
    { t: 'tool', name: 'load_template', args: `"${found.sub.id}-v0"`, result: `${found.sub.propertyTemplate.length} properties`, ms: 450 },
  ];
}

function useCaseFills(s: Scenario, domain?: string): AgentEvent[] {
  const ev: AgentEvent[] = [{ t: 'tool', name: 'infer_use_case', args: domain ? `source="${domain}"` : 'request', result: `${Object.keys(s.useCase).length} fields`, ms: 800 }];
  for (const k of USE_CASE_ORDER) {
    const v = s.useCase[k];
    if (v === undefined) continue;
    if (k === 'size' && !(v as UseCase['size']).t) continue;
    const conf = s.useCaseConfidence[k] ?? 0.8;
    ev.push({
      t: 'fill',
      path: `useCase.${k}`,
      value: v,
      confidence: conf,
      reason: conf < 0.7 ? 'Not stated in source — inferred from typical use; please check' : 'Stated in the application section of the source',
      source: domain ?? 'Your request',
      label: USE_CASE_LABEL[k]?.scientist ?? k,
      display: useCaseDisplay(k, v),
    });
  }
  return ev;
}

function guidedFills(s: Scenario): AgentEvent[] {
  return s.guided.map((q) => ({
    t: 'fill' as const,
    path: `guided.${q.id}`,
    value: q.answer,
    confidence: 0.84,
    reason: 'Inferred from your request',
    label: q.q,
    display: q.options[q.answer].label,
  }));
}

function benchmarkFills(s: Scenario, domain?: string): AgentEvent[] {
  const bm = benchmarkFromSource(s, domain);
  return [
    { t: 'tool', agent: 'reader', name: 'extract_tds', args: 'pages=1-4', result: `${bm.values.length} properties`, ms: 900 },
    { t: 'tool', name: 'search_benchmarks', args: `subcategory="${s.subcategoryId}"`, result: `${s.benchmarks.length} candidates`, ms: 500 },
    { t: 'tool', name: 'create_benchmark', args: `name="${bm.name}"`, result: `${bm.values.filter((v) => v.tag === 'TDS').length} TDS · ${bm.values.filter((v) => v.tag === 'Lab-tested').length} lab · ${bm.values.filter((v) => v.tag === 'MSDS').length} MSDS`, ms: 500 },
    { t: 'fill', path: 'benchmarks', value: [bm], confidence: 0.9, reason: domain ? `Extracted from ${domain}` : 'Closest match in benchmark library', label: 'Benchmark', display: bm.name, source: domain },
  ];
}

function targetFills(s: Scenario, standards: StandardFamily[], perRow: boolean): AgentEvent[] {
  const rows = buildTargets(s, standards);
  const ev: AgentEvent[] = [
    { t: 'tool', name: 'draft_targets', args: `template="${s.subcategoryId}-v0"`, result: `${rows.length} target rows`, ms: 500 },
    { t: 'tool', name: 'compare_to_standard', args: `"${s.standard}"`, result: `${rows.filter((r) => r.standardLimit).length} limits`, ms: 600 },
  ];
  if (perRow) {
    ev.unshift({ t: 'effect', run: () => useProjects.getState().patchDraft({ targets: [] }) });
    rows.forEach((r, i) =>
      ev.push({ t: 'fill', path: `targets.${i}`, value: r, confidence: r.meta.confidence ?? 0.85, reason: r.meta.reason ?? '', source: r.meta.source, label: PROP[r.propertyId]?.name, display: `${targetText(r)} ${r.unit}` }),
    );
  } else {
    ev.push({ t: 'fill', path: 'targets', value: rows, confidence: 0.88, reason: 'Property template + standard + benchmark', label: 'Targets', display: `${rows.length} rows · ${rows.filter((r) => r.priority === 'must').length} must-haves` });
  }
  ev.push({ t: 'check', text: `Every target ≥ ${s.standard.split(' / ')[0]} minimum`, ok: true });
  ev.push({ t: 'tool', name: 'rank_priorities', args: 'k=3', result: s.top3.map((t) => t.id).join(' › '), ms: 400 });
  ev.push({ t: 'fill', path: 'top3', value: s.top3.map((t) => t.id), confidence: 0.83, reason: s.top3.map((t) => t.reason).join(' · '), label: 'Top 3', display: s.top3.map((t) => PROP[t.id]?.name ?? t.id).join(' › ') });
  return ev;
}

function constraintFills(s: Scenario): AgentEvent[] {
  const c = s.constraints;
  const bp = s.benchmarks[0]?.pricePerKg;
  return [
    { t: 'think', text: bp ? `${s.benchmarks[0].name} sells at ₹ ${bp}/kg → RM ceiling ₹ ${c.costCeiling}/kg keeps ~${Math.round((1 - (c.costCeiling ?? 0) / bp) * 100)} % headroom.` : 'Set cost ceiling from category norms.' },
    { t: 'tool', name: 'estimate_cost', args: bp ? `benchmark=₹ ${bp}/kg` : 'category norm', result: `ceiling ₹ ${c.costCeiling}/kg`, ms: 500 },
    { t: 'fill', path: 'constraints.costCeiling', value: c.costCeiling, confidence: 0.8, reason: bp ? `Benchmark price ₹ ${bp}/kg minus margin` : 'Category norm', label: 'Cost ceiling', display: `₹ ${c.costCeiling} / kg` },
    { t: 'fill', path: 'constraints.budgetBand', value: c.budgetBand, confidence: 0.8, reason: 'Derived from cost ceiling', label: 'Budget band', display: c.budgetBand ?? 'mid' },
    { t: 'tool', agent: 'sentinel', name: 'check_compliance', args: 'exterior, low-emission', result: c.compliance.join(', ') || 'none', ms: 450 },
    { t: 'fill', agent: 'sentinel', path: 'constraints.compliance', value: c.compliance, confidence: 0.86, reason: 'Exterior + low-emission market', label: 'Compliance', display: c.compliance.join(', ') },
    { t: 'fill', path: 'constraints.materialLimits', value: c.materialLimits, confidence: 0.74, reason: 'Avoid pathways known to fail water immersion', label: 'Raw material limits', display: c.materialLimits.map((m) => `${MAT[m.materialId]?.name ?? m.materialId} ${m.exclude ? 'excluded' : `≤ ${m.maxPct} %`}`).join(', ') || 'none' },
    { t: 'fill', path: 'constraints.site', value: c.site, confidence: 0.78, reason: 'From application temperature', label: 'Site conditions', display: `${c.site.tMin}–${c.site.tMax} °C · RH ≤ ${c.site.rhMax} %` },
    { t: 'fill', path: 'constraints.mustHaves', value: c.mustHaves, confidence: 0.8, reason: 'From use case', label: 'Must-haves', display: c.mustHaves.join(', ') },
    { t: 'fill', path: 'constraints.remark', value: c.remark ?? '', confidence: 0.7, reason: 'Packaging norms', label: 'Remark', display: c.remark || '—' },
  ];
}

function summaryFills(s: Scenario, mode: Mode): AgentEvent[] {
  const text = mode === 'scientist' ? s.summary.scientist : s.summary.plain;
  return [
    { t: 'orb', state: 'composing', label: 'Writing the brief…' },
    { t: 'tool', name: 'write_summary', args: mode === 'scientist' ? 'style=technical' : 'style=plain', result: `${text.split(/\s+/).length} words`, ms: 400 },
    { t: 'type', target: 'summary', text },
    { t: 'fill', path: 'summary', value: text, confidence: 0.88, reason: 'Synthesised from all inputs', label: 'Summary', display: 'Formulation summary' },
  ];
}

/* ---------- Magic Start: one run fills every step ---------- */

const h = (to: AgentId, note: string, from?: AgentId): AgentEvent => ({ t: 'handoff', to, note, ...(from ? { from } : {}) });

/** How many distinct agents signed a fill (guests included). */
function fillAgents(ev: AgentEvent[], lead: AgentId): number {
  let cur = lead;
  const who = new Set<AgentId>();
  for (const e of ev) {
    if (e.t === 'handoff') cur = e.to;
    else if (e.t === 'fill') who.add(e.agent ?? cur);
  }
  return who.size;
}

export function magicStartScript(s: Scenario, input: string, kind: 'link' | 'pdf' | 'text', domain: string | undefined, standards: StandardFamily[]): AgentScript {
  const sm = suggestMode(input, kind);
  const file = kind === 'pdf' ? input : domain ? `${domain}/…/tds.pdf` : undefined;
  const plan = ['Read the source', 'Identify product type', 'Map to category and subcategory', 'Infer use case', 'Pull standard and property template', 'Create benchmark', 'Draft targets and constraints', 'Write the brief'];
  const found = findSubcategory(s.subcategoryId);
  const ev: AgentEvent[] = [
    { t: 'join', agent: 'conductor', greeting: AGENTS.conductor.greeting },
    { t: 'orb', state: 'weaving', label: 'Planning the run…' },
    { t: 'tool', name: 'plan_run', args: `input=${kind}`, result: `${plan.length} steps · ${MAGIC_CREW.length - 1} agents`, ms: 500 },
    { t: 'plan', steps: plan },
    ...MAGIC_CREW.filter((a) => a !== 'conductor').map((a): AgentEvent => ({ t: 'join', agent: a, greeting: AGENTS[a].greeting })),
    { t: 'step', index: 0, status: 'running' },
    h('reader', kind === 'link' ? 'Read this link and tell me what it is.' : kind === 'pdf' ? 'Read this file and tell me what it is.' : 'Read the request and pull out the facts.'),
    { t: 'orb', state: 'searching', label: kind === 'text' ? 'Reading your request…' : `Reading ${domain ?? 'your file'}…` },
  ];
  if (kind === 'link') {
    ev.push({ t: 'tool', name: 'fetch_url', args: `"${input.startsWith('http') ? input : `https://${input}`}"`, result: '200 · 6 pages · 1.2 MB', ms: 1100 });
    ev.push({ t: 'tool', name: 'detect_doc_type', args: `"${domain}"`, result: `"${s.docType}"`, ms: 500 });
    ev.push({ t: 'tool', name: 'extract_tds', args: 'pages=1-3', result: `${s.benchmarks[0]?.values.length ?? 14} properties`, ms: 700 });
  } else if (kind === 'pdf') {
    ev.push({ t: 'tool', name: 'detect_doc_type', args: `"${input}"`, result: `"${s.docType}" · 4 pages`, ms: 700 });
    ev.push({ t: 'tool', name: 'extract_tds', args: 'pages=1-4', result: `${s.benchmarks[0]?.values.length ?? 14} properties`, ms: 900 });
  } else {
    ev.push({ t: 'tool', name: 'extract_table', args: `"${input.slice(0, 60)}${input.length > 60 ? '…' : ''}"`, result: `${input.split(/\s+/).length} tokens · 4 entities`, ms: 700 });
  }
  ev.push({ t: 'count', key: 'sources', value: 1 });
  ev.push(...whoFills(input, kind));
  ev.push(markDone(['who']));
  ev.push({ t: 'step', index: 0, status: 'done' });

  ev.push({ t: 'step', index: 1, status: 'running' }, { t: 'orb', state: 'searching', label: 'Identifying product type…' });
  ev.push({ t: 'think', text: `${file ? `Source ${file}` : 'Request'} describes a ${s.productGuess.toLowerCase()}.` });
  ev.push({ t: 'step', index: 1, status: 'done' });

  ev.push({ t: 'step', index: 2, status: 'running' });
  ev.push(h('classifier', `${s.productGuess}${found ? ` — ${found.sub.name}` : ''}. Map it.`));
  ev.push({ t: 'orb', state: 'connecting', label: 'Mapping to category and subcategory…' });
  ev.push(...categoryFills(s), markDone(['category']));
  ev.push(...subcategoryFills(s).filter((e) => !(e.t === 'tool' && e.name === 'load_template')), markDone(['subcategory']));
  ev.push({ t: 'step', index: 2, status: 'done' });

  ev.push({ t: 'step', index: 3, status: 'running' });
  ev.push(h('site', 'Category set. Work out where and how it is used.'));
  ev.push({ t: 'orb', state: 'connecting', label: 'Inferring the exact use case…' });
  if (s.id === 'tile') ev.push({ t: 'think', text: 'Large-format tiles > 60 cm on exterior → deformable adhesive (S1) required.' });
  ev.push(...useCaseFills(s, domain));
  ev.push({ t: 'effect', run: () => useProjects.getState().patchDraft({ guided: Object.fromEntries(s.guided.map((q) => [q.id, q.answer])) }) });
  const lows = Object.values(s.useCaseConfidence).filter((c) => (c ?? 1) < 0.7).length;
  ev.push({ t: 'step', index: 3, status: lows ? 'warn' : 'done' }, markDone(['usecase']));

  ev.push({ t: 'step', index: 4, status: 'running' }, { t: 'orb', state: 'searching', label: 'Pulling standard and property template…' });
  ev.push({ t: 'tool', agent: 'classifier', name: 'lookup_standard', args: `"${s.standard}"`, result: `${s.standard}${s.standardAlt ? ` / ${s.standardAlt}` : ''}`, ms: 700 });
  ev.push({ t: 'tool', agent: 'classifier', name: 'load_template', args: `"${s.subcategoryId}-v0"`, result: `${s.targets.length} properties`, ms: 500 });
  ev.push({ t: 'step', index: 4, status: 'done' });

  ev.push({ t: 'step', index: 5, status: 'running' });
  ev.push(h('benchmark', `Use case is ${s.useCase.exposure ?? 'set'}. Find the closest benchmark.`));
  ev.push({ t: 'orb', state: 'searching', label: 'Creating benchmark from the source…' });
  ev.push(...benchmarkFills(s, domain), markDone(['benchmark']));
  ev.push({ t: 'count', key: 'sources', value: 3 });
  ev.push({ t: 'step', index: 5, status: 'done' });

  ev.push({ t: 'step', index: 6, status: 'running' });
  ev.push(h('targets', `Benchmark ready. Set targets against ${s.standard.split(' / ')[0]}.`));
  ev.push({ t: 'orb', state: 'solving', label: 'Drafting targets…' });
  ev.push(...targetFills(s, standards, false), markDone(['targets']));
  ev.push(h('cost', 'Targets set. Price it and set the limits.'));
  ev.push({ t: 'orb', state: 'solving', label: 'Setting cost and constraints…' });
  ev.push(...constraintFills(s), markDone(['constraints']));
  ev.push({ t: 'check', text: `Cost ceiling ₹ ${s.constraints.costCeiling}/kg is reachable with ${s.pathways[0]?.id ?? 'the top pathway'}`, ok: true });
  ev.push({ t: 'step', index: 6, status: 'done' });

  ev.push({ t: 'step', index: 7, status: 'running' });
  ev.push(h('scribe', 'Everything is in. Write it up.'));
  ev.push(...summaryFills(s, sm.mode), markDone(['preview']));
  ev.push({ t: 'check', text: 'Brief complete · all required sections present', ok: true });
  ev.push({ t: 'step', index: 7, status: 'done' });
  ev.push(h('conductor', 'Brief is written.'));
  ev.push({ t: 'effect', run: () => useProjects.getState().patchDraft({ magic: 'done' }) });
  const filled = ev.filter((e) => e.t === 'fill').length;
  ev.push({ t: 'done', summary: `Brief drafted · ${filled} fields filled by ${fillAgents(ev, 'conductor')} agents · ${lows + 1} need your check` });
  return { id: `intake.fromLink.${s.id}`, title: 'Magic Start · drafting brief', agent: 'conductor', events: ev };
}

/* ---------- Step-by-step: Helix pre-suggests on each step ---------- */

export function stepScript(step: IntakeStep, s: Scenario, input: string, standards: StandardFamily[], mode: Mode): AgentScript | null {
  const k: 'link' | 'pdf' | 'text' = 'text';
  const wrap = (title: string, orb: AgentEvent & { t: 'orb' }, plan: string[], body: AgentEvent[], doneText: string): AgentScript => ({
    id: `intake.step.${step}.${s.id}`,
    title,
    agent: INTAKE_OWNER[step],
    events: [{ t: 'join', agent: INTAKE_OWNER[step], greeting: AGENTS[INTAKE_OWNER[step]].greeting }, orb, { t: 'plan', steps: plan }, { t: 'step', index: 0, status: 'running' }, ...body, { t: 'step', index: 0, status: 'done' }, ...(plan[1] ? [{ t: 'step' as const, index: 1, status: 'done' as const }] : []), { t: 'done', summary: doneText }],
  });
  switch (step) {
    case 'who':
      return wrap('Suggesting mode', { t: 'orb', state: 'listening', label: 'Reading how you described the job…' }, ['Read your wording', 'Suggest a mode'], whoFills(input, k), 'Mode suggested');
    case 'category':
      return wrap('Picking a category', { t: 'orb', state: 'connecting', label: 'Matching your need to a category…' }, ['Classify product', 'Pick group and card'], categoryFills(s), 'Category suggested');
    case 'subcategory':
      return wrap('Choosing subcategory', { t: 'orb', state: 'connecting', label: 'Choosing subcategory, chemistry and form…' }, ['Pick sub-SKU', 'Set standard & template'], subcategoryFills(s), 'Standard and template loaded');
    case 'usecase':
      return wrap('Filling use case', { t: 'orb', state: 'connecting', label: 'Filling the use case…' }, ['Infer site conditions', 'Map to standard class'], mode === 'scientist' ? useCaseFills(s) : [...guidedFills(s), { t: 'effect', run: () => useProjects.getState().patchDraft({ useCase: { ...s.useCase } }) }], 'Use case filled');
    case 'benchmark':
      return wrap('Finding closest benchmark', { t: 'orb', state: 'searching', label: 'Searching the benchmark library…' }, ['Search library', 'Create benchmark'], benchmarkFills(s), 'Benchmark ready');
    case 'targets':
      return wrap('Setting targets', { t: 'orb', state: 'solving', label: 'Setting property targets…' }, ['Load template', 'Set targets & rank top 3'], targetFills(s, standards, true), `${s.targets.length} targets set`);
    case 'constraints':
      return wrap('Setting constraints', { t: 'orb', state: 'solving', label: 'Setting cost and compliance constraints…' }, ['Price check', 'Compliance & site'], constraintFills(s), 'Constraints set');
    case 'preview':
      return wrap('Writing preview', { t: 'orb', state: 'weaving', label: 'Weaving inputs into a summary…' }, ['Synthesise', 'Write'], summaryFills(s, mode), 'Summary written');
    default:
      return null;
  }
}
