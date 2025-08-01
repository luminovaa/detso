// config/whatsapp-init.ts
import { whatsappService } from '../services/whatsapp.service';

export const initializeWhatsApp = async (): Promise<void> => {
    try {
        console.log('Initializing WhatsApp service...');
        
        
        let retryCount = 0;
        const maxRetries = 60; // 5 menit (60 * 5 detik)
        
        while (retryCount < maxRetries) {
            const isReady = await whatsappService.isClientReady();
            if (isReady) {
                console.log('✅ WhatsApp service is ready!');
                return;
            }
            
            console.log(`⏳ Waiting for WhatsApp client to be ready... (${retryCount + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
            retryCount++;
        }
        
        console.warn('⚠️  WhatsApp client did not become ready within the timeout period');
        
    } catch (error) {
        console.error('❌ Error initializing WhatsApp service:', error);
    }
};

// Graceful shutdown handler
export const shutdownWhatsApp = async (): Promise<void> => {
    try {
        console.log('Shutting down WhatsApp service...');
        await whatsappService.destroy();
        console.log('WhatsApp service shut down successfully');
    } catch (error) {
        console.error('Error shutting down WhatsApp service:', error);
    }
};