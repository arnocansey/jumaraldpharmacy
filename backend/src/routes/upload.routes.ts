import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { upload, uploadFile } from "../controllers/upload.controller";

const router = Router();

router.post("/", authenticateToken, upload.single("file"), uploadFile);

export default router;
