import type { StandardFamily } from '@/types';

export const STANDARD_FAMILIES: { id: StandardFamily; name: string; note: string }[] = [
  { id: 'IS', name: 'IS — Bureau of Indian Standards', note: 'e.g. IS 15477, IS 9103, IS 4031' },
  { id: 'EN', name: 'EN — European Norms', note: 'e.g. EN 12004, EN 1348, EN 1504' },
  { id: 'ASTM', name: 'ASTM International', note: 'e.g. ASTM C1583, ASTM C109' },
];

export const STANDARD_CLASSES = [
  'IS 15477 Type 1',
  'IS 15477 Type 2',
  'IS 15477 Type 4 T S2',
  'IS 15477 Type 5',
  'EN 12004 C1',
  'EN 12004 C2',
  'EN 12004 C2TE S1',
  'EN 12004 C2TE S2',
  'EN 1504-2',
  'EN 1504-3 R4',
  'IS 9103',
  'EN 13279-1 B4/50/2',
  'EN 13888 RG',
];

export const COMPLIANCE = ['Low VOC', 'No chlorides', 'REACH-like restricted list', 'Green building', 'Potable-water contact'];
export const MUST_HAVES = ['Works in heat', 'Low smell', 'White colour', 'Fast setting', 'Safe for drinking water', 'Easy to clean'];
