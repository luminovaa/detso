import { Request, Response } from 'express';
import { asyncHandler, NotFoundError, ValidationError } from '../../utils/error-handler';
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
        birth_date,
        birth_place,
        notes,
        documents,
        photos
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
                deleted_at: null
            }
        });

        if (existingCustomer) {
            throw new ValidationError('NIK sudah terdaftar. Tidak boleh duplikat.');
        }

        const idPel = await generateUniqueIdPel();

        const result = await prisma.$transaction(async (tx) => {
            // 1. Buat customer
            const customer = await tx.detso_Customer.create({
                data: {
                    name,
                    phone,
                    email,
                    birth_date,
                    birth_place,
                    nik,
                    created_at: new Date()
                }
            });

            // 2. Buat service connection
            const serviceConnection = await tx.detso_Service_Connection.create({
                data: {
                    customer_id: customer.id,
                    id_pel: idPel,
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
            const createdDocuments = [];
            if (documents && documentFiles) {
                for (let index = 0; index < documents.length; index++) {
                    const doc = documents[index];
                    const file = documentFiles[index];
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

            // 4. Upload foto service connection
            const createdPhotos = [];
            if (photos && servicePhotoFiles) {
                for (let index = 0; index < photos.length; index++) {
                    const photo = photos[index];
                    const file = servicePhotoFiles[index];
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

            return { customer, serviceConnection, createdDocuments, createdPhotos };
        });

        // 5. Generate PDF Report
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

            // 6. Simpan informasi PDF ke database
            await prisma.detso_Customer_PDF.create({
                data: {
                    customer_id: result.customer.id,
                    service_connection_id: result.serviceConnection.id,
                    pdf_type: 'installation_report',
                    pdf_path: pdfPath,
                    generated_at: new Date()
                }
            });

            // 7. Kirim PDF via WhatsApp
//             if (pdfPath) {
//                 try {
//                     // Cek apakah WhatsApp client siap
//                     const isWhatsAppReady = await whatsappService.isClientReady();
                    
//                     if (isWhatsAppReady) {
//                         // Kirim pesan teks terlebih dahulu
//                         const textMessage = `Halo ${name}! 👋

// Selamat! Instalasi internet Anda telah berhasil diselesaikan. 

// 📋 Detail Layanan:
// • ID Pelanggan: ${idPel}
// • Paket: ${package_name}
// • Kecepatan: ${package_speed}
// • Alamat: ${address}

// Terlampir adalah laporan instalasi lengkap sebagai dokumentasi layanan Anda. Simpan dokumen ini dengan baik untuk referensi di masa mendatang.

// Terima kasih telah mempercayai layanan kami! 🚀

// ---
// Tim Teknis DETSONET`;

//                         await whatsappService.sendMessage(phone!, textMessage);

//                         // Kirim dokumen PDF
//                         const fileName = `Laporan_Instalasi_${idPel}_${name.replace(/\s+/g, '_')}.pdf`;
//                         const caption = `📄 Laporan Instalasi Internet\n\nID Pelanggan: ${idPel}\nNama: ${name}\nTanggal: ${new Date().toLocaleDateString('id-ID')}`;
                        
//                         whatsappSent = await whatsappService.sendDocument(
//                             phone!, 
//                             pdfPath, 
//                             caption,
//                             fileName
//                         );

//                         if (whatsappSent) {
//                             await prisma.detso_WhatsApp_Log.create({
//                                 data: {
//                                     customer_id: result.customer.id,
//                                     phone_number: phone || '',
//                                     message_type: 'installation_report',
//                                     status: 'sent',
//                                     sent_at: new Date()
//                                 }
//                             });
//                         }
//                     } else {
//                         console.warn('WhatsApp client is not ready. PDF generated but not sent.');
//                     }
//                 } catch (whatsappError) {
//                     console.error('Error sending WhatsApp message:', whatsappError);
                    
//                     await prisma.detso_WhatsApp_Log.create({
//                         data: {
//                             customer_id: result.customer.id,
//                             phone_number: phone || '',
//                             message_type: 'installation_report',
//                             status: 'failed',
//                             error_message: whatsappError instanceof Error ? whatsappError.message : 'Unknown error',
//                             sent_at: new Date()
//                         }
//                     });
//                 }
//             }

        } catch (pdfError) {
            console.error('Error generating PDF:', pdfError);
            // PDF generation error tidak menggagalkan seluruh proses
            // Tapi kita log untuk troubleshooting
        }

        responseData(res, 201, 'Customer dan service connection berhasil dibuat', {
            customer: result.customer,
            serviceConnection: result.serviceConnection,
            pdfGenerated: pdfPath !== null,
            pdfPath: pdfPath,
            whatsappSent: whatsappSent,
            idPel: idPel
        });

    } catch (error) {
        await cleanupFiles();
        throw error;
    }
});