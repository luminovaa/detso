# Dashboard Teknisi Mobile — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengganti stub "coming soon" dashboard teknisi dengan home screen nyata: ringkasan angka hari ini, daftar jadwal hari ini, dan tiket aktif yang di-assign ke teknisi.

**Architecture:** 100% sisi mobile, nol perubahan backend. Data dirakit dari dua endpoint yang SUDAH memfilter otomatis untuk teknisi berdasarkan token: `GET /api/schedule` (backend memaksa `technician_id = user.id` di `backend/src/controller/schedule/get.schedule.ts:58-62`) dan `GET /api/ticket` (backend memaksa `assigned_to = user.id` di `backend/src/controller/ticket/get.ticket.ts:46-48`). Query tiket di-key di bawah `dashboardKeys.all` supaya otomatis ter-invalidate oleh event bus yang sudah ada (`src/hooks/use-global-events.ts` meng-invalidate `dashboardKeys.all` saat `EVENTS.TICKET.STATUS_CHANGED` dan `EVENTS.DASHBOARD.REFRESH`). Logika seleksi data diekstrak ke fungsi murni supaya bisa diunit-test.

**Tech Stack:** @tanstack/react-query 5, i18n-js (`useT`), NativeWind, komponen global yang sudah ada (Card, Badge, EmptyState, MetricCard, Skeleton).

## Global Constraints

- **Prasyarat:** Task 1 plan `2026-08-04-mobile-quickfix-keamanan.md` (infrastruktur jest-expo) sudah selesai — `npm test` harus sudah jalan.
- Semua perintah dari `detso-mobile/` dengan **npm**.
- Teks UI baru lewat i18n: tambah key di `src/locales/en.json` **dan** `src/locales/id.json`; akses via `const { t } = useT()` dari `@/src/features/i18n/store`.
- Warna via `useThemeColor()` dari `@/src/lib/theme-colors` (nama SINGULAR, bukan `useThemeColors`); jangan import `COLORS` statis.
- Axios instance adalah **default export**: `import api from '@/src/lib/api'`.
- Jangan menyentuh `backend/` atau `frontend/`.
- Verifikasi standar tiap task: `npx tsc --noEmit && npm run lint && npm test` dari `detso-mobile/`.

---

### Task 1: Selector murni + tipe data

**Files:**
- Create: `detso-mobile/src/features/dashboard/teknisi-selectors.ts`
- Test: `detso-mobile/src/features/dashboard/__tests__/teknisi-selectors.test.ts`

**Interfaces:**
- Consumes: shape response `GET /api/ticket` — `resp.data.tickets: [{ id, title, description, priority, status, created_at, type, customer: { id, name, phone, email }, service: { id, id_pel, package_name, address } | null, technician, schedule } ]`.
- Produces:
  - `interface TeknisiTicket` (field yang dipakai UI, lihat kode di Step 3)
  - `filterActiveTickets<T extends { status: string }>(tickets: T[]): T[]` — hanya OPEN dan IN_PROGRESS
  - `TICKET_STATUS_LABEL_KEYS: Record<'OPEN'|'IN_PROGRESS'|'RESOLVED'|'CLOSED', string>` — map status → key i18n yang SUDAH ada di locale

- [ ] **Step 1: Tulis test yang gagal**

Buat `src/features/dashboard/__tests__/teknisi-selectors.test.ts`:

```ts
import { filterActiveTickets, TICKET_STATUS_LABEL_KEYS } from '../teknisi-selectors';

describe('filterActiveTickets', () => {
  const tickets = [
    { id: '1', status: 'OPEN' },
    { id: '2', status: 'IN_PROGRESS' },
    { id: '3', status: 'RESOLVED' },
    { id: '4', status: 'CLOSED' },
  ];

  it('hanya menyisakan OPEN dan IN_PROGRESS', () => {
    expect(filterActiveTickets(tickets).map((t) => t.id)).toEqual(['1', '2']);
  });

  it('array kosong aman', () => {
    expect(filterActiveTickets([])).toEqual([]);
  });
});

describe('TICKET_STATUS_LABEL_KEYS', () => {
  it('memetakan semua status ke key i18n ticket.* yang ada', () => {
    expect(TICKET_STATUS_LABEL_KEYS.OPEN).toBe('ticket.statusOpen');
    expect(TICKET_STATUS_LABEL_KEYS.IN_PROGRESS).toBe('ticket.statusInProgress');
    expect(TICKET_STATUS_LABEL_KEYS.RESOLVED).toBe('ticket.statusResolved');
    expect(TICKET_STATUS_LABEL_KEYS.CLOSED).toBe('ticket.statusClosed');
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npm test -- teknisi-selectors`
Expected: FAIL — module belum ada.

