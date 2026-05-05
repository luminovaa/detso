# AGENTS.md - Detso Mobile

> Panduan spesifik untuk AI agents yang bekerja dengan mobile app Detso.

## Overview

Detso Mobile adalah aplikasi mobile untuk teknisi dan staff ISP. Dibangun dengan **Expo SDK 54 + React Native + TypeScript**. Menggunakan file-based routing (Expo Router) dan feature-based architecture.

- **Framework:** Expo SDK 54 + React Native 0.81
- **Language:** TypeScript 5.9 (strict mode)
- **Package Manager:** npm
- **Min Target:** Android & iOS

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | Expo SDK 54 |
| UI | React Native 0.81 + NativeWind (Tailwind) |
| Navigation | Expo Router 6 (file-based routing) |
| State Management | Zustand 5 |
| Server State | TanStack React Query 5 |
| Forms | React Hook Form 7 + Zod 4 |
| HTTP Client | Axios |
| Maps | @rnmapbox/maps |
| Camera | react-native-vision-camera |
| Image Picker | expo-image-picker + expo-image-manipulator |
| Secure Storage | expo-secure-store |
| Animations | react-native-reanimated 4 |
| Bottom Sheet | @gorhom/bottom-sheet |
| i18n | i18next + react-i18next |
| Date | date-fns |
| Styling | NativeWind 4 (Tailwind CSS for RN) |

## Project Structure

```
detso-mobile/
├── app/                          # File-based routing (Expo Router)
│   ├── _layout.tsx               # Root layout (providers, auth check)
│   ├── index.tsx                 # Splash/redirect
│   ├── +not-found.tsx            # 404 page
│   ├── sign-in/                  # Login screen
│   ├── (tabs)/                   # Tab navigator
│   │   ├── _layout.tsx           # Tab bar config
│   │   ├── index.tsx             # Home/Dashboard
│   │   ├── schedule.tsx          # Schedule tab
│   │   ├── isp.tsx               # ISP management (Super Admin)
│   │   ├── map.tsx               # Network map
│   │   ├── settings.tsx          # Settings
│   │   └── dashboards/           # Role-specific dashboards
│   ├── customer/                 # Customer screens (CRUD)
│   ├── package/                  # Package screens (CRUD)
│   ├── service/                  # Service connection screens
│   ├── ticket/                   # Ticket screens (CRUD)
│   ├── team/                     # Team/user management
│   ├── isp/                      # ISP/tenant management
│   ├── odp/                      # ODP network node screens
│   ├── settings/                 # Settings sub-screens
│   └── all-menu/                 # All menu grid
├── src/
│   ├── components/
│   │   ├── global/               # Shared components (toast, tab-bar, etc)
│   │   └── screens/              # Screen-specific components
│   │       ├── customer/
│   │       ├── dashboard/
│   │       ├── isp/
│   │       ├── network/
│   │       ├── package/
│   │       ├── schedule/
│   │       ├── service/
│   │       ├── settings/
│   │       ├── team/
│   │       └── ticket/
│   ├── features/                 # Feature modules (business logic)
│   │   ├── auth/                 # Auth store, service, schema
│   │   ├── customer/             # Customer hooks, service, schema
│   │   ├── connection-service/   # Service connection logic
│   │   ├── dashboard/            # Dashboard hooks & types
│   │   ├── i18n/                 # Internationalization store
│   │   ├── network/              # Network topology logic
│   │   ├── package/              # Package hooks, service, schema
│   │   ├── schedule/             # Schedule hooks, service, schema
│   │   ├── tenant/               # Tenant hooks, service, schema
│   │   ├── theme/                # Theme store (dark/light)
│   │   ├── ticket/               # Ticket hooks, service, schema
│   │   └── user/                 # User hooks, service, schema
│   ├── hooks/                    # Shared custom hooks
│   │   ├── use-async.ts
│   │   ├── use-debounce-search.ts
│   │   ├── use-event-bus.ts
│   │   ├── use-global-events.ts
│   │   ├── use-image-picker.ts
│   │   ├── use-secure-router.ts
│   │   └── use-tab-bar-height.ts
│   ├── lib/                      # Core utilities
│   │   ├── api.ts                # Axios instance + interceptors
│   │   ├── api-error.ts          # Error handling utilities
│   │   ├── auth-events.ts        # Auth event constants
│   │   ├── badge-variants.ts     # Badge styling variants
│   │   ├── base-schemas.ts       # Shared Zod schemas
│   │   ├── calendar-utils.ts     # Calendar helpers
│   │   ├── camera-utils.ts       # Camera utilities
│   │   ├── colors.ts             # Color palette
│   │   ├── config.ts             # App configuration
│   │   ├── event-bus.ts          # Global event bus
│   │   ├── format-date.ts        # Date formatting
│   │   ├── jwt.ts                # JWT decode/expiry check
│   │   ├── map-utils.ts          # Mapbox utilities
│   │   ├── phone-utils.ts        # Phone number formatting
│   │   ├── query-client.ts       # React Query client config
│   │   ├── schedule-utils.ts     # Schedule helpers
│   │   ├── status-variants.ts    # Status badge variants
│   │   ├── ticket-constants.ts   # Ticket type/priority constants
│   │   ├── token-refresh.ts      # Token refresh with lock
│   │   ├── types.ts              # Shared TypeScript types
│   │   └── utils.ts              # General utilities (cn, clsx)
│   └── locales/                  # i18n translation files
├── assets/                       # Static assets (fonts, images)
├── global.css                    # Tailwind global styles
├── tailwind.config.js            # Tailwind/NativeWind config
├── app.json                      # Expo app config
├── babel.config.js               # Babel config (NativeWind)
└── metro.config.js               # Metro bundler config
```

