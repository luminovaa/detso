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
    public async initializeSession(tenant_id: string) {
        // Cegah double initialization
        if (this.initializingTenants.has(tenant_id)) {
            console.log(`[WA] Already initializing ${tenant_id}, skipping...`);
            return;
        }

        if (this.sessions.has(tenant_id)) {
            const session = this.sessions.get(tenant_id)!;
            if (session.status === 'READY') {
                console.log(`[WA] Session ${tenant_id} already READY`);
                return;
            }
        }

        this.initializingTenants.add(tenant_id);

        try {
            console.log(`[WA] Starting session for Tenant: ${tenant_id}`);

            // 1. Load Auth dari DB
            const { state, saveCreds } = await usePrismaAuthState(tenant_id);
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
            this.sessions.set(tenant_id, {
                sock,
                qr: null,
                status: 'CONNECTING'
            });

            // --- EVENT HANDLERS ---

            sock.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
                const { connection, lastDisconnect, qr } = update;
                
                const session = this.sessions.get(tenant_id);
                if (!session) return;

                console.log(`[WA] Connection update for ${tenant_id}:`, {
                    connection,
                    hasQR: !!qr,
                    reason: (lastDisconnect?.error as any)?.output?.statusCode
                });

                // A. QR Code Baru
                if (qr) {
                    console.log(`[WA] ✅ QR Generated for ${tenant_id}`);
                    session.qr = qr;
                    session.status = 'WAITING_QR';
                    this.emitToTenant(tenant_id, 'whatsapp-qr', qr);
                    this.emitToTenant(tenant_id, 'whatsapp-status', { status: 'waiting' });
                }

                // B. Terhubung (Ready)
                if (connection === 'open') {
                    console.log(`[WA] ✅ Connected & READY ${tenant_id}`);
                    session.status = 'READY';
                    session.qr = null;
                    this.emitToTenant(tenant_id, 'whatsapp-ready');
                    this.emitToTenant(tenant_id, 'whatsapp-status', { status: 'ready' });
                }

                // C. Terputus / Logout
                if (connection === 'close') {
                    const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
                    const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                    
                    console.log(`[WA] ⚠️ Connection closed ${tenant_id}. Code: ${statusCode}, Reconnect: ${shouldReconnect}`);

                    this.sessions.delete(tenant_id);
                    this.initializingTenants.delete(tenant_id);

                    if (shouldReconnect) {
                        // Reconnect dengan delay
                        console.log(`[WA] Reconnecting ${tenant_id} in 5s...`);
                        setTimeout(() => {
                            this.initializeSession(tenant_id);
                        }, 5000);
                    } else {
                        // Logout manual dari HP
                        console.log(`[WA] Logged out ${tenant_id}, clearing data...`);
                        await this.clearSessionData(tenant_id);
                        this.emitToTenant(tenant_id, 'whatsapp-disconnected');
                        this.emitToTenant(tenant_id, 'whatsapp-status', { status: 'disconnected' });
                    }
                }
            });

            sock.ev.on('creds.update', async () => {
                console.log(`[WA] Creds updated for ${tenant_id}`);
                await saveCreds();
            });

            // Tambahan: Handle messages received (opsional untuk logging)
            sock.ev.on('messages.upsert', (m) => {
                console.log(`[WA] Message received for ${tenant_id}:`, m.messages[0]?.key);
            });

        } catch (error) {
            console.error(`[WA] ❌ Error initializing session ${tenant_id}:`, error);
            this.sessions.delete(tenant_id);
            this.initializingTenants.delete(tenant_id);
            this.emitToTenant(tenant_id, 'whatsapp-error', { 
                message: error instanceof Error ? error.message : 'Unknown error' 
            });
            throw error;
        } finally {
            this.initializingTenants.delete(tenant_id);
        }
    }

    // --- ACTIONS ---

    public async sendMessage(tenant_id: string, phone: string, text: string) {
        const session = this.sessions.get(tenant_id);
        
        if (!session) {
            throw new Error('Session tidak ditemukan. Silakan hubungkan WhatsApp terlebih dahulu.');
        }

        if (session.status !== 'READY') {
            throw new Error(`WhatsApp belum siap. Status: ${session.status}`);
        }

        try {
            const jid = this.formatToJid(phone);
            console.log(`[WA] Sending message to ${jid} from ${tenant_id}`);
            
            await session.sock.sendMessage(jid, { text });
            console.log(`[WA] ✅ Message sent successfully`);
            return true;
        } catch (error) {
            console.error(`[WA] ❌ Error sending message:`, error);
            throw new Error(`Gagal mengirim pesan: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    public async logout(tenant_id: string) {
        const session = this.sessions.get(tenant_id);
        if (session) {
            try {
                console.log(`[WA] Logging out ${tenant_id}...`);
                await session.sock.logout();
            } catch (err) {
                console.error(`[WA] Error during logout:`, err);
            }
            await this.clearSessionData(tenant_id);
            this.emitToTenant(tenant_id, 'whatsapp-disconnected');
            this.emitToTenant(tenant_id, 'whatsapp-status', { status: 'disconnected' });
        }
    }

    public getStatus(tenant_id: string) {
        const session = this.sessions.get(tenant_id);
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
    public async hasStoredSession(tenant_id: string): Promise<boolean> {
        try {
            const count = await prisma.detso_Whatsapp_Session.count({
                where: { sessionId: tenant_id }
            });
            return count > 0;
        } catch (error) {
            console.error('[WA] Error checking stored session:', error);
            return false;
        }
    }

    // --- HELPERS ---

    private emitToTenant(tenant_id: string, event: string, data?: any) {
        console.log(`[WA] Emitting '${event}' to tenant:${tenant_id}`, data ? '(with data)' : '');
        this.io?.to(`tenant:${tenant_id}`).emit(event, data);
    }

    private async clearSessionData(tenant_id: string) {
        console.log(`[WA] Clearing session data for ${tenant_id}`);
        this.sessions.delete(tenant_id);
        this.initializingTenants.delete(tenant_id);
        
        try {
            await prisma.detso_Whatsapp_Session.deleteMany({
                where: { sessionId: tenant_id }
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