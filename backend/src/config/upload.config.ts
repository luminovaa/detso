import { createUploadMiddleware } from "./upload-file";
import { Request } from 'express';

export const uploadCustomerFiles = createUploadMiddleware({
    destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
        // Gunakan path yang konsisten
        const basePath = 'storage/image/customer';
        
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
    { name: 'photos', maxCount: 8 }
]);

export const avatarUpload = createUploadMiddleware({
    destination: 'storage/image/profile',
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    fieldName: 'avatar'
});

export const serviceUpload = createUploadMiddleware({
    destination: 'storage/image/customer/photos',
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    fieldName: 'photos'
}).fields([
    { name: 'photos', maxCount: 8 }
])

export const ticketUpload = createUploadMiddleware({
    destination: 'storage/image/tickets',
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif'],
    maxFileSize: 5 * 1024 * 1024,
    fieldName: 'image'
})
