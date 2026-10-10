import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, FastForward, FileUp, ListOrdered } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { HelixOrb } from '@/components/ai/HelixOrb';
import { AgentBot } from '@/components/agents/AgentBot';
import { TypeText } from '@/components/ai/TypeText';
import { AGENT_IDS, AGENTS, MAGIC_CREW, type AgentId, type AgentStatus } from '@/agents/registry';
import { botMotionAllowed } from '@/agent/engine';
import { useAgentName } from '@/store/agents';
import { isUrl } from '@/lib/format';
import { cn } from '@/lib/cn';

const FIRST_MS = 300;
const STAGGER_MS = 120;
const HOLD_MS = 900;

function CrewSeat({ id, phase, wokeAt, now }: { id: AgentId; phase: 'rest' | 'lineup'; wokeAt?: number; now: number }) {
  const name = useAgentName(id);
  const inPlan = MAGIC_CREW.includes(id);
  const awake = phase === 'lineup' && wokeAt !== undefined && now >= wokeAt;
  // wakes with a hop, then settles while the rest of the crew joins
  const status: AgentStatus = !awake ? 'queued' : now - wokeAt! < 600 ? 'working' : 'idle';
  return (
    <motion.div
      layout
      animate={{ opacity: phase === 'rest' ? 0.4 : inPlan ? (awake ? 1 : 0.55) : 0, y: awake ? -6 : 0, scale: phase === 'lineup' && !inPlan ? 0.8 : 1 }}
      transition={{ duration: 0.24 }}
      className={cn('flex w-[84px] flex-col items-center', phase === 'lineup' && !inPlan && 'pointer-events-none')}
    >
      <AgentBot id={id} preset="hero" placement="magic-crew" size={48} status={status} />
      <span className={cn('mt-1 text-[10px] font-medium leading-3', awake ? 'text-ink' : 'text-ink3')}>{name}</span>
      <span className="mt-0.5 h-8 w-[80px] text-center text-[10px] leading-[13px] text-ink2">{awake && <TypeText inline text={AGENTS[id].greeting} id={`greet:${id}:${wokeAt}`} />}</span>
    </motion.div>
  );
}

export function MagicStart({ onSubmit, onStepByStep }: { onSubmit: (input: string, kind: 'link' | 'pdf' | 'text') => void; onStepByStep: () => void }) {
  const [value, setValue] = useState('');
  const [projectName, setProjectName] = useState('');
  const [lineup, setLineup] = useState<{ input: string; kind: 'link' | 'pdf' | 'text'; at: number } | null>(null);
  const [now, setNow] = useState(Date.now());
  const fileRef = useRef<HTMLInputElement>(null);
  const finished = useRef(false);

  const go = (input: string, kind: 'link' | 'pdf' | 'text') => {
    if (finished.current) return;
    finished.current = true;
    onSubmit(input, kind);
  };

  // crew line-up: Helix wakes first, then only this run's agents wake one by one; the rest fade out
  useEffect(() => {
    if (!lineup) return;
    const total = FIRST_MS + (MAGIC_CREW.length - 1) * STAGGER_MS + HOLD_MS;
    const tick = setInterval(() => setNow(Date.now()), 50);
    const done = setTimeout(() => go(lineup.input, lineup.kind), total);
    const skip = (e: KeyboardEvent) => e.key === 'Escape' && go(lineup.input, lineup.kind);
    window.addEventListener('keydown', skip);
    return () => {
      clearInterval(tick);
      clearTimeout(done);
      window.removeEventListener('keydown', skip);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineup]);

  const start = (input: string, kind: 'link' | 'pdf' | 'text') => {
    if (lineup) return;
    if (!botMotionAllowed()) return go(input, kind);
    setNow(Date.now());
    setLineup({ input, kind, at: Date.now() });
  };

  const submit = (v = value) => {
    const t = v.trim();
    if (!t) return;
    start(t, isUrl(t) ? 'link' : 'text');
  };

  const wokeAt = (id: AgentId) => {
    if (!lineup) return undefined;
    const i = MAGIC_CREW.indexOf(id);
    if (i < 0) return undefined;
    return lineup.at + (i === 0 ? 0 : FIRST_MS + (i - 1) * STAGGER_MS);
  };
  const seats = lineup ? [...MAGIC_CREW, ...AGENT_IDS.filter((x) => !MAGIC_CREW.includes(x))] : AGENT_IDS;

  return (
    <div className="agent-grid -mx-4 -mb-14 -mt-6 flex min-h-[calc(100vh-60px)] flex-col items-center justify-start gap-6 px-4 pb-12 pt-16 sm:-mx-6 md:-mt-7 xl:-mx-8">
      {/* the orb is the mind: it listens while you type */}
      <div className="relative z-10 flex w-full max-w-md flex-col items-center justify-center">
        <motion.div layoutId="magic-orb" className="relative z-10">
          <HelixOrb state={lineup ? 'weaving' : 'listening'} size={lineup ? 96 : 168} speed={lineup ? 1.3 : 1} />
        </motion.div>
      </div>

      {/* the crew: resting until you submit, then the agents on this run wake one by one */}
      <div className="relative z-10 w-full max-w-[1000px]" aria-label={lineup ? 'The crew is joining the run' : 'The crew is resting'}>
        <motion.div layout className="flex flex-wrap items-start justify-center gap-x-1 gap-y-1">
          {seats.map((id) => (
            <CrewSeat key={id} id={id} phase={lineup ? 'lineup' : 'rest'} wokeAt={wokeAt(id)} now={now} />
          ))}
        </motion.div>
        <AnimatePresence>
          {lineup && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-2 flex justify-center">
              <button onClick={() => go(lineup.input, lineup.kind)} className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-accent hover:bg-accent-soft">
                <FastForward size={12} /> Skip intro <kbd className="mono ml-1 rounded border border-line px-1 text-[10px] text-ink3">Esc</kbd>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div animate={{ opacity: lineup ? 0.5 : 1 }} className={cn('relative z-10 mb-8 w-full max-w-[500px] rounded-2xl border border-line bg-surface p-6 shadow-pop md:p-8', lineup && 'pointer-events-none')}>
        <div className="mb-10 text-center">
          <div className="eyebrow mb-3 text-[11px] tracking-widest text-accent">Helix Intelligence</div>
          <h1 className="mb-3 font-display text-4xl font-bold tracking-tighter text-ink">Formulation Agent</h1>
          <p className="mx-auto max-w-[380px] text-[15px] leading-relaxed text-ink2">Connecting dots, analyzing TDS, and formulating the best possible solutions for your project.</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-ink">
              Project Name <span className="font-normal text-ink3">(Optional)</span>
            </label>
            <input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g. High-strength Tile Adhesive" className="input" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-ink">Reference Material</label>
            <input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && submit()}
              placeholder="Paste a link, or describe what you want to build..."
              className="input"
            />

            <div className="mt-4 flex gap-3">
              <button onClick={() => fileRef.current?.click()} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 text-xs font-medium text-ink2 transition-colors hover:border-accent hover:text-ink">
                <FileUp size={16} /> Upload TDS
              </button>
              <button onClick={onStepByStep} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 text-xs font-medium text-ink2 transition-colors hover:border-accent hover:text-ink">
                <ListOrdered size={16} /> Manual Start
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) start(f.name, 'pdf');
              }}
            />
          </div>

          <button
            onClick={() => submit()}
            disabled={!value.trim() || !!lineup}
            className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 text-[15px] font-medium text-on-accent transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            Run Process <ArrowRight size={16} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
