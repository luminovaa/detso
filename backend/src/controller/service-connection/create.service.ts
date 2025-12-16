import { Request, Response } from 'express';
import { asyncHandler, NotFoundError, ValidationError, AuthenticationError } from '../../utils/error-handler'; // Tambah AuthenticationError
import { responseData } from '../../utils/response-handler';
import { createServiceConnectionSchema } from './validation/validation.service';
import { prisma } from '../../utils/prisma';
import { deleteFile, getUploadedFileInfo } from '../../config/upload-file';
import { generateUniqueIdPel } from '../../helper/random.idpel';

interface ServiceConnectionUploadedFiles {
    photos?: Express.Multer.File[];
}

export const createServiceConnection = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // [NEW] 1. Ambil tenant_id
    const user = req.user;
    if (!user || !user.tenantId) {
        throw new AuthenticationError('Sesi tidak valid atau Tenant ID tidak ditemukan');
    }
    const tenantId = user.tenantId;

    const files = req.files as ServiceConnectionUploadedFiles;
    
    const requestData = {
        ...req.body,
        photos: req.body.photos ? JSON.parse(req.body.photos) : []
    };

    // Validate input
    const validationResult = createServiceConnectionSchema.safeParse(requestData);
    if (!validationResult.success) {
        throw new ValidationError('Validasi gagal', validationResult.error.errors);
    }

    const {
        customer_id,
        package_id,
        address,
        // package_name, // Kita ignore input dari frontend, ambil dari DB biar aman
        // package_speed, // Kita ignore input dari frontend
        ip_address,
        mac_address,
        notes,
        photos
    } = validationResult.data;

    const servicePhotoFiles = files.photos;

    if (photos && servicePhotoFiles?.length !== photos.length) {
        throw new ValidationError('Jumlah foto tidak sesuai dengan file yang diupload');
    }

    const cleanupFiles = async () => {
        if (servicePhotoFiles) {
            await Promise.all(servicePhotoFiles.map(file =>
                deleteFile(file.path).catch(err => console.error(err))
            ));
        }
    };

    try {
        // [NEW] 2. Validasi Customer (Wajib milik Tenant ini)
        const customer = await prisma.detso_Customer.findFirst({
            where: {
                id: customer_id,
                tenant_id: tenantId, // <--- Filter Tenant
                deleted_at: null
            }
        });

        if (!customer) {
            throw new NotFoundError('Customer tidak ditemukan atau tidak terdaftar di ISP ini');
        }

        // [NEW] 3. Validasi Package (Wajib milik Tenant ini)
        const packageExists = await prisma.detso_Package.findFirst({
            where: {
                id: package_id,
                tenant_id: tenantId, // <--- Filter Tenant
                deleted_at: null
            }
        });

        if (!packageExists) {
            throw new NotFoundError('Paket tidak ditemukan atau tidak tersedia untuk ISP ini');
        }

        const idPel = await generateUniqueIdPel();

        // Create service connection in transaction
        const result = await prisma.$transaction(async (tx) => {
            // 4. Create Service dengan Data Terpercaya & Tenant ID
            const serviceConnection = await tx.detso_Service_Connection.create({
                data: {
                    tenant_id: tenantId, // <--- Inject Tenant ID
                    customer_id,
                    package_id,
                    id_pel: idPel,
                    address,
                    // [SECURITY] Ambil detail dari database paket, bukan dari input user
                    // Ini mencegah user mengedit harga/kecepatan via inspect element
                    package_name: packageExists.name,
                    package_speed: packageExists.speed,
                    package_price: packageExists.price, // Pastikan schema DB ada field ini
                    
                    ip_address,
                    mac_address,
                    notes,
                    created_at: new Date()
                },
                include: {
                    customer: {
                        select: {
                            id: true,
                            name: true,
                            phone: true
                        }
                    },
                    package: {
                        select: {
                            id: true,
                            name: true,
                            speed: true,
                            price: true
                        }
                    }
                }
            });

            // 5. Upload Photos (Sama seperti sebelumnya)
            if (photos && servicePhotoFiles) {
                await Promise.all(photos.map(async (photo, index) => {
                    const file = servicePhotoFiles[index];
                    if (file) { // Safety check
                        const fileInfo = getUploadedFileInfo(file, 'storage/image/customer/photos');
                        
                        await tx.detso_Service_Photo.create({
                            data: {
                                service_id: serviceConnection.id,
                                photo_type: photo.type,
                                photo_url: fileInfo.path,
                                uploaded_at: new Date(),
                                notes: photo.notes || null
                            }
                        });
                    }
                }));
            }

            return serviceConnection;
        });

        responseData(res, 201, 'Service connection berhasil dibuat', result);

    } catch (error) {
        await cleanupFiles();
        throw error;
    }
});