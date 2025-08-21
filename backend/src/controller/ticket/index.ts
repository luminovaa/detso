import express from "express";
import authMiddleware, { requireRole } from "../../middleware/middleware";
import { createTicket } from "./create.ticket";
import { ticketUpload } from "../../config/upload.config";
import {  getAllTickets, getTicketById, getTicketHistory, getTicketImageById } from "./get.ticket";
import { deleteTicket } from "./delete.ticket";
import { editTicket, updateTicketStatus } from "./edit.ticket";

const ticketRouter = express.Router();

ticketRouter.post(
  '/',
  authMiddleware,
  requireRole(['ADMIN', 'SUPER_ADMIN', 'TEKNISI']),
  createTicket
);
ticketRouter.get('/', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN', 'TEKNISI']), getAllTickets);
ticketRouter.get('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN', 'TEKNISI']), getTicketById);
ticketRouter.get('/:id/history', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN', 'TEKNISI']), getTicketHistory);
ticketRouter.get('/history/:historyId/image', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN', 'TEKNISI']), getTicketImageById);
ticketRouter.put('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN', 'TEKNISI']), ticketUpload.single('image'), editTicket);
ticketRouter.delete('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), deleteTicket);
ticketRouter.put('/:id/status'), authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN', 'TEKNISI']), ticketUpload.single('image'), updateTicketStatus;

export default ticketRouter;