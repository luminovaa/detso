import { 
    initAuthCreds, 
    BufferJSON, 
    proto, 
    AuthenticationCreds, 
    AuthenticationState,
    SignalDataTypeMap
} from '@whiskeysockets/baileys';
import { prisma } from './prisma';

export const usePrismaAuthState = async (sessionId: string): Promise<{ state: AuthenticationState, saveCreds: () => Promise<void> }> => {
    
    // 1. Fungsi Baca Data
    const readData = async (type: string, id?: string) => {
        const key = id ? `${type}-${id}` : type;
        try {
            const session = await prisma.detso_Whatsapp_Session.findUnique({
                where: {
                    sessionId_id_key: {
                        sessionId,
                        id_key: key
                    }
                }
            });
            
            if (session && session.data) {
                // Baileys menyimpan Buffer, database menyimpan JSON. Kita perlu revive Buffer.
                return JSON.parse(JSON.stringify(session.data), BufferJSON.reviver);
            }
            return null;
        } catch (error) {
            console.error('Error reading session DB:', error);
            return null;
        }
    };

    // 2. Fungsi Tulis Data
    const writeData = async (data: any, type: string, id?: string) => {
        const key = id ? `${type}-${id}` : type;
        // Konversi Buffer jadi JSON string aman
        const stringifiedData = JSON.parse(JSON.stringify(data, BufferJSON.replacer));

        try {
            await prisma.detso_Whatsapp_Session.upsert({
                where: {
                    sessionId_id_key: {
                        sessionId,
                        id_key: key
                    }
                },
                update: { data: stringifiedData },
                create: {
                    sessionId,
                    id_key: key,
                    data: stringifiedData
                }
            });
        } catch (error) {
            console.error('Error writing session DB:', error);
        }
    };

    // 3. Fungsi Hapus Data
    const removeData = async (type: string, id?: string) => {
        const key = id ? `${type}-${id}` : type;
        try {
            await prisma.detso_Whatsapp_Session.delete({
                where: {
                    sessionId_id_key: {
                        sessionId,
                        id_key: key
                    }
                }
            });
        } catch (error) {
            // Ignore if not found
        }
    };

    // 4. Inisialisasi Creds
    const creds: AuthenticationCreds = (await readData('creds')) || initAuthCreds();

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data: { [key: string]: any } = {};
                    await Promise.all(
                        ids.map(async (id) => {
                            let value = await readData(type, id);
                            if (type === 'app-state-sync-key' && value) {
                                value = proto.Message.AppStateSyncKeyData.fromObject(value);
                            }
                            data[id] = value;
                        })
                    );
                    return data;
                },
                set: async (data) => {
                    const tasks: Promise<void>[] = [];
                    for (const category in data) {
                        const categoryData = data[category as keyof typeof data] as any;
                        for (const id in categoryData) {
                            const value = categoryData[id];
                            if (value) {
                                tasks.push(writeData(value, category, id));
                            } else {
                                tasks.push(removeData(category, id));
                            }
                        }
                    }
                    await Promise.all(tasks);
                }
            }
        },
        saveCreds: async () => {
            await writeData(creds, 'creds');
        }
    };
};