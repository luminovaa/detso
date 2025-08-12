import services from "@/services/services";
import { CreateCustomerFormData } from "@/types/customer.types";

interface GetCustomersParams {
  page?: number;
  limit?: number;
  search?: string;
}

export function getCustomers(params?: GetCustomersParams) {
  return services({
    url: '/customer',
    method: 'get',
    params,
  });
}

export function deleteCustomer(id: string) {
  return services({
    url: `/customer/${id}`,
    method: 'delete',
  });
}

export function createCustomer(data: FormData) {
  return services({
    url: '/customer',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}