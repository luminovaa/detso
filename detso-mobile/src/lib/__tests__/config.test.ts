import { config } from '../config';

describe('config', () => {
  it('punya timeout API 15 detik', () => {
    expect(config.API_TIMEOUT).toBe(15000);
  });

  it('refresh token 2 menit sebelum expire', () => {
    expect(config.REFRESH_BEFORE_EXPIRY).toBe(120);
  });
});
