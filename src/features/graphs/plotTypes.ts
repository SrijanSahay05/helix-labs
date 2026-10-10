/* Plotly figures are built dynamically; @types/plotly.js unions are too narrow for that, so figures use loose types. */
/* eslint-disable @typescript-eslint/no-explicit-any */
export type Data = Record<string, any>;
export type Layout = Record<string, any>;
