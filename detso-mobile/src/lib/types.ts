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
  lat: string | null;
  long: string | null;
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

// ─── Ticket Types ────────────────────────────────────────────────

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketType = 'PROBLEM' | 'UPGRADE' | 'DOWNGRADE';
export type TicketAction =
  | 'CREATED'
  | 'UPDATED'
  | 'ASSIGNED'
  | 'STATUS_CHANGED'
  | 'PRIORITY_CHANGED'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REOPENED'
  | 'SCHEDULED'
  | 'NOTE_ADDED';

export type Ticket = {
  id: string;
  title: string;
  description: string | null;
  type: TicketType;
  priority: TicketPriority;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  customer: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  };
  service: {
    id: string;
    id_pel: string | null;
    package_name: string;
    address: string | null;
  } | null;
  technician: {
    id: string;
    username: string;
    email: string;
    phone: string | null;
    profile: {
      full_name: string | null;
      avatar: string | null;
    };
  } | null;
  schedule: {
    id: string;
    start_time: string;
    end_time: string;
    status: string;
    notes: string | null;
  } | null;
};

export type TicketHistory = {
  id: string;
  action: TicketAction;
  description: string | null;
  image: string | null;
  created_at: string;
  created_by: {
    id: string;
    username: string;
    full_name: string | null;
    avatar: string | null;
  } | null;
};

export type ScheduleStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

export type Schedule = {
  id: string;
  ticket_id?: string | null;
  technician_id: string;
  title?: string | null;
  start_time: string;
  end_time?: string | null;
  status: ScheduleStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  technician?: {
    id: string;
    username: string;
    full_name: string | null;
    avatar: string | null;
  };
  ticket?: {
    id: string;
    title: string;
  } | null;
};
