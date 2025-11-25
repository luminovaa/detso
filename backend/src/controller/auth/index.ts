import express from "express";
import authMiddleware, { requireRole } from "../../middleware/middleware";
import { getActiveSessions } from "./get.auth";
import { loginUser } from "./login.auth";
import { logoutUser, revokeSession } from "./logout.auth";
import { extractUserFromToken, getCurrentUser, refreshAccessToken, verifySession } from "./token.auth";
import { createUser, registerTenant } from "./register.auth";
import { createSuperAdminSeed } from "./seed.auth";
const authRouter = express.Router();

authRouter.post('/login', loginUser);
authRouter.post('/refresh', refreshAccessToken);
authRouter.post('/register/tenant', authMiddleware, requireRole(['SAAS_SUPER_ADMIN']), registerTenant)
authRouter.post('/register', authMiddleware, requireRole(['TENANT_ADMIN', 'TENANT_OWNER']), createUser)
authRouter.post('/seed/super-admin', createSuperAdminSeed);

authRouter.get('/active-sessions', authMiddleware, getActiveSessions);
authRouter.post('/logout', authMiddleware, logoutUser);
authRouter.post('/session/revoke/:sessionId', authMiddleware, revokeSession);
authRouter.get('/verify', verifySession);
authRouter.get('/me', extractUserFromToken, getCurrentUser);

export default authRouter;