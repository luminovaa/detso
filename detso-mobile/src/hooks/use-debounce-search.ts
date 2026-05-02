import { useState, useCallback, useEffect } from 'react';
import _debounce from 'lodash.debounce';

/**
 * Custom hook untuk debounced search.
 * Mengeliminasi duplicate debounce logic yang ada di 5+ screens.
 *
 * @param delay - Debounce delay dalam ms (default: 500)
 * @returns searchQuery, debouncedSearch, handleSearchChange, clearSearch
 */
export function useDebounceSearch(delay = 500) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedHandler = useCallback(
    _debounce((text: string) => {
      setDebouncedSearch(text);
    }, delay),
    [delay],
  );

  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchQuery(text);
      debouncedHandler(text);
    },
    [debouncedHandler],
  );

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setDebouncedSearch('');
    debouncedHandler.cancel();
  }, [debouncedHandler]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedHandler.cancel();
    };
  }, [debouncedHandler]);

  return {
    searchQuery,
    debouncedSearch,
    handleSearchChange,
    clearSearch,
  } as const;
}
