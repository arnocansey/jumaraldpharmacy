import { prisma } from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/auth";
import { Response } from "express";
import { z } from "zod";
import { emitInventoryUpdate } from "../lib/socket";
import { cacheGet, cacheSet, cacheDel } from "../lib/cache";
import { lookupBarcode, scanProductPackagingImage } from "../services/scanner.service";
import { parseWholesalerInvoice, parseVoiceTranscriptToProduct } from "../services/invoice.service";
import { generatePharmaceuticalProductPhoto } from "../services/image-generator.service";
import { searchWebProductImages, saveWebImageToCdn } from "../services/web-image-search.service";

const productQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  requiresPrescription: z.string().optional(),
  prescription: z.string().optional(),
  prescriptionOnly: z.string().optional(),
  inStockOnly: z.string().optional(),
  inStock: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  sortBy: z.string().optional(),
  sort: z.string().optional(),
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("20"),
});

const createProductSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  barcode: z.string().optional().nullable(),
  description: z.string().min(1),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional().nullable(),
  stockQuantity: z.number().int().min(0).optional().default(0),
  minStockAlert: z.number().int().min(0).optional().default(10),
  requiresPrescription: z.boolean().optional().default(false),
  isFeatured: z.boolean().optional().default(false),
  dosageForm: z.string().optional().nullable(),
  strength: z.string().optional().nullable(),
  activeIngredients: z.string().optional().nullable(),
  usageInstructions: z.string().optional().nullable(),
  sideEffects: z.string().optional().nullable(),
  warnings: z.string().optional().nullable(),
  manufacturer: z.string().optional().nullable(),
  images: z.array(z.string()).optional().default([]),
  categoryId: z.string().optional(),
  newCategoryName: z.string().optional(),
  brandId: z.string().optional().nullable(),
});

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  sku: z.string().min(1).optional(),
  barcode: z.string().optional().nullable(),
  description: z.string().min(1).optional(),
  price: z.number().positive().optional(),
  compareAtPrice: z.number().positive().nullable().optional(),
  stockQuantity: z.number().int().min(0).optional(),
  minStockAlert: z.number().int().min(0).optional(),
  requiresPrescription: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  dosageForm: z.string().nullable().optional(),
  strength: z.string().nullable().optional(),
  activeIngredients: z.string().nullable().optional(),
  usageInstructions: z.string().nullable().optional(),
  sideEffects: z.string().nullable().optional(),
  warnings: z.string().nullable().optional(),
  manufacturer: z.string().nullable().optional(),
  images: z.array(z.string()).optional(),
  categoryId: z.string().optional(),
  newCategoryName: z.string().optional(),
  brandId: z.string().nullable().optional(),
});

const createCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
});

const DEFAULT_CATEGORIES = [
  { name: "Prescription Medications", slug: "prescription-medications", description: "Medications requiring a valid prescription from a licensed healthcare provider" },
  { name: "Over-the-Counter (OTC)", slug: "over-the-counter", description: "Non-prescription medications available without a doctor's order" },
  { name: "Vitamins & Supplements", slug: "vitamins-supplements", description: "Daily health supplements, minerals, multivitamins, and herbal supplements" },
  { name: "Personal Care & Hygiene", slug: "personal-care", description: "Soaps, lotions, dental care, hair care, and feminine hygiene products" },
  { name: "Baby & Child Health", slug: "baby-child-health", description: "Pediatric medications, baby formula, diapers, and child wellness products" },
  { name: "Medical Devices & Equipment", slug: "medical-devices", description: "Blood pressure monitors, glucose meters, nebulizers, and diagnostic tools" },
  { name: "First Aid & Wound Care", slug: "first-aid", description: "Bandages, antiseptics, wound dressings, and emergency care supplies" },
  { name: "Chronic Disease Management", slug: "chronic-disease", description: "Products for managing diabetes, hypertension, asthma, and other chronic conditions" },
  { name: "Women's Health", slug: "womens-health", description: "Feminine care, reproductive health, prenatal vitamins, and menopause support" },
  { name: "Men's Health", slug: "mens-health", description: "Men's wellness, grooming, and health supplements" },
  { name: "Elderly Care", slug: "elderly-care", description: "Products for senior citizens including mobility aids and age-specific medications" },
  { name: "Nutrition & Food", slug: "nutrition-food", description: "Specialty foods, nutritional drinks, and dietary products" },
];

