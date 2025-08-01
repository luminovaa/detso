// utils/generate-idpel.ts

import { prisma } from "../utils/prisma";

/**
 * Generate unique ID PEL (Pelanggan) for service connection
 * Format: PEL-{YYYYMMDD}-{random 6 alphanumeric chars}
 */
export const generateUniqueIdPel = async (): Promise<string> => {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    let idPel = `IDDN-${datePart}-${randomPart}`;
    let attempts = 0;
    const maxAttempts = 5;

    // Check if ID PEL already exists
    while (attempts < maxAttempts) {
        const existing = await prisma.detso_Service_Connection.findFirst({
            where: {
                id_pel: idPel,
                deleted_at: null
            }
        });

        if (!existing) {
            return idPel;
        }

        // Regenerate if exists
        attempts++;
        const newRandomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
        idPel = `IDDN-${datePart}-${newRandomPart}`;
    }

    throw new Error('Gagal membuat ID PEL unik setelah beberapa percobaan');
};