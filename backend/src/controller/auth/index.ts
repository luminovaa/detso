import express from "express";
import authMiddleware from "../../middleware/middleware";
import { getActiveSessions } from "./get.auth";
import { loginUser } from "./login.auth";
import { logoutUser, revokeSession } from "./logout.auth";
import { refreshAccessToken } from "./token.auth";
import { registerUser } from "./register.auth";
const authRouter = express.Router();

authRouter.post('/sign-in', loginUser);
authRouter.post('/refresh', refreshAccessToken);
authRouter.post('/register', registerUser)

authRouter.get('/active-sessions', authMiddleware, getActiveSessions);
authRouter.post('/logout', authMiddleware, logoutUser);
authRouter.post('/session/revoke/:sessionId', authMiddleware, revokeSession);

export default authRouter;