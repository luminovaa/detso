import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import express, { NextFunction, Request, Response } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';

import routes from './src/router/routes';
import { handleError } from './src/utils/error-handler';
import { whatsappManager } from './src/services/whatsapp-manager';
import dotenv from 'dotenv';
dotenv.config();

const PORT = Number(process.env.PORT) || 6589;

const app = express();

// Middleware
app.use(express.json()); // Penting untuk parsing body JSON
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(helmet());

// [CONFIG] Static Files (Storage)
// Mengizinkan akses gambar profil/logo dengan header CORS yang benar
app.use('/storage', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
}, express.static(path.join(__dirname, 'storage')));

// [CONFIG] CORS
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || [];
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
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

// Routes
routes(app);

// Global Error Handler
app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(error);
  }
  handleError(error, res);
});

// --- SOCKET.IO SETUP ---
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// 1. Hubungkan IO ke Manager agar bisa emit event ke frontend
whatsappManager.setSocketIO(io);

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // [NEW] Logic Multi-Tenant
  // Client (Frontend) harus mengirim tenantId saat connect/mount page
  socket.on('join-tenant', (tenantId: string) => {
    if (!tenantId) return;

    // Masukkan socket ini ke room khusus tenant tersebut
    socket.join(`tenant:${tenantId}`);
    console.log(`Socket ${socket.id} joined room tenant:${tenantId}`);

    // [UX] Kirim status terkini langsung ke user yang baru join
    // Agar user tidak melihat loading terus menerus jika bot sudah ready
    const statusData = whatsappManager.getStatus(tenantId);
    
    // Kirim status
    if (statusData.status === 'READY') {
       socket.emit('whatsapp-ready');
    } else if (statusData.status === 'WAITING_QR' && statusData.qr) {
       socket.emit('whatsapp-qr', statusData.qr);
       socket.emit('whatsapp-status', { status: 'waiting' });
    } else if (statusData.status === 'CONNECTING') {
       socket.emit('whatsapp-status', { status: 'connecting' });
    } else {
       socket.emit('whatsapp-disconnected');
    }
  });

  // [NEW] Client meminta inisialisasi/start bot
  socket.on('start-whatsapp', async (tenantId: string) => {
    if (!tenantId) return;
    try {
      await whatsappManager.initializeSession(tenantId);
    } catch (error) {
      console.error('Error starting WhatsApp via socket:', error);
    }
  });

  // [NEW] Client meminta logout
  socket.on('logout-whatsapp', async (tenantId: string) => {
    if (!tenantId) return;
    try {
      await whatsappManager.logout(tenantId);
    } catch (error) {
      console.error('Error logout WhatsApp via socket:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

setTimeout(async () => {
  await whatsappManager.autoStartStoredSessions();
}, 3000);

// Start Server
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