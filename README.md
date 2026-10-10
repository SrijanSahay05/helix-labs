# Helix — AI-simulated formulation agent (frontend only)

React 19 + Vite + TypeScript (strict) + Tailwind + Framer Motion + Zustand + TanStack Table + Recharts + cmdk + sonner + **thinking-orbs**.
There is no backend: every "AI" moment is driven by the scripted Agent Simulation Engine in `src/agent/`.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build
npx vitest run     # cost / 100 % / status-band / validation tests
```

## Demo path
1. **Projects → New formulation** → click an example chip (or paste any URL) → Magic Start fills every intake step.
2. **Jump to review → Start formulation** → Literature and Pathways run in the background (toasts + Task queue).
3. Open the seeded *Exterior tile adhesive* project → **Lab results → Load sample lab results** → Analysis proposes T5/T6 →
   **Accept next iteration** → load results again → **Targets met** → Final → Lock & submit → switch role to Reviewer in Settings → Approve.

Shortcuts: `⌘K` search/commands · `⌘J` Ask Helix · `⌘⇧D` dev state switcher · `Enter` confirm intake step · `Tab` visits low-confidence fields first.
Settings → *Demo speed* (0.5× / 1× / 2× / Instant). `/playground` shows every orb state and AI component.

## Design system (from the `../new` reference)
- **Type:** DM Sans for UI, **Crimson Pro** for page titles, stage names and agent narration, **JetBrains Mono** for data, codes, standards and agent traces. Fonts are bundled via `@fontsource`.
- **Colour:** violet accent `#6D4AFF` (dark `#AA97FF`), green / amber / red status colours with soft fills. Pass / borderline / fail always show colour plus a text label. Tokens live in `src/styles/index.css`.
- **Spacing:** 236 px sidebar, 60 px top bar, 1320 px max content width, 24 px panel padding, 12 px card radius, 7 px control radius, 40 px inputs and 38 px buttons.
- **Responsive:** the sidebar becomes a drawer below 1024 px. Two-column screens stack below 1280 px, and project tables switch to cards. Wide tables scroll horizontally. Ask Helix pushes the content only at 1680 px and wider; on smaller screens it overlays.
- **Agent presence:** Helix's state is always visible. The sidebar shows a "Helix agent" card with a live orb and what it is doing now. Large orbs (96–168 px, with a halo) appear on the Magic Start hero, the agent console, the projects page, the analysis and final stages, and empty states. Running stages show a 32 px orb.

## Graphs (Results & Analysis stages)
Trial Visualization owned by Delta: Parallel · 2D Scatter · 3D Scatter · Surface · Contour, plus More → Bubble, Scatter matrix,
Pareto front, Optimisation progress, Ternary, Similarity map (PCA) and Predicted vs actual. One shared selection and hover across views.
- Plotly partial bundle (`src/charts/plotly.ts`), lazy-loaded when the card opens. Surrogate model (ARD Gaussian process, LOO,
  EI suggestions, PCA) runs in a Web Worker (`src/workers/model.worker.ts`, comlink); pure model code in `src/features/graphs/model/`.
- Default data is the reference demo `src/data/demo/cream22.ts` (22 trials, 28 parameters, 6 results). ⌘⇧D → *Graphs panel*
  switches to the tile adhesive, this project's own trials, a 2 000-trial performance set, or forces any state (empty, too few,
  low confidence, missing values, failed trial, slow fit, fit error, read-only).

## Structure
```
src/
  app/          routes, layout, desktop guard, navigation bridge
  agent/        engine.ts (event runner), bus.ts, controller.ts (stage runs), askHelix.ts, scripts/{intake,stages}.ts
  components/
    ai/         HelixOrb, AgentConsole, AIField, TypeText, AgentCursor, ConfidenceMeter, CitationChip, DiffPreview, NovyteShowcase
    shell/      Sidebar, TopBar, CommandPalette, ModeSwitch, TaskQueuePopover, AskHelixPanel, DevStateSwitcher
    tables/     TargetsTable, RecipeTable
    ui/         Button, Pill, primitives, StateFrame, Icon
  features/     intake/, project/ (+ stages/), projects/, benchmarks/, raw-materials/, templates/, reports/, tasks/, settings/, onboarding/, playground/
  data/         categories, properties, rawMaterials, standards, copy (mode dictionary), demoProject, scenarios/, projectFactory
  store/        ui, project (projects + intake draft), tasks (agent runs), ask, templates, theme
  lib/          cost, validate, status, simulate, format, exporter, reports, path, motion
```

Open questions from the brief are configurable: categories (`data/categories.ts`), templates (Templates page), standards and
non-scientist output (Settings), brand (`data/copy.ts` BRAND + CSS tokens). All values are demo data — for R&D to confirm.
