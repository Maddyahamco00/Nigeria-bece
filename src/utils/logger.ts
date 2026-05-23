import winston from 'winston';

// NOTE:
// Runtime entrypoint for the app must never import TypeScript directly
// under Node ESM without a TS loader. This file is kept for type/IDE use
// only in this repo.
//
// The real runtime logger is implemented in `../utils/logger.js`.

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [new winston.transports.Console()],
});

export const requestLogger = (req: any, res: any, next: any) => next();
export const securityLogger = {};
export const performanceLogger = {};
export const businessLogger = {};

export default logger;

