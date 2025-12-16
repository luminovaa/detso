import makeWASocket, { 
    DisconnectReason, 
    fetchLatestBaileysVersion,
    WASocket,
    ConnectionState,
    Browsers
} from '@whiskeysockets/baileys';
import { Server } from 'socket.io';
import pino from 'pino';
import { usePrismaAuthState } from '../utils/whatsapp-auth-prisma';
import { prisma } from '../utils/prisma';

interface Session {
    sock: WASocket;
    qr: string | null;
    status: 'CONNECTING' | 'WAITING_QR' | 'READY' | 'DISCONNECTED';
}

export class WhatsAppManager {
    private static instance: WhatsAppManager;
    private sessions: Map<string, Session> = new Map();
    private io?: Server;
    private initializingTenants: Set<string> = new Set(); // Prevent double init

    private constructor() {}

    public static getInstance(): WhatsAppManager {
        if (!WhatsAppManager.instance) {
            WhatsAppManager.instance = new WhatsAppManager();
        }
        return WhatsAppManager.instance;
    }

    public setSocketIO(io: Server) {
        this.io = io;
    }

    // --- INITIALIZE SESSION ---
    public async initializeSession(tenantId: string) {
        // Cegah double initialization
        if (this.initializingTenants.has(tenantId)) {
            console.log(`[WA] Already initializing ${tenantId}, skipping...`);
            return;
        }

        if (this.sessions.has(tenantId)) {
            const session = this.sessions.get(tenantId)!;
            if (session.status === 'READY') {
                console.log(`[WA] Session ${tenantId} already READY`);
                return;
            }
        }

        this.initializingTenants.add(tenantId);

        try {
            console.log(`[WA] Starting session for Tenant: ${tenantId}`);

            // 1. Load Auth dari DB
            const { state, saveCreds } = await usePrismaAuthState(tenantId);
            const { version } = await fetchLatestBaileysVersion();

            console.log(`[WA] Baileys version: ${version.join('.')}`);

            // 2. Buat Socket
            const sock = makeWASocket({
                version,
                auth: state,
                printQRInTerminal: true, // Untuk debug di console juga
                logger: pino({ level: 'error' }), // Ubah ke 'error' agar bisa lihat error
                browser: Browsers.ubuntu("Chrome"),
                syncFullHistory: false,
                connectTimeoutMs: 60000,
                qrTimeout: 60000,
                // Tambahan config untuk stability
                defaultQueryTimeoutMs: undefined,
                keepAliveIntervalMs: 30000,
                markOnlineOnConnect: true
            });

            // 3. Simpan di Memory Map
            this.sessions.set(tenantId, {
                sock,
                qr: null,
                status: 'CONNECTING'
            });

            // --- EVENT HANDLERS ---

            sock.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
                const { connection, lastDisconnect, qr } = update;
                
                const session = this.sessions.get(tenantId);
                if (!session) return;

                console.log(`[WA] Connection update for ${tenantId}:`, {
                    connection,
                    hasQR: !!qr,
                    reason: (lastDisconnect?.error as any)?.output?.statusCode
                });

                // A. QR Code Baru
                if (qr) {
                    console.log(`[WA] ✅ QR Generated for ${tenantId}`);
                    session.qr = qr;
                    session.status = 'WAITING_QR';
                    this.emitToTenant(tenantId, 'whatsapp-qr', qr);
                    this.emitToTenant(tenantId, 'whatsapp-status', { status: 'waiting' });
                }

                // B. Terhubung (Ready)
                if (connection === 'open') {
                    console.log(`[WA] ✅ Connected & READY ${tenantId}`);
                    session.status = 'READY';
                    session.qr = null;
                    this.emitToTenant(tenantId, 'whatsapp-ready');
                    this.emitToTenant(tenantId, 'whatsapp-status', { status: 'ready' });
                }

                // C. Terputus / Logout
                if (connection === 'close') {
                    const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
                    const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                    
                    console.log(`[WA] ⚠️ Connection closed ${tenantId}. Code: ${statusCode}, Reconnect: ${shouldReconnect}`);

                    this.sessions.delete(tenantId);
                    this.initializingTenants.delete(tenantId);

                    if (shouldReconnect) {
                        // Reconnect dengan delay
                        console.log(`[WA] Reconnecting ${tenantId} in 5s...`);
                        setTimeout(() => {
                            this.initializeSession(tenantId);
                        }, 5000);
                    } else {
                        // Logout manual dari HP
                        console.log(`[WA] Logged out ${tenantId}, clearing data...`);
                        await this.clearSessionData(tenantId);
                        this.emitToTenant(tenantId, 'whatsapp-disconnected');
                        this.emitToTenant(tenantId, 'whatsapp-status', { status: 'disconnected' });
                    }
                }
            });

