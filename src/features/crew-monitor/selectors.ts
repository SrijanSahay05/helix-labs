import { useEffect, useMemo, useRef, useState } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import type { OrbState } from '@/components/ai/HelixOrb';
import type { AgentId } from '@/agents/registry';
import type { RunState } from '@/agent/types';
import { useTasks } from '@/store/tasks';
import { useProjects } from '@/store/project';
import { useUI } from '@/store/ui';
import { PROP } from '@/data/properties';

export interface Job {
  id: string;
  title: string;
  projectId?: string;
  projectName: string;
  stage?: string;
  ownerAgent: AgentId;
  orb: OrbState;
  progress: number | null;
  step?: { index: number; total: number };
  steps: { text: string; status: 'pending' | 'running' | 'done' | 'warn' }[];
  etaSec?: number;
  status: 'running' | 'complete' | 'failed' | 'paused';
  updatedAt: number;
  finishedAt?: number;
  outputLabel?: string;
  href: string;
}

export interface AttentionItem {
  id: string;
  agent: AgentId;
  text: string;
  project: string;
  href: string;
}

export interface PendingTest {
  id: string;
  projectId: string;
  project: string;
  property: string;
  trials: string[];
  dueDate: string;
  daysLeft: number;
  href: string;
}

/** UI state: rows collapsed (persisted); finished jobs the user has opened (session). */
export const useCrewMonitor = create<{ collapsed: boolean; opened: string[]; set: (p: Partial<{ collapsed: boolean; opened: string[] }>) => void; open: (id: string) => void }>()(
  persist(
    (set) => ({
      collapsed: false,
      opened: [],
      set: (p) => set(p),
      open: (id) => set((s) => ({ opened: s.opened.includes(id) ? s.opened : [...s.opened, id] })),
    }),
    { name: 'helix:v1:crew-monitor', partialize: (s) => ({ collapsed: s.collapsed }) },
  ),
);

/** Stage anchor for a run's stage id ('pathways-variant' → 'pathways', 'final-export' → 'final'). */
export function hrefFor(r: Pick<RunState, 'projectId' | 'stage'>): string {
  if (!r.projectId) return '/projects/new';
  if (r.stage === 'report') return '/reports';
  const base = (r.stage ?? '').split('-')[0];
  return `/projects/${r.projectId}${base ? `#${base}` : ''}`;
}

const lastAt = (r: RunState) => r.startedAt + (r.lines[r.lines.length - 1]?.at ?? 0);

function toJob(r: RunState, projectName: string): Job {
  const runningIdx = r.plan.findIndex((p) => p.status === 'running');
  const done = r.plan.filter((p) => p.status === 'done' || p.status === 'warn').length;
  return {
    id: r.id,
    title: r.title,
    projectId: r.projectId,
    projectName,
    stage: r.stage,
    ownerAgent: r.status === 'done' || r.status === 'failed' ? r.lead : r.agent,
    orb: r.orb,
    progress: Number.isFinite(r.progress) ? r.progress : null,
    step: r.plan.length ? { index: runningIdx >= 0 ? runningIdx + 1 : done, total: r.plan.length } : undefined,
    steps: r.plan,
    etaSec: r.etaMs > 0 ? Math.round(r.etaMs / 1000) : undefined,
    status: r.status === 'done' ? 'complete' : r.status === 'cancelled' ? 'failed' : r.status,
    updatedAt: lastAt(r),
    finishedAt: r.endedAt,
    outputLabel: r.summary,
    href: hrefFor(r),
  };
}

function useProjectNames() {
  return useProjects(useShallow((s) => Object.fromEntries(s.projects.map((p) => [p.id, p.name]))));
}

/** Running (and paused) jobs, most recently updated first. */
export function useRunningJobs(): Job[] {
  const runs = useTasks((s) => s.runs);
  const names = useProjectNames();
  return useMemo(
    () =>
      Object.values(runs)
        .filter((r) => r.status === 'running' || r.status === 'paused')
        .map((r) => toJob(r, r.projectId ? (names[r.projectId] ?? 'Project') : 'New formulation'))
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [runs, names],
  );
}

const TEN_MIN = 10 * 60 * 1000;

