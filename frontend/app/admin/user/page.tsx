/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminPanelLayout from "@/components/admin/admin-layout";
import { deleteUser, getUsers } from "@/api/user.api";
import { User } from "@/types/user.types";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Pagination,
  PaginationMeta,
} from "@/components/admin/table/reusable-pagination";
import { ColumnDef, DataTable } from "@/components/admin/table/reusable-table";
import { RoleBadge } from "@/components/admin/badge/role-badge";
import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { useErrorToast } from "@/components/admin/toast-reusable";
interface UsersResponse {
  users: User[];
  pagination: PaginationMeta;
}

function UserTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = parseInt(searchParams.get("page") || "1");
  const selectedRole = searchParams.get("role");
  const limit = parseInt(searchParams.get("limit") || "10");
  const urlSearch = searchParams.get("search") || "";

  const [searchInput, setSearchInput] = useState(urlSearch);
  const debouncedSearch = useDebounce(searchInput, 500);
  
  const { success } = useToast();
  const { showApiError } = useErrorToast();

  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);

  const columns: ColumnDef<User>[] = [
    {
      header: "Avatar",
      cell: (user) => (
        <div className="flex items-center">
          <Image
            src={user.profile?.avatar || "/user.png"}
            alt={user.profile?.full_name || "Avatar"}
            className="rounded-full w-8 h-8 object-cover"
            width={32}
            height={32}
            unoptimized={true}
          />
        </div>
      ),
    },
    {
      header: "Nama",
      cell: (user) => user.profile?.full_name || "-",
    },
    {
      accessorKey: "username",
      header: "Username",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      header: "Role",
      cell: (user) => <RoleBadge role={user.role} />,
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

  const fetchUsers = async () => {
      try {
        setLoading(true);
        const params = {
          page: currentPage,
          limit,
          ...(urlSearch && { search: urlSearch }),
          ...(selectedRole && { role: selectedRole }),
        };

        const response = await getUsers(params);
        const data: UsersResponse = response.data.data;

        setUsers(data.users);
        setPagination(data.pagination);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchUsers();
    setSearchInput(urlSearch);
  }, [urlSearch, currentPage, limit, urlSearch, selectedRole]);

  const handleEditUser = async (user: User) => {
    router.push(`/admin/user/edit-user/${user.id}`);
  };
  const handleDeleteUser = async (user: User) => {
    try {
      await deleteUser(user.id!);

      fetchUsers();
      success(`Pengguna ${user.profile?.full_name} berhasil dihapus!`, {
        title: "Berhasil Menghapus Pengguna!",
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
      ...(urlSearch && { search: urlSearch }),
    });
  };

  if (loading && !users.length) {
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
          <Select
            value={selectedRole || "all"}
            onValueChange={(value) => {
              const params: Record<string, string | number> = {
                page: 1,
                limit,
                search: debouncedSearch,
              };

              if (value !== "all") {
                params.role = value;
              } else {
                params.role = "";
              }
              updateSearchParams(params);
            }}
          >
            <SelectTrigger className="w-[180px] rounded-3xl">
              <SelectValue placeholder="Semua Role" />
            </SelectTrigger>
            <SelectContent className="rounded-3xl">
              <SelectItem className="rounded-3xl" value="all">
                Semua Role
              </SelectItem>
              <SelectItem className="rounded-3xl" value="TENANT_OWNER">
                Owner
              </SelectItem>
              <SelectItem className="rounded-3xl" value="TENANT_ADMIN">
                Admin
              </SelectItem>
              <SelectItem className="rounded-3xl" value="TENANT_TEKNISI">
                Teknisi
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            className="rounded-3xl"
            onClick={() => router.push("/admin/user/create-user")}
          >
            Tambah Pengguna
          </Button>
        </div>
        <DataTable
          columns={columns}
          data={users}
          loading={loading}
          emptyMessage="Tidak ada data"
          emptySearchMessage="Tidak ada data yang ditemukan"
          hasSearch={!!urlSearch}
          showIndex={true}
          indexStartFrom={(currentPage - 1) * limit + 1}
          actions={{
            onDelete: handleDeleteUser,
            onEdit: handleEditUser,
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

export default UserTable;
