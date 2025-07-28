import express from "express";
import { registerUser } from "./register.user";
import { loginUser } from "./login.user";
import { getAllUsers, getPhotoUserById, getUserById } from "./get.user";
import authMiddleware, { requireRole } from "../../middleware/middleware";
import { editUser, editUserPassword } from "./edit.user";
import { deleteUser } from "./delete.user";
const userRouter = express.Router();

userRouter.get('/:id', getUserById); 
userRouter.put('/:id/password', authMiddleware, editUserPassword)
userRouter.get('/image/:id/photo', authMiddleware, getPhotoUserById)
userRouter.post('/sign-up', registerUser);
userRouter.post('/sign-in', loginUser);
userRouter.get('/',authMiddleware, requireRole(['ADMIN']), getAllUsers)
userRouter.put('/:id', authMiddleware, editUser); 
userRouter.delete('/:id', authMiddleware, deleteUser);


export default userRouter;