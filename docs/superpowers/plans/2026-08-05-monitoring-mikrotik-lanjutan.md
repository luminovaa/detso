# Monitoring Mikrotik Lanjutan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menghidupkan data monitoring Mikrotik yang masih dummy (sesi PPPoE, suhu, bps) dan menambah layar sesi PPPoE + grafik riwayat di mobile.

**Architecture:** Poller backend (`pollRouter`) mengambil sesi PPPoE dan health dengan guard try/catch per fetch, menghitung bps dari delta byte counter antar poll (fungsi murni `computeBps`), dan memakai satu `recorded_at` bersama per siklus. Endpoint baru mengembalikan sesi PPPoE live dari router tanpa tabel baru. Mobile menambah StatCard suhu, layar `/monitoring/[id]/pppoe`, dan layar `/monitoring/[id]/history` dengan chart dari data endpoint `/history` yang sudah ada.

**Tech Stack:** Backend: Express 4 + TS + Prisma 7 + node-routeros; jest + ts-jest (infra baru). Mobile: Expo 54 + React Native 0.81 + @tanstack/react-query 5 + jest-expo; `react-native-gifted-charts` (+ `react-native-svg`, `expo-linear-gradient`) baru.

**Spec:** `docs/superpowers/specs/2026-08-05-monitoring-mikrotik-lanjutan-design.md`

**Branch:** kerjakan di `feature/mobile-track` (lanjutan mobile track). Semua perintah dijalankan dari root repo (`/home/luminova/project/detso`) kecuali disebut lain.

## Global Constraints

- TANPA perubahan schema Prisma dan TANPA tabel baru (kolom `active_sessions`, `temperature`, `voltage`, `rx_bps`, `tx_bps`, `recorded_at` sudah ada).
- bps HANYA via delta counter; `/interface/monitor-traffic` dibiarkan sebagai stub.
- Hook `usePPPoESessions` TANPA `refetchInterval` — tiap fetch membuka koneksi live ke router.
- Semua teks UI baru masuk grup `monitoring` di KEDUA locale: `detso-mobile/src/locales/id.json` dan `en.json`.
- Mobile: `api` adalah DEFAULT export dari `@/src/lib/api`; theme via `useThemeColor()` (singular) dari `@/src/lib/theme-colors`; i18n via `useT()` dari `@/src/features/i18n/store`.
- Fetch per jenis data di `pollRouter` dibungkus try/catch sendiri (pola `getInterfaces`) — kegagalan satu jenis tidak menggagalkan poll.
- Jangan menulis nilai secret/token penuh ke log, commit, atau laporan.
- Suite yang sudah ada harus tetap hijau: mobile 4 suite / 21 test (jest-expo), `npx tsc --noEmit` bersih di backend dan mobile.

---

### Task 1: Infra jest backend + `computeBps` (TDD)

**Files:**
- Modify: `backend/package.json` (script `test`, devDependencies)
- Create: `backend/jest.config.js`
- Modify: `backend/tsconfig.json` (exclude test files dari build)
- Create: `backend/src/services/mikrotik/traffic.ts`
- Test: `backend/src/services/mikrotik/traffic.test.ts`

**Interfaces:**
- Consumes: —
- Produces: `computeBps(prevBytes: bigint, currBytes: bigint, dtSeconds: number): bigint` dari `backend/src/services/mikrotik/traffic.ts` (dipakai Task 2).

- [ ] **Step 1: Install dev dependencies**

```bash
cd backend && npm install --save-dev jest@^29.7.0 ts-jest@^29.2.5 @types/jest@^29.5.14
```

- [ ] **Step 2: Buat `backend/jest.config.js`**

Backend `package.json` tidak punya `"type": "module"`, jadi file config CommonJS. tsconfig proyek memakai `module: ESNext` + `moduleResolution: bundler` yang tidak dimengerti jest — override khusus transform test:

```js
/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      { tsconfig: { module: 'commonjs', moduleResolution: 'node' } },
    ],
  },
  testMatch: ['<rootDir>/src/**/*.test.ts'],
};
```

- [ ] **Step 3: Update `backend/package.json` script test**

Ganti `"test": "echo \"Error: no test specified\" && exit 1"` menjadi:

```json
"test": "jest"
```

- [ ] **Step 4: Exclude file test dari build tsc**

Di `backend/tsconfig.json`, ganti `"exclude": ["node_modules", "dist"]` menjadi:

```json
"exclude": ["node_modules", "dist", "**/*.test.ts"]
```

- [ ] **Step 5: Tulis failing test `backend/src/services/mikrotik/traffic.test.ts`**

```typescript
import { computeBps } from './traffic';

describe('computeBps', () => {
  it('computes average bps from a byte delta', () => {
    // 15_000 bytes in 15s = 1_000 B/s = 8_000 bps
    expect(computeBps(BigInt(1_000_000), BigInt(1_015_000), 15)).toBe(BigInt(8000));
  });

  it('rounds fractional results', () => {
    // 100 bytes in 15s = 53.33... bps
    expect(computeBps(BigInt(0), BigInt(100), 15)).toBe(BigInt(53));
  });

  it('returns 0 when counters reset (negative delta)', () => {
    expect(computeBps(BigInt(5_000_000), BigInt(1_000), 15)).toBe(BigInt(0));
  });

  it('returns 0 for zero or negative dt', () => {
    expect(computeBps(BigInt(0), BigInt(1_000), 0)).toBe(BigInt(0));
    expect(computeBps(BigInt(0), BigInt(1_000), -5)).toBe(BigInt(0));
  });

  it('returns 0 for non-finite dt', () => {
    expect(computeBps(BigInt(0), BigInt(1_000), Number.NaN)).toBe(BigInt(0));
    expect(computeBps(BigInt(0), BigInt(1_000), Number.POSITIVE_INFINITY)).toBe(BigInt(0));
  });

  it('handles gigabyte-scale deltas beyond 32-bit range', () => {
    // 6 GB in 15s = 3.2 Gbps
    const prev = BigInt('100000000000');
    const curr = BigInt('106000000000');
    expect(computeBps(prev, curr, 15)).toBe(BigInt(3_200_000_000));
  });
});
```

