import express from "express";
import { getAllUsers, getPhotoUserById, getUserById } from "./get.user";
import authMiddleware, { requireRole } from "../../middleware/middleware";
import { editUser, editUserPassword } from "./edit.user";
import { deleteUser } from "./delete.user";
import { createUploadMiddleware } from "../../utils/upload-file";
const userRouter = express.Router();

const avatarUpload = createUploadMiddleware({
    destination: 'image/profile',
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    fieldName: 'avatar'
});


userRouter.get('/:id', getUserById); 
userRouter.put('/:id/password', authMiddleware, editUserPassword)
userRouter.put('/:id', authMiddleware, avatarUpload.single('avatar'), editUser); 
userRouter.get('/image/:id/photo', authMiddleware, getPhotoUserById)
userRouter.get('/',authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), getAllUsers)
userRouter.delete('/:id', authMiddleware, deleteUser);


export default userRouter;