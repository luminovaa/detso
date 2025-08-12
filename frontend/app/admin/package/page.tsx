/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminPanelLayout from "@/components/admin/admin-layout";
import { deletePackage, getPackages } from "@/api/package.api";
import { Package } from "@/types/package.types";
import { Pagination, PaginationMeta } from "@/components/admin/table/reusable-pagination";
import { ColumnDef, DataTable } from "@/components/admin/table/reusable-table";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/format-currency";
import { useToast } from "@/hooks/use-toast";
import { useErrorToast } from "@/components/admin/toast-reusable";

interface PackagesResponse {
  packages: Package[];
  pagination: PaginationMeta;
}

function PackageTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  const { success } = useToast();
  const { showApiError } = useErrorToast();

  const [packages, setPackages] = useState<Package[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);

  const columns: ColumnDef<Package>[] = [
    {
      header: "Nama Paket",
      accessorKey: "name",
    },
    {
      header: "Kecepatan",
      accessorKey: "speed",
    },
    {
      header: "Harga",
      cell: (row) => formatCurrency(row.price),
    },
  ];

  const updateSearchParams = (newParams: Record<string, string | number>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        current.set(key, value.toString());
      } else {
        current.delete(key);
      }
    });

    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.push(`${window.location.pathname}${query}`);
  };

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        const params = {
          page: currentPage,
          limit,
        };

        const response = await getPackages(params);
        const data: PackagesResponse = response.data.data;

        setPackages(data.packages);
        setPagination(data.pagination);
      } catch (error) {
        console.error("Error fetching packages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [currentPage, limit]);

  const handleEditPackage = async (pkg: Package) => {
    router.push(`/admin/package/edit/${pkg.id}`);
  };

  const handleDeletePackage = async (pkg: Package) => {
    try {
      await deletePackage(pkg.id!);

      // Refresh data setelah hapus
      const response = await getPackages({ page: currentPage, limit });
      const data: PackagesResponse = response.data.data;
      setPackages(data.packages);
      setPagination(data.pagination);

      success(`Paket ${pkg.name} berhasil dihapus!`, {
        title: "Berhasil Menghapus Paket",
      });
    } catch (error) {
      showApiError(error);
    }
  };

  const handlePageChange = (page: number) => {
    updateSearchParams({ page, limit });
  };

  if (loading && !packages.length) {
    return (
      <AdminPanelLayout title="Daftar Paket">
        <DataTable
          columns={columns}
          data={[]}
          loading={true}
          showIndex={true}
          indexStartFrom={(currentPage - 1) * limit + 1}
        />
      </AdminPanelLayout>
    );
  }

  return (
    <AdminPanelLayout title="Daftar Paket" showSearch={false}>
      <div className="space-y-4">
        <div className="flex justify-end gap-3">
          <Button
            className="rounded-3xl"
            onClick={() => router.push("/admin/package/create-package")}
          >
            Tambah Paket
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={packages}
          loading={loading}
          emptyMessage="Tidak ada data"
          emptySearchMessage="Tidak ada data yang ditemukan"
          showIndex={true}
          indexStartFrom={(currentPage - 1) * limit + 1}
          actions={{
            onDelete: handleDeletePackage,
            onEdit: handleEditPackage,
          }}
        />

        {pagination && (
          <Pagination
            pagination={pagination}
            onPageChange={handlePageChange}
            showDataCount={true}
            dataCountText={{
              showing: "Menampilkan",
              of: "dari",
              data: "data",
            }}
          />
        )}
      </div>
    </AdminPanelLayout>
  );
}

export default PackageTable;