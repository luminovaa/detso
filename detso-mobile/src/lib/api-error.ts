import { AxiosError } from "axios";
import { showToast } from "@/src/components/global/toast";
import { useLanguageStore } from '@/src/features/i18n/store';

const t = (key: string) => {
  const { locale, i18n } = useLanguageStore.getState();
  return i18n.t(key, { locale });
};

// ==========================================
// 1. ERROR CODES & CLASS
// ==========================================
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'UNKNOWN_ERROR';

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public override message: string,
    public statusCode?: number,
    public originalError?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// ==========================================
// 2. PARSE ERROR DARI BERBAGAI SUMBER
// ==========================================
export function handleApiError(error: unknown): AppError {
  // --- Axios Error (dari backend) ---
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const data = error.response?.data;
    const backendMessage = data?.message || data?.error;

    // Timeout
    if (error.code === 'ECONNABORTED') {
      return new AppError(
        'TIMEOUT_ERROR',
        t('apiError.timeout'),
        undefined,
        error,
      );
    }

    // Network error (tidak ada response sama sekali)
    if (!error.response) {
      return new AppError(
        'NETWORK_ERROR',
        t('apiError.network'),
        undefined,
        error,
      );
    }

    // Handle berdasarkan HTTP status code
    switch (status) {
      case 400:
        return new AppError('VALIDATION_ERROR', backendMessage || t('apiError.validation'), 400, error);
      case 401:
        return new AppError('UNAUTHORIZED', backendMessage || t('apiError.unauthorized'), 401, error);
      case 403:
        return new AppError('FORBIDDEN', backendMessage || t('apiError.forbidden'), 403, error);
      case 404:
        return new AppError('NOT_FOUND', backendMessage || t('apiError.notFound'), 404, error);
      case 409:
        return new AppError('CONFLICT', backendMessage || t('apiError.conflict'), 409, error);
      default:
        if (status && status >= 500) {
          return new AppError('SERVER_ERROR', backendMessage || t('apiError.server'), status, error);
        }
        return new AppError('UNKNOWN_ERROR', backendMessage || t('apiError.unknown'), status, error);
    }
  }

  // --- AppError yang sudah di-throw sebelumnya ---
  if (error instanceof AppError) {
    return error;
  }

  // --- Error JavaScript biasa ---
  if (error instanceof Error) {
    return new AppError('UNKNOWN_ERROR', error.message, undefined, error);
  }

  // --- Fallback ---
  return new AppError('UNKNOWN_ERROR', t('apiError.unexpected'), undefined, error);
}

// ==========================================
// 3. HELPER: Ambil pesan error (backward-compatible)
// ==========================================
export function getErrorMessage(error: unknown): string {
  return handleApiError(error).message;
}

// ==========================================
// 4. HELPER: Tampilkan toast error langsung
// ==========================================
export function showErrorToast(error: unknown, title?: string): AppError {
  const appError = handleApiError(error);
  showToast.error(title || t('common.failed'), appError.message);
  return appError;
}