/** Immutable set by dotted path, e.g. setIn(obj, 'useCase.size.w', 1200). */
export function setIn<T>(obj: T, path: string, value: unknown): T {
  const keys = path.split('.');
  const recur = (o: unknown, i: number): unknown => {
    const k = keys[i];
    const base = (o ?? {}) as Record<string, unknown>;
    const clone: Record<string, unknown> = Array.isArray(base) ? ([...base] as unknown as Record<string, unknown>) : { ...base };
    clone[k] = i === keys.length - 1 ? value : recur(base[k], i + 1);
    return clone;
  };
  return recur(obj, 0) as T;
}

export function getIn(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((o, k) => (o == null ? undefined : (o as Record<string, unknown>)[k]), obj);
}
