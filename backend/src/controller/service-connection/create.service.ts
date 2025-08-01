import { Request, Response } from 'express';
import { asyncHandler, NotFoundError, ValidationError } from '../../utils/error-handler';
import { responseData } from '../../utils/response-handler';
import { createServiceConnectionSchema } from './validation/validation.service';
import { prisma } from '../../utils/prisma';
import { deleteFile, getUploadedFileInfo } from '../../config/upload-file';
import { generateUniqueIdPel } from '../../helper/random.idpel';

interface ServiceConnectionUploadedFiles {
    photos?: Express.Multer.File[];
}

export const createServiceConnection = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
        package_name,
        package_speed,
        ip_address,
        mac_address,
        notes,
        photos
    } = validationResult.data;

    const servicePhotoFiles = files.photos;

    // Validate photo count matches
    if (photos && servicePhotoFiles?.length !== photos.length) {
        throw new ValidationError('Jumlah foto tidak sesuai dengan file yang diupload');
    }

    // Setup cleanup for uploaded files if error occurs
    const cleanupFiles = async () => {
        if (servicePhotoFiles) {
            await Promise.all(servicePhotoFiles.map(file =>
                deleteFile(file.path).catch(err => console.error(err))
            ));
        }
    };

    try {
        // Verify customer exists and is not deleted
        const customer = await prisma.detso_Customer.findFirst({
            where: {
                id: customer_id,
                deleted_at: null
            }
        });

        if (!customer) {
            throw new NotFoundError('Customer tidak ditemukan atau telah dihapus');
        }

        // Verify package exists
        const packageExists = await prisma.detso_Package.findFirst({
            where: {
                id: package_id,
                deleted_at: null
            }
        });

        if (!packageExists) {
            throw new NotFoundError('Paket tidak ditemukan atau telah dihapus');
        }
        const idPel = await generateUniqueIdPel();
        // Create service connection in transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create service connection
            const serviceConnection = await tx.detso_Service_Connection.create({
                data: {
                    customer_id,
                    package_id,
                    id_pel: idPel,
                    address,
                    package_name,
                    package_speed,
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

            // 2. Upload service photos if any
            if (photos && servicePhotoFiles) {
                await Promise.all(photos.map(async (photo, index) => {
                    const file = servicePhotoFiles[index];
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