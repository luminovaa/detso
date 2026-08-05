import { SystemHealth } from './types';

const SENSOR_KEYS = ['temperature', 'voltage'] as const;

/**
 * Normalize /system/health/print output across RouterOS versions:
 * v6 returns one flat row ({ temperature: '36', voltage: '24' });
 * v7 returns one row per sensor ({ name: 'temperature', value: '39', type: 'C' }).
 * Non-finite values are dropped; returns null when no known sensor parses.
 */
export function normalizeSystemHealth(rows: unknown): SystemHealth | null {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const health: Record<string, number> = {};
  const first = rows[0] as Record<string, unknown>;

  if (first && typeof first === 'object' && 'name' in first && 'value' in first) {
    for (const raw of rows as Array<Record<string, unknown>>) {
      const name = String(raw.name || '');
      if (!(SENSOR_KEYS as readonly string[]).includes(name)) continue;
      const value = parseFloat(String(raw.value));
      if (Number.isFinite(value)) health[name] = value;
    }
  } else {
    for (const key of SENSOR_KEYS) {
      if (first[key] == null) continue;
      const value = parseFloat(String(first[key]));
      if (Number.isFinite(value)) health[key] = value;
    }
  }

  return Object.keys(health).length > 0 ? (health as SystemHealth) : null;
}
