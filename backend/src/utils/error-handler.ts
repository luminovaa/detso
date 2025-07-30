import { Response } from 'express';
import multer from 'multer';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public errors?: any[]
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, errors?: any[]) {
    super(400, message, errors);
    this.name = 'ValidationError';
  }
}
 
export class AuthenticationError extends AppError {
  constructor(message: string) {
    super(401, message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string) {
    super(403, message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(404, message);
    this.name = 'NotFoundError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string) {
    super(500, message);
    this.name = 'DatabaseError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string) {
    super(429, message);
    this.name = 'RateLimitError';
  }
}

interface ErrorResponse {
  success: false;
  message: string;
  errors?: any[];
  code?: string;
}

export class FileUploadError extends AppError {
  constructor(message: string, public field?: string) {
    super(400, message);
    this.name = 'FileUploadError';
  }
}

export class FileTooLargeError extends FileUploadError {
  constructor(maxSize: number) {
    super(`Ukuran file melebihi batas maksimal ${maxSize / 1024 / 1024}MB`);
    this.name = 'FileTooLargeError';
  }
}

export class InvalidFileTypeError extends FileUploadError {
  constructor(allowedTypes: string[]) {
    super(`Tipe file tidak valid. Hanya diperbolehkan: ${allowedTypes.join(', ')}`);
    this.name = 'InvalidFileTypeError';
  }
}

export class FileNotFoundError extends FileUploadError {
  constructor() {
    super('File tidak ditemukan');
    this.name = 'FileNotFoundError';
  }
}

export class FileDeleteError extends AppError {
  constructor(message: string) {
    super(500, message);
    this.name = 'FileDeleteError';
  }
}

// Tambahkan handler untuk error upload file
export const handleFileUploadError = (error: Error): ErrorResponse => {
  if (error instanceof FileTooLargeError) {
    return {
      success: false,
      message: error.message,
      code: error.name
    };
  }

  if (error instanceof InvalidFileTypeError) {
    return {
      success: false,
      message: error.message,
      code: error.name
    };
  }

  if (error instanceof FileNotFoundError) {
    return {
      success: false,
      message: error.message,
      code: error.name
    };
  }

  console.error('File Upload Error:', error);

  return {
    success: false,
    message: 'Terjadi kesalahan saat mengupload file',
    code: 'FILE_UPLOAD_ERROR'
  };
};

export const handleValidationError = (errors: any[]): ErrorResponse => ({
  success: false,
  message: 'Kesalahan validasi',
  errors: errors.map(err => ({
    field: err.field,
    message: err.message
  }))
});

export const handleDatabaseError = (error: Error): ErrorResponse => {
  if (error.message.includes('Unique constraint')) {
    return {
      success: false,
      message: 'Data sudah ada dalam database',
      code: 'DUPLICATE_DATA'
    };
  }

  if (error.message.includes('Foreign key constraint')) {
    return {
      success: false,
      message: 'Data referensi tidak valid',
      code: 'INVALID_REFERENCE'
    };
  }

  console.error('Database Error:', error);

  return {
    success: false,
    message: 'Terjadi kesalahan pada database',
    code: 'DATABASE_ERROR'
  };
};

export const handleRateLimitError = (): ErrorResponse => ({
  success: false,
  message: 'Terlalu banyak permintaan. Silakan coba lagi nanti.',
  code: 'RATE_LIMIT_EXCEEDED'
});

export const handleError = (error: unknown, res: Response): void => {
  console.error('Error:', error);

  if (error instanceof multer.MulterError) {
    let message = 'Terjadi kesalahan saat mengupload file';
    let statusCode = 400;

    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'Ukuran file melebihi batas maksimal';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Jumlah file melebihi batas maksimal';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Field file tidak sesuai dengan yang diharapkan';
        break;
      case 'LIMIT_FIELD_KEY':
        message = 'Nama field terlalu panjang';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = 'Nilai field terlalu panjang';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Jumlah field melebihi batas maksimal';
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Jumlah bagian form melebihi batas maksimal';
        break;
    }

    res.status(statusCode).json({
      success: false,
      message,
      code: error.code
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errors: error.errors,
      code: error.name 
    });
    return;
  }

  if (error instanceof Error) {
    if (error.message.includes('Prisma') || error.message.includes('database')) {
      res.status(500).json(handleDatabaseError(error));
      return;
    }

    if (error.name.includes('File') || error.message.includes('file')) {
      res.status(400).json(handleFileUploadError(error));
      return;
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Terjadi kesalahan pada server',
      code: 'INTERNAL_SERVER_ERROR'
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan pada server',
    code: 'UNKNOWN_ERROR'
  });
};
export const asyncHandler = (fn: Function) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch((error) => handleError(error, res));
  };
};