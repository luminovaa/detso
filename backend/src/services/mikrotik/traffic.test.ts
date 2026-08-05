import { computeBps } from './traffic';

describe('computeBps', () => {
  it('computes average bps from a byte delta', () => {
    // 15_000 bytes in 15s = 1_000 B/s = 8_000 bps
    expect(computeBps(BigInt(1_000_000), BigInt(1_015_000), 15)).toBe(BigInt(8000));
  });

  it('rounds fractional results', () => {
    // 100 bytes in 15s = 53.33... bps
    expect(computeBps(BigInt(0), BigInt(100), 15)).toBe(BigInt(53));
  });

  it('returns 0 when counters reset (negative delta)', () => {
    expect(computeBps(BigInt(5_000_000), BigInt(1_000), 15)).toBe(BigInt(0));
  });

  it('returns 0 for zero or negative dt', () => {
    expect(computeBps(BigInt(0), BigInt(1_000), 0)).toBe(BigInt(0));
    expect(computeBps(BigInt(0), BigInt(1_000), -5)).toBe(BigInt(0));
  });

  it('returns 0 for non-finite dt', () => {
    expect(computeBps(BigInt(0), BigInt(1_000), Number.NaN)).toBe(BigInt(0));
    expect(computeBps(BigInt(0), BigInt(1_000), Number.POSITIVE_INFINITY)).toBe(BigInt(0));
  });

  it('handles gigabyte-scale deltas beyond 32-bit range', () => {
    // 6 GB in 15s = 3.2 Gbps
    const prev = BigInt('100000000000');
    const curr = BigInt('106000000000');
    expect(computeBps(prev, curr, 15)).toBe(BigInt(3_200_000_000));
  });
});