- [ ] **Step 6: Jalankan test, pastikan GAGAL**

Run: `cd backend && npm test`
Expected: FAIL — `Cannot find module './traffic'`

- [ ] **Step 7: Implementasi `backend/src/services/mikrotik/traffic.ts`**

```typescript
/**
 * Average bits-per-second from the delta of cumulative byte counters
 * between two polls. Returns 0 for invalid dt or a counter reset
 * (negative delta, e.g. after a router reboot).
 */
export function computeBps(prevBytes: bigint, currBytes: bigint, dtSeconds: number): bigint {
  if (!Number.isFinite(dtSeconds) || dtSeconds <= 0) return BigInt(0);
  if (currBytes < prevBytes) return BigInt(0);
  const deltaBytes = Number(currBytes - prevBytes);
  return BigInt(Math.round((deltaBytes * 8) / dtSeconds));
}
```

- [ ] **Step 8: Jalankan test, pastikan LULUS**

Run: `cd backend && npm test`
Expected: PASS — 6 test hijau

- [ ] **Step 9: Cek type**

Run: `cd backend && npx tsc --noEmit`
Expected: bersih (exit 0)

- [ ] **Step 10: Commit**

```bash
git add backend/package.json backend/package-lock.json backend/jest.config.js backend/tsconfig.json backend/src/services/mikrotik/traffic.ts backend/src/services/mikrotik/traffic.test.ts
git commit -m "feat(backend): add jest infra and computeBps for interface traffic"
```

---

### Task 2: Poller nyata — PPPoE, health, `recorded_at` bersama, bps delta

**Files:**
- Modify: `backend/src/services/mikrotik/monitoring.service.ts` (method `pollRouter`, saat ini baris 15-146)

**Interfaces:**
- Consumes: `computeBps(prevBytes: bigint, currBytes: bigint, dtSeconds: number): bigint` dari `./traffic` (Task 1); `getPPPoEActiveSessions(): Promise<PPPoESession[]>` dan `getSystemHealth(): Promise<SystemHealth | null>` yang SUDAH ADA di `./mikrotik.service`; tipe `PPPoESession`, `SystemHealth` dari `./types`.
- Produces: record `Detso_Mikrotik_Monitoring` dengan `active_sessions`/`temperature`/`voltage` nyata; record `Detso_Mikrotik_Interface` dengan `rx_bps`/`tx_bps` nyata; SEMUA record satu siklus poll memakai `recorded_at` yang sama (diandalkan `getCurrentMonitoring` yang join berdasarkan kesamaan `recorded_at`).

- [ ] **Step 1: Tambah import di `monitoring.service.ts`**

Setelah baris `import { decryptPassword } from '../../utils/encryption';` tambahkan:

```typescript
import { computeBps } from './traffic';
import type { PPPoESession, SystemHealth } from './types';
```

- [ ] **Step 2: Ganti isi blok `try` dalam `pollRouter`**

Ganti seluruh isi blok `try { await service.connect(); ... }` (mulai `await service.connect();` sampai sebelum `} finally {`) dengan:

```typescript
        await service.connect();

        // Fetch system resources (required)
        const resource = await service.getSystemResource();

        // Fetch interfaces - wrap in try/catch because some CHR versions
        // return !empty which crashes node-routeros
        let interfaces: any[] = [];
        try {
          interfaces = await service.getInterfaces();
        } catch (e) {
          log.debug('Failed to fetch interfaces', { routerId, error: String(e) });
        }

        // PPPoE and health use the same per-fetch guard as interfaces
        let pppoeSessions: PPPoESession[] = [];
        try {
          pppoeSessions = await service.getPPPoEActiveSessions();
        } catch (e) {
          log.debug('Failed to fetch PPPoE sessions', { routerId, error: String(e) });
        }

        let health: SystemHealth | null = null;
        try {
          health = await service.getSystemHealth();
        } catch (e) {
          log.debug('Failed to fetch system health', { routerId, error: String(e) });
        }

        // One shared timestamp per poll cycle: getCurrentMonitoring joins
        // interface rows to the monitoring row on recorded_at equality
        const recordedAt = new Date();

        // Previous interface snapshot for the bps delta
        const prevLatest = await prisma.detso_Mikrotik_Interface.findFirst({
          where: { router_id: routerId },
          orderBy: { recorded_at: 'desc' },
          select: { recorded_at: true },
        });
        const prevInterfaces = prevLatest
          ? await prisma.detso_Mikrotik_Interface.findMany({
              where: { router_id: routerId, recorded_at: prevLatest.recorded_at },
              select: {
                interface_name: true,
                rx_bytes: true,
                tx_bytes: true,
                recorded_at: true,
              },
            })
          : [];
        const prevByName = new Map<string, (typeof prevInterfaces)[number]>();
        for (const p of prevInterfaces) {
          prevByName.set(p.interface_name, p);
        }

        // Store monitoring data
        // Note: Mikrotik API returns all values as strings, so we need to parse them
        const cpuLoad = parseFloat(String(resource['cpu-load'])) || 0;
        const totalMemory = parseInt(String(resource['total-memory']), 10) || 0;
        const freeMemory = parseInt(String(resource['free-memory']), 10) || 0;
        const totalDisk = parseInt(String(resource['total-hdd-space']), 10) || 0;
        const freeDisk = parseInt(String(resource['free-hdd-space']), 10) || 0;

        await prisma.detso_Mikrotik_Monitoring.create({
          data: {
            router_id: routerId,
            cpu_load: cpuLoad,
            memory_used: BigInt(totalMemory - freeMemory),
            memory_total: BigInt(totalMemory),
            disk_used: BigInt(totalDisk - freeDisk),
            disk_total: BigInt(totalDisk),
            uptime: String(resource.uptime || ''),
            active_sessions: pppoeSessions.length,
            temperature: health?.temperature != null ? parseFloat(String(health.temperature)) : null,
            voltage: health?.voltage != null ? parseFloat(String(health.voltage)) : null,
            recorded_at: recordedAt,
          },
        });

        // Store interface data
        // Note: Mikrotik API returns all values as strings
        const interfaceRecords = interfaces
          .filter((iface: any) => iface.type !== 'loopback') // Skip loopback
          .map((iface: any) => {
            const interfaceName = String(iface.name || '');
            const rxBytes = BigInt(String(iface['rx-byte'] || '0'));
            const txBytes = BigInt(String(iface['tx-byte'] || '0'));
            const prev = prevByName.get(interfaceName);
            const dtSeconds = prev
              ? (recordedAt.getTime() - prev.recorded_at.getTime()) / 1000
              : 0;
            return {
              router_id: routerId,
              interface_name: interfaceName,
              interface_type: String(iface.type || ''),
              mac_address: iface['mac-address'] ? String(iface['mac-address']) : null,
              mtu: iface.mtu ? parseInt(String(iface.mtu), 10) : null,
              is_running: iface.running === 'true' || iface.running === true,
              is_disabled: iface.disabled === 'true' || iface.disabled === true,
              rx_bytes: rxBytes,
              tx_bytes: txBytes,
              rx_packets: BigInt(String(iface['rx-packet'] || '0')),
              tx_packets: BigInt(String(iface['tx-packet'] || '0')),
              rx_errors: parseInt(String(iface['rx-error'] || '0'), 10),
              tx_errors: parseInt(String(iface['tx-error'] || '0'), 10),
              rx_drops: parseInt(String(iface['rx-drop'] || '0'), 10),
              tx_drops: parseInt(String(iface['tx-drop'] || '0'), 10),
              rx_bps: prev ? computeBps(prev.rx_bytes, rxBytes, dtSeconds) : BigInt(0),
              tx_bps: prev ? computeBps(prev.tx_bytes, txBytes, dtSeconds) : BigInt(0),
              recorded_at: recordedAt,
            };
          });

        if (interfaceRecords.length > 0) {
          await prisma.detso_Mikrotik_Interface.createMany({
            data: interfaceRecords,
          });
        }

        // Update router status
        await prisma.detso_Mikrotik_Router.update({
          where: { id: routerId },
          data: {
            is_online: true,
            last_seen_at: new Date(),
            board_name: String(resource['board-name'] || ''),
            routeros_version: String(resource.version || ''),
            architecture: String(resource['architecture-name'] || ''),
            cpu_model: String(resource.cpu || ''),
            cpu_count: parseInt(String(resource['cpu-count']), 10) || null,
          },
        });

        log.debug('Router polled successfully', {
          routerId,
          cpu: resource['cpu-load'],
          memory: `${((resource['total-memory'] - resource['free-memory']) / resource['total-memory'] * 100).toFixed(1)}%`,
          sessions: pppoeSessions.length,
        });
```

