import express from "express";
import {  getAllPackages, getPackageById } from "./get.package";
import authMiddleware, { requireRole } from "../../middleware/middleware";
import { editPackage } from "./edit.package";
import { deletePackage } from "./delete.package";
import { createPackage } from "./create.package";
const packageRouter = express.Router();

packageRouter.get('/:id', getPackageById); 
packageRouter.post('/', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), createPackage);
packageRouter.get('/',authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), getAllPackages)
packageRouter.put('/:id', authMiddleware, editPackage); 
packageRouter.delete('/:id', authMiddleware, deletePackage);


export default packageRouter;