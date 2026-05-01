import { Request, Response } from 'express';
import { asyncHandler, AuthenticationError, NotFoundError, ValidationError } from '../../utils/error-handler';
import { responseData } from '../../utils/response-handler';
import { prisma } from '../../utils/prisma';
import { getParam } from '../../utils/request.utils';

/**
 * DELETE /api/network/nodes/:id
 * Soft delete a network node
 * - Delete Server → children ODP parent_id set to null
 * - Delete ODP → links to services are deleted
 */
export const deleteNode = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user || !user.tenant_id) {
    throw new AuthenticationError('Sesi tidak valid atau Tenant ID tidak ditemukan');
  }

  const nodeId = getParam(req.params.id);
  const tenant_id = user.tenant_id;

  const node = await prisma.detso_Network_Node.findFirst({
    where: {
      id: nodeId,
      tenant_id,
      deleted_at: null,
    },
    include: {
      _count: {
        select: {
          children: { where: { deleted_at: null } },
          links_from: true,
          links_to: true,
        },
      },
    },
  });

  if (!node) {
    throw new NotFoundError('Node tidak ditemukan');
  }

  // Transaction: soft delete node + handle cascading effects
  await prisma.$transaction(async (tx) => {
    // 1. Soft delete the node
    await tx.detso_Network_Node.update({
      where: { id: nodeId },
      data: { deleted_at: new Date() },
    });

    // 2. If SERVER: set children ODP parent_id to null
    if (node.type === 'SERVER') {
      await tx.detso_Network_Node.updateMany({
        where: {
          parent_id: nodeId,
          deleted_at: null,
        },
        data: { parent_id: null },
      });
    }

    // 3. Delete all links FROM this node (outgoing)
    await tx.detso_Network_Link.deleteMany({
      where: { from_node_id: nodeId },
    });

    // 4. Delete all links TO this node (incoming)
    await tx.detso_Network_Link.deleteMany({
      where: { to_node_id: nodeId },
    });
  });

  responseData(res, 200, `${node.type === 'SERVER' ? 'Server' : 'ODP'} berhasil dihapus`, {
    id: nodeId,
    type: node.type,
    name: node.name,
  });
});

/**
 * DELETE /api/network/links/:id
 * Delete a link (node and service remain intact)
 */
export const deleteLink = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user || !user.tenant_id) {
    throw new AuthenticationError('Sesi tidak valid atau Tenant ID tidak ditemukan');
  }

  const linkId = getParam(req.params.id);
  const tenant_id = user.tenant_id;

  const link = await prisma.detso_Network_Link.findFirst({
    where: {
      id: linkId,
      tenant_id,
    },
  });

  if (!link) {
    throw new NotFoundError('Link tidak ditemukan');
  }

  await prisma.detso_Network_Link.delete({
    where: { id: linkId },
  });

  responseData(res, 200, 'Link berhasil dihapus', { id: linkId });
});
