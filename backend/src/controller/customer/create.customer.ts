import { Request, Response } from 'express';
import { asyncHandler, NotFoundError, ValidationError, AuthenticationError } from '../../utils/error-handler';
import { responseData } from '../../utils/response-handler';
import { createCustomerSchema } from './validation/validation.customer';
import { prisma } from '../../utils/prisma';
import { deleteFile, getUploadedFileInfo } from '../../config/upload-file';
import { generateUniqueIdPel } from '../../helper/random.idpel';
import { PDFGeneratorService } from '../../services/generate.service.pdf';
import { whatsappService } from '../../services/whatsapp.service';

interface CustomerUploadedFiles {
    documents?: Express.Multer.File[];
    photos?: Express.Multer.File[];
}

export const createCustomer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // [NEW] 1. Ambil tenant_id dari user yang login
    const user = req.user;
    if (!user || !user.tenant_id!) {
        throw new AuthenticationError('Sesi tidak valid atau Tenant ID tidak ditemukan');
    }
    const tenantId = user.tenant_id!;

    const files = req.files as CustomerUploadedFiles;

    const requestData = {
        ...req.body,
        documents: req.body.documents ? JSON.parse(req.body.documents) : [],
        photos: req.body.photos ? JSON.parse(req.body.photos) : []
    };

    // Validasi Input (Zod Schema tidak perlu berubah)
    const validationResult = createCustomerSchema.safeParse(requestData);
    if (!validationResult.success) {
        throw new ValidationError('Validasi gagal', validationResult.error.errors);
    }

    const {
        name, phone, email, nik, package_id, address, address_service,
        ip_address, lat, long, mac_address, birth_date, birth_place,
        notes, documents, photos
    } = validationResult.data;

    const documentFiles = files.documents;
    const servicePhotoFiles = files.photos;

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
        const result = await prisma.$transaction(async (tx) => {
            let customer;

            // [NEW] 2. Cek customer hanya di dalam tenant ini
            const existingCustomer = await tx.detso_Customer.findFirst({
                where: {
                    nik,
                    tenant_id: tenantId, // Wajib filter by tenant
                    deleted_at: null
                }
            });

            if (existingCustomer) {
                customer = existingCustomer;
            } else {
                // [NEW] 3. Create Customer dengan tenant_id
                customer = await tx.detso_Customer.create({
                    data: {
                        tenant_id: tenantId, // Link ke tenant
                        name,
                        phone,
                        email,
                        birth_date,
                        birth_place,
                        address,
                        nik,
                        created_at: new Date()
                    }
                });
            }

            // [NEW] 4. Validasi Paket (Pastikan paket milik tenant ini)
            // Gunakan findFirst dengan filter tenant_id, bukan findUnique
            const packageData = await tx.detso_Package.findFirst({
                where: {
                    id: package_id,
                    tenant_id: tenantId, // Security check: Paket harus milik ISP ini
                    deleted_at: null
                }
            });

            if (!packageData) {
                throw new NotFoundError('Paket tidak ditemukan atau tidak tersedia untuk ISP ini');
            }

            const idPel = await generateUniqueIdPel();

            // [NEW] 5. Create Service Connection dengan tenant_id
            const serviceConnection = await tx.detso_Service_Connection.create({
                data: {
                    tenant_id: tenantId, // Link ke tenant
                    customer_id: customer.id,
                    id_pel: idPel,
                    package_id,
                    address: address_service,
                    package_name: packageData.name,
                    package_price: packageData.price,
                    lat,
                    long,
                    package_speed: packageData.speed,
                    ip_address,
                    mac_address,
                    notes,
                    created_at: new Date()
                }
            });

            // Upload documents (Code tetap sama, relasi ke customer sudah aman)
            const createdDocuments = [];
            if (documents && documentFiles) {
                for (let index = 0; index < documents.length; index++) {
                    const doc = documents[index];
                    const file = documentFiles[index];
                    if (file) { // Safety check
                        const fileInfo = getUploadedFileInfo(file, 'storage/image/customer/documents');
                        const createdDoc = await tx.detso_Customer_Document.create({
                            data: {
                                customer_id: customer.id,
                                document_type: doc.type,
                                document_url: fileInfo.path,
                                uploaded_at: new Date()
                            }
                        });
                        createdDocuments.push(createdDoc);
                    }
                }
            }

            // Upload photos (Code tetap sama)
            const createdPhotos = [];
            if (photos && servicePhotoFiles) {
                for (let index = 0; index < photos.length; index++) {
                    const photo = photos[index];
                    const file = servicePhotoFiles[index];
                    if (file) {
                        const fileInfo = getUploadedFileInfo(file, 'storage/image/customer/photos');
                        const createdPhoto = await tx.detso_Service_Photo.create({
                            data: {
                                service_id: serviceConnection.id,
                                photo_type: photo.type,
                                photo_url: fileInfo.path,
                                uploaded_at: new Date()
                            }
                        });
                        createdPhotos.push(createdPhoto);
                    }
                }
            }

            return { customer, serviceConnection, createdDocuments, createdPhotos, idPel };
        });

        // --- Bagian PDF & WhatsApp (Logic tetap sama) ---
        // Catatan: Di tahap lanjut, kamu mungkin perlu setting WhatsApp credential per Tenant.
        // Untuk sekarang, kita asumsikan pakai gateway global dulu.

        let pdfPath = null;
        let whatsappSent = false;

        try {
            const pdfGenerator = new PDFGeneratorService();
            pdfPath = await pdfGenerator.generateInstallationReport({
                customer: result.customer,
                serviceConnection: result.serviceConnection,
                documents: result.createdDocuments,
                photos: result.createdPhotos
            });

            await prisma.detso_Customer_PDF.create({
                data: {
                    customer_id: result.customer.id,
                    service_connection_id: result.serviceConnection.id,
                    pdf_type: 'installation_report',
                    pdf_path: pdfPath,
                    generated_at: new Date()
                }
            });

            // Kirim WA (Logic sama persis seperti kodemu)
            if (pdfPath) {
                const isWhatsAppReady = await whatsappService.isClientReady();
                if (isWhatsAppReady && phone) {
                    const textMessage = `Halo ${name}! 👋\n\nSelamat! Instalasi internet Anda telah berhasil diselesaikan.\n\n📋 Detail Layanan:\n• ID Pelanggan: ${result.idPel}\n• Paket: ${result.serviceConnection.package_name}\n• Kecepatan: ${result.serviceConnection.package_speed}\n• Alamat: ${address}\n\nTerimakasih!`;

                    await whatsappService.sendMessage(phone, textMessage);

                    const fileName = `Laporan_Instalasi_${result.idPel}.pdf`;
                    const caption = `📄 Laporan Instalasi Internet`;

                    whatsappSent = await whatsappService.sendDocument(phone, pdfPath, caption, fileName);

                    if (whatsappSent) {
                        await prisma.detso_WhatsApp_Log.create({
                            data: {
                                customer_id: result.customer.id,
                                phone_number: phone,
                                message_type: 'installation_report',
                                status: 'sent',
                                sent_at: new Date()
                            }
                        });
                    }
                }
            }
        } catch (pdfError) {
            console.error('Error generating/sending PDF:', pdfError);
        }

        responseData(res, 201, 'Customer dan service connection berhasil dibuat', {
            customer: result.customer,
            serviceConnection: result.serviceConnection,
            pdfGenerated: pdfPath !== null,
            pdfPath: pdfPath,
            whatsappSent: whatsappSent,
            idPel: result.idPel
        });

    } catch (error) {
        await cleanupFiles();
        throw error;
    }
});