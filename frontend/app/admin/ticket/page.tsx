/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminPanelLayout from "@/components/admin/admin-layout";
import { Ticket } from "@/types/ticket.types";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Pagination,
  PaginationMeta,
} from "@/components/admin/table/reusable-pagination";
import { ColumnDef, DataTable } from "@/components/admin/table/reusable-table";
import { formatDate, formatIndonesiaTime } from "@/utils/date-format";
import { getTicket } from "@/api/ticket";
import {
  PriorityBadge,
  TicketStatusBadge,
  TypeBadge,
} from "@/components/admin/badge/ticket-badge";
import { TicketFilters } from "./_components/ticket-filter";
import { useAuth } from "@/components/admin/context/auth-provider";

interface TicketsResponse {
  tickets: Ticket[];
  pagination: PaginationMeta;
}

function TicketTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = parseInt(searchParams.get("page") || "1");
  const selectedStatus = searchParams.get("status");
  const selectedPriority = searchParams.get("priority");
  const limit = parseInt(searchParams.get("limit") || "10");
  const urlSearch = searchParams.get("search") || "";
  const { user } = useAuth();

  const [searchInput, setSearchInput] = useState(urlSearch);
  const debouncedSearch = useDebounce(searchInput, 500);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);

  const columns: ColumnDef<Ticket>[] = [
    {
      header: "ID Ticket",
      cell: (ticket) => (
        <span className="font-mono text-sm">
          #{ticket.id?.slice(-8).toUpperCase()}
        </span>
      ),
    },
    {
      header: "Judul",
      accessorKey: "title",
      className: "capitalize",
    },
    {
      header: "Pelanggan",
      cell: (ticket) => (
        <div>
          <p className="font-medium">{ticket.customer?.name}</p>
          <p className="text-sm text-gray-500">{ticket.service?.id_pel}</p>
        </div>
      ),
    },
    {
      header: "Layanan",
      cell: (ticket) => (
        <div>
          <p className="font-medium">{ticket.service?.package_name}</p>
          <p className="text-sm text-gray-500 truncate max-w-[150px]">
            {ticket.service?.address}
          </p>
        </div>
      ),
    },
    {
      header: "Teknisi",
      cell: (ticket) => (
        <div>
          {ticket.technician ? (
            <>
              <p className="font-medium">
                {ticket.technician.profile?.full_name ||
                  ticket.technician.username}
              </p>
              <p className="text-sm text-gray-500">{ticket.technician.phone}</p>
            </>
          ) : (
            <span className="text-gray-400 italic">Belum ditugaskan</span>
          )}
        </div>
      ),
    },
    {
      header: "Prioritas",
      cell: (ticket) => <PriorityBadge priority={ticket.priority} />,
    },
    {
      header: "Status",
      cell: (ticket) => <TicketStatusBadge status={ticket.status} />,
    },
    {
      header: "Tipe",
      cell: (ticket) => <TypeBadge type={ticket.type} />,
    },
    {
      header: "Dibuat",
      cell: (ticket) =>
        formatDate(ticket.created_at!, { includeDay: false, shortMonth: true }),
    },
    {
      header: "Diselesaikan",
      cell: (ticket) =>
        ticket.resolved_at ? (
          formatDate(ticket.resolved_at, {
            includeDay: false,
            shortMonth: true,
          })
        ) : (
          <span className="text-gray-400">-</span>
        ),
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
    const fetchTickets = async () => {
      try {
        setLoading(true);
        const params = {
          page: currentPage,
          limit,
          ...(urlSearch && { search: urlSearch }),
          ...(selectedStatus && { status: selectedStatus }),
          ...(selectedPriority && { priority: selectedPriority }),
        };

        const response = await getTicket(params);
        const data: TicketsResponse = response.data.data;

        setTickets(data.tickets);
        setPagination(data.pagination);
      } catch (error) {
        console.error("Error fetching tickets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [currentPage, limit, urlSearch, selectedStatus, selectedPriority]);

  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  const handleEditTicket = async (ticket: Ticket) => {
    console.log("Edit ticket:", ticket);
  };

  const handleDeleteTicket = async (ticket: Ticket) => {
    try {
      // Implement delete logic
      console.log("Delete ticket:", ticket);
    } catch (error) {
      console.error("Error deleting ticket:", error);
    }
  };

  const canCreateTicket = useMemo(() => {
    if (!user) return false;

    return user.role !== "TEKNISI";
  }, [user]);
  const handleCreateTicket = () => {
    router.push("/admin/ticket/create-ticket");
  };

  const handleAssignTicket = async (ticket: Ticket) => {
    console.log("Assign ticket:", ticket);
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

  const handleStatusFilter = (status: string) => {
    updateSearchParams({
      page: 1,
      limit,
      status: status === "all" ? "" : status,
    });
  };

  const handlePriorityFilter = (priority: string) => {
    updateSearchParams({
      page: 1,
      limit,
      priority: priority === "all" ? "" : priority,
    });
  };

  if (loading && !tickets.length) {
    return (
      <AdminPanelLayout
        title="Daftar Tiket"
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Cari tiket, pelanggan, atau teknisi..."
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
      title="Daftar Tiket"
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      searchPlaceholder="Cari tiket, pelanggan, atau teknisi..."
    >
      <div className="space-y-4">
        {/* Filters and Actions */}
        <TicketFilters
          selectedStatus={selectedStatus || "all"}
          selectedPriority={selectedPriority || "all"}
          onStatusChange={handleStatusFilter}
          onPriorityChange={handlePriorityFilter}
          onCreateTicket={handleCreateTicket}
          disabled={loading}
          showCreateButton={canCreateTicket}
        />

        <DataTable
          columns={columns}
          data={tickets}
          loading={loading}
          emptyMessage="Tidak ada tiket"
          emptySearchMessage="Tidak ada tiket yang ditemukan"
          hasSearch={!!urlSearch}
          showIndex={true}
          indexStartFrom={(currentPage - 1) * limit + 1}
          actions={{
            onDelete: handleDeleteTicket,
            onEdit: handleEditTicket,
          }}
          clickableRow={true}
          onRowClick={(ticket) => router.push(`ticket/${ticket.id}/detail-ticket`)}
        />

        {pagination && (
          <Pagination
            pagination={pagination}
            onPageChange={handlePageChange}
            showDataCount={true}
            dataCountText={{
              showing: "Menampilkan",
              of: "dari",
              data: "tiket",
            }}
          />
        )}
      </div>
    </AdminPanelLayout>
  );
}

export default TicketTable;
