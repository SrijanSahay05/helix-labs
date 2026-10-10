import { Monitor } from 'lucide-react';
import { useEffect, useState } from 'react';

/** The brief's minimum viewport: Helix is a desktop app (≥ 1280 px wide). */
export const MIN_WIDTH = 1280;

/**
 * Below 1280 px a desktop-only message covers the app (VS-05). Users can continue anyway for the session;
 * the layout still degrades gracefully, but nothing below 1280 px is a supported layout.
 */
export function DesktopGuard() {
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.innerWidth < MIN_WIDTH);
  const [dismissed, setDismissed] = useState(() => typeof sessionStorage !== 'undefined' && sessionStorage.getItem('helix:narrow-ok') === '1');
  useEffect(() => {
    const h = () => setNarrow(window.innerWidth < MIN_WIDTH);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  if (!narrow || dismissed) return null;
  return (
    <div role="alertdialog" aria-modal="true" aria-labelledby="desktop-only-title" data-testid="desktop-only" className="fixed inset-0 z-[100] grid place-items-center bg-bg/95 p-6 backdrop-blur-sm">
      <div className="card max-w-md p-8 text-center">
        <Monitor size={32} className="mx-auto text-accent" />
        <h2 id="desktop-only-title" className="mt-4 font-display text-2xl font-semibold">
          Helix is a desktop app
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink2">
          Formulation tables and graphs need room. Please use a window at least <b className="mono text-ink">1280 px</b> wide — yours is <span className="mono">{typeof window !== 'undefined' ? window.innerWidth : 0} px</span>.
        </p>
        <button
          onClick={() => {
            sessionStorage.setItem('helix:narrow-ok', '1');
            setDismissed(true);
          }}
          className="mt-6 text-xs font-medium text-ink3 underline-offset-4 hover:text-accent hover:underline"
        >
          Continue anyway (unsupported layout)
        </button>
      </div>
    </div>
  );
}
