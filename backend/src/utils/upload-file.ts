import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

interface UploadedFile {
    path: string;
    fileName: string;
    fullPath: string;
}

interface UploadOptions {
    destination: string;
    allowedMimeTypes?: string[];
    maxFileSize?: number;
    fieldName?: string;
}

const createStorage = (destination: string) => {
    return multer.diskStorage({
        destination: (req, file, cb) => {
            const uploadDir = path.join(__dirname, '../..', destination);
            
            // Buat direktori jika belum ada
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            const fileName = `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`;
            cb(null, fileName);
        }
    });
};

const createFileFilter = (allowedMimeTypes?: string[]) => {
    return (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
        if (allowedMimeTypes && !allowedMimeTypes.includes(file.mimetype)) {
            return cb(new Error(`File type not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`));
        }
        cb(null, true);
    };
};

// Factory function untuk membuat multer instance
export const createUploadMiddleware = (options: UploadOptions) => {
    const storage = createStorage(options.destination);
    const fileFilter = createFileFilter(options.allowedMimeTypes);
    
    return multer({
        storage,
        fileFilter,
        limits: {
            fileSize: options.maxFileSize || 5 * 1024 * 1024 // Default 5MB
        }
    });
};

export const getUploadedFileInfo = (file: Express.Multer.File, destination: string): UploadedFile => {
    const relativePath = path.join(destination, file.filename);
    
    return {
        path: relativePath.replace(/\\/g, '/'), // Convert backslash to forward slash
        fileName: file.filename,
        fullPath: file.path
    };
};

export const deleteFile = (filePath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const fullPath = path.join(__dirname, '../..', filePath);

        if (!fs.existsSync(fullPath)) {
            return resolve(); 
        }

        fs.unlink(fullPath, (err) => {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
};