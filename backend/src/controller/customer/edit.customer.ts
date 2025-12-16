import { Request, Response } from 'express';
import { asyncHandler, NotFoundError, ValidationError, AuthenticationError } from '../../utils/error-handler';
import { responseData } from '../../utils/response-handler';
import { updateCustomerSchema } from './validation/validation.customer';
import { prisma } from '../../utils/prisma';
import { deleteFile, getUploadedFileInfo } from '../../config/upload-file';

interface UpdateCustomerFiles {
  documents?: Express.Multer.File[];
}

export const editCustomer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // [NEW] 1. Ambil tenant_id
  const user = req.user;
  if (!user || !user.tenantId) {
      throw new AuthenticationError('Sesi tidak valid');
  }
  const tenantId = user.tenantId;

  const customerId = req.params.id;
  const files = req.files as UpdateCustomerFiles;

  const requestData = {
    ...req.body,
    documents: req.body.documents ? JSON.parse(req.body.documents) : undefined
  };

  const validationResult = updateCustomerSchema.safeParse(requestData);
  if (!validationResult.success) {
    throw new ValidationError('Validasi gagal', validationResult.error.errors);
  }

  const { name, phone, email, nik, documents } = validationResult.data;

  // [NEW] 2. Cari customer dengan filter tenant_id
  // Menggunakan findFirst bukan findUnique karena kita butuh filter tenant_id
  const existingCustomer = await prisma.detso_Customer.findFirst({
    where: { 
        id: customerId,
        tenant_id: tenantId // WAJIB: Pastikan customer milik tenant ini
    },
    include: {
      documents: true,
    }
  });

  if (!existingCustomer) {
    // Jika ID ada tapi tenant beda, tetap return NotFound demi keamanan
    throw new NotFoundError('Customer tidak ditemukan');
  }

  const cleanupUploadedFiles = async () => {
    if (files.documents) {
      await Promise.all(
        files.documents.map(file => deleteFile(file.path).catch(err => console.error('Gagal hapus file:', err)))
      );
    }
  };

  try {
    // [NEW] 3. Cek Duplikasi NIK (Scoped per Tenant)
    if (nik && nik !== existingCustomer.nik) {
      const duplicate = await prisma.detso_Customer.findFirst({
        where: {
          nik,
          tenant_id: tenantId, // Cek duplikat hanya di tenant ini
          id: { not: customerId },
          deleted_at: null
        }
      });
      if (duplicate) {
        await cleanupUploadedFiles();
        throw new ValidationError('NIK sudah digunakan oleh customer lain di sistem ini.');
      }
    }

    const baseUrl = process.env.BASE_URL;

    return await prisma.$transaction(async (tx) => {
      // Update data customer
      const updatedCustomer = await tx.detso_Customer.update({
        where: { id: customerId }, // id unik global, tapi kita sudah verify di atas
        data: {
          name,
          phone,
          email,
          nik,
          updated_at: new Date()
        }
      });

      // Logic Dokumen (Tidak banyak berubah, karena sudah aman di dalam transaction)
      if (documents !== undefined) {
        // Hapus dokumen lama dari DB
        await tx.detso_Customer_Document.deleteMany({
          where: { customer_id: customerId }
        });

        // Hapus fisik file lama
        existingCustomer.documents.forEach(async (doc) => {
          if (doc.document_url) {
            await deleteFile(doc.document_url).catch(err =>
              console.error('Gagal hapus dokumen lama:', err)
            );
          }
        });

        // Upload dokumen baru
        if (documents.length > 0 && files.documents) {
          if (files.documents.length !== documents.length) {
            await cleanupUploadedFiles();
            throw new ValidationError('Jumlah file dokumen tidak sesuai dengan data yang dikirim.');
          }

          await Promise.all(
            documents.map(async (doc, index) => {
              const file = files.documents![index];
              if(file) {
                  const fileInfo = getUploadedFileInfo(file, 'storage/image/customer/documents');
                  await tx.detso_Customer_Document.create({
                    data: {
                      customer_id: customerId,
                      document_type: doc.type,
                      document_url: fileInfo.path,
                      uploaded_at: new Date()
                    }
                  });
              }
            })
          );
        }
      }

      // [NEW] 4. Return data final (Scoped check lagi biar konsisten)
      const finalCustomer = await tx.detso_Customer.findFirst({
        where: { 
            id: customerId,
            tenant_id: tenantId
        },
        include: {
          documents: {
            select: {
              id: true,
              document_type: true,
              document_url: true,
              uploaded_at: true
            }
          }
        }
      });

      if (!finalCustomer) {
        throw new Error('Gagal mengambil data customer setelah update');
      }

      const documentsWithUrl = finalCustomer.documents.map(doc => ({
        ...doc,
        document_url: `${baseUrl}/${doc.document_url}`.replace(/\/+/g, '/')
      }));

      responseData(res, 200, 'Data customer berhasil diperbarui', {
        id: finalCustomer.id,
        name: finalCustomer.name,
        phone: finalCustomer.phone,
        email: finalCustomer.email,
        nik: finalCustomer.nik,
        created_at: finalCustomer.created_at,
        updated_at: finalCustomer.updated_at,
        documents: documentsWithUrl
      });
    });
  } catch (error) {
    await cleanupUploadedFiles();
    throw error;
  }
});