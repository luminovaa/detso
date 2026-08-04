import { filterActiveTickets, TICKET_STATUS_LABEL_KEYS } from '../teknisi-selectors';

describe('filterActiveTickets', () => {
  const tickets = [
    { id: '1', status: 'OPEN' },
    { id: '2', status: 'IN_PROGRESS' },
    { id: '3', status: 'RESOLVED' },
    { id: '4', status: 'CLOSED' },
  ];

  it('hanya menyisakan OPEN dan IN_PROGRESS', () => {
    expect(filterActiveTickets(tickets).map((t) => t.id)).toEqual(['1', '2']);
  });

  it('array kosong aman', () => {
    expect(filterActiveTickets([])).toEqual([]);
  });
});

describe('TICKET_STATUS_LABEL_KEYS', () => {
  it('memetakan semua status ke key i18n ticket.* yang ada', () => {
    expect(TICKET_STATUS_LABEL_KEYS.OPEN).toBe('ticket.statusOpen');
    expect(TICKET_STATUS_LABEL_KEYS.IN_PROGRESS).toBe('ticket.statusInProgress');
    expect(TICKET_STATUS_LABEL_KEYS.RESOLVED).toBe('ticket.statusResolved');
    expect(TICKET_STATUS_LABEL_KEYS.CLOSED).toBe('ticket.statusClosed');
  });
});
