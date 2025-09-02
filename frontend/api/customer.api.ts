import services from "@/services/services";

interface GetCustomersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  package_name?: string;
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

export function deleteService(id: string) {
  return services({
    url: `/service-connection/${id}`,
    method: 'delete',
  });
}