import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp, ChevronRight, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useUI } from '@/store/ui';
import { useAsk } from '@/store/ask';
import { useProjects } from '@/store/project';
import { SUGGESTED, answer } from '@/agent/askHelix';
import type { OrbState } from '@/components/ai/HelixOrb';
import { AgentBadge } from '@/components/agents/AgentBadge';
import { AgentBot } from '@/components/agents/AgentBot';
import { AGENT_IDS, AGENTS, findAgentByName, type AgentId, type AgentStatus } from '@/agents/registry';
import { agentName, useAgents } from '@/store/agents';
import { TypeText } from '@/components/ai/TypeText';
import { DiffPreview } from '@/components/ai/DiffPreview';
import { CitationChip } from '@/components/ai/CitationChip';
import { EASE } from '@/lib/motion';
import { uid } from '@/lib/format';
import { speedFactor } from '@/store/ui';
import { chartContext } from '@/features/graphs/explain';

function useAskContext() {
  const { pathname, hash } = useLocation();
  const projects = useProjects((s) => s.projects);
  const parts = pathname.split('/').filter(Boolean);
  const project = parts[0] === 'projects' && parts[1] && parts[1] !== 'new' ? projects.find((p) => p.id === parts[1]) : undefined;
  const stage = project ? (hash.slice(1) || Object.entries(project.stages).find(([, v]) => v === 'running')?.[0] || 'literature') : parts[1] === 'new' ? 'intake' : parts[0] || 'projects';
  return { project, stage, page: pathname };
}

