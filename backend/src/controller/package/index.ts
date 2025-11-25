import express from "express";
import { Detso_Role } from "@prisma/client"; // [NEW] Import Enum
import { getAllPackages, getPackageById } from "./get.package";
import authMiddleware, { ADMIN_ONLY, ALL_STAFF, requireRole } from "../../middleware/middleware";
import { editPackage } from "./edit.package";
import { deletePackage } from "./delete.package";
import { createPackage } from "./create.package";

const packageRouter = express.Router();

// Sebelumnya ini tidak ada middleware auth, SANGAT BERBAHAYA di SaaS.
// Sekarang wajib auth + role check.
packageRouter.get(
  '/:id', 
  authMiddleware, 
  requireRole(ALL_STAFF), 
  getPackageById
); 

// 2. Create Package
packageRouter.post(
  '/', 
  authMiddleware, 
  requireRole(ADMIN_ONLY), 
  createPackage
);

// 3. Get All Packages
packageRouter.get(
  '/', 
  authMiddleware, 
  requireRole(ALL_STAFF), 
  getAllPackages
);

// 4. Edit Package
// Sebelumnya lupa dikasih requireRole, sekarang ditambahkan
packageRouter.put(
  '/:id', 
  authMiddleware, 
  requireRole(ADMIN_ONLY), 
  editPackage
); 

// 5. Delete Package
// Sebelumnya lupa dikasih requireRole, sekarang ditambahkan
packageRouter.delete(
  '/:id', 
  authMiddleware, 
  requireRole(ADMIN_ONLY), 
  deletePackage
);

export default packageRouter;