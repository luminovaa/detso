const OWNER = 'TENANT_OWNER';
const ADMIN = 'TENANT_ADMIN';
const TEKNISI = 'TENANT_TEKNISI';

/** Prefix path (tanpa route-group "(...)") → role yang boleh masuk. Route di luar daftar = bebas untuk semua user login. */
const RESTRICTED_ROUTES: Record<string, string[]> = {
  map: [OWNER],
  monitoring: [OWNER, ADMIN],
  'settings/edit-tenant': [OWNER],
  'customer/[id]/edit': [OWNER, ADMIN],
  'service/create': [OWNER, ADMIN],
  'service/[id]/edit': [OWNER, ADMIN],
};

export function isTechnicianRole(role?: string | null): boolean {
  return role === TEKNISI;
}

export function canManageRecords(role?: string | null): boolean {
  return Boolean(role) && role !== TEKNISI;
}

export function isRouteAllowed(segments: string[], role: string | undefined): boolean {
  if (!role) return false;
  const path = segments.filter((s) => !s.startsWith('(')).join('/');
  for (const [prefix, roles] of Object.entries(RESTRICTED_ROUTES)) {
    if (path === prefix || path.startsWith(prefix + '/')) {
      return roles.includes(role);
    }
  }
  return true;
}
