import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Per-subcategory property template overrides (open question in brief → editable). */
interface TemplatesState {
  overrides: Record<string, string[]>;
  set: (subId: string, props: string[]) => void;
  reset: (subId: string) => void;
}

export const useTemplates = create<TemplatesState>()(
  persist(
    (set) => ({
      overrides: {},
      set: (subId, props) => set((s) => ({ overrides: { ...s.overrides, [subId]: props } })),
      reset: (subId) =>
        set((s) => {
          const o = { ...s.overrides };
          delete o[subId];
          return { overrides: o };
        }),
    }),
    { name: 'helix:v1:templates' },
  ),
);
