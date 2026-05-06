/**
 * Mikrotik Router CRUD Controller
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../utils/prisma';
import { log } from '../../config/logger.config';
import { successResponse } from '../../utils/response-handler';
import { ValidationError, NotFoundError, AuthorizationError } from '../../utils/error-handler';
import { encryptPassword, decryptPassword } from '../../utils/encryption';
import { mikrotikPool } from '../../services/mikrotik/connection-pool';
import { MikrotikService } from '../../services/mikrotik';
import {
  createRouterSchema,
  updateRouterSchema,
  type CreateRouterInput,
  type UpdateRouterInput,
} from './validation/validation.mikrotik';

/**
 * Get all routers for current tenant
 * GET /api/mikrotik/router
 */
export const getRouters = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenant_id;

    if (!tenantId) {
      throw new AuthorizationError('Tenant ID tidak ditemukan');
    }

    const routers = await prisma.detso_Mikrotik_Router.findMany({
      where: {
        tenant_id: tenantId,
        deleted_at: null,
      },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        name: true,
        host: true,
        api_port: true,
        api_username: true,
        is_active: true,
        is_online: true,
        last_seen_at: true,
        board_name: true,
        routeros_version: true,
        architecture: true,
        cpu_model: true,
        cpu_count: true,
        created_at: true,
        updated_at: true,
        // Don't return password
      },
    });

    return res.json(successResponse('Berhasil mengambil data router', routers));
  } catch (error) {
    next(error);
  }
};

/**
 * Get single router by ID
 * GET /api/mikrotik/router/:id
 */
export const getRouterById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const tenantId = req.user!.tenant_id;

    const router = await prisma.detso_Mikrotik_Router.findFirst({
      where: {
        id,
        tenant_id: tenantId!,
        deleted_at: null,
      },
      select: {
        id: true,
        name: true,
        host: true,
        api_port: true,
        api_username: true,
        is_active: true,
        is_online: true,
        last_seen_at: true,
        board_name: true,
        routeros_version: true,
        architecture: true,
        cpu_model: true,
        cpu_count: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!router) {
      throw new NotFoundError('Router tidak ditemukan');
    }

    return res.json(successResponse('Berhasil mengambil data router', router));
  } catch (error) {
    next(error);
  }
};

/**
 * Create new router
 * POST /api/mikrotik/router
 */
export const createRouter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenant_id;

    if (!tenantId) {
      throw new AuthorizationError('Tenant ID tidak ditemukan');
    }

    // Validate input
    const validated = createRouterSchema.parse(req.body) as CreateRouterInput;

    // Encrypt password
    const encryptedPassword = encryptPassword(validated.api_password);

    // Create router
    const router = await prisma.detso_Mikrotik_Router.create({
      data: {
        tenant_id: tenantId,
        name: validated.name,
        host: validated.host,
        api_port: validated.api_port,
        api_username: validated.api_username,
        api_password: encryptedPassword,
        is_active: validated.is_active,
      },
      select: {
        id: true,
        name: true,
        host: true,
        api_port: true,
        api_username: true,
        is_active: true,
        is_online: true,
        created_at: true,
      },
    });

    log.info('Router created', { routerId: router.id, tenantId, userId: req.user!.id });

    return res.status(201).json(successResponse('Router berhasil dibuat', router, 201));
  } catch (error) {
    next(error);
  }
};

/**
 * Update router
 * PUT /api/mikrotik/router/:id
 */
export const updateRouter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const tenantId = req.user!.tenant_id;

    // Check if router exists and belongs to tenant
    const existingRouter = await prisma.detso_Mikrotik_Router.findFirst({
      where: {
        id,
        tenant_id: tenantId!,
        deleted_at: null,
      },
    });

    if (!existingRouter) {
      throw new NotFoundError('Router tidak ditemukan');
    }

    // Validate input
    const validated = updateRouterSchema.parse(req.body) as UpdateRouterInput;

    // Prepare update data
    const updateData: any = { ...validated };

    // Encrypt password if provided
    if (validated.api_password) {
      updateData.api_password = encryptPassword(validated.api_password);
    }

    // Update router
    const router = await prisma.detso_Mikrotik_Router.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        host: true,
        api_port: true,
        api_username: true,
        is_active: true,
        is_online: true,
        updated_at: true,
      },
    });

    // Remove connection from pool if config changed
    if (validated.host || validated.api_port || validated.api_username || validated.api_password) {
      await mikrotikPool.removeConnection(id);
    }

    log.info('Router updated', { routerId: id, tenantId, userId: req.user!.id });

    return res.json(successResponse('Router berhasil diupdate', router));
  } catch (error) {
    next(error);
  }
};

/**
 * Delete router (soft delete)
 * DELETE /api/mikrotik/router/:id
 */
export const deleteRouter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const tenantId = req.user!.tenant_id;

    // Check if router exists and belongs to tenant
    const existingRouter = await prisma.detso_Mikrotik_Router.findFirst({
      where: {
        id,
        tenant_id: tenantId!,
        deleted_at: null,
      },
    });

    if (!existingRouter) {
      throw new NotFoundError('Router tidak ditemukan');
    }

    // Soft delete
    await prisma.detso_Mikrotik_Router.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    // Remove connection from pool
    await mikrotikPool.removeConnection(id);

    log.info('Router deleted', { routerId: id, tenantId, userId: req.user!.id });

    return res.json(successResponse('Router berhasil dihapus'));
  } catch (error) {
    next(error);
  }
};

/**
 * Test router connection
 * POST /api/mikrotik/router/:id/test
 */
export const testRouterConnection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const tenantId = req.user!.tenant_id;

    // Get router
    const router = await prisma.detso_Mikrotik_Router.findFirst({
      where: {
        id,
        tenant_id: tenantId!,
        deleted_at: null,
      },
    });

    if (!router) {
      throw new NotFoundError('Router tidak ditemukan');
    }

    // Test connection
    const service = new MikrotikService({
      host: router.host,
      port: router.api_port,
      username: router.api_username,
      password: decryptPassword(router.api_password),
    });

    const result = await service.testConnection();

    if (result.success) {
      return res.json(successResponse('Koneksi berhasil', { success: true }));
    } else {
      return res.status(400).json({
        success: false,
        message: 'Koneksi gagal',
        errors: [result.error],
      });
    }
  } catch (error) {
    next(error);
  }
};