- [ ] **Step 3: Implementasi `src/features/dashboard/teknisi-selectors.ts`**

```ts
export type TeknisiTicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface TeknisiTicket {
  id: string;
  title: string;
  status: TeknisiTicketStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  created_at: string;
  customer: { id: string; name: string; phone: string | null; email: string | null } | null;
  service: { id: string; id_pel: string | null; package_name: string; address: string | null } | null;
}

export function filterActiveTickets<T extends { status: string }>(tickets: T[]): T[] {
  return tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS');
}

/** Key i18n untuk label status — key ini sudah ada di src/locales/{en,id}.json grup "ticket". */
export const TICKET_STATUS_LABEL_KEYS: Record<TeknisiTicketStatus, string> = {
  OPEN: 'ticket.statusOpen',
  IN_PROGRESS: 'ticket.statusInProgress',
  RESOLVED: 'ticket.statusResolved',
  CLOSED: 'ticket.statusClosed',
};
```

- [ ] **Step 4: Jalankan test, pastikan hijau**

Run: `npm test -- teknisi-selectors`
Expected: PASS semua.

- [ ] **Step 5: Commit**

```bash
git add src/features/dashboard/teknisi-selectors.ts src/features/dashboard/__tests__/teknisi-selectors.test.ts
git commit -m "feat(mobile): add teknisi dashboard data selectors"
```

---

### Task 2: Hook tiket aktif teknisi

**Files:**
- Create: `detso-mobile/src/features/dashboard/teknisi-hooks.ts`

**Interfaces:**
- Consumes: `dashboardKeys` dari `src/features/dashboard/hooks.ts:5` (punya `.all`), `api` (default export `@/src/lib/api`), selector Task 1.
- Produces: `useTeknisiActiveTickets(): UseQueryResult<TeknisiTicket[]>` — tiket OPEN/IN_PROGRESS milik teknisi login.
- Catatan: untuk jadwal TIDAK perlu hook baru — layar memakai `useSchedules(params)` yang sudah ada di `src/features/schedule/hooks.ts:21` (params: `{ month?, year?, technician_id?, status? }`).

- [ ] **Step 1: Implementasi `src/features/dashboard/teknisi-hooks.ts`**

```ts
import { useQuery } from '@tanstack/react-query';
import api from '@/src/lib/api';
import { dashboardKeys } from './hooks';
import { filterActiveTickets, TeknisiTicket } from './teknisi-selectors';

export const teknisiKeys = {
  activeTickets: () => [...dashboardKeys.all, 'teknisi', 'active-tickets'] as const,
};

/**
 * Tiket aktif milik teknisi login. Backend sudah memaksa assigned_to = user.id
 * untuk role TENANT_TEKNISI, jadi tidak perlu (dan tidak ada) param filter teknisi.
 */
export function useTeknisiActiveTickets() {
  return useQuery({
    queryKey: teknisiKeys.activeTickets(),
    queryFn: async () => {
      const response = await api.get('/ticket', { params: { page: '1', limit: '20' } });
      return response.data;
    },
    select: (resp: any): TeknisiTicket[] => filterActiveTickets(resp?.data?.tickets ?? []),
  });
}
```

Key sengaja di bawah `dashboardKeys.all` supaya invalidation event bus yang sudah ada (`use-global-events.ts`) ikut me-refresh dashboard teknisi saat status tiket berubah.

- [ ] **Step 2: Verifikasi**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: semua hijau (hook belum dipakai, cukup lolos typecheck).

- [ ] **Step 3: Commit**

```bash
git add src/features/dashboard/teknisi-hooks.ts
git commit -m "feat(mobile): add active-tickets query hook for teknisi dashboard"
```

---

### Task 3: Komponen item jadwal & tiket

**Files:**
- Create: `detso-mobile/src/components/screens/dashboard/teknisi/today-schedule-item.tsx`
- Create: `detso-mobile/src/components/screens/dashboard/teknisi/assigned-ticket-item.tsx`

**Interfaces:**
- Consumes: `Badge({ label?, colorVariant? })` dari `@/src/components/global/badge`; `formatScheduleTime(startTime, endTime?, locale?)` dan `getScheduleStatusVariant(status)` dari `@/src/lib/schedule-utils`; `TICKET_STATUS_VARIANTS` dari `@/src/lib/ticket-constants`; `TICKET_STATUS_LABEL_KEYS` + `TeknisiTicket` dari Task 1; `useLanguageStore` dari `@/src/features/i18n/store` (field `locale: string`).
- Produces:
  - `TodayScheduleItem({ schedule: TodayScheduleItemData })` — tap → `/(tabs)/schedule`
  - `AssignedTicketItem({ ticket: TeknisiTicket })` — tap → `/ticket/{id}/detail`

