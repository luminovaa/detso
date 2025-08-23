import express from "express";
import {  getAllSchedules, getScheduleById } from "./get.schedule";
import authMiddleware, { requireRole } from "../../middleware/middleware";
import { editSchedule } from "./edit.schedule";
import { createWorkSchedule } from "./create.schedule";
const scheduleRouter = express.Router();

scheduleRouter.post('/', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), createWorkSchedule);
scheduleRouter.get('/',authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN', 'TEKNISI']), getAllSchedules)
scheduleRouter.put('/:id', authMiddleware, editSchedule); 
scheduleRouter.get('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN', 'TEKNISI']), getScheduleById)

export default scheduleRouter;