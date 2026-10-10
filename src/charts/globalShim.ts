// Plotly's CommonJS sources reference Node's `global`; alias it before they evaluate.
const g = globalThis as typeof globalThis & { global?: typeof globalThis };
g.global ??= globalThis;
export {};
