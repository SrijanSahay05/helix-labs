import type { ReactNode } from 'react';
import { botAvatarPalette, type BotAvatarGlasses, type BotAvatarHat } from 'bot-avatars';
import { AGENTS, RESERVED_TYPES, type AgentId, type BotType } from '@/agents/registry';
import { useAgents, type Personality } from '@/store/agents';
import { useUI } from '@/store/ui';
import { AgentBot } from '@/components/agents/AgentBot';
import { relTime } from '@/components/agents/AgentCard';
import { Drawer, Tabs, Toggle } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { openAskAgent } from '@/store/ask';

const HATS: BotAvatarHat[] = ['none', 'beret', 'beanie', 'party', 'crown'];
const GLASSES: BotAvatarGlasses[] = ['none', 'round', 'square', 'shades'];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line py-4 first:border-0 first:pt-0">
      <h3 className="label mb-2">{title}</h3>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex items-center gap-3 py-1 text-xs">
      <span className="w-28 shrink-0 text-ink2">{label}</span>
      <span className="flex min-w-0 flex-1 items-center gap-2">{children}</span>
    </label>
  );
}

/** Agent detail: what it does, what it did, and how it looks and moves (UI only). */
export function AgentDrawer({ id, onClose }: { id: AgentId | null; onClose: () => void }) {
  const custom = useAgents((s) => (id ? s.custom[id] : undefined));
  const stats = useAgents((s) => (id ? s.stats[id] : undefined));
  const setCustom = useAgents((s) => s.setCustom);
  const globalMotion = useUI((s) => s.botMotion);
  const mode = useUI((s) => s.mode);
  if (!id)
    return (
      <Drawer open={false} onClose={onClose} title="">
        {null}
      </Drawer>
    );
  const a = AGENTS[id];
  const set = (p: Parameters<typeof setCustom>[1]) => setCustom(id, p);
  const name = custom?.name || a.name;
  const type = custom?.type ?? a.type;
  const acc = a.accessories ?? {};
  const avg = stats?.fills ? (stats.confSum / stats.fills).toFixed(2) : '—';

  return (
    <Drawer open={!!id} onClose={onClose} title={`${name} · ${a.title}`} width={560}>
      <div className="mb-4 flex items-center gap-4 rounded-lg border border-line bg-surface2/50 p-4">
        <AgentBot id={id} preset="hero" size={128} placement="agent-drawer" />
        <div className="min-w-0 flex-1 text-sm">
          <p className="leading-6 text-ink2">{mode === 'scientist' ? a.role : a.plainRole}</p>
          <p className="mt-2 text-2xs text-ink3">Runs on: Helix engine</p>
          <Button size="sm" className="mt-3" onClick={() => (openAskAgent(id), onClose())}>
            Ask {name}
          </Button>
        </div>
      </div>

      <Section title="Tools">
        <div className="flex flex-wrap gap-1">
          {a.tools.map((t) => (
            <span key={t} className="mono rounded border border-line bg-surface2 px-1.5 text-2xs text-ink2">
              {t}
            </span>
          ))}
        </div>
      </Section>

      <Section title="Works on">
        <ul className="list-disc space-y-0.5 pl-5 text-xs text-ink2">
          {a.worksOn.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      </Section>

      <Section title={`Last ${Math.min(20, stats?.recent.length ?? 0)} actions · average confidence ${avg}`}>
        <ul className="mono max-h-48 space-y-0.5 overflow-auto text-[11px] text-ink2">
          {(stats?.recent ?? []).map((r, i) => (
            <li key={i} className="truncate">
              <span className="text-ink3">{relTime(r.at)}</span> · {r.text}
            </li>
          ))}
          {!stats?.recent.length && <li className="font-sans text-xs text-ink3">No actions yet — start a run to see {name} at work.</li>}
        </ul>
      </Section>

      <Section title="Settings (UI only)">
        <Row label="Name">
          <input className="input h-8" value={custom?.name ?? ''} placeholder={a.name} onChange={(e) => set({ name: e.target.value || undefined })} />
        </Row>
        <Row label="Colour">
          <input type="color" aria-label="Body colour" value={custom?.color ?? botAvatarPalette[type]} onChange={(e) => set({ color: e.target.value })} className="h-8 w-10 cursor-pointer rounded border border-line bg-surface" />
          {custom?.color && (
            <button className="text-2xs text-accent" onClick={() => set({ color: undefined })}>
              Use shape colour
            </button>
          )}
        </Row>
        <Row label={`Brightness ${(custom?.brightness ?? 1).toFixed(2)}`}>
          <input type="range" min={0.5} max={1.5} step={0.05} value={custom?.brightness ?? 1} onChange={(e) => set({ brightness: Number(e.target.value) })} className="flex-1 accent-[var(--accent)]" />
        </Row>
        <Row label={`Saturation ${(custom?.saturation ?? 1.2).toFixed(2)}`}>
          <input type="range" min={0.5} max={2.5} step={0.05} value={custom?.saturation ?? 1.2} onChange={(e) => set({ saturation: Number(e.target.value) })} className="flex-1 accent-[var(--accent)]" />
        </Row>
        <Row label="Shape">
          <select className="input h-8" value={custom?.path ? '__path' : type} onChange={(e) => (e.target.value === '__path' ? set({ path: custom?.path || 'M50 8 C80 8 92 30 92 52 C92 78 74 92 50 92 C26 92 8 78 8 52 C8 30 20 8 50 8 Z' }) : set({ type: e.target.value as BotType, path: undefined }))}>
            <option value={a.type}>{a.type} (own)</option>
            {RESERVED_TYPES.map((t) => (
              <option key={t} value={t}>
                {t} (reserved)
              </option>
            ))}
            <option value="__path">Custom SVG outline…</option>
          </select>
        </Row>
        {custom?.path !== undefined && (
          <Row label="SVG path (100×100)">
            <textarea className="input mono h-16 py-1 text-[11px]" value={custom.path} onChange={(e) => set({ path: e.target.value })} />
          </Row>
        )}
        <Row label="Hat">
          <select className="input h-8" value={custom?.hat ?? acc.hat ?? 'none'} onChange={(e) => set({ hat: e.target.value as BotAvatarHat })}>
            {HATS.map((h) => (
              <option key={h}>{h}</option>
            ))}
          </select>
        </Row>
        <Row label="Glasses">
          <select className="input h-8" value={custom?.glasses ?? acc.glasses ?? 'none'} onChange={(e) => set({ glasses: e.target.value as BotAvatarGlasses })}>
            {GLASSES.map((h) => (
              <option key={h}>{h}</option>
            ))}
          </select>
        </Row>
        <Row label="Headphones">
          <Toggle checked={custom?.headphones ?? acc.headphones ?? false} onChange={(v) => set({ headphones: v })} />
        </Row>
        <Row label="Bow tie">
          <Toggle checked={custom?.bowTie ?? acc.bowTie ?? false} onChange={(v) => set({ bowTie: v })} />
        </Row>
        <p className="mt-1 text-2xs text-ink3">In Scientist mode, accessories show from console size up; in Non-scientist mode they always show.</p>
        <div className="mt-3">
          <div className="mb-1.5 text-xs text-ink2">Personality</div>
          <Tabs<Personality | 'default'>
            value={custom?.personality ?? 'default'}
            onChange={(v) => set({ personality: v === 'default' ? undefined : v })}
            items={[
              { id: 'default', label: `Follow Settings (${globalMotion})` },
              { id: 'lively', label: 'Lively' },
              { id: 'calm', label: 'Calm' },
              { id: 'still', label: 'Still' },
            ]}
          />
          <p className="mt-1.5 text-2xs text-ink3">Lively looks around and hops now and then · Calm turns a little, never hops · Still holds a pose.</p>
        </div>
        <div className="mt-4 flex justify-end">
          <Button size="sm" variant="ghost" onClick={() => setCustom(id, null)}>
            Reset {a.name} to default
          </Button>
        </div>
      </Section>
    </Drawer>
  );
}