export function AskHelixPanel() {
  const open = useUI((s) => s.askOpen);
  const set = useUI((s) => s.set);
  const { messages, draft, thinking, push, patch, set: setAsk, context, speaker } = useAsk();
  const custom = useAgents((s) => s.custom);
  const [pick, setPick] = useState(0);
  const ctx = useAskContext();
  const [focused, setFocused] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, thinking]);
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 250);
  }, [open]);

  const orb: OrbState = thinking === 'idle' ? (focused || draft ? 'listening' : 'breathing') : thinking;
  // Helix hosts the panel: listening while you type, working while it (or a specialist) thinks and writes
  const hostStatus: AgentStatus = thinking === 'idle' ? (focused || draft ? 'waiting' : 'idle') : 'working';

  const nameOf = (id: AgentId) => custom[id]?.name || AGENTS[id].name;
  const mention = draft.match(/(?:^|\s)@(\w*)$/)?.[1];
  const mentionList = mention !== undefined ? AGENT_IDS.filter((id) => nameOf(id).toLowerCase().startsWith(mention.toLowerCase())) : [];
  const insertMention = (id: AgentId) => {
    setAsk({ draft: draft.replace(/@\w*$/, `@${nameOf(id)} `) });
    setPick(0);
    inputRef.current?.focus();
  };
  const addressed = (q: string): AgentId | undefined => {
    const m = q.match(/@(\w+)/);
    if (!m) return undefined;
    return AGENT_IDS.find((id) => nameOf(id).toLowerCase() === m[1].toLowerCase()) ?? findAgentByName(m[1]);
  };

  const ask = (q: string) => {
    if (!q.trim()) return;
    const who = addressed(q) ?? 'conductor';
    push({ id: uid('m'), role: 'user', text: q });
    setAsk({ draft: '', speaker: who });
    const a = answer(q.replace(/@\w+\s*/g, '').trim() || q, { ...ctx, agent: who });
    const f = speedFactor();
    const d = (ms: number) => (Number.isFinite(f) ? ms / f : 0);
    setAsk({ thinking: 'searching' });
    const started = Date.now();
    setTimeout(() => setAsk({ thinking: 'solving' }), d(700));
    setTimeout(() => {
      setAsk({ thinking: 'composing' });
      push({
        id: uid('m'),
        role: 'helix',
        agent: who,
        diffAgent: a.agent,
        trialRefs: a.refs,
        text: a.text,
        thought: a.thought,
        thoughtMs: Date.now() - started,
        typing: true,
        diffs: a.diffs?.map((x) => ({ id: uid('d'), label: x.label, from: x.from, to: x.to, apply: x.apply, state: 'open' as const })),
      });
    }, d(1500));
  };

  const suggestions = SUGGESTED[ctx.stage] ?? SUGGESTED.default;
  const sources = ctx.project?.sources ?? [];

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: 420, opacity: 0.6 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 420, opacity: 0.6 }}
          transition={{ duration: 0.26, ease: EASE }}
          className="fixed bottom-0 right-0 top-0 z-40 flex w-full flex-col border-l border-line bg-surface shadow-pop sm:w-[400px]"
        >
          <div className="flex h-[68px] items-center gap-2.5 border-b border-line px-4">
            <AgentBadge id="conductor" preset="console" size={48} placement="ask-header" status={hostStatus} orb={orb} />
            <span className="flex flex-col">
              <span className="font-display text-lg font-semibold leading-6">Ask Helix</span>
              <span className="text-2xs text-ink3">Type @ to ask a specialist</span>
            </span>
            <kbd className="mono rounded border border-line px-1 text-2xs text-ink3">⌘J</kbd>
            <button onClick={() => set({ askOpen: false })} className="ml-auto rounded p-1 text-ink3 hover:bg-surface2 hover:text-ink">
              <X size={16} />
            </button>
          </div>
          <div className="flex flex-wrap gap-1 border-b border-line px-3 py-2">
            {ctx.project && <span className="rounded bg-surface2 px-1.5 py-0.5 text-2xs text-ink2">{ctx.project.code}</span>}
            <span className="rounded bg-surface2 px-1.5 py-0.5 text-2xs capitalize text-ink2">{ctx.stage}</span>
            {context.map((c) => (
              <span key={c} className="rounded bg-accent-soft px-1.5 py-0.5 text-2xs text-accent">
                {c}
              </span>
            ))}
          </div>

          <div ref={listRef} className="scroll-thin flex-1 space-y-4 overflow-auto p-3">
            {messages.length === 0 && (
              <div className="agent-grid flex flex-col items-center gap-3 rounded-lg border border-dashed border-line p-6 text-center">
                <AgentBot id="conductor" preset="hero" size={96} placement="ask-empty" status={hostStatus === 'working' ? 'working' : 'idle'} />
                <TypeText inline text={ctx.project ? `I can see ${ctx.project.name}. Ask me anything, or @-mention someone on the crew.` : 'Ask me anything — I can see what you are working on. Type @ to ask a specialist.'} className="text-sm text-ink2" />
                <div className="flex flex-wrap justify-center gap-1">
                  {(['scholar', 'weaver', 'mixer', 'cost', 'analyst'] as AgentId[]).map((id) => (
                    <button key={id} onClick={() => (setAsk({ draft: `@${nameOf(id)} ` }), inputRef.current?.focus())} className="flex items-center gap-1 rounded-full border border-line py-0.5 pl-0.5 pr-2 text-2xs text-ink2 hover:border-accent hover:text-accent">
                      <AgentBot id={id} preset="micro" placement="ask-suggest" /> @{nameOf(id)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m) =>
              m.role === 'user' ? (
                <div key={m.id} className="ml-10 rounded-lg rounded-br-sm bg-accent px-3 py-2 text-sm text-on-accent">
                  {m.text}
                </div>
              ) : (
                <div key={m.id} className="flex gap-2">
                  <AgentBadge id={m.agent ?? 'conductor'} preset="compact" size={28} placement={`ask-msg-${m.id}`} status={m.typing ? 'working' : 'idle'} orb="composing" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="text-2xs font-semibold text-ink2">
                      {agentName(m.agent ?? 'conductor')} <span className="font-normal text-ink3">· {AGENTS[m.agent ?? 'conductor'].title}</span>
                    </div>
                    {m.thought && m.thought.length > 0 && (
                      <details className="text-2xs text-ink3">
                        <summary className="flex cursor-pointer list-none items-center gap-1">
                          <ChevronRight size={11} /> Thought for {((m.thoughtMs ?? 1500) / 1000).toFixed(1)} s
                        </summary>
                        <ul className="mono mt-1 space-y-0.5 border-l border-line pl-2">
                          {m.thought.map((t, i) => (
                            <li key={i}>{t}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                    <TypeText
                      text={m.text}
                      id={m.id}
                      className="text-sm leading-relaxed text-ink"
                      onDone={() => {
                        if (m.typing) {
                          patch(m.id, { typing: false });
                          setAsk({ thinking: 'idle' });
                        }
                      }}
                    />
                    {!m.typing && m.trialRefs && m.trialRefs.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {m.trialRefs.map((r) => (
                          <button key={r} onClick={() => chartContext()?.pin(r)} className="mono rounded border border-line px-1.5 py-0.5 text-2xs text-ink hover:border-accent hover:text-accent" title={`Pin ${r} in Graphs`}>
                            {r} ↗
                          </button>
                        ))}
                      </div>
                    )}
                    {!m.typing && /\[\d+\]/.test(m.text) && (
                      <div className="flex flex-wrap gap-1">
                        {[...new Set(m.text.match(/\[(\d+)\]/g) ?? [])].map((c) => {
                          const n = Number(c.slice(1, -1));
                          return <CitationChip key={c} n={n} source={sources.find((x) => x.id === `s${n}`) ?? sources[n - 1]} />;
                        })}
                      </div>
                    )}
                    {!m.typing &&
                      m.diffs?.length &&
                      (
                        <DiffPreview
                          agent={m.diffAgent ?? m.agent ?? 'conductor'}
                          title="Proposed change"
                          items={m.diffs}
                          state={m.diffs[0].state}
                          onAccept={() => {
                            m.diffs!.forEach((d) => d.apply?.());
                            patch(m.id, { diffs: m.diffs!.map((d) => ({ ...d, state: 'accepted' })) });
                          }}
                          onReject={() => patch(m.id, { diffs: m.diffs!.map((d) => ({ ...d, state: 'rejected' })) })}
                        />
                      )}
                  </div>
                </div>
              ),
            )}
            {thinking !== 'idle' && thinking !== 'composing' && (
              <div className="flex items-center gap-2 text-xs text-ink3">
                <AgentBadge id={speaker} preset="compact" size={28} placement="ask-thinking" status="working" orb={thinking} />
                <b className="font-semibold text-ink2">{agentName(speaker)}</b> {thinking === 'searching' ? 'is searching project data…' : 'is reasoning…'}
              </div>
            )}
          </div>

          <div className="border-t border-line p-3">
            <div className="mb-2 flex flex-wrap gap-1">
              {suggestions.map((s) => (
                <button key={s} onClick={() => ask(s)} className="rounded-full border border-line px-2 py-0.5 text-2xs text-ink2 hover:border-accent hover:text-accent">
                  {s}
                </button>
              ))}
            </div>
            {mentionList.length > 0 && (
              <div role="listbox" aria-label="Mention an agent" className="scroll-thin mb-2 max-h-56 overflow-auto rounded-lg border border-line bg-surface p-1 shadow-pop">
                {mentionList.map((id, i) => (
                  <button
                    key={id}
                    role="option"
                    aria-selected={i === pick % mentionList.length}
                    onMouseDown={(e) => (e.preventDefault(), insertMention(id))}
                    className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs ${i === pick % mentionList.length ? 'bg-surface2' : 'hover:bg-surface2'}`}
                  >
                    <AgentBot id={id} preset="compact" size={24} placement="ask-mention" />
                    <span className="font-semibold text-ink">@{nameOf(id)}</span>
                    <span className="truncate text-ink3">{AGENTS[id].title}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2 rounded-lg border border-line bg-surface p-2 focus-within:border-accent focus-within:shadow-glow">
              <textarea
                ref={inputRef}
                rows={2}
                value={draft}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onChange={(e) => setAsk({ draft: e.target.value })}
                onKeyDown={(e) => {
                  if (mentionList.length && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
                    e.preventDefault();
                    setPick((x) => x + (e.key === 'ArrowDown' ? 1 : mentionList.length - 1));
                    return;
                  }
                  if (mentionList.length && (e.key === 'Enter' || e.key === 'Tab')) {
                    e.preventDefault();
                    insertMention(mentionList[pick % mentionList.length]);
                    return;
                  }
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    ask(draft);
                  }
                }}
                placeholder="Ask about this project, or @-mention an agent…"
                className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-ink3"
              />
              <button onClick={() => ask(draft)} className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-on-accent disabled:opacity-40" disabled={!draft.trim()}>
                <ArrowUp size={14} />
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
