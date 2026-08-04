import { isRouteAllowed } from '../route-roles';

describe('isRouteAllowed', () => {
  it('blokir teknisi dari /monitoring dan turunannya', () => {
    expect(isRouteAllowed(['monitoring'], 'TENANT_TEKNISI')).toBe(false);
    expect(isRouteAllowed(['monitoring', '[id]'], 'TENANT_TEKNISI')).toBe(false);
  });

  it('izinkan owner dan admin ke /monitoring', () => {
    expect(isRouteAllowed(['monitoring'], 'TENANT_OWNER')).toBe(true);
    expect(isRouteAllowed(['monitoring'], 'TENANT_ADMIN')).toBe(true);
  });

  it('edit-tenant hanya untuk owner', () => {
    expect(isRouteAllowed(['settings', 'edit-tenant'], 'TENANT_OWNER')).toBe(true);
    expect(isRouteAllowed(['settings', 'edit-tenant'], 'TENANT_ADMIN')).toBe(false);
    expect(isRouteAllowed(['settings', 'edit-tenant'], 'TENANT_TEKNISI')).toBe(false);
  });

  it('route tak terdaftar bebas diakses semua role login', () => {
    expect(isRouteAllowed(['settings', 'edit-profile'], 'TENANT_TEKNISI')).toBe(true);
    expect(isRouteAllowed(['(tabs)', 'map'], 'TENANT_TEKNISI')).toBe(true);
  });

  it('tanpa role = tolak', () => {
    expect(isRouteAllowed(['monitoring'], undefined)).toBe(false);
  });
});
