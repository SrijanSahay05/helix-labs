import type { Benchmark } from '@/types';
import { SCENARIOS } from './scenarios';

/** Benchmark library = every scenario's competitor products (placeholder makers). */
export const BENCHMARKS: Benchmark[] = SCENARIOS.flatMap((s) => s.benchmarks);
