export type TenantStats = {
  total_users: number;
  total_customers: number;
  total_packages: number;
  total_tickets: number;
  active_services: number;
};

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  address: string;
  phone: string;
  logo: string | null;
  created_at: string;
  stats: TenantStats;
}

export type  Package = {
  id: string;
  name: string;
  speed: string;
  price: number;
  created_at: string;
  updated_at: string;
}
