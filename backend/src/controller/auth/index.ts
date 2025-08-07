import express from "express";
import authMiddleware from "../../middleware/middleware";
import { getActiveSessions } from "./get.auth";
import { loginUser } from "./login.auth";
import { logoutUser, revokeSession } from "./logout.auth";
import { extractUserFromToken, getCurrentUser, refreshAccessToken, verifySession } from "./token.auth";
import { registerUser } from "./register.auth";
const authRouter = express.Router();

authRouter.post('/login', loginUser);
authRouter.post('/refresh', refreshAccessToken);
authRouter.post('/register', registerUser)

authRouter.get('/active-sessions', authMiddleware, getActiveSessions);
authRouter.post('/logout', authMiddleware, logoutUser);
authRouter.post('/session/revoke/:sessionId', authMiddleware, revokeSession);
authRouter.get('/verify', verifySession);
authRouter.get('/me', extractUserFromToken, getCurrentUser);

export default authRouter;