Yang berubah dari kode lama: (a) `pppoeSessions`/`health` di-fetch nyata dengan guard, bukan hardcode `[]`/`null`; (b) `recordedAt` bersama, disimpan eksplisit di record monitoring dan interface; (c) dua query snapshot sebelumnya + `computeBps` menggantikan `rx_bps: BigInt(0)`; (d) `health?.temperature != null` (bukan truthy — suhu string `"0"` tetap terparse). Sisanya identik dengan kode lama.

- [ ] **Step 3: Cek type**

Run: `cd backend && npx tsc --noEmit`
Expected: bersih

- [ ] **Step 4: Jalankan test backend**

Run: `cd backend && npm test`
Expected: PASS — test `computeBps` Task 1 tetap hijau

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/mikrotik/monitoring.service.ts
git commit -m "feat(backend): poll real PPPoE sessions, health, and bps delta per interface"
```

---

### Task 3: Mapper PPPoE (TDD) + endpoint sesi live

**Files:**
- Create: `backend/src/services/mikrotik/pppoe.ts`
- Test: `backend/src/services/mikrotik/pppoe.test.ts`
- Modify: `backend/src/controller/mikrotik/monitoring.controller.ts` (import + handler baru di akhir file)
- Modify: `backend/src/controller/mikrotik/index.ts` (route baru)

**Interfaces:**
- Consumes: `MikrotikService` dari `../../services/mikrotik/mikrotik.service`; `decryptPassword` dari `../../utils/encryption`; `successResponse`/`NotFoundError` (sudah di-import controller); tipe `PPPoESession` dari `./types`.
- Produces: `mapPPPoESessions(sessions: PPPoESession[] | null | undefined): PPPoESessionResponse[]` dengan `PPPoESessionResponse = { id: string; name: string; service: string; caller_id: string | null; address: string | null; uptime: string | null }`; endpoint `GET /api/mikrotik/monitoring/:router_id/pppoe` dengan body `{ router: { id, name }, sessions: PPPoESessionResponse[] }` (dipakai Task 5).

- [ ] **Step 1: Tulis failing test `backend/src/services/mikrotik/pppoe.test.ts`**

```typescript
import { mapPPPoESessions } from './pppoe';
import { PPPoESession } from './types';

