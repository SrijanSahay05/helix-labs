import { describe, expect, it } from 'vitest';
import { allMustPass, buildResearch, paretoFront } from '@/data/demo/research';
import { buildSources, routeScenario, SCENARIO, SCENARIOS } from '@/data/scenarios';
import { buildResults, buildTargets, buildTrials, mustHavesMet, proposeNext } from '@/lib/simulate';
import { RESEARCH_PACKS } from '@/data/demo/packs';
import { computeLayout, OUT_CAP } from './layout';
import { STEPS, TOTAL_MS } from './script';

describe('research preview seed (tile)', () => {
  const d = buildResearch('tile');
  it('keeps the §11 counts', () => {
    expect(d.sources).toHaveLength(412);
    expect(d.sources.filter((s) => s.type === 'Paper')).toHaveLength(248);
    expect(d.sources.filter((s) => s.type === 'Patent')).toHaveLength(71);
    expect(d.sources.filter((s) => s.type === 'TDS')).toHaveLength(58);
    expect(d.sources.filter((s) => s.type === 'Supplier sheet')).toHaveLength(35);
    expect(d.sources.filter((s) => s.status !== 'out')).toHaveLength(186);
    expect(d.sources.filter((s) => s.status === 'relevant')).toHaveLength(63);
    expect(d.facts).toHaveLength(41);
    expect(d.clusters.map((c) => c.count)).toEqual([14, 11, 9, 7, 8, 8, 6]);
    d.clusters.forEach((c) => expect(d.sources.filter((s) => s.cluster === c.id)).toHaveLength(c.count));
    expect(d.sources.filter((s) => s.top)).toHaveLength(5);
  });
  it('has 12 routes, 5 feasible, 2 meeting every must-have, P1 first at 0.87 / ₹16.1', () => {
    expect(d.routes).toHaveLength(12);
    const f = d.routes.filter((r) => r.feasible);
    expect(f.map((r) => [r.id, r.scores.overall, r.costPerKg])).toEqual([
      ['P1', 0.87, 16.1],
      ['P2', 0.81, 14.9],
      ['P3', 0.78, 19.6],
      ['P4', 0.72, 13.8],
      ['P5', 0.61, 15.2],
    ]);
    expect(d.routes.filter(allMustPass).map((r) => r.id)).toEqual(['P1', 'P3']);
    expect(paretoFront(d.routes).map((r) => r.id)).toEqual(['P4', 'P2', 'P1', 'P3']);
  });
  it('sankey flows add up to 41 facts and every cited ref exists', () => {
    expect(d.flows.reduce((a, f) => a + f.value, 0)).toBe(41);
    d.flows.forEach((f) => expect(f.factIds).toHaveLength(f.value));
    d.routes.flatMap((r) => r.citations).forEach((c) => expect(d.sources.some((s) => s.ref === c)).toBe(true));
    expect(new Set(d.sources.map((s) => s.ref)).size).toBe(412);
  });
  it('caps rendered screened-out nodes', () => {
    const l = computeLayout(d);
    expect(l.nodes.filter((n) => n.src.status !== 'relevant')).toHaveLength(OUT_CAP);
    expect(l.ghost).toBe(412 - 63 - OUT_CAP);
  });
  it('plays for 50–60 s at 1×', () => {
    expect(STEPS).toHaveLength(10);
    expect(TOTAL_MS).toBeGreaterThanOrEqual(50000);
    expect(TOTAL_MS).toBeLessThanOrEqual(60000);
  });
});

describe('research preview seed (scenarios without a pack)', () => {
  it.each(SCENARIOS.filter((s) => !RESEARCH_PACKS[s.id]).map((s) => s.id))('%s builds consistently', (id) => {
    const d = buildResearch(id);
    expect(d.sources).toHaveLength(412);
    expect(d.sources.filter((s) => s.status === 'relevant')).toHaveLength(63);
    expect(d.facts).toHaveLength(41);
    expect(d.routes).toHaveLength(12);
    expect(d.flows.reduce((a, f) => a + f.value, 0)).toBe(41);
  });
});

