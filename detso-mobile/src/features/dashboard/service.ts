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
};
