import { Request, Response } from 'express';
import { asyncHandler, NotFoundError, ValidationError } from '../../utils/error-handler';
import { updateServiceConnectionSchema } from './validation/validation.service';
import { prisma } from '../../utils/prisma';
import { deleteFile, getUploadedFileInfo } from '../../config/upload-file';
import { responseData } from '../../utils/response-handler';

interface UpdateServiceFiles {
  photos?: Express.Multer.File[];
}

export const editServiceConnection = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const serviceId = req.params.id;
  const files = req.files as UpdateServiceFiles;

  const requestData = {
    ...req.body,
    photos: req.body.photos ? JSON.parse(req.body.photos) : undefined
  };

  const validationResult = updateServiceConnectionSchema.safeParse(requestData);
  if (!validationResult.success) {
    throw new ValidationError('Validasi gagal', validationResult.error.errors);
  }

  const {
    package_id,
    address,
    package_name,
    package_speed,
    ip_address,
    mac_address,
    notes,
    status,
    photos
  } = validationResult.data;

  const existingService = await prisma.detso_Service_Connection.findUnique({
    where: { id: serviceId },
    include: {
      photos: true,
      package: true,
      customer: true
    }
  });

  if (!existingService) {
    throw new NotFoundError('Service connection tidak ditemukan');
  }

  const cleanupUploadedFiles = async () => {
    if (files.photos) {
      await Promise.all(
        files.photos.map(file => 
          deleteFile(file.path).catch(err => console.error('Gagal hapus file:', err))
        )
      );
    }
  };

  try {
    if (package_id && package_id !== existingService.package_id) {
      const packageExists = await prisma.detso_Package.findFirst({
        where: {
          id: package_id,
          deleted_at: null
        }
      });

      if (!packageExists) {
        throw new NotFoundError('Paket tidak ditemukan atau telah dihapus');
      }
    }

    const baseUrl = process.env.BASE_URL;

    return await prisma.$transaction(async (tx) => {
      const updatedService = await tx.detso_Service_Connection.update({
        where: { id: serviceId },
        data: {
          package_id: package_id || existingService.package_id,
          address: address || existingService.address,
          package_name: package_name || existingService.package_name,
          package_speed: package_speed || existingService.package_speed,
          ip_address: ip_address || existingService.ip_address,
          mac_address: mac_address || existingService.mac_address,
          notes: notes || existingService.notes,
          status: status || existingService.status,
          updated_at: new Date()
        },
        include: {
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

      if (photos !== undefined) {
        await Promise.all(
          existingService.photos.map(async (photo) => {
            if (photo.photo_url) {
              await deleteFile(photo.photo_url).catch(err =>
                console.error('Gagal hapus foto lama:', err)
              );
            }
          })
        );

        await tx.detso_Service_Photo.deleteMany({
          where: { service_id: serviceId }
        });

        if (photos.length > 0 && files.photos) {
          if (files.photos.length !== photos.length) {
            await cleanupUploadedFiles();
            throw new ValidationError('Jumlah file foto tidak sesuai dengan data yang dikirim.');
          }

          await Promise.all(
            photos.map(async (photo, index) => {
              const file = files.photos![index];
              const fileInfo = getUploadedFileInfo(file, 'storage/image/customer/photos');

              await tx.detso_Service_Photo.create({
                data: {
                  service_id: serviceId,
                  photo_type: photo.type,
                  photo_url: fileInfo.path,
                  uploaded_at: new Date(),
                  notes: photo.notes || null
                }
              });
            })
          );
        }
      }

      const finalService = await tx.detso_Service_Connection.findUnique({
        where: { id: serviceId },
        include: {
          photos: {
            select: {
              id: true,
              photo_type: true,
              photo_url: true,
              uploaded_at: true,
              notes: true
            }
          },
          package: true,
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true
            }
          }
        }
      });

      if (!finalService) {
        throw new Error('Gagal mengambil data service setelah update');
      }

      const serviceData = {
        ...finalService,
        photos: finalService.photos.map(photo => ({
          ...photo,
          photo_url: `${baseUrl}/${photo.photo_url}`
        })),
        customer: finalService.customer,
        package: finalService.package
      };

      responseData(res, 200, 'Service connection berhasil diperbarui', serviceData);
    });
  } catch (error) {
    await cleanupUploadedFiles();
    throw error;
  }
});