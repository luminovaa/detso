import express from "express";
import {  getAllSchedules } from "./get.schedule";
import authMiddleware, { requireRole } from "../../middleware/middleware";
import { editSchedule } from "./edit.schedule";
import { createWorkSchedule } from "./create.schedule";
const scheduleRouter = express.Router();

scheduleRouter.post('/', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), createWorkSchedule);
scheduleRouter.get('/',authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), getAllSchedules)
scheduleRouter.put('/:id', authMiddleware, editSchedule); 

export default scheduleRouter;