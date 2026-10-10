import { useState } from 'react';
import { useUI } from '@/store/ui';
import { useProjects } from '@/store/project';
import { Modal, Select } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { STAGES, advanceTo, blankProject } from '@/data/projectFactory';
import { SCENARIO } from '@/data/scenarios';
import type { StageId, StageStatus } from '@/types';
import { Toggle } from '@/components/ui/primitives';

const STATUSES: StageStatus[] = ['waiting', 'running', 'complete', 'failed', 'low-confidence'];

/** Hidden ⌘⇧D panel: force any stage into any state for design review. */
export function DevStateSwitcher() {
  const open = useUI((s) => s.devOpen);
  const set = useUI((s) => s.set);
  const projects = useProjects((s) => s.projects);
  const { setStage, update, resetAll } = useProjects();
  const [pid, setPid] = useState(projects[0]?.id ?? '');
  const p = projects.find((x) => x.id === pid);
  return (
    <Modal open={open} onClose={() => set({ devOpen: false })} title="Dev state switcher" width={620}>
      <div className="space-y-3">
        <Select value={pid} onChange={setPid} options={projects.map((x) => ({ value: x.id, label: x.name }))} />
        {p && (
          <table className="w-full">
            <thead>
              <tr>
                <th className="th">Stage</th>
                <th className="th">Force status</th>
                <th className="th">Seed data up to here</th>
              </tr>
            </thead>
            <tbody>
              {STAGES.map((st: StageId) => (
                <tr key={st}>
                  <td className="td capitalize">{st}</td>
                  <td className="td">
                    <Select
                      value={p.stages[st]}
                      onChange={(v) => setStage(p.id, st, v as StageStatus, v === 'failed' ? 'Supplier sheet could not be parsed' : v === 'low-confidence' ? 'Few sources support this result' : undefined)}
                      options={STATUSES}
                    />
                  </td>
                  <td className="td">
                    <Button size="sm" onClick={() => update(p.id, (x) => advanceTo({ ...blankProject(SCENARIO[x.scenarioId], x.id), name: x.name, code: x.code }, st))}>
                      Advance to {st}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <GraphsDev />
        <div className="flex justify-between pt-2">
          <Button variant="danger" size="sm" onClick={() => resetAll()}>
            Reset all demo data
          </Button>
          <span className="text-2xs text-ink3">⌘⇧D to toggle</span>
        </div>
      </div>
    </Modal>
  );
}

/** Graphs: dataset switcher and every §9 state (empty, too few, low confidence, missing, failed, fitting, error, read-only). */
function GraphsDev() {
  const ds = useUI((s) => s.graphsDataset);
  const ro = useUI((s) => s.graphsReadOnly);
  const set = useUI((s) => s.set);
  const debug = (opts: { failNext?: boolean; delayMs?: number }) => void import('@/features/graphs/modelClient').then((m) => m.model().debug(opts));
  return (
    <div className="space-y-2 rounded-lg border border-line p-3">
      <div className="text-xs font-semibold">Graphs panel</div>
      <Select
        value={ds}
        onChange={(v) => set({ graphsDataset: v as typeof ds })}
        options={[
          { value: 'cream22', label: 'Demo · Cosmetic cream (22 trials, reference screenshots)' },
          { value: 'tile', label: 'Demo · Tile adhesive (§12.4)' },
          { value: 'project', label: "This project's own trials" },
          { value: 'synthetic', label: 'Synthetic · 2 000 trials (performance)' },
          { value: 'empty', label: 'State · Empty (0 complete trials)' },
          { value: 'few', label: 'State · Too few (2 trials)' },
          { value: 'lowconf', label: 'State · Low confidence (7 trials)' },
          { value: 'missing', label: 'State · Missing values' },
          { value: 'failed', label: 'State · Failed trial' },
        ]}
      />
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <Toggle checked={ro} onChange={(v) => set({ graphsReadOnly: v })} label={<span className="text-xs">Read-only (Final locked)</span>} />
        <Button size="sm" onClick={() => debug({ delayMs: 2500 })}>
          Slow next fits (fitting state)
        </Button>
        <Button size="sm" onClick={() => debug({ delayMs: 0 })}>
          Normal speed
        </Button>
        <Button size="sm" variant="danger" onClick={() => debug({ failNext: true })}>
          Fail next fit (error state)
        </Button>
      </div>
    </div>
  );
}
