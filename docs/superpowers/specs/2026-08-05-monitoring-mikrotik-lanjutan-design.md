# Monitoring Mikrotik Lanjutan — Design

**Tanggal:** 2026-08-05
**Status:** Disetujui user (brainstorming 2026-08-05)
**Scope track:** Mobile track plan 3 (lanjutan dari quickfix keamanan + dashboard teknisi)

## Tujuan

Layar monitoring mobile saat ini menampilkan tiga angka yang selamanya nol: sesi aktif, suhu, dan traffic per interface. Infrastruktur di sekelilingnya sudah jalan (cron poll tiap 15 detik, penyimpanan ke DB, endpoint API, layar detail). Desain ini menghidupkan ketiga angka itu di sumbernya, lalu menambah dua layar yang datanya sudah tersedia tapi belum pernah ditampilkan: daftar sesi PPPoE dan grafik riwayat.

## Kondisi Saat Ini

Titik dummy ada di `backend/src/services/mikrotik/monitoring.service.ts` (`pollRouter`):

| Baris | Masalah | Akibat di mobile |
|---|---|---|
| `monitoring.service.ts:52` | `pppoeSessions` hardcode `[]` | StatCard "Sessions" selalu 0 |
| `monitoring.service.ts:53` | `health` hardcode `null` | `temperature`/`voltage` selalu null |
| `monitoring.service.ts:99-100` | `rx_bps`/`tx_bps` hardcode `BigInt(0)` | Semua interface tertulis "0 bps" |

Method API-nya sendiri sudah ada dan berfungsi: `getPPPoEActiveSessions()` (`/ppp/active/print`) dan `getSystemHealth()` (`/system/health/print`) di `mikrotik.service.ts`, lengkap dengan guard `!empty`/`no such command`. Keduanya dimatikan dulu karena beberapa versi CHR membalas `!empty` yang membuat node-routeros crash; `getInterfaces()` sudah memakai solusinya (try/catch per fetch di `pollRouter`).

`getInterfaceTraffic()` (`mikrotik.service.ts:125`) adalah stub `/interface/monitor-traffic` yang mengembalikan `[]`. Desain ini TIDAK memakainya; biarkan sebagai stub.

Satu bug laten yang tersentuh pekerjaan ini: `pollRouter` membiarkan `recorded_at` diisi default per-row, sementara `getCurrentMonitoring` (`monitoring.controller.ts:41-46`) mencocokkan interface dengan `recorded_at` monitoring secara persis. Join timestamp implisit ini rapuh dan menghalangi pencarian snapshot-sebelumnya yang deterministik untuk hitung delta.

## Keputusan Desain (disetujui user)

1. **bps dihitung dari delta counter antar poll**, bukan `/interface/monitor-traffic`. Tanpa perintah router baru; nilai rata-rata 15 detik.
2. **Daftar sesi PPPoE diambil live dari router** lewat endpoint baru. Tanpa tabel Prisma baru, tanpa migrasi. Snapshot di DB ditunda sampai fitur isolir butuh histori sesi.
3. **Grafik riwayat memakai endpoint `/history` yang sudah ada**; downsample di client.
4. Lingkungan uji: **CHR/lab virtual**. Suhu di CHR kosong; jalur fallback null justru teruji nyata. Uji suhu terisi menunggu router fisik.

## Desain

### 1. Backend — poller (`monitoring.service.ts`)

`pollRouter` berubah dalam empat hal:

- **Satu `recorded_at = new Date()` per siklus poll**, dipakai eksplisit di record `detso_Mikrotik_Monitoring` dan semua record `detso_Mikrotik_Interface`. Ini memperbaiki join timestamp di `getCurrentMonitoring` dan membuat snapshot per-poll punya identitas jelas.
- **Sesi PPPoE**: `service.getPPPoEActiveSessions()` dibungkus try/catch (pola `getInterfaces`), fallback `[]`, `log.debug` saat gagal. `active_sessions = pppoeSessions.length`.
- **Suhu/voltase**: `service.getSystemHealth()` dibungkus try/catch, fallback `null`. Parsing `parseFloat` tetap seperti kode sekarang.
- **bps**: sebelum `createMany`, ambil snapshot interface sebelumnya: cari `recorded_at` terbaru untuk router itu di `detso_Mikrotik_Interface`, lalu `findMany` pada timestamp itu, jadikan `Map` per `interface_name`. Untuk tiap interface baru:
  - ada snapshot sebelumnya dan `dtSeconds > 0` → `bps = max(0, round((bytes_now − bytes_prev) × 8 / dtSeconds))`
  - poll pertama, interface baru, atau delta negatif (reboot/counter reset) → `0`

  Rumus delta hidup di fungsi murni `computeBps(prevBytes: bigint, currBytes: bigint, dtSeconds: number): bigint` di file baru `backend/src/services/mikrotik/traffic.ts`, supaya bisa diuji tanpa router.

Tidak ada perubahan schema Prisma. Kolom `active_sessions`, `temperature`, `voltage`, `rx_bps`, `tx_bps` sudah ada.

### 2. Backend — endpoint sesi PPPoE live

`GET /api/mikrotik/monitoring/:router_id/pppoe`, handler baru di `monitoring.controller.ts`, terdaftar di `controller/mikrotik/index.ts` (otomatis kena `authMiddleware` + `requireRole(ADMIN_ONLY)` seperti route mikrotik lain).

Alur (pola `pollRouter`/`forcePollRouter`):