export async function getProducts(req: any, res: Response) {
  try {
    const query = productQuerySchema.parse(req.query);
    const { search, category, brand, requiresPrescription, inStockOnly, minPrice, maxPrice, sortBy, page, limit } = query;

    const cacheKey = `products:list:${JSON.stringify(query)}`;
    const cached = await cacheGet<any>(cacheKey);
    if (cached) {
      res.setHeader("X-Cache", "HIT");
      return res.json(cached);
    }

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } },
        { activeIngredients: { contains: search, mode: "insensitive" } },
      ];
    }
    if (category) where.category = { slug: category };
    if (brand) where.brand = { slug: brand };
    const isRx = requiresPrescription ?? query.prescription ?? query.prescriptionOnly;
    if (isRx !== undefined && isRx !== "") where.requiresPrescription = isRx === "true";
    
    const isInStock = inStockOnly ?? query.inStock;
    if (isInStock === "true") where.stockQuantity = { gt: 0 };

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = Number(minPrice);
      if (maxPrice) where.price.lte = Number(maxPrice);
    }

    const effectiveSortBy = sortBy || query.sort || "featured";
    let orderBy: any = { createdAt: "desc" };
    if (effectiveSortBy === "price_asc") orderBy = { price: "asc" };
    if (effectiveSortBy === "price_desc") orderBy = { price: "desc" };
    if (effectiveSortBy === "rating") orderBy = { rating: "desc" };
    if (effectiveSortBy === "name") orderBy = { name: "asc" };
    if (effectiveSortBy === "featured") orderBy = [{ isFeatured: "desc" }, { createdAt: "desc" }];
    if (effectiveSortBy === "newest" || effectiveSortBy === "createdAt") orderBy = { createdAt: "desc" };

    const take = Number(limit);
    const skip = (Number(page) - 1) * take;

    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, orderBy, take, skip, include: { category: true, brand: true } }),
      prisma.product.count({ where }),
    ]);

    const sanitizedProducts = products.map((p: any) => {
      const catSlug = p.category?.slug?.toLowerCase() || "";
      const catName = p.category?.name?.toLowerCase() || "";
      const isRx = Boolean(
        p.requiresPrescription === true ||
        catSlug.includes("prescription") ||
        catName.includes("prescription")
      );
      return {
        ...p,
        requiresPrescription: isRx,
      };
    });

    const result = { products: sanitizedProducts, pagination: { total, page: Number(page), pages: Math.ceil(total / take) } };
    await cacheSet(cacheKey, result, 120); // 2 min cache
    res.setHeader("X-Cache", "MISS");
    return res.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to fetch products" });
  }
}

export async function getCategories(req: any, res: Response) {
  try {
    const cacheKey = "categories:all";
    const cached = await cacheGet<any>(cacheKey);
    if (cached) {
      res.setHeader("X-Cache", "HIT");
      return res.json(cached);
    }

    let categories = await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    });
    if (categories.length === 0) {
      await prisma.category.createMany({ data: DEFAULT_CATEGORIES, skipDuplicates: true });
      categories = await prisma.category.findMany({
        include: { _count: { select: { products: true } } },
        orderBy: { name: "asc" },
      });
    }

    await cacheSet(cacheKey, categories, 300); // 5 min cache
    res.setHeader("X-Cache", "MISS");
    return res.json(categories);
  } catch {
    return res.status(500).json({ message: "Failed to fetch categories" });
  }
}

export async function createCategory(req: any, res: Response) {
  try {
    const data = createCategorySchema.parse(req.body);
    const slug = data.name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
    const existing = await prisma.category.findFirst({
      where: { OR: [{ name: { equals: data.name, mode: "insensitive" } }, { slug }] },
    });
    if (existing) return res.json(existing);
    const category = await prisma.category.create({
      data: { name: data.name, slug, description: data.description, imageUrl: data.imageUrl },
    });
    await cacheDel("categories:*");
    await cacheDel("products:*");
    return res.status(201).json(category);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to create category" });
  }
}

export async function updateCategory(req: any, res: Response) {
  try {
    const { id } = req.params;
    const { name, description, imageUrl } = req.body;

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Category not found" });

    const updateData: any = {};
    if (name) {
      updateData.name = name;
      updateData.slug = name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
      const duplicate = await prisma.category.findFirst({
        where: { slug: updateData.slug, id: { not: id } },
      });
      if (duplicate) return res.status(400).json({ message: "Category name already exists" });
    }
    if (description !== undefined) updateData.description = description;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl ? imageUrl : null;

    const category = await prisma.category.update({ where: { id }, data: updateData });
    await cacheDel("categories:*");
    await cacheDel("products:*");
    return res.json(category);
  } catch {
    return res.status(500).json({ message: "Failed to update category" });
  }
}