/** Finished or failed in the last 10 minutes and not yet opened. Ticks every 30 s so old rows expire. */
export function useRecentlyFinished(): Job[] {
  const runs = useTasks((s) => s.runs);
  const names = useProjectNames();
  const opened = useCrewMonitor((s) => s.opened);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);
  return useMemo(
    () =>
      Object.values(runs)
        .filter((r) => (r.status === 'done' || r.status === 'failed') && r.endedAt && r.endedAt > now - TEN_MIN && !opened.includes(r.id) && !r.id.startsWith('step') && !r.scriptId.startsWith('intake.step'))
        .map((r) => toJob(r, r.projectId ? (names[r.projectId] ?? 'Project') : 'New formulation'))
        .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0)),
    [runs, names, opened, now],
  );
}

/** Low-confidence / failed stages, approvals waiting on me, and agent `ask` events. */
export function useNeedsYou(): AttentionItem[] {
  const projects = useProjects((s) => s.projects);
  const role = useUI((s) => s.role);
  const runs = useTasks((s) => s.runs);
  return useMemo(() => {
    const out: AttentionItem[] = [];
    for (const p of projects) {
      for (const [st, status] of Object.entries(p.stages)) {
        if (status === 'low-confidence') out.push({ id: `${p.id}:${st}:low`, agent: st === 'pathways' ? 'weaver' : 'analyst', text: `Check low-confidence ${st}`, project: p.name, href: `/projects/${p.id}#${st}` });
        if (status === 'failed') out.push({ id: `${p.id}:${st}:failed`, agent: st === 'literature' ? 'scholar' : 'conductor', text: `Fix failed ${st}`, project: p.name, href: `/projects/${p.id}#${st}` });
      }
      if (p.approval === 'submitted' && (role === 'reviewer' || role === 'admin')) out.push({ id: `${p.id}:approve`, agent: 'scribe', text: `Approve ${p.finalCode ?? p.code}`, project: p.name, href: `/projects/${p.id}#final` });
    }
    for (const r of Object.values(runs)) {
      const waiting = r.crew.find((a) => r.crewStatus[a] === 'waiting');
      if (waiting && (r.status === 'running' || r.status === 'done')) {
        const ask = [...r.lines].reverse().find((l) => l.kind === 'ASK');
        out.push({ id: `${r.id}:ask`, agent: waiting, text: ask?.text ?? 'Answer a question', project: r.projectId ? (projects.find((p) => p.id === r.projectId)?.name ?? '') : 'New formulation', href: hrefFor(r) });
      }
    }
    return out;
  }, [projects, role, runs]);
}

/** Pending aged tests (one per project × property), earliest due first. */
export function useAwaitingLab(): PendingTest[] {
  const projects = useProjects((s) => s.projects);
  return useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const out: PendingTest[] = [];
    for (const p of projects) {
      const groups = new Map<string, { trials: string[]; due: string }>();
      for (const r of p.results) {
        if (r.status !== 'pending' || !r.dueDate) continue;
        const g = groups.get(r.propertyId) ?? { trials: [], due: r.dueDate };
        g.trials.push(r.trialId);
        if (r.dueDate < g.due) g.due = r.dueDate;
        groups.set(r.propertyId, g);
      }
      for (const [pid, g] of groups)
        out.push({ id: `${p.id}:${pid}`, projectId: p.id, project: p.name, property: PROP[pid]?.name ?? pid, trials: g.trials, dueDate: g.due, daysLeft: Math.round((new Date(g.due).getTime() - now.getTime()) / 86400000), href: `/projects/${p.id}#results` });
    }
    return out.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [projects]);
}

/**
 * Latest TOOL/THINK line for a job, throttled to one new line every 2.5 s so it stays readable.
 * (Reads the engine's trace, which is fed by the same events as the agent bus.)
 */
export function useLatestTrace(jobId?: string): string | null {
  const latest = useTasks((s) => {
    if (!jobId) return null;
    const r = s.runs[jobId];
    const l = r && [...r.lines].reverse().find((x) => x.kind === 'TOOL' || x.kind === 'THINK');
    return l ? l.text.replace(/^tool\./, '').replace(/\*\*/g, '') : null;
  });
  const [shown, setShown] = useState<string | null>(latest);
  const lastShown = useRef(0);
  useEffect(() => {
    if (latest === shown) return;
    const wait = Math.max(0, 2500 - (Date.now() - lastShown.current));
    const t = setTimeout(() => {
      lastShown.current = Date.now();
      setShown(latest);
    }, wait);
    return () => clearTimeout(t);
  }, [latest, shown]);
  return shown;
}

export function shortDue(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