1. Verifikasi router milik tenant (`findFirst` dengan `tenant_id`), 404 kalau tidak ada.
2. Koneksi segar `MikrotikService` (host/port/username dari DB, `decryptPassword`, timeout 15 detik).
3. `getPPPoEActiveSessions()`, `disconnect()` di `finally`.
4. Respons: `{ router: {id, name}, sessions: [{id, name, service, caller_id, address, uptime}] }` — field dipetakan dari kunci RouterOS (`.id`, `caller-id`) ke snake_case agar konsisten dengan respons lain.

Router tak terjangkau → error mengalir ke error middleware yang ada; mobile menampilkan state error. Endpoint ini menyentuh router langsung, latensi wajar 1–3 detik.

### 3. Mobile — suhu + layar sesi PPPoE

**Suhu** di `monitoring-detail.tsx`: StatCard ketiga di baris Quick Stats. Nilai dari helper baru `formatTemperature(value: unknown): string` di `src/lib/format.ts` — `"36°C"` bila angka valid, `"-"` bila null/bukan angka. Warna: normal sampai 60, `warning` di atas 60, `error` di atas 75.

**Layar baru `app/monitoring/[id]/pppoe.tsx`** (komponen di `src/components/screens/monitoring/pppoe-sessions.tsx`):

- Daftar sesi: nama secret, IP (`address`), MAC (`caller_id`), uptime.
- Pull-to-refresh saja, TANPA `refetchInterval` — tiap fetch menyentuh router langsung.
- Empty state "tidak ada sesi aktif"; state error dengan tombol coba lagi.
- Dari layar detail: kartu navigasi "Sesi PPPoE (N)" (N dari `active_sessions`) menuju layar ini.

Feature module mengikuti pola yang ada: `getPPPoESessions(routerId)` di `service.ts`, `usePPPoESessions(routerId)` + `mikrotikKeys.pppoe(routerId)` di `hooks.ts`, tipe `PPPoESessionData` di `schema.ts`. i18n en+id untuk semua teks baru.

Akses: route baru di bawah `/monitoring` sudah tercakup guard `monitoring` di `route-roles.ts` (OWNER/ADMIN); backend-nya juga ADMIN_ONLY.

### 4. Mobile — layar grafik riwayat

**Layar baru `app/monitoring/[id]/history.tsx`** (komponen di `src/components/screens/monitoring/monitoring-history.tsx`):

- Chip rentang: 3 jam (default) / 12 jam / 24 jam → `useHistoricalData(routerId, hours)` yang sudah ada.
- Tiga line chart: CPU (%), memory (%, dihitung `memory_used/memory_total`), sesi aktif.
- Data 24 jam ≈ 5.760 titik → downsample di client ke ±120 titik. Fungsi murni `downsample<T>(points: T[], target: number): T[]` di `src/lib/downsample.ts` (bertetangga dengan `format.ts`), diuji unit.
- Kartu navigasi "Riwayat" di layar detail menuju layar ini.

**Library:** `react-native-gifted-charts` + dependensinya (`react-native-svg`, `expo-linear-gradient`) dipasang via `npx expo install` agar versinya cocok dengan Expo 54. Pure JS di atas svg; tidak menambah native module di luar ekosistem Expo.

### 5. Testing

- **Backend belum punya infra test.** Tambah minimal: `jest` + `ts-jest` dev-dependency di `backend/`, script `npm test`. Unit test untuk:
  - `computeBps`: poll pertama (tanpa prev), delta normal, delta negatif (reset), `dtSeconds = 0`, angka besar (BigInt).
  - Mapping sesi PPPoE RouterOS → respons API (kunci `caller-id` → `caller_id`, dll.).
- **Mobile** (jest-expo sudah ada): unit test `downsample` (kosong, lebih sedikit dari target, tepat, jauh lebih banyak) dan formatter suhu.
- **Verifikasi live terhadap CHR** (manual, akhir pengerjaan): sesi PPPoE muncul dengan count benar, bps berubah saat ada traffic, suhu tampil `-` (CHR tanpa sensor), layar riwayat menggambar data poll yang menumpuk.

## Non-Goals

- `/interface/monitor-traffic` (stub dibiarkan).
- Tabel/histori sesi PPPoE di DB (tunggu kebutuhan isolir).
- Push real-time via Socket.IO ke mobile (event `mikrotik:polled` sudah di-emit backend; mobile tetap polling 15 detik).
- Grafik traffic per interface di layar riwayat (data bps per-interface ada di DB, tapi UI-nya menyusul kalau dibutuhkan).
- Perubahan schema Prisma.

## Risiko

| Risiko | Mitigasi |
|---|---|
| `!empty` CHR di `/ppp/active/print` atau `/system/health/print` membuat poll crash | Try/catch per fetch di `pollRouter` (pola `getInterfaces`); guard di level `MikrotikService` sudah ada |
| Endpoint PPPoE live menambah beban router bila sering dibuka | Tanpa auto-refresh; hanya pull-to-refresh; akses terbatas OWNER/ADMIN |
| Payload history 24 jam besar (±5.760 row) | Default 3 jam; downsample di client; downsample server-side menyusul bila terasa berat |
| Query snapshot-sebelumnya menambah 2 query DB per poll per router | Ringan (index `router_id`+`recorded_at`); dipantau lewat log durasi poll yang sudah ada |

## Kriteria Sukses

1. `active_sessions`, `temperature`/`voltage`, `rx_bps`/`tx_bps` terisi nyata dari CHR; nol/null hanya bila router memang tidak menyediakan.
2. Layar detail mobile menampilkan suhu; interface menampilkan bps yang berubah mengikuti traffic.
3. Layar sesi PPPoE menampilkan daftar pelanggan online dari CHR.
4. Layar riwayat menggambar CPU/memory/sesi untuk rentang 3/12/24 jam.
5. `tsc` bersih di backend + mobile; unit test backend baru dan mobile hijau; suite mobile lama tetap hijau.