export async function deleteCategory(req: any, res: Response) {
  try {
    const { id } = req.params;
    const existing = await prisma.category.findUnique({ where: { id }, include: { _count: { select: { products: true } } } });
    if (!existing) return res.status(404).json({ message: "Category not found" });
    if (existing._count.products > 0) {
      return res.status(400).json({ message: `Cannot delete category with ${existing._count.products} products. Move or delete products first.` });
    }
    await prisma.category.delete({ where: { id } });
    await cacheDel("categories:*");
    await cacheDel("products:*");
    return res.json({ message: "Category deleted" });
  } catch {
    return res.status(500).json({ message: "Failed to delete category" });
  }
}

export async function getBrands(req: any, res: Response) {
  try {
    const brands = await prisma.brand.findMany({ include: { _count: { select: { products: true } } } });
    return res.json(brands);
  } catch {
    return res.status(500).json({ message: "Failed to fetch brands" });
  }
}

export async function getProductBySlug(req: any, res: Response) {
  try {
    const rawSlug = req.params.slug;
    if (!rawSlug) return res.status(400).json({ message: "Product slug or ID is required" });

    let decoded = rawSlug;
    try {
      decoded = decodeURIComponent(rawSlug).trim();
    } catch {}

    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { slug: rawSlug },
          { slug: decoded },
          { slug: decoded.toLowerCase() },
          { id: rawSlug },
          { sku: rawSlug },
          { sku: decoded },
        ],
      },
      include: {
        category: true,
        brand: true,
        reviews: { include: { user: { select: { name: true, avatarUrl: true } } } },
        batchExpiries: true,
      },
    });
    if (!product) return res.status(404).json({ message: "Product not found" });

    const catSlug = product.category?.slug?.toLowerCase() || "";
    const catName = product.category?.name?.toLowerCase() || "";
    const isRx = Boolean(
      product.requiresPrescription === true ||
      catSlug.includes("prescription") ||
      catName.includes("prescription")
    );

    return res.json({
      ...product,
      requiresPrescription: isRx,
    });
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to fetch product details" });
  }
}

export async function createProduct(req: any, res: Response) {
  try {
    const data = createProductSchema.parse(req.body);
    let finalCategoryId: string = data.categoryId || "";

    if (data.newCategoryName && data.newCategoryName.trim()) {
      const catName = data.newCategoryName.trim();
      const catSlug = catName.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
      let category = await prisma.category.findFirst({
        where: { OR: [{ name: { equals: catName, mode: "insensitive" } }, { slug: catSlug }] },
      });
      if (!category) {
        category = await prisma.category.create({ data: { name: catName, slug: catSlug, description: `Category for ${catName}` } });
      }
      finalCategoryId = category.id;
    } else if (data.categoryId) {
      let category = await prisma.category.findUnique({ where: { id: data.categoryId } });
      if (!category) {
        const catSlug = data.categoryId.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
        category = await prisma.category.findFirst({
          where: { OR: [{ name: { equals: data.categoryId, mode: "insensitive" } }, { slug: catSlug }] },
        });
        if (!category) {
          category = await prisma.category.create({ data: { name: data.categoryId, slug: catSlug, description: `Category for ${data.categoryId}` } });
        }
        finalCategoryId = category.id;
      }
    } else {
      let defaultCat = await prisma.category.findFirst({ where: { slug: "general-pharmaceuticals" } });
      if (!defaultCat) {
        defaultCat = await prisma.category.create({ data: { name: "General Pharmaceuticals", slug: "general-pharmaceuticals", description: "General pharmacy catalog items" } });
      }
      finalCategoryId = defaultCat.id;
    }

    // Auto-detect and enforce prescription requirement if category is Prescription Medications
    let isPrescriptionRequired = Boolean(data.requiresPrescription);
    if (finalCategoryId) {
      const cat = await prisma.category.findUnique({ where: { id: finalCategoryId } });
      if (cat && (cat.slug.includes("prescription") || cat.name.toLowerCase().includes("prescription"))) {
        isPrescriptionRequired = true;
      }
    }

    const baseSlug = data.name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const existingSku = await prisma.product.findUnique({ where: { sku: data.sku } });
    if (existingSku) return res.status(400).json({ message: `SKU "${data.sku}" already exists. Please use a unique SKU.` });

    const product = await prisma.product.create({
      data: {
        name: data.name, slug, sku: data.sku, barcode: data.barcode ?? null, description: data.description,
        price: data.price, compareAtPrice: data.compareAtPrice ?? null,
        stockQuantity: data.stockQuantity, minStockAlert: data.minStockAlert,
        requiresPrescription: isPrescriptionRequired, isFeatured: data.isFeatured,
        dosageForm: data.dosageForm ?? null, strength: data.strength ?? null,
        activeIngredients: data.activeIngredients ?? null, usageInstructions: data.usageInstructions ?? null,
        sideEffects: data.sideEffects ?? null, warnings: data.warnings ?? null,
        manufacturer: data.manufacturer ?? null, images: data.images,
        categoryId: finalCategoryId, brandId: data.brandId ?? null,
      },
      include: { category: true, brand: true },
    });

    emitInventoryUpdate(product);
    await cacheDel("products:*");
    await cacheDel("analytics:*");

    return res.status(201).json(product);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(400).json({ message: "Product creation failed" });
  }
}