describe('mapPPPoESessions', () => {
  it('maps RouterOS keys to snake_case response fields', () => {
    const raw = [{
      '.id': '*1',
      name: 'pelanggan-01',
      service: 'pppoe',
      'caller-id': '00:0C:42:12:34:56',
      address: '10.10.0.5',
      uptime: '1d2h3m4s',
    }] as unknown as PPPoESession[];

    expect(mapPPPoESessions(raw)).toEqual([{
      id: '*1',
      name: 'pelanggan-01',
      service: 'pppoe',
      caller_id: '00:0C:42:12:34:56',
      address: '10.10.0.5',
      uptime: '1d2h3m4s',
    }]);
  });

  it('fills missing optional fields with null', () => {
    const raw = [{ '.id': '*2', name: 'x', service: 'pppoe' }] as unknown as PPPoESession[];
    expect(mapPPPoESessions(raw)[0]).toEqual({
      id: '*2',
      name: 'x',
      service: 'pppoe',
      caller_id: null,
      address: null,
      uptime: null,
    });
  });

  it('returns [] for empty, null, or undefined input', () => {
    expect(mapPPPoESessions([])).toEqual([]);
    expect(mapPPPoESessions(null)).toEqual([]);
    expect(mapPPPoESessions(undefined)).toEqual([]);
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan GAGAL**

Run: `cd backend && npm test`
Expected: FAIL — `Cannot find module './pppoe'`

- [ ] **Step 3: Implementasi `backend/src/services/mikrotik/pppoe.ts`**

```typescript
import { PPPoESession } from './types';

export interface PPPoESessionResponse {
  id: string;
  name: string;
  service: string;
  caller_id: string | null;
  address: string | null;
  uptime: string | null;
}

/**
 * Map raw RouterOS /ppp/active entries (kebab-case keys, string values)
 * to the API response shape.
 */
export function mapPPPoESessions(
  sessions: PPPoESession[] | null | undefined,
): PPPoESessionResponse[] {
  return (sessions || []).map((s) => ({
    id: String(s['.id'] || ''),
    name: String(s.name || ''),
    service: String(s.service || ''),
    caller_id: s['caller-id'] ? String(s['caller-id']) : null,
    address: s.address ? String(s.address) : null,
    uptime: s.uptime ? String(s.uptime) : null,
  }));
}
```

- [ ] **Step 4: Jalankan test, pastikan LULUS**

Run: `cd backend && npm test`
Expected: PASS — 9 test (6 traffic + 3 pppoe)

- [ ] **Step 5: Tambah handler di `monitoring.controller.ts`**

Tambah import setelah baris `import { historicalDataQuerySchema } from './validation/validation.mikrotik';`:

```typescript
import { MikrotikService } from '../../services/mikrotik/mikrotik.service';
import { decryptPassword } from '../../utils/encryption';
import { mapPPPoESessions } from '../../services/mikrotik/pppoe';
```

Tambah handler di akhir file:

```typescript
/**
 * Get live PPPoE sessions straight from the router
 * GET /api/mikrotik/monitoring/:router_id/pppoe
 */
export const getPPPoESessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const router_id = req.params.router_id as string;
    const tenantId = req.user!.tenant_id;

    // Verify router belongs to tenant
    const router = await prisma.detso_Mikrotik_Router.findFirst({
      where: {
        id: router_id,
        tenant_id: tenantId!,
        deleted_at: null,
      },
    });

    if (!router) {
      throw new NotFoundError('Router tidak ditemukan');
    }

    // Fresh connection per request (same pattern as pollRouter)
    const service = new MikrotikService({
      host: router.host,
      port: router.api_port,
      username: router.api_username,
      password: decryptPassword(router.api_password),
      timeout: 15,
    });

    try {
      await service.connect();
      const sessions = await service.getPPPoEActiveSessions();
      return res.json(successResponse('Berhasil mengambil sesi PPPoE', {
        router: { id: router.id, name: router.name },
        sessions: mapPPPoESessions(sessions),
      }));
    } finally {
      await service.disconnect();
    }
  } catch (error) {
    next(error);
  }
};
```

- [ ] **Step 6: Daftarkan route di `controller/mikrotik/index.ts`**

Tambah `getPPPoESessions` ke import dari `./monitoring.controller`:

```typescript
import {
  getCurrentMonitoring,
  getHistoricalMonitoring,
  getInterfaceStats,
  forcePollRouter,
  getPPPoESessions,
} from './monitoring.controller';
```

Tambah route setelah `router.post('/monitoring/:router_id/poll', forcePollRouter);`:

```typescript
// Get live PPPoE sessions
router.get('/monitoring/:router_id/pppoe', getPPPoESessions);
```

- [ ] **Step 7: Cek type + test**

Run: `cd backend && npx tsc --noEmit && npm test`
Expected: tsc bersih, 9 test PASS

- [ ] **Step 8: Commit**

```bash
git add backend/src/services/mikrotik/pppoe.ts backend/src/services/mikrotik/pppoe.test.ts backend/src/controller/mikrotik/monitoring.controller.ts backend/src/controller/mikrotik/index.ts
git commit -m "feat(backend): add live PPPoE sessions endpoint"
```

---

### Task 4: Mobile lib murni — `formatTemperature` + `downsample` (TDD)

**Files:**
- Modify: `detso-mobile/src/lib/format.ts`
- Modify: `detso-mobile/src/lib/__tests__/format.test.ts` (tambah describe block + update import)
- Create: `detso-mobile/src/lib/downsample.ts`
- Test: `detso-mobile/src/lib/__tests__/downsample.test.ts`

**Interfaces:**
- Consumes: —
- Produces: `formatTemperature(value: unknown): string` dari `@/src/lib/format` (dipakai Task 7); `downsample<T>(points: T[], target: number): T[]` dari `@/src/lib/downsample` (dipakai Task 6).

- [ ] **Step 1: Tulis failing test**

Di `detso-mobile/src/lib/__tests__/format.test.ts`: tambahkan `formatTemperature` ke import yang sudah ada dari `'../format'`, lalu tambah describe block di akhir file:

```typescript
describe('formatTemperature', () => {
  it('formats a numeric temperature with °C', () => {
    expect(formatTemperature(36)).toBe('36°C');
    expect(formatTemperature(36.6)).toBe('37°C');
  });

  it('accepts numeric strings', () => {
    expect(formatTemperature('41')).toBe('41°C');
  });

  it('returns "-" for null, undefined, and non-numeric values', () => {
    expect(formatTemperature(null)).toBe('-');
    expect(formatTemperature(undefined)).toBe('-');
    expect(formatTemperature('abc')).toBe('-');
  });
});
```

Buat `detso-mobile/src/lib/__tests__/downsample.test.ts`:

```typescript
import { downsample } from '../downsample';

describe('downsample', () => {
  it('returns [] for target <= 0', () => {
    expect(downsample([1, 2, 3], 0)).toEqual([]);
    expect(downsample([1, 2, 3], -1)).toEqual([]);
  });

  it('returns input unchanged when it fits the target', () => {
    expect(downsample([], 120)).toEqual([]);
    expect(downsample([1, 2, 3], 3)).toEqual([1, 2, 3]);
    expect(downsample([1, 2], 120)).toEqual([1, 2]);
  });

  it('reduces to the target length and keeps first and last points', () => {
    const points = Array.from({ length: 5760 }, (_, i) => i);
    const result = downsample(points, 120);
    expect(result).toHaveLength(120);
    expect(result[0]).toBe(0);
    expect(result[result.length - 1]).toBe(5759);
  });

  it('keeps chronological order', () => {
    const points = Array.from({ length: 1000 }, (_, i) => i);
    const result = downsample(points, 120);
    const sorted = [...result].sort((a, b) => a - b);
    expect(result).toEqual(sorted);
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan GAGAL**

Run: `cd detso-mobile && npm test -- src/lib/__tests__`
Expected: FAIL — `formatTemperature` bukan export dari `../format`; `Cannot find module '../downsample'`

- [ ] **Step 3: Implementasi**

Tambah di akhir `detso-mobile/src/lib/format.ts`:

```typescript
export function formatTemperature(value: unknown): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isFinite(n)) return '-';
  return `${Math.round(n)}°C`;
}
```

Buat `detso-mobile/src/lib/downsample.ts`:

```typescript
/**
 * Pick ~target evenly spaced points; always keeps the newest (last) point.
 * Returns the input array untouched when it already fits the target.
 */
export function downsample<T>(points: T[], target: number): T[] {
  if (target <= 0) return [];
  if (points.length <= target) return points;
  const step = points.length / target;
  const result: T[] = [];
  for (let i = 0; i < target; i++) {
    result.push(points[Math.floor(i * step)]);
  }
  result[result.length - 1] = points[points.length - 1];
  return result;
}
```

- [ ] **Step 4: Jalankan test, pastikan LULUS**

Run: `cd detso-mobile && npm test`
Expected: PASS — seluruh suite (termasuk 21 test lama) hijau

- [ ] **Step 5: Cek type + commit**

Run: `cd detso-mobile && npx tsc --noEmit`
Expected: bersih

```bash
git add detso-mobile/src/lib/format.ts detso-mobile/src/lib/downsample.ts detso-mobile/src/lib/__tests__/format.test.ts detso-mobile/src/lib/__tests__/downsample.test.ts
git commit -m "feat(mobile): add formatTemperature and downsample helpers"
```

---

### Task 5: Mobile — slice sesi PPPoE (data layer + layar + i18n)

**Files:**
- Modify: `detso-mobile/src/features/mikrotik/schema.ts` (tipe baru di akhir file)
- Modify: `detso-mobile/src/features/mikrotik/service.ts` (method baru)
- Modify: `detso-mobile/src/features/mikrotik/hooks.ts` (query key + hook baru)
- Create: `detso-mobile/src/components/screens/monitoring/pppoe-sessions.tsx`
- Create: `detso-mobile/app/monitoring/[id]/pppoe.tsx`
- Modify: `detso-mobile/src/locales/id.json`, `detso-mobile/src/locales/en.json` (grup `monitoring`)

**Interfaces:**
- Consumes: endpoint `GET /mikrotik/monitoring/:router_id/pppoe` (Task 3) yang membalas `{ success, message, data: { router: {id, name}, sessions: [...] } }`; `api` default export dari `@/src/lib/api`; `EmptyState` dari `@/src/components/global/empty-state` (props: `icon`, `title`, `description`, `actionLabel`, `onAction`, `isLoading`).
- Produces: `usePPPoESessions(routerId: string)`, `mikrotikKeys.pppoe(routerId)`, tipe `PPPoESessionData`/`PPPoESessionsResponse`, route `/monitoring/[id]/pppoe` (dipakai Task 7 untuk navigasi).

- [ ] **Step 1: Tambah tipe di `schema.ts`** (di akhir file)

```typescript
export interface PPPoESessionData {
  id: string;
  name: string;
  service: string;
  caller_id: string | null;
  address: string | null;
  uptime: string | null;
}

export interface PPPoESessionsResponse {
  router: { id: string; name: string };
  sessions: PPPoESessionData[];
}
```

- [ ] **Step 2: Tambah method di `service.ts`** (di dalam objek `mikrotikService`, setelah `forcePoll`)

```typescript
  getPPPoESessions: async (routerId: string) => {
    const response = await api.get(`/mikrotik/monitoring/${routerId}/pppoe`);
    return response.data;
  },
```

- [ ] **Step 3: Tambah key + hook di `hooks.ts`**

Di objek `mikrotikKeys` tambah:

```typescript
  pppoe: (routerId: string) => [...mikrotikKeys.all, 'pppoe', routerId] as const,
```

Di bagian MONITORING HOOKS tambah:

```typescript
export function usePPPoESessions(routerId: string) {
  return useQuery({
    queryKey: mikrotikKeys.pppoe(routerId),
    queryFn: () => mikrotikService.getPPPoESessions(routerId),
    enabled: !!routerId,
    // No refetchInterval: every fetch opens a live connection to the router
  });
}
```

- [ ] **Step 4: Buat `src/components/screens/monitoring/pppoe-sessions.tsx`**

```tsx
import React from "react";
import { View, ScrollView, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { Text } from "@/src/components/global/text";
import { EmptyState } from "@/src/components/global/empty-state";
import { usePPPoESessions } from "@/src/features/mikrotik/hooks";
import { PPPoESessionData, PPPoESessionsResponse } from "@/src/features/mikrotik/schema";
import { useT } from "@/src/features/i18n/store";
import { useTabBarHeight } from "@/src/hooks/use-tab-bar-height";
import { useThemeColor } from "@/src/lib/theme-colors";

interface Props {
  routerId: string;
}

function SessionCard({ session }: { session: PPPoESessionData }) {
  const { t } = useT();
  const colors = useThemeColor();

  return (
    <View className="bg-card border border-border rounded-xl p-3 mb-2">
      <View className="flex-row items-center justify-between mb-1">
        <View className="flex-row items-center flex-1">
          <View className="w-2 h-2 rounded-full mr-2 bg-green-500" />
          <Text weight="semibold" className="text-sm text-foreground flex-1" numberOfLines={1}>
            {session.name}
          </Text>
        </View>
        {session.uptime && (
          <Text className="text-xs text-muted-foreground">
            {t("monitoring.uptime")}: {session.uptime}
          </Text>
        )}
      </View>
      <View className="flex-row items-center">
        <Ionicons name="globe-outline" size={12} color={colors.icon} />
        <Text className="text-xs text-muted-foreground ml-1">
          {session.address ?? "-"}
        </Text>
        {session.caller_id && (
          <>
            <Ionicons
              name="hardware-chip-outline"
              size={12}
              color={colors.icon}
              style={{ marginLeft: 8 }}
            />
            <Text className="text-xs text-muted-foreground ml-1">{session.caller_id}</Text>
          </>
        )}
      </View>
    </View>
  );
}

export function PPPoESessions({ routerId }: Props) {
  const { t } = useT();
  const { contentPaddingBottom } = useTabBarHeight();
  const { data, isLoading, isError, refetch, isRefetching } = usePPPoESessions(routerId);

  const payload: PPPoESessionsResponse | undefined = data?.data;
  const sessions = payload?.sessions ?? [];

  return (
    <ScreenWrapper headerTitle={t("monitoring.pppoeTitle")} showBackButton={true}>
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: contentPaddingBottom, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <View className="mt-4 flex-1">
          {isLoading ? (
            <View className="items-center justify-center py-20">
              <Text className="text-muted-foreground">{t("monitoring.loading")}</Text>
            </View>
          ) : isError ? (
            <EmptyState
              icon="cloud-offline-outline"
              title={t("monitoring.pppoeError")}
              description={t("monitoring.pppoeErrorDesc")}
              actionLabel={t("monitoring.retry")}
              onAction={() => refetch()}
              isLoading={isRefetching}
            />
          ) : sessions.length === 0 ? (
            <EmptyState
              icon="people-outline"
              title={t("monitoring.pppoeEmpty")}
              description={t("monitoring.pppoeEmptyDesc")}
            />
          ) : (
            sessions.map((session) => (
              <SessionCard key={session.id || session.name} session={session} />
            ))
          )}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
```

- [ ] **Step 5: Buat route `app/monitoring/[id]/pppoe.tsx`**

```tsx
import React from "react";
import { useLocalSearchParams } from "expo-router";
import { PPPoESessions } from "@/src/components/screens/monitoring/pppoe-sessions";

export default function PPPoESessionsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PPPoESessions routerId={id!} />;
}
```

- [ ] **Step 6: Tambah i18n key di grup `monitoring` KEDUA locale**

`src/locales/id.json`:

```json
"pppoeTitle": "Sesi PPPoE",
"pppoeEmpty": "Tidak Ada Sesi Aktif",
"pppoeEmptyDesc": "Belum ada pelanggan yang sedang terhubung.",
"pppoeError": "Gagal Memuat Sesi",
"pppoeErrorDesc": "Router tidak dapat dijangkau. Coba lagi.",
"retry": "Coba Lagi"
```

`src/locales/en.json`:

```json
"pppoeTitle": "PPPoE Sessions",
"pppoeEmpty": "No Active Sessions",
"pppoeEmptyDesc": "No customers are currently connected.",
"pppoeError": "Failed to Load Sessions",
"pppoeErrorDesc": "The router could not be reached. Try again.",
"retry": "Try Again"
```

- [ ] **Step 7: Verifikasi**

Run: `cd detso-mobile && npx tsc --noEmit && npm test`
Expected: tsc bersih, seluruh suite hijau

- [ ] **Step 8: Commit**

```bash
git add detso-mobile/src/features/mikrotik/schema.ts detso-mobile/src/features/mikrotik/service.ts detso-mobile/src/features/mikrotik/hooks.ts "detso-mobile/src/components/screens/monitoring/pppoe-sessions.tsx" "detso-mobile/app/monitoring/[id]/pppoe.tsx" detso-mobile/src/locales/id.json detso-mobile/src/locales/en.json
git commit -m "feat(mobile): add live PPPoE sessions screen"
```

---

### Task 6: Mobile — slice grafik riwayat (deps chart + layar + i18n)

**Files:**
- Modify: `detso-mobile/package.json` + `package-lock.json` (deps baru)
- Create: `detso-mobile/src/components/screens/monitoring/monitoring-history.tsx`
- Create: `detso-mobile/app/monitoring/[id]/history.tsx`
- Modify: `detso-mobile/src/locales/id.json`, `detso-mobile/src/locales/en.json` (grup `monitoring`)

**Interfaces:**
- Consumes: `useHistoricalData(routerId, hours)` yang SUDAH ADA di `@/src/features/mikrotik/hooks` (respons: `{ success, message, data: { router, hours, data: MonitoringData[] } }`); `downsample` dari `@/src/lib/downsample` (Task 4); `safeNumber` dari `@/src/lib/format`; tipe `MonitoringData` dari `@/src/features/mikrotik/schema`.
- Produces: route `/monitoring/[id]/history` (dipakai Task 7 untuk navigasi); i18n key `monitoring.historyTitle` (juga dipakai Task 7).

- [ ] **Step 1: Install dependencies**

```bash
cd detso-mobile
npx expo install react-native-svg expo-linear-gradient
npm install react-native-gifted-charts
```

Catatan: `react-native-svg` adalah native module — dev client perlu di-build ulang untuk QA di device (unit test TIDAK terpengaruh). JANGAN meng-import komponen chart di file test mana pun (dependensi `gifted-charts-core` tidak masuk daftar transform jest-expo).

- [ ] **Step 2: Buat `src/components/screens/monitoring/monitoring-history.tsx`**

```tsx
import React, { useState } from "react";
import { View, ScrollView, RefreshControl, Pressable, useWindowDimensions } from "react-native";
import { LineChart } from "react-native-gifted-charts";

import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { Text } from "@/src/components/global/text";
import { EmptyState } from "@/src/components/global/empty-state";
import { useHistoricalData } from "@/src/features/mikrotik/hooks";
import { MonitoringData } from "@/src/features/mikrotik/schema";
import { useT } from "@/src/features/i18n/store";
import { useTabBarHeight } from "@/src/hooks/use-tab-bar-height";
import { useThemeColor } from "@/src/lib/theme-colors";
import { downsample } from "@/src/lib/downsample";
import { safeNumber } from "@/src/lib/format";

interface Props {
  routerId: string;
}

const RANGES = [3, 12, 24] as const;
const MAX_POINTS = 120;

function ChartCard({ title, data, maxValue, color }: {
  title: string;
  data: { value: number }[];
  maxValue?: number;
  color: string;
}) {
  const colors = useThemeColor();
  const { width } = useWindowDimensions();

  return (
    <View className="bg-card border border-border rounded-xl p-4 mb-4">
      <Text weight="semibold" className="text-sm text-foreground mb-3">
        {title}
      </Text>
      <LineChart
        data={data}
        width={width - 96}
        height={140}
        adjustToWidth
        thickness={2}
        color={color}
        hideDataPoints
        maxValue={maxValue}
        noOfSections={4}
        yAxisTextStyle={{ fontSize: 10, color: colors.icon }}
        yAxisColor="transparent"
        xAxisColor="transparent"
        initialSpacing={0}
        disableScroll
      />
    </View>
  );
}

export function MonitoringHistory({ routerId }: Props) {
  const { t } = useT();
  const colors = useThemeColor();
  const { contentPaddingBottom } = useTabBarHeight();
  const [hours, setHours] = useState<number>(3);
  const { data, isLoading, refetch, isRefetching } = useHistoricalData(routerId, hours);

  const records: MonitoringData[] = data?.data?.data ?? [];
  const points = downsample(records, MAX_POINTS);

  const cpuData = points.map((r) => ({ value: safeNumber(r.cpu_load) }));
  const memoryData = points.map((r) => {
    const total = safeNumber(r.memory_total);
    const used = safeNumber(r.memory_used);
    return { value: total > 0 ? Math.round((used / total) * 100) : 0 };
  });
  const sessionData = points.map((r) => ({ value: safeNumber(r.active_sessions) }));

  return (
    <ScreenWrapper headerTitle={t("monitoring.historyTitle")} showBackButton={true}>
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: contentPaddingBottom, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <View className="mt-4 flex-1">
          {/* Range chips */}
          <View className="flex-row gap-2 mb-4">
            {RANGES.map((range) => (
              <Pressable
                key={range}
                onPress={() => setHours(range)}
                className={`px-4 py-2 rounded-full border ${
                  hours === range ? "bg-primary border-primary" : "bg-card border-border"
                }`}
              >
                <Text
                  className={`text-sm ${
                    hours === range ? "text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {t(`monitoring.historyRange${range}h`)}
                </Text>
              </Pressable>
            ))}
          </View>

          {isLoading ? (
            <View className="items-center justify-center py-20">
              <Text className="text-muted-foreground">{t("monitoring.loading")}</Text>
            </View>
          ) : points.length < 2 ? (
            <EmptyState
              icon="stats-chart-outline"
              title={t("monitoring.historyEmpty")}
              description={t("monitoring.historyEmptyDesc")}
            />
          ) : (
            <>
              <ChartCard
                title={t("monitoring.historyCpu")}
                data={cpuData}
                maxValue={100}
                color={colors.info}
              />
              <ChartCard
                title={t("monitoring.historyMemory")}
                data={memoryData}
                maxValue={100}
                color={colors.success}
              />
              <ChartCard
                title={t("monitoring.historySessions")}
                data={sessionData}
                color={colors.warning}
              />
            </>
          )}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
```

- [ ] **Step 3: Buat route `app/monitoring/[id]/history.tsx`**

```tsx
import React from "react";
import { useLocalSearchParams } from "expo-router";
import { MonitoringHistory } from "@/src/components/screens/monitoring/monitoring-history";

export default function MonitoringHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <MonitoringHistory routerId={id!} />;
}
```

- [ ] **Step 4: Tambah i18n key di grup `monitoring` KEDUA locale**

`src/locales/id.json`:

```json
"historyTitle": "Riwayat",
"historyRange3h": "3 jam",
"historyRange12h": "12 jam",
"historyRange24h": "24 jam",
"historyCpu": "CPU (%)",
"historyMemory": "Memori (%)",
"historySessions": "Sesi Aktif",
"historyEmpty": "Belum Ada Data Riwayat",
"historyEmptyDesc": "Data akan terkumpul setelah router ter-poll beberapa kali."
```

`src/locales/en.json`:

```json
"historyTitle": "History",
"historyRange3h": "3h",
"historyRange12h": "12h",
"historyRange24h": "24h",
"historyCpu": "CPU (%)",
"historyMemory": "Memory (%)",
"historySessions": "Active Sessions",
"historyEmpty": "No History Data",
"historyEmptyDesc": "Data will accumulate after the router has been polled a few times."
```

- [ ] **Step 5: Verifikasi**

Run: `cd detso-mobile && npx tsc --noEmit && npm test`
Expected: tsc bersih, seluruh suite hijau

- [ ] **Step 6: Commit**

```bash
git add detso-mobile/package.json detso-mobile/package-lock.json "detso-mobile/src/components/screens/monitoring/monitoring-history.tsx" "detso-mobile/app/monitoring/[id]/history.tsx" detso-mobile/src/locales/id.json detso-mobile/src/locales/en.json
git commit -m "feat(mobile): add monitoring history screen with charts"
```

---

### Task 7: Mobile — integrasi layar detail (StatCard suhu + kartu navigasi)

**Files:**
- Modify: `detso-mobile/src/components/screens/monitoring/monitoring-detail.tsx`
- Modify: `detso-mobile/src/locales/id.json`, `detso-mobile/src/locales/en.json` (grup `monitoring`)

**Interfaces:**
- Consumes: `formatTemperature` dari `@/src/lib/format` (Task 4); route `/monitoring/[id]/pppoe` (Task 5) dan `/monitoring/[id]/history` (Task 6); i18n key `monitoring.pppoeTitle` (Task 5) dan `monitoring.historyTitle` (Task 6).
- Produces: —

- [ ] **Step 1: Update import di `monitoring-detail.tsx`**

- Tambah `Pressable` ke import dari `react-native`.
- Tambah `import { router } from "expo-router";`
- Tambah `formatTemperature` ke import yang sudah ada dari `@/src/lib/format`.

- [ ] **Step 2: Tambah nilai suhu**

Setelah baris `const diskPercent = ...` tambahkan:

```tsx
  const temperature = monitoring?.temperature ?? null;
```

(Catatan: letakkan bersama turunan `monitoring` lain; `monitoring` bisa `undefined` di awal render, jadi pakai optional chaining seperti baris-baris di atasnya.)

- [ ] **Step 3: Tambah StatCard suhu di baris Quick Stats**

Di dalam `<View className="flex-row gap-3 mb-4">` (Quick Stats), setelah StatCard `monitoring.sessions`, tambahkan:

```tsx
              <StatCard
                icon="thermometer-outline"
                label={t("monitoring.temperature")}
                value={formatTemperature(temperature)}
                color={
                  temperature == null
                    ? undefined
                    : temperature > 75
                      ? colors.error
                      : temperature > 60
                        ? colors.warning
                        : colors.success
                }
              />
```

- [ ] **Step 4: Tambah kartu navigasi PPPoE + Riwayat**

Setelah blok Quick Stats (sebelum blok `{/* CPU Load */}`), tambahkan:

```tsx
            {/* PPPoE & History navigation */}
            <View className="flex-row gap-3 mb-4">
              <Pressable
                onPress={() => router.push(`/monitoring/${routerId}/pppoe`)}
                className="bg-card border border-border rounded-xl p-3 flex-1 active:opacity-70"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <Ionicons name="people-outline" size={18} color={colors.info} />
                    <Text
                      weight="semibold"
                      className="text-sm text-foreground ml-2"
                      numberOfLines={1}
                    >
                      {t("monitoring.pppoeTitle")}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.icon} />
                </View>
                <Text className="text-xs text-muted-foreground mt-1">
                  {t("monitoring.sessions")}: {activeSessions}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => router.push(`/monitoring/${routerId}/history`)}
                className="bg-card border border-border rounded-xl p-3 flex-1 active:opacity-70"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <Ionicons name="stats-chart-outline" size={18} color={colors.warning} />
                    <Text
                      weight="semibold"
                      className="text-sm text-foreground ml-2"
                      numberOfLines={1}
                    >
                      {t("monitoring.historyTitle")}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.icon} />
                </View>
                <Text className="text-xs text-muted-foreground mt-1">
                  {t("monitoring.historyDesc")}
                </Text>
              </Pressable>
            </View>
```

- [ ] **Step 5: Tambah i18n key di grup `monitoring` KEDUA locale**

`src/locales/id.json`:

```json
"temperature": "Suhu",
"historyDesc": "CPU, memori, sesi"
```

`src/locales/en.json`:

```json
"temperature": "Temperature",
"historyDesc": "CPU, memory, sessions"
```

- [ ] **Step 6: Verifikasi**

Run: `cd detso-mobile && npx tsc --noEmit && npm test`
Expected: tsc bersih, seluruh suite hijau

- [ ] **Step 7: Commit**

```bash
git add "detso-mobile/src/components/screens/monitoring/monitoring-detail.tsx" detso-mobile/src/locales/id.json detso-mobile/src/locales/en.json
git commit -m "feat(mobile): show temperature and pppoe/history navigation on router detail"
```

---

### Task 8: Verifikasi final lintas-repo

**Files:** — (verifikasi saja; commit hanya jika ada perbaikan)

**Interfaces:**
- Consumes: semua task sebelumnya.
- Produces: bukti suite hijau untuk final review.

- [ ] **Step 1: Backend**

Run: `cd backend && npx tsc --noEmit && npm test`
Expected: tsc bersih; 9 test PASS (traffic 6 + pppoe 3)

- [ ] **Step 2: Mobile**

Run: `cd detso-mobile && npx tsc --noEmit && npm test`
Expected: tsc bersih; seluruh suite hijau (21 test lama + test baru Task 4)

- [ ] **Step 3: Lint mobile**

Run: `cd detso-mobile && npm run lint`
Expected: TIDAK ada error baru — baseline yang sudah ada: 2 error `react/no-unescaped-entities` di `service-detail-sheet.tsx:149` + warning lama. Error baru apa pun harus diperbaiki dan di-commit.

- [ ] **Step 4: (Bila ada perbaikan) Commit**

```bash
git add -A && git commit -m "fix: address final verification findings"
```

---

## Catatan QA Manual (setelah plan selesai, butuh CHR + device/emulator)

Bukan bagian task otomatis — perlu tangan user:

1. **Poller**: jalankan backend dengan CHR aktif + minimal 1 secret PPPoE tersambung → cek log `Router polled successfully` menunjukkan `sessions: >0`; row `detso_mikrotik_monitoring` terbaru berisi `active_sessions > 0`, `temperature: null` (CHR tanpa sensor); row interface poll kedua dan seterusnya berisi `rx_bps/tx_bps > 0` saat ada traffic.
2. **Endpoint**: `GET /api/mikrotik/monitoring/<id>/pppoe` sebagai OWNER/ADMIN → daftar sesi; sebagai TEKNISI → 403; router mati → response error, bukan hang.
3. **Mobile** (build ulang dev client dulu — ada native module baru `react-native-svg`): layar detail menampilkan suhu `-` (CHR) dan bps berubah; layar sesi PPPoE menampilkan pelanggan; matikan CHR → state error + tombol Coba Lagi; layar riwayat menggambar 3 chart di rentang 3/12/24 jam; cek dark mode di semua layar baru.
