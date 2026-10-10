import { useState } from 'react';
import { HelixOrb, type OrbState } from '@/components/ai/HelixOrb';
import { AIField } from '@/components/ai/AIField';
import { AgentConsole } from '@/components/ai/AgentConsole';
import { TypeText } from '@/components/ai/TypeText';
import { ConfidenceMeter } from '@/components/ai/ConfidenceMeter';
import { DiffPreview } from '@/components/ai/DiffPreview';
import { CitationChip } from '@/components/ai/CitationChip';
import { NovyteShowcase } from '@/components/ai/NovyteShowcase';
import { StatusPill, StagePill } from '@/components/ui/Pill';
import { StateFrame } from '@/components/ui/StateFrame';
import { Button } from '@/components/ui/Button';
import { SectionTitle } from '@/components/ui/primitives';
import { runAgent } from '@/agent/engine';
import { bus } from '@/agent/bus';
import { TILE_SOURCES } from '@/data/demoProject';

const STATES: OrbState[] = ['working', 'searching', 'solving', 'listening', 'connecting', 'weaving', 'composing', 'breathing', 'shaping'];

/** Every AI component and state in one place, for design review. */
export function Playground() {
  const [runId, setRunId] = useState<string>();
  const [val, setVal] = useState('');
  const test = () => {
    setRunId(
      runAgent({
        id: 'playground.test',
        title: 'Test script',
        agent: 'conductor',
        events: [
          { t: 'join', agent: 'conductor', greeting: 'On it. Pulling the crew together.' },
          { t: 'join', agent: 'reader', greeting: "I'll read the link." },
          { t: 'join', agent: 'site', greeting: "I'll work out the use case." },
          { t: 'join', agent: 'sentinel', greeting: "I'll check safety and compliance." },
          { t: 'plan', steps: ['Fetch', 'Extract', 'Fill', 'Check'] },
          { t: 'handoff', to: 'reader', note: 'Read this TDS and tell me what it is.' },
          { t: 'orb', state: 'searching', label: 'Reading supplier TDS…' },
          { t: 'step', index: 0, status: 'running' },
          { t: 'tool', name: 'fetch_url', args: '"https://example.com/tds.pdf"', result: '200 · 6 pages · 1.2 MB', ms: 1200 },
          { t: 'step', index: 0, status: 'done' },
          { t: 'step', index: 1, status: 'running' },
          { t: 'think', text: 'Large-format tiles >60 cm on exterior → deformable adhesive (S1) required.' },
          { t: 'step', index: 1, status: 'done' },
          { t: 'step', index: 2, status: 'running' },
          { t: 'handoff', to: 'site', note: 'Exterior facade, large tiles. Fill the site fields.' },
          { t: 'fill', path: 'pg.substrate', value: 'Concrete / block masonry', confidence: 0.92, reason: 'Stated in source', label: 'Substrate', display: 'Concrete / block masonry' },
          { t: 'step', index: 2, status: 'done' },
          { t: 'step', index: 3, status: 'warn' },
          { t: 'handoff', to: 'sentinel', note: 'Check it before we hand it over.' },
          { t: 'check', text: 'Recipe sums to 100.00 %', ok: true },
          { t: 'handoff', to: 'conductor', note: 'All clear.' },
          { t: 'done', summary: 'Test complete' },
        ],
      }, { onFill: (_p, v) => setVal(String(v)) }),
    );
  };
  return (
    <div className="space-y-6">
      <SectionTitle
        title="Playground"
        sub="Orb states, AI fields, console and states."
        right={
          <>
            <a href="/playground/bots" className="text-xs text-accent">
              Bot playground →
            </a>
            <Button variant="primary" onClick={test}>
              Run test script
            </Button>
          </>
        }
      />
      <div className="card grid gap-4 p-4 md:grid-cols-3 sm:grid-cols-5 lg:grid-cols-9">
        {STATES.map((s) => (
          <div key={s} className="flex flex-col items-center gap-2">
            <HelixOrb state={s} size={64} />
            <HelixOrb state={s} size={20} />
            <span className="mono text-2xs text-ink2">{s}</span>
          </div>
        ))}
      </div>
      <AgentConsole runId={runId} />
      <div className="card grid gap-4 p-4 md:grid-cols-3">
        <AIField path="pg.substrate" label="Substrate (filled by run)" meta={val ? { by: 'helix', confidence: 0.92, reason: 'Stated in source', source: 'example.com' } : undefined} display={val}>
          <input className="input" value={val} onChange={(e) => setVal(e.target.value)} />
        </AIField>
        <AIField path="pg.pending" label="Pending" pending>
          <input className="input" />
        </AIField>
        <AIField path="pg.low" label="Low confidence" meta={{ by: 'helix', confidence: 0.62, reason: 'Inferred' }}>
          <input className="input" defaultValue="Hot-humid" />
        </AIField>
        <AIField path="pg.edited" label="Edited by you" meta={{ by: 'user' }}>
          <input className="input" defaultValue="24 h" />
        </AIField>
        <AIField path="pg.filled" label="Filled" meta={{ by: 'helix', confidence: 0.95, reason: 'From standard' }}>
          <input className="input" defaultValue="IS 15477 Type 4 T S2" />
        </AIField>
        <div className="flex items-end">
          <Button onClick={() => bus.emit('fill', { path: 'pg.filled', runId: 'x', instant: false })}>Replay fill animation</Button>
        </div>
      </div>
      <div className="card flex flex-wrap items-center gap-3 p-4">
        <StatusPill status="pass" />
        <StatusPill status="borderline" />
        <StatusPill status="fail" />
        <StatusPill status="pending" />
        <StagePill status="waiting" />
        <StagePill status="running" orb="searching" />
        <StagePill status="complete" />
        <StagePill status="failed" />
        <StagePill status="low-confidence" />
        <ConfidenceMeter value={0.92} />
        <ConfidenceMeter value={0.78} />
        <ConfidenceMeter value={0.6} />
        <CitationChip n={1} source={TILE_SOURCES[0]} />
      </div>
      <div className="card p-4">
        <TypeText text={'**Typewriter** with citations [1] and lists:\n- first item\n- second item'} id="pg-type" />
      </div>
      <DiffPreview title="Proposed change" items={[{ label: 'MHEC in T2', from: '0.35 %', to: '0.40 %' }]} onAccept={() => {}} onReject={() => {}} onEdit={() => {}} />
      <div className="grid gap-4 lg:grid-cols-2">
        <NovyteShowcase kind="literature" caption="Placeholder" />
        <NovyteShowcase kind="pathways" caption="Placeholder" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <StateFrame state="empty" message="No projects yet. Tell Helix what you want to formulate." />
        <StateFrame state="failed" message="Supplier sheet could not be parsed" onRetry={() => {}} onAsk={() => {}} />
        <StateFrame state="low-confidence" message="Few sources" items={['Retarder dosage extrapolated']} />
      </div>
    </div>
  );
}
