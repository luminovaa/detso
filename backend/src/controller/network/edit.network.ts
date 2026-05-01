import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { asyncHandler, AuthenticationError, ValidationError, NotFoundError } from '../../utils/error-handler';
import { responseData } from '../../utils/response-handler';
import { prisma } from '../../utils/prisma';
import { editNodeSchema, editLinkSchema } from './validation/validation.network';
import { getParam } from '../../utils/request.utils';

/**
 * PUT /api/network/nodes/:id
 * Update a network node
 */
export const editNode = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user || !user.tenant_id) {
    throw new AuthenticationError('Sesi tidak valid atau Tenant ID tidak ditemukan');
  }

  const nodeId = getParam(req.params.id);
  const tenant_id = user.tenant_id;

  const validationResult = editNodeSchema.safeParse(req.body);
  if (!validationResult.success) {
    throw new ValidationError('Validasi gagal', validationResult.error.issues);
  }

  // Check node exists and belongs to tenant
  const existingNode = await prisma.detso_Network_Node.findFirst({
    where: {
      id: nodeId,
      tenant_id,
      deleted_at: null,
    },
  });

  if (!existingNode) {
    throw new NotFoundError('Node tidak ditemukan');
  }

  const { name, lat, long, address, slot, notes, parent_id } = validationResult.data;

  // If changing parent_id, validate it's a valid Server
  if (parent_id !== undefined && parent_id !== null) {
    // Only ODP can have parent
    if (existingNode.type !== 'ODP') {
      throw new ValidationError('Hanya ODP yang bisa memiliki parent Server');
    }

    const parentNode = await prisma.detso_Network_Node.findFirst({
      where: {
        id: parent_id,
        tenant_id,
        type: 'SERVER',
        deleted_at: null,
      },
    });

    if (!parentNode) {
      throw new ValidationError('Parent Server tidak ditemukan');
    }
  }

  // Check duplicate name if name is being changed
  if (name && name !== existingNode.name) {
    const duplicateNode = await prisma.detso_Network_Node.findFirst({
      where: {
        tenant_id,
        name: { equals: name, mode: 'insensitive' },
        type: existingNode.type,
        deleted_at: null,
        id: { not: nodeId },
      },
    });

    if (duplicateNode) {
      throw new ValidationError(`${existingNode.type === 'SERVER' ? 'Server' : 'ODP'} dengan nama "${name}" sudah ada`);
    }
  }

  // Build update data (only include fields that are provided)
  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (lat !== undefined) updateData.lat = lat;
  if (long !== undefined) updateData.long = long;
  if (address !== undefined) updateData.address = address;
  if (slot !== undefined) updateData.slot = slot;
  if (notes !== undefined) updateData.notes = notes;
  if (parent_id !== undefined) updateData.parent_id = parent_id;

  const updatedNode = await prisma.detso_Network_Node.update({
    where: { id: nodeId },
    data: updateData,
  });

  responseData(res, 200, 'Node berhasil diperbarui', updatedNode);
});

/**
 * PUT /api/network/links/:id
 * Update a link (primarily for editing waypoints)
 */
export const editLink = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user || !user.tenant_id) {
    throw new AuthenticationError('Sesi tidak valid atau Tenant ID tidak ditemukan');
  }

  const linkId = getParam(req.params.id);
  const tenant_id = user.tenant_id;

  const validationResult = editLinkSchema.safeParse(req.body);
  if (!validationResult.success) {
    throw new ValidationError('Validasi gagal', validationResult.error.issues);
  }

  // Check link exists and belongs to tenant
  const existingLink = await prisma.detso_Network_Link.findFirst({
    where: {
      id: linkId,
      tenant_id,
    },
  });

  if (!existingLink) {
    throw new NotFoundError('Link tidak ditemukan');
  }

  const { waypoints, notes, type } = validationResult.data;

  const updateData: any = {};
  if (waypoints !== undefined) updateData.waypoints = waypoints === null ? Prisma.JsonNull : waypoints;
  if (notes !== undefined) updateData.notes = notes;
  if (type !== undefined) updateData.type = type;

  const updatedLink = await prisma.detso_Network_Link.update({
    where: { id: linkId },
    data: updateData,
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

  responseData(res, 200, 'Link berhasil diperbarui', updatedLink);
});
