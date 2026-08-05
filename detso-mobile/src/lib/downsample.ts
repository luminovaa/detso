/**
 * Pick ~target evenly spaced points; always keeps the newest (last) point.
 * Returns the input array untouched when it already fits the target.
 */
export function downsample<T>(points: T[], target: number): T[] {
  if (target <= 0) return [];
  if (points.length <= target) return points;
  const step = points.length / target;
  const result: T[] = [];
  for (let i = 0; i < target; i++) {
    result.push(points[Math.floor(i * step)]);
  }
  result[result.length - 1] = points[points.length - 1];
  return result;
}
