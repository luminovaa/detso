import services from "@/services/services";
import { EditTenantFormData } from "@/types/tenant.types";
import { CreateTicketForm, EditTicketForm } from "@/types/ticket.types";

interface GetTicketParams {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: string;
}

export function getTenant(params?: GetTicketParams) {
  return services({
    url: `/tenant`,
    method: 'get',
    params,  // axios akan generate query-nya
  });
}

export function updateTenant(id: string, data: EditTenantFormData) {
  const formData = new FormData();
  
  // Append text fields
  if (data.name) formData.append('name', data.name);
  if (data.address) formData.append('address', data.address);
  if (data.phone) formData.append('phone', data.phone);
  if (data.is_active) formData.append('is_active', data.is_active);
  
  // Append file (Logo)
  if (data.logo instanceof File) {
    formData.append('image', data.logo);
  }

  return services({
    url: `/tenant/${id}`,
    method: 'put',
    data: formData,
    headers: { "Content-Type": "multipart/form-data" }
  });
}


export function deleteTenant(id: string) {
  return services({
    url: `/tenant/${id}`,
    method: 'delete',
  });
}

export function getTenantById(id: string) {
  return services({
    url: `/tenant/${id}`,
    method: 'get',
  });
}

export function getTenantLogo(id: string) {
  return services({
    url: `/tenant/${id}/logo`,
    method: 'get',
  });
}