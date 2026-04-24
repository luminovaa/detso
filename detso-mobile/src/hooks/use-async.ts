import { useState, useCallback, useRef } from 'react';
import { AppError, handleApiError, showErrorToast } from '@/src/lib/api-error';

interface UseAsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: AppError | null;
}

interface UseAsyncOptions {
  /** Tampilkan toast error otomatis saat gagal (default: true) */
  showToast?: boolean;
  /** Judul toast error */
  toastTitle?: string;
}

/**
 * Custom hook untuk mengelola async operations dengan loading, error, dan data state.
 * 
 * @example
 * ```tsx
 * const { execute, isLoading, data, error } = useAsync<Tenant[]>();
 * 
 * const fetchData = () => execute(
 *   () => tenantService.getAll({ page: 1 }),
 *   { showToast: true }
 * );
 * ```
 */
export function useAsync<T = unknown>() {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  // Untuk mencegah race condition
  const mountedRef = useRef(true);

  const execute = useCallback(
    async (
      asyncFn: () => Promise<T>,
      options: UseAsyncOptions = {},
    ): Promise<T | null> => {
      const { showToast = true, toastTitle } = options;

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const result = await asyncFn();
        if (mountedRef.current) {
          setState({ data: result, isLoading: false, error: null });
        }
        return result;
      } catch (error) {
        const appError = handleApiError(error);
        if (mountedRef.current) {
          setState({ data: null, isLoading: false, error: appError });
        }
        if (showToast) {
          showErrorToast(error, toastTitle);
        }
        return null;
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

/**
 * Custom hook khusus untuk operasi mutasi (create, update, delete).
 * Mirip useAsync tapi lebih ringkas untuk form submissions.
 * 
 * @example
 * ```tsx
 * const { mutate, isLoading } = useMutation();
 * 
 * const onSubmit = (data) => mutate(
 *   () => tenantService.create(data),
 *   { 
 *     onSuccess: () => { showToast.success(...); router.back(); },
 *   }
 * );
 * ```
 */
export function useMutation<T = unknown>() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const mutate = useCallback(
    async (
      asyncFn: () => Promise<T>,
      options: {
        onSuccess?: (data: T) => void;
        onError?: (error: AppError) => void;
        showToast?: boolean;
        toastTitle?: string;
      } = {},
    ): Promise<T | null> => {
      const { onSuccess, onError, showToast = true, toastTitle } = options;

      setIsLoading(true);
      setError(null);

      try {
        const result = await asyncFn();
        setIsLoading(false);
        onSuccess?.(result);
        return result;
      } catch (err) {
        const appError = handleApiError(err);
        setIsLoading(false);
        setError(appError);
        if (showToast) {
          showErrorToast(err, toastTitle);
        }
        onError?.(appError);
        return null;
      }
    },
    [],
  );

  return { mutate, isLoading, error };
}
