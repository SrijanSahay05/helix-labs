import type { Source } from '@/types';
import { TILE_SCENARIO } from '../demoProject';
import { CRYSTALLINE, EPOXY_GROUT, GYPSUM, MICRO_CONCRETE, PCE } from './alternates';
import type { Scenario } from './types';
import { hashString, seeded } from '@/lib/motion';

export const SCENARIOS: Scenario[] = [TILE_SCENARIO, CRYSTALLINE, MICRO_CONCRETE, PCE, GYPSUM, EPOXY_GROUT];
export const SCENARIO: Record<string, Scenario> = Object.fromEntries(SCENARIOS.map((s) => [s.id, s]));

/** Route Magic Start input (text or link) to a seeded scenario by keyword; default is tile adhesive. */
export function routeScenario(input: string): Scenario {
  const t = input.toLowerCase();
  // order matters: "epoxy grout" before generic "grout", "waterproof" before "coating"
  const order = [EPOXY_GROUT, CRYSTALLINE, MICRO_CONCRETE, PCE, GYPSUM, TILE_SCENARIO];
  for (const s of order) if (s.keywords.some((k) => t.includes(k))) return s;
  if (t.includes('grout') && (t.includes('precision') || t.includes('machine') || t.includes('base plate'))) return MICRO_CONCRETE;
  return TILE_SCENARIO;
}

const TEMPLATES: Record<Source['type'], string[]> = {
  Paper: ['Influence of {c} on performance of {p}', 'A study of {c} in {p} under tropical exposure', 'Optimising {c} for {p}: a design-of-experiments approach', 'Microstructure of {p} as affected by {c}'],
  Patent: ['Composition for {p} with improved {c}', 'Dry-mix {p} comprising modified {c}'],
  TDS: ['Competitor {p} — Technical Data Sheet ({n})'],
  'Supplier sheet': ['{c} additive grade {n} — supplier sheet'],
  Uploaded: ['Uploaded source'],
  'Internal formulation': ['Internal formulation HX-{n} — {c}'],
};

/** Hand-written sources + generated generic ones (~60 total). Titles are generic and badged "Demo". */
export function buildSources(s: Scenario, withInternal = false): Source[] {
  const rnd = seeded(hashString(s.id));
  const out: Source[] = [...s.sources];
  const types: Source['type'][] = ['Paper', 'Paper', 'Paper', 'Patent', 'TDS', 'Supplier sheet'];
  if (withInternal) types.push('Internal formulation', 'Internal formulation');
  let i = 0;
  while (out.length < 60) {
    const type = types[Math.floor(rnd() * types.length)];
    const c = s.clusters[i % s.clusters.length];
    const tpl = TEMPLATES[type][Math.floor(rnd() * TEMPLATES[type].length)];
    const title = tpl.replace('{c}', c.toLowerCase()).replace('{p}', s.label.toLowerCase()).replace('{n}', String(100 + i));
    out.push({
      id: `${s.id}-g${i}`,
      type,
      title: title.charAt(0).toUpperCase() + title.slice(1),
      year: 2012 + Math.floor(rnd() * 14),
      relevance: Math.round((0.35 + rnd() * 0.5) * 100) / 100,
      finding: `Reports a measurable effect of ${c.toLowerCase()} on key ${s.label.toLowerCase()} properties.`,
      cluster: c,
    });
    i++;
  }
  return out.sort((a, b) => b.relevance - a.relevance);
}

export type { Scenario } from './types';
