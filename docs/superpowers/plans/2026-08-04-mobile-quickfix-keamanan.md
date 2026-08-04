# Mobile Quick-Fix Keamanan & Bug — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menutup temuan keamanan mobile (token Mapbox secret di bundle, log kredensial) dan bug prioritas (role gating route, map stuck spinner, crash monitoring), plus memasang infrastruktur test pertama.

**Architecture:** Semua perubahan di `detso-mobile/` (Expo 54 + expo-router 6 + zustand 5 + react-query 5 + i18n-js). Logika yang diperbaiki diekstrak ke fungsi murni di `src/lib/` supaya bisa diunit-test dengan jest-expo; layar hanya memanggil fungsi itu.

**Tech Stack:** jest-expo ~54, babel-plugin-transform-remove-console, @rnmapbox/maps 10, i18n-js 4.

## Global Constraints

- Semua perintah dijalankan dari `detso-mobile/` dengan **npm** (repo ini pakai `package-lock.json`; backend pakai yarn, jangan tertukar).
- Semua teks UI baru lewat i18n: tambah key di `src/locales/en.json` **dan** `src/locales/id.json` (engine i18n-js), akses via `const { t } = useT()` dari `@/src/features/i18n/store`.
- Warna via `useThemeColor()` dari `@/src/lib/theme-colors`, jangan konstanta COLORS statis (aturan AGENTS.md mobile).
- Plugin `react-native-reanimated/plugin` HARUS tetap paling akhir di `babel.config.js`.
- Jangan menyentuh folder `backend/` atau `frontend/` di plan ini.
- Verifikasi standar tiap task: `npx tsc --noEmit && npm run lint && npm test` dari `detso-mobile/`.

---

### Task 1: Infrastruktur test (jest-expo)

**Files:**
- Modify: `detso-mobile/package.json`
- Test: `detso-mobile/src/lib/__tests__/config.test.ts`

**Interfaces:**
- Consumes: `config` dari `src/lib/config.ts` (objek `{ API_URL, MAPBOX_PUBLIC_TOKEN, API_TIMEOUT: 15000, REFRESH_BEFORE_EXPIRY: 120 }`)
- Produces: script `npm test` yang menjalankan jest preset `jest-expo` — dipakai semua task berikutnya dan plan-plan mobile selanjutnya.

- [ ] **Step 1: Install dependency test**

```bash
cd /home/luminova/project/detso/detso-mobile
npm install --save-dev jest-expo@~54.0.0 jest@~29.7.0 @types/jest
```

- [ ] **Step 2: Daftarkan script & preset di package.json**

Tambahkan di `package.json` (di level atas, sejajar `"scripts"`):

```json
"jest": {
  "preset": "jest-expo"
}
```

dan di dalam `"scripts"`:

```json
"test": "jest"
```

- [ ] **Step 3: Tulis test pertama (sekaligus smoke test preset)**

Buat `src/lib/__tests__/config.test.ts`:

```ts
import { config } from '../config';

describe('config', () => {
  it('punya timeout API 15 detik', () => {
    expect(config.API_TIMEOUT).toBe(15000);
  });

  it('refresh token 2 menit sebelum expire', () => {
    expect(config.REFRESH_BEFORE_EXPIRY).toBe(120);
  });
});
```

- [ ] **Step 4: Jalankan dan pastikan hijau**

Run: `npm test`
Expected: PASS, 2 test.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/lib/__tests__/config.test.ts
git commit -m "test(mobile): add jest-expo test infrastructure"
```

---

### Task 2: Hapus log kredensial + strip console di build release

**Files:**
- Modify: `detso-mobile/src/features/auth/store.ts:53,65`
- Modify: `detso-mobile/babel.config.js`

**Interfaces:**
- Consumes: tidak ada.
- Produces: build production tanpa `console.log`/`console.info`/`console.debug` (error & warn dipertahankan). Tidak ada API baru.

- [ ] **Step 1: Hapus dua log kredensial di `src/features/auth/store.ts`**

Hapus baris 53:

```ts
    console.log('Login attempt:', data);
```

dan baris 65:

```ts
      console.log('Login successful:', user);
