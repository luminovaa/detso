"use client";

import React from "react";
import { useToast } from "@/hooks/use-toast";

export const useErrorToast = () => {
  const { error } = useToast();

  const showApiError = (err: any, customMessage?: string) => {
    const errorMessage = err?.response?.data?.message || err?.message;
    const errorStatus = err?.response?.status;
    const errorCode = err?.response?.data?.code;
    const errorErrors = err?.response?.data?.errors; // Array of validation errors

    // Jika ada validation errors (biasanya array), tampilkan yang pertama dengan field
    if (errorErrors && Array.isArray(errorErrors) && errorErrors.length > 0) {
      const firstError = errorErrors[0];
      const fieldMessage = firstError.field 
        ? `${firstError.field}: ${firstError.message}`
        : firstError.message;
      
      error(customMessage || fieldMessage, {
        title: "Validasi Gagal",
      });
      return;
    }

    if (errorStatus === 409) {
      // Gunakan pesan dari backend yang lebih spesifik
      error(customMessage || errorMessage || "Data sudah ada dalam sistem", {
        title: "Data Duplikat",
      });
    } else if (errorStatus === 400) {
      error(
        customMessage ||
          errorMessage ||
          "Data yang dimasukkan tidak valid. Periksa kembali form.",
        {
          title: "Data Tidak Valid",
        }
      );
    } else if (errorStatus === 401) {
      error(customMessage || errorMessage || "Anda tidak memiliki akses untuk melakukan ini", {
        title: "Tidak Diizinkan",
      });
    } else if (errorStatus === 403) {
      error(customMessage || errorMessage || "Akses ditolak", {
        title: "Akses Ditolak",
      });
    } else if (errorStatus === 404) {
      error(customMessage || errorMessage || "Data yang dicari tidak ditemukan", {
        title: "Data Tidak Ditemukan",
      });
    } else if (errorStatus === 422) {
      // Unprocessable Entity - biasanya untuk validation errors
      error(customMessage || errorMessage || "Data tidak dapat diproses", {
        title: "Validasi Gagal",
      });
    } else if (errorStatus === 429) {
      error(customMessage || errorMessage || "Terlalu banyak permintaan. Silakan coba lagi nanti.", {
        title: "Rate Limit",
      });
    } else if (errorStatus >= 500) {
      error(
        customMessage || errorMessage || "Terjadi kesalahan server. Silakan coba lagi nanti.",
        {
          title: "Error Server",
        }
      );
    } else {
      error(
        customMessage ||
          errorMessage ||
          "Terjadi kesalahan yang tidak diketahui",
        {
          title: "Error",
        }
      );
    }
  };

  const showValidationError = (
    errors: Record<string, any>,
    customTitle?: string
  ) => {
    const firstError = Object.values(errors)[0];
    const firstField = Object.keys(errors)[0];
    
    // Tampilkan field name dan message
    const message = firstField 
      ? `${firstField}: ${firstError?.message || firstError}`
      : firstError?.message || firstError || "Periksa kembali data yang dimasukkan";

    error(message, {
      title: customTitle || "Validasi Gagal",
    });
  };

  // Fungsi baru untuk menampilkan validation errors dari backend
  const showBackendValidationErrors = (
    errors: Array<{field: string, message: string}>,
    customTitle?: string
  ) => {
    if (errors && errors.length > 0) {
      const firstError = errors[0];
      const message = firstError.field 
        ? `${firstError.field}: ${firstError.message}`
        : firstError.message;

      error(message, {
        title: customTitle || "Validasi Gagal",
      });
    }
  };

  const showNetworkError = (customMessage?: string) => {
    error(customMessage || "Koneksi bermasalah. Periksa internet Anda.", {
      title: "Masalah Koneksi",
    });
  };

  // Fungsi untuk menampilkan error berdasarkan error code dari backend
  const showErrorByCode = (errorCode: string, message: string) => {
    switch (errorCode) {
      case 'DUPLICATE_DATA':
        error(message, { title: "Data Duplikat" });
        break;
      case 'INVALID_REFERENCE':
        error(message, { title: "Referensi Tidak Valid" });
        break;
      case 'DATABASE_ERROR':
        error(message, { title: "Error Database" });
        break;
      case 'FILE_UPLOAD_ERROR':
      case 'FileTooLargeError':
      case 'InvalidFileTypeError':
      case 'FileNotFoundError':
        error(message, { title: "Error Upload File" });
        break;
      case 'RATE_LIMIT_EXCEEDED':
        error(message, { title: "Rate Limit" });
        break;
      default:
        error(message, { title: "Error" });
    }
  };

  return {
    showApiError,
    showValidationError,
    showBackendValidationErrors,
    showNetworkError,
    showErrorByCode,
  };
};

interface ErrorToastBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error) => void;
}

export const ErrorToastBoundary: React.FC<ErrorToastBoundaryProps> = ({
  children,
  fallback: Fallback,
  onError,
}) => {
  const [error, setError] = React.useState<Error | null>(null);
  const { error: showError } = useToast();

  const retry = React.useCallback(() => {
    setError(null);
  }, []);

  React.useEffect(() => {
    if (error) {
      showError("Terjadi kesalahan tak terduga", {
        title: "Error",
      });
      onError?.(error);
    }
  }, [error, showError, onError]);

  if (error && Fallback) {
    return <Fallback error={error} retry={retry} />;
  }

  return (
    <ErrorBoundaryProvider onError={setError}>{children}</ErrorBoundaryProvider>
  );
};

