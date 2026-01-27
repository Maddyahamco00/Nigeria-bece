import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }: any) => {
    return JSON.stringify({
      timestamp,
      level: level.toUpperCase(),
      message,
      ...meta
    });
  })
);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
winston.addColors({
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
});

// Create the logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format: logFormat,
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // Security events log
    new winston.transports.File({
      filename: path.join(logsDir, 'security.log'),
      level: 'warn',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
  ],
});

// Console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message, ...meta }: any) => {
        const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
        return `${timestamp} [${level}]: ${message}${metaStr}`;
      })
    )
  }));
}

// Request logging middleware
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http('Request completed', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id || 'anonymous'
    });
  });

  next();
};

// Security event logger
export const securityLogger = {
  loginAttempt: (email: string, success: boolean, ip: string) => {
    logger.warn('Login attempt', {
      event: 'LOGIN_ATTEMPT',
      email,
      success,
      ip,
      timestamp: new Date().toISOString()
    });
  },

  unauthorizedAccess: (userId: string | null, resource: string, ip: string) => {
    logger.warn('Unauthorized access attempt', {
      event: 'UNAUTHORIZED_ACCESS',
      userId,
      resource,
      ip,
      timestamp: new Date().toISOString()
    });
  },

  suspiciousActivity: (userId: string | null, activity: string, details: any) => {
    logger.warn('Suspicious activity detected', {
      event: 'SUSPICIOUS_ACTIVITY',
      userId,
      activity,
      details,
      timestamp: new Date().toISOString()
    });
  },

  paymentFraud: (reference: string, amount: number, reason: string) => {
    logger.error('Payment fraud detected', {
      event: 'PAYMENT_FRAUD',
      reference,
      amount,
      reason,
      timestamp: new Date().toISOString()
    });
  }
};

// Performance monitoring
export const performanceLogger = {
  slowQuery: (query: string, duration: number, params?: any) => {
    logger.warn('Slow database query detected', {
      event: 'SLOW_QUERY',
      query: query.substring(0, 500), // Truncate long queries
      duration: `${duration}ms`,
      params,
      threshold: '1000ms'
    });
  },

  memoryUsage: (usage: NodeJS.MemoryUsage) => {
    logger.info('Memory usage report', {
      event: 'MEMORY_USAGE',
      rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(usage.external / 1024 / 1024)}MB`
    });
  },

  apiResponseTime: (endpoint: string, method: string, duration: number) => {
    if (duration > 1000) { // Log slow API responses
      logger.warn('Slow API response', {
        event: 'SLOW_API_RESPONSE',
        endpoint,
        method,
        duration: `${duration}ms`
      });
    }
  }
};

// Business event logger
export const businessLogger = {
  studentRegistered: (studentId: string, schoolId: string) => {
    logger.info('Student registered', {
      event: 'STUDENT_REGISTERED',
      studentId,
      schoolId,
      timestamp: new Date().toISOString()
    });
  },

  paymentProcessed: (reference: string, amount: number, studentId: string) => {
    logger.info('Payment processed successfully', {
      event: 'PAYMENT_PROCESSED',
      reference,
      amount,
      studentId,
      timestamp: new Date().toISOString()
    });
  },

  resultPublished: (studentId: string, subjectCount: number) => {
    logger.info('Student results published', {
      event: 'RESULTS_PUBLISHED',
      studentId,
      subjectCount,
      timestamp: new Date().toISOString()
    });
  }
};

export default logger;