## Architecture Patterns

### 1. Feature Module Pattern

Setiap feature domain memiliki struktur konsisten:

```
src/features/{domain}/
├── hooks.ts      # React Query hooks (useQuery, useMutation)
├── service.ts    # API service functions (axios calls)
├── schema.ts     # Zod validation schemas + TypeScript types
├── store.ts      # Zustand store (jika perlu local state)
└── types.ts      # Additional TypeScript types (jika perlu)
```

**Contoh membuat feature baru:**

```typescript
// src/features/example/service.ts
import api from '@/src/lib/api';
import { CreateExampleInput } from './schema';

export const exampleService = {
  getAll: async (params?: any) => {
    const response = await api.get('/example', { params });
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/example/${id}`);
    return response.data;
  },
  create: async (data: CreateExampleInput) => {
    const response = await api.post('/example', data);
    return response.data;
  },
};
```

```typescript
// src/features/example/hooks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exampleService } from './service';

export const exampleKeys = {
  all: ['examples'] as const,
  lists: () => [...exampleKeys.all, 'list'] as const,
  list: (params?: any) => [...exampleKeys.lists(), params] as const,
  detail: (id: string) => [...exampleKeys.all, 'detail', id] as const,
};

export function useExamples(params?: any) {
  return useQuery({
    queryKey: exampleKeys.list(params),
    queryFn: () => exampleService.getAll(params),
  });
}

export function useCreateExample() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: exampleService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exampleKeys.lists() });
    },
  });
}
```

### 2. Screen Component Pattern

Screens di `app/` directory harus minimal - delegasikan logic ke components:

```typescript
// app/example/index.tsx (SCREEN - minimal logic)
import { ExampleList } from '@/src/components/screens/example/example-list';

