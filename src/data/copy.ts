import type { Mode } from '@/types';

/** Single source of truth for mode-dependent language. Engine, data and screens are shared. */
export const COPY = {
  'step.who': { scientist: 'Who is using Helix?', 'non-scientist': 'Who is using Helix?' },
  'step.category': { scientist: 'Product category', 'non-scientist': 'What kind of product?' },
  'step.subcategory': { scientist: 'Subcategory & chemistry', 'non-scientist': 'Which exact type?' },
  'step.usecase': { scientist: 'Exact use case', 'non-scientist': 'Where will it be used?' },
  'step.benchmark': { scientist: 'Closest benchmark', 'non-scientist': 'Product to match' },
  'step.preview': { scientist: 'Formulation preview', 'non-scientist': 'What Helix will make' },
  'step.targets': { scientist: 'Property targets', 'non-scientist': 'How it should perform' },
  'step.constraints': { scientist: 'Constraints', 'non-scientist': 'Budget and must-haves' },
  'step.showcase': { scientist: 'Research preview', 'non-scientist': 'Helix is getting ready' },
  'step.review': { scientist: 'Brief review', 'non-scientist': 'Check your brief' },
  'usecase.sub': {
    scientist: 'Structured fields — Helix pre-fills each from the source and standard. Review the highlighted ones.',
    'non-scientist': 'A few quick questions. Helix has guessed the answers — just confirm or pick another.',
  },
  'targets.sub': {
    scientist: 'Grouped Chemical → Rheological → Mechanical → Durability. Standard limit and benchmark shown for reference.',
    'non-scientist': 'Helix set these from the standard and the product you want to match. Change the priority if needed.',
  },
  'constraints.sub': {
    scientist: 'Cost ceiling, raw material limits, compliance and site conditions.',
    'non-scientist': 'Pick a budget band and anything it must do.',
  },
  'col.target': { scientist: 'Target (property)', 'non-scientist': 'What we measure' },
  'col.priority': { scientist: 'Priority', 'non-scientist': 'How important' },
  'priority.must': { scientist: 'Must', 'non-scientist': 'Must have' },
  'priority.important': { scientist: 'Important', 'non-scientist': 'Important' },
  'priority.nice': { scientist: 'Nice', 'non-scientist': 'Nice to have' },
  'stage.literature': { scientist: 'Literature', 'non-scientist': 'Research' },
  'stage.pathways': { scientist: 'Pathways', 'non-scientist': 'Recipe ideas' },
  'stage.trials': { scientist: 'Trials', 'non-scientist': 'Test batches' },
  'stage.results': { scientist: 'Lab results', 'non-scientist': 'Lab results' },
  'stage.analysis': { scientist: 'Analysis', 'non-scientist': 'What the results mean' },
  'stage.final': { scientist: 'Final formulation', 'non-scientist': 'Final product' },
  'showcase.lit': { scientist: 'Literature review — papers, patents, TDS and supplier sheets', 'non-scientist': 'Reading what experts and suppliers have published' },
  'showcase.path': { scientist: 'Synthesis pathways — ranked composition routes', 'non-scientist': 'Sketching recipe ideas to try' },
  'output.title': { scientist: 'What you will get', 'non-scientist': 'What you will get' },
  'start.cta': { scientist: 'Start formulation', 'non-scientist': 'Start formulation' },
  'mode.toast': { scientist: 'Language switched to technical terms', 'non-scientist': 'Language switched to plain site terms' },
} satisfies Record<string, Record<Mode, string>>;

export type CopyKey = keyof typeof COPY;

export const USE_CASE_LABEL: Record<string, { scientist: string; 'non-scientist': string }> = {
  substrate: { scientist: 'Substrate', 'non-scientist': "What's behind it" },
  surfaces: { scientist: 'Surface', 'non-scientist': 'Where it goes' },
  materialType: { scientist: 'Tile or material type', 'non-scientist': 'What is being fixed' },
  size: { scientist: 'Tile / material size', 'non-scientist': 'Size' },
  exposure: { scientist: 'Interior or exterior', 'non-scientist': 'Inside or outside' },
  climate: { scientist: 'Climate', 'non-scientist': 'Weather' },
  appTemp: { scientist: 'Application temperature', 'non-scientist': 'Temperature when applying' },
  load: { scientist: 'Load and traffic', 'non-scientist': 'What moves on it' },
  method: { scientist: 'Application method', 'non-scientist': 'How it is applied' },
  timeToGroutH: { scientist: 'Time to grout', 'non-scientist': 'Ready for grout in' },
  timeToTrafficH: { scientist: 'Time to traffic', 'non-scientist': 'Ready to walk on in' },
  standardClass: { scientist: 'Standard class', 'non-scientist': 'Standard' },
};

export const BRAND = {
  name: 'helix',
  agentName: 'Helix · Formulation Agent',
  model: 'helix-form-2',
  org: 'Your organisation',
};
