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

// Tenant Dashboard Types
export interface TenantDashboardMetrics {
  total_customers: number;
  active_services: number;
  open_tickets: number;
  total_packages: number;
}

export interface RecentTicket {
  id: string;
  title: string;
  description: string;
  type: 'PROBLEM' | 'REQUEST' | 'COMPLAINT';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  created_at: string;
  customer: {
    id: string;
    name: string;
    phone: string | null;
  };
  technician: {
    id: string;
    username: string;
    profile: {
      full_name: string;
      avatar: string | null;
    } | null;
  } | null;
}

export interface RecentCustomer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  created_at: string;
  _count: {
    service: number;
  };
}

export interface TenantDashboardData {
  metrics: TenantDashboardMetrics;
  recent_tickets: RecentTicket[];
  recent_customers: RecentCustomer[];
}
