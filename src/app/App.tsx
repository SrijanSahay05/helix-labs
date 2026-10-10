import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { Layout } from './Layout';
import { useUI } from '@/store/ui';
import { ProjectsPage } from '@/features/projects/ProjectsPage';
import { IntakeWizard } from '@/features/intake/IntakeWizard';
import { ProjectPage } from '@/features/project/ProjectPage';
import { PathwayCompare } from '@/features/project/PathwayCompare';
import { BenchmarksPage } from '@/features/benchmarks/BenchmarksPage';
import { BenchmarkDetail } from '@/features/benchmarks/BenchmarkDetail';
import { RawMaterialsPage } from '@/features/raw-materials/RawMaterialsPage';
import { TemplatesPage } from '@/features/templates/TemplatesPage';
import { ReportsPage } from '@/features/reports/ReportsPage';
import { TasksPage } from '@/features/tasks/TasksPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { OnboardingWho } from '@/features/onboarding/OnboardingWho';
import { Playground } from '@/features/playground/Playground';
import { AgentsPage } from '@/features/agents/AgentsPage';
import { BotsPlayground } from '@/features/playground/BotsPlayground';

function Home() {
  const remembered = useUI((s) => s.modeRemembered);
  return <Navigate to={remembered ? '/projects' : '/onboarding/who'} replace />;
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'onboarding/who', element: <OnboardingWho /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'projects/new', element: <IntakeWizard /> },
      { path: 'projects/:id', element: <ProjectPage /> },
      { path: 'projects/:id/compare', element: <PathwayCompare /> },
      { path: 'benchmarks', element: <BenchmarksPage /> },
      { path: 'benchmarks/:id', element: <BenchmarkDetail /> },
      { path: 'raw-materials', element: <RawMaterialsPage /> },
      { path: 'templates', element: <TemplatesPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'tasks', element: <TasksPage /> },
      { path: 'agents', element: <AgentsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'playground', element: <Playground /> },
      { path: 'playground/bots', element: <BotsPlayground /> },
      { path: '*', element: <Navigate to="/projects" replace /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
