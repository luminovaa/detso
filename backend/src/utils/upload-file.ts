import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import fileUpload from 'express-fileupload';

interface UploadedFile {
    path: string;
    fileName: string;
    fullPath: string;
}

interface UploadOptions {
    fieldName: string;
    destination: string;
    allowedMimeTypes?: string[];
    maxFileSize?: number;
}

export const uploadFile = (req: Request, options: UploadOptions): Promise<UploadedFile> => {
    return new Promise((resolve, reject) => {
        if (!req.files || !req.files[options.fieldName]) {
            return reject(new Error('No file uploaded'));
        }

        const file = req.files[options.fieldName] as fileUpload.UploadedFile;
        const uploadDir = path.join(__dirname, '../../..', options.destination);

        // Validasi tipe file
        if (options.allowedMimeTypes && !options.allowedMimeTypes.includes(file.mimetype)) {
            return reject(new Error(`File type not allowed. Allowed types: ${options.allowedMimeTypes.join(', ')}`));
        }

        // Validasi ukuran file
        if (options.maxFileSize && file.size > options.maxFileSize) {
            return reject(new Error(`File too large. Max size: ${options.maxFileSize / 1024 / 1024}MB`));
        }

        // Buat direktori jika belum ada
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const fileName = `${options.fieldName}_${Date.now()}${path.extname(file.name)}`;
        const filePath = path.join(uploadDir, fileName);
        const relativePath = path.join(options.destination, fileName);

        file.mv(filePath, (err) => {
            if (err) {
                return reject(err);
            }

            resolve({
                path: relativePath.replace(/\\/g, '/'), // Convert backslash to forward slash for consistency
                fileName,
                fullPath: filePath
            });
        });
    });
};

export const deleteFile = (filePath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const fullPath = path.join(__dirname, '../../..', filePath);

        if (!fs.existsSync(fullPath)) {
            return resolve(); // File doesn't exist, consider deletion successful
        }

        fs.unlink(fullPath, (err) => {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
};