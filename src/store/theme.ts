import { useUI } from './ui';

export function useTheme() {
  const theme = useUI((s) => s.theme);
  const setTheme = useUI((s) => s.setTheme);
  return { theme, setTheme, toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark') };
}
