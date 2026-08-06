import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth";
import { RoleName } from "@prisma/client";
import {
  getProducts, getCategories, createCategory, updateCategory, deleteCategory, getBrands,
  getProductBySlug, createProduct, updateProduct, deleteProduct,
} from "../controllers/product.controller";

const router = Router();

router.get("/", getProducts);
router.get("/categories", getCategories);
router.post("/categories", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST]), createCategory);
router.put("/categories/:id", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST]), updateCategory);
router.delete("/categories/:id", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST]), deleteCategory);
router.get("/brands", getBrands);
router.get("/:slug", getProductBySlug);
router.post("/", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST]), createProduct);
router.patch("/:id", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST]), updateProduct);
router.delete("/:id", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST]), deleteProduct);

export default router;
