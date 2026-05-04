import { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler, AuthenticationError, NotFoundError, ValidationError } from '../../utils/error-handler';
import { responseData } from '../../utils/response-handler';
import { getPagination } from '../../utils/pagination';
import { prisma } from '../../utils/prisma';
import { generateFullUrl } from '../../utils/generate-full-url';
import { getParam } from '../../utils/request.utils';

// ─── Validation ──────────────────────────────────────────────────
const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
});

// ─── GET /service-connection ─────────────────────────────────────
export const getAllServices = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user || !user.tenant_id) {
    throw new AuthenticationError('Sesi tidak valid atau Tenant ID tidak ditemukan');
  }
  const tenant_id = user.tenant_id;

  const validationResult = querySchema.safeParse(req.query);
  if (!validationResult.success) {
    throw new ValidationError('Validasi gagal', validationResult.error.issues);
  }

  const { page, limit, search, status } = validationResult.data;

  // Build where clause
  const whereClause: any = {
    tenant_id,
    deleted_at: null,
  };

  // Filter by status
  if (status) {
    whereClause.status = status;
  }

  // Search across service + customer fields
  if (search) {
    whereClause.OR = [
      { package_name: { contains: search, mode: 'insensitive' } },
      { address: { contains: search, mode: 'insensitive' } },
      { id_pel: { contains: search, mode: 'insensitive' } },
      { ip_address: { contains: search } },
      { mac_address: { contains: search, mode: 'insensitive' } },
      { customer: { name: { contains: search, mode: 'insensitive' } } },
      { customer: { phone: { contains: search } } },
    ];
  }

  const totalItems = await prisma.detso_Service_Connection.count({ where: whereClause });

  const { skip, pagination } = getPagination({
    page,
    limit,
    totalItems,
  });

  const services = await prisma.detso_Service_Connection.findMany({
    where: whereClause,
    skip,
    take: limit,
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      },
      package: {
        select: {
          name: true,
          speed: true,
          price: true,
        },
      },
      photos: {
        select: {
          id: true,
          photo_type: true,
          photo_url: true,
          uploaded_at: true,
          notes: true,
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  const formattedServices = services.map(service => ({
    id: service.id,
    id_pel: service.id_pel,
    package_name: service.package_name,
    package_speed: service.package_speed,
    package_price: service.package_price,
    address: service.address,
    ip_address: service.ip_address,
    mac_address: service.mac_address,
    lat: service.lat,
    long: service.long,
    status: service.status,
    notes: service.notes,
    created_at: service.created_at,
    customer: service.customer,
    package_details: service.package,
    photos: service.photos.map(photo => ({
      ...photo,
      photo_url: generateFullUrl(photo.photo_url),
    })),
  }));

  responseData(res, 200, 'Daftar layanan berhasil diambil', {
    services: formattedServices,
    pagination,
  });
});

// ─── GET /service-connection/:id ─────────────────────────────────
export const getServiceById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const serviceId = getParam(req.params.id);
  const user = req.user;
  if (!user || !user.tenant_id) {
    throw new AuthenticationError('Sesi tidak valid atau Tenant ID tidak ditemukan');
  }

  const service = await prisma.detso_Service_Connection.findFirst({
    where: {
      id: serviceId,
      tenant_id: user.tenant_id,
      deleted_at: null,
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          nik: true,
          address: true,
        },
      },
      package: {
        select: {
          id: true,
          name: true,
          speed: true,
          price: true,
        },
      },
      photos: {
        select: {
          id: true,
          photo_type: true,
          photo_url: true,
          uploaded_at: true,
          notes: true,
        },
      },
    },
  });

  if (!service) {
    throw new NotFoundError('Layanan tidak ditemukan atau telah dihapus');
  }

  const formatted = {
    id: service.id,
    id_pel: service.id_pel,
    package_name: service.package_name,
    package_speed: service.package_speed,
    package_price: service.package_price,
    address: service.address,
    ip_address: service.ip_address,
    mac_address: service.mac_address,
    lat: service.lat,
    long: service.long,
    status: service.status,
    notes: service.notes,
    created_at: service.created_at,
    customer: service.customer,
    package_details: service.package,
    photos: service.photos.map(photo => ({
      ...photo,
      photo_url: generateFullUrl(photo.photo_url),
    })),
  };

  responseData(res, 200, 'Data layanan berhasil diambil', formatted);
});
