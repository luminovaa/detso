# Skeleton Loading Pattern Guide

Quick reference untuk implementasi skeleton loading di list screens.

## 📋 Pattern Overview

Semua list screens menggunakan skeleton loading untuk initial load, dan spinner untuk load more (pagination).

## 🎯 When to Use

- ✅ **Initial Load** - Gunakan skeleton untuk first time loading
- ✅ **Empty State** - Gunakan EmptyState component (bukan skeleton)
- ❌ **Load More** - Gunakan spinner di ListFooterComponent
- ❌ **Pull to Refresh** - Gunakan native RefreshControl

## 🏗️ Implementation Steps

### 1. Create Skeleton Component

```tsx
// src/components/screens/[feature]/skeleton-loading.tsx
import { Skeleton } from "@/src/components/global/skeleton";
import { Card } from "@/src/components/global/card";
import { View } from "react-native";

export function [Feature]SkeletonLoading() {
  return (
    <View className="pt-2">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <Card key={i} className="mb-3 overflow-hidden border-border/40">
          <View className="flex-row items-center p-4">
            {/* Mirror exact structure of [Feature]Item component */}
            <Skeleton className="w-12 h-12 rounded-xl" />
            
            <View className="flex-1 ml-3">
              <Skeleton className="h-4 w-40 rounded-lg mb-1" />
              <Skeleton className="h-3 w-36 rounded-lg mt-0.5" />
              
              <View className="flex-row mt-2 gap-x-2">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </View>
            </View>
          </View>
        </Card>
      ))}
    </View>
  );
}
```

### 2. Update List Screen

```tsx
// app/[feature]/index.tsx
import { [Feature]SkeletonLoading } from "@/src/components/screens/[feature]/skeleton-loading";

export default function [Feature]Screen() {
  const { data, isLoading, isFetchingNextPage, ... } = useInfinite[Feature]s({ limit: 10 });

  return (
    <ScreenWrapper headerTitle={t("[feature].title")} showBackButton isLoading={isLoading}>
      {/* Search Bar - Always visible */}
      <View className="pt-4 pb-2">
        <SearchBar ... />
      </View>

      {/* Conditional Rendering */}
      {isLoading ? (
        <[Feature]SkeletonLoading />
      ) : (
        <FlatList
          data={items}
          renderItem={({ item }) => <[Feature]Item item={item} />}
          
          {/* Load More Spinner */}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="py-4 items-center">
                <ActivityIndicator color="hsl(var(--primary))" />
              </View>
            ) : null
          }
          
          {/* Pull to Refresh */}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching && !isFetchingNextPage}
              onRefresh={handleRefresh}
            />
          }
          
          {/* Empty State */}
          ListEmptyComponent={
            <EmptyState
              icon="[icon-name]"
              title={t("[feature].emptyTitle")}
              description={t("[feature].emptyDesc")}
            />
          }
        />
      )}
    </ScreenWrapper>
  );
}
```

## 📐 Skeleton Design Rules

### Sizing Guidelines

| Element | Height | Width | Border Radius |
|---------|--------|-------|---------------|
| Avatar | h-12 | w-12 | rounded-full |
| Icon | h-12 or h-14 | w-12 or w-14 | rounded-xl |
| Title Text | h-4 | w-32 to w-40 | rounded-lg |
| Subtitle Text | h-3 | w-24 to w-48 | rounded-lg |
| Badge | h-5 | w-16 to w-24 | rounded-full |
| Large Badge | h-6 | w-28 | rounded-full |
| Chevron | h-5 | w-5 | rounded-full |

### Spacing Guidelines

- **Card margin**: `mb-3` (12px)
- **Card padding**: `p-4` (16px)
- **Content margin left**: `ml-3` (12px)
- **Text margin top**: `mt-0.5` (2px) or `mt-1` (4px)
- **Badge margin top**: `mt-2` (8px)
- **Badge gap**: `gap-x-2` (8px)

### Container Padding

```tsx
<View className="pt-2">  {/* Top padding for first item */}
  {/* Skeleton items */}
</View>
```

## 🎨 Common Skeleton Patterns

### Pattern 1: Avatar + Text + Badge
```tsx
<Skeleton className="w-12 h-12 rounded-full" />
<View className="flex-1 ml-3">
  <Skeleton className="h-4 w-40 rounded-lg mb-1" />
  <Skeleton className="h-3 w-48 rounded-lg mt-0.5" />
  <View className="flex-row mt-2">
    <Skeleton className="h-5 w-20 rounded-full" />
  </View>
</View>
```

