import type { TargetRow } from '@/types';
import { recipeTotal } from './cost';

export type ValidationError =
  | { kind: 'recipe-not-100'; total: number }
  | { kind: 'target-below-standard'; standard: string }
  | { kind: 'cost-over-ceiling'; cost: number; ceiling: number; overPct: number };

export function checkRecipe(recipe: Record<string, number>): ValidationError | null {
  const total = recipeTotal(recipe);
  return Math.abs(total - 100) > 0.005 ? { kind: 'recipe-not-100', total } : null;
}

export function checkTargetVsStandard(row: TargetRow): ValidationError | null {
  const v = Array.isArray(row.value) ? row.value[0] : row.value;
  const vHi = Array.isArray(row.value) ? row.value[1] : row.value;
  if (row.standardMin !== undefined && (row.operator === '>=' || row.operator === 'between') && v < row.standardMin - 1e-9) {
    return { kind: 'target-below-standard', standard: row.standardLimit ?? `≥ ${row.standardMin}` };
  }
  if (row.standardMax !== undefined && (row.operator === '<=' || row.operator === 'between') && vHi > row.standardMax + 1e-9) {
    return { kind: 'target-below-standard', standard: row.standardLimit ?? `≤ ${row.standardMax}` };
  }
  return null;
}

export function checkCost(cost: number, ceiling?: number): ValidationError | null {
  if (ceiling === undefined || cost <= ceiling + 1e-9) return null;
  return { kind: 'cost-over-ceiling', cost, ceiling, overPct: Math.round(((cost - ceiling) / ceiling) * 1000) / 10 };
}

export function errorLabel(e: ValidationError): string {
  switch (e.kind) {
    case 'recipe-not-100':
      return `Recipe not 100 % · ${e.total.toFixed(2)} %`;
    case 'target-below-standard':
      return `Target below standard · ${e.standard}`;
    case 'cost-over-ceiling':
      return `Cost over ceiling · ₹ ${e.cost.toFixed(2)} (+${e.overPct} %)`;
  }
}
