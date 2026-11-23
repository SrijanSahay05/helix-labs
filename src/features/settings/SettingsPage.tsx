import type { ReactNode } from 'react';
import { useUI, type DemoSpeed } from '@/store/ui';
import { useProjects } from '@/store/project';
import { STANDARD_FAMILIES } from '@/data/standards';
import { BRAND } from '@/data/copy';
import { SCENARIOS } from '@/data/scenarios';
import { Chip, SectionTitle, Tabs, Toggle } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { switchMode } from '@/components/shell/ModeSwitch';
import type { Role, StandardFamily } from '@/types';

function Row({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-line py-5 last:border-0 md:flex-row md:items-center md:gap-6">
      <div className="md:w-80 md:shrink-0">
        <div className="text-sm font-medium">{title}</div>
        {sub && <div className="text-xs text-ink3">{sub}</div>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

const ROLES: { id: Role; label: string; note: string }[] = [
  { id: 'chemist', label: 'Chemist', note: 'Runs formulations end to end' },
  { id: 'technician', label: 'Technician', note: 'Enters lab results; analysis is read-only' },
  { id: 'reviewer', label: 'Reviewer', note: 'Approves final formulations' },
  { id: 'admin', label: 'Admin', note: 'Edits templates and settings' },
];

export function SettingsPage() {
  const ui = useUI();
  const resetAll = useProjects((s) => s.resetAll);
  const toggleStd = (s: StandardFamily) => ui.set({ standards: ui.standards.includes(s) ? ui.standards.filter((x) => x !== s) : [...ui.standards, s] });
  return (
    <div className="max-w-[960px] space-y-4">
      <SectionTitle title="Settings" sub={BRAND.org} />
      <div className="card px-5 md:px-6">
        <Row title="Role" sub="Permissions for this workspace">
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {ROLES.map((r) => (
              <button key={r.id} onClick={() => ui.set({ role: r.id })} className={`rounded-lg border p-2.5 text-left ${ui.role === r.id ? 'border-accent bg-accent-soft' : 'border-line hover:border-ink3'}`}>
                <div className="text-sm font-medium">{r.label}</div>
                <div className="text-2xs text-ink3">{r.note}</div>
              </button>
            ))}
          </div>
        </Row>
        <Row title="Mode" sub="Remembered per user; also in the top bar">
          <Tabs
            value={ui.mode}
            onChange={switchMode}
            items={[
              { id: 'scientist', label: 'Scientist' },
              { id: 'non-scientist', label: 'Non-scientist' },
            ]}
          />
        </Row>
        <Row title="Theme">
          <Tabs
            value={ui.theme}
            onChange={(t) => ui.setTheme(t)}
            items={[
              { id: 'light', label: 'Light' },
              { id: 'dark', label: 'Dark' },
            ]}
          />
        </Row>
        <Row title="Bot motion" sub="How the agent bots move everywhere. Still keeps every bot in a fixed pose; reduced-motion devices are always still.">
          <Tabs
            value={ui.botMotion}
            onChange={(v) => ui.set({ botMotion: v })}
            items={[
              { id: 'lively', label: 'Lively' },
              { id: 'calm', label: 'Calm (default)' },
              { id: 'still', label: 'Still' },
            ]}
          />
        </Row>
        <Row title="Standards" sub="Method codes are shown from enabled standards only">
          <div className="flex gap-2">
            {STANDARD_FAMILIES.map((s) => (
              <Chip key={s.id} active={ui.standards.includes(s.id)} onClick={() => toggleStd(s.id)}>
                {s.id}
              </Chip>
            ))}
          </div>
        </Row>
        <Row title="Agent speed" sub="How fast agent activity is shown">
          <Tabs
            value={String(ui.speed) as '0.5' | '1' | '2' | 'instant'}
            onChange={(v) => ui.set({ speed: (v === 'instant' ? 'instant' : Number(v)) as DemoSpeed })}
            items={[
              { id: '0.5', label: '0.5×' },
              { id: '1', label: '1×' },
              { id: '2', label: '2×' },
              { id: 'instant', label: 'Instant' },
            ]}
          />
        </Row>
        <Row title="Product family" sub="Which product family Magic Start formulates; Auto detects it from the request">
          <select className="input h-9 w-full max-w-sm" value={ui.demoScenario} onChange={(e) => ui.set({ demoScenario: e.target.value })}>
            <option value="auto">Auto — detect from request</option>
            {SCENARIOS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.chip}
              </option>
            ))}
          </select>
        </Row>
        <Row title="What a non-scientist receives" sub="Output for plain-language users">
          <Tabs
            value={ui.nonScientistOutput}
            onChange={(v) => ui.set({ nonScientistOutput: v })}
            items={[
              { id: 'spec', label: 'Product spec + R&D brief' },
              { id: 'full', label: 'Full formulation workflow' },
            ]}
          />
        </Row>
        <Row title="Use past formulations as context" sub="Adds “Internal formulation” sources to Literature">
          <Toggle checked={ui.usePastFormulations} onChange={(v) => ui.set({ usePastFormulations: v })} />
        </Row>
        <Row title="Autopilot in intake" sub="Helix fills each step and auto-advances after a 1.2 s review pause">
          <Toggle checked={ui.autopilot} onChange={(v) => ui.set({ autopilot: v })} />
        </Row>
        <Row title="Workspace data">
          <div className="flex gap-2">
            <Button variant="danger" size="sm" onClick={resetAll}>
              Reset projects
            </Button>
            <Button variant="ghost" size="sm" onClick={() => ui.set({ modeRemembered: false })}>
              Forget remembered mode
            </Button>
          </div>
        </Row>
      </div>
    </div>
  );
}
