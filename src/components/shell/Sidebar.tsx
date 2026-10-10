import { NavLink } from 'react-router-dom';
import { BookOpen, Bot, Boxes, ChevronsLeft, ChevronsRight, FileBarChart2, FlaskConical, Layers, ListChecks, Settings, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUI } from '@/store/ui';
import { useProjects } from '@/store/project';
import { useRunningCount } from '@/store/tasks';
import { cn } from '@/lib/cn';
import { Wordmark } from './Wordmark';
import { ModeSwitch } from './ModeSwitch';
import { CrewMonitor } from '@/features/crew-monitor/CrewMonitor';
import { RailStack } from '@/features/crew-monitor/RailStack';

const NAV = [
  { to: '/projects', label: 'Projects', icon: FlaskConical },
  { to: '/benchmarks', label: 'Benchmarks', icon: BookOpen },
  { to: '/raw-materials', label: 'Raw materials', icon: Boxes },
  { to: '/templates', label: 'Templates', icon: Layers },
  { to: '/reports', label: 'Reports', icon: FileBarChart2 },
  { to: '/tasks', label: 'Task queue', icon: ListChecks },
  { to: '/agents', label: 'Agents', icon: Bot },
];

const ROLE_LABEL = { chemist: 'Chemist', technician: 'Technician', reviewer: 'Reviewer', admin: 'Admin' };

const initials = (n: string) =>
  n
    .split(' ')
    .map((x) => x[0])
    .join('');

function SidebarBody({ onNavigate, rail }: { onNavigate: () => void; rail?: boolean }) {
  const role = useUI((s) => s.role);
  const userName = useUI((s) => s.userName);
  const set = useUI((s) => s.set);
  const projects = useProjects((s) => s.projects.length);
  const running = useRunningCount();
  return (
    <div className={cn('flex h-full flex-col pb-3 pt-5', rail ? 'items-center px-2' : 'px-3')}>
      <div className={cn('mb-5 flex h-8 items-center', rail ? 'justify-center' : 'justify-between pl-3 pr-1')}>
        {!rail && <Wordmark />}
        <button onClick={() => set({ sidebarCollapsed: !rail })} className="hidden h-7 w-7 place-items-center rounded-md text-ink3 hover:bg-surface2 hover:text-ink lg:grid" title={rail ? 'Expand sidebar' : 'Collapse sidebar'} aria-label={rail ? 'Expand sidebar' : 'Collapse sidebar'}>
          {rail ? <ChevronsRight size={15} /> : <ChevronsLeft size={15} />}
        </button>
      </div>
      {!rail && <div className="label mb-1.5 px-3">Workspace</div>}
      <nav className={cn('space-y-0.5', rail && 'w-full')} aria-label="Main">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            title={rail ? label : undefined}
            className={({ isActive }) =>
              cn(
                'relative flex h-9 items-center rounded-md text-sm font-medium transition-colors',
                rail ? 'justify-center' : 'gap-3 px-3',
                isActive ? 'bg-accent-soft text-accent before:absolute before:left-0 before:top-1/2 before:h-4 before:w-[3px] before:-translate-y-1/2 before:rounded-full before:bg-accent' : 'text-ink2 hover:bg-surface2 hover:text-ink',
              )
            }
          >
            <Icon size={17} strokeWidth={1.8} />
            {!rail && <span className="flex-1">{label}</span>}
            {!rail && to === '/projects' && <span className="mono rounded bg-surface2 px-1.5 text-2xs text-ink2">{projects}</span>}
            {!rail && to === '/tasks' && running > 0 && <span className="mono rounded bg-accent px-1.5 text-2xs font-semibold text-on-accent">{running}</span>}
          </NavLink>
        ))}
      </nav>
      {/* 8 px under the last nav item: the live crew monitor */}
      <div className={cn('mt-2', rail ? 'w-full' : '-mx-1')}>{rail ? <RailStack /> : <CrewMonitor />}</div>
      {!rail && (
        <div className="mt-3 lg:hidden">
          <div className="label mb-2 px-1">Who is using Helix</div>
          <ModeSwitch full />
        </div>
      )}
      <div className={cn('mt-auto pt-4', rail && 'flex w-full flex-col items-center')}>
        <NavLink
          to="/settings"
          onClick={onNavigate}
          title={rail ? 'Settings' : undefined}
          className={({ isActive }) => cn('flex h-9 items-center rounded-md text-sm font-medium', rail ? 'w-full justify-center' : 'gap-3 px-3', isActive ? 'bg-accent-soft text-accent' : 'text-ink2 hover:bg-surface2 hover:text-ink')}
        >
          <Settings size={17} strokeWidth={1.8} /> {!rail && 'Settings'}
        </NavLink>
        {!rail && (
          <p className="px-3 py-2 text-[11px] leading-4 text-ink3">
            <b className="font-semibold text-ink2">Demo workspace.</b> Agent runs are simulated; values are demo data for R&D to confirm.
          </p>
        )}
        <div className={cn('mt-1 flex items-center border-t border-line pt-3', rail ? 'justify-center' : 'gap-2.5 px-2')}>
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent-soft text-2xs font-semibold text-accent" title={rail ? `${userName} · ${ROLE_LABEL[role]}` : undefined}>
            {initials(userName)}
          </div>
          {!rail && (
            <div className="min-w-0">
              <div className="truncate text-xs font-medium">{userName}</div>
              <div className="text-2xs text-ink3">{ROLE_LABEL[role]}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const open = useUI((s) => s.navOpen);
  const rail = useUI((s) => s.sidebarCollapsed);
  const set = useUI((s) => s.set);
  const close = () => set({ navOpen: false });
  return (
    <>
      <aside className={cn('fixed inset-y-0 left-0 z-30 hidden overflow-y-auto border-r border-line bg-surface transition-[width] duration-200 lg:block', rail ? 'w-16' : 'w-[248px]')}>
        <SidebarBody onNavigate={() => {}} rail={rail} />
      </aside>
      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-[#11132255] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-[min(290px,86vw)] overflow-y-auto border-r border-line bg-surface shadow-pop lg:hidden"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <button onClick={close} className="absolute right-3 top-5 rounded-md p-2 text-ink3 hover:bg-surface2" aria-label="Close menu">
                <X size={16} />
              </button>
              <SidebarBody onNavigate={close} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

