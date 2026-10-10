import { Download, FileText, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Project } from '@/types';
import { findCategory, findSubcategory } from '@/data/categories';
import { PROP } from '@/data/properties';
import { Tag } from '@/components/ui/Pill';
import { Button } from '@/components/ui/Button';
import { useStageRunAny } from '@/agent/useAgentRun';
import { useProjects } from '@/store/project';
import { openAsk } from '@/store/ask';
import { useMode } from '@/lib/useModeText';
import { cn } from '@/lib/cn';
import { AgentBadge } from '@/components/agents/AgentBadge';
import { AgentBot } from '@/components/agents/AgentBot';
import { CrewStack } from '@/components/agents/CrewStrip';
import { projectCrew } from '@/agents/projectCrew';
import { agentName } from '@/store/agents';

const APPROVAL_TONE = { draft: 'neutral', submitted: 'borderline', approved: 'pass' } as const;
const APPROVAL_LABEL = { draft: 'Draft', submitted: 'Submitted for approval', approved: 'Approved' };

/** The brief as a sticky header: full on load, compact once the page scrolls. */
export function BriefHeader({ p, onViewBrief, onExport }: { p: Project; onViewBrief: () => void; onExport: () => void }) {
  const [compact, setCompact] = useState(false);
  const update = useProjects((s) => s.update);
  const mode = useMode();
  const run = useStageRunAny(p.id);
  useEffect(() => {
    const el = document.getElementById('main-scroll');
    const h = () => setCompact((el?.scrollTop ?? 0) > 120);
    el?.addEventListener('scroll', h);
    return () => el?.removeEventListener('scroll', h);
  }, []);
  const cat = findCategory(p.categoryId);
  const sub = findSubcategory(p.subcategoryId)?.sub;
  const working = run && (run.status === 'running' || run.status === 'paused');
  return (
    <header className={cn('card relative z-10 md:sticky md:top-[68px] transition-[padding] duration-200', compact ? 'px-4 py-2.5 md:px-5' : 'p-4 md:p-6')}>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-5">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <span className="hidden sm:inline-flex">
            {working ? (
              <AgentBadge id={run!.agent} preset={compact ? 'compact' : 'console'} size={compact ? 32 : 56} placement={`brief-header-${p.id}`} status={run!.status === 'paused' ? 'paused' : 'working'} orb={run!.orb} />
            ) : (
              <AgentBot id="conductor" preset={compact ? 'compact' : 'console'} size={compact ? 32 : 56} placement={`brief-header-${p.id}`} status="idle" frozen={p.approval === 'approved'} />
            )}
          </span>
          <div className="min-w-0 flex-1">
            {!compact && (
              <div className="eyebrow flex flex-wrap items-center gap-x-2">
                <span className="mono normal-case tracking-normal text-ink2">{p.code}</span>
                <span>·</span>
                <span className="normal-case tracking-normal">
                  {cat?.name} › {sub?.name}
                </span>
              </div>
            )}
            {!compact && <h1 className="mt-0.5 font-display text-[26px] font-semibold leading-8 tracking-[-0.01em] md:hidden">{p.name}</h1>}
            <input
              aria-label="Project name"
              className={cn(!compact && 'hidden md:block', 'w-full truncate bg-transparent font-display font-semibold tracking-[-0.01em] outline-none focus:rounded focus:bg-surface2', compact ? 'text-lg' : 'mt-0.5 text-[26px] leading-8 md:text-xl')}
              value={p.name}
              onChange={(e) => update(p.id, (x) => ({ ...x, name: e.target.value }))}
            />
            {working && (
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-accent">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
                {agentName(run!.agent)} · {run!.label}
              </div>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Tag tone="accent" className="mono">
            Iteration {p.iteration}
          </Tag>
          <Tag tone={APPROVAL_TONE[p.approval]}>{APPROVAL_LABEL[p.approval]}</Tag>
          <Button size="sm" variant="ghost" onClick={onViewBrief}>
            <FileText size={14} /> Full brief
          </Button>
          <Button size="sm" variant="ghost" onClick={() => openAsk('', [p.code])}>
            <Sparkles size={14} className="text-accent" /> Ask Helix
          </Button>
          <Button size="sm" onClick={onExport}>
            <Download size={14} /> Export
          </Button>
        </div>
      </div>
      {!compact && (
        <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-line pt-4 text-xs sm:pl-[72px]">
          <Tag tone="accent" className="mono">
            {p.standard.split(' / ')[0]}
          </Tag>
          <Tag>{p.mode === 'scientist' ? 'Scientist brief' : 'Non-scientist brief'}</Tag>
          <span className="mx-1 text-ink3">Optimising</span>
          {p.top3.map((id, i) => (
            <Tag key={id}>
              <span className="mono font-bold text-accent">{i + 1}</span> {id === 'cost' ? (mode === 'scientist' ? 'Cost per kg' : 'Price per kg') : mode === 'scientist' ? PROP[id]?.name.replace('Tensile adhesion — ', 'Adhesion, ') : PROP[id]?.plainName}
            </Tag>
          ))}
          {p.constraints.costCeiling !== undefined && (
            <Tag className="mono">
              ceiling ≤ ₹ {p.constraints.costCeiling}/kg
            </Tag>
          )}
          {/* the crew sits with the brief metadata so the title row never truncates */}
          <span className="ml-auto hidden items-center gap-2 text-2xs text-ink3 lg:inline-flex" title="Crew on this project">
            Crew
            <CrewStack ids={projectCrew(p)} animate={working ? run!.crew.filter((a) => run!.crewStatus[a] === 'working') : []} scope={`hdr-${p.id}`} size={24} />
          </span>
        </div>
      )}
    </header>
  );
}
