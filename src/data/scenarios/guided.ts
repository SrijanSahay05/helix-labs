import type { UseCase } from '@/types';
import type { GuidedQuestion } from './types';

/** Guided questions shared by most scenarios; answers map to UseCase fields. */
export const COMMON_GUIDED: GuidedQuestion[] = [
  { id: 'wet', q: 'Will it get wet often?', picture: 'CloudRain', answer: 1, options: [
    { label: 'Bathroom / kitchen', icon: 'ShowerHead', sets: { surfaces: ['Wall', 'Wet area'] } },
    { label: 'Rain on outside walls', icon: 'CloudRain', sets: { surfaces: ['Wall', 'Facade'] } },
    { label: 'Pool / tank — always under water', icon: 'WavesHorizontal', sets: { surfaces: ['Submerged'] } },
    { label: 'Stays dry', icon: 'Sun', sets: { surfaces: ['Wall'] } },
  ] },
  { id: 'heat', q: 'How hot does it get on site?', picture: 'ThermometerSun', answer: 1, options: [
    { label: 'Mild (up to 30 °C)', icon: 'Cloud', sets: { climate: 'Composite', appTemp: [10, 30] } },
    { label: 'Hot and humid (up to 40 °C)', icon: 'CloudSun', sets: { climate: 'Hot-humid', appTemp: [10, 40] } },
    { label: 'Very hot and dry (above 40 °C)', icon: 'Sun', sets: { climate: 'Hot-dry', appTemp: [15, 45] } },
  ] },
  { id: 'traffic', q: 'Do people or vehicles move on it?', picture: 'Footprints', answer: 0, options: [
    { label: 'No — it is a wall', icon: 'BrickWall', sets: { load: 'None' } },
    { label: 'People walking', icon: 'Footprints', sets: { load: 'Light foot' } },
    { label: 'Cars or forklifts', icon: 'Truck', sets: { load: 'Light vehicular' } },
  ] },
  { id: 'speed', q: 'How soon must it be ready?', picture: 'Timer', answer: 1, options: [
    { label: 'Same day', icon: 'Zap', sets: { timeToGroutH: 4, timeToTrafficH: 6 } },
    { label: 'Next day', icon: 'CalendarClock', sets: { timeToGroutH: 24, timeToTrafficH: 0 } },
    { label: 'No rush', icon: 'Hourglass', sets: { timeToGroutH: 48, timeToTrafficH: 0 } },
  ] },
];

/** "How soon must it be ready?" for products whose readiness is one field (traffic, service…), not tile grouting. */
export const speedQuestion = (key: keyof UseCase): GuidedQuestion => ({ id: 'speed', q: 'How soon must it be ready?', picture: 'Timer', answer: 1, options: [
  { label: 'Same day', icon: 'Zap', sets: { [key]: 6 } },
  { label: 'Next day', icon: 'CalendarClock', sets: { [key]: 24 } },
  { label: 'No rush', icon: 'Hourglass', sets: { [key]: 72 } },
] });