describe('research packs', () => {
  it.each(Object.keys(RESEARCH_PACKS))('%s is internally consistent', (id) => {
    const pack = RESEARCH_PACKS[id];
    const d = buildResearch(id);
    expect(SCENARIO[id]).toBeDefined();
    expect(d.counts.scanned).toBe(d.sources.length);
    expect(new Set(d.sources.map((s) => s.ref)).size).toBe(d.sources.length);
    d.clusters.forEach((c) => {
      expect(d.sources.filter((s) => s.cluster === c.id)).toHaveLength(c.count);
      expect(d.facts.filter((f) => f.cluster === c.id)).toHaveLength(c.facts);
      expect(pack.sankey[c.id].reduce((a, b) => a + b, 0)).toBe(c.facts);
    });
    expect(d.flows.reduce((a, f) => a + f.value, 0)).toBe(d.facts.length);
    d.routes.flatMap((r) => r.citations).forEach((c) => expect(d.sources.some((s) => s.ref === c)).toBe(true));
    d.routes.flatMap((r) => r.composition).forEach((x) => expect(x.name).not.toBe(x.materialId));
  });

  it('white S1: 32 relevant sources, 25 facts, P1 first, P3 borderline on S1', () => {
    const d = buildResearch('tile-white-s1');
    expect(d.counts).toMatchObject({ scanned: 135, relevant: 32, facts: 25 });
    expect(d.routes.filter((r) => r.feasible).map((r) => [r.id, r.costPerKg])).toEqual([['P1', 20.6], ['P2', 24.5], ['P3', 18.4]]);
    expect(d.routes.filter(allMustPass).map((r) => r.id)).toEqual(['P1', 'P2']);
    // range midpoints are the costed recipes in research/c2te-s1-white-india-20261118 (each sums to 100 %)
    d.routes.filter((r) => r.feasible).forEach((r) => expect(r.composition.reduce((a, x) => a + (x.range[0] + x.range[1]) / 2, 0)).toBeCloseTo(100, 0));
    expect(d.routes.find((r) => r.id === 'P3')!.predicted.find((p) => p.propertyId === 'transverse-def')!.status).toBe('borderline');
    SCENARIO['tile-white-s1'].pathways.flatMap((p) => p.citations).forEach((c) => expect(SCENARIO['tile-white-s1'].sources.some((s) => s.id === c)).toBe(true));
  });
});

describe('routeScenario', () => {
  it('matches keywords at word starts only', () => {
    expect(routeScenario('C2TE tile adhesive for large-format vitrified tiles').id).toBe('tile');
    expect(routeScenario('epoxy grout for a kitchen').id).toBe('epoxy');
    expect(routeScenario('waterproofing for a basement').id).toBe('crystalline');
    expect(routeScenario('white tile adhesive, C2TE S1').id).toBe('tile-white-s1');
    expect(routeScenario('https://www.roff.in/wp-content/uploads/2025/06/T03-T04-VITROFIX.pdf').id).toBe('tile-white-s1');
  });
  it('uses the pinned demo whatever the input says', () => {
    expect(routeScenario('epoxy grout', 'tile-white-s1').id).toBe('tile-white-s1');
    expect(routeScenario('epoxy grout', 'auto').id).toBe('epoxy');
  });
});

describe('white S1 lab story', () => {
  const s = SCENARIO['tile-white-s1'];
  const targets = buildTargets(s, ['IS', 'EN']);
  const iter1 = buildTrials(s, s.pathways[0]);
  const r1 = buildResults(s, iter1, targets);
  it('iteration 1 misses a must-have on every trial', () => {
    expect(iter1.map((t) => t.id)).toEqual(['T1', 'T2', 'T3', 'T4']);
    iter1.forEach((t) => expect(mustHavesMet(t.id, r1, targets)).toBe(false));
  });
  it('analysis proposes T5/T6 from T3 and T5 meets every must-have', () => {
    const prop = proposeNext(s, iter1, r1, 1);
    expect(prop.trials.map((t) => t.id)).toEqual(['T5', 'T6']);
    expect(prop.summary).toContain('T3');
    const r2 = buildResults(s, prop.trials, targets);
    expect(mustHavesMet('T5', r2, targets)).toBe(true);
  });
  it('every recipe sums to 100 %', () => {
    [...iter1, ...s.trialsIter2!].forEach((t) => expect(Object.values(t.recipe).reduce((a, b) => a + b, 0)).toBeCloseTo(100, 6));
  });
  it('uses only its own sources (no generated padding)', () => {
    expect(buildSources(s)).toHaveLength(s.sources.length);
  });
});