- [ ] **Step 1: Buat `today-schedule-item.tsx`**

```tsx
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/src/components/global/text';
import { Badge } from '@/src/components/global/badge';
import { useT, useLanguageStore } from '@/src/features/i18n/store';
import { useThemeColor } from '@/src/lib/theme-colors';
import { formatScheduleTime, getScheduleStatusVariant } from '@/src/lib/schedule-utils';

export interface TodayScheduleItemData {
  id: string;
  title: string;
  start_time: string;
  end_time: string | null;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  ticket?: { customer?: { name: string } | null } | null;
}

export function TodayScheduleItem({ schedule }: { schedule: TodayScheduleItemData }) {
  const { t } = useT();
  const colors = useThemeColor();
  const locale = useLanguageStore((s) => s.locale);

  return (
    <TouchableOpacity
      className="bg-card border border-border rounded-xl p-4 mb-3 flex-row items-center"
      activeOpacity={0.7}
      onPress={() => router.push('/(tabs)/schedule')}
    >
      <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
        <Ionicons name="calendar-outline" size={20} color={colors.primary} />
      </View>
      <View className="flex-1 mr-2">
        <Text weight="semibold" className="text-foreground" numberOfLines={1}>
          {schedule.title}
        </Text>
        <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={1}>
          {formatScheduleTime(schedule.start_time, schedule.end_time, locale === 'en' ? 'en' : 'id')}
          {schedule.ticket?.customer?.name ? ` · ${schedule.ticket.customer.name}` : ''}
        </Text>
      </View>
      <Badge
        label={t(`schedule.status.${schedule.status.toLowerCase()}`)}
        colorVariant={getScheduleStatusVariant(schedule.status)}
      />
    </TouchableOpacity>
  );
}
```

(Key `schedule.status.scheduled|completed|cancelled` sudah ada di kedua locale.)

- [ ] **Step 2: Buat `assigned-ticket-item.tsx`**

```tsx
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/src/components/global/text';
import { Badge } from '@/src/components/global/badge';
import { useT } from '@/src/features/i18n/store';
import { useThemeColor } from '@/src/lib/theme-colors';
import { TICKET_STATUS_VARIANTS, TICKET_PRIORITY_COLORS } from '@/src/lib/ticket-constants';
import { TICKET_STATUS_LABEL_KEYS, TeknisiTicket } from '@/src/features/dashboard/teknisi-selectors';

export function AssignedTicketItem({ ticket }: { ticket: TeknisiTicket }) {
  const { t } = useT();
  const colors = useThemeColor();

  return (
    <TouchableOpacity
      className="bg-card border border-border rounded-xl p-4 mb-3 flex-row items-center"
      activeOpacity={0.7}
      onPress={() => router.push(`/ticket/${ticket.id}/detail`)}
    >
      <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
        <Ionicons
          name="document-text-outline"
          size={20}
          color={TICKET_PRIORITY_COLORS[ticket.priority] ?? colors.primary}
        />
      </View>
      <View className="flex-1 mr-2">
        <Text weight="semibold" className="text-foreground" numberOfLines={1}>
          {ticket.title}
        </Text>
        <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={1}>
          {ticket.customer?.name ?? '-'}
          {ticket.service?.package_name ? ` · ${ticket.service.package_name}` : ''}
        </Text>
      </View>
      <Badge
        label={t(TICKET_STATUS_LABEL_KEYS[ticket.status])}
        colorVariant={TICKET_STATUS_VARIANTS[ticket.status]}
      />
    </TouchableOpacity>
  );
}
```

Catatan: `TICKET_PRIORITY_COLORS` ada di `src/lib/ticket-constants.ts` (bersama `TICKET_STATUS_VARIANTS`, `TICKET_PRIORITY_VARIANTS`). Jika bentuknya bukan `Record<priority, string>` warna hex, ganti pemakaian ikon menjadi `color={colors.primary}` saja — jangan membuat mapping warna baru.

- [ ] **Step 3: Verifikasi**

Run: `npx tsc --noEmit && npm run lint && npm test`

- [ ] **Step 4: Commit**

```bash
git add src/components/screens/dashboard/teknisi/
git commit -m "feat(mobile): add teknisi dashboard list item components"
```

---

