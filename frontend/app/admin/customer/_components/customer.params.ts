"use client";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export const useCustomerParams = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // 1. Ambil parameter dari URL
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const searchTerm = searchParams.get("search") || "";
  
  // Ambil filter (default string kosong jika tidak ada)
  const status = searchParams.get("status") || "";
  const package_name = searchParams.get("package_name") || ""; // FIXED: konsisten dengan backend

  // 2. Fungsi update params
  const updateParams = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(newParams).forEach(([key, value]) => {
      // Jika value null, string kosong, atau "all", hapus dari URL agar bersih
      if (value === null || value === "" || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    // Reset ke halaman 1 jika salah satu filter ini berubah
    const filterKeys = ["search", "status", "package_name"];
    const isFilterChanged = Object.keys(newParams).some((key) => 
      filterKeys.includes(key)
    );
    
    if (isFilterChanged) {
      params.set("page", "1");
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  // 3. Setters
  const setPage = (newPage: number) => updateParams({ page: newPage.toString() });
  const setLimit = (newLimit: number) => updateParams({ limit: newLimit.toString() });
  
  // Setter Search
  const setSearchTerm = (term: string) => updateParams({ search: term });
  
  // Setter Filter
  const setStatus = (statusValue: string | null) => updateParams({ status: statusValue });
  const setPackageName = (name: string | null) => updateParams({ package_name: name }); // FIXED: key harus "package_name"

  // 4. Reset Semua Filter
  const resetFilters = () => {
    updateParams({
      search: null,
      status: null,
      package_name: null, // FIXED: konsisten
      page: "1",
    });
  };

  return {
    // Values
    page,
    limit,
    searchTerm,
    status,
    package_name,
    
    // Setters
    setPage,
    setLimit,
    setSearchTerm,
    setStatus,
    setPackageName,
    resetFilters,
  };
};