```

Jangan hapus log lain di file ini pada step ini; log non-sensitif akan hilang otomatis di release lewat babel (step berikut).

- [ ] **Step 2: Install plugin babel**

```bash
npm install --save-dev babel-plugin-transform-remove-console
```

- [ ] **Step 3: Aktifkan strip-console hanya untuk production**

Ganti seluruh isi `babel.config.js` dengan:

```js
module.exports = function (api) {
  api.cache.using(() => process.env.NODE_ENV);

  const plugins = [];
  if (process.env.NODE_ENV === 'production' || process.env.BABEL_ENV === 'production') {
    plugins.push(['transform-remove-console', { exclude: ['error', 'warn'] }]);
  }
  plugins.push('react-native-reanimated/plugin'); // HARUS TERAKHIR

  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxImportSource: 'nativewind',
        },
      ],
    ],
    plugins,
  };
};
```

Catatan: `api.cache.using` (bukan `api.cache(true)`) supaya cache babel ikut berubah saat `NODE_ENV` berubah; tanpa ini, bundle release bisa memakai cache dev yang masih berisi console.

- [ ] **Step 4: Verifikasi source bersih dari log kredensial**

Run: `grep -rn "Login attempt\|Login successful" src/`
Expected: tidak ada hasil.

- [ ] **Step 5: Verifikasi bundle release bersih (bukti, bukan asumsi)**

```bash
NODE_ENV=production npx expo export --platform android --output-dir /tmp/claude-1000/detso-export-check
grep -rl "AUTO-REFRESH" /tmp/claude-1000/detso-export-check/ || echo "BERSIH"
rm -rf /tmp/claude-1000/detso-export-check
```

Expected: output `BERSIH` (string log `[AUTO-REFRESH]` dari store.ts tidak ada di bundle production).

- [ ] **Step 6: Jalankan verifikasi standar lalu commit**

Run: `npx tsc --noEmit && npm run lint && npm test`

```bash
git add src/features/auth/store.ts babel.config.js package.json package-lock.json
git commit -m "fix(mobile): remove credential logging and strip console in release builds"
```

---

### Task 3: Higienis token Mapbox & untrack file secret

**Files:**
- Modify: `detso-mobile/.env.development`, `detso-mobile/.gitignore`, `detso-mobile/src/lib/config.ts`
- Create: `detso-mobile/.env.example`
- Test: `detso-mobile/src/lib/__tests__/config.test.ts` (tambah kasus)

**Interfaces:**
- Consumes: `config.MAPBOX_PUBLIC_TOKEN` (dipakai `Mapbox.setAccessToken` di `src/components/screens/network/network-map-view.tsx:18`, `src/components/global/map-picker.tsx:25`, `src/components/screens/dashboard/tenant-map-view.tsx:17` — tiga file itu TIDAK perlu diubah).
- Produces: `assertPublicMapboxToken(token: string): string` di `src/lib/config.ts` — melempar `Error` bila token berawalan `sk.`.

- [ ] **Step 0 (MANUAL — minta user, jangan dikerjakan agent):** Di dashboard Mapbox: hapus/rotasi token `sk.*` yang bocor di git; pastikan ada token **public** `pk.*` untuk runtime dan token **secret** baru ber-scope `DOWNLOADS:READ` khusus build (disimpan hanya di env lokal/CI, tidak pernah di file yang di-track).

- [ ] **Step 1: Tulis test yang gagal untuk guard token**

Tambahkan di `src/lib/__tests__/config.test.ts`:

```ts
import { assertPublicMapboxToken } from '../config';

