/**
 * Mikrotik Routes
 */

import { Router } from 'express';
import authMiddleware, { requireRole, ADMIN_ONLY } from '../../middleware/middleware';

// Router CRUD
import {
  getRouters,
  getRouterById,
  createRouter,
  updateRouter,
  deleteRouter,
  testRouterConnection,
} from './router.controller';

// Monitoring
import {
  getCurrentMonitoring,
  getHistoricalMonitoring,
  getInterfaceStats,
  forcePollRouter,
} from './monitoring.controller';

const router = Router();

// All routes require authentication and Owner/Admin role
router.use(authMiddleware);
router.use(requireRole(ADMIN_ONLY));

// ==========================================
// ROUTER CRUD ROUTES
// ==========================================

// Get all routers
router.get('/router', getRouters);

// Get single router
router.get('/router/:id', getRouterById);

// Create router
router.post('/router', createRouter);

// Update router
router.put('/router/:id', updateRouter);

// Delete router
router.delete('/router/:id', deleteRouter);

// Test connection
router.post('/router/:id/test', testRouterConnection);

// ==========================================
// MONITORING ROUTES
// ==========================================

// Get current monitoring data
router.get('/monitoring/:router_id/current', getCurrentMonitoring);

// Get historical data
router.get('/monitoring/:router_id/history', getHistoricalMonitoring);

// Get interface statistics
router.get('/monitoring/:router_id/interfaces', getInterfaceStats);

// Force poll router
router.post('/monitoring/:router_id/poll', forcePollRouter);

export default router;
