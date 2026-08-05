import { downsample } from '../downsample';

describe('downsample', () => {
  it('returns [] for target <= 0', () => {
    expect(downsample([1, 2, 3], 0)).toEqual([]);
    expect(downsample([1, 2, 3], -1)).toEqual([]);
  });

  it('returns input unchanged when it fits the target', () => {
    expect(downsample([], 120)).toEqual([]);
    expect(downsample([1, 2, 3], 3)).toEqual([1, 2, 3]);
    expect(downsample([1, 2], 120)).toEqual([1, 2]);
  });

  it('reduces to the target length and keeps first and last points', () => {
    const points = Array.from({ length: 5760 }, (_, i) => i);
    const result = downsample(points, 120);
    expect(result).toHaveLength(120);
    expect(result[0]).toBe(0);
    expect(result[result.length - 1]).toBe(5759);
  });

  it('keeps chronological order', () => {
    const points = Array.from({ length: 1000 }, (_, i) => i);
    const result = downsample(points, 120);
    const sorted = [...result].sort((a, b) => a - b);
    expect(result).toEqual(sorted);
  });
});
