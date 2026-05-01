import { z } from 'zod';

// ─── Node Schemas ────────────────────────────────────────────────

export const createNodeSchema = z.object({
  type: z.enum(['SERVER', 'ODP']),
  name: z.string().min(1, 'Nama node harus diisi').max(100),
  lat: z.string().min(1, 'Latitude harus diisi'),
  long: z.string().min(1, 'Longitude harus diisi'),
  address: z.string().max(255).optional().nullable(),
  slot: z.number().int().min(1).max(256).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  parent_id: z.string().min(1).optional().nullable(),
}).refine((data) => {
  // ODP wajib punya parent_id (Server)
  if (data.type === 'ODP' && !data.parent_id) {
    return false;
  }
  return true;
}, {
  message: 'ODP harus memiliki parent Server',
  path: ['parent_id'],
}).refine((data) => {
  // SERVER tidak boleh punya parent_id
  if (data.type === 'SERVER' && data.parent_id) {
    return false;
  }
  return true;
}, {
  message: 'Server tidak boleh memiliki parent',
  path: ['parent_id'],
});

export const editNodeSchema = z.object({
  name: z.string().min(1, 'Nama node harus diisi').max(100).optional(),
  lat: z.string().min(1).optional(),
  long: z.string().min(1).optional(),
  address: z.string().max(255).optional().nullable(),
  slot: z.number().int().min(1).max(256).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  parent_id: z.string().min(1).optional().nullable(),
});

// ─── Link Schemas ────────────────────────────────────────────────

export const createLinkSchema = z.object({
  from_node_id: z.string().min(1, 'from_node_id harus diisi'),
  to_node_id: z.string().min(1).optional().nullable(),
  to_service_id: z.string().min(1).optional().nullable(),
  type: z.enum(['FIBER', 'DROP_CABLE']),
  waypoints: z.array(z.array(z.number()).length(2)).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
}).refine((data) => {
  // Harus punya salah satu: to_node_id atau to_service_id
  if (!data.to_node_id && !data.to_service_id) {
    return false;
  }
  return true;
}, {
  message: 'Harus memiliki tujuan (to_node_id atau to_service_id)',
  path: ['to_node_id'],
}).refine((data) => {
  // Tidak boleh punya keduanya
  if (data.to_node_id && data.to_service_id) {
    return false;
  }
  return true;
}, {
  message: 'Hanya boleh memiliki satu tujuan (to_node_id ATAU to_service_id)',
  path: ['to_service_id'],
});

export const editLinkSchema = z.object({
  waypoints: z.array(z.array(z.number()).length(2)).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  type: z.enum(['FIBER', 'DROP_CABLE']).optional(),
});

// ─── Query Schemas ───────────────────────────────────────────────

export const nodeQuerySchema = z.object({
  type: z.enum(['SERVER', 'ODP']).optional(),
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('100').transform(Number),
});
