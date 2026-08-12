import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth";
import { RoleName } from "@prisma/client";
import {
  getUsers,
  createUser,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
} from "../controllers/user.controller";

const router = Router();

router.use(authenticateToken);
router.use(requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]));

router.get("/", getUsers);
router.post("/", createUser);
router.patch("/:id/role", updateUserRole);
router.patch("/:id/status", toggleUserStatus);
router.delete("/:id", deleteUser);

export default router;
