// src/features/dashboard/service.ts
import api from "@/src/lib/api";

export const dashboardService = {
  /**
   * Get SAAS Super Admin dashboard data
   * Only accessible by SAAS_SUPER_ADMIN role
   */
  getSaasData: async () => {
    const response = await api.get("/dashboard/saas");
    return response.data;
  },

  /**
   * Get Tenant Owner/Admin dashboard data
   * Only accessible by TENANT_OWNER and TENANT_ADMIN roles
   */
  getTenantData: async () => {
    const response = await api.get("/dashboard/tenant");
    return response.data;
  },
};
