import express from "express";
import authMiddleware, { ADMIN_ONLY, ALL_STAFF, requireRole } from "../../middleware/middleware";
import { createTicket } from "./create.ticket";
import { ticketUpload } from "../../config/upload.config";
import {  getAllTickets, getTicketById, getTicketHistory, getTicketImageById } from "./get.ticket";
import { deleteTicket } from "./delete.ticket";
import { editTicket, updateTicketStatus } from "./edit.ticket";

const ticketRouter = express.Router();

ticketRouter.post(
  '/',
  authMiddleware,
  requireRole(ALL_STAFF),
  createTicket
);
ticketRouter.get('/', authMiddleware, requireRole(ALL_STAFF), getAllTickets);
ticketRouter.get('/:id', authMiddleware, requireRole(ALL_STAFF), getTicketById);
ticketRouter.put('/status/:id', authMiddleware, requireRole(ALL_STAFF), ticketUpload.single('image'), updateTicketStatus);
ticketRouter.get('/:id/history', authMiddleware, requireRole(ALL_STAFF), getTicketHistory);
ticketRouter.get('/history/:historyId/image', authMiddleware, requireRole(ALL_STAFF), getTicketImageById);
ticketRouter.put('/:id', authMiddleware, requireRole(ALL_STAFF), ticketUpload.single('image'), editTicket);
ticketRouter.delete('/:id', authMiddleware, requireRole(ADMIN_ONLY), deleteTicket);

export default ticketRouter;