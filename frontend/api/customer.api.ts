import services from "@/services/services";

interface GetCustomersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  package_name?: string;
}

export function getCustomers(params?: GetCustomersParams) {
  const url = new URLSearchParams();
  
  if (params?.page) url.append('page', params.page.toString());
  if (params?.limit) url.append('limit', params.limit.toString());
  if (params?.search) url.append('search', params.search);
  if (params?.status) url.append('status', params.status);
  if (params?.package_name) url.append('package_name', params.package_name);
  
  return services({
    url: `/customer?${url.toString()}`,
    method: 'get',
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