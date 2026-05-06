/**
 * Mikrotik Validation Schemas
 */

import { z } from 'zod';

// Create Router Schema
export const createRouterSchema = z.object({
  name: z.string().min(3, 'Nama router minimal 3 karakter').max(100, 'Nama router maksimal 100 karakter'),
  host: z.string().min(1, 'Host tidak boleh kosong'),
  api_port: z.number().int().min(1).max(65535).default(8728),
  api_username: z.string().min(1, 'Username tidak boleh kosong'),
  api_password: z.string().min(1, 'Password tidak boleh kosong'),
  is_active: z.boolean().default(true),
});

// Update Router Schema
export const updateRouterSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  host: z.string().min(1).optional(),
  api_port: z.number().int().min(1).max(65535).optional(),
  api_username: z.string().min(1).optional(),
  api_password: z.string().min(1).optional(),
  is_active: z.boolean().optional(),
});

// Get Historical Data Query Schema
export const historicalDataQuerySchema = z.object({
  hours: z.string().optional().transform(val => parseInt(val || '24', 10)).pipe(z.number().int().min(1).max(720)),
});

// Router ID Param Schema
export const routerIdParamSchema = z.object({
  id: z.string().min(1, 'Router ID tidak boleh kosong'),
});

export type CreateRouterInput = z.infer<typeof createRouterSchema>;
export type UpdateRouterInput = z.infer<typeof updateRouterSchema>;
export type HistoricalDataQuery = z.infer<typeof historicalDataQuerySchema>;
export type RouterIdParam = z.infer<typeof routerIdParamSchema>;
