/**
 * FILES ROUTER
 * 
 * Routes for file serving with signed URLs
 */

import { Router } from 'express';
import { getSignedFile } from './signed-file.controller';

const router = Router();

/**
 * GET /api/files/signed?token=xxx
 * Serve file with signed URL verification
 * @access Public (requires valid signed token)
 */
router.get('/signed', getSignedFile);

export default router;
