import express from "express";
import { getAllUsers, getPhotoUserById, getUserById } from "./get.user";
import authMiddleware, { requireRole } from "../../middleware/middleware";
import { editUser, editUserPassword } from "./edit.user";
import { deleteUser } from "./delete.user";
const userRouter = express.Router();

userRouter.get('/:id', getUserById); 
userRouter.put('/:id/password', authMiddleware, editUserPassword)
userRouter.get('/image/:id/photo', authMiddleware, getPhotoUserById)
userRouter.get('/',authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), getAllUsers)
userRouter.put('/:id', authMiddleware, editUser); 
userRouter.delete('/:id', authMiddleware, deleteUser);


export default userRouter;