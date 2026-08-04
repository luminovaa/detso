import { safeNumber, formatBytes, formatBps } from '../format';

describe('safeNumber', () => {
  it('melewatkan angka valid', () => {
    expect(safeNumber(42.5)).toBe(42.5);
  });
  it('parse string numerik', () => {
    expect(safeNumber('128')).toBe(128);
  });
  it('fallback 0 untuk null/undefined/NaN/teks', () => {
    expect(safeNumber(null)).toBe(0);
    expect(safeNumber(undefined)).toBe(0);
    expect(safeNumber(NaN)).toBe(0);
    expect(safeNumber('abc')).toBe(0);
  });
  it('fallback bisa dikustom', () => {
    expect(safeNumber(null, 100)).toBe(100);
  });
});

describe('formatBytes', () => {
  it('format ukuran umum', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(1073741824)).toBe('1.0 GB');
  });
  it('input rusak jadi 0 B', () => {
    expect(formatBytes('abc')).toBe('0 B');
    expect(formatBytes(null)).toBe('0 B');
  });
});

describe('formatBps', () => {
  it('format bitrate umum', () => {
    expect(formatBps(500)).toBe('500 bps');
    expect(formatBps(2500000)).toBe('2.5 Mbps');
  });
  it('input rusak jadi 0 bps', () => {
    expect(formatBps(NaN)).toBe('0 bps');
  });
});
