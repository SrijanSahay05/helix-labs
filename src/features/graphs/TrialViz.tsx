import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeftRight, Check, ChevronRight, MoreHorizontal, Pause, Play, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Plotly from '@/charts/plotly';
import { AgentBot } from '@/components/agents/AgentBot';
import { TypeText } from '@/components/ai/TypeText';
import { Button } from '@/components/ui/Button';
import { notifyInfo } from '@/agent/notify';
import { prefersReducedMotion } from '@/lib/motion';
import { cn } from '@/lib/cn';
import { useUI } from '@/store/ui';
import { openAskAgent } from '@/store/ask';
import { AxisSelect, type AxisOption } from './AxisSelect';
import { ColorbarBrush } from './ColorbarBrush';
import { MiniToolbar } from './MiniToolbar';
import { SliceControl } from './SliceControl';
import { Tooltip, type TipData } from './Tooltip';
import { SuggestionDrawer, TraitsDrawer, TrialDrawer } from './TrialDrawer';
import { MODEL_VIEWS, PRIMARY, VIEW_LABEL, ViewSwitcher } from './ViewSwitcher';
import { ensureDataset, model } from './modelClient';
import { bestTrialId, counts as countsOf, primaryResult, splitParameters } from './selectors';
import { useGraphs, useGraphsRuntime, useView, withExtras, type ViewState } from './store';
import { fmt } from './traces/colorscales';
import { middleEllipsis } from './traces/labels';
import type { Dataset, GTrial, Suggestion, ViewId } from './types';
import { rankForAxes, useGraphModel } from './useGraphModel';
import { setChartContext } from './explain';
import { readTheme, type Geom, type VizCtx } from './views/common';
import type { AxisKey, VizAct } from './views/act';
import { Parallel } from './views/Parallel';
import { Scatter2D } from './views/Scatter2D';
import { CAMERA_PRESETS, Scatter3D } from './views/Scatter3D';
import { Surface } from './views/Surface';
import { Contour } from './views/Contour';
import { Splom } from './views/Splom';
import { Pareto } from './views/Pareto';
import { Ternary } from './views/Ternary';
import { Parity } from './views/Parity';
import { DESIRABILITY, Progress } from './views/Progress';
import { PcaMap } from './views/PcaMap';
import { BarChart } from './views/BarChart';
import { PieChart } from './views/PieChart';
import { addChartSnapshot } from './reportSnapshots';

const IS_3D: ViewId[] = ['3d', 'surface'];
const SELECTABLE: ViewId[] = ['2d', 'bar', 'bubble', 'contour', 'splom', 'pareto', 'ternary', 'parity', 'progress', 'pca'];

export interface TrialVizProps {
  dataset: Dataset;
  storeKey: string;
  readOnly?: boolean;
  onAddTrial?: (params: Record<string, number>, label: string) => void;
  onPinTrial?: (id: string) => void;
  onOpenInTrials?: (id: string) => void;
  /** results table hover/selection sync is available (project datasets) */
  fullscreen: boolean;
  setFullscreen: (v: boolean) => void;
}

