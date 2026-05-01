# Badge Color Variants System

Sistem reusable untuk warna badge yang konsisten di seluruh aplikasi.

## Overview

File `src/lib/badge-variants.ts` menyediakan centralized color system untuk badges, pills, dan status indicators menggunakan Tailwind CSS classes.

## Features

- ✅ Type-safe dengan TypeScript
- ✅ Konsisten dengan Tailwind CSS
- ✅ Support dark mode
- ✅ Mudah di-extend dengan warna baru
- ✅ Reusable di semua komponen

## Available Variants

### Status Colors
- `success` - Green (untuk status ACTIVE, success states)
- `error` - Red (untuk status SUSPENDED, error states)
- `warning` - Amber (untuk warnings, TENANT_OWNER role)
- `info` - Blue (untuk informational badges, TENANT_ADMIN role)
- `neutral` - Gray (untuk status INACTIVE, default states)

### Semantic Colors
- `primary` - Primary theme color
- `secondary` - Secondary theme color

### Extended Palette
- `purple`, `pink`, `indigo`, `teal`, `orange`, `cyan`
- `lime`, `emerald`, `sky`, `violet`, `fuchsia`, `rose`

## Usage

### Basic Usage with Badge Component

```tsx
import { Badge } from "@/components/global/badge";

// Simple usage
<Badge colorVariant="success">Active</Badge>
<Badge colorVariant="error">Suspended</Badge>
<Badge colorVariant="warning">Owner</Badge>
<Badge colorVariant="info">Admin</Badge>
```

### Dynamic Variant Selection

```tsx
import { Badge } from "@/components/global/badge";
import { BadgeVariantKey } from "@/lib/badge-variants";

function StatusBadge({ status }: { status: string }) {
  const getStatusColor = (status: string): BadgeVariantKey => {
    switch (status) {
      case "ACTIVE":
        return "success";
      case "INACTIVE":
        return "neutral";
      case "SUSPENDED":
        return "error";
      default:
        return "neutral";
    }
  };

  return (
    <Badge colorVariant={getStatusColor(status)}>
      {status}
    </Badge>
  );
}
```

### Manual Usage (Without Badge Component)

```tsx
import { badgeVariants, getBadgeTextClass } from "@/lib/badge-variants";

function CustomBadge() {
  const colors = badgeVariants.success;
  
  return (
    <View className={`${colors.bg} ${colors.border} rounded-full px-2.5 py-0.5`}>
      <Text className={getBadgeTextClass("success")}>
        Active
      </Text>
    </View>
  );
}
```

## Color Structure

Each variant includes:
- `bg` - Background color with opacity (e.g., `bg-green-500/10`)
- `border` - Border color with opacity (e.g., `border-green-500/20`)
- `text` - Text color (e.g., `text-green-600`)
- `textDark` - Optional dark mode text color (e.g., `dark:text-green-400`)

## Helper Functions

### `getBadgeTextClass(variant: BadgeVariantKey): string`
Returns text class with dark mode support.

```tsx
getBadgeTextClass("success") 
// Returns: "text-green-600 dark:text-green-400"
```

### `getBadgeClasses(variant: BadgeVariantKey): string`
Returns combined background and border classes.

```tsx
getBadgeClasses("success")
// Returns: "bg-green-500/10 border-green-500/20"
```

## Adding New Variants

To add a new color variant:

1. Open `src/lib/badge-variants.ts`
2. Add new entry to `badgeVariants` object:

```typescript
export const badgeVariants = {
  // ... existing variants
  
  myNewColor: {
    bg: "bg-mycolor-500/10",
    border: "border-mycolor-500/20",
    text: "text-mycolor-600",
    textDark: "dark:text-mycolor-400", // optional
  },
} as const;
```

3. TypeScript will automatically infer the new variant type

## Migration from Old Pattern

### Before (Manual Colors)
```tsx
const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case "TENANT_OWNER":
      return { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-600" };
    // ...
  }
};

const roleColors = getRoleBadgeColor(item.role);

<Badge variant="default" className={`${roleColors.bg} ${roleColors.border}`}>
  <Text className={`text-[10px] ${roleColors.text}`}>
    {roleLabel}
  </Text>
</Badge>
```

### After (Badge Variants)
```tsx
const getRoleBadgeColor = (role: string): BadgeVariantKey => {
  switch (role) {
    case "TENANT_OWNER":
      return "warning";
    // ...
  }
};

<Badge colorVariant={getRoleBadgeColor(item.role)}>
  {roleLabel}
</Badge>
```

## Benefits

1. **Consistency** - Semua badge menggunakan warna yang sama
2. **Maintainability** - Ubah warna di satu tempat, apply ke semua
3. **Type Safety** - TypeScript akan error jika variant tidak ada
4. **Less Code** - Tidak perlu declare warna di setiap komponen
5. **Dark Mode** - Built-in support untuk dark mode

## Examples in Codebase

- `src/components/screens/team/team-item.tsx` - Role badges
- `src/components/screens/customer/customer-item.tsx` - Status badges
- `src/components/screens/service/service-item.tsx` - Service status badges
- `src/components/screens/package/package-item.tsx` - Price badges
