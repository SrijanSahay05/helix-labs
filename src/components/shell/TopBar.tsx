import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Menu, Moon, Search, Sparkles, Sun } from 'lucide-react';
import { useProjects } from '@/store/project';
import { useUI } from '@/store/ui';
import { useTheme } from '@/store/theme';
import { BENCHMARKS } from '@/data/benchmarks';
import { COPY } from '@/data/copy';
import type { Mode, StageId } from '@/types';
import { ModeSwitch } from './ModeSwitch';
import { TaskQueuePopover } from './TaskQueuePopover';

const SECTION: Record<string, string> = {
  projects: 'Projects',
  benchmarks: 'Benchmarks',
  'raw-materials': 'Raw materials',
  templates: 'Templates',
  reports: 'Reports',
  tasks: 'Task queue',
  agents: 'Agents',
  settings: 'Settings',
  onboarding: 'Welcome',
  playground: 'Component playground',
};
const STAGES = ['literature', 'pathways', 'trials', 'results', 'analysis', 'final'];

function useCrumbs(mode: Mode): { label: string; to?: string }[] {
  const { pathname, hash } = useLocation();
  const projects = useProjects((s) => s.projects);
  const parts = pathname.split('/').filter(Boolean);
  const crumbs: { label: string; to?: string }[] = [];
  if (!parts.length) return crumbs;
  crumbs.push({ label: SECTION[parts[0]] ?? parts[0], to: `/${parts[0]}` });
  if (parts[0] === 'projects' && parts[1]) {
    if (parts[1] === 'new') crumbs.push({ label: 'New formulation' });
    else {
      const p = projects.find((x) => x.id === parts[1]);
      crumbs.push({ label: p ? `${p.code} · ${p.name}` : parts[1], to: `/projects/${parts[1]}` });
      if (parts[2] === 'compare') crumbs.push({ label: 'Compare pathways' });
      else if (hash && STAGES.includes(hash.slice(1))) crumbs.push({ label: COPY[`stage.${hash.slice(1) as StageId}`][mode] });
    }
  }
  if (parts[0] === 'benchmarks' && parts[1]) crumbs.push({ label: BENCHMARKS.find((b) => b.id === parts[1])?.name ?? parts[1] });
  return crumbs;
}

export function TopBar() {
  const mode = useUI((s) => s.mode);
  const crumbs = useCrumbs(mode);
  const set = useUI((s) => s.set);
  const askOpen = useUI((s) => s.askOpen);
  const { theme, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-20 flex h-[60px] shrink-0 items-center gap-2 border-b border-line bg-[color-mix(in_srgb,var(--surface)_86%,transparent)] px-3 backdrop-blur-md md:gap-3 md:px-6 xl:px-8">
      <button onClick={() => set({ navOpen: true })} className="grid h-10 w-10 place-items-center rounded-md text-ink2 hover:bg-surface2 lg:hidden" aria-label="Open menu">
        <Menu size={18} />
      </button>
      <Link to="/projects" className="lg:hidden">
        <img src="/helix-logo.svg" alt="Helix" className="h-6 w-auto" />
      </Link>
      <nav aria-label="Breadcrumb" className="hidden min-w-0 flex-1 items-center gap-1.5 text-xs text-ink2 sm:flex">
        {crumbs.map((c, i) => (
          <span key={i} className="flex min-w-0 items-center gap-1.5">
            {i > 0 && <ChevronRight size={13} className="shrink-0 text-ink3" />}
            {c.to && i < crumbs.length - 1 ? (
              <Link to={c.to} className="truncate hover:text-accent hover:underline hover:underline-offset-4">
                {c.label}
              </Link>
            ) : (
              <span className="truncate font-medium text-ink" aria-current="page">
                {c.label}
              </span>
            )}
          </span>
        ))}
      </nav>
      <div className="flex-1 sm:hidden" />
      <button onClick={() => set({ paletteOpen: true })} className="flex h-9 items-center gap-2.5 rounded-md border border-line bg-surface2 px-3 text-xs text-ink2 hover:bg-surface hover:text-ink" aria-label="Search">
        <Search size={15} />
        <span className="hidden xl:inline">Search</span>
        <kbd className="mono hidden rounded border border-line bg-surface px-1.5 text-[10px] xl:inline">⌘K</kbd>
      </button>
      <div className="hidden lg:block">
        <ModeSwitch />
      </div>
      <TaskQueuePopover />
      <button onClick={toggle} className="grid h-9 w-9 place-items-center rounded-md bg-surface2 text-ink2 hover:text-ink" title="Toggle theme" aria-label="Toggle theme">
        {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
      </button>
      <button
        onClick={() => set({ askOpen: !askOpen })}
        className="flex h-9 items-center gap-2 rounded-md border border-line bg-surface px-3 text-xs font-medium text-ink hover:bg-surface2"
        title="Ask Helix (⌘J)"
      >
        <Sparkles size={15} className="text-accent" />
        <span className="hidden sm:inline">Ask Helix</span>
      </button>
    </header>
  );
}
