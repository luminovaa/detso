import dotenv from 'dotenv';
dotenv.config();

// Validate environment variables FIRST
import { validateEnv } from './src/config/env.config';
validateEnv();

import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './src/app';
import { log } from './src/config/logger.config';
import { cleanupExpiredTokens } from './src/controller/auth/get.auth';

const PORT = Number(process.env.PORT) || 6589;

// --- SOCKET.IO SETUP ---
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  log.info('Client connected', { socketId: socket.id });

  // Multi-Tenant: Client mengirim tenant_id saat connect
  socket.on('join-tenant', (tenant_id: string) => {
    if (!tenant_id) return;
    socket.join(`tenant:${tenant_id}`);
    log.info('Socket joined tenant room', { socketId: socket.id, tenantId: tenant_id });
  });

  socket.on('disconnect', () => {
    log.info('Client disconnected', { socketId: socket.id });
  });
});

// Start Server
const server = httpServer.listen(PORT, () => {
  const address = server.address();
  if (address) {
    if (typeof address === 'string') {
      log.info('Server started', { socket: address });
    } else {
      log.info('Server started', { 
        port: address.port, 
        environment: process.env.NODE_ENV 
      });
    }
  } else {
    log.info('Server started');
  }

  // Cleanup expired/revoked tokens on startup
  cleanupExpiredTokens().catch(err => 
    log.error('Initial token cleanup failed', { error: String(err) })
  );
});

// Schedule daily token cleanup (every 24 hours)
const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000;
setInterval(() => {
  cleanupExpiredTokens().catch(err =>
    log.error('Scheduled token cleanup failed', { error: String(err) })
  );
}, CLEANUP_INTERVAL);

server.on('error', (error: Error) => {
  log.error('Server startup error', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('SIGTERM', () => {
  log.info('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    log.info('Process terminated');
    process.exit(0);
  });
});