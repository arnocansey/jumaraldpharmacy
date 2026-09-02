import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth";
import { RoleName } from "@prisma/client";
import {
  getProducts, getCategories, createCategory, updateCategory, deleteCategory, getBrands,
  getProductBySlug, createProduct, updateProduct, deleteProduct, importProducts,
  scanProductBarcode, scanProductImage, scanInvoiceImage, parseVoicePromptHandler, createBatchProducts,
  getMissingImagesStats, generateSingleProductImageHandler, generateBulkMissingImagesHandler,
  searchWebImagesHandler, saveSelectedWebImageHandler,
} from "../controllers/product.controller";
import { upload } from "../controllers/upload.controller";

const router = Router();

router.get("/", getProducts);
router.get("/categories", getCategories);
router.post("/categories", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST, RoleName.INVENTORY_CLERK]), createCategory);
router.put("/categories/:id", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST, RoleName.INVENTORY_CLERK]), updateCategory);
router.delete("/categories/:id", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST]), deleteCategory);
router.get("/brands", getBrands);

// Web Image Search & Save Endpoints
router.get("/web-images/search", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST, RoleName.INVENTORY_CLERK]), searchWebImagesHandler);
router.post("/web-images/save", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST, RoleName.INVENTORY_CLERK]), saveSelectedWebImageHandler);

// AI Image Generation Endpoints
router.get("/ai-images/missing", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST, RoleName.INVENTORY_CLERK]), getMissingImagesStats);
router.post("/ai-images/generate-single", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST, RoleName.INVENTORY_CLERK]), generateSingleProductImageHandler);
router.post("/ai-images/generate-bulk", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST, RoleName.INVENTORY_CLERK]), generateBulkMissingImagesHandler);

// Scanning, OCR, Voice & Batch Endpoints (must be registered before :slug route)
router.get("/scan/barcode/:barcode", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST, RoleName.INVENTORY_CLERK]), scanProductBarcode);
router.post("/scan/ai-image", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST, RoleName.INVENTORY_CLERK]), upload.single("image"), scanProductImage);
router.post("/scan/invoice", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST, RoleName.INVENTORY_CLERK]), upload.single("image"), scanInvoiceImage);
router.post("/scan/voice", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST, RoleName.INVENTORY_CLERK]), parseVoicePromptHandler);
router.post("/batch", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST, RoleName.INVENTORY_CLERK]), createBatchProducts);

router.get("/:slug", getProductBySlug);
router.post("/", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST, RoleName.INVENTORY_CLERK]), createProduct);
router.patch("/:id", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST, RoleName.INVENTORY_CLERK]), updateProduct);
router.delete("/:id", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST]), deleteProduct);
router.post("/import", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.INVENTORY_CLERK]), importProducts);

export default router;

