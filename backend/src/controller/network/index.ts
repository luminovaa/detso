import express from 'express';
import authMiddleware, { requireRole } from '../../middleware/middleware';
import { getTopology, getNodes, getNodeById, getLinks } from './get.network';
import { createNode, createLink } from './create.network';
import { editNode, editLink } from './edit.network';
import { deleteNode, deleteLink } from './delete.network';

const networkRouter = express.Router();

// All network routes require TENANT_OWNER role
const ownerOnly = requireRole(['TENANT_OWNER']);

// ─── Topology ────────────────────────────────────────────────────
networkRouter.get('/topology', authMiddleware, ownerOnly, getTopology);

// ─── Nodes (Server & ODP) ────────────────────────────────────────
networkRouter.get('/nodes', authMiddleware, ownerOnly, getNodes);
networkRouter.get('/nodes/:id', authMiddleware, ownerOnly, getNodeById);
networkRouter.post('/nodes', authMiddleware, ownerOnly, createNode);
networkRouter.put('/nodes/:id', authMiddleware, ownerOnly, editNode);
networkRouter.delete('/nodes/:id', authMiddleware, ownerOnly, deleteNode);

// ─── Links (Connections) ─────────────────────────────────────────
networkRouter.get('/links', authMiddleware, ownerOnly, getLinks);
networkRouter.post('/links', authMiddleware, ownerOnly, createLink);
networkRouter.put('/links/:id', authMiddleware, ownerOnly, editLink);
networkRouter.delete('/links/:id', authMiddleware, ownerOnly, deleteLink);

export default networkRouter;