class ErrorBoundaryProvider extends React.Component<
  { children: React.ReactNode; onError: (error: Error) => void },
  { hasError: boolean }
> {
  constructor(props: {
    children: React.ReactNode;
    onError: (error: Error) => void;
  }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError(error);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }

    return this.props.children;
  }
}

export const withErrorToast = <T extends any[], R>(
  asyncFn: (...args: T) => Promise<R>,
  options?: {
    customErrorMessage?: string;
    customTitle?: string;
    onError?: (error: any) => void;
    showLoading?: boolean;
    loadingMessage?: string;
  }
) => {
  return async (...args: T): Promise<R | undefined> => {
    const { error, info } = useToast();
    let loadingToast: any;

    try {
      if (options?.showLoading) {
        loadingToast = info(options.loadingMessage || "Memproses...", {
          title: "Loading",
        });
      }

      const result = await asyncFn(...args);

      if (loadingToast) {
        loadingToast.dismiss();
      }

      return result;
    } catch (err: any) {
      if (loadingToast) {
        loadingToast.dismiss();
      }

      // Gunakan pesan error dari backend jika tersedia
      const errorMessage = err?.response?.data?.message || err?.message;
      const errorCode = err?.response?.data?.code;
      
      // Jika ada error code, gunakan fungsi showErrorByCode
      if (errorCode) {
        const { showErrorByCode } = useErrorToast();
        showErrorByCode(errorCode, errorMessage || "Terjadi kesalahan");
      } else {
        const finalMessage = options?.customErrorMessage || errorMessage || "Terjadi kesalahan";
        const errorTitle = options?.customTitle || "Error";
        error(finalMessage, { title: errorTitle });
      }

      options?.onError?.(err);
      return undefined;
    }
  };
};

interface FormErrorToastProps {
  errors?: Record<string, any>;
  isVisible?: boolean;
  customMessage?: string;
  onDismiss?: () => void;
}

export const FormErrorToast: React.FC<FormErrorToastProps> = ({
  errors,
  isVisible,
  customMessage,
  onDismiss,
}) => {
  const { showValidationError } = useErrorToast();

  React.useEffect(() => {
    if (isVisible && errors && Object.keys(errors).length > 0) {
      showValidationError(errors, "Data Tidak Valid");

      if (onDismiss) {
        setTimeout(() => {
          onDismiss();
        }, 5000);
      }
    }
  }, [errors, isVisible, customMessage, showValidationError, onDismiss]);

  return null; 
};

export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: any;
  errors?: Array<{field: string, message: string}>;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

interface ErrorContextType {
  showError: (message: string, title?: string) => void;
  showApiError: (error: any, customMessage?: string) => void;
  showValidationErrors: (errors: ValidationError[]) => void;
  showBackendValidationErrors: (errors: Array<{field: string, message: string}>) => void;
}

const ErrorContext = React.createContext<ErrorContextType | null>(null);

export const ErrorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { error } = useToast();

  const showError = React.useCallback(
    (message: string, title = "Error") => {
      error(message, { title });
    },
    [error]
  );

  const showApiError = React.useCallback(
    (err: any, customMessage?: string) => {
      const errorMessage = err?.response?.data?.message || err?.message;
      const errorStatus = err?.response?.status;
      const errorCode = err?.response?.data?.code;

      if (errorStatus === 409) {
        error(customMessage || errorMessage || "Data sudah ada dalam sistem", {
          title: "Data Duplikat",
        });
      } else if (errorStatus === 400) {
        error(customMessage || errorMessage || "Data yang dimasukkan tidak valid", {
          title: "Data Tidak Valid",
        });
      } else if (errorStatus >= 500) {
        error(customMessage || errorMessage || "Terjadi kesalahan server", {
          title: "Error Server",
        });
      } else {
        error(customMessage || errorMessage || "Terjadi kesalahan", {
          title: "Error",
        });
      }
    },
    [error]
  );

  const showValidationErrors = React.useCallback(
    (errors: ValidationError[]) => {
      if (errors.length > 0) {
        const firstError = errors[0];
        error(`${firstError.field}: ${firstError.message}`, {
          title: "Validasi Gagal",
        });
      }
    },
    [error]
  );

  const showBackendValidationErrors = React.useCallback(
    (errors: Array<{field: string, message: string}>) => {
      if (errors.length > 0) {
        const firstError = errors[0];
        const message = firstError.field 
          ? `${firstError.field}: ${firstError.message}`
          : firstError.message;
        
        error(message, {
          title: "Validasi Gagal",
        });
      }
    },
    [error]
  );

  const value = React.useMemo(
    () => ({
      showError,
      showApiError,
      showValidationErrors,
      showBackendValidationErrors,
    }),
    [showError, showApiError, showValidationErrors, showBackendValidationErrors]
  );

  return (
    <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>
  );
};

export const useErrorContext = () => {
  const context = React.useContext(ErrorContext);
  if (!context) {
    throw new Error("useErrorContext must be used within an ErrorProvider");
  }
  return context;
};