/** The Trial Visualization workspace: one data model, one selection, every view. */
export function TrialViz({ dataset, storeKey, readOnly, onAddTrial, onPinTrial, onOpenInTrials, fullscreen, setFullscreen }: TrialVizProps) {
  const v = useView(storeKey);
  const patch = useGraphs((s) => s.patch);
  const resetView = useGraphs((s) => s.reset);
  const set = useCallback((p: Partial<ViewState> | ((v: ViewState) => Partial<ViewState>)) => patch(storeKey, p), [patch, storeKey]);
  const rt = useGraphsRuntime();
  const theme = useUI((s) => s.theme);
  const botMotion = useUI((s) => s.botMotion);
  const reduced = prefersReducedMotion() || botMotion === 'still';

  /* ---------- data ---------- */
  const ds: Dataset = useMemo(() => withExtras(dataset, v.extraTrials), [dataset, v.extraTrials]);
  const { varying, constant } = useMemo(() => splitParameters(ds), [ds]);
  const counts = useMemo(() => countsOf(ds), [ds]);
  const bestId = useMemo(() => bestTrialId(ds, v.bestBy), [ds, v.bestBy]);
  const primary = primaryResult(ds);
  const isResult = useCallback((id: string) => ds.results.some((r) => r.id === id), [ds.results]);
  const def = useCallback((id: string) => ds.results.find((r) => r.id === id) ?? ds.parameters.find((p) => p.id === id), [ds]);
  const name = useCallback((id: string) => def(id)?.name ?? id, [def]);
  const unit = useCallback((id: string) => def(id)?.unit ?? '', [def]);
  const value = useCallback((t: GTrial, id: string): number | null => {
    const r = id in t.results ? t.results[id] : t.params[id];
    return r === null || r === undefined || !Number.isFinite(r) ? null : r;
  }, []);

  useGraphModel(ds, counts.complete >= 2);
  const fit = rt.fits[primary.id];

  /* ---------- smart axis defaults (Delta) ---------- */
  const ranked = useMemo(() => rankForAxes(ds, rt.importance), [ds, rt.importance]);
  useEffect(() => {
    if (!ranked.length) return;
    const p = v.picked;
    const ok = (id?: string) => !!id && (varying.some((x) => x.id === id) || isResult(id));
    const next: Partial<ViewState> = {};
    if (!ok(v.x) || p.x) next.x = ranked[0];
    if (!ok(v.y) || p.y) next.y = primary.id;
    if (!ok(v.z) || p.z) next.z = ranked[1] ?? ranked[0];
    if (!ok(v.colorBy) || p.colorBy) next.colorBy = primary.id;
    if (!v.result || !isResult(v.result) || p.result) next.result = primary.id;
    const changed = Object.entries(next).some(([k, val]) => (v as unknown as Record<string, unknown>)[k] !== val);
    if (changed) set({ ...next, picked: { x: !ok(v.x) || p.x, y: !ok(v.y) || p.y, z: !ok(v.z) || p.z, colorBy: !ok(v.colorBy) || p.colorBy, result: !v.result || p.result } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ranked.join(','), primary.id]);

  /* ---------- effective axes per view ---------- */
  const isParam = (id?: string) => !!id && varying.some((p) => p.id === id);
  const modelView = v.view === 'surface' || v.view === 'contour';
  const ax = useMemo(() => {
    const x = modelView ? (isParam(v.x) ? v.x! : ranked[0]) : v.x;
    const yParam = isParam(v.y) && v.y !== x ? v.y! : isParam(v.z) && v.z !== x ? v.z! : ranked.find((r) => r !== x);
    const y = modelView ? yParam : v.y;
    return { x, y, z: v.z, colorBy: v.colorBy, result: v.result && isResult(v.result) ? v.result : primary.id };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v.view, v.x, v.y, v.z, v.colorBy, v.result, ranked, modelView, primary.id]);
  const vEff: ViewState = useMemo(() => ({ ...v, x: ax.x, y: ax.y, z: ax.z, colorBy: ax.colorBy, result: ax.result }), [v, ax]);

  const sliceParams = useMemo(() => {
    const onAxes = new Set([ax.x, ax.y]);
    const order = rankForAxes(ds, rt.importance);
    return order.map((id) => varying.find((p) => p.id === id)!).filter((p) => p && !onAxes.has(p.id));
  }, [ax.x, ax.y, ds, rt.importance, varying]);

  /* ---------- visible trials ---------- */
  const visible = useMemo(() => {
    const hidden = new Set(v.hidden);
    return ds.trials.filter((t) => {
      if (hidden.has(t.id)) return false;
      if (!v.filters.status.includes(t.status)) return false;
      if (v.iterMax !== undefined && v.scrubber && t.iteration > v.iterMax) return false;
      for (const [id, [a, b]] of Object.entries(v.filters.ranges)) {
        const val = value(t, id);
        if (val !== null && (val < a || val > b)) return false;
      }
      return true;
    });
  }, [ds, v.hidden, v.filters, v.iterMax, v.scrubber, value]);

  /* ---------- context ---------- */
  const [geom, setGeom] = useState<Geom | null>(null);
  const [gridN, setGridN] = useState(50);
  const [intro, setIntro] = useState<number | undefined>(undefined);
  const selection = useMemo(() => new Set(v.selection), [v.selection]);
  const pinned = useMemo(() => new Set(v.pinned), [v.pinned]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const themeObj = useMemo(() => readTheme(), [theme]);
  const ctx: VizCtx = useMemo(
    () => ({
      key: storeKey,
      ds,
      visible,
      v: vEff,
      bestId,
      suggestion: rt.suggestion,
      batch: rt.batch,
      selection,
      pinned,
      hovered: rt.hovered,
      theme: themeObj,
      reduced,
      readOnly: !!readOnly,
      fit,
      geom,
      gridN,
      params: varying,
      constant,
      isResult,
      def,
      name,
      unit,
      value,
      qValue: (q: Suggestion, id: string) => (isResult(id) ? { v: q.predicted[id]?.mean ?? null, sd: q.predicted[id]?.sd ?? null } : { v: q.params[id] ?? null, sd: null }),
    }),
    [storeKey, ds, visible, vEff, bestId, rt.suggestion, rt.batch, selection, pinned, rt.hovered, themeObj, reduced, readOnly, fit, geom, gridN, varying, constant, isResult, def, name, unit, value],
  );

  /* ---------- interactions ---------- */
  const [tip, setTip] = useState<TipData | null>(null);
  const [openAxis, setOpenAxis] = useState<AxisKey | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; id: string } | null>(null);
  const [probe, setProbe] = useState<{ x: number; y: number; mean?: number; sd?: number | null; px?: { left: number; top: number } } | null>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const lastHover = useRef<string | null>(null);

  const tipFor = useCallback(
    (id: string, box: TipData['box'], extra?: string[]): TipData | null => {
      const q = [rt.suggestion, ...rt.batch].find((s) => s?.id === id) ?? null;
      const t = ds.trials.find((x) => x.id === id);
      const axesIds = [...new Set([vEff.x, vEff.y, ['3d'].includes(v.view) ? vEff.z : undefined, modelView ? vEff.result : vEff.colorBy].filter(Boolean) as string[])];
      if (q) return { box, suggestion: q, ei: q.acquisition.value, lines: ds.results.map((r) => ({ name: r.name, value: q.predicted[r.id] ? `${fmt(q.predicted[r.id].mean)}${q.predicted[r.id].sd !== null ? ` ± ${fmt(q.predicted[r.id].sd)}` : ''}` : '—' })), extra };
      if (!t) return null;
      return { box, trial: t, best: t.id === bestId, lines: v.view === 'parallel' ? [] : axesIds.map((a) => ({ name: name(a), value: fmt(value(t, a)) })), extra };
    },
    [rt.suggestion, rt.batch, ds, vEff, v.view, modelView, bestId, name, value],
  );

  const select = useCallback((ids: string[] | null) => set({ selection: ids ?? [] }), [set]);
  const pin = useCallback(
    (id: string) => {
      set((s) => ({ pinned: s.pinned.includes(id) ? s.pinned : [...s.pinned, id].slice(-4) }));
      useGraphsRuntime.getState().set({ drawer: { kind: 'trial', id } });
      onPinTrial?.(id);
    },
    [set, onPinTrial],
  );

  const act: VizAct = useMemo(
    () => ({
      set,
      hover: (h) => {
        if (!h) {
          lastHover.current = null;
          useGraphsRuntime.getState().set({ hovered: undefined });
          return setTip(null);
        }
        lastHover.current = h.id;
        useGraphsRuntime.getState().set({ hovered: h.id });
        setTip(tipFor(h.id, h.box, h.extra));
      },
      click: (id, e) => {
        if (!id) return;
        if (id.startsWith('Q')) return useGraphsRuntime.getState().set({ drawer: { kind: 'suggestion', id } });
        if (e && (e.shiftKey || e.metaKey || e.ctrlKey)) return set((s) => ({ selection: s.selection.includes(id) ? s.selection.filter((x) => x !== id) : [...s.selection, id] }));
        pin(id);
      },
      select,
      openAxis: (k) => setOpenAxis(k),
      probe: (x, y) => {
        if (v.view !== 'contour' || !ax.x || !ax.y) return;
        setProbe({ x, y });
        const base = ds.trials.find((t) => t.id === bestId)?.params ?? {};
        void ensureDataset(ds)
          .then(() => model().predictPoints(ax.result, [{ ...base, ...v.slice, [ax.x!]: x, [ax.y!]: y }]))
          .then(([p]) => setProbe((cur) => (cur && cur.x === x && cur.y === y ? { ...cur, mean: p.mean, sd: p.sd } : cur)));
      },
      gd: () => {},
    }),
    [set, tipFor, pin, select, v.view, v.slice, ax, ds, bestId],
  );

  /* ---------- intro (once per session, 2D only) ---------- */
  useEffect(() => {
    if (rt.introSeen || reduced || v.view !== '2d' || !rt.suggestion || visible.length > 60) return;
    useGraphsRuntime.getState().set({ introSeen: true });
    let n = 0;
    setIntro(0);
    const t = setInterval(() => {
      n += 1;
      setIntro(n);
      if (n > visible.length + 2) {
        clearInterval(t);
        setIntro(undefined);
      }
    }, 20);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rt.suggestion, v.view]);

  /* ---------- auto-rotate (3D) ---------- */
  const interacting = useRef(0);
  useEffect(() => {
    if (!v.autoRotate || !IS_3D.includes(v.view) || reduced) return;
    let raf = 0;
    let last = performance.now();
    let angle = Math.atan2(CAMERA_PRESETS.iso.eye.y, CAMERA_PRESETS.iso.eye.x);
    const tick = (now: number) => {
      const gd = plotRef.current?.querySelector('.js-plotly-plot') as (HTMLElement & { layout?: { scene?: { camera?: { eye: { x: number; y: number; z: number } } } } }) | null;
      if (gd && now > interacting.current) {
        const eye = gd.layout?.scene?.camera?.eye ?? CAMERA_PRESETS.iso.eye;
        const r = Math.hypot(eye.x, eye.y);
        angle = Math.atan2(eye.y, eye.x) + ((now - last) / 8000) * Math.PI * 2;
        void Plotly.relayout(gd, { 'scene.camera.eye': { x: r * Math.cos(angle), y: r * Math.sin(angle), z: eye.z } } as never);
      }
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [v.autoRotate, v.view, reduced]);

  /* ---------- availability ---------- */
  const disabled = useCallback(
    (view: ViewId) => {
      if (MODEL_VIEWS.includes(view) && counts.complete < 6) return 'Needs ≥ 6 complete trials';
      if (view === 'pareto' && ds.results.length < 2) return 'Needs two results';
      if (view === 'ternary' && varying.filter((p) => p.kind === 'ingredient').length < 3) return 'Needs three varying ingredients';
      if (view === 'pie' && !ds.parameters.some((p) => p.kind === 'ingredient')) return 'Needs ingredient amounts';
      return undefined;
    },
    [counts.complete, ds.results.length, varying],
  );
  const setView = useCallback(
    (view: ViewId) => {
      if (disabled(view)) return;
      setTip(null);
      setProbe(null);
      set({ view, dragmode: SELECTABLE.includes(view) && v.dragmode === 'pan' ? 'pan' : v.dragmode });
    },
    [disabled, set, v.dragmode],
  );

  /* ---------- export ---------- */
  const gd = () => plotRef.current?.querySelector('.js-plotly-plot') as (HTMLElement & { data: unknown[]; layout: Record<string, unknown> }) | null;
  const footerText = `${counts.trials} trials · ${counts.parameters} parameters · ${counts.results} results`;
  const imageOf = async (format: 'png' | 'svg', scale = 2) => {
    const el = gd();
    if (!el) return null;
    const lay = el.layout as Record<string, unknown> & { margin?: Record<string, number>; annotations?: unknown[] };
    const fig = {
      data: el.data,
      layout: {
        ...lay,
        paper_bgcolor: themeObj.dark ? '#181a20' : '#ffffff',
        title: { text: `${VIEW_LABEL[v.view]} · ${ds.title}`, font: { size: 14, color: themeObj.text } },
        margin: { ...(lay.margin ?? {}), t: 44, b: Math.max(70, lay.margin?.b ?? 0) },
        annotations: [...(lay.annotations ?? []), { xref: 'paper', yref: 'paper', x: 0, y: -0.16, xanchor: 'left', showarrow: false, text: `${footerText} · ● Best ${ds.trials.find((t) => t.id === bestId)?.label ?? '—'} · ◇ Q Suggestion`, font: { size: 11, color: themeObj.text2 } }],
      },
    };
    return Plotly.toImage(fig as never, { format, scale, width: el.clientWidth, height: el.clientHeight + 40 });
  };
  const download = (url: string, name: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
  };
  const exportAs = async (kind: 'png' | 'svg' | 'csv' | 'copy' | 'report') => {
    setMenu(false);
    const base = `${ds.id}-${v.view}`;
    if (kind === 'csv') {
      const cols = [...new Set([vEff.x, vEff.y, vEff.z, vEff.colorBy, vEff.result].filter(Boolean) as string[])];
      const rows = [['trial', 'status', 'iteration', ...cols.map(name), 'selected'], ...visible.map((t) => [t.label, t.status, t.iteration, ...cols.map((c) => value(t, c) ?? ''), selection.has(t.id) ? 1 : 0])];
      const csv = rows.map((r) => r.map((c) => (typeof c === 'string' && c.includes(',') ? `"${c}"` : c)).join(',')).join('\n');
      return download(URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), `${base}.csv`);
    }
    const url = await imageOf(kind === 'svg' ? 'svg' : 'png', kind === 'report' ? 1 : 2);
    if (!url) return;
    if (kind === 'png' || kind === 'svg') return download(url, `${base}.${kind}`);
    if (kind === 'copy') {
      try {
        const blob = await (await fetch(url)).blob();
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        notifyInfo('Chart copied to the clipboard');
      } catch {
        notifyInfo('Copy failed — your browser blocked clipboard images');
      }
      return;
    }
    addChartSnapshot({ id: `${Date.now()}`, at: new Date().toISOString(), dataset: ds.title, view: VIEW_LABEL[v.view], axes: [vEff.x, vEff.y, vEff.z, modelView ? vEff.result : vEff.colorBy].filter(Boolean).map((a) => name(a!)).join(' · '), selection: v.selection.length, image: url });
    notifyInfo('Chart added to the Results comparison report', 'scribe');
  };

  /* ---------- explain + insights ---------- */
  // signed effect of the most influential parameter (finite difference around Best)
  const [effect, setEffect] = useState<{ id: string; d: number } | null>(null);
  const topParam = rt.importance.find((i) => varying.some((p) => p.id === i.paramId))?.paramId;
  useEffect(() => {
    if (!topParam || !fit) return;
    let alive = true;
    void ensureDataset(ds)
      .then(() => model().effect(primary.id, topParam))
      .then((d) => alive && setEffect({ id: topParam, d }))
      .catch(() => {});
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topParam, fit]);
  const insights = useMemo(() => {
    const out: { id: string; text: string; go: () => void }[] = [];
    const top = rt.importance.find((i) => isParam(i.paramId));
    if (top) {
      const p = varying.find((x) => x.id === top.paramId)!;
      const arrow = effect && effect.id === top.paramId ? (effect.d >= 0 ? ' ↑ → ' + primary.name + ' ↑' : ' ↑ → ' + primary.name + ' ↓') : ` → ${primary.name}`;
      out.push({ id: `effect:${top.paramId}`, text: `Strong effect: ${middleEllipsis(p.name.split(' (')[0], 22)}${arrow} (importance ${top.score.toFixed(2)})`, go: () => set({ view: '2d', x: top.paramId, y: primary.id, picked: {} }) });
    }
    const fitInfo = fit;
    if (fitInfo && fitInfo.cvR2 !== null && fitInfo.cvR2 < 0.5) out.push({ id: 'lowconf', text: `Model low confidence (R² ${fitInfo.cvR2.toFixed(2)}) — check the parity view`, go: () => set({ view: 'parity' }) });
    return out.filter((x) => !rt.dismissedInsights.includes(x.id)).slice(0, 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rt.importance, rt.dismissedInsights, fit, varying, primary, effect]);

  // outlier insight comes from LOO
  const [outlier, setOutlier] = useState<{ id: string; resid: number } | null>(null);
  useEffect(() => {
    if (!fit || fit.kind !== 'gp') return;
    let alive = true;
    void ensureDataset(ds)
      .then(() => model().looPredictions(primary.id))
      .then((rows) => {
        if (!alive) return;
        const worst = rows.map((r) => ({ id: r.id, resid: r.predicted - r.measured, z: Math.abs(r.predicted - r.measured) / (r.sd || 1) })).sort((a, b) => b.z - a.z)[0];
        setOutlier(worst && worst.z > 1.5 ? worst : null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fit]);
  const allInsights = useMemo(() => {
    const extra = outlier && !rt.dismissedInsights.includes(`outlier:${outlier.id}`) ? [{ id: `outlier:${outlier.id}`, text: `${ds.trials.find((t) => t.id === outlier.id)?.label} is an outlier vs the model (residual ${outlier.resid > 0 ? '+' : ''}${fmt(-outlier.resid)})`, go: () => set({ view: 'parity', selection: [outlier.id] }) }] : [];
    return [...insights, ...extra].slice(0, 2);
  }, [insights, outlier, rt.dismissedInsights, ds.trials, set]);

  useEffect(() => {
    setChartContext({
      view: VIEW_LABEL[v.view],
      axes: [vEff.x, vEff.y, vEff.z, vEff.colorBy].filter(Boolean).map((a) => name(a!)).join(', '),
      selection: v.selection,
      pin,
      insights: () => {
        const best = ds.trials.find((t) => t.id === bestId);
        const refs: string[] = [];
        const lines: string[] = [];
        if (best) {
          refs.push(best.label);
          lines.push(`**${best.label}** is the best trial so far: ${primary.name} ${fmt(best.results[primary.id])}${primary.target !== undefined ? ` (target ${fmt(primary.target)})` : ''}.`);
        }
        const peak = useGraphsRuntime.getState().peak;
        if (peak) lines.push(`The model puts the peak near **${fmt(peak.at[0])} ${name(peak.x).split(' (')[0]} / ${fmt(peak.at[1])} ${name(peak.y).split(' (')[0]}** (${primary.name} ≈ ${fmt(peak.value)}).`);
        if (outlier) {
          const t = ds.trials.find((x) => x.id === outlier.id);
          if (t) {
            refs.push(t.label);
            lines.push(`**${t.label}** sits ${fmt(Math.abs(outlier.resid))} ${outlier.resid > 0 ? 'below' : 'above'} what the model expects — worth a re-test.`);
          }
        }
        if (v.selection.length) lines.push(`You have ${v.selection.length} trials selected (${v.selection.slice(0, 5).join(', ')}).`);
        const q = useGraphsRuntime.getState().suggestion;
        if (q?.predicted[primary.id]) lines.push(`My next suggestion **Q** predicts ${primary.name} ${fmt(q.predicted[primary.id].mean)}${q.predicted[primary.id].sd ? ` ± ${fmt(q.predicted[primary.id].sd)}` : ''}.`);
        return { text: lines.slice(0, 3).map((l, i) => `${i + 1}. ${l}`).join('\n'), refs: [...new Set(refs)] };
      },
    });
    return () => setChartContext(null);
  }, [v.view, vEff, v.selection, pin, ds, bestId, primary, name, outlier]);

  const explain = useCallback(() => {
    setMenu(false);
    openAskAgent('analyst', 'explain this chart', [VIEW_LABEL[v.view], ...(v.selection.length ? [`${v.selection.length} selected`] : [])]);
  }, [v.view, v.selection.length]);

  /* ---------- keyboard ---------- */
  const order = useMemo(() => [...visible].sort((a, b) => Number(a.id.replace(/\D/g, '')) - Number(b.id.replace(/\D/g, ''))), [visible]);
  const [kbIndex, setKbIndex] = useState(-1);
  const onKey = (e: React.KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === 'e') return e.preventDefault(), explain();
    if (mod && e.key.toLowerCase() === 't') return e.preventDefault(), set({ tableView: !v.tableView });
    if (mod) return;
    if (/^[1-5]$/.test(e.key)) return setView(PRIMARY[Number(e.key) - 1].id);
    switch (e.key.toLowerCase()) {
      case 'm':
        return setMoreOpen(!moreOpen);
      case 'l':
        return set({ labels: v.labels === 'none' ? 'auto' : v.labels === 'auto' ? 'all' : 'none' });
      case 'f':
        return setFullscreen(!fullscreen);
      case 'b':
        return bestId && pin(bestId);
      case 'q':
        return rt.suggestion && useGraphsRuntime.getState().set({ drawer: { kind: 'suggestion', id: rt.suggestion.id } });
      case 'escape':
        if (rt.drawer) return useGraphsRuntime.getState().set({ drawer: null });
        if (fullscreen) return setFullscreen(false);
        return select(null);
      case 'arrowright':
      case 'arrowleft': {
        e.preventDefault();
        const i = (kbIndex + (e.key === 'ArrowRight' ? 1 : order.length - 1) + (kbIndex < 0 && e.key === 'ArrowLeft' ? 1 : 0)) % order.length;
        setKbIndex(i);
        const t = order[i];
        useGraphsRuntime.getState().set({ hovered: t.id });
        const r = plotRef.current?.getBoundingClientRect();
        return setTip(tipFor(t.id, { x0: (r?.width ?? 400) / 2, x1: (r?.width ?? 400) / 2, y0: 40, y1: 40 }));
      }
      case 'enter':
        return kbIndex >= 0 && pin(order[kbIndex].id);
    }
  };

  /* ---------- options for selects ---------- */
  const optionsFor = (k: AxisKey): AxisOption[] => {
    const others = { x: vEff.x, y: vEff.y, z: vEff.z } as Record<string, string | undefined>;
    const taken = (id: string) => (['x', 'y', 'z'] as const).filter((a) => a !== k && others[a] === id && !(modelView && a === 'z') && !(v.view !== '3d' && a === 'z' && !modelView)).map((a) => `Already on ${a.toUpperCase()}`)[0];
    const vals = (id: string) => ds.trials.map((t) => value(t, id) ?? NaN);
    const params: AxisOption[] = varying.map((p) => ({ id: p.id, name: p.name, unit: p.unit, group: 'Parameters', values: vals(p.id), disabled: k === 'colorBy' || k === 'sizeBy' || k === 'result' ? undefined : taken(p.id) }));
    const results: AxisOption[] = ds.results.map((r) => ({ id: r.id, name: r.name, unit: r.unit, group: 'Results', values: vals(r.id), disabled: k === 'colorBy' || k === 'sizeBy' || k === 'result' ? undefined : taken(r.id) }));
    const consts: AxisOption[] = constant.map((p) => ({ id: p.id, name: p.name, unit: p.unit, group: 'Constant', values: vals(p.id) }));
    if (k === 'result' || k === 'sizeBy') return results;
    if (modelView && (k === 'x' || k === 'y')) return [...params, ...consts];
    return [...params, ...results, ...consts];
  };
  const axisChange = (k: AxisKey) => (id: string | null) => {
    if (k === 'sizeBy') return set({ sizeBy: id });
    if (!id) return;
    set((s) => ({ [k]: id, picked: { ...s.picked, [k]: false } }) as Partial<ViewState>);
  };
  const axisSelect = (k: AxisKey, label: string, allowNone = false) => (
    <AxisSelect
      key={k}
      label={label}
      value={k === 'sizeBy' ? v.sizeBy : (vEff as unknown as Record<string, string | undefined>)[k]}
      options={optionsFor(k)}
      onChange={axisChange(k)}
      picked={k !== 'sizeBy' && v.picked[k as keyof ViewState['picked']]}
      open={openAxis === k}
      onOpenChange={(o) => setOpenAxis(o ? k : null)}
      allowNone={allowNone}
    />
  );

  /* ---------- view-specific state ---------- */
  const resultIds = ds.results.map((r) => r.id);
  const paretoPair: [string, string] = v.pareto ?? [ds.results.find((r) => r.id === 'cost')?.id ?? resultIds[resultIds.length - 1], ds.results.find((r) => r.direction === 'maximize' && r.id !== primary.id)?.id ?? primary.id];
  const ingredients = varying.filter((p) => p.kind === 'ingredient');
  const ternary: [string, string, string] = v.ternary ?? ((ranked.filter((id) => ingredients.some((p) => p.id === id)).slice(0, 3) as [string, string, string]).length === 3 ? (ranked.filter((id) => ingredients.some((p) => p.id === id)).slice(0, 3) as [string, string, string]) : (ingredients.slice(0, 3).map((p) => p.id) as [string, string, string]));
  const splomDims = v.splomDims ?? [...new Set([vEff.x, vEff.y, vEff.colorBy, ranked[0], ranked[1]].filter(Boolean) as string[])].slice(0, 5);
  const barMetric = v.barMetric && (isResult(v.barMetric) || varying.some((p) => p.id === v.barMetric)) ? v.barMetric : primary.id;
  const recipeOptions: AxisOption[] = [
    ...[rt.suggestion, ...rt.batch.filter((b) => b.id !== rt.suggestion?.id)].filter(Boolean).map((q) => ({ id: q!.id, name: q!.id === 'Q1' ? 'Q Suggestion' : q!.id, unit: 'proposed by Delta', group: 'Suggestions' as const, values: [] })),
    ...[...ds.trials].sort((a, b) => (Number(a.id.replace(/\D/g, '')) || 0) - (Number(b.id.replace(/\D/g, '')) || 0)).map((t) => ({ id: t.id, name: `${t.name}${t.id === bestId ? ' · Best' : ''}`, unit: t.status === 'complete' ? `iteration ${t.iteration}` : t.status, group: 'Trials' as const, values: [] })),
  ];
  const pieLeft = v.pieLeft && recipeOptions.some((o) => o.id === v.pieLeft) ? v.pieLeft : (bestId ?? ds.trials[0]?.id ?? '');
  const pieRight = v.pieRight && recipeOptions.some((o) => o.id === v.pieRight) ? v.pieRight : (rt.suggestion?.id ?? ds.trials.find((t) => t.id !== pieLeft)?.id ?? '');
  const progressMetric = v.view === 'progress' ? (v.result && isResult(v.result) ? v.result : primary.id) : primary.id;

  /* ---------- missing values ---------- */
  const axesNow = (v.view === '2d' || v.view === 'bubble' ? [vEff.x, vEff.y, vEff.colorBy, v.view === 'bubble' ? v.sizeBy : null] : v.view === '3d' ? [vEff.x, vEff.y, vEff.z, vEff.colorBy] : []).filter(Boolean) as string[];
  const missing = visible.filter((t) => t.status === 'complete' && axesNow.some((a) => value(t, a) === null));
  const missingNames = [...new Set(missing.flatMap((t) => axesNow.filter((a) => value(t, a) === null).map(name)))];

  const colorRange = useMemo(() => {
    const id = modelView ? undefined : vEff.colorBy;
    if (!id) return null;
    const vals = ds.trials.map((t) => value(t, id)).filter((x): x is number => x !== null);
    return vals.length ? { id, min: Math.min(...vals), max: Math.max(...vals) } : null;
  }, [modelView, vEff.colorBy, ds, value]);
  const hasColorbar = ['2d', 'bubble', 'splom', 'ternary', 'pca'].includes(v.view) && !!colorRange;

  /* ---------- drawers ---------- */
  const best = ds.trials.find((t) => t.id === bestId);
  const drawer = rt.drawer;
  const drawerTrial = drawer?.kind === 'trial' ? ds.trials.find((t) => t.id === drawer.id) : undefined;
  const drawerQ = rt.drawer?.kind === 'suggestion' ? ([rt.suggestion, ...rt.batch].find((s) => s?.id === (rt.drawer as { id: string }).id) ?? rt.suggestion) : null;
  const nextLabel = `T${Math.max(0, ...ds.trials.map((t) => Number(t.id.replace(/\D/g, '')) || 0)) + 1}`;
  const addTrial = (params: Record<string, number>) => {
    const label = nextLabel;
    const t: GTrial = { id: label, label, name: `Trial ${label.slice(1)}`, iteration: Math.max(...ds.trials.map((x) => x.iteration)) + 1, createdAt: new Date().toISOString(), createdBy: { kind: 'agent', id: 'analyst' }, params, results: Object.fromEntries(ds.results.map((r) => [r.id, null])), status: 'pending' };
    if (onAddTrial) onAddTrial(params, label);
    else set((s) => ({ extraTrials: [...s.extraTrials, t] }));
    useGraphsRuntime.getState().set({ drawer: null, suggestion: null });
    notifyInfo(`${label} added as a pending trial — Batch will schedule it for the lab`, 'mixer');
  };
  const regenerate = async () => {
    const idx = rt.regenIndex + 1;
    useGraphsRuntime.getState().set({ fitting: true, regenIndex: idx });
    try {
      await ensureDataset(ds);
      const [q] = await model().suggest({ count: 1, skip: idx });
      if (q) useGraphsRuntime.getState().set({ suggestion: { ...q, id: 'Q1' }, batch: [], drawer: { kind: 'suggestion', id: 'Q1' } });
    } finally {
      useGraphsRuntime.getState().set({ fitting: false });
    }
  };
  const batchSuggest = async () => {
    useGraphsRuntime.getState().set({ fitting: true });
    try {
      await ensureDataset(ds);
      const qs = await model().suggest({ count: 5 });
      if (qs.length) useGraphsRuntime.getState().set({ batch: qs, suggestion: qs[0], drawer: { kind: 'suggestion', id: qs[0].id } });
    } finally {
      useGraphsRuntime.getState().set({ fitting: false });
    }
  };

  /* ---------- render helpers ---------- */
  const is3d = IS_3D.includes(v.view);
  const legendToggle = (k: 'showBest' | 'showSuggestion', label: React.ReactNode) => (
    <button onClick={() => set({ [k]: !v[k] } as Partial<ViewState>)} aria-pressed={v[k]} className={cn('flex h-8 items-center gap-1.5 rounded-md px-2 text-xs hover:bg-surface2', !v[k] && 'opacity-40')} title={v[k] ? 'Hide' : 'Show'}>
      {label}
    </button>
  );

  const viewEl = (() => {
    if (!ax.x || (!ax.y && v.view !== 'parallel')) return null;
    switch (v.view) {
      case 'parallel':
        return <Parallel ctx={ctx} act={act} importance={rt.importance} />;
      case '2d':
        return <Scatter2D ctx={ctx} act={act} intro={intro} />;
      case 'bubble':
        return <Scatter2D ctx={{ ...ctx, v: { ...vEff, sizeBy: v.sizeBy ?? ds.results.find((r) => r.id !== vEff.y && r.id !== vEff.x)?.id ?? null } }} act={act} bubble />;
      case '3d':
        return vEff.z ? <Scatter3D ctx={ctx} act={act} /> : null;
      case 'surface':
        return <Surface ctx={ctx} act={act} />;
      case 'contour':
        return <Contour ctx={ctx} act={act} probe={probe} />;
      case 'splom':
        return <Splom ctx={ctx} act={act} dims={splomDims} />;
      case 'pareto':
        return <Pareto ctx={ctx} act={act} pair={paretoPair} />;
      case 'ternary':
        return <Ternary ctx={ctx} act={act} comps={ternary} underlay={v.overlays.band} />;
      case 'parity':
        return <Parity ctx={ctx} act={act} resultId={v.result && isResult(v.result) ? v.result : primary.id} />;
      case 'progress':
        return <Progress ctx={ctx} act={act} metric={v.progressBy === 'iteration' && v.result === DESIRABILITY ? DESIRABILITY : progressMetric} />;
      case 'bar':
        return <BarChart ctx={ctx} act={act} metric={barMetric} sort={v.barSort} />;
      case 'pie':
        return <PieChart ctx={ctx} act={act} leftId={pieLeft} rightId={pieRight} other={v.pieOther} />;
      case 'pca':
        return <PcaMap ctx={ctx} act={act} onTraits={(ids) => useGraphsRuntime.getState().set({ drawer: { kind: 'traits', ids } })} />;
    }
  })();

  const axisBar = (() => {
    switch (v.view) {
      case 'parallel':
        return [axisSelect('colorBy', 'Color by')];
      case '2d':
        return [axisSelect('x', 'X axis'), <SwapButton key="swap" onSwap={() => set((s) => ({ x: vEff.y, y: vEff.x, picked: { ...s.picked, x: false, y: false } }))} />, axisSelect('y', 'Y axis'), axisSelect('colorBy', 'Color by'), axisSelect('sizeBy', 'Size by', true)];
      case 'bubble':
        return [axisSelect('x', 'X axis'), <SwapButton key="swap" onSwap={() => set((s) => ({ x: vEff.y, y: vEff.x, picked: { ...s.picked, x: false, y: false } }))} />, axisSelect('y', 'Y axis'), axisSelect('sizeBy', 'Size by'), axisSelect('colorBy', 'Color by')];
      case '3d':
        return [axisSelect('x', 'X axis'), <SwapButton key="swap" onSwap={() => set((s) => ({ x: vEff.y, y: vEff.x, picked: { ...s.picked, x: false, y: false } }))} />, axisSelect('y', 'Y axis'), axisSelect('z', 'Z axis'), axisSelect('colorBy', 'Color by')];
      case 'surface':
      case 'contour':
        return [
          axisSelect('x', 'X axis'),
          <SwapButton key="swap" onSwap={() => set((s) => ({ x: ax.y, y: ax.x, picked: { ...s.picked, x: false, y: false } }))} />,
          axisSelect('y', 'Y axis'),
          axisSelect('result', 'Result'),
          <SliceControl key="slice" params={sliceParams} ds={ds} bestId={bestId} slice={v.slice} onChange={(s) => set({ slice: s })} onDrag={(d) => setGridN(d ? 30 : 60)} />,
        ];
      case 'bar':
        return [
          <AxisSelect key="metric" label="Y axis" value={barMetric} options={optionsFor('colorBy')} onChange={(id) => id && set({ barMetric: id })} />,
          <Segmented key="sort" label="Sort" value={v.barSort} onChange={(s) => set({ barSort: s })} items={[{ id: 'trial', label: 'Trial order' }, { id: 'value', label: 'Best first' }]} />,
          axisSelect('colorBy', 'Color by'),
        ];
      case 'pie':
        return [
          <AxisSelect key="left" label="Recipe" value={pieLeft} options={recipeOptions.map((o) => ({ ...o, disabled: o.id === pieRight ? 'Already compared' : undefined }))} onChange={(id) => id && set({ pieLeft: id })} />,
          <AxisSelect key="right" label="Compare" value={pieRight} options={recipeOptions.map((o) => ({ ...o, disabled: o.id === pieLeft ? 'Already shown' : undefined }))} onChange={(id) => id && set({ pieRight: id })} />,
          <Segmented key="other" label="Group under" value={String(v.pieOther)} onChange={(x) => set({ pieOther: Number(x) })} items={[{ id: '0.5', label: '0.5 %' }, { id: '1', label: '1 %' }, { id: '2', label: '2 %' }]} />,
        ];
      case 'splom':
        return [
          <div key="dims" className="flex flex-wrap items-center gap-1.5" aria-label="Pick dimensions">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink2">Dimensions</span>
            {splomDims.map((d) => (
              <span key={d} className="flex items-center gap-1 rounded-full border border-line bg-surface2 py-0.5 pl-2 pr-1 text-2xs">
                {middleEllipsis(name(d), 20)}
                <button disabled={splomDims.length <= 3} onClick={() => set({ splomDims: splomDims.filter((x) => x !== d) })} className="rounded-full p-0.5 hover:bg-surface disabled:opacity-30" aria-label={`Remove ${name(d)}`}>
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>,
          splomDims.length < 6 && (
            <AxisSelect
              key="add"
              label="Add"
              value={null}
              allowNone
              options={optionsFor('colorBy').filter((o) => o.group !== 'Constant').map((o) => ({ ...o, disabled: splomDims.includes(o.id) ? 'Already shown' : undefined }))}
              onChange={(id) => id && set({ splomDims: [...splomDims, id].slice(0, 6) })}
            />
          ),
          axisSelect('colorBy', 'Color by'),
        ];
      case 'pca':
        return [axisSelect('colorBy', 'Color by')];
      case 'ternary':
        return [
          ...(['A', 'B', 'C'] as const).map((L, i) => (
            <AxisSelect
              key={L}
              label={`Comp ${L}`}
              value={ternary[i]}
              options={ingredients.map((p) => ({ id: p.id, name: p.name, unit: p.unit, group: 'Parameters' as const, values: ds.trials.map((t) => t.params[p.id]), disabled: ternary.includes(p.id) && ternary[i] !== p.id ? 'Already used' : undefined }))}
              onChange={(id) => id && set({ ternary: ternary.map((x, k) => (k === i ? id : x)) as [string, string, string] })}
            />
          )),
          axisSelect('colorBy', 'Color by'),
        ];
      case 'pareto':
        return (['X', 'Y'] as const).map((L, i) => (
          <AxisSelect
            key={L}
            label={`${L} axis`}
            value={paretoPair[i]}
            options={ds.results.map((r) => ({ id: r.id, name: r.name, unit: r.unit, group: 'Results' as const, values: ds.trials.map((t) => value(t, r.id) ?? NaN), disabled: paretoPair[1 - i] === r.id ? `Already on ${i ? 'X' : 'Y'}` : undefined }))}
            onChange={(id) => id && set({ pareto: (i ? [paretoPair[0], id] : [id, paretoPair[1]]) as [string, string] })}
          />
        ));
      case 'parity':
        return [axisSelect('result', 'Result')];
      case 'progress':
        return [
          <AxisSelect
            key="metric"
            label="Result"
            value={v.result === DESIRABILITY ? DESIRABILITY : progressMetric}
            options={[...ds.results.map((r) => ({ id: r.id, name: r.name, unit: r.unit, group: 'Results' as const, values: ds.trials.map((t) => value(t, r.id) ?? NaN) })), { id: DESIRABILITY, name: 'Overall desirability', unit: '0–1', group: 'Results' as const, values: [] }]}
            onChange={(id) => id && set({ result: id, progressBy: v.progressBy })}
          />,
          <div key="by" className="flex h-11 items-center gap-1 rounded-lg border border-line px-1 text-xs">
            {(['trial', 'iteration'] as const).map((b) => (
              <button key={b} onClick={() => set({ progressBy: b })} className={cn('rounded px-2 py-1', v.progressBy === b ? 'bg-surface2 font-medium text-ink' : 'text-ink2')}>
                By {b}
              </button>
            ))}
          </div>,
        ];
    }
  })();

  // Progress with desirability is chosen through `result`
  const progressEl = v.view === 'progress' && v.result === DESIRABILITY ? <Progress ctx={ctx} act={act} metric={DESIRABILITY} /> : null;

  const caption = rt.peak && rt.suggestion && ranked.length >= 2 ? `Delta: ${primary.name} peaks near ${fmt(rt.peak.at[0])} ${name(rt.peak.x).split(' (')[0].toLowerCase()} / ${fmt(rt.peak.at[1])} ${name(rt.peak.y).split(' (')[0].toLowerCase()}. I suggest Q at ${ranked.slice(0, 3).map((id) => fmt(rt.suggestion!.params[id])).join(' / ')}${ranked[2] ? ` (${ranked.slice(0, 3).map((id) => name(id).split(' (')[0]).join(' / ')})` : ''}.` : null;

  const empty = counts.complete === 0;

  return (
    <div className={cn('relative flex flex-col', fullscreen && 'h-full')} onKeyDown={onKey}>
      {/* header */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase leading-4 tracking-[0.08em] text-ink2">Trial visualization</span>
          <span className="mono truncate text-[11px] leading-4 text-ink3" title="Dataset">
            {ds.title}
          </span>
        </div>
        <div className="ml-auto max-w-full">
          <ViewSwitcher view={v.view} onChange={setView} disabled={disabled} moreOpen={moreOpen} setMoreOpen={setMoreOpen} onPrefetch={(view) => (view === 'surface' || view === 'contour') && ax.x && ax.y && void ensureDataset(ds).then(() => model().predictGrid({ resultId: ax.result, x: ax.x!, y: ax.y!, slice: v.slice, n: 50 })).catch(() => {})} />
        </div>
      </div>
      <AnimatePresence>
        {caption && intro !== undefined && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 px-5 pb-3 text-xs text-ink2">
            <AgentBot id="analyst" preset="micro" placement="graphs-caption" status="working" />
            <TypeText inline text={caption} id={`caption:${caption}`} />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="h-px bg-line" />

      {empty ? (
        <EmptyState />
      ) : (
        <>
          {/* axis bar */}
          <div className="flex items-start gap-3 px-5 pt-4">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{axisBar}</div>
            <div className="flex h-10 shrink-0 items-center gap-1">
              {legendToggle('showBest', (
                <>
                  <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" /> Best
                </>
              ))}
              {legendToggle('showSuggestion', (
                <>
                  <span className="text-[var(--suggest)]">◇</span> Q Suggestion
                </>
              ))}
              <OverflowMenu
                open={menu}
                setOpen={setMenu}
                v={v}
                set={set}
                view={v.view}
                onReset={() => {
                  resetView(storeKey);
                  setProbe(null);
                }}
                onExport={exportAs}
                onExplain={explain}
                onFullscreen={() => setFullscreen(!fullscreen)}
                onSuggestion={() => rt.suggestion && useGraphsRuntime.getState().set({ drawer: { kind: 'suggestion', id: rt.suggestion.id } })}
                svgOk={!is3d && v.view !== 'parallel'}
              />
            </div>
          </div>
          {allInsights.length > 0 && (
            <div className="flex flex-wrap gap-2 px-5 pt-3">
              {allInsights.map((i) => (
                <span key={i.id} className="flex h-7 items-center gap-1.5 rounded-full border border-line bg-surface pl-1.5 pr-1 text-2xs text-ink2">
                  <AgentBot id="analyst" preset="micro" placement="insight" size={14} />
                  <button onClick={i.go} className="hover:text-accent">
                    {i.text}
                  </button>
                  <button onClick={() => useGraphsRuntime.getState().set({ dismissedInsights: [...rt.dismissedInsights, i.id] })} className="rounded-full p-0.5 hover:bg-surface2" aria-label="Dismiss insight">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* plot area */}
          <div
            ref={plotRef}
            tabIndex={0}
            aria-label="Plot — use arrow keys to step through trials"
            className={cn('relative mx-5 mt-4 overflow-hidden rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent/40', fullscreen ? 'min-h-0 flex-1' : 'h-[clamp(420px,52vh,640px)]')}
            onPointerDown={() => (interacting.current = performance.now() + 2000)}
            onContextMenu={(e) => {
              const id = lastHover.current;
              if (!id || id.startsWith('Q')) return;
              e.preventDefault();
              const r = e.currentTarget.getBoundingClientRect();
              setCtxMenu({ x: e.clientX - r.left, y: e.clientY - r.top, id });
            }}
          >
            {v.tableView ? (
              <TableView ctx={ctx} cols={[...new Set([vEff.x, vEff.y, v.view === '3d' ? vEff.z : undefined, modelView ? vEff.result : vEff.colorBy].filter(Boolean) as string[])]} onToggle={(id) => set((s) => ({ selection: s.selection.includes(id) ? s.selection.filter((x) => x !== id) : [...s.selection, id] }))} onPin={pin} />
            ) : (
              <GeomProbe onGeom={setGeom} view={v.view}>
                {progressEl ?? viewEl}
              </GeomProbe>
            )}
            {!v.tableView && <MiniToolbar is3d={is3d} mode={v.dragmode} setMode={(m) => set({ dragmode: m })} canSelect={SELECTABLE.includes(v.view)} onReset={() => {
              const el = gd();
              if (el && !is3d) void Plotly.relayout(el, { 'xaxis.autorange': true, 'yaxis.autorange': true } as never);
              if (is3d) set((s) => ({ camera3d: { ...s.camera3d, [v.view]: CAMERA_PRESETS.iso } }));
            }} onCamera={(p) => set((s) => ({ camera3d: { ...s.camera3d, [v.view]: CAMERA_PRESETS[p] } }))} autoRotate={v.autoRotate} setAutoRotate={(a) => set({ autoRotate: a })} />}
            {hasColorbar && geom && colorRange && !v.tableView && <ColorbarBrush geom={geom} min={colorRange.min} max={colorRange.max} range={v.filters.ranges[colorRange.id]} onRange={(r) => set((s) => { const ranges = { ...s.filters.ranges }; if (r) ranges[colorRange.id] = r; else delete ranges[colorRange.id]; return { filters: { ...s.filters, ranges } }; })} />}
            <Tooltip tip={tip} width={plotRef.current?.clientWidth ?? 800} />
            {probe && v.view === 'contour' && geom && (
              <div className="absolute z-20 w-56 rounded-lg border border-line bg-surface p-2.5 text-xs shadow-pop" style={{ left: 12, bottom: 12 }}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Probe</span>
                  <button onClick={() => setProbe(null)} aria-label="Close probe" className="text-ink3 hover:text-ink">
                    <X size={12} />
                  </button>
                </div>
                <div className="mono mt-1 text-ink2">
                  {middleEllipsis(name(ax.x!), 16)} {fmt(probe.x)} · {middleEllipsis(name(ax.y!), 16)} {fmt(probe.y)}
                </div>
                <div className="mt-1">
                  {name(ax.result)}: <b className="mono">{probe.mean === undefined ? '…' : `${fmt(probe.mean)}${probe.sd ? ` ± ${fmt(probe.sd)}` : ''}`}</b>
                </div>
                {!readOnly && (
                  <Button size="sm" className="mt-2 w-full" onClick={() => addTrial({ ...(best?.params ?? {}), ...v.slice, [ax.x!]: Math.round(probe.x * 100) / 100, [ax.y!]: Math.round(probe.y * 100) / 100 })}>
                    Add as trial {nextLabel}
                  </Button>
                )}
              </div>
            )}
            {ctxMenu && (
              <ContextMenu
                at={ctxMenu}
                onClose={() => setCtxMenu(null)}
                readOnly={readOnly}
                items={{
                  pin: () => pin(ctxMenu.id),
                  similar: () => {
                    const t = ds.trials.find((x) => x.id === ctxMenu.id);
                    if (!t) return;
                    const span = (id: string) => Math.max(...ds.trials.map((x) => x.params[id])) - Math.min(...ds.trials.map((x) => x.params[id])) || 1;
                    const near = [...ds.trials].filter((x) => x.id !== t.id).sort((a, b) => dist(a) - dist(b)).slice(0, 5).map((x) => x.id);
                    function dist(x: GTrial) {
                      return varying.reduce((s, p) => s + ((x.params[p.id] - t!.params[p.id]) / span(p.id)) ** 2, 0);
                    }
                    select([t.id, ...near]);
                  },
                  hide: () => set((s) => ({ hidden: [...s.hidden, ctxMenu.id] })),
                  duplicate: () => {
                    const t = ds.trials.find((x) => x.id === ctxMenu.id);
                    if (t) addTrial({ ...t.params });
                  },
                  copy: () => {
                    const t = ds.trials.find((x) => x.id === ctxMenu.id);
                    if (t) void navigator.clipboard.writeText([`${t.name}`, ...ds.parameters.map((p) => `${p.name}\t${t.params[p.id]}`), ...ds.results.map((r) => `${r.name}\t${t.results[r.id] ?? ''}`)].join('\n'));
                  },
                }}
              />
            )}
            <AnimatePresence>
              {drawerTrial && (
                <TrialDrawer
                  key="trial"
                  ds={ds}
                  trial={drawerTrial}
                  best={best}
                  readOnly={readOnly}
                  pinned={v.pinned.map((id) => ds.trials.find((t) => t.id === id)).filter(Boolean) as GTrial[]}
                  onTab={(id) => useGraphsRuntime.getState().set({ drawer: { kind: 'trial', id } })}
                  onUnpin={(id) => {
                    set((s) => ({ pinned: s.pinned.filter((x) => x !== id) }));
                    if (id === drawerTrial.id) useGraphsRuntime.getState().set({ drawer: v.pinned.filter((x) => x !== id)[0] ? { kind: 'trial', id: v.pinned.filter((x) => x !== id)[0] } : null });
                  }}
                  onClose={() => useGraphsRuntime.getState().set({ drawer: null })}
                  onDuplicate={() => addTrial({ ...drawerTrial.params })}
                  onOpenInTrials={onOpenInTrials ? () => onOpenInTrials(drawerTrial.id) : undefined}
                  onCompare={() => set((s) => ({ selection: [...new Set([...s.selection, ...s.pinned, drawerTrial.id])], view: 'parallel' }))}
                />
              )}
              {drawerQ && (
                <SuggestionDrawer key="q" ds={ds} q={drawerQ} best={best} batch={rt.batch} fitting={rt.fitting} readOnly={readOnly} nextLabel={nextLabel} onClose={() => useGraphsRuntime.getState().set({ drawer: null })} onAdd={() => addTrial(drawerQ.params)} onRegenerate={regenerate} onBatch={batchSuggest} onPick={(b) => useGraphsRuntime.getState().set({ suggestion: b, drawer: { kind: 'suggestion', id: b.id } })} />
              )}
              {rt.drawer?.kind === 'traits' && <TraitsDrawer key="traits" ds={ds} ids={rt.drawer.ids} onClose={() => useGraphsRuntime.getState().set({ drawer: null })} />}
            </AnimatePresence>
          </div>

          {v.scrubber && <Scrubber ds={ds} value={v.iterMax} onChange={(n) => set({ iterMax: n })} reduced={reduced} />}

          {/* footer */}
          <div className="mt-4 flex min-h-[48px] flex-wrap items-center gap-x-2 gap-y-1 border-t border-line px-5 py-2.5 text-xs text-ink2">
            <span>
              <b className="font-semibold text-ink">{counts.trials}</b> trials · <b className="font-semibold text-ink">{counts.parameters}</b> parameters · <b className="font-semibold text-ink">{counts.results}</b> results
            </span>
            {visible.length < ds.trials.length && (
              <span>
                · Showing <b className="font-semibold text-ink">{visible.length}</b> of {ds.trials.length}{' '}
                <button onClick={() => set((s) => ({ filters: { ...s.filters, ranges: {}, status: ['complete', 'pending', 'failed'] }, hidden: [], iterMax: undefined }))} className="text-accent hover:underline">
                  Reset filters
                </button>
              </span>
            )}
            {missing.length > 0 && (
              <span title={missing.map((t) => t.label).join(', ')}>
                · {missing.length} trial{missing.length > 1 ? 's' : ''} hidden (missing {missingNames.join(', ')}){' '}
                <button className="text-accent hover:underline" onClick={() => select(missing.map((t) => t.id))}>
                  show which
                </button>
              </span>
            )}
            {v.selection.length > 0 && (
              <span className="flex items-center gap-1.5">
                · <b className="font-semibold text-ink">{v.selection.length}</b> selected
                <Button size="sm" variant="ghost" onClick={() => set({ view: 'parallel' })}>
                  Compare
                </Button>
                <Button size="sm" variant="ghost" onClick={() => select(null)}>
                  Clear
                </Button>
              </span>
            )}
            <span className="ml-auto hidden text-2xs text-ink3 lg:inline">1–5 views · M more · ←/→ trials · B best · Q suggestion · L labels · F fullscreen · ⌘E explain · ⌘T table</span>
          </div>
        </>
      )}
    </div>
  );
}

/** Prefixed segmented control, same height and look as the axis selects. */
function Segmented<T extends string>({ label, value, items, onChange }: { label: string; value: T; items: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex h-9 items-center rounded-full border border-line bg-surface/80 p-0.5 text-xs shadow-sm" role="radiogroup" aria-label={label}>
      <span className="px-2.5 text-[10px] font-semibold uppercase tracking-wider text-ink3">{label}:</span>
      {items.map((it) => (
        <button key={it.id} role="radio" aria-checked={value === it.id} onClick={() => onChange(it.id)} className={cn('h-7 rounded-full px-2.5 text-xs font-medium transition-colors', value === it.id ? 'bg-accent-soft text-accent' : 'text-ink2 hover:bg-surface hover:text-ink')}>
          {it.label}
        </button>
      ))}
    </div>
  );
}

function SwapButton({ onSwap }: { onSwap: () => void }) {
  return (
    <button onClick={onSwap} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-surface/80 text-ink3 shadow-sm transition-colors hover:border-ink3 hover:bg-surface hover:text-ink2" title="Swap X and Y" aria-label="Swap X and Y">
      <ArrowLeftRight size={14} />
    </button>
  );
}

/** Reads the plot geometry once Plotly has drawn (for labels, colour-bar brush and axis-title buttons). */
function GeomProbe({ children, onGeom, view }: { children: React.ReactNode; onGeom: (g: Geom | null) => void; view: ViewId }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => {
      const gd = el.querySelector('.js-plotly-plot') as (HTMLElement & { _fullLayout?: { _size?: { l: number; t: number; w: number; h: number } } }) | null;
      const s = gd?._fullLayout?._size;
      if (gd && s) onGeom({ l: s.l, t: s.t, w: s.w, h: s.h, width: gd.clientWidth, height: gd.clientHeight });
    };
    const t = setInterval(read, 400);
    read();
    return () => clearInterval(t);
  }, [onGeom, view]);
  return (
    <div ref={ref} className="absolute inset-0">
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <AgentBot id="analyst" preset="hero" size={112} placement="graphs-empty" status="queued" wakeOnHover override={{ shading: 'fabric' }} />
      <TypeText inline text="No results yet. Add lab results and I'll start mapping them." id="graphs-empty" className="max-w-md font-display text-[19px] leading-7 text-ink2" />
      <a href="#results" className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-on-accent">
        Go to Results
      </a>
    </div>
  );
}

function MenuItem({ on, label, onClick, hint }: { on?: boolean; label: string; onClick: () => void; hint?: string }) {
  return (
    <button role="menuitemcheckbox" aria-checked={on} onClick={onClick} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-surface2">
      <span className="w-3">{on && <Check size={12} className="text-accent" />}</span>
      <span className="flex-1">{label}</span>
      {hint && <kbd className="mono text-[10px] text-ink3">{hint}</kbd>}
    </button>
  );
}

function MenuSub({ id, label, children, sub, setSub }: { id: string; label: string; children: React.ReactNode; sub: string | null; setSub: (s: string | null) => void }) {
  return (
    <div className="relative" onMouseEnter={() => setSub(id)}>
      <button onClick={() => setSub(sub === id ? null : id)} aria-haspopup="menu" aria-expanded={sub === id} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-surface2">
        <span className="w-3" />
        <span className="flex-1">{label}</span>
        <ChevronRight size={12} className="text-ink3" />
      </button>
      {sub === id && <div className="absolute right-full top-0 mr-1 w-48 rounded-lg border border-line bg-surface p-1 shadow-pop">{children}</div>}
    </div>
  );
}

function OverflowMenu({ open, setOpen, v, set, view, onReset, onExport, onExplain, onFullscreen, onSuggestion, svgOk }: { open: boolean; setOpen: (o: boolean) => void; v: ViewState; set: (p: Partial<ViewState> | ((v: ViewState) => Partial<ViewState>)) => void; view: ViewId; onReset: () => void; onExport: (k: 'png' | 'svg' | 'csv' | 'copy' | 'report') => void; onExplain: () => void; onFullscreen: () => void; onSuggestion: () => void; svgOk: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [sub, setSub] = useState<string | null>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open, setOpen]);
  const ov = (k: keyof ViewState['overlays']) => set((s) => ({ overlays: { ...s.overlays, [k]: !s.overlays[k] } }));
  const toggleStatus = (st: 'pending' | 'failed') => set((s) => ({ filters: { ...s.filters, status: s.filters.status.includes(st) ? s.filters.status.filter((x) => x !== st) : [...s.filters.status, st] } }));
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} aria-haspopup="menu" aria-expanded={open} className="grid h-8 w-8 place-items-center rounded-md text-ink2 hover:bg-surface2" title="More options">
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-40 mt-1 w-60 rounded-lg border border-line bg-surface p-1 shadow-pop" onMouseLeave={() => setSub(null)}>
          <MenuItem label="Explain this chart" hint="⌘E" onClick={onExplain} />
          <MenuItem label="Q Suggestion details" hint="Q" onClick={() => (onSuggestion(), setOpen(false))} />
          <div className="my-1 h-px bg-line" />
          <MenuItem on={v.labels !== 'none'} label={`Labels: ${v.labels}`} hint="L" onClick={() => set({ labels: v.labels === 'none' ? 'auto' : v.labels === 'auto' ? 'all' : 'none' })} />
          {(view === '2d' || view === 'bubble') && (
            <>
              <MenuItem on={v.logX} label="Log X" onClick={() => set({ logX: !v.logX })} />
              <MenuItem on={v.logY} label="Log Y" onClick={() => set({ logY: !v.logY })} />
              <MenuSub sub={sub} setSub={setSub} id="overlays" label="Overlays">
                <MenuItem on={v.overlays.trend} label="Trend line (OLS)" onClick={() => ov('trend')} />
                <MenuItem on={v.overlays.band} label="Model band ±2σ" onClick={() => ov('band')} />
                <MenuItem on={v.overlays.target} label="Target band" onClick={() => ov('target')} />
                <MenuItem on={v.overlays.marginals} label="Marginal histograms" onClick={() => ov('marginals')} />
              </MenuSub>
            </>
          )}
          {view === '3d' && <MenuItem on={v.dropLines} label="Drop lines to floor" onClick={() => set({ dropLines: !v.dropLines })} />}
          {view === 'surface' && (
            <MenuSub sub={sub} setSub={setSub} id="surface" label="Surface">
              <MenuItem on={v.showUncertainty === 'band'} label="Show ±2σ" onClick={() => set({ showUncertainty: v.showUncertainty === 'band' ? 'off' : 'band' })} />
              <MenuItem on={v.showUncertainty === 'color'} label="Colour by uncertainty" onClick={() => set({ showUncertainty: v.showUncertainty === 'color' ? 'off' : 'color' })} />
              <MenuItem on={v.showTrials} label="Show trials" onClick={() => set({ showTrials: !v.showTrials })} />
              <MenuItem on={v.floorContours} label="Show floor contours" onClick={() => set({ floorContours: !v.floorContours })} />
              <label className="block px-2 py-1.5 text-xs">
                Opacity {v.surfaceOpacity.toFixed(2)}
                <input type="range" min={0.4} max={1} step={0.05} value={v.surfaceOpacity} onChange={(e) => set({ surfaceOpacity: Number(e.target.value) })} className="w-full accent-[var(--accent)]" />
              </label>
            </MenuSub>
          )}
          {view === 'contour' && (
            <MenuSub sub={sub} setSub={setSub} id="contour" label="Contour overlays">
              <MenuItem on={v.overlays.isoline} label="Target iso-line" onClick={() => ov('isoline')} />
              <MenuItem on={v.overlays.feasible} label="Feasible region" onClick={() => ov('feasible')} />
              <MenuItem on={v.overlays.sigma} label="σ contours" onClick={() => ov('sigma')} />
              <MenuItem on={v.showTrials} label="Show trials" onClick={() => set({ showTrials: !v.showTrials })} />
            </MenuSub>
          )}
          {view === 'pca' && <MenuItem on={v.overlays.loadings} label="Loadings arrows" onClick={() => ov('loadings')} />}
          {view === 'ternary' && <MenuItem on={v.overlays.band} label="Model underlay" onClick={() => ov('band')} />}
          <MenuSub sub={sub} setSub={setSub} id="scale" label="Colour scale">
            {(
              [
                ['helix', 'Helix Lab'],
                ['viridis', 'Viridis'],
                ['cividis', 'Cividis (colour-blind safe)'],
                ['diverging', 'Diverging (around target)'],
              ] as const
            ).map(([k, l]) => (
              <MenuItem key={k} on={v.colorscale === k} label={l} onClick={() => set({ colorscale: k })} />
            ))}
          </MenuSub>
          <MenuSub sub={sub} setSub={setSub} id="size" label="Point size">
            {[0.75, 1, 1.4].map((s) => (
              <MenuItem key={s} on={v.pointSize === s} label={s === 0.75 ? 'Small' : s === 1 ? 'Normal' : 'Large'} onClick={() => set({ pointSize: s })} />
            ))}
          </MenuSub>
          <MenuSub sub={sub} setSub={setSub} id="best" label="Best by">
            <MenuItem on={v.bestBy === 'primary'} label="Primary result" onClick={() => set({ bestBy: 'primary' })} />
            <MenuItem on={v.bestBy === 'overall'} label="Overall desirability" onClick={() => set({ bestBy: 'overall' })} />
          </MenuSub>
          <MenuItem on={v.filters.status.includes('pending')} label="Show pending trials" onClick={() => toggleStatus('pending')} />
          <MenuItem on={v.filters.status.includes('failed')} label="Show failed trials" onClick={() => toggleStatus('failed')} />
          <MenuItem on={v.scrubber} label="Iteration scrubber" onClick={() => set({ scrubber: !v.scrubber })} />
          <MenuItem on={v.tableView} label="View as table" hint="⌘T" onClick={() => set({ tableView: !v.tableView })} />
          <div className="my-1 h-px bg-line" />
          <MenuSub sub={sub} setSub={setSub} id="export" label="Export">
            <MenuItem label="PNG (2×)" onClick={() => onExport('png')} />
            {svgOk && <MenuItem label="SVG" onClick={() => onExport('svg')} />}
            <MenuItem label="CSV of plotted points" onClick={() => onExport('csv')} />
            <MenuItem label="Copy image" onClick={() => onExport('copy')} />
            <MenuItem label="Add to report" onClick={() => onExport('report')} />
          </MenuSub>
          <MenuItem label="Reset view" onClick={() => (onReset(), setOpen(false))} />
          <MenuItem label="Fullscreen" hint="F" onClick={() => (onFullscreen(), setOpen(false))} />
        </div>
      )}
    </div>
  );
}

function ContextMenu({ at, onClose, items, readOnly }: { at: { x: number; y: number; id: string }; onClose: () => void; items: Record<'pin' | 'similar' | 'hide' | 'duplicate' | 'copy', () => void>; readOnly?: boolean }) {
  useEffect(() => {
    const h = () => onClose();
    setTimeout(() => document.addEventListener('click', h), 0);
    return () => document.removeEventListener('click', h);
  }, [onClose]);
  const entries: [keyof typeof items, string][] = [
    ['pin', 'Pin'],
    ['similar', 'Select similar (5 nearest)'],
    ['hide', 'Hide'],
    ...(readOnly ? [] : ([['duplicate', 'Duplicate as trial']] as [keyof typeof items, string][])),
    ['copy', 'Copy values'],
  ];
  return (
    <div role="menu" className="absolute z-40 w-52 rounded-lg border border-line bg-surface p-1 shadow-pop" style={{ left: at.x, top: at.y }}>
      <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink3">{at.id}</div>
      {entries.map(([k, l]) => (
        <button key={k} role="menuitem" onClick={() => (items[k](), onClose())} className="block w-full rounded px-2 py-1.5 text-left text-xs hover:bg-surface2">
          {l}
        </button>
      ))}
    </div>
  );
}

function Scrubber({ ds, value, onChange, reduced }: { ds: Dataset; value?: number; onChange: (n: number) => void; reduced: boolean }) {
  const iters = [...new Set(ds.trials.map((t) => t.iteration))].sort((a, b) => a - b);
  const max = iters[iters.length - 1] ?? 1;
  const cur = value ?? max;
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    let n = iters[0];
    onChange(n);
    const t = setInterval(() => {
      n += 1;
      if (n > max) {
        clearInterval(t);
        setPlaying(false);
        return;
      }
      onChange(n);
    }, reduced ? 200 : 900);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);
  return (
    <div className="mx-5 mt-3 flex h-10 items-center gap-3 rounded-lg border border-line px-3 text-xs">
      <button onClick={() => setPlaying(!playing)} className="grid h-6 w-6 place-items-center rounded hover:bg-surface2" aria-label={playing ? 'Pause' : 'Play the search'}>
        {playing ? <Pause size={12} /> : <Play size={12} />}
      </button>
      <span className="text-ink2">Up to iteration</span>
      <input type="range" min={iters[0] ?? 1} max={max} step={1} value={cur} onChange={(e) => onChange(Number(e.target.value))} className="flex-1 accent-[var(--accent)]" aria-label="Show trials up to iteration" />
      <span className="mono w-6 text-right font-semibold">{cur}</span>
    </div>
  );
}

function TableView({ ctx, cols, onToggle, onPin }: { ctx: VizCtx; cols: string[]; onToggle: (id: string) => void; onPin: (id: string) => void }) {
  const [sort, setSort] = useState<{ k: string; dir: 1 | -1 }>({ k: 'id', dir: 1 });
  const rows = [...ctx.visible].sort((a, b) => {
    const va = sort.k === 'id' ? Number(a.id.replace(/\D/g, '')) : (ctx.value(a, sort.k) ?? -Infinity);
    const vb = sort.k === 'id' ? Number(b.id.replace(/\D/g, '')) : (ctx.value(b, sort.k) ?? -Infinity);
    return (va - vb) * sort.dir;
  });
  const th = (k: string, label: string) => (
    <th key={k} className="th cursor-pointer select-none" aria-sort={sort.k === k ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'} onClick={() => setSort({ k, dir: sort.k === k ? (-sort.dir as 1 | -1) : 1 })}>
      {label} {sort.k === k ? (sort.dir === 1 ? '↑' : '↓') : ''}
    </th>
  );
  return (
    <div className="scroll-thin absolute inset-0 overflow-auto rounded-lg border border-line">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-surface">
          <tr>
            <th className="th w-8" />
            {th('id', 'Trial')}
            <th className="th">Status</th>
            {cols.map((c) => th(c, ctx.name(c)))}
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id} className={cn('hover:bg-surface2/50', ctx.selection.has(t.id) && 'bg-accent-soft', t.id === ctx.hovered && 'outline outline-1 outline-accent')}>
              <td className="td">
                <input type="checkbox" checked={ctx.selection.has(t.id)} onChange={() => onToggle(t.id)} aria-label={`Select ${t.label}`} className="accent-[var(--accent)]" />
              </td>
              <td className="td">
                <button onClick={() => onPin(t.id)} className="mono font-medium hover:text-accent">
                  {t.label}
                </button>
                {t.id === ctx.bestId && <span className="ml-1 text-[10px] font-semibold text-[#B45309]">Best</span>}
              </td>
              <td className="td capitalize text-ink2">{t.status}</td>
              {cols.map((c) => (
                <td key={c} className="td mono text-right">
                  {fmt(ctx.value(t, c))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

