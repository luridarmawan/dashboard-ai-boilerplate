// logs.ts
type ConsoleFn = (...args: any[]) => void;

const toBool = (v: unknown): boolean => {
  if (typeof v === 'boolean') return v;
  if (v == null) return false;
  const s = String(v).trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'yes' || s === 'on';
};

// Baca dari Vite (browser) atau Node (SSR/test)
const rawDebug =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_APP_DEBUG) ??
  (typeof process !== 'undefined' && (process as any).env?.VITE_APP_DEBUG);

const isDebug = toBool(rawDebug);

// logs → turunan console.log
export const logs: ConsoleFn = isDebug
  ? console.log.bind(console)
  : (() => {}) as ConsoleFn;

// errors → turunan console.error
export const errors: ConsoleFn = isDebug
  ? console.error.bind(console)
  : (() => {}) as ConsoleFn;

export default { logs, errors };
