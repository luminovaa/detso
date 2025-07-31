import { createUploadMiddleware } from "./upload-file";
import { Request } from 'express';

export const uploadCustomerFiles = createUploadMiddleware({
    destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
        // Gunakan path yang konsisten
        const basePath = 'image/customer';
        
        if (file.fieldname === 'documents') {
            cb(null, `${basePath}/documents`);
        } else if (file.fieldname === 'photos') {
            cb(null, `${basePath}/photos`);
        } else {
            cb(new Error('Invalid fieldname'), '');
        }
    },
    allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    maxFileSize: 5 * 1024 * 1024 // 5MB
}).fields([
    { name: 'documents', maxCount: 3 },
    { name: 'photos', maxCount: 5 }
]);

export const avatarUpload = createUploadMiddleware({
    destination: 'image/profile',
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    fieldName: 'avatar'
});
