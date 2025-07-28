import express from "express";
import authMiddleware, { requireRole } from "../../middleware/middleware";
import { getActiveSessions } from "./get.auth";
import { loginUser } from "./login.auth";
import { logoutUser, revokeSession } from "./logout.auth";
const authRouter = express.Router();

authRouter.post('/sign-in', loginUser);
authRouter.get('/active-sessions', authMiddleware, getActiveSessions);
authRouter.post('/logout', authMiddleware, logoutUser);
authRouter.post('/session/revoke/:sessionId', authMiddleware, revokeSession);
export default authRouter;