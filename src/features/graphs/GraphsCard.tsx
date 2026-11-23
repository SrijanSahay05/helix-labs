import { ChevronDown, Maximize2, Minimize2 } from 'lucide-react';
import { Component, lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { HelixOrb } from '@/components/ai/HelixOrb';
import { AgentBot } from '@/components/agents/AgentBot';
import type { AgentId } from '@/agents/registry';
import { cn } from '@/lib/cn';
import { useGraphs, useGraphsCards, useGraphsRuntime, useView, withExtras } from './store';
import { datasetHash, primaryResult } from './selectors';
import type { Dataset, ViewId } from './types';

/** A chart failure must never take down the stage around it. */
class GraphsBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null };
  static getDerivedStateFromError(e: unknown) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="flex items-center gap-3 p-6 text-sm">
        <AgentBot id="analyst" preset="compact" placement="graphs-crash" status="failed" />
        <div className="flex-1">
          <div className="font-semibold text-fail">Couldn't load the graphs</div>
          <div className="text-xs text-ink3">{this.state.error}</div>
        </div>
        <button className="rounded border border-line px-2 py-1 text-xs" onClick={() => this.setState({ error: null })}>
          Retry
        </button>
      </div>
    );
  }
}

// Plotly (~2 MB) and the views load only when the card is opened
const TrialViz = lazy(() => import('./TrialViz').then((m) => ({ default: m.TrialViz })));

export interface GraphsCardProps {
  dataset: Dataset;
  storeKey: string;
  placement: string;
  defaultView?: ViewId;
  owner?: AgentId;
  defaultCollapsed?: boolean;
  readOnly?: boolean;
  onAddTrial?: (params: Record<string, number>, label: string) => void;
  onPinTrial?: (id: string) => void;
  onOpenInTrials?: (id: string) => void;
}

/** "Graphs · Trained on N trials" — collapsible, owned by Delta, the Trial Visualization workspace inside. */
export function GraphsCard({ dataset: base, storeKey, placement, defaultView = '2d', owner = 'analyst', defaultCollapsed = false, readOnly, onAddTrial, onPinTrial, onOpenInTrials }: GraphsCardProps) {
  const cardKey = `${storeKey}#${placement}`;
  const collapsed = useGraphsCards((s) => s.collapsed[cardKey] ?? defaultCollapsed);
  const toggle = useGraphsCards((s) => s.toggle);
  const v = useView(storeKey);
  // same view of the data as the model (incl. draft trials added from suggestions)
  const dataset = useMemo(() => withExtras(base, v.extraTrials), [base, v.extraTrials]);
  const patch = useGraphs((s) => s.patch);
  const [fullscreen, setFullscreen] = useState(false);
  const rt = useGraphsRuntime();
  const hash = datasetHash(dataset);
  const sameData = rt.hash === hash;
  const complete = dataset.trials.filter((t) => t.status === 'complete').length;
  const withPrimary = dataset.trials.filter((t) => t.status === 'complete' && t.results[primaryResult(dataset).id] !== null).length;
  const fit = sameData ? rt.fits[primaryResult(dataset).id] : undefined;
  const trainedOn = sameData ? rt.trainedOn : 0;
  const stale = sameData && trainedOn > 0 && trainedOn < withPrimary && !rt.fitting;

  useEffect(() => {
    if (!v.view || (v.view === '2d' && defaultView !== '2d' && !v.x)) patch(storeKey, { view: defaultView });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!fullscreen) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && setFullscreen(false);
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [fullscreen]);

  const subtitle = (() => {
    if (complete === 0) return <span>No complete trials yet</span>;
    if (rt.fitting && sameData)
      return (
        <span className="flex items-center gap-1">
          <HelixOrb state="solving" size={20} /> Training on {withPrimary} trials…
        </span>
      );
    if (rt.fitError && sameData) return <span className="font-medium text-fail">Couldn't fit the model</span>;
    if (stale)
      return (
        <span>
          Trained on {trainedOn} of {withPrimary} trials ·{' '}
          <button onClick={() => useGraphsRuntime.getState().set({ retry: rt.retry + 1 })} className="font-medium text-accent hover:underline">
            Retrain
          </button>
        </span>
      );
    if (!trainedOn) return <span>{collapsed ? `${complete} trials · open to train the model` : `Training on ${withPrimary} trials…`}</span>;
    return (
      <span className="flex flex-wrap items-center gap-1.5">
        <button className="hover:text-accent hover:underline" title="Can I trust the model? Open the parity view" onClick={() => patch(storeKey, { view: 'parity' })}>
          Trained on {trainedOn} trials
        </button>
        {fit?.cvR2 !== null && fit?.cvR2 !== undefined && <span className="mono text-ink3">· R² {fit.cvR2.toFixed(2)}</span>}
      </span>
    );
  })();

  const card = (
    <section className={cn('card overflow-hidden', fullscreen && 'fixed inset-3 z-[70] flex flex-col shadow-pop')} aria-label="Graphs">
      <div className="flex min-h-[60px] items-center gap-3 px-5 py-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-surface2">
          <AgentBot id={owner} preset="micro" placement={`graphs-${placement}`} status={rt.fitting && sameData ? 'working' : 'idle'} size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-ink">Graphs</div>
          <div className="text-xs text-ink2">{subtitle}</div>
        </div>
        {!collapsed && (
          <button onClick={() => setFullscreen(!fullscreen)} className="rounded p-1 text-ink3 hover:bg-surface2 hover:text-ink" title={fullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen (F)'} aria-label="Toggle fullscreen">
            {fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        )}
        <button onClick={() => (setFullscreen(false), toggle(cardKey, defaultCollapsed))} aria-expanded={!collapsed} aria-label={collapsed ? 'Expand Graphs' : 'Collapse Graphs'} className="rounded p-1 text-ink3 hover:bg-surface2 hover:text-ink">
          <ChevronDown size={16} className={cn('transition-transform duration-200', !collapsed && 'rotate-180')} />
        </button>
      </div>
      {!collapsed && (
        <div className={cn('border-t border-line', fullscreen && 'min-h-0 flex-1')}>
          <GraphsBoundary>
          <Suspense
            fallback={
              <div className="flex h-[420px] items-center justify-center gap-2 text-sm text-ink2">
                <HelixOrb state="working" size={20} /> Loading graphs…
              </div>
            }
          >
            <TrialViz dataset={base} storeKey={storeKey} readOnly={readOnly} onAddTrial={onAddTrial} onPinTrial={onPinTrial} onOpenInTrials={onOpenInTrials} fullscreen={fullscreen} setFullscreen={setFullscreen} />
          </Suspense>
          </GraphsBoundary>
        </div>
      )}
    </section>
  );
  return fullscreen ? (
    <>
      <div className="h-16" />
      {createPortal(
        <>
          <div className="fixed inset-0 z-[69] bg-black/30" onClick={() => setFullscreen(false)} />
          {card}
        </>,
        document.body,
      )}
    </>
  ) : (
    card
  );
}
