import { MAT } from '@/data/rawMaterials';

/** Live raw-material cost in ₹/kg for a recipe expressed as % w/w. Never hard-code costs in the UI. */
export function costPerKg(recipe: Record<string, number>, prices: Record<string, number> = priceMap()): number {
  let sum = 0;
  for (const [id, pct] of Object.entries(recipe)) sum += (pct / 100) * (prices[id] ?? 0);
  return Math.round(sum * 100) / 100;
}

export function priceMap(): Record<string, number> {
  return Object.fromEntries(Object.values(MAT).map((m) => [m.id, m.pricePerKg]));
}

export function recipeTotal(recipe: Record<string, number>): number {
  const t = Object.values(recipe).reduce((a, b) => a + b, 0);
  return Math.round(t * 100) / 100;
}

/** Midpoint of a composition range, normalised to 100 by adjusting the balance material. */
export function midpointRecipe(comp: { materialId: string; range: [number, number] }[], balanceId: string): Record<string, number> {
  const r: Record<string, number> = {};
  for (const c of comp) r[c.materialId] = Math.round(((c.range[0] + c.range[1]) / 2) * 100) / 100;
  return balanceTo100(r, balanceId);
}

export function balanceTo100(recipe: Record<string, number>, balanceId: string): Record<string, number> {
  const others = Object.entries(recipe)
    .filter(([k]) => k !== balanceId)
    .reduce((a, [, v]) => a + v, 0);
  return { ...recipe, [balanceId]: Math.round((100 - others) * 100) / 100 };
}
