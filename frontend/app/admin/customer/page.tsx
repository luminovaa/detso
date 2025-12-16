"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminPanelLayout from "@/components/admin/admin-layout";
import { deleteService, getCustomers } from "@/api/customer.api";
import { Service_Connection } from "@/types/customer.types";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Pagination,
  PaginationMeta,
} from "@/components/admin/table/reusable-pagination";
import { ColumnDef, DataTable } from "@/components/admin/table/reusable-table";
import { StatusCustomerBadge } from "@/components/admin/badge/status-badge";
import { formatDate } from "@/utils/date-format";
import { CustomerFilters } from "./_components/customer_filter";
import { useToast } from "@/hooks/use-toast";
import { useErrorToast } from "@/components/admin/toast-reusable";
import { useCustomerParams } from "./_components/customer.params";

interface CustomersResponse {
  services: Service_Connection[];
  pagination: PaginationMeta;
}

function CustomerTable() {
  const router = useRouter();
  
  // Gunakan custom hook
  const {
    page,
    limit,
    searchTerm,
    status,
    package_name,
    setPage,
    setSearchTerm,
    setStatus,
    setPackageName,
  } = useCustomerParams();
  
  const { success } = useToast();
  const { showApiError } = useErrorToast();

  const [searchInput, setSearchInput] = useState(searchTerm);
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

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        ...(searchTerm && { search: searchTerm }),
        ...(status && { status }),
        ...(package_name && { package_name }), 
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

  // Fetch data setiap kali params berubah
  useEffect(() => {
    fetchCustomers();
    setSearchInput(searchTerm);
  }, [page, limit, searchTerm, status, package_name]);

  // Sync debounced search dengan URL params
  useEffect(() => {
    if (debouncedSearch !== searchTerm) {
      setSearchTerm(debouncedSearch);
    }
  }, [debouncedSearch, searchTerm, setSearchTerm]);

  // Handler functions - sekarang lebih sederhana
  const handleStatusChange = (value: string) => {
    setStatus(value === "all" ? null : value);
  };

  const handlePackageChange = (value: string) => {
    setPackageName(value === "all" ? null : value);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleEditCustomer = async (customer: Service_Connection) => {
    console.log("Edit customer:", customer);
  };

  const handleCreateCustomer = async () => {
    router.push("/admin/customer/create-customer");
  };

  const handleDeleteCustomer = async (customer: Service_Connection) => {
    try {
      await deleteService(customer.id!);
      fetchCustomers();
      success(`Pelanggan ${customer.customer?.name} berhasil dihapus!`, {
        title: "Berhasil Menghapus Pelanggan!",
      });
    } catch (error) {
      showApiError(error);
    }
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
          indexStartFrom={(page - 1) * limit + 1}
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
          selectedStatus={status || "all"}
          selectedPackage={package_name || "all"}
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
          hasSearch={!!searchTerm}
          showIndex={true}
          indexStartFrom={(page - 1) * limit + 1}
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