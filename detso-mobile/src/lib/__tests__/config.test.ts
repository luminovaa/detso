import { config, assertPublicMapboxToken } from '../config';

describe('config', () => {
  it('punya timeout API 15 detik', () => {
    expect(config.API_TIMEOUT).toBe(15000);
  });

  it('refresh token 2 menit sebelum expire', () => {
    expect(config.REFRESH_BEFORE_EXPIRY).toBe(120);
  });
});

describe('assertPublicMapboxToken', () => {
  it('menerima token public pk.*', () => {
    expect(assertPublicMapboxToken('pk.abc123')).toBe('pk.abc123');
  });

  it('menerima string kosong (belum dikonfigurasi)', () => {
    expect(assertPublicMapboxToken('')).toBe('');
  });

  it('menolak token secret sk.*', () => {
    expect(() => assertPublicMapboxToken('sk.rahasia')).toThrow(/pk\./);
  });
});
