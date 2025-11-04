import services from "@/services/services";
import { CreateTicketForm, EditTicketForm } from "@/types/ticket.types";

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

export function getTicketById(id: string) {
  return services({
    url: `/ticket/${id}`,
    method: 'get',
  });
}

export function getTicketHistory(id: string) {
  return services({
    url: `/ticket/${id}/history`,
    method: 'get',
  });
}

export function getImageHistoryById(id: string) {
  return services({
    url: `/ticket/history/${id}/image`,
    method: 'get',
  });
}

export function editTicket(id: string, data: FormData | EditTicketForm) {
  const config = {
    headers: {}
  };

  // Jika data adalah FormData, set header untuk multipart/form-data
  if (data instanceof FormData) {
    config.headers = {
      'Content-Type': 'multipart/form-data'
    };
  }

  return services({
    url: `/ticket/${id}`,
    method: 'put',
    data,
    ...config
  });
}