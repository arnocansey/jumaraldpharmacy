import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth";
import { RoleName } from "@prisma/client";
import {
  getBlogPosts,
  getBlogPostBySlug,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  addComment,
  deleteComment,
} from "../controllers/blog.controller";

const router = Router();

router.get("/", getBlogPosts);
router.get("/:slug", getBlogPostBySlug);
router.post("/", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST]), createBlogPost);
router.patch("/:id", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST]), updateBlogPost);
router.delete("/:id", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST]), deleteBlogPost);
router.post("/:id/comments", authenticateToken, addComment);
router.delete("/comments/:commentId", authenticateToken, deleteComment);

export default router;
