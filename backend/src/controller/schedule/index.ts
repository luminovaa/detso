import express from "express";
import {  getAllSchedules, getScheduleById } from "./get.schedule";
import authMiddleware, { ADMIN_ONLY, ALL_STAFF, requireRole } from "../../middleware/middleware";
import { editSchedule } from "./edit.schedule";
import { createWorkSchedule } from "./create.schedule";
import { scheduleUpload } from "../../config/upload.config";
const scheduleRouter = express.Router();

scheduleRouter.post('/', authMiddleware, requireRole(ADMIN_ONLY), createWorkSchedule);
scheduleRouter.get('/',authMiddleware, requireRole(ALL_STAFF), getAllSchedules)
scheduleRouter.put('/:id', authMiddleware, scheduleUpload.single('image'), editSchedule); 
scheduleRouter.get('/:id', authMiddleware, requireRole(ALL_STAFF), getScheduleById)

export default scheduleRouter;