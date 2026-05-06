import { z } from 'zod';

// Create Router Schema
export const createRouterSchema = z.object({
  name: z.string().min(3, 'Nama router minimal 3 karakter'),
  host: z.string().min(1, 'Host tidak boleh kosong'),
  api_port: z.number().int().min(1).max(65535).default(8728),
  api_username: z.string().min(1, 'Username tidak boleh kosong'),
  api_password: z.string().min(1, 'Password tidak boleh kosong'),
  is_active: z.boolean().default(true),
});

// Update Router Schema
export const updateRouterSchema = z.object({
  name: z.string().min(3).optional(),
  host: z.string().min(1).optional(),
  api_port: z.number().int().min(1).max(65535).optional(),
  api_username: z.string().min(1).optional(),
  api_password: z.string().min(1).optional(),
  is_active: z.boolean().optional(),
});

export type CreateRouterInput = z.infer<typeof createRouterSchema>;
export type UpdateRouterInput = z.infer<typeof updateRouterSchema>;

// Response Types
export interface MikrotikRouter {
  id: string;
  name: string;
  host: string;
  api_port: number;
  api_username: string;
  is_active: boolean;
  is_online: boolean;
  last_seen_at: string | null;
  board_name: string | null;
  routeros_version: string | null;
  architecture: string | null;
  cpu_model: string | null;
  cpu_count: number | null;
  created_at: string;
  updated_at: string;
}

export interface MonitoringData {
  id: string;
  router_id: string;
  cpu_load: number;
  memory_used: string; // BigInt as string
  memory_total: string;
  disk_used: string;
  disk_total: string;
  uptime: string;
  active_sessions: number;
  temperature: number | null;
  voltage: number | null;
  recorded_at: string;
}

export interface InterfaceData {
  id: string;
  router_id: string;
  interface_name: string;
  interface_type: string;
  mac_address: string | null;
  mtu: number | null;
  is_running: boolean;
  is_disabled: boolean;
  rx_bytes: string;
  tx_bytes: string;
  rx_packets: string;
  tx_packets: string;
  rx_errors: number;
  tx_errors: number;
  rx_drops: number;
  tx_drops: number;
  rx_bps: string;
  tx_bps: string;
  recorded_at: string;
}

export interface CurrentMonitoringResponse {
  router: {
    id: string;
    name: string;
    is_online: boolean;
    last_seen_at: string | null;
  };
  monitoring: MonitoringData | null;
  interfaces: InterfaceData[];
}
