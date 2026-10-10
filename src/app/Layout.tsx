import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Sidebar } from '@/components/shell/Sidebar';
import { TopBar } from '@/components/shell/TopBar';
import { CommandPalette } from '@/components/shell/CommandPalette';
import { AskHelixPanel } from '@/components/shell/AskHelixPanel';
import { DevStateSwitcher } from '@/components/shell/DevStateSwitcher';
import { AgentCursor } from '@/components/ai/AgentCursor';
import { HandoffLayer } from '@/components/agents/HandoffArc';
import { DesktopGuard } from './DesktopGuard';
import { useUI } from '@/store/ui';
import { setNavigator } from './navigation';
import { resumeOrphanedRuns, startCrewDemo } from '@/agent/controller';
import { pageTransition } from '@/lib/motion';
import { cn } from '@/lib/cn';

let resumed = false;

/**
 * Responsive shell: fixed 236 px sidebar from 1024 px, off-canvas drawer below.
 * Ask Helix pushes content on very wide screens (≥ 1680 px) and overlays it on smaller ones.
 */
export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useUI((s) => s.theme);
  const askOpen = useUI((s) => s.askOpen);
  const rail = useUI((s) => s.sidebarCollapsed);
  const set = useUI((s) => s.set);

  useEffect(() => setNavigator((to) => navigate(to)), [navigate]);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    // bot-avatars' theme="auto" reads this, so bots match the app theme
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => {
    if (!resumed) {
      resumed = true;
      setTimeout(resumeOrphanedRuns, 1200);
      setTimeout(startCrewDemo, 1600);
    }
  }, []);
  useEffect(() => set({ navOpen: false }), [location.pathname, set]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        set({ devOpen: !useUI.getState().devOpen });
      } else if (mod && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        navigate('/tasks');
      } else if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        set({ paletteOpen: !useUI.getState().paletteOpen });
      } else if (mod && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        set({ askOpen: !useUI.getState().askOpen });
      } else if (e.key === 'Escape') {
        set({ paletteOpen: false, devOpen: false });
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [set, navigate]);

  const sectionKey = location.pathname.split('/').slice(0, 3).join('/');

  return (
    <div className="h-full bg-bg text-ink">
      <Sidebar />
      <div className={cn('flex h-full min-w-0 flex-col transition-[padding] duration-200', rail ? 'lg:pl-16' : 'lg:pl-[248px]')}>
        <main id="main-scroll" className={cn('scroll-thin relative flex-1 overflow-y-auto transition-[padding] duration-300', askOpen && '3xl:pr-[400px]')}>
          <TopBar />
          <AnimatePresence mode="wait">
            <motion.div key={sectionKey} {...pageTransition} className="mx-auto w-full max-w-[1320px] px-4 pb-14 pt-6 sm:px-6 md:pt-7 xl:px-8">
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <AskHelixPanel />
      <CommandPalette />
      <DevStateSwitcher />
      <AgentCursor />
      <HandoffLayer />
      <DesktopGuard />
      <Toaster position="bottom-right" theme={theme} />
    </div>
  );
}
