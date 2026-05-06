/**
 * Mikrotik Service Types
 */

export interface MikrotikConnectionConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  timeout?: number;
}

export interface SystemResource {
  uptime: string;
  version: string;
  'build-time': string;
  'factory-software': string;
  'free-memory': number;
  'total-memory': number;
  cpu: string;
  'cpu-count': number;
  'cpu-frequency': number;
  'cpu-load': number;
  'free-hdd-space': number;
  'total-hdd-space': number;
  'architecture-name': string;
  'board-name': string;
  platform: string;
}

export interface InterfaceInfo {
  '.id': string;
  name: string;
  type: string;
  mtu: number;
  'mac-address'?: string;
  running: boolean;
  disabled: boolean;
  'rx-byte': number;
  'tx-byte': number;
  'rx-packet': number;
  'tx-packet': number;
  'rx-error': number;
  'tx-error': number;
  'rx-drop': number;
  'tx-drop': number;
}

export interface InterfaceTraffic {
  name: string;
  'rx-bits-per-second': number;
  'tx-bits-per-second': number;
  'rx-packets-per-second': number;
  'tx-packets-per-second': number;
}

export interface PPPoESession {
  '.id': string;
  name: string;
  service: string;
  'caller-id': string;
  address: string;
  uptime: string;
  encoding?: string;
  'session-id'?: string;
  'limit-bytes-in'?: number;
  'limit-bytes-out'?: number;
}

export interface SystemHealth {
  temperature?: number;
  voltage?: number;
  'psu1-state'?: string;
  'psu2-state'?: string;
}

export interface SystemIdentity {
  name: string;
}

export interface MikrotikError extends Error {
  code?: string;
  category?: 'connection' | 'authentication' | 'command' | 'timeout' | 'unknown';
}
