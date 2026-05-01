import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Custom format untuk log yang lebih readable
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Format untuk console (development)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Transport untuk error logs (rotate daily)
const errorFileTransport = new DailyRotateFile({
  filename: path.join(__dirname, '../../logs/error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '20m',
  maxFiles: '14d', // Keep logs for 14 days
  format: customFormat,
});

// Transport untuk combined logs (rotate daily)
const combinedFileTransport = new DailyRotateFile({
  filename: path.join(__dirname, '../../logs/combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: customFormat,
});

// Transport untuk HTTP access logs (rotate daily)
const httpFileTransport = new DailyRotateFile({
  filename: path.join(__dirname, '../../logs/http-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '7d', // Keep HTTP logs for 7 days
  format: customFormat,
});

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: customFormat,
  transports: [
    errorFileTransport,
    combinedFileTransport,
  ],
  // Don't exit on handled exceptions
  exitOnError: false,
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// Separate logger for HTTP requests
export const httpLogger = winston.createLogger({
  level: 'info',
  format: customFormat,
  transports: [httpFileTransport],
});

// Add console in development
if (process.env.NODE_ENV !== 'production') {
  httpLogger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// Helper functions untuk logging yang lebih mudah
export const log = {
  error: (message: string, meta?: any) => logger.error(message, meta),
  warn: (message: string, meta?: any) => logger.warn(message, meta),
  info: (message: string, meta?: any) => logger.info(message, meta),
  debug: (message: string, meta?: any) => logger.debug(message, meta),
  http: (message: string, meta?: any) => httpLogger.info(message, meta),
};

export default logger;
