import services from "@/services/services";
import { CreateTicketForm } from "@/types/ticket.types";

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

export function createTicket(data: CreateTicketForm) {
  return services({
    url: '/ticket',
    method: 'post',
    data,
  });
}