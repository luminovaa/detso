import { mapPPPoESessions } from './pppoe';
import { PPPoESession } from './types';

describe('mapPPPoESessions', () => {
  it('maps RouterOS keys to snake_case response fields', () => {
    const raw = [{
      '.id': '*1',
      name: 'pelanggan-01',
      service: 'pppoe',
      'caller-id': '00:0C:42:12:34:56',
      address: '10.10.0.5',
      uptime: '1d2h3m4s',
    }] as unknown as PPPoESession[];

    expect(mapPPPoESessions(raw)).toEqual([{
      id: '*1',
      name: 'pelanggan-01',
      service: 'pppoe',
      caller_id: '00:0C:42:12:34:56',
      address: '10.10.0.5',
      uptime: '1d2h3m4s',
    }]);
  });

  it('fills missing optional fields with null', () => {
    const raw = [{ '.id': '*2', name: 'x', service: 'pppoe' }] as unknown as PPPoESession[];
    expect(mapPPPoESessions(raw)[0]).toEqual({
      id: '*2',
      name: 'x',
      service: 'pppoe',
      caller_id: null,
      address: null,
      uptime: null,
    });
  });

  it('returns [] for empty, null, or undefined input', () => {
    expect(mapPPPoESessions([])).toEqual([]);
    expect(mapPPPoESessions(null)).toEqual([]);
    expect(mapPPPoESessions(undefined)).toEqual([]);
  });
});
