import { Command } from 'cmdk';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BookMarked, Boxes, FlaskConical, Moon, Plus, Ruler, Sparkles, Terminal, UserRound } from 'lucide-react';
import { useUI } from '@/store/ui';
import { useProjects } from '@/store/project';
import { BENCHMARKS } from '@/data/benchmarks';
import { RAW_MATERIALS } from '@/data/rawMaterials';
import { PROPERTIES } from '@/data/properties';
import { switchMode } from './ModeSwitch';
import { HelixOrb } from '@/components/ai/HelixOrb';

export function CommandPalette() {
  const open = useUI((s) => s.paletteOpen);
  const set = useUI((s) => s.set);
  const mode = useUI((s) => s.mode);
  const theme = useUI((s) => s.theme);
  const projects = useProjects((s) => s.projects);
  const nav = useNavigate();
  const close = () => set({ paletteOpen: false });
  const go = (to: string) => {
    nav(to);
    close();
  };
  const item = 'flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 text-sm text-ink2 aria-selected:bg-accent-soft aria-selected:text-ink';
  const group = 'px-1 py-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-2xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-ink3';
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/25 pt-[14vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 6, opacity: 0 }} transition={{ duration: 0.18 }} onClick={(e) => e.stopPropagation()} className="w-[620px] overflow-hidden rounded-xl border border-line bg-surface shadow-pop">
            <Command label="Global search" loop>
              <div className="flex items-center gap-2 border-b border-line px-3">
                <HelixOrb state="listening" size={20} />
                <Command.Input autoFocus placeholder="Search projects, benchmarks, materials, properties or type a command…" className="h-12 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink3" onKeyDown={(e) => e.key === 'Escape' && close()} />
              </div>
              <Command.List className="scroll-thin max-h-[420px] overflow-auto p-1">
                <Command.Empty className="p-6 text-center text-sm text-ink3">No matches.</Command.Empty>
                <Command.Group heading="Commands" className={group}>
                  <Command.Item className={item} onSelect={() => go('/projects/new')}>
                    <Plus size={14} /> New formulation
                  </Command.Item>
                  <Command.Item className={item} onSelect={() => (switchMode(mode === 'scientist' ? 'non-scientist' : 'scientist'), close())}>
                    <UserRound size={14} /> Switch to {mode === 'scientist' ? 'Non-scientist' : 'Scientist'}
                  </Command.Item>
                  <Command.Item className={item} onSelect={() => (set({ theme: theme === 'dark' ? 'light' : 'dark' }), close())}>
                    <Moon size={14} /> Toggle dark theme
                  </Command.Item>
                  <Command.Item className={item} onSelect={() => set({ paletteOpen: false, askOpen: true })}>
                    <Sparkles size={14} /> Ask Helix
                  </Command.Item>
                  <Command.Item className={item} onSelect={() => set({ paletteOpen: false, devOpen: true })}>
                    <Terminal size={14} /> Dev state switcher
                  </Command.Item>
                  <Command.Item className={item} onSelect={() => go('/playground')}>
                    <Sparkles size={14} /> Component playground
                  </Command.Item>
                  <Command.Item className={item} onSelect={() => go('/agents')}>
                    <Sparkles size={14} /> Agents · the crew
                  </Command.Item>
                  <Command.Item className={item} onSelect={() => go('/playground/bots')}>
                    <Sparkles size={14} /> Bot playground
                  </Command.Item>
                </Command.Group>
                <Command.Group heading="Projects" className={group}>
                  {projects.map((p) => (
                    <Command.Item key={p.id} value={`project ${p.name} ${p.code}`} className={item} onSelect={() => go(`/projects/${p.id}`)}>
                      <FlaskConical size={14} /> {p.name} <span className="mono ml-auto text-2xs text-ink3">{p.code}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
                <Command.Group heading="Benchmarks" className={group}>
                  {BENCHMARKS.map((b) => (
                    <Command.Item key={b.id} value={`benchmark ${b.name} ${b.standardClass}`} className={item} onSelect={() => go(`/benchmarks/${b.id}`)}>
                      <BookMarked size={14} /> {b.name} <span className="ml-auto text-2xs text-ink3">{b.standardClass}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
                <Command.Group heading="Raw materials" className={group}>
                  {RAW_MATERIALS.map((m) => (
                    <Command.Item key={m.id} value={`material ${m.name} ${m.fn}`} className={item} onSelect={() => go(`/raw-materials?q=${encodeURIComponent(m.name)}`)}>
                      <Boxes size={14} /> {m.name} <span className="mono ml-auto text-2xs text-ink3">₹ {m.pricePerKg}/kg</span>
                    </Command.Item>
                  ))}
                </Command.Group>
                <Command.Group heading="Properties" className={group}>
                  {PROPERTIES.map((p) => (
                    <Command.Item key={p.id} value={`property ${p.name} ${p.plainName}`} className={item} onSelect={() => go('/templates')}>
                      <Ruler size={14} /> {mode === 'scientist' ? p.name : p.plainName} <span className="ml-auto text-2xs text-ink3">{p.unit}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
