import express from "express";
import { getAllUsers, getPhotoUserById, getUserById } from "./get.user";
import authMiddleware, { requireRole } from "../../middleware/middleware";
import { editUser, editUserPassword } from "./edit.user";
import { deleteUser } from "./delete.user";
import { avatarUpload } from "../../config/upload.config";
const userRouter = express.Router();


userRouter.get('/:id', getUserById); 
userRouter.patch('/change-password', authMiddleware, editUserPassword)
userRouter.put('/:id', authMiddleware, avatarUpload.single('avatar'), editUser); 
userRouter.get('/image/:id/photo', authMiddleware, getPhotoUserById)
userRouter.get('/',authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), getAllUsers)
userRouter.delete('/:id', authMiddleware, deleteUser);


export default userRouter;