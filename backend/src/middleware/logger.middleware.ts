import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import { httpLogger } from '../config/logger.config';

// Custom token untuk mendapatkan user ID dari request
morgan.token('user-id', (req: Request) => {
  return req.user?.id || 'anonymous';
});

morgan.token('tenant-id', (req: Request) => {
  return req.user?.tenant_id || 'none';
});

// Custom format untuk HTTP logging
const morganFormat = process.env.NODE_ENV === 'production'
  ? ':remote-addr - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms - tenant: :tenant-id'
  : ':method :url :status :response-time ms - :res[content-length] - user: :user-id - tenant: :tenant-id';

// Stream untuk mengirim log ke Winston
const stream = {
  write: (message: string) => {
    httpLogger.info(message.trim());
  },
};

// Morgan middleware
export const requestLogger = morgan(morganFormat, { stream });

// Middleware untuk log request body (hanya di development)
export const logRequestBody = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'development' && req.body && Object.keys(req.body).length > 0) {
    // Filter sensitive data
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = '***REDACTED***';
    if (sanitizedBody.refreshToken) sanitizedBody.refreshToken = '***REDACTED***';
    
    httpLogger.debug('Request Body:', {
      method: req.method,
      url: req.url,
      body: sanitizedBody,
    });
  }
  next();
};

// Middleware untuk log response body (hanya di development untuk debugging)
export const logResponseBody = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'development') {
    const originalSend = res.send;
    
    res.send = function (data: any): Response {
      // Log response untuk debugging (hanya error responses)
      if (res.statusCode >= 400) {
        httpLogger.debug('Response Body:', {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          body: typeof data === 'string' ? data.substring(0, 500) : data,
        });
      }
      
      return originalSend.call(this, data);
    };
  }
  next();
};
