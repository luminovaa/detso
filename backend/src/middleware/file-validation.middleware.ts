import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileTypeFromBuffer } from 'file-type';
import { log } from '../config/logger.config';

/**
 * Daftar MIME types yang diizinkan
 */
const ALLOWED_MIME_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  documents: ['application/pdf'],
  all: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
};

/**
 * Daftar ekstensi file yang diizinkan
 */
const ALLOWED_EXTENSIONS = {
  images: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  documents: ['.pdf'],
  all: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf'],
};

/**
 * Daftar magic bytes untuk validasi file type
 * Mencegah file berbahaya yang di-rename
 */
const MAGIC_BYTES: { [key: string]: string[] } = {
  'image/jpeg': ['ffd8ff'],
  'image/png': ['89504e47'],
  'image/gif': ['474946383761', '474946383961'], // GIF87a, GIF89a
  'image/webp': ['52494646'], // RIFF
  'application/pdf': ['25504446'], // %PDF
};

/**
 * Sanitize filename untuk mencegah path traversal
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators
  let sanitized = filename.replace(/[\/\\]/g, '');
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Remove special characters yang berbahaya
  sanitized = sanitized.replace(/[<>:"|?*]/g, '');
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = path.extname(sanitized);
    const name = path.basename(sanitized, ext);
    sanitized = name.substring(0, 255 - ext.length) + ext;
  }
  
  return sanitized;
}

/**
 * Validasi ekstensi file
 */
function validateExtension(filename: string, allowedExtensions: string[]): boolean {
  const ext = path.extname(filename).toLowerCase();
  return allowedExtensions.includes(ext);
}

/**
 * Validasi MIME type dari buffer (magic bytes)
 */
async function validateMagicBytes(filePath: string, expectedMimeType: string): Promise<boolean> {
  try {
    // Read first 12 bytes (cukup untuk kebanyakan file types)
    const buffer = Buffer.alloc(12);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 12, 0);
    fs.closeSync(fd);
    
    // Convert to hex string
    const hex = buffer.toString('hex');
    
    // Check magic bytes
    const expectedMagicBytes = MAGIC_BYTES[expectedMimeType];
    if (!expectedMagicBytes) {
      return true; // Skip validation if no magic bytes defined
    }
    
    return expectedMagicBytes.some(magic => hex.startsWith(magic));
  } catch (error) {
    log.error('Error validating magic bytes', { filePath, error });
    return false;
  }
}

/**
 * Validasi ukuran file
 */
function validateFileSize(filePath: string, maxSize: number): boolean {
  try {
    const stats = fs.statSync(filePath);
    return stats.size <= maxSize;
  } catch (error) {
    log.error('Error validating file size', { filePath, error });
    return false;
  }
}

/**
 * Hapus file yang tidak valid
 */
function deleteInvalidFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      log.info('Deleted invalid file', { filePath });
    }
  } catch (error) {
    log.error('Error deleting invalid file', { filePath, error });
  }
}

/**
 * Middleware untuk validasi file upload
 */
export function validateFileUpload(options: {
  allowedTypes?: 'images' | 'documents' | 'all';
  maxSize?: number;
  required?: boolean;
} = {}) {
  const {
    allowedTypes = 'all',
    maxSize = 5 * 1024 * 1024, // 5MB default
    required = false,
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if files exist
      const files = req.files;
      const file = req.file;

      if (!files && !file) {
        if (required) {
          res.status(400).json({
            success: false,
            message: 'File upload diperlukan',
          });
          return;
        }
        return next();
      }

      // Get allowed MIME types and extensions
      const allowedMimeTypes = ALLOWED_MIME_TYPES[allowedTypes];
      const allowedExtensions = ALLOWED_EXTENSIONS[allowedTypes];

      // Validate single file
      if (file) {
        const isValid = await validateSingleFile(
          file,
          allowedMimeTypes,
          allowedExtensions,
          maxSize
        );

        if (!isValid) {
          deleteInvalidFile(file.path);
          res.status(400).json({
            success: false,
            message: 'File tidak valid atau berbahaya',
          });
          return;
        }
      }

      // Validate multiple files
      if (files) {
        const fileArray = Array.isArray(files) ? files : Object.values(files).flat();

        for (const uploadedFile of fileArray) {
          const isValid = await validateSingleFile(
            uploadedFile,
            allowedMimeTypes,
            allowedExtensions,
            maxSize
          );

          if (!isValid) {
            // Delete all uploaded files if one is invalid
            fileArray.forEach(f => deleteInvalidFile(f.path));
            
            res.status(400).json({
              success: false,
              message: 'Salah satu file tidak valid atau berbahaya',
            });
            return;
          }
        }
      }

      next();
    } catch (error) {
      log.error('Error in file validation middleware', { error });
      next(error);
    }
  };
}

/**
 * Validasi single file
 */
async function validateSingleFile(
  file: Express.Multer.File,
  allowedMimeTypes: string[],
  allowedExtensions: string[],
  maxSize: number
): Promise<boolean> {
  // 1. Validate extension
  if (!validateExtension(file.originalname, allowedExtensions)) {
    log.warn('Invalid file extension', {
      filename: file.originalname,
      extension: path.extname(file.originalname),
    });
    return false;
  }

  // 2. Validate MIME type from multer
  if (!allowedMimeTypes.includes(file.mimetype)) {
    log.warn('Invalid MIME type', {
      filename: file.originalname,
      mimetype: file.mimetype,
    });
    return false;
  }

  // 3. Validate file size
  if (!validateFileSize(file.path, maxSize)) {
    log.warn('File size exceeds limit', {
      filename: file.originalname,
      size: file.size,
      maxSize,
    });
    return false;
  }

  // 4. Validate magic bytes (deep validation)
  const isValidMagicBytes = await validateMagicBytes(file.path, file.mimetype);
  if (!isValidMagicBytes) {
    log.warn('Invalid magic bytes - possible file spoofing', {
      filename: file.originalname,
      mimetype: file.mimetype,
    });
    return false;
  }

  // 5. Additional validation using file-type library
  try {
    const buffer = fs.readFileSync(file.path);
    const detectedType = await fileTypeFromBuffer(buffer);
    
    if (detectedType && detectedType.mime !== file.mimetype) {
      log.warn('MIME type mismatch', {
        filename: file.originalname,
        declared: file.mimetype,
        detected: detectedType.mime,
      });
      return false;
    }
  } catch (error) {
    log.error('Error detecting file type', { filename: file.originalname, error });
    return false;
  }

  log.info('File validated successfully', {
    filename: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
  });

  return true;
}

/**
 * Middleware untuk sanitize filename setelah upload
 */
export function sanitizeUploadedFiles(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.file) {
      req.file.originalname = sanitizeFilename(req.file.originalname);
    }

    if (req.files) {
      const fileArray = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
      fileArray.forEach(file => {
        file.originalname = sanitizeFilename(file.originalname);
      });
    }

    next();
  } catch (error) {
    log.error('Error sanitizing filenames', { error });
    next(error);
  }
}
