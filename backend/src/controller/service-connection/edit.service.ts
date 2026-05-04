import { Request, Response } from 'express';
import { asyncHandler, NotFoundError, ValidationError, AuthenticationError } from '../../utils/error-handler';
import { updateServiceConnectionSchema } from './validation/validation.service';
import { prisma } from '../../utils/prisma';
import { deleteFile, getUploadedFileInfo } from '../../config/upload-file';
import { responseData } from '../../utils/response-handler';
import { generateFullUrl } from '../../utils/generate-full-url';
import { getParam } from '../../utils/request.utils';

interface UpdateServiceFiles {
  photos?: Express.Multer.File[];
}

export const editServiceConnection = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // [NEW] 1. Ambil tenant_id
  const user = req.user;
  if (!user || !user.tenant_id) {
      throw new AuthenticationError('Sesi tidak valid atau Tenant ID tidak ditemukan');
  }
  const tenant_id = user.tenant_id;

  const serviceId = getParam(req.params.id);
  const files = req.files as UpdateServiceFiles;

  const requestData = {
    ...req.body,
    photos: req.body.photos ? JSON.parse(req.body.photos) : undefined
  };

  const validationResult = updateServiceConnectionSchema.safeParse(requestData);
  if (!validationResult.success) {
    throw new ValidationError('Validasi gagal', validationResult.error.issues);
  }

  const {
    package_id,
    address,
    // package_name, // [SECURITY] Kita ignore input ini jika package_id berubah
    // package_speed, // [SECURITY] Kita ignore input ini jika package_id berubah
    ip_address,
    mac_address,
    lat,
    long: lng,
    notes,
    status,
    photos,
    odp_id,
  } = validationResult.data;

  // [NEW] 2. Cari Service Existing dengan Filter Tenant
  const existingService = await prisma.detso_Service_Connection.findFirst({
    where: { 
        id: serviceId,
        tenant_id: tenant_id // <--- Filter Tenant
    },
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
    // [NEW] 3. Logic Ganti Paket (Secure)
    let newPackageData = null;

    if (package_id && package_id !== existingService.package_id) {
      // Cari paket baru di database, pastikan milik tenant ini
      const packageExists = await prisma.detso_Package.findFirst({
        where: {
          id: package_id,
          tenant_id: tenant_id, // <--- Filter Tenant
          deleted_at: null
        }
      });

      if (!packageExists) {
        throw new NotFoundError('Paket tidak ditemukan atau tidak tersedia untuk ISP ini');
      }
      
      newPackageData = packageExists;
    }


    return await prisma.$transaction(async (tx) => {
      // [NEW] 4. Tentukan data paket mana yang dipakai
      // Jika paket ganti, AMBIL DARI DB (newPackageData). 
      // Jika tidak, pakai data lama (existingService).
      // Kita hindari ambil dari req.body untuk data krusial ini.
      
      const finalPackageName = newPackageData ? newPackageData.name : existingService.package_name;
      const finalPackageSpeed = newPackageData ? newPackageData.speed : existingService.package_speed;
      const finalPackagePrice = newPackageData ? newPackageData.price : existingService.package_price;

      const updatedService = await tx.detso_Service_Connection.update({
        where: { id: serviceId },
        data: {
          package_id: package_id || existingService.package_id,
          
          // Data Snapshot Paket (Anti Fraud)
          package_name: finalPackageName,
          package_speed: finalPackageSpeed,
          package_price: finalPackagePrice,

          address: address || existingService.address,
          lat: lat || existingService.lat,
          long: lng || existingService.long,
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

      // Handle ODP link change
      if (odp_id) {
        // Check if service already linked to an ODP
        const existingLink = await tx.detso_Network_Link.findFirst({
          where: { to_service_id: serviceId },
        });

        if (existingLink) {
          // If same ODP, do nothing. If different, delete old and create new.
          if (existingLink.from_node_id !== odp_id) {
            await tx.detso_Network_Link.delete({ where: { id: existingLink.id } });

            // Validate new ODP
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
                to_service_id: serviceId,
                type: 'DROP_CABLE',
              },
            });
          }
        } else {
          // No existing link, create new one
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
              to_service_id: serviceId,
              type: 'DROP_CABLE',
            },
          });
        }
      }

      // Logic Update Foto (Sama seperti sebelumnya)
      if (photos !== undefined) {
        // Hapus file lama
        await Promise.all(
          existingService.photos.map(async (photo) => {
            if (photo.photo_url) {
              await deleteFile(photo.photo_url).catch(err =>
                console.error('Gagal hapus foto lama:', err)
              );
            }
          })
        );

        // Hapus record lama
        await tx.detso_Service_Photo.deleteMany({
          where: { service_id: serviceId }
        });

        // Upload baru
        if (photos.length > 0 && files.photos) {
          if (files.photos.length !== photos.length) {
            await cleanupUploadedFiles();
            throw new ValidationError('Jumlah file foto tidak sesuai dengan data yang dikirim.');
          }

          await Promise.all(
            photos.map(async (photo, index) => {
              const file = files.photos![index];
              if(file) {
                  const fileInfo = getUploadedFileInfo(file, 'storage/public/customer/photos');
                  await tx.detso_Service_Photo.create({
                    data: {
                      service_id: serviceId,
                      photo_type: photo.type,
                      photo_url: fileInfo.path,
                      uploaded_at: new Date(),
                      notes: photo.notes || null
                    }
                  });
              }
            })
          );
        }
      }

      // Ambil data final (Scoped check lagi untuk konsistensi)
      const finalService = await tx.detso_Service_Connection.findFirst({
        where: { 
            id: serviceId,
            tenant_id: tenant_id // <--- Filter Tenant
        },
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
          photo_url: generateFullUrl(photo.photo_url)
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