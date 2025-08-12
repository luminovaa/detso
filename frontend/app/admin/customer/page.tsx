/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminPanelLayout from "@/components/admin/admin-layout";
import { getCustomers } from "@/api/customer.api";
import { Customer } from "@/types/customer.types";
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
interface CustomersResponse {
  customers: Customer[];
  pagination: PaginationMeta;
}

function CustomerTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = parseInt(searchParams.get("page") || "1");
  const selectedRole = searchParams.get("role");
  const limit = parseInt(searchParams.get("limit") || "10");
  const urlSearch = searchParams.get("search") || "";

  const [searchInput, setSearchInput] = useState(urlSearch);
  const debouncedSearch = useDebounce(searchInput, 500);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);

  const columns: ColumnDef<Customer>[] = [
    {
      header: "Nama",
      accessorKey: "name",
    },
    {
      header: "Nomer Telepon",
      accessorKey: "phone",
    },
    {
      header: "Alamat Rumah",
      accessorKey: "address",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      header: "Layanan",
      cell: (customer) => {
        const services = customer.services || [];

        if (services.length === 0) {
          return <span className="text-gray-500">Tidak ada layanan</span>;
        }

        if (services.length === 1) {
          const packageName = services[0].package_name;
          return <span>{packageName}</span>;
        }

        return <span>{services.length} Paket Internet</span>;
      },
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
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const params = {
          page: currentPage,
          limit,
          ...(urlSearch && { search: urlSearch }),
        };

        const response = await getCustomers(params);
        const data: CustomersResponse = response.data.data;

        setCustomers(data.customers);
        setPagination(data.pagination);
      } catch (error) {
        console.error("Error fetching customers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [currentPage, limit, urlSearch, selectedRole]);

  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  const handleEditCustomer = async (customer: Customer) => {
    console.log("Edit customer:", customer);
  };
  const handleDeleteCustomer = async (customer: Customer) => {
    try {
    } catch (error) {}
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
        <div className="flex justify-end gap-3">
          <Button
            className="rounded-3xl"
            onClick={() => router.push("/admin/customer/create-customer")}
          >
            Tambah Pengguna
          </Button>
        </div>
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