describe('assertPublicMapboxToken', () => {
  it('menerima token public pk.*', () => {
    expect(assertPublicMapboxToken('pk.abc123')).toBe('pk.abc123');
  });

  it('menerima string kosong (belum dikonfigurasi)', () => {
    expect(assertPublicMapboxToken('')).toBe('');
  });

  it('menolak token secret sk.*', () => {
    expect(() => assertPublicMapboxToken('sk.rahasia')).toThrow(/pk\./);
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npm test -- config`
Expected: FAIL — `assertPublicMapboxToken` belum diekspor.

- [ ] **Step 3: Implementasi guard di `src/lib/config.ts`**

Ganti isi file menjadi:

```ts
/**
 * Centralized application configuration.
 * Semua environment variables dan constants dikelola di sini.
 */

/** Token Mapbox yang masuk bundle klien wajib public (pk.*), bukan secret (sk.*). */
export function assertPublicMapboxToken(token: string): string {
  if (token.startsWith('sk.')) {
    throw new Error(
      'EXPO_PUBLIC_MAPBOX_TOKEN harus token public (pk.*). Token sk.* hanya untuk RNMAPBOX_MAPS_DOWNLOAD_TOKEN saat build.'
    );
  }
  return token;
}

export const config = {
  /** Base URL untuk API backend */
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.10:3000/api',

  /** Mapbox public access token */
  MAPBOX_PUBLIC_TOKEN: assertPublicMapboxToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN || ''),

  /** Request timeout dalam milidetik */
  API_TIMEOUT: 15000,

  /** Durasi auto-refresh sebelum token expire (dalam detik) */
  REFRESH_BEFORE_EXPIRY: 2 * 60,
} as const;
```

- [ ] **Step 4: Jalankan test, pastikan hijau**

Run: `npm test -- config`
Expected: PASS semua.

- [ ] **Step 5: Ganti token di `.env.development`**

Di `.env.development`: ganti nilai `EXPO_PUBLIC_MAPBOX_TOKEN` dari `sk.*` menjadi token `pk.*` (nilai sama dengan yang di `.env.production`). Baris `RNMAPBOX_MAPS_DOWNLOAD_TOKEN` diisi token secret BARU hasil Step 0 (file ini akan berhenti di-track pada Step 7, jadi nilai baru tidak akan ter-commit).

- [ ] **Step 6: Buat `.env.example` (satu-satunya file env yang di-track)**

```bash
# Salin ke .env.development / .env.production lalu isi nilai asli.
# EXPO_PUBLIC_* ikut masuk bundle klien — JANGAN taruh secret di situ.
EXPO_PUBLIC_API_URL=http://localhost:6589/api
EXPO_PUBLIC_MAPBOX_TOKEN=pk.ISI_TOKEN_PUBLIC
# Dipakai plugin @rnmapbox/maps saat prebuild saja (scope DOWNLOADS:READ):
RNMAPBOX_MAPS_DOWNLOAD_TOKEN=sk.ISI_TOKEN_DOWNLOAD
```

- [ ] **Step 7: Untrack file secret + rapikan .gitignore**

```bash
git rm --cached .env.development .env.production google-services.json
echo "google-services.json" >> .gitignore
```

Catatan: `.gitignore` sudah punya pattern `.env*` (baris 45) tapi file tetap ter-track karena sudah terlanjur di-commit; `git rm --cached` yang melepasnya. `google-services.json` tetap ada di disk untuk build lokal. Purge history git (token lama di commit lama) sengaja TIDAK dilakukan di sini — itu bagian F1.3 PRD (git-filter-repo satu repo penuh, terkoordinasi dengan rotasi semua secret backend).

- [ ] **Step 8: Verifikasi**

```bash
git ls-files | grep -E "\.env|google-services" 
```
Expected: hanya `.env.example`.

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: semua hijau.

- [ ] **Step 9: Commit**

```bash
git add .gitignore .env.example src/lib/config.ts src/lib/__tests__/config.test.ts
git commit -m "fix(mobile)!: stop shipping Mapbox secret token, untrack env files"
```

---

### Task 4: Role guard route sisi klien

**Files:**
- Create: `detso-mobile/src/lib/route-roles.ts`
- Modify: `detso-mobile/src/hooks/use-secure-router.ts`
- Test: `detso-mobile/src/lib/__tests__/route-roles.test.ts`

**Interfaces:**
- Consumes: `useAuthStore` (field `user.role: string` — nilai nyata: `'TENANT_OWNER' | 'TENANT_ADMIN' | 'TENANT_TEKNISI' | 'SAAS_SUPER_ADMIN'`), `useSegments()` dari expo-router (mis. `['monitoring', '[id]']` atau `['(tabs)', 'map']`).
- Produces: `isRouteAllowed(segments: string[], role: string | undefined): boolean` di `src/lib/route-roles.ts`.

Aturan akses meniru gating menu yang sudah ada di `app/all-menu/index.tsx:53-62` (Monitoring hanya Owner+Admin) dan `:77-85` (Edit Company hanya Owner). Ini pertahanan sisi klien terhadap deep-link/navigasi manual; backend tetap otoritas akhir lewat `requireRole`.

- [ ] **Step 1: Tulis test yang gagal**

Buat `src/lib/__tests__/route-roles.test.ts`:

```ts
import { isRouteAllowed } from '../route-roles';

describe('isRouteAllowed', () => {
  it('blokir teknisi dari /monitoring dan turunannya', () => {
    expect(isRouteAllowed(['monitoring'], 'TENANT_TEKNISI')).toBe(false);
    expect(isRouteAllowed(['monitoring', '[id]'], 'TENANT_TEKNISI')).toBe(false);
  });

  it('izinkan owner dan admin ke /monitoring', () => {
    expect(isRouteAllowed(['monitoring'], 'TENANT_OWNER')).toBe(true);
    expect(isRouteAllowed(['monitoring'], 'TENANT_ADMIN')).toBe(true);
  });

  it('edit-tenant hanya untuk owner', () => {
    expect(isRouteAllowed(['settings', 'edit-tenant'], 'TENANT_OWNER')).toBe(true);
    expect(isRouteAllowed(['settings', 'edit-tenant'], 'TENANT_ADMIN')).toBe(false);
    expect(isRouteAllowed(['settings', 'edit-tenant'], 'TENANT_TEKNISI')).toBe(false);
  });

  it('route tak terdaftar bebas diakses semua role login', () => {
    expect(isRouteAllowed(['settings', 'edit-profile'], 'TENANT_TEKNISI')).toBe(true);
    expect(isRouteAllowed(['(tabs)', 'map'], 'TENANT_TEKNISI')).toBe(true);
  });

  it('tanpa role = tolak', () => {
    expect(isRouteAllowed(['monitoring'], undefined)).toBe(false);
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npm test -- route-roles`
Expected: FAIL — module belum ada.

- [ ] **Step 3: Implementasi `src/lib/route-roles.ts`**

```ts
const OWNER = 'TENANT_OWNER';
const ADMIN = 'TENANT_ADMIN';

/** Prefix path (tanpa route-group "(...)") → role yang boleh masuk. Route di luar daftar = bebas untuk semua user login. */
const RESTRICTED_ROUTES: Record<string, string[]> = {
  monitoring: [OWNER, ADMIN],
  'settings/edit-tenant': [OWNER],
};

export function isRouteAllowed(segments: string[], role: string | undefined): boolean {
  if (!role) return false;
  const path = segments.filter((s) => !s.startsWith('(')).join('/');
  for (const [prefix, roles] of Object.entries(RESTRICTED_ROUTES)) {
    if (path === prefix || path.startsWith(prefix + '/')) {
      return roles.includes(role);
    }
  }
  return true;
}
```

- [ ] **Step 4: Jalankan test, pastikan hijau**

Run: `npm test -- route-roles`
Expected: PASS semua.

- [ ] **Step 5: Pasang di `src/hooks/use-secure-router.ts`**

Ubah `useEffect` di `useProtectedRoute` menjadi:

```ts
  useEffect(() => {
    // Halt redirection logic until the application's foundational states (fonts & auth) complete initialization
    if (!fontsLoaded || !isInitialized) return;

    const inAuthGroup = segments[0] === 'sign-in';

    if (!user && !inAuthGroup) {
      router.replace('/sign-in');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    } else if (user && !isRouteAllowed(segments, user.role)) {
      router.replace('/(tabs)');
    }
  }, [user, isInitialized, fontsLoaded, segments]);
```

dengan import baru di atas:

```ts
import { isRouteAllowed } from '../lib/route-roles';
```

- [ ] **Step 6: Verifikasi standar + manual**

Run: `npx tsc --noEmit && npm run lint && npm test`

Manual (expo start, login sebagai teknisi): buka deep link `detsomobile://monitoring` → harus terlempar balik ke tabs.

- [ ] **Step 7: Commit**

```bash
git add src/lib/route-roles.ts src/lib/__tests__/route-roles.test.ts src/hooks/use-secure-router.ts
git commit -m "fix(mobile): enforce role-based route guard on client navigation"
```

---

### Task 5: Map tidak lagi stuck di spinner saat auto-create gagal

**Files:**
- Modify: `detso-mobile/app/(tabs)/map.tsx:260-272`
- Modify: `detso-mobile/src/locales/en.json`, `detso-mobile/src/locales/id.json`

**Interfaces:**
- Consumes: `createNode` (hasil `useCreateNode()` react-query mutation — field `isError`, method `reset()`), state `autoCreateAttempted`/`setAutoCreateAttempted` yang sudah ada di `map.tsx:56`, komponen `Button` + `Text` + ikon `Ionicons` yang sudah diimport, `colors` dari `useThemeColor()`, `t` dari `useT()`.
- Produces: tidak ada API baru; hanya state UI.

Akar masalah (`map.tsx:58-90`): `autoCreateAttempted` di-set `true` sebelum mutate supaya tidak loop, tapi branch empty-state (`map.tsx:261-272`) selalu merender spinner "preparing" tanpa memeriksa `createNode.isError` — gagal sekali berarti spinner selamanya.

- [ ] **Step 1: Tambah key i18n**

Di `src/locales/en.json`, di dalam objek `network.mapScreen` (sejajar key `preparing`):

```json
"autoCreateFailed": "Failed to prepare the map",
"autoCreateFailedDesc": "We couldn't create the first server node. Check your connection, then try again."
```

Di `src/locales/id.json`, posisi sama:

```json
"autoCreateFailed": "Gagal menyiapkan peta",
"autoCreateFailedDesc": "Node server pertama gagal dibuat. Periksa koneksi kamu, lalu coba lagi."
```

(Key `network.mapScreen.retry` sudah ada, dipakai ulang untuk tombol.)

- [ ] **Step 2: Tangani state gagal di `map.tsx`**

Ganti branch `tenantHasLocation` (baris 265-272) menjadi:

```tsx
    // If tenant has location: auto-create in-flight → spinner; failed → error + retry
    if (tenantHasLocation) {
      if (createNode.isError) {
        return (
          <View className="flex-1 items-center justify-center bg-background px-6">
            <Ionicons name="cloud-offline" size={48} color={colors.error} />
            <Text weight="bold" className="text-foreground mt-3 text-lg">
              {t('network.mapScreen.autoCreateFailed')}
            </Text>
            <Text className="text-muted-foreground mt-1 text-center">
              {t('network.mapScreen.autoCreateFailedDesc')}
            </Text>
            <Button
              className="mt-4"
              onPress={() => {
                createNode.reset();
                setAutoCreateAttempted(false);
              }}
            >
              <Text className="text-primary-foreground">{t('network.mapScreen.retry')}</Text>
            </Button>
          </View>
        );
      }
      return (
        <View className="flex-1 items-center justify-center bg-background">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-muted-foreground mt-3">{t('network.mapScreen.preparing')}</Text>
        </View>
      );
    }
```

`createNode.reset()` + `setAutoCreateAttempted(false)` membuat kondisi `useEffect` auto-create (baris 63-71) terpenuhi lagi sehingga mutate diulang.

- [ ] **Step 3: Verifikasi standar + manual**

Run: `npx tsc --noEmit && npm run lint && npm test`

Manual: matikan backend (atau airplane mode), login tenant yang punya lat/long tapi belum punya node → layar error + tombol retry muncul (bukan spinner abadi); nyalakan backend, tekan retry → peta terbentuk.

- [ ] **Step 4: Commit**

```bash
git add "app/(tabs)/map.tsx" src/locales/en.json src/locales/id.json
git commit -m "fix(mobile): show retry state when map auto-create fails instead of infinite spinner"
```

---

### Task 6: Monitoring detail tahan data null/NaN + refresh tidak balapan

**Files:**
- Create: `detso-mobile/src/lib/format.ts`
- Modify: `detso-mobile/src/components/screens/monitoring/monitoring-detail.tsx`
- Test: `detso-mobile/src/lib/__tests__/format.test.ts`

**Interfaces:**
- Consumes: shape data monitoring dari API (`cpu_load: number | null`, `memory_used`/`memory_total`: string numerik atau null, `active_sessions: number | null`, `uptime: string | null`).
- Produces di `src/lib/format.ts`:
  - `safeNumber(value: unknown, fallback?: number): number` (fallback default 0; tolak NaN/Infinity/non-numerik)
  - `formatBytes(value: unknown): string` (mis. `1536` → `"1.5 KB"`, input rusak → `"0 B"`)
  - `formatBps(value: unknown): string` (mis. `2_500_000` → `"2.5 Mbps"`, input rusak → `"0 bps"`)

- [ ] **Step 1: Tulis test yang gagal**

Buat `src/lib/__tests__/format.test.ts`:

```ts
import { safeNumber, formatBytes, formatBps } from '../format';

describe('safeNumber', () => {
  it('melewatkan angka valid', () => {
    expect(safeNumber(42.5)).toBe(42.5);
  });
  it('parse string numerik', () => {
    expect(safeNumber('128')).toBe(128);
  });
  it('fallback 0 untuk null/undefined/NaN/teks', () => {
    expect(safeNumber(null)).toBe(0);
    expect(safeNumber(undefined)).toBe(0);
    expect(safeNumber(NaN)).toBe(0);
    expect(safeNumber('abc')).toBe(0);
  });
  it('fallback bisa dikustom', () => {
    expect(safeNumber(null, 100)).toBe(100);
  });
});

describe('formatBytes', () => {
  it('format ukuran umum', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(1073741824)).toBe('1.0 GB');
  });
  it('input rusak jadi 0 B', () => {
    expect(formatBytes('abc')).toBe('0 B');
    expect(formatBytes(null)).toBe('0 B');
  });
});

describe('formatBps', () => {
  it('format bitrate umum', () => {
    expect(formatBps(500)).toBe('500 bps');
    expect(formatBps(2500000)).toBe('2.5 Mbps');
  });
  it('input rusak jadi 0 bps', () => {
    expect(formatBps(NaN)).toBe('0 bps');
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npm test -- format`
Expected: FAIL — module belum ada.

- [ ] **Step 3: Implementasi `src/lib/format.ts`**

```ts
export function safeNumber(value: unknown, fallback = 0): number {
  const n = typeof value === 'string' ? Number(value) : value;
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback;
}

export function formatBytes(value: unknown): string {
  const bytes = safeNumber(value);
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let v = bytes;
  let i = -1;
  do {
    v /= 1024;
    i++;
  } while (v >= 1024 && i < units.length - 1);
  return `${v.toFixed(1)} ${units[i]}`;
}

export function formatBps(value: unknown): string {
  const bps = safeNumber(value);
  if (bps < 1000) return `${bps} bps`;
  const units = ['Kbps', 'Mbps', 'Gbps'];
  let v = bps;
  let i = -1;
  do {
    v /= 1000;
    i++;
  } while (v >= 1000 && i < units.length - 1);
  return `${v.toFixed(1)} ${units[i]}`;
}
```

- [ ] **Step 4: Jalankan test, pastikan hijau**

Run: `npm test -- format`
Expected: PASS semua.

- [ ] **Step 5: Pakai di `monitoring-detail.tsx`**

Di `src/components/screens/monitoring/monitoring-detail.tsx`:

1. Import: `import { safeNumber, formatBytes, formatBps } from '@/src/lib/format';` dan hapus definisi lokal `formatBytes`/`formatBps` di file itu (beserta helper parse lokal yang jadi tak terpakai).
2. File ini SUDAH menghitung `memoryUsed`/`memoryTotal`/`memoryPercent` (dengan `parseInt` tanpa fallback) sebelum blok render — GANTI derivasi lama itu (jangan menambah deklarasi baru dengan nama sama) menjadi:

```ts
const cpuLoad = safeNumber(monitoring.cpu_load);
const memoryUsed = safeNumber(monitoring.memory_used);
const memoryTotal = safeNumber(monitoring.memory_total);
const memoryPercent = memoryTotal > 0 ? Math.round((memoryUsed / memoryTotal) * 100) : 0;
const activeSessions = safeNumber(monitoring.active_sessions);
```

3. Ganti semua pemakaian langsung: `monitoring.cpu_load.toFixed(0)` → `cpuLoad.toFixed(0)`, `monitoring.cpu_load.toFixed(1)` → `cpuLoad.toFixed(1)`, ambang warna `monitoring.cpu_load > 80` → `cpuLoad > 80` (dst.), `${monitoring.active_sessions}` → `${activeSessions}`, `{monitoring.uptime}` → `{monitoring.uptime ?? '-'}`, dan semua `formatBytes(...)`/`formatBps(...)` kini menerima nilai mentah apa pun tanpa parse manual.
4. Perbaiki refresh balapan: di handler refresh yang sekarang memanggil `forcePoll.mutate()` dan `refetch()` serentak, ganti menjadi:

```ts
const handleRefresh = () => {
  forcePoll.mutate(undefined, { onSettled: () => refetch() });
};
```

- [ ] **Step 6: Verifikasi standar + manual**

Run: `npx tsc --noEmit && npm run lint && npm test`

Manual: buka detail router yang belum pernah di-poll (data null) → layar tampil dengan 0/`-`, tidak crash; tarik refresh → hanya satu siklus request (cek log network).

- [ ] **Step 7: Commit**

```bash
git add src/lib/format.ts src/lib/__tests__/format.test.ts src/components/screens/monitoring/monitoring-detail.tsx
git commit -m "fix(mobile): null-safe monitoring detail and serialize force-poll refresh"
```
