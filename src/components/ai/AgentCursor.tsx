import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { bus } from '@/agent/bus';
import { botMotionAllowed } from '@/agent/engine';
import type { AgentId } from '@/agents/registry';
import { AgentBot } from '@/components/agents/AgentBot';

const SIZE = 28;

function visible(el: Element) {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.top >= 60 && r.bottom <= window.innerHeight - 20;
}

/**
 * Signature moment: the active agent's bot flies from the AgentConsole to the field it is about
 * to fill, hopping along the way, and settles when it lands. One cursor bot on screen at a time.
 */
export function AgentCursor() {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [show, setShow] = useState(false);
  const [who, setWho] = useState<AgentId>('conductor');
  const [flying, setFlying] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const landTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const activeRef = useRef(false);
  // arc slightly upward on the way in, so the flight reads as a hop
  const yPath = useMemo(() => (pos ? [null, pos.y - 18, pos.y] : [0]), [pos]);

  useEffect(() => {
    const offCursor = bus.on('cursor', ({ path, value, agent }) => {
      // reduced motion / "Still": fields fill in place, no flight
      if (!botMotionAllowed()) return;
      const el =
        (value !== undefined && document.querySelector(`[data-ai-target="${CSS.escape(path)}:${CSS.escape(value)}"]`)) ||
        document.querySelector(`[data-ai-path="${CSS.escape(path)}"]`);
      if (!el) return;
      setWho(agent);
      const go = () => {
        const r = el.getBoundingClientRect();
        if (!activeRef.current) {
          activeRef.current = true;
          const origin = Array.from(document.querySelectorAll('[data-agent-origin]')).find((o) => o.getBoundingClientRect().width > 0);
          if (origin) {
            const o = origin.getBoundingClientRect();
            setPos({ x: o.left + o.width / 2 - SIZE / 2, y: o.top + o.height / 2 - SIZE / 2 });
          }
        }
        requestAnimationFrame(() => {
          setPos({ x: r.right - SIZE - 6, y: r.top + Math.min(r.height, 40) / 2 - SIZE / 2 + (r.height > 40 ? 18 : 0) });
          setShow(true);
          setFlying(true);
          clearTimeout(landTimer.current);
          landTimer.current = setTimeout(() => setFlying(false), 420);
        });
      };
      if (!visible(el)) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        setTimeout(go, 260);
      } else go();
      clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => {
        activeRef.current = false;
        setShow(false);
        setPos(null);
      }, 1800);
    });
    const offHide = bus.on('cursor-hide', () => {
      activeRef.current = false;
      setShow(false);
      setPos(null);
    });
    return () => {
      offCursor();
      offHide();
    };
  }, []);

  return (
    <AnimatePresence>
      {show && pos && (
        <motion.div
          className="pointer-events-none fixed left-0 top-0 z-[60]"
          initial={{ opacity: 0, x: pos.x, y: pos.y, scale: 0.6 }}
          animate={{ opacity: 1, x: pos.x, y: yPath as number[], scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          transition={{ x: { type: 'spring', stiffness: 260, damping: 28 }, y: { duration: 0.45, times: [0, 0.5, 1], ease: 'easeOut' }, scale: { duration: 0.2 }, opacity: { duration: 0.15 } }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={who} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }} transition={{ duration: 0.15 }} className="drop-shadow-[0_4px_10px_var(--accent-glow)]">
              <AgentBot id={who} preset="cursor" placement="cursor" status={flying ? 'working' : 'idle'} />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
