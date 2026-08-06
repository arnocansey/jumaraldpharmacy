import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth";
import { RoleName } from "@prisma/client";
import {
  checkInteractions,
  createInteraction,
  updateInteraction,
  deleteInteraction,
  getProductInteractions,
  getAllInteractions,
  importInteractions,
} from "../controllers/interaction.controller";

const router = Router();

router.post("/check", checkInteractions);
router.get("/", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST]), getAllInteractions);
router.get("/product/:productId", getProductInteractions);
router.post("/", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST]), createInteraction);
router.put("/:id", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST]), updateInteraction);
router.delete("/:id", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]), deleteInteraction);
router.post("/import", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]), importInteractions);

export default router;
