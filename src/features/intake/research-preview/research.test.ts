import { describe, expect, it } from 'vitest';
import { allMustPass, buildResearch, paretoFront } from '@/data/demo/research';
import { SCENARIOS } from '@/data/scenarios';
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

describe('research preview seed (other scenarios)', () => {
  it.each(SCENARIOS.map((s) => s.id))('%s builds consistently', (id) => {
    const d = buildResearch(id);
    expect(d.sources).toHaveLength(412);
    expect(d.sources.filter((s) => s.status === 'relevant')).toHaveLength(63);
    expect(d.facts).toHaveLength(41);
    expect(d.routes).toHaveLength(12);
    expect(d.flows.reduce((a, f) => a + f.value, 0)).toBe(41);
  });
});