            sock.ev.on('creds.update', async () => {
                console.log(`[WA] Creds updated for ${tenantId}`);
                await saveCreds();
            });

            // Tambahan: Handle messages received (opsional untuk logging)
            sock.ev.on('messages.upsert', (m) => {
                console.log(`[WA] Message received for ${tenantId}:`, m.messages[0]?.key);
            });

        } catch (error) {
            console.error(`[WA] ❌ Error initializing session ${tenantId}:`, error);
            this.sessions.delete(tenantId);
            this.initializingTenants.delete(tenantId);
            this.emitToTenant(tenantId, 'whatsapp-error', { 
                message: error instanceof Error ? error.message : 'Unknown error' 
            });
            throw error;
        } finally {
            this.initializingTenants.delete(tenantId);
        }
    }

    // --- ACTIONS ---

    public async sendMessage(tenantId: string, phone: string, text: string) {
        const session = this.sessions.get(tenantId);
        
        if (!session) {
            throw new Error('Session tidak ditemukan. Silakan hubungkan WhatsApp terlebih dahulu.');
        }

        if (session.status !== 'READY') {
            throw new Error(`WhatsApp belum siap. Status: ${session.status}`);
        }

        try {
            const jid = this.formatToJid(phone);
            console.log(`[WA] Sending message to ${jid} from ${tenantId}`);
            
            await session.sock.sendMessage(jid, { text });
            console.log(`[WA] ✅ Message sent successfully`);
            return true;
        } catch (error) {
            console.error(`[WA] ❌ Error sending message:`, error);
            throw new Error(`Gagal mengirim pesan: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    public async logout(tenantId: string) {
        const session = this.sessions.get(tenantId);
        if (session) {
            try {
                console.log(`[WA] Logging out ${tenantId}...`);
                await session.sock.logout();
            } catch (err) {
                console.error(`[WA] Error during logout:`, err);
            }
            await this.clearSessionData(tenantId);
            this.emitToTenant(tenantId, 'whatsapp-disconnected');
            this.emitToTenant(tenantId, 'whatsapp-status', { status: 'disconnected' });
        }
    }

    public getStatus(tenantId: string) {
        const session = this.sessions.get(tenantId);
        if (!session) {
            return { 
                status: 'DISCONNECTED', 
                qr: null 
            };
        }

        return { 
            status: session.status, 
            qr: session.qr 
        };
    }

    // Tambahan: Method untuk check apakah ada session tersimpan di DB
    public async hasStoredSession(tenantId: string): Promise<boolean> {
        try {
            const count = await prisma.detso_Whatsapp_Session.count({
                where: { sessionId: tenantId }
            });
            return count > 0;
        } catch (error) {
            console.error('[WA] Error checking stored session:', error);
            return false;
        }
    }

    // --- HELPERS ---

    private emitToTenant(tenantId: string, event: string, data?: any) {
        console.log(`[WA] Emitting '${event}' to tenant:${tenantId}`, data ? '(with data)' : '');
        this.io?.to(`tenant:${tenantId}`).emit(event, data);
    }

    private async clearSessionData(tenantId: string) {
        console.log(`[WA] Clearing session data for ${tenantId}`);
        this.sessions.delete(tenantId);
        this.initializingTenants.delete(tenantId);
        
        try {
            await prisma.detso_Whatsapp_Session.deleteMany({
                where: { sessionId: tenantId }
            });
            console.log(`[WA] ✅ Session data cleared from DB`);
        } catch (error) {
            console.error(`[WA] ❌ Error clearing session data:`, error);
        }
    }

    private formatToJid(phone: string) {
        let cleaned = phone.replace(/\D/g, '');
        if (cleaned.startsWith('0')) cleaned = '62' + cleaned.substring(1);
        if (!cleaned.startsWith('62')) cleaned = '62' + cleaned;
        return `${cleaned}@s.whatsapp.net`;
    }

    // Method untuk auto-start sessions yang sudah ada di DB
    public async autoStartStoredSessions() {
        try {
            console.log('[WA] Checking for stored sessions to auto-start...');
            
            // Ambil semua unique sessionId dari DB
            const sessions = await prisma.detso_Whatsapp_Session.findMany({
                where: {
                    id_key: 'creds' // Hanya yang punya creds = sudah pernah login
                },
                select: {
                    sessionId: true
                },
                distinct: ['sessionId']
            });

            console.log(`[WA] Found ${sessions.length} stored session(s)`);

            for (const { sessionId } of sessions) {
                console.log(`[WA] Auto-starting session: ${sessionId}`);
                // Delay sedikit agar tidak berebutan
                await new Promise(resolve => setTimeout(resolve, 2000));
                await this.initializeSession(sessionId);
            }
        } catch (error) {
            console.error('[WA] Error auto-starting sessions:', error);
        }
    }
}

export const whatsappManager = WhatsAppManager.getInstance();