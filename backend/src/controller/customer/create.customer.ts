import { Request, Response } from 'express';
import { Detso_Role } from '@prisma/client';
import { asyncHandler, NotFoundError, ValidationError, AuthenticationError } from '../../utils/error-handler';
import { responseData } from '../../utils/response-handler';
import { createCustomerSchema } from './validation/validation.customer';
import { prisma } from '../../utils/prisma';
import { deleteFile, getUploadedFileInfo } from '../../config/upload-file';
import { generateUniqueIdPel } from '../../helper/random.idpel';
import { PDFGeneratorService } from '../../services/generate.service.pdf';
import { generateFullUrl } from '../../utils/generate-full-url';
import { trimOrNull } from '../../utils/request.utils';

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
    const tenant_id = user.tenant_id!;

    const files = req.files as CustomerUploadedFiles;
    const documentFiles = files?.documents;
    const servicePhotoFiles = files?.photos;

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
        let parsedDocuments = [];
        let parsedPhotos = [];
        try {
            parsedDocuments = req.body.documents ? JSON.parse(req.body.documents) : [];
            parsedPhotos = req.body.photos ? JSON.parse(req.body.photos) : [];
        } catch {
            throw new ValidationError('Format JSON dokumen atau foto tidak valid');
        }

        const requestData = {
            ...req.body,
            documents: parsedDocuments,
            photos: parsedPhotos
        };

        // Validasi Input
        const validationResult = createCustomerSchema.safeParse(requestData);
        if (!validationResult.success) {
            throw new ValidationError('Validasi gagal', validationResult.error.issues);
        }

        const {
            name, phone, email, nik, package_id, address, address_service,
            ip_address, lat, long, mac_address, birth_date, birth_place,
            notes, documents, photos, odp_id,
        } = validationResult.data;

        const normalizedPackageId = package_id?.trim() || '';
        const hasUploadedPhotos = Boolean((servicePhotoFiles && servicePhotoFiles.length > 0) || (photos && photos.length > 0));
        if (!normalizedPackageId && hasUploadedPhotos) {
            throw new ValidationError('Pilih paket layanan terlebih dahulu untuk mengunggah foto instalasi');
        }

        const result = await prisma.$transaction(async (tx) => {
            let customer;

            const normalizedNik = trimOrNull(nik);
            // [NEW] 2. Cek customer hanya di dalam tenant ini
            const existingCustomer = normalizedNik ? await tx.detso_Customer.findFirst({
                where: {
                    nik: normalizedNik,
                    tenant_id: tenant_id, // Wajib filter by tenant
                    deleted_at: null
                }
            }) : null;

            if (existingCustomer) {
                customer = existingCustomer;
            } else {
                // [NEW] 3. Create Customer dengan tenant_id
                customer = await tx.detso_Customer.create({
                    data: {
                        tenant_id: tenant_id, // Link ke tenant
                        name: name.trim(),
                        phone: trimOrNull(phone),
                        email: trimOrNull(email),
                        birth_date,
                        birth_place: trimOrNull(birth_place),
                        address: trimOrNull(address),
                        nik: normalizedNik,
                        created_at: new Date()
                    }
                });
            }

            let serviceConnection = null;
            let idPel: string | null = null;
            const createdPhotos = [];

            if (normalizedPackageId) {
                // [NEW] 4. Validasi Paket (Pastikan paket milik tenant ini)
                // Gunakan findFirst dengan filter tenant_id, bukan findUnique
                const packageData = await tx.detso_Package.findFirst({
                    where: {
                        id: normalizedPackageId,
                        tenant_id: tenant_id, // Security check: Paket harus milik ISP ini
                        deleted_at: null
                    }
                });

                if (!packageData) {
                    throw new NotFoundError('Paket tidak ditemukan atau tidak tersedia untuk ISP ini');
                }

                idPel = await generateUniqueIdPel();

                // [NEW] 5. Create Service Connection dengan tenant_id
                serviceConnection = await tx.detso_Service_Connection.create({
                    data: {
                        tenant_id: tenant_id, // Link ke tenant
                        customer_id: customer.id,
                        id_pel: idPel,
                        package_id: normalizedPackageId,
                        address: trimOrNull(address_service),
                        package_name: packageData.name,
                        package_price: packageData.price,
                        lat: trimOrNull(lat),
                        long: trimOrNull(long),
                        package_speed: packageData.speed,
                        ip_address: trimOrNull(ip_address),
                        mac_address: trimOrNull(mac_address),
                        notes: trimOrNull(notes),
                        created_at: new Date()
                    }
                });

                // Create DROP_CABLE link to ODP if odp_id provided
                if (odp_id) {
                    const odpNode = await tx.detso_Network_Node.findFirst({
                        where: { id: odp_id, tenant_id, deleted_at: null },
                    });
                    if (!odpNode) {
                        throw new NotFoundError('ODP tidak ditemukan');
                    }

                    // Check slot capacity
                    if (odpNode.slot) {
                        const currentLinks = await tx.detso_Network_Link.count({
                            where: { from_node_id: odp_id, to_service_id: { not: null } },
                        });
                        if (currentLinks >= odpNode.slot) {
                            throw new ValidationError('Slot ODP sudah penuh');
                        }
                    }

                    await tx.detso_Network_Link.create({
                        data: {
                            tenant_id,
                            from_node_id: odp_id,
                            to_service_id: serviceConnection.id,
                            type: 'DROP_CABLE',
                        },
                    });
                }

                // Upload photos
                if (photos && servicePhotoFiles) {
                    for (let index = 0; index < photos.length; index++) {
                        const photo = photos[index];
                        const file = servicePhotoFiles[index];
                        if (file) {
                            const fileInfo = getUploadedFileInfo(file, 'storage/public/customer/photos');
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
            } else if (existingCustomer) {
                throw new ValidationError('Pilih paket layanan untuk menambahkan layanan ke pelanggan yang sudah ada');
            }

            // Upload documents (Code tetap sama, relasi ke customer sudah aman)
            const createdDocuments = [];
            if (documents && documentFiles) {
                for (let index = 0; index < documents.length; index++) {
                    const doc = documents[index];
                    const file = documentFiles[index];
                    if (file) { // Safety check
                        const fileInfo = getUploadedFileInfo(file, 'storage/public/customer/documents');
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

            return { customer, serviceConnection, createdDocuments, createdPhotos, idPel };
        });

        // --- Bagian PDF & WhatsApp (Logic tetap sama) ---
        // Catatan: Di tahap lanjut, kamu mungkin perlu setting WhatsApp credential per Tenant.
        // Untuk sekarang, kita asumsikan pakai gateway global dulu.

        let pdfPath = null;
        let whatsappSent = false;

        try {
            if (result.serviceConnection) {
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
            }

            // // Kirim WA (Logic sama persis seperti kodemu)
            // if (pdfPath) {
            //     const isWhatsAppReady = await whatsappService.isClientReady();
            //     if (isWhatsAppReady && phone) {
            //         const textMessage = `Halo ${name}! 👋\n\nSelamat! Instalasi internet Anda telah berhasil diselesaikan.\n\n📋 Detail Layanan:\n• ID Pelanggan: ${result.idPel}\n• Paket: ${result.serviceConnection.package_name}\n• Kecepatan: ${result.serviceConnection.package_speed}\n• Alamat: ${address}\n\nTerimakasih!`;

            //         await whatsappService.sendMessage(phone, textMessage);

            //         const fileName = `Laporan_Instalasi_${result.idPel}.pdf`;
            //         const caption = `📄 Laporan Instalasi Internet`;

            //         whatsappSent = await whatsappService.sendDocument(phone, pdfPath, caption, fileName);

            //         if (whatsappSent) {
            //             await prisma.detso_WhatsApp_Log.create({
            //                 data: {
            //                     customer_id: result.customer.id,
            //                     phone_number: phone,
            //                     message_type: 'installation_report',
            //                     status: 'sent',
            //                     sent_at: new Date()
            //                 }
            //             });
            //         }
            //     }
            // }
        } catch (pdfError) {
            console.error('Error generating/sending PDF:', pdfError);
        }

        const isTeknisi = user.role === Detso_Role.TENANT_TEKNISI;
        const visibleDocuments = isTeknisi
            ? result.createdDocuments.filter(doc => doc.document_type.toLowerCase() !== 'ktp')
            : result.createdDocuments;

        responseData(res, 201, 'Customer dan service connection berhasil dibuat', {
            customer: {
                ...result.customer,
                nik: isTeknisi ? null : result.customer.nik,
            },
            serviceConnection: result.serviceConnection
                ? {
                    ...result.serviceConnection,
                    photos: result.createdPhotos.map(photo => ({
                        ...photo,
                        photo_url: generateFullUrl(photo.photo_url)
                    }))
                }
                : null,
            documents: visibleDocuments.map(doc => ({
                ...doc,
                document_url: generateFullUrl(doc.document_url)
            })),
            pdfGenerated: isTeknisi ? false : pdfPath !== null,
            pdfPath: isTeknisi ? null : pdfPath,
            whatsappSent: whatsappSent,
            idPel: result.idPel
        });

    } catch (error) {
        await cleanupFiles();
        throw error;
    }
});