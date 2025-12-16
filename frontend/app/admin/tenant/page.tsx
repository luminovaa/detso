"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AdminPanelLayout from "@/components/admin/admin-layout";
import { deleteTenant, getTenant } from "@/api/tenant.api";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Pagination,
  PaginationMeta,
} from "@/components/admin/table/reusable-pagination";
import { ColumnDef, DataTable } from "@/components/admin/table/reusable-table";
import { formatDate } from "@/utils/date-format";
import { useToast } from "@/hooks/use-toast";
import { useErrorToast } from "@/components/admin/toast-reusable";
import { useTenantParams } from "./_components/tenant.params"; // Pastikan file ini ada
import { Tenant } from "@/types/tenant.types";
import { StatusCustomerBadge } from "@/components/admin/badge/status-badge";
import { TenantFilters } from "./_components/tenant.filter";

interface TenantsResponse {
  tenants: Tenant[];
  pagination: PaginationMeta;
}

function TenantTable() {
  const router = useRouter();

  const {
    page,
    limit,
    searchTerm,
    isActive,
    setPage,
    setSearchTerm,
    setIsActive,
  } = useTenantParams();

  const { success } = useToast();
  const { showApiError } = useErrorToast();

  const [searchInput, setSearchInput] = useState(searchTerm);
  const debouncedSearch = useDebounce(searchInput, 500);

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);

  const columns: ColumnDef<Tenant>[] = [
    {
      header: "Logo",
      accessorKey: "logo",
      cell: (tenant) => tenant.logo ? <Image src={tenant.logo} alt={`${tenant.name} Logo`} width={50} height={50} /> : "-"
    },
    {
      header: "Nama Perusahaan",
      accessorKey: "name",
    },
    {
      header: "Slug",
      accessorKey: "slug",
    },
    {
      header: "Alamat",
      accessorKey: "address",
      cell: (tenant) => tenant.address || "-",
    },
    {
      header: "Telepon",
      accessorKey: "phone",
      cell: (tenant) => tenant.phone || "-",
    },
    // {
    //   header: "Status",
    //   cell: (tenant) => <StatusCustomerBadge status={tenant.is_active} />,
    // },
    {
      header: "Dibuat",
      cell: (tenant) => formatDate(tenant.created_at, { includeDay: false, shortMonth: true }),
    },
  ];

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        ...(searchTerm && { search: searchTerm }),
        ...(isActive && { is_active: isActive }),
      };

      const response = await getTenant(params);
      const data: TenantsResponse = response.data.data;

      setTenants(data.tenants);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      showApiError(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data saat params berubah
  useEffect(() => {
    fetchTenants();
    setSearchInput(searchTerm);
  }, [page, limit, searchTerm, isActive]);

  // Sinkronisasi pencarian ter-debounce ke URL
  useEffect(() => {
    if (debouncedSearch !== searchTerm) {
      setSearchTerm(debouncedSearch);
    }
  }, [debouncedSearch, searchTerm, setSearchTerm]);

  // Handler
  const handleStatusChange = (value: string) => {
    setIsActive(value === "all" ? null : value);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleEditTenant = (tenant: Tenant) => {
    router.push(`/admin/tenant/edit-tenant/${tenant.id}`);
  };

  const handleCreateTenant = () => {
    router.push("/admin/tenant/create");
  };

  const handleDeleteTenant = async (tenant: Tenant) => {
    try {
      await deleteTenant(tenant.id);
      fetchTenants();
      success(`Tenant ${tenant.name} berhasil dihapus!`, {
        title: "Berhasil Menghapus Tenant!",
      });
    } catch (error) {
      showApiError(error);
    }
  };

  if (loading && !tenants.length) {
    return (
      <AdminPanelLayout
        title="Daftar Tenant"
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Cari tenant..."
      >
        <DataTable
          columns={columns}
          data={[]}
          loading={true}
          showIndex={true}
          indexStartFrom={(page - 1) * limit + 1}
        />
      </AdminPanelLayout>
    );
  }

  return (
    <AdminPanelLayout
      title="Daftar Tenant"
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      searchPlaceholder="Cari tenant..."
    >
      <div className="space-y-4">
        <TenantFilters
          selectedStatus={isActive || "all"}
          onStatusChange={handleStatusChange}
          onCreateTenant={handleCreateTenant}
        />
        <DataTable
          columns={columns}
          data={tenants}
          loading={loading}
          emptyMessage="Tidak ada tenant"
          emptySearchMessage="Tidak ada tenant yang ditemukan"
          hasSearch={!!searchTerm}
          showIndex={true}
          indexStartFrom={(page - 1) * limit + 1}
          actions={{
            onDelete: handleDeleteTenant,
            onEdit: handleEditTenant,
          }}
          clickableRow={false}
          onRowClick={(tenant) => router.push(`/admin/tenants/${tenant.id}`)}
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

export default TenantTable;