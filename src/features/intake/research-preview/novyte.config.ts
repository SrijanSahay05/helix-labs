/**
 * Novyte screenshots for the Research preview (brief: "Literature / Synthesis pathways showcase (Novyte screenshot)").
 * Drop the images in /public and set `src`; a "Live preview / Novyte" toggle then appears in each act header.
 * Callout positions are percentages of the screenshot (x from left, y from top).
 */
export interface NovyteCallout {
  n: number;
  x: number;
  y: number;
  caption: string;
}

export interface NovyteShot {
  src?: string;
  alt: string;
  callouts: NovyteCallout[];
}

export const NOVYTE: Record<'literature' | 'pathways', NovyteShot> = {
  literature: {
    src: undefined, // e.g. '/novyte/literature.png'
    alt: 'Novyte literature review screen',
    callouts: [
      { n: 1, x: 22, y: 30, caption: 'Sources grouped into clusters' },
      { n: 2, x: 74, y: 40, caption: 'Facts extracted with citations' },
      { n: 3, x: 50, y: 12, caption: 'The search query built from your brief' },
      { n: 4, x: 18, y: 82, caption: 'Source types: papers, patents, TDS, supplier sheets' },
      { n: 5, x: 80, y: 80, caption: 'Pin or exclude a source before the run' },
    ],
  },
  pathways: {
    src: undefined, // e.g. '/novyte/pathways.png'
    alt: 'Novyte synthesis pathways screen',
    callouts: [
      { n: 1, x: 20, y: 22, caption: 'Ranked composition routes' },
      { n: 2, x: 48, y: 46, caption: 'Dosage ranges for every ingredient' },
      { n: 3, x: 78, y: 34, caption: 'Predicted values against your targets' },
      { n: 4, x: 30, y: 78, caption: 'Cost per kg against the ceiling' },
      { n: 5, x: 76, y: 80, caption: 'Hazard flags and citations' },
    ],
  },
};
