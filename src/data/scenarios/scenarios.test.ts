import { describe, expect, it } from 'vitest';
import { CATEGORIES, findSubcategory } from '../categories';
import { PROP } from '../properties';
import { MAT } from '../rawMaterials';
import { buildResults, buildTargets, buildTrials, mustHavesMet, proposeNext } from '@/lib/simulate';
import { costPerKg } from '@/lib/cost';
import { routeScenario, SCENARIOS, scenarioForSub } from '.';

/** Groups whose every subcategory has a demo scenario; grows one phase at a time. */
const COVERED_GROUPS = [1, 2, 3, 4, 5, 6];

const midSum = (c: { range: [number, number] }[]) => c.reduce((n, x) => n + (x.range[0] + x.range[1]) / 2, 0);

describe('demo scenarios', () => {
  it('ids are unique', () => {
    expect(new Set(SCENARIOS.map((s) => s.id)).size).toBe(SCENARIOS.length);
  });

  it.each(SCENARIOS.map((s) => [s.id, s] as const))('%s: data references resolve', (_, s) => {
    const found = findSubcategory(s.subcategoryId);
    expect(found?.cat.id).toBe(s.categoryId);
    const props = [
      ...s.targets.map((t) => t.propertyId),
      ...s.measured,
      ...s.top3.map((t) => t.id).filter((id) => id !== 'cost'),
      ...s.benchmarks.flatMap((b) => b.values.map((v) => v.propertyId)),
      ...s.pathways.flatMap((p) => p.predicted.map((v) => v.propertyId)),
    ];
    expect(props.filter((id) => !PROP[id])).toEqual([]);
    const mats = [s.balanceMaterial, s.leverMaterial, ...s.pathways.flatMap((p) => p.composition.map((c) => c.materialId))];
    expect(mats.filter((id) => !MAT[id])).toEqual([]);
    const targetIds = new Set(s.targets.map((t) => t.propertyId));
    expect(s.measured.filter((id) => !targetIds.has(id))).toEqual([]);
    const srcIds = new Set(s.sources.map((x) => x.id));
    expect(s.pathways.flatMap((p) => p.citations).filter((id) => !srcIds.has(id))).toEqual([]);
  });

  it.each(SCENARIOS.flatMap((s) => s.pathways.map((p) => [`${s.id} ${p.id}`, p] as const)))('%s: composition sums to ~100 %%', (_, p) => {
    expect(midSum(p.composition)).toBeGreaterThan(95);
    expect(midSum(p.composition)).toBeLessThan(105);
  });

  it.each(SCENARIOS.map((s) => [s.id, s] as const))('%s: top pathway is under the cost ceiling', (_, s) => {
    expect(s.pathways[0].costPerKg).toBeLessThanOrEqual(s.constraints.costCeiling ?? Infinity);
  });

  // analysis only closes a run on a trial under the ceiling; a proposal above it loops forever
  it.each(SCENARIOS.map((s) => [s.id, s] as const))('%s: proposed next trials stay under the cost ceiling', (_, s) => {
    const trials = buildTrials(s, s.pathways[0]);
    const results = buildResults(s, trials, buildTargets(s, ['IS', 'EN']));
    for (const t of proposeNext(s, trials, results, 1).trials) expect(costPerKg(t.recipe)).toBeLessThanOrEqual(s.constraints.costCeiling ?? Infinity);
  });

  // the analysis loop: accept each proposal and import results until a trial passes the must-haves under the ceiling
  it.each(SCENARIOS.map((s) => [s.id, s] as const))('%s: iterations reach a final trial', (_, s) => {
    const targets = buildTargets(s, ['IS', 'EN']);
    const ceiling = s.constraints.costCeiling ?? Infinity;
    let trials = buildTrials(s, s.pathways[0]);
    let results = buildResults(s, trials, targets);
    let iteration = 1;
    const met = () => trials.some((t) => t.iteration === iteration && mustHavesMet(t.id, results, targets) && costPerKg(t.recipe) <= ceiling);
    while (!met() && iteration < 5) {
      const next = proposeNext(s, trials, results, iteration).trials;
      trials = [...trials, ...next];
      results = [...results, ...buildResults(s, next, targets)];
      iteration++;
    }
    expect(iteration).toBeLessThanOrEqual(3);
  });

  it.each(SCENARIOS.map((s) => [s.id, s] as const))('%s: its example brief routes to it', (_, s) => {
    expect(routeScenario(s.example).id).toBe(s.id);
  });

  // briefs that mention another product's keyword, routed by what is being made
  it.each([
    ['Tile adhesive with cellulose fibre for exterior walls', 'tile'],
    ['Tile adhesive with a calcium formate accelerator', 'tile'],
    ['Waterproofing under bathroom tiles', 'crystalline'],
    ['Need something for my building', 'tile'],
    ['Shotcrete accelerator for a tunnel', 'sc-af'],
    ['Epoxy floor for a car park ramp', 'rf-epoxy'],
    ['Grout for tile joints in a living room', 'tg-cg2'],
    ['Grout for tile joints in a kitchen', 'epoxy'],
    ['Epoxy tile grout for a pool', 'epoxy'],
    ['Precision grout for machine base plates', 'pg-ns'],
    ['Epoxy grout under a compressor base plate', 'pg-epoxy'],
    ['Epoxy injection for cracks in a slab', 'ir-epoxy'],
    ['PU injection to stop a leak', 'inj-pu'],
    ['Repair the spalled balcony slab', 'rm-r4'],
    ['Zinc-rich primer for rebar', 'pc-zinc'],
    ['Acrylic primer for walls', 'bd-acr'],
    ['Fire-rated sealant for a service shaft', 'fp-firestop'],
    ['Intumescent paint for steel columns', 'fp-intumescent'],
    ['PU foam injection for a leaking crack', 'inj-pu'],
    ['Expanding PU foam for window frames', 'ca-pufoam'],
    ['MS polymer sealant for joints', 'sl-ms'],
    ['MS polymer adhesive for panels', 'ca-ms'],
  ])('"%s" routes to %s', (brief, id) => {
    expect(routeScenario(brief).id).toBe(id);
  });

  it.each(CATEGORIES.filter((c) => COVERED_GROUPS.includes(c.group)).flatMap((c) => c.subcategories.map((x) => [x.id] as const)))('%s has a demo scenario', (id) => {
    expect(scenarioForSub(id)?.subcategoryId).toBe(id);
  });
});
