import { useQuery } from '@tanstack/react-query';
import api from '@/src/lib/api';
import { dashboardKeys } from './hooks';
import { filterActiveTickets, TeknisiTicket } from './teknisi-selectors';

export const teknisiKeys = {
  activeTickets: () => [...dashboardKeys.all, 'teknisi', 'active-tickets'] as const,
};

/**
 * Tiket aktif milik teknisi login. Backend sudah memaksa assigned_to = user.id
 * untuk role TENANT_TEKNISI, jadi tidak perlu (dan tidak ada) param filter teknisi.
 */
export function useTeknisiActiveTickets() {
  return useQuery({
    queryKey: teknisiKeys.activeTickets(),
    queryFn: async () => {
      const response = await api.get('/ticket', { params: { page: '1', limit: '20' } });
      return response.data;
    },
    select: (resp: any): TeknisiTicket[] => filterActiveTickets(resp?.data?.tickets ?? []),
  });
}
