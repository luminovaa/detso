import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

export class WebSocketService {
    private io: SocketIOServer;
    private static instance: WebSocketService;

    constructor(server: HTTPServer) {
        this.io = new SocketIOServer(server, {
            cors: {
                origin: process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || ['http://localhost:3000'],
                methods: ['GET', 'POST'],
                credentials: true
            }
        });

        this.initializeSocket();
    }

    public static getInstance(server?: HTTPServer): WebSocketService {
        if (!WebSocketService.instance && server) {
            WebSocketService.instance = new WebSocketService(server);
        }
        return WebSocketService.instance;
    }

    private initializeSocket(): void {
        this.io.on('connection', (socket: Socket) => {
            console.log('Client connected:', socket.id);

            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });

            // Join WhatsApp room untuk menerima update QR
            socket.on('join-whatsapp', () => {
                socket.join('whatsapp-updates');
                console.log('Client joined WhatsApp updates room:', socket.id);
            });

            // Leave WhatsApp room
            socket.on('leave-whatsapp', () => {
                socket.leave('whatsapp-updates');
                console.log('Client left WhatsApp updates room:', socket.id);
            });
        });
    }

    // Emit QR code ke semua client yang join room whatsapp-updates
    public emitQRCode(qrCode: string): void {
        this.io.to('whatsapp-updates').emit('qr-code', {
            qrCode,
            timestamp: new Date().toISOString()
        });
    }

    // Emit WhatsApp status changes
    public emitWhatsAppStatus(status: 'ready' | 'disconnected' | 'authenticated' | 'auth_failure', message?: string): void {
        this.io.to('whatsapp-updates').emit('whatsapp-status', {
            status,
            message,
            timestamp: new Date().toISOString()
        });
    }

    // Emit general messages
    public emitMessage(event: string, data: any): void {
        this.io.to('whatsapp-updates').emit(event, {
            ...data,
            timestamp: new Date().toISOString()
        });
    }

    public getIO(): SocketIOServer {
        return this.io;
    }
}
