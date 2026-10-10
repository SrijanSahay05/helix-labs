import { useMemo } from 'react';
import type { Data } from '../plotTypes';
import { PlotHost } from '../PlotHost';
import { fmt, HELIX_LAB, sample } from '../traces/colorscales';
import { middleEllipsis } from '../traces/labels';
import type { GTrial, Suggestion } from '../types';
import { baseLayout, MONO, type VizCtx } from './common';
import type { VizAct } from './act';

/** Stable ingredient colours, sampled along the Helix Lab scale so both donuts use the same colour per ingredient. */
function palette(ids: string[]): Record<string, string> {
  return Object.fromEntries(ids.map((id, i) => [id, sample(HELIX_LAB, ids.length > 1 ? 0.08 + (i / (ids.length - 1)) * 0.84 : 0.5)]));
}

/**
 * Pie (donut) chart of recipe composition, % w/w: the chosen trial (default Best) beside a comparison
 * (default the Q Suggestion). Ingredients below the threshold are grouped into "Other".
 */
export function PieChart({ ctx, act, leftId, rightId, other }: { ctx: VizCtx; act: VizAct; leftId: string; rightId: string; other: number }) {
  const figure = useMemo(() => {
    const th = ctx.theme;
    const ingredients = ctx.params.filter((p) => p.kind === 'ingredient');
    const pick = (id: string): { label: string; params: Record<string, number>; q?: Suggestion; t?: GTrial } | null => {
      const q = [ctx.suggestion, ...ctx.batch].find((s) => s?.id === id);
      if (q) return { label: q.id === 'Q1' ? 'Q Suggestion' : q.id, params: q.params, q };
      const t = ctx.ds.trials.find((x) => x.id === id);
      return t ? { label: `${t.label}${t.id === ctx.bestId ? ' · Best' : ''}`, params: t.params, t } : null;
    };
    const sides = [pick(leftId), pick(rightId)].filter(Boolean) as NonNullable<ReturnType<typeof pick>>[];
    // ingredients that clear the threshold in either recipe keep their own slice
    const major = ingredients.filter((p) => sides.some((s) => (s.params[p.id] ?? 0) >= other)).sort((a, b) => (sides[0]?.params[b.id] ?? 0) - (sides[0]?.params[a.id] ?? 0));
    const colors: Record<string, string> = { ...palette(major.map((p) => p.id)), __other: th.dark ? '#4a4f5c' : '#C9CCD3' };
    const data: Data[] = sides.map((s, i) => {
      const labels = major.map((p) => middleEllipsis(p.name.split(' (')[0], 24));
      const values = major.map((p) => s.params[p.id] ?? 0);
      const rest = ingredients.filter((p) => !major.includes(p)).reduce((a, p) => a + (s.params[p.id] ?? 0), 0);
      const ids = major.map((p) => p.id);
      if (rest > 0) {
        labels.push(`Other (${ingredients.length - major.length})`);
        values.push(rest);
        ids.push('__other');
      }
      return {
        type: 'pie',
        hole: 0.58,
        sort: false,
        direction: 'clockwise',
        labels,
        values,
        customdata: ids,
        domain: sides.length === 2 ? { x: i === 0 ? [0, 0.46] : [0.54, 1], y: [0.06, 0.94] } : { x: [0.2, 0.8], y: [0.06, 0.94] },
        marker: { colors: ids.map((id) => colors[id]), line: { color: th.surface, width: 1.5 } },
        textinfo: 'percent',
        texttemplate: '%{value:.1f}%',
        textposition: 'inside',
        insidetextorientation: 'horizontal',
        textfont: { family: MONO, size: 10, color: '#fff' },
        hovertemplate: `<b>%{label}</b><br>%{value:.2f} % w/w<extra>${s.label}</extra>`,
        hoverlabel: { bgcolor: '#0E1116', font: { color: '#fff', size: 12 } },
        title: { text: s.label, font: { size: 12, color: s.q ? th.suggest : th.text }, position: 'top center' },
        showlegend: i === 0,
      };
    });
    const annotations = sides.map((s, i) => {
      const total = ingredients.reduce((a, p) => a + (s.params[p.id] ?? 0), 0);
      return { x: sides.length === 2 ? (i === 0 ? 0.23 : 0.77) : 0.5, y: 0.5, xref: 'paper', yref: 'paper', showarrow: false, text: `<b>${fmt(total)}</b> %<br><span style="font-size:10px">${major.length + (major.length < ingredients.length ? 1 : 0)} slices</span>`, font: { family: MONO, size: 13, color: th.text2 } };
    });
    return {
      data,
      layout: baseLayout(ctx, {
        margin: { l: 24, r: 24, t: 56, b: 64 },
        showlegend: true,
        legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.02, yanchor: 'top', font: { size: 11, color: th.text2 } },
        annotations,
        hovermode: 'closest',
        uirevision: `${ctx.key}:pie:${leftId}:${rightId}`,
      }),
    };
  }, [ctx, leftId, rightId, other]);

  return (
    <PlotHost
      figure={figure}
      ariaLabel={`Recipe composition (% w/w) of ${leftId} compared with ${rightId}, ingredients under ${other} % grouped as Other.`}
      onClick={() => act.click(leftId.startsWith('Q') ? null : leftId)}
    />
  );
}
