import { Request, Response } from "express";
import {
  asyncHandler,
  ValidationError,
} from "../../utils/error-handler";
import { responseData } from "../../utils/response-handler";
import { prisma } from "../../utils/prisma";
import { deleteFile, getUploadedFileInfo } from "../../config/upload-file";
import { createTenantSchema } from "./validation/validation.tenant";
import { createSlug } from "../../helper/slug";
import { generateFullUrl } from "../../utils/generate-full-url";

export const createTenant = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    // 1. Handle File Upload (Logo)
    const cleanupUploadedFile = async () => {
      if (req.file) {
        await deleteFile(req.file.path).catch(console.error);
      }
    };

    let uploadedLogo: { path: string; fileName: string } | undefined;
    if (req.file) {
      uploadedLogo = getUploadedFileInfo(
        req.file,
        "storage/public/tenants/logo",
      );
    }

    // 2. Validasi Input
    const validationResult = createTenantSchema.safeParse(req.body);
    if (!validationResult.success) {
      await cleanupUploadedFile();
      throw new ValidationError(
        "Validasi Gagal",
        validationResult.error.errors,
      );
    }

      const { name, address, phone } = validationResult.data;
      const slug = createSlug(name);

      // 3. Cek Duplikasi Nama/Slug
      const existingTenant = await prisma.detso_Tenant.findFirst({
        where: {
          OR: [{ name: { equals: name, mode: "insensitive" } }, { slug }],
          deleted_at: null,
        },
      });

      if (existingTenant) {
        await cleanupUploadedFile();
        throw new ValidationError(
          "Nama perusahaan atau slug sudah digunakan oleh ISP lain",
        );
      }

      try {
        // 4. Eksekusi Create ke Database
        const newTenant = await prisma.detso_Tenant.create({
          data: {
            name,
            slug,
            address,
            phone,
            is_active: true,
            logo: uploadedLogo?.path,
          },
        });

      // Format URL Logo untuk response
      const responseTenant = {
        ...newTenant,
        logo: generateFullUrl(newTenant.logo),
      };

      responseData(res, 201, "ISP berhasil didaftarkan", responseTenant);
    } catch (error) {
      await cleanupUploadedFile();
      throw error;
    }
  },
);
