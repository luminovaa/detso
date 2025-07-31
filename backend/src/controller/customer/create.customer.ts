import { Request, Response } from 'express';
import { asyncHandler, NotFoundError, ValidationError } from '../../utils/error-handler';
import { responseData } from '../../utils/response-handler';
import { createCustomerSchema } from './validation/validation.customer';
import { prisma } from '../../utils/prisma';
import { deleteFile, getUploadedFileInfo } from '../../config/upload-file';

interface CustomerUploadedFiles {
    documents?: Express.Multer.File[];
    photos?: Express.Multer.File[];
}

export const createCustomer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // Gabungkan body dan files untuk validasi

    const files = req.files as CustomerUploadedFiles;

    const requestData = {
        ...req.body,
        documents: req.body.documents ? JSON.parse(req.body.documents) : [],
        photos: req.body.photos ? JSON.parse(req.body.photos) : []
    };

    const validationResult = createCustomerSchema.safeParse(requestData);
    if (!validationResult.success) {
        throw new ValidationError('Validasi gagal', validationResult.error.errors);
    }

    const {
        name,
        phone,
        email,
        nik,
        package_id,
        address,
        package_name,
        package_speed,
        ip_address,
        mac_address,
        notes,
        documents, // Array dari { type: string }
        photos     // Array dari { type: string }
    } = validationResult.data;

    const documentFiles = files.documents;
    const servicePhotoFiles = files.photos;

    if (documents && documentFiles?.length !== documents.length) {
        throw new ValidationError('Jumlah dokumen tidak sesuai dengan file yang diupload');
    }

    if (photos && servicePhotoFiles?.length !== photos.length) {
        throw new ValidationError('Jumlah foto tidak sesuai dengan file yang diupload');
    }

    const cleanupFiles = async () => {
        if (documentFiles) {
            await Promise.all(documentFiles.map(file =>
                deleteFile(file.path).catch(err => console.error(err))
            ));
        }
        if (servicePhotoFiles) {
            await Promise.all(servicePhotoFiles.map(file =>
                deleteFile(file.path).catch(err => console.error(err))
            ));
        }
    };

    try {

        const existingCustomer = await prisma.detso_Customer.findFirst({
            where: {
                nik,
                deleted_at: null // Hanya cek yang belum dihapus
            }
        });

        if (existingCustomer) {
            throw new ValidationError('NIK sudah terdaftar. Tidak boleh duplikat.');
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Buat customer
            const customer = await tx.detso_Customer.create({
                data: {
                    name,
                    phone,
                    email,
                    nik,
                    created_at: new Date()
                }
            });

            // 2. Buat service connection
            const serviceConnection = await tx.detso_Service_Connection.create({
                data: {
                    customer_id: customer.id,
                    package_id,
                    address,
                    package_name,
                    package_speed,
                    ip_address,
                    mac_address,
                    notes,
                    created_at: new Date()
                }
            });

            // 3. Upload dokumen customer
            if (documents && documentFiles) {
                await Promise.all(documents.map(async (doc, index) => {
                    const file = documentFiles[index];
                    const fileInfo = getUploadedFileInfo(file, 'image/customer/documents');
                    await tx.detso_Customer_Document.create({
                        data: {
                            customer_id: customer.id,
                            document_type: doc.type, // Ambil dari input
                            document_url: fileInfo.path,
                            uploaded_at: new Date()
                        }
                    });
                }));
            }

            // 4. Upload foto service connection
            if (photos && servicePhotoFiles) {
                await Promise.all(photos.map(async (photo, index) => {
                    const file = servicePhotoFiles[index];
                    const fileInfo = getUploadedFileInfo(file, 'image/customer/photos');
                    await tx.detso_Service_Photo.create({
                        data: {
                            service_id: serviceConnection.id,
                            photo_type: photo.type, // Ambil dari input
                            photo_url: fileInfo.path,
                            uploaded_at: new Date()
                        }
                    });
                }));
            }

            return { customer, serviceConnection };
        });

        responseData(res, 201, 'Customer dan service connection berhasil dibuat', {
            customer: result.customer,
            serviceConnection: result.serviceConnection
        });

    } catch (error) {
        await cleanupFiles();
        throw error;
    }
});