export async function updateProduct(req: any, res: Response) {
  try {
    const { id } = req.params;
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Product not found" });

    const data = updateProductSchema.parse(req.body);

    // 1. Check for duplicate SKU if SKU is changing
    if (data.sku && data.sku !== existing.sku) {
      const duplicateSku = await prisma.product.findFirst({
        where: { sku: data.sku, id: { not: id } },
      });
      if (duplicateSku) {
        return res.status(400).json({ message: `SKU "${data.sku}" is already assigned to another product.` });
      }
    }

    // 2. Category resolution
    let finalCategoryId: string | undefined = undefined;
    if (data.newCategoryName && data.newCategoryName.trim()) {
      const catName = data.newCategoryName.trim();
      const catSlug = catName.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
      let category = await prisma.category.findFirst({
        where: { OR: [{ name: { equals: catName, mode: "insensitive" } }, { slug: catSlug }] },
      });
      if (!category) {
        category = await prisma.category.create({
          data: { name: catName, slug: catSlug, description: `Category for ${catName}` },
        });
      }
      finalCategoryId = category.id;
    } else if (data.categoryId && data.categoryId.trim()) {
      let category = await prisma.category.findUnique({ where: { id: data.categoryId } });
      if (!category) {
        const catSlug = data.categoryId.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
        category = await prisma.category.findFirst({
          where: { OR: [{ name: { equals: data.categoryId, mode: "insensitive" } }, { slug: catSlug }] },
        });
        if (!category) {
          category = await prisma.category.create({
            data: { name: data.categoryId, slug: catSlug, description: `Category for ${data.categoryId}` },
          });
        }
      }
      if (category) {
        finalCategoryId = category.id;
      }
    }

    // 3. Regenerate slug if product name changed
    let slug: string | undefined = undefined;
    if (data.name && data.name !== existing.name) {
      const baseSlug = data.name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
      slug = baseSlug;
      let counter = 1;
      while (await prisma.product.findFirst({ where: { slug, id: { not: id } } })) {
        slug = `${baseSlug}-${counter++}`;
      }
    }

    // 4. Clean update payload (excluding non-model fields like newCategoryName)
    const updatePayload: any = {};
    if (data.name !== undefined) updatePayload.name = data.name;
    if (slug !== undefined) updatePayload.slug = slug;
    if (data.sku !== undefined) updatePayload.sku = data.sku;
    if (data.barcode !== undefined) updatePayload.barcode = data.barcode;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.price !== undefined) updatePayload.price = Number(data.price);
    if (data.compareAtPrice !== undefined) updatePayload.compareAtPrice = data.compareAtPrice !== null ? Number(data.compareAtPrice) : null;
    if (data.stockQuantity !== undefined) updatePayload.stockQuantity = Number(data.stockQuantity);
    if (data.minStockAlert !== undefined) updatePayload.minStockAlert = Number(data.minStockAlert);
    if (data.requiresPrescription !== undefined) updatePayload.requiresPrescription = data.requiresPrescription;
    if (data.isFeatured !== undefined) updatePayload.isFeatured = data.isFeatured;
    if (data.dosageForm !== undefined) updatePayload.dosageForm = data.dosageForm;
    if (data.strength !== undefined) updatePayload.strength = data.strength;
    if (data.activeIngredients !== undefined) updatePayload.activeIngredients = data.activeIngredients;
    if (data.usageInstructions !== undefined) updatePayload.usageInstructions = data.usageInstructions;
    if (data.sideEffects !== undefined) updatePayload.sideEffects = data.sideEffects;
    if (data.warnings !== undefined) updatePayload.warnings = data.warnings;
    if (data.manufacturer !== undefined) updatePayload.manufacturer = data.manufacturer;
    if (data.images !== undefined) updatePayload.images = data.images;
    if (finalCategoryId !== undefined) updatePayload.categoryId = finalCategoryId;
    if (data.brandId !== undefined) updatePayload.brandId = data.brandId;

    const updated = await prisma.product.update({
      where: { id },
      data: updatePayload,
      include: { category: true, brand: true },
    });

    emitInventoryUpdate(updated);
    await cacheDel("products:*");
    await cacheDel("analytics:*");

    return res.json(updated);
  } catch (error: any) {
    console.error("updateProduct error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(400).json({ message: error.message || "Failed to update product" });
  }
}