### Task 4: Rombak layar dashboard teknisi

**Files:**
- Modify: `detso-mobile/app/(tabs)/dashboards/tenant-teknisi-dashboard.tsx` (ganti seluruh isi stub)
- Modify: `detso-mobile/src/locales/en.json`, `detso-mobile/src/locales/id.json` (grup `teknisiDashboard`)

**Interfaces:**
- Consumes: `useSchedules` (`src/features/schedule/hooks.ts:21`), `useTeknisiActiveTickets` (Task 2), `TodayScheduleItem`/`AssignedTicketItem` (Task 3), `getSchedulesForDate(schedules, date)` dari `@/src/lib/calendar-utils:72`, `MetricCard({ icon, label, value, color, onPress? })` dari `@/src/components/screens/dashboard/metric-card`, `EmptyState` dari `@/src/components/global/empty-state`, `Skeleton` dari `@/src/components/global/skeleton`, `ScreenWrapper` + `useTabBarHeight` (sudah dipakai stub).
- Produces: screen `TenantTeknisiDashboard` (default export tetap, dipakai `app/(tabs)/index.tsx:56-57` — JANGAN ganti nama).

- [ ] **Step 1: Perbarui i18n grup `teknisiDashboard`**

Di `src/locales/en.json`, ganti isi grup `teknisiDashboard` menjadi (key `comingSoon` DIHAPUS karena tidak dipakai lagi):

```json
"teknisiDashboard": {
  "title": "Technician Dashboard",
  "welcome": "Welcome, {{name}}",
  "todaySchedules": "Today's Jobs",
  "activeTickets": "Active Tickets",
  "completedThisMonth": "Done This Month",
  "todayScheduleSection": "Today's Schedule",
  "ticketSection": "My Active Tickets",
  "noActiveTickets": "No active tickets",
  "noActiveTicketsDesc": "New tickets assigned to you will show up here."
}
```

Di `src/locales/id.json`:

```json
"teknisiDashboard": {
  "title": "Dashboard Teknisi",
  "welcome": "Selamat datang, {{name}}",
  "todaySchedules": "Tugas Hari Ini",
  "activeTickets": "Tiket Aktif",
  "completedThisMonth": "Selesai Bulan Ini",
  "todayScheduleSection": "Jadwal Hari Ini",
  "ticketSection": "Tiket Aktif Saya",
  "noActiveTickets": "Tidak ada tiket aktif",
  "noActiveTicketsDesc": "Tiket baru yang ditugaskan ke kamu akan muncul di sini."
}
```

- [ ] **Step 2: Ganti seluruh isi `app/(tabs)/dashboards/tenant-teknisi-dashboard.tsx`**

