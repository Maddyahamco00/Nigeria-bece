// js shim for runtime + tests compatibility
// The real logger implementation lives in logger.ts.

// Runtime-safe logger shim.
// We intentionally avoid importing/reflecting TS at runtime to prevent Node ESM
// from attempting to load `.ts` files without a TS loader.

const logger = {
  debug: (...args) => console.debug(...args),
  info: (...args) => console.info(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
  http: (...args) => console.log(...args),
};

export const requestLogger = () => {};
export const securityLogger = {};
export const performanceLogger = {};
export const businessLogger = {};

export default logger;




