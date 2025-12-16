"use client";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export const useTenantParams = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // 1. Ambil parameter dari URL
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const searchTerm = searchParams.get("search") || "";
  const isActive = searchParams.get("is_active") || "";

  // 2. Fungsi update params
  const updateParams = (newParams: Record<string, string | null>) => {
  const params = new URLSearchParams();

  const merged = {
    page: page.toString(),
    limit: limit.toString(),
    search: searchTerm || null,
    is_active: isActive || null,
    ...newParams,
  };

  Object.entries(merged).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });

  router.replace(`${pathname}?${params.toString()}`);
};


  // 3. Setters
  const setPage = (newPage: number) => updateParams({ page: newPage.toString() });
  const setLimit = (newLimit: number) => updateParams({ limit: newLimit.toString() });
  const setSearchTerm = (term: string) => updateParams({ search: term });
  const setIsActive = (value: string | null) => updateParams({ is_active: value });

  // 4. Reset Semua Filter
  const resetFilters = () => {
    updateParams({
      search: null,
      is_active: null,
      page: "1",
    });
  };

  return {
    // Values
    page,
    limit,
    searchTerm,
    isActive,

    // Setters
    setPage,
    setLimit,
    setSearchTerm,
    setIsActive,
    resetFilters,
  };
};