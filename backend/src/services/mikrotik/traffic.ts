/**
 * Average bits-per-second from the delta of cumulative byte counters
 * between two polls. Returns 0 for invalid dt or a counter reset
 * (negative delta, e.g. after a router reboot).
 */
export function computeBps(prevBytes: bigint, currBytes: bigint, dtSeconds: number): bigint {
  if (!Number.isFinite(dtSeconds) || dtSeconds <= 0) return BigInt(0);
  if (currBytes < prevBytes) return BigInt(0);
  const deltaBytes = Number(currBytes - prevBytes);
  return BigInt(Math.round((deltaBytes * 8) / dtSeconds));
}
