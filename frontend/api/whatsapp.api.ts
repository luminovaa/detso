import services from "@/services/services";
import { SendMessageFormData } from "@/types/whatsapp.types";

interface GetLogsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export function getLogs(params?: GetLogsParams) {
  return services({
    url: '/whatsapp/logs',
    method: 'get',
    params,
  });
}

export function sendMessage(data: SendMessageFormData){
    return services({
        url: '/whatsapp/message',
        method: 'post',
        data,
    });
}