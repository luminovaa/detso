import { Server } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import express, { NextFunction, Request, Response } from 'express';
import routes from './src/router/routes';
import { handleError } from './src/utils/error-handler';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { whatsappService } from './src/services/whatsapp.service';

const PORT: number = parseInt(process.env.PORT || '0');

const app = express();
app.use(cookieParser());

app.use(helmet());
app.use('/storage', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
}, express.static('storage'))

const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || [];
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
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

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
  });

});

app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(error);
  }
  handleError(error, res);
});

routes(app);

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || '*',
    methods: ['GET', 'POST']
  }
});
whatsappService.setSocketIO(io);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('get-whatsapp-status', async () => {
    try {
      const isReady = await whatsappService.isClientReady();
      socket.emit('whatsapp-status', { isReady });
      console.log('WhatsApp status sent:', { isReady });
    } catch (error) {
      console.error('Error getting WhatsApp status:', error);
      socket.emit('whatsapp-status', { isReady: false });
    }
  });

  socket.on('reconnect-whatsapp', async () => {
    try {
      const isReady = await whatsappService.isClientReady();
      socket.emit('whatsapp-status', { isReady });
    } catch (error) {
      console.error('Error reconnecting WhatsApp:', error);
      socket.emit('whatsapp-status', { isReady: false });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});
const server = httpServer.listen(PORT, () => {
  const address = server.address();

  if (address) {
    if (typeof address === 'string') {
      console.log(`Server is running on socket: ${address}`);
    } else {
      console.log(`Server is running on port: ${address.port}`);
    }
  } else {
    console.log('Server is running');
  }
});

server.on('error', (error: Error) => {
  console.error('Server startup error:', error);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});