### Pattern 2: Icon + Text + Multiple Badges
```tsx
<Skeleton className="w-12 h-12 rounded-xl" />
<View className="flex-1 ml-3">
  <Skeleton className="h-4 w-40 rounded-lg mb-1" />
  <Skeleton className="h-3 w-36 rounded-lg mt-0.5" />
  <View className="flex-row items-center mt-2 gap-x-2">
    <Skeleton className="h-5 w-24 rounded-full" />
    <Skeleton className="h-5 w-20 rounded-full" />
  </View>
</View>
```

### Pattern 3: Icon + Text + Stats Row
```tsx
<Skeleton className="w-12 h-12 rounded-full" />
<View className="flex-1 ml-4">
  <View className="flex-row justify-between items-start mb-1">
    <Skeleton className="h-4 w-32 rounded-lg flex-1 mr-2" />
    <Skeleton className="h-5 w-16 rounded-full" />
  </View>
  <Skeleton className="h-3 w-48 rounded-lg mb-3" />
  <View className="flex-row gap-x-4">
    <Skeleton className="h-3 w-24 rounded-lg" />
    <Skeleton className="h-3 w-24 rounded-lg" />
  </View>
</View>
```

## 🔢 Skeleton Count

**Standard: 8 items**

Calculated based on:
- Small screens (iPhone SE): 8 items needed
- Medium screens (iPhone 12/13/14): 10 items needed
- Large screens (iPhone 14 Pro Max): 11 items needed

8 items is optimal balance between coverage and performance.

## ✅ Checklist

When implementing skeleton loading:

- [ ] Skeleton structure matches real item component exactly
- [ ] Card wrapper uses `className="mb-3 overflow-hidden border-border/40"`
- [ ] Container padding is `p-4`
- [ ] Skeleton count is 8 items
- [ ] Skeleton uses `pt-2` for top padding
- [ ] Load more uses spinner (not skeleton)
- [ ] Pull to refresh uses RefreshControl
- [ ] Search bar is visible during skeleton loading
- [ ] Empty state uses EmptyState component
- [ ] No TypeScript errors
- [ ] No layout shift when data loads

## 🚫 Common Mistakes

1. **Wrong skeleton count** - Use 8, not 10 or arbitrary number
2. **Mismatched structure** - Skeleton must mirror real item exactly
3. **Wrong spacing** - Use exact same spacing as real item
4. **Skeleton for load more** - Use spinner instead
5. **Skeleton for refresh** - Use RefreshControl instead
6. **Wrong padding** - Container should be `pt-2`, not `pt-4`

## 📚 Examples

See existing implementations:
- `src/components/screens/team/skeleton-loading.tsx`
- `src/components/screens/customer/skeleton-loading.tsx`
- `src/components/screens/service/skeleton-loading.tsx`
- `src/components/screens/package/skeleton-loading.tsx`
- `src/components/screens/isp/skeleton-loading.tsx`

## 🎯 Benefits

1. **Better UX** - Users see content structure immediately
2. **Reduced Perceived Load Time** - Skeleton gives impression of faster loading
3. **No Layout Shift** - Skeleton matches exact dimensions of real items
4. **Consistent Pattern** - All list screens use same loading approach
5. **Modern Design** - Matches patterns from Instagram, Facebook, LinkedIn
6. **Performance** - Optimized with 8 items instead of 10

## 🔄 Loading State Flow

```
User Opens Screen
       ↓
  isLoading = true
       ↓
Show Skeleton (8 items)
       ↓
  Data Loaded
       ↓
  isLoading = false
       ↓
Show FlatList with Data
       ↓
User Scrolls to Bottom
       ↓
isFetchingNextPage = true
       ↓
Show Spinner at Bottom
       ↓
  More Data Loaded
       ↓
isFetchingNextPage = false
       ↓
Append to FlatList
```

## 💡 Tips

1. **Match Exact Dimensions** - Use same width/height as real components
2. **Use Semantic Sizes** - h-4 for titles, h-3 for subtitles, h-5 for badges
3. **Consistent Spacing** - Use same mb/mt/ml/gap as real items
4. **Test on Multiple Screens** - Verify on small, medium, and large screens
5. **No Over-Engineering** - Keep it simple, match the real item structure
