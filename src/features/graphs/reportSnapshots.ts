import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ChartSnapshot {
  id: string;
  at: string;
  dataset: string;
  view: string;
  axes: string;
  selection: number;
  /** PNG data URL (1×) */
  image: string;
}

/** Charts sent from Graphs → "Add to report"; shown with the Results comparison report. Keeps the latest 6. */
export const useChartSnapshots = create<{ items: ChartSnapshot[]; remove: (id: string) => void }>()(
  persist(
    (set) => ({
      items: [],
      remove: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
    }),
    { name: 'helix:v1:chart-snapshots' },
  ),
);

export function addChartSnapshot(s: ChartSnapshot) {
  useChartSnapshots.setState((st) => ({ items: [s, ...st.items].slice(0, 6) }));
}
