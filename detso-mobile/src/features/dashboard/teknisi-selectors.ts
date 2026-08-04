export type TeknisiTicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface TeknisiTicket {
  id: string;
  title: string;
  status: TeknisiTicketStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  created_at: string;
  customer: { id: string; name: string; phone: string | null; email: string | null } | null;
  service: { id: string; id_pel: string | null; package_name: string; address: string | null } | null;
}

export function filterActiveTickets<T extends { status: string }>(tickets: T[]): T[] {
  return tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS');
}

/** Key i18n untuk label status — key ini sudah ada di src/locales/{en,id}.json grup "ticket". */
export const TICKET_STATUS_LABEL_KEYS: Record<TeknisiTicketStatus, string> = {
  OPEN: 'ticket.statusOpen',
  IN_PROGRESS: 'ticket.statusInProgress',
  RESOLVED: 'ticket.statusResolved',
  CLOSED: 'ticket.statusClosed',
};
