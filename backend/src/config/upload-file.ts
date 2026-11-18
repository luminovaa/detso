import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { Request } from 'express';

interface UploadedFile {
    path: string;
    fileName: string;
    fullPath: string;
}

interface UploadOptions {
    destination: string | ((req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => void);
    allowedMimeTypes?: string[];
    maxFileSize?: number;
    fieldName?: string;
}

const ensureDirectoryExists = (dirPath: string): void => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

const buildUniqueFilename = (file: Express.Multer.File): string => {
    const ext = path.extname(file.originalname);
    // Include UUID so concurrent/same-millisecond files under one field never overwrite each other
    return `${file.fieldname}_${Date.now()}_${crypto.randomUUID()}${ext}`;
};

const createStorage = (destination: string | ((req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => void)) => {
    if (typeof destination === 'function') {
        return multer.diskStorage({
            destination: (req, file, cb) => {
                destination(req, file, (error, dest) => {
                    if (error) return cb(error, dest);
                    
                    if (typeof dest === 'string') {
                        const uploadDir = path.isAbsolute(dest) ? dest : path.join(__dirname, '../..', dest);
                        ensureDirectoryExists(uploadDir);
                    }
                    
                    cb(null, dest);
                });
            },
            filename: (_req, file, cb) => {
                cb(null, buildUniqueFilename(file));
            }
        });
    }
    
    return multer.diskStorage({
        destination: (_req, _file, cb) => {
            const uploadDir = path.join(__dirname, '../..', destination);
            ensureDirectoryExists(uploadDir);
            cb(null, uploadDir);
        },
        filename: (_req, file, cb) => {
            cb(null, buildUniqueFilename(file));
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

export const createUploadMiddleware = (options: UploadOptions) => {
    const storage = createStorage(options.destination);
    const fileFilter = createFileFilter(options.allowedMimeTypes);
    
    return multer({
        storage,
        fileFilter,
        limits: {
            fileSize: options.maxFileSize || 5 * 1024 * 1024 
        }
    });
};

export const getUploadedFileInfo = (file: Express.Multer.File, destination: string): UploadedFile => {
    const relativePath = path.join(destination, file.filename);
    
    return {
        path: relativePath.replace(/\\/g, '/'), 
        fileName: file.filename,
        fullPath: file.path
    };
};

export const deleteFile = (filePath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const fullPath = path.isAbsolute(filePath) 
            ? filePath 
            : path.join(__dirname, '../..', filePath);

        if (!fs.existsSync(fullPath)) {
            console.warn(`File not found: ${fullPath}`);
            return resolve();
        }

        fs.unlink(fullPath, (err) => {
            if (err) {
                console.error(`Failed to delete file: ${fullPath}`, err);
                return reject(err);
            }
            console.log(`File deleted successfully: ${fullPath}`);
            resolve();
        });
    });
};

export const createDirectory = (dirPath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const fullPath = path.isAbsolute(dirPath) 
            ? dirPath 
            : path.join(__dirname, '../..', dirPath);
            
        ensureDirectoryExists(fullPath);
        resolve();
    });
};

export const fileExists = (filePath: string): boolean => {
    const fullPath = path.isAbsolute(filePath) 
        ? filePath 
        : path.join(__dirname, '../..', filePath);
    return fs.existsSync(fullPath);
};