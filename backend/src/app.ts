import express, { Express, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import routes from './router/routes';
import { handleError } from './utils/error-handler';
import { requestLogger, logRequestBody, logResponseBody } from './middleware/logger.middleware';
import { apiLimiter } from './middleware/rate-limit.middleware';
import { log } from './config/logger.config';

const app: Express = express();

// ==========================================
// 1. LOGGING MIDDLEWARE (First)
// ==========================================
app.use(requestLogger); // HTTP request logging

// ==========================================
// 2. SECURITY MIDDLEWARE
// ==========================================
app.use(helmet()); // Security headers

// ==========================================
// 3. BODY PARSING MIDDLEWARE
// ==========================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ==========================================
// 4. DEVELOPMENT LOGGING (Optional)
// ==========================================
if (process.env.NODE_ENV === 'development') {
  app.use(logRequestBody);
  app.use(logResponseBody);
}

// ==========================================
// 5. STATIC FILES (Storage)
// ==========================================
app.use('/storage', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
}, express.static(path.join(__dirname, '../storage')));

// ==========================================
// 6. CORS CONFIGURATION
// ==========================================
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || [];
    
    // Allow requests with no origin only in development (Postman, mobile apps, etc.)
    if (!origin) {
      if (process.env.NODE_ENV === 'production') {
        return callback(new Error('Origin header required'));
      }
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      log.warn('CORS blocked request', { origin, allowedOrigins });
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ==========================================
// 7. RATE LIMITING (Global)
// ==========================================
app.use('/api', apiLimiter);

// ==========================================
// 8. ROUTES
// ==========================================
routes(app);

// ==========================================
// 9. GLOBAL ERROR HANDLER
// ==========================================
app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(error);
  }
  
  // Log error
  if (error instanceof Error) {
    log.error('Request error', {
      message: error.message,
      stack: error.stack,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userId: req.user?.id,
    });
  }
  
  handleError(error, res);
});

export default app;
