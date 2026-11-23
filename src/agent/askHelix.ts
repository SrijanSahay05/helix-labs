import type { Project } from '@/types';
import { SCENARIO } from '@/data/scenarios';
import { MAT } from '@/data/rawMaterials';
import { PROP } from '@/data/properties';
import { costPerKg, balanceTo100 } from '@/lib/cost';
import { useProjects } from '@/store/project';
import { AGENTS, type AgentId } from '@/agents/registry';
import { agentName } from '@/store/agents';
import { chartContext } from '@/features/graphs/explain';

export interface AskAnswer {
  /** the specialist whose work this answer is about (signs diff cards) */
  agent?: AgentId;
  /** trial labels the answer refers to (rendered as clickable chips that pin the trial in Graphs) */
  refs?: string[];
  thought: string[];
  text: string;
  diffs?: { label: string; from: string; to: string; apply: () => void }[];
}

export interface AskContext {
  /** an @-mentioned specialist answering instead of Helix */
  agent?: AgentId;
  project?: Project;
  stage?: string;
  page: string;
}

export const SUGGESTED: Record<string, string[]> = {
  intake: ['Why did you pick C2TE S1?', 'What does “transverse deformation” mean?', 'Is ₹ 18/kg realistic?', 'Which fields should I double-check?'],
  literature: ['Summarise the heat-ageing papers', 'Which sources disagree?', 'Show only patents', 'What is the strongest evidence for RDP dosage?'],
  pathways: ['Why is P1 ranked above P2?', 'Make P2 cheaper by 10 %', 'Why is P3 flagged?', 'Which pathway is lowest risk?'],
  trials: ['Why is T2 cost higher?', 'Swap RDP for a cheaper grade', 'Raise MHEC in T2 to 0.40 %', 'Is T4 within the cost ceiling?'],
  results: ['Which trial is best so far?', 'Why did T1 fail heat ageing?', 'When are aged tests due?'],
  analysis: ['Why raise RDP instead of MHEC?', 'What if we keep Ca-formate at 0.8 %?', 'Explain the borderline result'],
  final: ['Summarise the final formulation', 'What should the reviewer check?', 'Draft the R&D hand-over note'],
  projects: ['Which project needs attention?', 'What is running right now?', '@Lumen what are you reading?'],
  default: ['What can you do?', 'How do I start a new formulation?'],
};

const upd = (id: string, fn: (p: Project) => Project) => useProjects.getState().update(id, fn);

