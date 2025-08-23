import services from "@/services/services";

interface GetTicketParams {
  page?: number;
  limit?: number;
  search?: string;
}

export function getTicket(params?: GetTicketParams) {
  return services({
    url: '/ticket',
    method: 'get',
    params,
  });
}