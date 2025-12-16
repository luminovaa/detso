import { createUploadMiddleware } from "./upload-file";
import { Request } from 'express';

export const uploadCustomerFiles = createUploadMiddleware({
    destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
        // Gunakan path yang konsisten
        const basePath = 'storage/private/customer';
        
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
    destination: 'storage/public/profile',
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    fieldName: 'avatar'
});

export const serviceUpload = createUploadMiddleware({
    destination: 'storage/public/customer/photos',
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    fieldName: 'photos'
}).fields([
    { name: 'photos', maxCount: 8 }
])

export const ticketUpload = createUploadMiddleware({
    destination: 'storage/public/tickets',
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif'],
    maxFileSize: 5 * 1024 * 1024,
    fieldName: 'image'
})

export const tenantUpload = createUploadMiddleware({
    destination: 'storage/public/tenants/logo',
    allowedMimeTypes: ['image/jpeg', 'image/png'],
    maxFileSize: 5 * 1024 * 1024,
    fieldName: 'image'
})
