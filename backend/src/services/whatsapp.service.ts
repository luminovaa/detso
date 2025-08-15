import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import fs from 'fs';
import { Server } from 'socket.io';


export class WhatsAppService {
    private client: Client;
    private isReady: boolean = false;
    private static instance: WhatsAppService;
    private io?: Server;

    public setSocketIO(io: Server): void {
        this.io = io;
    }

    constructor() {
        this.client = new Client({
            authStrategy: new LocalAuth({
                clientId: "customer-service-bot",
                dataPath: "./whatsapp-auth" // Pastikan folder ini ada
            }),
            puppeteer: {
                headless: true,
                executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-gpu',
                    '--disable-extensions',
                    '--disable-software-rasterizer',
                    '--remote-debugging-port=9222'
                ]
            }


        });

        this.initializeClient();
    }

    public static getInstance(): WhatsAppService {
        if (!WhatsAppService.instance) {
            WhatsAppService.instance = new WhatsAppService();
        }
        return WhatsAppService.instance;
    }

    public static clearInstance(): void {
        if (WhatsAppService.instance) {
            WhatsAppService.instance.destroy();
            WhatsAppService.instance = undefined!;
        }
    }

    private initializeClient(): void {
        this.client.on('qr', (qr) => {
            console.log('QR Code received, scan please!');
            if (this.io) {
                this.io.emit('whatsapp-qr', qr);
            }

            qrcode.generate(qr, { small: true }, (code) => {
                console.log(code);
            });
        });

        this.client.on('ready', () => {
            console.log('WhatsApp Client is ready!');
            this.isReady = true;
            if (this.io) {
                this.io.emit('whatsapp-ready');
            }
        });

        this.client.on('disconnected', (reason) => {
            console.log('WhatsApp Client was logged out:', reason);
            this.isReady = false;
            if (this.io) {
                this.io.emit('whatsapp-disconnected', reason);
            }
        });


        this.client.on('authenticated', () => {
            console.log('WhatsApp Client authenticated!');
            if (this.io) {
                this.io.emit('whatsapp-authenticated');
            }
        });

        this.client.on('auth_failure', (msg) => {
            console.error('WhatsApp authentication failed:', msg);
            if (this.io) {
                this.io.emit('whatsapp-auth-failure', msg);
            }
        });



        // this.client.on('message', async (message) => {
        //     // Handle incoming messages if needed
        //     console.log('Received message:', message.body);
        // });

        this.client.initialize();
    }

    public async isClientReady(): Promise<boolean> {
        return this.isReady;
    }

    public async sendMessage(phoneNumber: string, message: string): Promise<boolean> {
        try {
            if (!this.isReady) {
                throw new Error('WhatsApp client is not ready');
            }

            const formattedNumber = this.formatPhoneNumber(phoneNumber);
            const chatId = `${formattedNumber}@c.us`;

            await this.client.sendMessage(chatId, message);
            console.log(`Message sent to ${phoneNumber}: ${message}`);
            return true;
        } catch (error) {
            console.error('Error sending WhatsApp message:', error);
            return false;
        }
    }

    public async sendDocument(
        phoneNumber: string,
        filePath: string,
        caption?: string,
        fileName?: string
    ): Promise<boolean> {
        try {
            if (!this.isReady) {
                throw new Error('WhatsApp client is not ready');
            }

            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }

            const formattedNumber = this.formatPhoneNumber(phoneNumber);
            const chatId = `${formattedNumber}@c.us`;

            const media = MessageMedia.fromFilePath(filePath);
            if (fileName) {
                media.filename = fileName;
            }

            await this.client.sendMessage(chatId, media, {
                caption: caption || ''
            });

            console.log(`Document sent to ${phoneNumber}: ${filePath}`);
            return true;
        } catch (error) {
            console.error('Error sending WhatsApp document:', error);
            return false;
        }
    }

    private formatPhoneNumber(phoneNumber: string): string {
        // Hapus semua karakter non-digit
        let cleaned = phoneNumber.replace(/\D/g, '');

        // Jika dimulai dengan 0, ganti dengan 62
        if (cleaned.startsWith('0')) {
            cleaned = '62' + cleaned.substring(1);
        }

        // Jika tidak dimulai dengan 62, tambahkan 62
        if (!cleaned.startsWith('62')) {
            cleaned = '62' + cleaned;
        }

        return cleaned;
    }

    public async destroy(): Promise<void> {
        try {
            if (this.isReady) {
                await this.client.logout();
            } else {
                await this.client.destroy();
            }

            this.isReady = false;

            const authPath = './whatsapp-auth';
            if (fs.existsSync(authPath)) {
                fs.rmSync(authPath, { recursive: true, force: true });
            }

            console.log('WhatsApp logged out and auth data cleared');
        } catch (error) {
            console.error('Error during logout/destroy:', error);
        }
    }
}

// Singleton instance
export const whatsappService = WhatsAppService.getInstance();