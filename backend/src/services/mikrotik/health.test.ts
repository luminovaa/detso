import { normalizeSystemHealth } from './health';

describe('normalizeSystemHealth', () => {
  it('parses RouterOS v7 per-sensor rows, ignoring unknown sensors', () => {
    const rows = [
      { name: 'temperature', value: '39', type: 'C' },
      { name: 'voltage', value: '24.5', type: 'V' },
      { name: 'fan1-speed', value: '3000', type: 'RPM' },
    ];
    expect(normalizeSystemHealth(rows)).toEqual({ temperature: 39, voltage: 24.5 });
  });

  it('parses RouterOS v7 rows with only temperature present', () => {
    const rows = [{ name: 'temperature', value: '39', type: 'C' }];
    expect(normalizeSystemHealth(rows)).toEqual({ temperature: 39 });
  });

  it('parses RouterOS v6 flat shape', () => {
    const rows = [{ temperature: '36', voltage: '24', 'psu1-state': 'ok' }];
    expect(normalizeSystemHealth(rows)).toEqual({ temperature: 36, voltage: 24 });
  });

  it('returns null for v6 shape with non-numeric value', () => {
    expect(normalizeSystemHealth([{ temperature: 'n/a' }])).toBeNull();
  });

  it('returns null for empty array', () => {
    expect(normalizeSystemHealth([])).toBeNull();
  });

  it('returns null for null, undefined, or non-array input', () => {
    expect(normalizeSystemHealth(null)).toBeNull();
    expect(normalizeSystemHealth(undefined)).toBeNull();
    expect(normalizeSystemHealth('not-an-array')).toBeNull();
  });

  it('returns null for v7 row with non-numeric value', () => {
    expect(normalizeSystemHealth([{ name: 'temperature', value: 'unknown' }])).toBeNull();
  });
});