export async function deleteProduct(req: any, res: Response) {
  try {
    const { id } = req.params;
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Product not found" });
    await prisma.product.delete({ where: { id } });
    await cacheDel("products:*");
    await cacheDel("analytics:*");
    return res.json({ message: "Product deleted successfully" });
  } catch {
    return res.status(400).json({ message: "Delete failed" });
  }
}

export async function importProducts(req: any, res: Response) {
  try {
    const { products } = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "Products array is required" });
    }

    const results = { created: 0, updated: 0, errors: [] as string[] };

    for (const item of products) {
      try {
        const slug = (item.name || "").toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
        const existing = await prisma.product.findFirst({ where: { OR: [{ sku: item.sku }, { slug }] } });

        if (existing) {
          await prisma.product.update({
            where: { id: existing.id },
            data: {
              name: item.name || existing.name,
              description: item.description || existing.description,
              price: item.price ? parseFloat(item.price) : existing.price,
              stockQuantity: item.stockQuantity !== undefined ? parseInt(item.stockQuantity) : existing.stockQuantity,
              minStockAlert: item.minStockAlert !== undefined ? parseInt(item.minStockAlert) : existing.minStockAlert,
              requiresPrescription: item.requiresPrescription === "true" || item.requiresPrescription === true,
            },
          });
          results.updated++;
        } else {
          let categoryId = item.categoryId;
          if (item.categoryName && !categoryId) {
            const catSlug = item.categoryName.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
            const cat = await prisma.category.findFirst({ where: { slug: catSlug } });
            if (cat) categoryId = cat.id;
          }

          const newProduct = await prisma.product.create({
            data: {
              name: item.name,
              slug,
              sku: item.sku || `SKU-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
              description: item.description || "",
              price: parseFloat(item.price) || 0,
              compareAtPrice: item.compareAtPrice ? parseFloat(item.compareAtPrice) : null,
              stockQuantity: parseInt(item.stockQuantity) || 0,
              minStockAlert: parseInt(item.minStockAlert) || 10,
              requiresPrescription: item.requiresPrescription === "true" || item.requiresPrescription === true,
              isFeatured: item.isFeatured === "true" || item.isFeatured === true,
              dosageForm: item.dosageForm || null,
              strength: item.strength || null,
              activeIngredients: item.activeIngredients || null,
              usageInstructions: item.usageInstructions || null,
              sideEffects: item.sideEffects || null,
              warnings: item.warnings || null,
              manufacturer: item.manufacturer || null,
              images: item.images ? (typeof item.images === "string" ? item.images.split(",").map((s: string) => s.trim()) : item.images) : [],
              categoryId: categoryId || (await prisma.category.findFirst())?.id || "",
            },
          });
          results.created++;

          // If product has no images and autoGenerateImages is enabled, queue for generation
          if (req.body.autoGenerateImages && (!newProduct.images || newProduct.images.length === 0)) {
            (async () => {
              try {
                const imgUrl = await generatePharmaceuticalProductPhoto({
                  name: newProduct.name,
                  dosageForm: newProduct.dosageForm,
                  strength: newProduct.strength,
                  manufacturer: newProduct.manufacturer,
                  categoryName: item.categoryName,
                });
                if (imgUrl) {
                  await prisma.product.update({
                    where: { id: newProduct.id },
                    data: { images: [imgUrl] },
                  });
                }
              } catch (err) {
                console.warn(`[Auto-Image Import] Failed for ${newProduct.name}:`, err);
              }
            })().catch(console.error);
          }
        }
      } catch (err: any) {
        results.errors.push(`${item.name || "Unknown"}: ${err.message}`);
      }
    }

    return res.json(results);
  } catch (err: any) {
    return res.status(500).json({ message: "Import failed", error: err.message });
  }
}

/**
 * Scan a product barcode to auto-fill details
 */
export async function scanProductBarcode(req: any, res: Response) {
  try {
    const { barcode } = req.params;
    if (!barcode || !barcode.trim()) {
      return res.status(400).json({ message: "Barcode parameter is required" });
    }

    const details = await lookupBarcode(barcode.trim());
    if (!details) {
      return res.status(404).json({ message: "No product details found for this barcode" });
    }

    return res.json({ status: "success", data: details });
  } catch (error: any) {
    console.error("scanProductBarcode error:", error);
    return res.status(500).json({ message: error.message || "Failed to scan barcode" });
  }
}

/**
 * Scan a packaging image via AI Vision to extract structured product details
 */
export async function scanProductImage(req: any, res: Response) {
  try {
    let base64Image = "";
    let mimeType = "image/jpeg";

    if (req.file) {
      base64Image = req.file.buffer.toString("base64");
      mimeType = req.file.mimetype;
    } else if (req.body.imageBase64) {
      base64Image = req.body.imageBase64;
      mimeType = req.body.mimeType || "image/jpeg";
    } else {
      return res.status(400).json({ message: "No image provided. Please upload an image file or provide imageBase64." });
    }

    const details = await scanProductPackagingImage(base64Image, mimeType);
    return res.json({ status: "success", data: details });
  } catch (error: any) {
    console.error("scanProductImage error:", error);
    return res.status(500).json({ message: error.message || "Failed to analyze product packaging image" });
  }
}

/**
 * Scan wholesaler invoice / delivery receipt via AI Vision
 */
export async function scanInvoiceImage(req: any, res: Response) {
  try {
    let base64Image = "";
    let mimeType = "image/jpeg";

    if (req.file) {
      base64Image = req.file.buffer.toString("base64");
      mimeType = req.file.mimetype; // supports image/* and application/pdf
    } else if (req.body.imageBase64) {
      base64Image = req.body.imageBase64;
      mimeType = req.body.mimeType || "image/jpeg";
    } else {
      return res.status(400).json({ message: "No file provided. Please upload an image or PDF invoice." });
    }

    const result = await parseWholesalerInvoice(base64Image, mimeType);
    return res.json({ status: "success", data: result });
  } catch (error: any) {
    console.error("scanInvoiceImage error:", error);
    return res.status(500).json({ message: error.message || "Failed to parse wholesaler invoice" });
  }
}

/**
 * Parse natural voice speech transcript into structured product fields
 */
export async function parseVoicePromptHandler(req: any, res: Response) {
  try {
    const { transcript } = req.body;
    if (!transcript || !transcript.trim()) {
      return res.status(400).json({ message: "Transcript text is required" });
    }

    const parsed = await parseVoiceTranscriptToProduct(transcript.trim());
    return res.json({ status: "success", data: parsed });
  } catch (error: any) {
    console.error("parseVoicePromptHandler error:", error);
    return res.status(500).json({ message: error.message || "Failed to parse voice dictation" });
  }
}

/**
 * Batch create multiple products from invoice staging or rapid scanning
 */
export async function createBatchProducts(req: any, res: Response) {
  try {
    const { products: rawProducts } = req.body;
    if (!Array.isArray(rawProducts) || rawProducts.length === 0) {
      return res.status(400).json({ message: "An array of products is required" });
    }

    const created: any[] = [];
    const errors: string[] = [];

    // Ensure fallback default category exists
    let defaultCat = await prisma.category.findFirst({ where: { slug: "general-pharmaceuticals" } });
    if (!defaultCat) {
      defaultCat = await prisma.category.create({
        data: { name: "General Pharmaceuticals", slug: "general-pharmaceuticals", description: "General pharmacy items" },
      });
    }

    for (let i = 0; i < rawProducts.length; i++) {
      const item = rawProducts[i];
      try {
        if (!item.name || !item.price) {
          errors.push(`Item #${i + 1}: Name and price are required.`);
          continue;
        }

        // Category resolution
        let finalCategoryId = defaultCat.id;
        const catName = (item.categoryName || item.category || "").trim();
        if (catName) {
          const catSlug = catName.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
          let cat = await prisma.category.findFirst({
            where: { OR: [{ name: { equals: catName, mode: "insensitive" } }, { slug: catSlug }] },
          });
          if (!cat) {
            cat = await prisma.category.create({
              data: { name: catName, slug: catSlug, description: `Category for ${catName}` },
            });
          }
          finalCategoryId = cat.id;
        }

        // SKU resolution (ensure unique)
        let sku = (item.sku || "").trim();
        if (!sku) {
          const cleanName = item.name.replace(/[^a-zA-Z0-9\s]/g, "").trim().split(/\s+/);
          const prefix = cleanName.slice(0, 2).map((w: string) => w.slice(0, 3).toUpperCase()).join("-");
          sku = `${prefix || "MED"}-${Math.floor(1000 + Math.random() * 9000)}`;
        }
        let skuCounter = 1;
        const baseSku = sku;
        while (await prisma.product.findUnique({ where: { sku } })) {
          sku = `${baseSku}-${skuCounter++}`;
        }

        // Slug generation
        const baseSlug = item.name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
        let slug = baseSlug;
        let slugCounter = 1;
        while (await prisma.product.findUnique({ where: { slug } })) {
          slug = `${baseSlug}-${slugCounter++}`;
        }

        const product = await prisma.product.create({
          data: {
            name: item.name,
            slug,
            sku,
            barcode: item.barcode || null,
            description: item.description || `Medication: ${item.name}`,
            price: Number(item.price),
            compareAtPrice: item.compareAtPrice ? Number(item.compareAtPrice) : null,
            costPrice: item.costPrice ? Number(item.costPrice) : null,
            stockQuantity: Math.max(0, parseInt(item.stockQuantity ?? item.quantity) || 10),
            minStockAlert: Math.max(1, parseInt(item.minStockAlert) || 5),
            requiresPrescription: !!item.requiresPrescription,
            dosageForm: item.dosageForm || null,
            strength: item.strength || null,
            activeIngredients: item.activeIngredients || null,
            usageInstructions: item.usageInstructions || null,
            sideEffects: item.sideEffects || null,
            warnings: item.warnings || null,
            manufacturer: item.manufacturer || null,
            images: Array.isArray(item.images) ? item.images : item.imageUrl ? [item.imageUrl] : [],
            categoryId: finalCategoryId,
          },
          include: { category: true },
        });

        // If batch expiry information was provided from invoice
        if (item.batchNumber && item.expiryDate) {
          try {
            const exp = new Date(item.expiryDate);
            if (!isNaN(exp.getTime())) {
              await prisma.batchExpiry.create({
                data: {
                  productId: product.id,
                  batchNumber: item.batchNumber,
                  quantity: product.stockQuantity,
                  expiryDate: exp,
                  costPrice: item.costPrice ? Number(item.costPrice) : null,
                  supplier: item.manufacturer || "Distributor",
                },
              });
            }
          } catch {
            // Ignore batch creation failure
          }
        }

        emitInventoryUpdate(product);
        created.push(product);
      } catch (err: any) {
        errors.push(`"${item.name || 'Item'}": ${err.message}`);
      }
    }

    // Optional background auto-image generation for created items without images (Option 3)
    if (req.body.autoGenerateImages && created.length > 0) {
      (async () => {
        for (const prod of created) {
          if (!prod.images || prod.images.length === 0) {
            try {
              const imgUrl = await generatePharmaceuticalProductPhoto({
                name: prod.name,
                dosageForm: prod.dosageForm,
                strength: prod.strength,
                categoryName: prod.category?.name,
                manufacturer: prod.manufacturer,
              });
              if (imgUrl) {
                await prisma.product.update({
                  where: { id: prod.id },
                  data: { images: [imgUrl] },
                });
              }
            } catch (err) {
              console.warn(`[Auto-Image] Failed for batch product ${prod.name}:`, err);
            }
          }
        }
      })().catch(console.error);
    }

    return res.status(201).json({
      status: "success",
      createdCount: created.length,
      products: created,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("createBatchProducts error:", error);
    return res.status(500).json({ message: error.message || "Batch product creation failed" });
  }
}

/**
 * Get count and list of products that currently have no photos
 */
export async function getMissingImagesStats(req: any, res: Response) {
  try {
    const productsWithoutImages = await prisma.product.findMany({
      where: {
        OR: [
          { images: { equals: [] } },
          { images: { equals: [""] } },
          { images: { equals: ["/placeholder.png"] } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        sku: true,
        price: true,
        dosageForm: true,
        strength: true,
        manufacturer: true,
        images: true,
        category: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      status: "success",
      count: productsWithoutImages.length,
      products: productsWithoutImages,
    });
  } catch (error: any) {
    console.error("getMissingImagesStats error:", error);
    return res.status(500).json({ message: error.message || "Failed to fetch missing image statistics" });
  }
}

/**
 * Generate a single AI product photo on-the-fly (for Add/Edit Product Modal or direct product ID)
 */
export async function generateSingleProductImageHandler(req: any, res: Response) {
  try {
    const { productId, name, dosageForm, strength, manufacturer, categoryName, saveToProduct } = req.body;

    let targetDetails = {
      name: name || "",
      dosageForm: dosageForm || "",
      strength: strength || "",
      manufacturer: manufacturer || "",
      categoryName: categoryName || "",
    };

    let existingProduct: any = null;

    if (productId) {
      existingProduct = await prisma.product.findUnique({
        where: { id: productId },
        include: { category: true },
      });

      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      targetDetails = {
        name: existingProduct.name,
        dosageForm: existingProduct.dosageForm || targetDetails.dosageForm,
        strength: existingProduct.strength || targetDetails.strength,
        manufacturer: existingProduct.manufacturer || targetDetails.manufacturer,
        categoryName: existingProduct.category?.name || targetDetails.categoryName,
      };
    }

    if (!targetDetails.name || !targetDetails.name.trim()) {
      return res.status(400).json({ message: "Product name is required to generate an authentic image" });
    }

    const imageUrl = await generatePharmaceuticalProductPhoto(targetDetails);

    // Save to product if requested or if productId was passed
    if (productId && (saveToProduct !== false)) {
      const currentImages = Array.isArray(existingProduct.images) ? existingProduct.images : [];
      const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: {
          images: [imageUrl, ...currentImages.filter((img: string) => img && img !== "/placeholder.png")],
        },
      });

      // Clear product cache
      await cacheDel(`products:*`);
      await cacheDel(`product:${existingProduct.slug}`);

      return res.json({
        status: "success",
        imageUrl,
        product: updatedProduct,
      });
    }

    return res.json({
      status: "success",
      imageUrl,
    });
  } catch (error: any) {
    console.error("generateSingleProductImageHandler error:", error);
    return res.status(500).json({ message: error.message || "Failed to generate AI product image" });
  }
}

/**
 * Bulk generate AI images for products without photos
 */
export async function generateBulkMissingImagesHandler(req: any, res: Response) {
  try {
    const { productIds, limit = 20 } = req.body;

    let targetProducts: any[] = [];

    if (Array.isArray(productIds) && productIds.length > 0) {
      targetProducts = await prisma.product.findMany({
        where: { id: { in: productIds } },
        include: { category: true },
      });
    } else {
      targetProducts = await prisma.product.findMany({
        where: {
          OR: [
            { images: { equals: [] } },
            { images: { equals: [""] } },
            { images: { equals: ["/placeholder.png"] } },
          ],
        },
        include: { category: true },
        take: Math.min(Number(limit) || 20, 50),
        orderBy: { createdAt: "desc" },
      });
    }

    if (targetProducts.length === 0) {
      return res.json({
        status: "success",
        message: "No products currently need image generation",
        totalProcessed: 0,
        successful: 0,
        failed: 0,
        results: [],
      });
    }

    const results: Array<{ productId: string; name: string; imageUrl?: string; success: boolean; error?: string }> = [];

    for (const prod of targetProducts) {
      try {
        const imageUrl = await generatePharmaceuticalProductPhoto({
          name: prod.name,
          dosageForm: prod.dosageForm,
          strength: prod.strength,
          categoryName: prod.category?.name,
          manufacturer: prod.manufacturer,
        });

        await prisma.product.update({
          where: { id: prod.id },
          data: {
            images: [imageUrl],
          },
        });

        results.push({
          productId: prod.id,
          name: prod.name,
          imageUrl,
          success: true,
        });
      } catch (err: any) {
        console.error(`Failed to generate image for "${prod.name}":`, err?.message);
        results.push({
          productId: prod.id,
          name: prod.name,
          success: false,
          error: err?.message || "Generation error",
        });
      }
    }

    // Invalidate product caches
    await cacheDel("products:*");

    const successfulCount = results.filter((r) => r.success).length;

    return res.json({
      status: "success",
      totalProcessed: results.length,
      successful: successfulCount,
      failed: results.length - successfulCount,
      results,
    });
  } catch (error: any) {
    console.error("generateBulkMissingImagesHandler error:", error);
    return res.status(500).json({ message: error.message || "Bulk image generation failed" });
  }
}

/**
 * Search the web for authentic manufacturer medication images
 */
export async function searchWebImagesHandler(req: any, res: Response) {
  // Never cache search responses with 304 or stale bodies
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");

  try {
    const q = req.query.q as string;
    const name = req.query.name as string;
    const manufacturer = req.query.manufacturer as string;
    const strength = req.query.strength as string;
    const dosageForm = req.query.dosageForm as string;

    const results = await searchWebProductImages({
      q,
      name,
      manufacturer,
      strength,
      dosageForm,
    });

    return res.json({
      status: "success",
      count: results.length,
      images: results,
    });
  } catch (error: any) {
    console.error("searchWebImagesHandler error:", error);
    return res.status(500).json({ message: error.message || "Web image search failed" });
  }
}

/**
 * Save selected web image to Cloudinary CDN and optionally update product
 */
export async function saveSelectedWebImageHandler(req: any, res: Response) {
  try {
    const { imageUrl, productName, productId, saveToProduct } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: "imageUrl is required" });
    }

    const cdnUrl = await saveWebImageToCdn(imageUrl, productName || "medicine");

    if (productId && saveToProduct !== false) {
      const prod = await prisma.product.findUnique({ where: { id: productId } });
      if (prod) {
        const currentImages = Array.isArray(prod.images) ? prod.images : [];
        await prisma.product.update({
          where: { id: productId },
          data: {
            images: [cdnUrl, ...currentImages.filter((img) => img && img !== "/placeholder.png")],
          },
        });
        await cacheDel("products:*");
        await cacheDel(`product:${prod.slug}`);
      }
    }

    return res.json({
      status: "success",
      cdnUrl,
      imageUrl: cdnUrl,
    });
  } catch (error: any) {
    console.error("saveSelectedWebImageHandler error:", error);
    return res.status(500).json({ message: error.message || "Failed to save selected web image to CDN" });
  }
}




