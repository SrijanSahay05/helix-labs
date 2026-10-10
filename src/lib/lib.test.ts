import { describe, expect, it } from 'vitest';
import { costPerKg, recipeTotal } from './cost';
import { statusFor } from './status';
import { checkCost, checkRecipe, checkTargetVsStandard } from './validate';
import { setIn, getIn } from './path';
import { TILE_TRIALS_ITER1, TILE_TRIALS_ITER2 } from '@/data/demoProject';

describe('cost per kg', () => {
  it('matches the seeded trial costs computed live from master prices', () => {
    const costs = [...TILE_TRIALS_ITER1, ...TILE_TRIALS_ITER2].map((t) => costPerKg(t.recipe));
    expect(costs).toEqual([14.6, 15.74, 16.07, 17.3, 17.29, 17.75]);
  });
});

describe('100 % check', () => {
  it('every seeded trial sums to 100.00 %', () => {
    for (const t of [...TILE_TRIALS_ITER1, ...TILE_TRIALS_ITER2]) expect(recipeTotal(t.recipe)).toBe(100);
  });
  it('flags a recipe that is not 100 %', () => {
    expect(checkRecipe({ a: 50, b: 49.85 })).toEqual({ kind: 'recipe-not-100', total: 99.85 });
    expect(checkRecipe({ a: 50, b: 50 })).toBeNull();
  });
});

describe('status bands', () => {
  it('>= target with 10 % borderline band', () => {
    expect(statusFor(1.06, '>=', 1)).toBe('pass');
    expect(statusFor(0.94, '>=', 1)).toBe('borderline');
    expect(statusFor(0.88, '>=', 1)).toBe('fail');
    expect(statusFor(2.4, '>=', 2.5)).toBe('borderline');
    expect(statusFor(2.1, '>=', 2.5)).toBe('fail');
  });
  it('<= target', () => {
    expect(statusFor(0.45, '<=', 0.5)).toBe('pass');
    expect(statusFor(0.54, '<=', 0.5)).toBe('borderline');
    expect(statusFor(0.7, '<=', 0.5)).toBe('fail');
  });
  it('between', () => {
    expect(statusFor(4, 'between', [3.5, 5])).toBe('pass');
  });
});

describe('validation', () => {
  it('cost over ceiling', () => {
    expect(checkCost(19.6, 18)).toMatchObject({ kind: 'cost-over-ceiling', overPct: 8.9 });
    expect(checkCost(17.3, 18)).toBeNull();
  });
  it('target below standard', () => {
    const row = { propertyId: 'adh-heat', testMethod: 'EN 1348', unit: 'N/mm²', standardLimit: '≥ 1.0', standardMin: 1, operator: '>=' as const, value: 0.9, priority: 'must' as const, meta: { by: 'user' as const } };
    expect(checkTargetVsStandard(row)).toMatchObject({ kind: 'target-below-standard' });
    expect(checkTargetVsStandard({ ...row, value: 1.1 })).toBeNull();
  });
});

describe('path helpers', () => {
  it('sets nested values immutably', () => {
    const a = { useCase: { size: { w: 1 } } };
    const b = setIn(a, 'useCase.size.w', 1200);
    expect(getIn(b, 'useCase.size.w')).toBe(1200);
    expect(a.useCase.size.w).toBe(1);
  });
});
