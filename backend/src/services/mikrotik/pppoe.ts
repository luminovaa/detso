import { PPPoESession } from './types';

export interface PPPoESessionResponse {
  id: string;
  name: string;
  service: string;
  caller_id: string | null;
  address: string | null;
  uptime: string | null;
}

/**
 * Map raw RouterOS /ppp/active entries (kebab-case keys, string values)
 * to the API response shape.
 */
export function mapPPPoESessions(
  sessions: PPPoESession[] | null | undefined,
): PPPoESessionResponse[] {
  return (sessions || []).map((s) => ({
    id: String(s['.id'] || ''),
    name: String(s.name || ''),
    service: String(s.service || ''),
    caller_id: s['caller-id'] ? String(s['caller-id']) : null,
    address: s.address ? String(s.address) : null,
    uptime: s.uptime ? String(s.uptime) : null,
  }));
}