```tsx
import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

import { ScreenWrapper } from '@/src/components/global/screen-wrapper';
import { Text } from '@/src/components/global/text';
import { EmptyState } from '@/src/components/global/empty-state';
import { Skeleton } from '@/src/components/global/skeleton';
import { MetricCard } from '@/src/components/screens/dashboard/metric-card';
import { TodayScheduleItem, TodayScheduleItemData } from '@/src/components/screens/dashboard/teknisi/today-schedule-item';
import { AssignedTicketItem } from '@/src/components/screens/dashboard/teknisi/assigned-ticket-item';

import { useAuthStore } from '@/src/features/auth/store';
import { useSchedules } from '@/src/features/schedule/hooks';
import { useTeknisiActiveTickets } from '@/src/features/dashboard/teknisi-hooks';
import { useT } from '@/src/features/i18n/store';
import { useThemeColor } from '@/src/lib/theme-colors';
import { useTabBarHeight } from '@/src/hooks/use-tab-bar-height';
import { getSchedulesForDate } from '@/src/lib/calendar-utils';

export default function TenantTeknisiDashboard() {
  const user = useAuthStore((s) => s.user);
  const { t } = useT();
  const colors = useThemeColor();
  const { contentPaddingBottom } = useTabBarHeight();
  const [refreshing, setRefreshing] = useState(false);

  const now = useMemo(() => new Date(), []);
  const {
    data: scheduleResp,
    isLoading: schedulesLoading,
    refetch: refetchSchedules,
  } = useSchedules({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    technician_id: user?.id,
  });
  const {
    data: activeTickets,
    isLoading: ticketsLoading,
    refetch: refetchTickets,
  } = useTeknisiActiveTickets();

  const schedules = (scheduleResp?.data?.schedules ?? []) as TodayScheduleItemData[];
  const statistics = scheduleResp?.data?.statistics as
    | { total: number; scheduled: number; completed: number; cancelled: number }
    | undefined;
  const todaySchedules = useMemo(() => getSchedulesForDate(schedules, now), [schedules, now]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchSchedules(), refetchTickets()]);
    } finally {
      setRefreshing(false);
    }
  };

  const isLoading = schedulesLoading || ticketsLoading;

  return (
    <ScreenWrapper
      headerTitle={user?.username}
      showAvatar={true}
      showNotification={true}
      avatarSrc={user?.profile?.avatar}
      avatarAlt={user?.profile?.full_name || user?.username}
      noPadding
    >
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 16, paddingBottom: contentPaddingBottom }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {isLoading ? (
          <View>
            <View className="flex-row gap-3 mb-6">
              <Skeleton className="flex-1 h-24" />
              <Skeleton className="flex-1 h-24" />
              <Skeleton className="flex-1 h-24" />
            </View>
            <Skeleton className="h-16 mb-3" />
            <Skeleton className="h-16 mb-3" />
            <Skeleton className="h-16" />
          </View>
        ) : (
          <>
            {/* Metrics */}
            <View className="flex-row gap-3 mb-6">
              <MetricCard
                icon="calendar-outline"
                label={t('teknisiDashboard.todaySchedules')}
                value={todaySchedules.length}
                color={colors.primary}
              />
              <MetricCard
                icon="document-text-outline"
                label={t('teknisiDashboard.activeTickets')}
                value={activeTickets?.length ?? 0}
                color={colors.warning}
              />
              <MetricCard
                icon="checkmark-circle-outline"
                label={t('teknisiDashboard.completedThisMonth')}
                value={statistics?.completed ?? 0}
                color={colors.success}
              />
            </View>

            {/* Jadwal hari ini */}
            <Text weight="bold" className="text-lg text-foreground mb-3">
              {t('teknisiDashboard.todayScheduleSection')}
            </Text>
            {todaySchedules.length === 0 ? (
              <View className="mb-6">
                <EmptyState icon="calendar-outline" title={t('schedule.noSchedules')} />
              </View>
            ) : (
              <View className="mb-6">
                {todaySchedules.map((s) => (
                  <TodayScheduleItem key={s.id} schedule={s} />
                ))}
              </View>
            )}

            {/* Tiket aktif */}
            <Text weight="bold" className="text-lg text-foreground mb-3">
              {t('teknisiDashboard.ticketSection')}
            </Text>
            {(activeTickets?.length ?? 0) === 0 ? (
              <EmptyState
                icon="document-text-outline"
                title={t('teknisiDashboard.noActiveTickets')}
                description={t('teknisiDashboard.noActiveTicketsDesc')}
              />
            ) : (
              <View>
                {activeTickets!.map((ticket) => (
                  <AssignedTicketItem key={ticket.id} ticket={ticket} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}
```

Catatan implementasi:
- `technician_id: user?.id` dikirim untuk konsistensi dengan `app/(tabs)/schedule.tsx:37-41`; backend tetap memaksanya via token.
- Jika prop `noPadding` membuat layout ganda dengan `px-4` (lihat perilaku `ScreenWrapper` di `src/components/global/screen-wrapper.tsx:36-52`), buang `noPadding` dan `px-4` salah satunya — sesuaikan dengan yang dipakai `tenant-admin-dashboard.tsx`.
- Ikon `MetricCard` bertipe `keyof Ionicons.glyphMap`; tiga nama di atas valid.

- [ ] **Step 3: Verifikasi standar**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: semua hijau.

- [ ] **Step 4: Verifikasi manual (expo start, login sebagai teknisi)**

1. Dashboard menampilkan 3 metric, bukan "coming soon".
2. Jadwal yang dibuat admin untuk teknisi ini hari ini muncul di section jadwal; tap → pindah ke tab Schedule.
3. Tiket OPEN/IN_PROGRESS yang di-assign muncul; tiket RESOLVED tidak. Tap → detail tiket.
4. Ubah status tiket dari layar detail → kembali ke dashboard → daftar ter-refresh otomatis (invalidation event bus).
5. Pull-to-refresh menyegarkan kedua daftar; cek juga dark mode.

- [ ] **Step 5: Cek sisa pemakaian key yang dihapus**

Run: `grep -rn "teknisiDashboard.comingSoon" src/ app/`
Expected: tidak ada hasil.

- [ ] **Step 6: Commit**

```bash
git add "app/(tabs)/dashboards/tenant-teknisi-dashboard.tsx" src/locales/en.json src/locales/id.json
git commit -m "feat(mobile): replace teknisi dashboard stub with real home screen"
```