export default function ExampleScreen() {
  return <ExampleList />;
}
```

```typescript
// src/components/screens/example/example-list.tsx (COMPONENT - actual logic)
import { useExamples } from '@/src/features/example/hooks';
// ... component implementation
```

### 3. Authentication & Token Management

**Flow:**
1. Login → Store tokens di `expo-secure-store`
2. API requests → Axios interceptor attach Bearer token
3. 401 response → Auto-refresh token (with queue for concurrent requests)
4. Refresh gagal → Emit `SESSION_EXPIRED` event → Redirect ke login

**Key files:**
- `src/features/auth/store.ts` - Zustand auth store (login, logout, checkAuth, autoRefresh)
- `src/lib/api.ts` - Axios instance dengan request/response interceptors
- `src/lib/token-refresh.ts` - Token refresh with lock (prevent duplicate refreshes)
- `src/hooks/use-secure-router.ts` - Protected route guard

**Token storage:**
```typescript
import * as SecureStore from 'expo-secure-store';

// Tokens disimpan di secure storage (encrypted)
await SecureStore.setItemAsync('accessToken', token);
await SecureStore.setItemAsync('refreshToken', refreshToken);
```

### 4. Event Bus Pattern

Cross-feature communication menggunakan event bus:

```typescript
import { eventBus, EVENTS } from '@/src/lib/event-bus';

// Emit event
eventBus.emit(EVENTS.AUTH.SESSION_EXPIRED);
eventBus.emit(EVENTS.CUSTOMER.CREATED, { id: '...' });

// Listen to event (in hooks)
import { useEventBus } from '@/src/hooks/use-event-bus';

useEventBus(EVENTS.CUSTOMER.CREATED, (data) => {
  // Invalidate queries, show toast, etc.
});
```

### 5. Role-Based UI

Tab visibility dan fitur dikontrol berdasarkan role user:

```typescript
const { user } = useAuthStore();

// Hide tab untuk role tertentu
<Tabs.Screen
  name="schedule"
  options={{
    href: user?.role === "SAAS_SUPER_ADMIN" ? null : undefined,
  }}
/>

// Conditional rendering
{user?.role !== 'TENANT_TEKNISI' && <AdminOnlyComponent />}
```

### 6. Internationalization (i18n)

```typescript
import { useT } from '@/src/features/i18n/store';

function MyComponent() {
  const { t } = useT();
  return <Text>{t('customer.createTitle')}</Text>;
}
```

Translation files: `src/locales/`

## Styling (NativeWind / Tailwind)

**Gunakan NativeWind (Tailwind CSS for React Native):**

```tsx
import { View, Text } from 'react-native';

// Tailwind classes langsung di className
<View className="flex-1 bg-white dark:bg-gray-900 p-4">
  <Text className="text-lg font-semibold text-gray-900 dark:text-white">
    Hello
  </Text>
</View>
```

**Utility function untuk conditional classes:**
```typescript
import { cn } from '@/src/lib/utils';

<View className={cn('p-4 rounded-lg', isActive && 'bg-blue-100')} />
```

**Color palette:** Defined di `src/lib/colors.ts`
**Tailwind config:** `tailwind.config.js` (custom fonts, colors, etc.)

## Navigation (Expo Router)

**File-based routing:**
- `app/index.tsx` → `/`
- `app/customer/index.tsx` → `/customer`
- `app/customer/[id]/detail/index.tsx` → `/customer/:id/detail`
- `app/(tabs)/index.tsx` → Tab home screen

**Navigation patterns:**
```typescript
import { useRouter } from 'expo-router';

const router = useRouter();

// Navigate
router.push('/customer/create');
router.push(`/customer/${id}/detail`);

// Replace (no back)
router.replace('/sign-in');

// Go back
router.back();
```

**Dynamic routes:**
```typescript
// app/customer/[id]/detail/index.tsx
import { useLocalSearchParams } from 'expo-router';

