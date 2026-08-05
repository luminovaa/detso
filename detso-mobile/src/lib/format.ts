export function safeNumber(value: unknown, fallback = 0): number {
  const n = typeof value === 'string' ? Number(value) : value;
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback;
}

export function formatBytes(value: unknown): string {
  const bytes = safeNumber(value);
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let v = bytes;
  let i = -1;
  do {
    v /= 1024;
    i++;
  } while (v >= 1024 && i < units.length - 1);
  return `${v.toFixed(1)} ${units[i]}`;
}

export function formatBps(value: unknown): string {
  const bps = safeNumber(value);
  if (bps < 1000) return `${bps} bps`;
  const units = ['Kbps', 'Mbps', 'Gbps'];
  let v = bps;
  let i = -1;
  do {
    v /= 1000;
    i++;
  } while (v >= 1000 && i < units.length - 1);
  return `${v.toFixed(1)} ${units[i]}`;
}

export function formatTemperature(value: unknown): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isFinite(n)) return '-';
  return `${Math.round(n)}°C`;
}
