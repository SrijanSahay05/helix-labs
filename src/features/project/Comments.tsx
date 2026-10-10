import { useState } from 'react';
import { useProjects, useProject } from '@/store/project';
import { useUI } from '@/store/ui';
import { uid } from '@/lib/format';
import { renderInline } from '@/components/ai/TypeText';
import { AgentBot } from '@/components/agents/AgentBot';
import { AgentTag, HumanAvatar } from '@/components/agents/AgentTag';
import { AGENTS, type AgentId } from '@/agents/registry';

/** Older entries were signed "helix" only: route them to the agent whose work they describe. */
function agentForActivity(text: string): AgentId {
  if (/literature|source/i.test(text)) return 'scholar';
  if (/pathway|variant/i.test(text)) return 'weaver';
  if (/iteration .* accepted|trials? /i.test(text)) return 'mixer';
  if (/lab result/i.test(text)) return 'lab';
  if (/targets met|proposed/i.test(text)) return 'analyst';
  if (/brief|report|dossier/i.test(text)) return 'scribe';
  return 'conductor';
}

const PEOPLE = ['Atul K.', 'Priya S.', 'Saijal R.', 'Lab Tech 1'];

/** Comment thread on any stage, row or cell — supports @mentions. */
export function CommentsThread({ projectId, target }: { projectId: string; target: string }) {
  const p = useProject(projectId);
  const user = useUI((s) => s.userName);
  const update = useProjects((s) => s.update);
  const [text, setText] = useState('');
  const list = p?.comments.filter((c) => c.target === target) ?? [];
  const mention = text.match(/@(\w*)$/)?.[1];
  const add = () => {
    if (!text.trim()) return;
    update(projectId, (x) => ({ ...x, comments: [...x.comments, { id: uid('c'), target, author: user, text, at: new Date().toISOString() }] }));
    setText('');
  };
  return (
    <div className="space-y-2">
      {list.map((c) => (
        <div key={c.id} className="flex gap-2 text-sm">
          {c.agent ? <AgentBot id={c.agent} preset="compact" size={24} placement={`comment-${c.id}`} /> : <HumanAvatar name={c.author} size={24} />}
          <div>
            <span className="text-xs font-semibold">{c.agent ? AGENTS[c.agent].name : c.author}</span>
            {c.agent && <span className="text-2xs text-ink3"> · {AGENTS[c.agent].title}</span>} <span className="text-2xs text-ink3">{new Date(c.at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            <div className="text-ink2">{renderInline(c.text.replace(/@(\w+\.?)/g, '**@$1**'))}</div>
          </div>
        </div>
      ))}
      <div className="relative flex gap-2">
        <input className="input" placeholder="Comment… use @ to mention" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        {mention !== undefined && (
          <div className="absolute top-full z-20 mt-1 w-48 rounded-md border border-line bg-surface p-1 shadow-pop">
            {PEOPLE.filter((x) => x.toLowerCase().startsWith(mention.toLowerCase())).map((x) => (
              <button key={x} onClick={() => setText(text.replace(/@\w*$/, `@${x.split(' ')[0]} `))} className="block w-full rounded px-2 py-1 text-left text-xs hover:bg-surface2">
                {x}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ActivityLog({ projectId }: { projectId: string }) {
  const p = useProject(projectId);
  if (!p) return null;
  return (
    <div className="space-y-2.5">
      {p.activity.slice(0, 40).map((a) => (
        <div key={a.id} className="flex gap-2 text-xs">
          <div className="min-w-0">
            <div>
              {a.who === 'helix' || a.agent ? (
                <AgentTag id={a.agent ?? agentForActivity(a.text)} placement={`activity-${projectId}`} title={false} className="mr-1" />
              ) : (
                <span className="mr-1 inline-flex items-center gap-1 align-middle">
                  <HumanAvatar name={a.who} size={18} /> <b className="font-semibold">{a.who}</b>
                </span>
              )}
              <span className="text-ink2">{a.text}</span>
            </div>
            <div className="mono text-[10px] text-ink3">{new Date(a.at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
