import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { asyncHandler, AuthenticationError, ValidationError, NotFoundError } from '../../utils/error-handler';
import { responseData } from '../../utils/response-handler';
import { prisma } from '../../utils/prisma';
import { createNodeSchema, createLinkSchema } from './validation/validation.network';

/**
 * POST /api/network/nodes
 * Create a new network node (Server or ODP)
 */
export const createNode = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user || !user.tenant_id) {
    throw new AuthenticationError('Sesi tidak valid atau Tenant ID tidak ditemukan');
  }

  const tenant_id = user.tenant_id;

  const validationResult = createNodeSchema.safeParse(req.body);
  if (!validationResult.success) {
    throw new ValidationError('Validasi gagal', validationResult.error.issues);
  }

  const { type, name, lat, long, address, slot, notes, parent_id } = validationResult.data;

  // Jika ODP, validasi parent_id adalah Server milik tenant yang sama
  if (type === 'ODP' && parent_id) {
    const parentNode = await prisma.detso_Network_Node.findFirst({
      where: {
        id: parent_id,
        tenant_id,
        type: 'SERVER',
        deleted_at: null,
      },
    });

    if (!parentNode) {
      throw new ValidationError('Parent Server tidak ditemukan atau bukan milik tenant ini');
    }
  }

  // Check duplicate name within tenant
  const existingNode = await prisma.detso_Network_Node.findFirst({
    where: {
      tenant_id,
      name: { equals: name, mode: 'insensitive' },
      type,
      deleted_at: null,
    },
  });

  if (existingNode) {
    throw new ValidationError(`${type === 'SERVER' ? 'Server' : 'ODP'} dengan nama "${name}" sudah ada`);
  }

  const node = await prisma.detso_Network_Node.create({
    data: {
      tenant_id,
      type,
      name,
      lat,
      long,
      address: address || null,
      slot: slot || null,
      notes: notes || null,
      parent_id: parent_id || null,
    },
  });

  // Auto-create FIBER link dari Server ke ODP baru
  if (type === 'ODP' && parent_id) {
    await prisma.detso_Network_Link.create({
      data: {
        tenant_id,
        from_node_id: parent_id,
        to_node_id: node.id,
        type: 'FIBER',
      },
    });
  }

  responseData(res, 201, `${type === 'SERVER' ? 'Server' : 'ODP'} berhasil dibuat`, node);
});

/**
 * POST /api/network/links
 * Create a link between nodes or from node to service connection
 */
export const createLink = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user || !user.tenant_id) {
    throw new AuthenticationError('Sesi tidak valid atau Tenant ID tidak ditemukan');
  }

  const tenant_id = user.tenant_id;

  const validationResult = createLinkSchema.safeParse(req.body);
  if (!validationResult.success) {
    throw new ValidationError('Validasi gagal', validationResult.error.issues);
  }

  const { from_node_id, to_node_id, to_service_id, type, waypoints, notes } = validationResult.data;

  // Validate from_node exists and belongs to tenant
  const fromNode = await prisma.detso_Network_Node.findFirst({
    where: {
      id: from_node_id,
      tenant_id,
      deleted_at: null,
    },
  });

  if (!fromNode) {
    throw new NotFoundError('Source node tidak ditemukan');
  }

  // Validate to_node if provided
  if (to_node_id) {
    const toNode = await prisma.detso_Network_Node.findFirst({
      where: {
        id: to_node_id,
        tenant_id,
        deleted_at: null,
      },
    });

    if (!toNode) {
      throw new NotFoundError('Destination node tidak ditemukan');
    }

    // Prevent self-link
    if (from_node_id === to_node_id) {
      throw new ValidationError('Tidak bisa membuat link ke node yang sama');
    }

    // Check duplicate link between same nodes
    const existingLink = await prisma.detso_Network_Link.findFirst({
      where: {
        tenant_id,
        from_node_id,
        to_node_id,
      },
    });

    if (existingLink) {
      throw new ValidationError('Link antara kedua node ini sudah ada');
    }
  }

  // Validate to_service if provided
  if (to_service_id) {
    const toService = await prisma.detso_Service_Connection.findFirst({
      where: {
        id: to_service_id,
        tenant_id,
        deleted_at: null,
      },
    });

    if (!toService) {
      throw new NotFoundError('Service connection tidak ditemukan');
    }

    // Check if service already linked (one-to-one)
    const existingServiceLink = await prisma.detso_Network_Link.findFirst({
      where: {
        to_service_id,
      },
    });

    if (existingServiceLink) {
      throw new ValidationError('Service connection ini sudah terhubung ke node lain');
    }

    // Check ODP slot capacity
    if (fromNode.type === 'ODP' && fromNode.slot) {
      const currentLinks = await prisma.detso_Network_Link.count({
        where: {
          from_node_id,
          to_service_id: { not: null },
        },
      });

      if (currentLinks >= fromNode.slot) {
        throw new ValidationError(`ODP "${fromNode.name}" sudah penuh (${currentLinks}/${fromNode.slot} slot terpakai)`);
      }
    }
  }

  const link = await prisma.detso_Network_Link.create({
    data: {
      tenant_id,
      from_node_id,
      to_node_id: to_node_id || null,
      to_service_id: to_service_id || null,
      type,
      waypoints: waypoints ?? Prisma.JsonNull,
      notes: notes || null,
    },
    include: {
      from_node: { select: { id: true, name: true, type: true } },
      to_node: { select: { id: true, name: true, type: true } },
      to_service: {
        select: {
          id: true,
          address: true,
          customer: { select: { name: true } },
        },
      },
    },
  });

  responseData(res, 201, 'Link berhasil dibuat', link);
});
