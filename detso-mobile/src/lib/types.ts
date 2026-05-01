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

export type Package = {
  id: string;
  name: string;
  speed: string;
  price: number;
  created_at: string;
  updated_at: string;
}

export type TeamMember = {
  id: string;
  username: string;
  email: string;
  phone: string | null;
  role: string;
  created_at: string;
  profile?: {
    id: string;
    full_name: string;
    avatar: string | null;
  };
}

export type CustomerDocument = {
  id: string;
  document_type: string;
  document_url: string;
  uploaded_at: string;
}

export type ServicePhoto = {
  id: string;
  photo_type: string;
  photo_url: string;
  uploaded_at: string;
  notes: string | null;
}

export type CustomerInfo = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  nik: string | null;
  address: string | null;
  created_at: string;
  documents: CustomerDocument[];
}

export type ServiceConnection = {
  id: string;
  id_pel: string | null;
  package_name: string;
  package_speed: string;
  package_price: number | null;
  address: string | null;
  ip_address: string | null;
  mac_address: string | null;
  lat: string | null;
  long: string | null;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  created_at: string;
  notes: string | null;
  customer: CustomerInfo;
  package_details: {
    name: string;
    speed: string;
    price: number;
  } | null;
  photos: ServicePhoto[];
}