export function answer(q: string, ctx: AskContext): AskAnswer {
  const t = q.toLowerCase();
  const chart = chartContext();
  if (/explain (this|the) chart/.test(t)) {
    if (!chart) return { agent: 'analyst', thought: ['Look for an open Graphs panel'], text: 'Open **Graphs** in the Results or Analysis stage and ask again — I explain whatever view is on screen.' };
    const ins = chart.insights();
    return { agent: 'analyst', thought: [`View: ${chart.view}`, `Axes: ${chart.axes}`, chart.selection.length ? `${chart.selection.length} selected` : 'No selection'], text: ins.text, refs: ins.refs };
  }
  const p = ctx.project;
  const s = p ? SCENARIO[p.scenarioId] : undefined;

  if (p && /mhec.*(0\.40|0\.4)|raise mhec/.test(t)) {
    const tr = p.trials.find((x) => x.id === 'T2') ?? p.trials[0];
    if (tr && 'mhec' in tr.recipe) {
      const next = balanceTo100({ ...tr.recipe, mhec: 0.4 }, s!.balanceMaterial);
      return {
        agent: 'mixer',
        thought: ['Locate T2 recipe', 'Rebalance with sand to keep 100.00 %', `Cost ₹ ${costPerKg(tr.recipe).toFixed(2)} → ₹ ${costPerKg(next).toFixed(2)}`],
        text: `Raising MHEC to **0.40 %** in ${tr.id} improves water retention and open time [2]. Sand drops to ${next.sand?.toFixed(2)} % to keep the total at 100.00 %. Cost rises to **₹ ${costPerKg(next).toFixed(2)}/kg**.`,
        diffs: [
          { label: `MHEC in ${tr.id}`, from: `${tr.recipe.mhec.toFixed(2)} %`, to: '0.40 %', apply: () => upd(p.id, (x) => ({ ...x, trials: x.trials.map((y) => (y.id === tr.id ? { ...y, recipe: next, meta: { ...y.meta, mhec: { by: 'helix', agent: 'mixer', confidence: 0.86, reason: 'Proposed by Batch in Ask Helix' } } } : y)) })) },
          { label: `Sand in ${tr.id}`, from: `${tr.recipe.sand?.toFixed(2)} %`, to: `${next.sand?.toFixed(2)} %`, apply: () => {} },
        ],
      };
    }
  }
  if (p && /swap.*rdp|cheaper grade/.test(t)) {
    const tr = p.trials.find((x) => x.id === 'T3') ?? p.trials[0];
    if (tr && 'vae-rdp' in tr.recipe) {
      const rec = { ...tr.recipe, 'vae-rdp-b': tr.recipe['vae-rdp'] };
      delete (rec as Record<string, number>)['vae-rdp'];
      return {
        agent: 'mixer',
        thought: ['Find RDP alternatives in raw material master', 'VAE RDP grade B ₹ 205 vs ₹ 230 — pending approval', 'Estimate cost delta'],
        text: `**VAE RDP grade B** (₹ 205/kg) is the closest alternative. It saves **₹ ${(costPerKg(tr.recipe) - costPerKg(rec)).toFixed(2)}/kg** in ${tr.id}, but its approval is **pending** and its higher Tg may cut deformation by ~0.2 mm [11]. I'd test it as an extra trial rather than replace.`,
        diffs: [{ label: `RDP in ${tr.id}`, from: 'VAE RDP grade A', to: 'VAE RDP grade B', apply: () => upd(p.id, (x) => ({ ...x, trials: x.trials.map((y) => (y.id === tr.id ? { ...y, recipe: rec } : y)) })) }],
      };
    }
  }
  if (p && /t2 cost|cost higher/.test(t) && p.trials.length > 1) {
    const [a, b] = p.trials;
    return {
      agent: 'cost',
      thought: ['Diff T1 vs T2 recipes', 'Price the delta from master prices'],
      text: `${b.id} costs **₹ ${costPerKg(b.recipe).toFixed(2)}/kg** vs ${a.id} **₹ ${costPerKg(a.recipe).toFixed(2)}/kg**. The difference is the extra **0.50 % VAE RDP** (₹ 230/kg) — that alone adds ₹ 1.15/kg, partly offset by 0.50 % less sand.`,
    };
  }
  if (/p1.*above|why.*p1|rank/.test(t) && p?.pathways.length) {
    const [p1, p2] = p.pathways;
    return {
      agent: 'weaver',
      thought: ['Compare scores', 'Weight by top-3 priorities'],
      text: `${p1.id} scores **${p1.scores.overall.toFixed(2)}** vs ${p2.id} **${p2.scores.overall.toFixed(2)}**. ${p1.id} predicts better heat-aged adhesion and deformation — your top-2 priorities — at ₹ ${p1.costPerKg}/kg, still under the ₹ ${p.constraints.costCeiling} ceiling [1][11]. ${p2.id} is cheaper but borderline on deformation.`,
    };
  }
  if (/p3.*flag|why is p3/.test(t) && p) {
    return { agent: 'cost', thought: ['Check constraints'], text: `P3 is flagged because its predicted cost **₹ 19.60/kg** is **8.9 % over** the ₹ 18 ceiling. It has the best deformability (3.4 mm) thanks to the acrylic hybrid powder [3].` };
  }
  if (/why.*(c2te|s1)|pick c2te/.test(t)) {
    return { agent: 'classifier', thought: ['Tile size 1200 × 600 mm', 'Exterior facade, thermal cycling'], text: 'Tiles larger than 60 cm on an exterior facade move with heat. EN 12004 requires a **deformable (S1, ≥ 2.5 mm)** adhesive there, and the **T** and **E** suffixes cover slip and extended open time. IS 15477 Type 4 T S2 is the matching Indian class [11].' };
  }
  if (/transverse deformation/.test(t)) {
    return { agent: 'targets', thought: ['Look up EN 12002'], text: '**Transverse deformation** (EN 12002) measures how far a 3 mm strip of hardened adhesive bends before it breaks. **S1 ≥ 2.5 mm**, **S2 ≥ 5 mm**. In plain words: *flexibility — handles wall movement*.' };
  }
  if (/18|realistic|ceiling/.test(t) && p) {
    return { agent: 'cost', thought: ['Price P1 midpoint', 'Compare with benchmark price'], text: `Yes. P1 at mid-range dosages prices at **₹ 16.10/kg**, leaving ~₹ 1.90 headroom. Benchmark A sells at about ₹ 22/kg, so ₹ 18 RM keeps a healthy margin.` };
  }
  if (/double-check|check|low confidence/.test(t)) {
    return { thought: ['Scan fields with confidence < 0.7'], text: 'Please check: **Climate** (0.66 — inferred, not stated), **Time to grout** (0.68 — site practice), and **Water absorption** target (0.64 — internal guideline). Everything else is ≥ 0.74.' };
  }
  if (/best|so far/.test(t) && p?.results.length) {
    const tested = p.results.filter((r) => r.status !== 'pending');
    if (!tested.length) {
      const due = p.results.map((r) => r.dueDate).filter(Boolean).sort()[0];
      return { agent: 'lab', thought: ['Check lab results', 'All results still pending'], text: `No lab results are in yet, so I can't rank the trials. The first tests are due **${due ? new Date(due).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'soon'}**. Use **Import lab results** when the lab sheet is ready.` };
    }
    const ids = [...new Set(tested.map((r) => r.trialId))];
    const scored = ids.map((id) => ({ id, pass: p.results.filter((r) => r.trialId === id && r.status === 'pass').length })).sort((a, b) => b.pass - a.pass);
    return { agent: 'lab', thought: ['Count passes per trial'], text: `**${scored[0].id}** leads with ${scored[0].pass} passing properties. ${scored[1] ? `${scored[1].id} is next with ${scored[1].pass}.` : ''}` };
  }
  if (/t1 fail|heat ageing|heat-ageing/.test(t)) {
    return { agent: 'analyst', thought: ['Read failure modes', 'Cross-check cluster “Heat-ageing failure mechanisms”'], text: 'T1 has the lowest RDP (3.50 %). At 70 °C the polymer film at the tile interface degrades, giving **adhesive-mode failure** [7]. Papers show ~+0.12 N/mm² per +0.5 % RDP in this range [1].' };
  }
  if (/why raise rdp|instead of mhec/.test(t)) {
    return { agent: 'analyst', thought: ['Rank levers by sensitivity'], text: 'Heat-aged adhesion responds most to **RDP dosage** [1]; MHEC mainly drives open time and water retention [2], which already pass. Lowering Ca-formate also helps heat ageing slightly [6].' };
  }
  if (/summar/.test(t) && p) {
    return { agent: 'scribe', thought: ['Read brief and current stage'], text: `${p.name}: ${p.stages.final === 'complete' ? `locked as **${p.finalCode}**` : `currently in **${Object.entries(p.stages).find(([, v]) => v === 'running')?.[0] ?? 'review'}**`}, iteration ${p.iteration}, ${p.trials.length} trials, ${p.sources.length} sources.` };
  }
  if (/what can you do|start/.test(t)) {
    return { thought: [], text: 'The crew can draft a full brief from a link, TDS or one sentence, search literature, design and rank pathways, build trial recipes, parse lab results and propose the next iteration. Click **New formulation** to start.' };
  }
  // addressed to a specialist with no scripted answer: it explains its own part
  if (ctx.agent && ctx.agent !== 'conductor') {
    const a = AGENTS[ctx.agent];
    const name = agentName(ctx.agent);
    const did =
      ctx.agent === 'scholar' && p?.sources.length
        ? `On **${p.name}** I've read ${p.sources.length} sources; the strongest are in “${p.sources[0].cluster}” [1].`
        : ctx.agent === 'weaver' && p?.pathways.length
          ? `On **${p.name}** I designed ${p.pathways.length} pathways; ${p.pathways[0].id} leads at ${p.pathways[0].scores.overall.toFixed(2)}.`
          : ctx.agent === 'mixer' && p?.trials.length
            ? `On **${p.name}** I've built ${p.trials.length} trials across ${p.iteration} iteration${p.iteration > 1 ? 's' : ''}.`
            : ctx.agent === 'cost' && p
              ? `On **${p.name}** the ceiling is **₹ ${p.constraints.costCeiling ?? '—'}/kg**; I flag anything that goes over it.`
              : p
                ? `I'm looking at **${p.name}** now.`
                : 'Open a project and I can answer with its data.';
    return {
      agent: ctx.agent,
      thought: [`Answer as ${name} (${a.title})`, p ? `Project ${p.code}` : 'No project open'],
      text: `I'm **${name}**, the ${a.title.toLowerCase()}: ${a.role.charAt(0).toLowerCase()}${a.role.slice(1)}. ${did} My tools: ${a.tools.join(', ')}.`,
    };
  }
  // generic, context-aware template
  const stageName = ctx.stage ?? 'this screen';
  return {
    thought: ['Read current context', p ? `Project ${p.code}, ${p.targets.length} targets` : 'No project open'],
    text: p
      ? `For **${p.name}** (${p.standard.split(' / ')[0]}), on ${stageName}: the top priorities are **${p.top3.map((id) => PROP[id]?.name ?? (id === 'cost' ? 'Cost per kg' : id)).join('**, **')}**. ${s ? `Key lever material is ${MAT[s.leverMaterial]?.name}.` : ''} Ask me to change a value and I'll show the change for you to accept.`
      : 'Open a project and I can answer with its data. Or start a **New formulation** and paste a link — I will fill everything for you.',
  };
}
