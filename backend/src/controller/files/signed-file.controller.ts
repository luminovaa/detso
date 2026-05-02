/**
 * SIGNED FILE CONTROLLER
 * 
 * Handles serving files through signed URLs with expiration.
 * Verifies JWT token before serving the file.
 */

import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { verifySignedUrl } from '../../utils/signed-url';
import { asyncHandler, ValidationError, NotFoundError } from '../../utils/error-handler';

/**
 * Serve file with signed URL verification
 * 
 * GET /api/files/signed?token=xxx
 * 
 * @access Public (but requires valid signed token)
 */
export const getSignedFile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    throw new ValidationError('Token is required');
  }

  // Verify token and get file path
  let payload;
  try {
    payload = verifySignedUrl(token);
  } catch (error) {
    if (error instanceof Error) {
      throw new ValidationError(error.message);
    }
    throw new ValidationError('Invalid token');
  }

  // Resolve absolute file path
  const rootDir = process.cwd();
  const filePath = path.join(rootDir, payload.path);

  // Security: Prevent path traversal attacks
  const normalizedPath = path.normalize(filePath);
  if (!normalizedPath.startsWith(rootDir)) {
    throw new ValidationError('Invalid file path');
  }

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    throw new NotFoundError('File not found');
  }

  // Get file stats
  const stats = fs.statSync(filePath);
  if (!stats.isFile()) {
    throw new ValidationError('Path is not a file');
  }

  // Determine content type based on file extension
  const ext = path.extname(filePath).toLowerCase();
  const contentTypeMap: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  };

  const contentType = contentTypeMap[ext] || 'application/octet-stream';

  // Set headers
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Length', stats.size);
  res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.setHeader('Expires', '0');
  res.setHeader('Pragma', 'no-cache');

  // For PDFs, set inline disposition to view in browser
  if (ext === '.pdf') {
    const filename = path.basename(filePath);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  }

  // Stream file to response
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
});
