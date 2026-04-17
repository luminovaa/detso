import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './src/app';
// import { whatsappManager } from './src/services/whatsapp-manager';

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

// 1. Hubungkan IO ke Manager agar bisa emit event ke frontend (Currently commented)
// whatsappManager.setSocketIO(io);

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // [NEW] Logic Multi-Tenant
  // Client (Frontend) harus mengirim tenant_id saat connect/mount page
  socket.on('join-tenant', (tenant_id: string) => {
    if (!tenant_id) return;

    // Masukkan socket ini ke room khusus tenant tersebut
    socket.join(`tenant:${tenant_id}`);
    console.log(`Socket ${socket.id} joined room tenant:${tenant_id}`);

    // [UX] Kirim status terkini langsung ke user yang baru join (Currently commented)
    /*
    const statusData = whatsappManager.getStatus(tenant_id);
    
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
    */
  });

  // [NEW] Client meminta inisialisasi/start bot (Currently commented)
  /*
  socket.on('start-whatsapp', async (tenant_id: string) => {
    if (!tenant_id) return;
    try {
      await whatsappManager.initializeSession(tenant_id);
    } catch (error) {
      console.error('Error starting WhatsApp via socket:', error);
    }
  });
  */

  // [NEW] Client meminta logout (Currently commented)
  /*
  socket.on('logout-whatsapp', async (tenant_id: string) => {
    if (!tenant_id) return;
    try {
      await whatsappManager.logout(tenant_id);
    } catch (error) {
      console.error('Error logout WhatsApp via socket:', error);
    }
  });
  */

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

/*
setTimeout(async () => {
  await whatsappManager.autoStartStoredSessions();
}, 3000);
*/

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