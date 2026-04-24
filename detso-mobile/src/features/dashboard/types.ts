// src/features/dashboard/types.ts

export interface SaasDashboardMetrics {
  total_tenants: number;
  active_tenants: number;
  inactive_tenants: number;
  total_customers: number;
}

export interface TenantMapData {
  id: string;
  name: string;
  is_active: boolean;
  lat: number;
  long: number;
  phone: string | null;
  _count: {
    customers: number;
    users: number;
  };
}

export interface RecentTenant {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  logo: string | null;
  _count: {
    customers: number;
    users: number;
  };
}

export interface SaasDashboardData {
  metrics: SaasDashboardMetrics;
  map_data: TenantMapData[];
  recent_activities: RecentTenant[];
}
