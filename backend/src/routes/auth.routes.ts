import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { register, login, getMe } from "../controllers/auth.controller";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticateToken, getMe);

export default router;
