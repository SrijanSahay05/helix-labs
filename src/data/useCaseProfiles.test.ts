import { describe, expect, it } from 'vitest';
import { CATEGORIES } from './categories';
import { USE_CASE_LABEL } from './copy';
import { SCENARIOS } from './scenarios';
import { CATEGORY_PROFILE, PROFILES, pickProfile, profileFor } from './useCaseProfiles';

describe('use-case profiles', () => {
  it('every category maps to a profile, and nothing else does', () => {
    expect(Object.keys(CATEGORY_PROFILE).sort()).toEqual(CATEGORIES.map((c) => c.id).sort());
  });

  it.each(Object.entries(PROFILES))('%s: fields have labels, failure modes have a fail and two passes', (_, p) => {
    for (const k of p.fields) expect(USE_CASE_LABEL[k], k).toBeDefined();
    expect(new Set(p.fields).size).toBe(p.fields.length);
    expect(p.failureModes.length).toBeGreaterThanOrEqual(3);
  });

  it.each(SCENARIOS.map((s) => [s.id, s] as const))('%s: brief and guided answers only use its profile fields', (_, s) => {
    const fields = new Set<string>(profileFor(s.subcategoryId).fields);
    const used = [...Object.keys(s.useCase), ...Object.keys(s.useCaseConfidence), ...s.guided.flatMap((q) => q.options.flatMap((o) => Object.keys(o.sets)))];
    expect(used.filter((k) => !fields.has(k))).toEqual([]);
  });

  it('pickProfile drops fields from another product', () => {
    expect(pickProfile({ concreteGrade: 'M30–M50', timeToGroutH: 24 }, 'adm-pce')).toEqual({ concreteGrade: 'M30–M50' });
    expect(profileFor('fp-firestop')).toBe(PROFILES.joint);
  });
});
