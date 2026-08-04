import { useQuery } from '@tanstack/react-query';
import api from '@/src/lib/api';
import { dashboardKeys } from './hooks';
import { filterActiveTickets, TeknisiTicket } from './teknisi-selectors';

export const teknisiKeys = {
  activeTickets: () => [...dashboardKeys.all, 'teknisi', 'active-tickets'] as const,
};

interface TicketListResponse {
  data?: {
    tickets?: TeknisiTicket[];
  };
}

/**
 * Tiket aktif milik teknisi login. Backend sudah memaksa assigned_to = user.id
 * untuk role TENANT_TEKNISI, jadi tidak perlu (dan tidak ada) param filter teknisi.
 *
 * Backend hanya menerima satu nilai `status` per request dan mengurutkan hasilnya
 * created_at desc per halaman. Kalau kita ambil satu halaman tanpa filter status
 * lalu memfilter OPEN/IN_PROGRESS di client, tiket OPEN lama bisa terdesak keluar
 * dari halaman pertama oleh tiket status lain yang lebih baru. Jadi ambil OPEN dan
 * IN_PROGRESS lewat dua request terpisah, gabungkan, lalu urutkan ulang di client.
 */
export function useTeknisiActiveTickets() {
  return useQuery({
    queryKey: teknisiKeys.activeTickets(),
    queryFn: async (): Promise<TeknisiTicket[]> => {
      const [openResp, inProgressResp] = await Promise.all([
        api.get<TicketListResponse>('/ticket', { params: { page: '1', limit: '20', status: 'OPEN' } }),
        api.get<TicketListResponse>('/ticket', { params: { page: '1', limit: '20', status: 'IN_PROGRESS' } }),
      ]);

      const tickets = [
        ...(openResp.data?.data?.tickets ?? []),
        ...(inProgressResp.data?.data?.tickets ?? []),
      ];

      return tickets.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    select: (tickets: TeknisiTicket[]): TeknisiTicket[] => filterActiveTickets(tickets),
  });
}
