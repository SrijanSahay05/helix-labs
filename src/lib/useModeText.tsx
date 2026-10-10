import { AnimatePresence, motion } from 'framer-motion';
import { COPY, type CopyKey } from '@/data/copy';
import { useUI } from '@/store/ui';
import type { Mode } from '@/types';

export function useMode(): Mode {
  return useUI((s) => s.mode);
}

export function useModeText(key: CopyKey): string {
  const mode = useMode();
  return COPY[key][mode];
}

/** Mode-aware text that cross-fades when the user switches Scientist ↔ Non-scientist. */
export function T({ k, scientist, plain, className }: { k?: CopyKey; scientist?: string; plain?: string; className?: string }) {
  const mode = useMode();
  const text = k ? COPY[k][mode] : mode === 'scientist' ? scientist : (plain ?? scientist);
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span key={mode + (text ?? '')} className={className} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.14 }}>
        {text}
      </motion.span>
    </AnimatePresence>
  );
}
