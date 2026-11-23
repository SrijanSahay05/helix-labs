import type { ResearchPack } from '../research';
import { TILE_PACK } from './tile';
import { TILE_WHITE_S1_PACK } from './tileWhiteS1';

/**
 * Hand-written Research preview data, keyed by scenario id. Scenarios without a pack get generated research.
 * To add a demo: add a Scenario in src/data/scenarios, then a pack here under the same id.
 */
export const RESEARCH_PACKS: Record<string, ResearchPack> = {
  tile: TILE_PACK,
  'tile-white-s1': TILE_WHITE_S1_PACK,
};
