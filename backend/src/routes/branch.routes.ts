import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth";
import { RoleName } from "@prisma/client";
import {
  createBranch,
  updateBranch,
  deleteBranch,
  getAllBranches,
  getBranchById,
  getNearbyBranches,
  transferStock,
  getBranchInventory,
  updateBranchInventory,
  getBranchAnalytics,
  getBranchStaff,
  addBranchStaff,
  removeBranchStaff,
} from "../controllers/branch.controller";

const router = Router();

router.get("/", authenticateToken, getAllBranches);
router.get("/nearby", getNearbyBranches);
router.get("/:id", authenticateToken, getBranchById);
router.post("/", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]), createBranch);
router.put("/:id", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]), updateBranch);
router.delete("/:id", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]), deleteBranch);

router.get("/:id/inventory", authenticateToken, getBranchInventory);
router.put("/:id/inventory", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST]), updateBranchInventory);
router.post("/:id/transfer", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST]), transferStock);

router.get("/:id/analytics", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.BRANCH_MANAGER]), getBranchAnalytics);

router.get("/:id/staff", authenticateToken, getBranchStaff);
router.post("/:id/staff", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]), addBranchStaff);
router.delete("/:id/staff/:userId", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]), removeBranchStaff);

export default router;
