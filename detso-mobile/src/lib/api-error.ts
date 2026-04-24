import { AxiosError } from "axios";
import { showToast } from "@/src/components/global/toast";

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
        'Koneksi timeout. Periksa jaringan Anda dan coba lagi.',
        undefined,
        error,
      );
    }

    // Network error (tidak ada response sama sekali)
    if (!error.response) {
      return new AppError(
        'NETWORK_ERROR',
        'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
        undefined,
        error,
      );
    }

    // Handle berdasarkan HTTP status code
    switch (status) {
      case 400:
        return new AppError('VALIDATION_ERROR', backendMessage || 'Data yang dikirim tidak valid.', 400, error);
      case 401:
        return new AppError('UNAUTHORIZED', backendMessage || 'Sesi Anda telah berakhir. Silakan login kembali.', 401, error);
      case 403:
        return new AppError('FORBIDDEN', backendMessage || 'Anda tidak memiliki akses untuk melakukan ini.', 403, error);
      case 404:
        return new AppError('NOT_FOUND', backendMessage || 'Data yang dicari tidak ditemukan.', 404, error);
      case 409:
        return new AppError('CONFLICT', backendMessage || 'Data sudah ada atau terjadi konflik.', 409, error);
      default:
        if (status && status >= 500) {
          return new AppError('SERVER_ERROR', backendMessage || 'Terjadi kesalahan pada server. Coba lagi nanti.', status, error);
        }
        return new AppError('UNKNOWN_ERROR', backendMessage || `Kesalahan tidak terduga (${status}).`, status, error);
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
  return new AppError('UNKNOWN_ERROR', 'Terjadi kesalahan yang tidak terduga.', undefined, error);
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
  showToast.error(title || 'Gagal', appError.message);
  return appError;
}