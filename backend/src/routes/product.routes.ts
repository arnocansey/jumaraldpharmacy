import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth";
import { RoleName } from "@prisma/client";
import {
  getProducts, getCategories, createCategory, updateCategory, deleteCategory, getBrands,
  getProductBySlug, createProduct, updateProduct, deleteProduct, importProducts,
} from "../controllers/product.controller";

const router = Router();

router.get("/", getProducts);
router.get("/categories", getCategories);
router.post("/categories", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST, RoleName.INVENTORY_CLERK]), createCategory);
router.put("/categories/:id", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST, RoleName.INVENTORY_CLERK]), updateCategory);
router.delete("/categories/:id", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST]), deleteCategory);
router.get("/brands", getBrands);
router.get("/:slug", getProductBySlug);
router.post("/", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST, RoleName.INVENTORY_CLERK]), createProduct);
router.patch("/:id", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST, RoleName.INVENTORY_CLERK]), updateProduct);
router.delete("/:id", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST]), deleteProduct);
router.post("/import", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.INVENTORY_CLERK]), importProducts);

export default router;
