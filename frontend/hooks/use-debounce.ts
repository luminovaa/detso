// hooks/use-debounce.ts
import { useEffect, useState } from "react";

/**
 * Hook untuk debounce value
 * Berguna untuk mengurangi API calls saat user mengetik di search input
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}