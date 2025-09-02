/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminPanelLayout from "@/components/admin/admin-layout";
import { deleteService, getCustomers } from "@/api/customer.api";
import { Customer, Service_Connection } from "@/types/customer.types";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Pagination,
  PaginationMeta,
} from "@/components/admin/table/reusable-pagination";
import { ColumnDef, DataTable } from "@/components/admin/table/reusable-table";
import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusCustomerBadge } from "@/components/admin/badge/status-badge";
import { formatDate } from "@/utils/date-format";
import { CustomerFilters } from "./_components/customer_filter";
import { useToast } from "@/hooks/use-toast";
import { useErrorToast } from "@/components/admin/toast-reusable";
interface CustomersResponse {
  services: Service_Connection[];
  pagination: PaginationMeta;
}

function CustomerTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const urlSearch = searchParams.get("search") || "";
  
  const selectedStatus = searchParams.get("status") || "all";
  const selectedPackage = searchParams.get("package") || "all";
  
  const { success } = useToast();
  const { showApiError } = useErrorToast();

  const [searchInput, setSearchInput] = useState(urlSearch);
  const debouncedSearch = useDebounce(searchInput, 500);

  const [customers, setCustomers] = useState<Service_Connection[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);

  const columns: ColumnDef<Service_Connection>[] = [
    {
      header: "ID Pelanggan",
      accessorKey: "id_pel",
    },
    {
      header: "Nama Pelanggan",
      cell: (customer) => customer.customer?.name,
    },
    {
      header: "Alamat Rumah",
      cell: (customer) => customer.customer?.address,
    },
    {
      header: "No. Telepon",
      cell: (customer) => customer.customer?.phone,
    },
    {
      header: "Layanan",
      accessorKey: "package_name",
    },
    {
      header: "Status",
      cell: (customer) => <StatusCustomerBadge status={customer.status} />,
    },
    {
      header: "Tgl Terdaftar",
      cell: (customer) => formatDate(customer.created_at!, {includeDay: false, shortMonth: true}),
    }
  ];

   const updateSearchParams = (newParams: Record<string, string | number>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    Object.entries(newParams).forEach(([key, value]) => {
      if (value && value !== "all") { 
        current.set(key, value.toString());
      } else {
        current.delete(key);
      }
    });

    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.push(`${window.location.pathname}${query}`);
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit,
        ...(urlSearch && { search: urlSearch }),
        ...(selectedStatus !== "all" && { status: selectedStatus }),
        ...(selectedPackage !== "all" && { package_id: selectedPackage }), 
      };

      const response = await getCustomers(params);
      const data: CustomersResponse = response.data.data;

      setCustomers(data.services);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleStatusChange = (value: string) => {
    updateSearchParams({
      page: 1,
      status: value,
    });
  };

  const handlePackageChange = (value: string) => {
    updateSearchParams({
      page: 1,
      package: value,
    });
  };

  useEffect(() => {
    fetchCustomers();
    setSearchInput(urlSearch);
  }, [currentPage, limit, urlSearch, selectedStatus, selectedPackage, urlSearch]);

  const handleEditCustomer = async (customer: Service_Connection) => {
    console.log("Edit customer:", customer);
  };

  const handleCreateCustomer = async () => {
    router.push("/admin/customer/create-customer");
  }
  const handleDeleteCustomer = async (customer: Service_Connection) => {
    try {
      await deleteService(customer.id!);

      fetchCustomers();
      success(`Pelanggan ${customer.customer?.name} berhasil dihapus!`, {
        title: "Berhasil Menghapus Pelanggan!",
      })
    } catch (error) {
      showApiError(error);
    }
  };
  useEffect(() => {
    if (debouncedSearch !== urlSearch) {
      updateSearchParams({
        page: 1,
        limit,
        search: debouncedSearch,
      });
    }
  }, [debouncedSearch, urlSearch, limit]);

  const handlePageChange = (page: number) => {
    updateSearchParams({
      page,
      limit,
    });
  };

  if (loading && !customers.length) {
    return (
      <AdminPanelLayout
        title="Daftar Pengguna"
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Cari pengguna..."
      >
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
    <AdminPanelLayout
      title="Daftar Pengguna"
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      searchPlaceholder="Cari pengguna..."
    >
      <div className="space-y-4">
        <CustomerFilters
          selectedStatus={selectedStatus}
          selectedPackage={selectedPackage}
          onStatusChange={handleStatusChange}
          onPackageChange={handlePackageChange}
          onCreateCustomer={handleCreateCustomer}
        />
        <DataTable
          columns={columns}
          data={customers}
          loading={loading}
          emptyMessage="Tidak ada data"
          emptySearchMessage="Tidak ada data yang ditemukan"
          hasSearch={!!urlSearch}
          showIndex={true}
          indexStartFrom={(currentPage - 1) * limit + 1}
          actions={{
            onDelete: handleDeleteCustomer,
            onEdit: handleEditCustomer,
          }}
          clickableRow={true}
          onRowClick={(customer) =>
            router.push(`/admin/customer/${customer.id}`)
          }
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

export default CustomerTable;
