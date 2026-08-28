import { Router } from "express";
import { optionalAuthenticateToken } from "../middleware/auth";
import { upload, uploadFile } from "../controllers/upload.controller";

const router = Router();

router.post("/", optionalAuthenticateToken, upload.single("file"), uploadFile);

export default router;