export default function CustomerDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // ...
}
```

## API Integration

**Base configuration (`src/lib/config.ts`):**
```typescript
export const config = {
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.10:3000/api',
  MAPBOX_PUBLIC_TOKEN: process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '',
  API_TIMEOUT: 15000,
  REFRESH_BEFORE_EXPIRY: 2 * 60, // 2 minutes
};
```

**Axios instance (`src/lib/api.ts`):**
- Auto-attach Bearer token dari SecureStore
- Auto-refresh token on 401
- Queue concurrent requests during refresh
- Emit events on server error / session expired

## Provider Stack (Root Layout)

```
QueryClientProvider (React Query)
  └── ThemeProvider (Dark/Light mode)
      └── GestureHandlerRootView
          └── ErrorBoundary
              └── PortalProvider
                  └── BottomSheetModalProvider
                      └── ToastProvider
                          └── GlobalLogic (event listeners)
                              └── Stack (Expo Router)
```

## Forms (React Hook Form + Zod)

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCustomerSchema, CreateCustomerInput } from '@/src/features/customer/schema';

const { control, handleSubmit, formState: { errors } } = useForm<CreateCustomerInput>({
  resolver: zodResolver(createCustomerSchema),
});

const onSubmit = handleSubmit((data) => {
  createMutation.mutate(data);
});
```

## Commands

```bash
# Development
npx expo start          # Start Expo dev server
npx expo start --clear  # Start with cache clear

# Build
npx expo run:android    # Build & run on Android
npx expo run:ios        # Build & run on iOS

# Lint
npx expo lint           # Run ESLint

# Reset
npm run reset-project   # Reset to blank project
```

## Coding Rules (Mobile-Specific)

### DO:
- Gunakan `@/` path alias untuk imports (`@/src/...`, `@/app/...`)
- Gunakan NativeWind classes untuk styling (bukan StyleSheet)
- Gunakan `expo-secure-store` untuk data sensitif (tokens)
- Gunakan React Query untuk server state
- Gunakan Zustand untuk client-only state
- Gunakan event bus untuk cross-feature communication
- Pisahkan screen (app/) dan component logic (src/components/)
- Gunakan `useT()` hook untuk semua user-facing text (i18n)
- Support dark mode (`dark:` prefix di Tailwind classes)

### DON'T:
- Jangan simpan tokens di AsyncStorage (gunakan SecureStore)
- Jangan fetch data langsung di screen files (gunakan hooks dari features/)
- Jangan hardcode API URL (gunakan config.ts)
- Jangan hardcode strings (gunakan i18n)
- Jangan buat inline styles (gunakan NativeWind)
- Jangan ignore TypeScript errors
- Jangan bypass auth check di protected screens
- Jangan import dari `node_modules` langsung jika ada Expo equivalent

## Environment Variables

```env
# .env.development
EXPO_PUBLIC_API_URL=http://192.168.1.10:6589/api
EXPO_PUBLIC_MAPBOX_TOKEN=pk.your_mapbox_token_here
```

**Catatan:** Semua env vars untuk Expo HARUS prefix `EXPO_PUBLIC_` agar accessible di client.

## Key Patterns to Follow

### Query Key Factory
```typescript
export const entityKeys = {
  all: ['entities'] as const,
  lists: () => [...entityKeys.all, 'list'] as const,
  list: (params?: any) => [...entityKeys.lists(), params] as const,
  details: () => [...entityKeys.all, 'detail'] as const,
  detail: (id: string) => [...entityKeys.details(), id] as const,
};
```

### Mutation with Cache Invalidation
```typescript
export function useCreateEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: entityService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.lists() });
      eventBus.emit(EVENTS.ENTITY.CREATED);
      showToast.success('Berhasil', 'Data berhasil dibuat');
    },
    onError: (error) => {
      showErrorToast(error, 'Gagal membuat data');
    },
  });
}
```

### Infinite Scroll Pattern
```typescript
export function useInfiniteEntities(params?: Omit<Input, 'page'>) {
  return useInfiniteQuery({
    queryKey: [...entityKeys.lists(), 'infinite', params],
    queryFn: ({ pageParam }) => entityService.getAll({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const pagination = lastPage?.data?.pagination;
      return pagination?.hasNextPage ? pagination.currentPage + 1 : undefined;
    },
  });
}
```
