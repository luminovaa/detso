import { Request, Response } from 'express';
import { asyncHandler, AuthenticationError, NotFoundError } from '../../utils/error-handler';
import { responseData } from '../../utils/response-handler';
import { prisma } from '../../utils/prisma';
import { nodeQuerySchema } from './validation/validation.network';
import { getParam } from '../../utils/request.utils';

/**
 * GET /api/network/topology
 * Returns full network topology: nodes + links + linked services
 */
export const getTopology = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user || !user.tenant_id) {
    throw new AuthenticationError('Sesi tidak valid atau Tenant ID tidak ditemukan');
  }

  const tenant_id = user.tenant_id;

  // Get all active nodes
  const nodes = await prisma.detso_Network_Node.findMany({
    where: {
      tenant_id,
      deleted_at: null,
    },
    select: {
      id: true,
      type: true,
      name: true,
      lat: true,
      long: true,
      address: true,
      slot: true,
      notes: true,
      parent_id: true,
      _count: {
        select: {
          children: { where: { deleted_at: null } },
          links_from: true,
        },
      },
    },
    orderBy: [
      { type: 'asc' }, // SERVER first, then ODP
      { name: 'asc' },
    ],
  });

  // Get all links
  const links = await prisma.detso_Network_Link.findMany({
    where: {
      tenant_id,
      // Only include links where from_node is not deleted
      from_node: { deleted_at: null },
    },
    select: {
      id: true,
      from_node_id: true,
      to_node_id: true,
      to_service_id: true,
      type: true,
      waypoints: true,
      notes: true,
    },
  });

  // Get linked services (only those that have a network link AND have lat/long)
  const linkedServiceIds = links
    .filter((l) => l.to_service_id)
    .map((l) => l.to_service_id as string);

  const services = linkedServiceIds.length > 0
    ? await prisma.detso_Service_Connection.findMany({
        where: {
          id: { in: linkedServiceIds },
          tenant_id,
          deleted_at: null,
          lat: { not: null },
          long: { not: null },
        },
        select: {
          id: true,
          lat: true,
          long: true,
          address: true,
          status: true,
          package_name: true,
          package_speed: true,
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
      })
    : [];

  // Calculate used_slot for each ODP
  const odpNodes = nodes.filter((n) => n.type === 'ODP');
  const usedSlotMap: Record<string, number> = {};

  if (odpNodes.length > 0) {
    const odpIds = odpNodes.map((n) => n.id);
    const linkCounts = await prisma.detso_Network_Link.groupBy({
      by: ['from_node_id'],
      where: {
        from_node_id: { in: odpIds },
        to_service_id: { not: null },
      },
      _count: { id: true },
    });

    linkCounts.forEach((lc) => {
      usedSlotMap[lc.from_node_id] = lc._count.id;
    });
  }

  // Format response
  const formattedNodes = nodes.map((node) => ({
    id: node.id,
    type: node.type,
    name: node.name,
    lat: node.lat,
    long: node.long,
    address: node.address,
    slot: node.slot,
    notes: node.notes,
    parent_id: node.parent_id,
    children_count: node._count.children,
    used_slot: usedSlotMap[node.id] || 0,
  }));

  const formattedServices = services.map((svc) => ({
    id: svc.id,
    customer_name: svc.customer.name,
    customer_phone: svc.customer.phone,
    package_name: svc.package_name,
    package_speed: svc.package_speed,
    status: svc.status,
    lat: svc.lat,
    long: svc.long,
    address: svc.address,
  }));

  responseData(res, 200, 'Topology berhasil diambil', {
    nodes: formattedNodes,
    links,
    services: formattedServices,
  });
});

/**
 * GET /api/network/nodes
 * List all nodes with optional type filter
 */
export const getNodes = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user || !user.tenant_id) {
    throw new AuthenticationError('Sesi tidak valid atau Tenant ID tidak ditemukan');
  }

  const query = nodeQuerySchema.parse(req.query);
  const tenant_id = user.tenant_id;

  const where: any = {
    tenant_id,
    deleted_at: null,
  };

  if (query.type) {
    where.type = query.type;
  }

  const [nodes, total] = await Promise.all([
    prisma.detso_Network_Node.findMany({
      where,
      select: {
        id: true,
        type: true,
        name: true,
        lat: true,
        long: true,
        address: true,
        slot: true,
        notes: true,
        parent_id: true,
        parent: {
          select: { id: true, name: true },
        },
        _count: {
          select: {
            children: { where: { deleted_at: null } },
            links_from: { where: { to_service_id: { not: null } } },
          },
        },
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.detso_Network_Node.count({ where }),
  ]);

  const formattedNodes = nodes.map((node) => ({
    id: node.id,
    type: node.type,
    name: node.name,
    lat: node.lat,
    long: node.long,
    address: node.address,
    slot: node.slot,
    notes: node.notes,
    parent_id: node.parent_id,
    parent_name: node.parent?.name || null,
    children_count: node._count.children,
    connected_services: node._count.links_from,
  }));

  responseData(res, 200, 'Nodes berhasil diambil', {
    nodes: formattedNodes,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      total_pages: Math.ceil(total / query.limit),
    },
  });
});

/**
 * GET /api/network/nodes/:id
 * Get node detail with connected links and services
 */
export const getNodeById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
      parent: {
        select: { id: true, name: true, type: true },
      },
      children: {
        where: { deleted_at: null },
        select: { id: true, name: true, type: true, lat: true, long: true, slot: true },
      },
      links_from: {
        select: {
          id: true,
          to_node_id: true,
          to_service_id: true,
          type: true,
          waypoints: true,
          notes: true,
          to_node: {
            select: { id: true, name: true, type: true },
          },
          to_service: {
            select: {
              id: true,
              address: true,
              status: true,
              package_name: true,
              lat: true,
              long: true,
              customer: {
                select: { id: true, name: true, phone: true },
              },
            },
          },
        },
      },
      links_to: {
        select: {
          id: true,
          from_node_id: true,
          type: true,
          waypoints: true,
          from_node: {
            select: { id: true, name: true, type: true },
          },
        },
      },
    },
  });

  if (!node) {
    throw new NotFoundError('Node tidak ditemukan');
  }

  responseData(res, 200, 'Node berhasil diambil', node);
});

/**
 * GET /api/network/links
 * List all links for the tenant
 */
export const getLinks = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user || !user.tenant_id) {
    throw new AuthenticationError('Sesi tidak valid atau Tenant ID tidak ditemukan');
  }

  const tenant_id = user.tenant_id;

  const links = await prisma.detso_Network_Link.findMany({
    where: {
      tenant_id,
      from_node: { deleted_at: null },
    },
    select: {
      id: true,
      from_node_id: true,
      to_node_id: true,
      to_service_id: true,
      type: true,
      waypoints: true,
      notes: true,
      from_node: {
        select: { id: true, name: true, type: true },
      },
      to_node: {
        select: { id: true, name: true, type: true },
      },
      to_service: {
        select: {
          id: true,
          address: true,
          customer: { select: { name: true } },
        },
      },
    },
    orderBy: { created_at: 'asc' },
  });

  responseData(res, 200, 'Links berhasil diambil', links);
});
