import { useEffect, useState } from 'react';
import { FastForward } from 'lucide-react';
import { NovyteShowcase } from '@/components/ai/NovyteShowcase';
import { useModeText } from '@/lib/useModeText';
import { useUI } from '@/store/ui';

/** "Helix is preparing your research" interstitial (~10 s, skippable). */
export function ProcessingShowcase({ onDone }: { onDone: () => void }) {
  const lit = useModeText('showcase.lit');
  const path = useModeText('showcase.path');
  const speed = useUI((s) => s.speed);
  const total = speed === 'instant' ? 0 : 10000 / (speed as number);
  const [left, setLeft] = useState(total);
  useEffect(() => {
    if (total === 0) return onDone();
    const t = setInterval(() => setLeft((x) => x - 100), 100);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (left <= 0 && total) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left]);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Helix is preparing your research</h3>
          <p className="text-sm text-ink2">A preview of what runs as soon as you start the formulation.</p>
        </div>
        <button onClick={onDone} className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-accent hover:bg-accent-soft">
          <FastForward size={13} /> Skip · {Math.max(0, Math.ceil(left / 1000))} s
        </button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <NovyteShowcase kind="literature" caption={lit} />
        <NovyteShowcase kind="pathways" caption={path} />
      </div>
    </div>
  );
}
