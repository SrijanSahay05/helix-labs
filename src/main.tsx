import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/styles/fonts';
import '@/styles/index.css';
import { App } from '@/app/App';
import { useUI } from '@/store/ui';

document.documentElement.classList.toggle('dark', useUI.getState().theme === 'dark');
document.documentElement.dataset.theme = useUI.getState().theme;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
