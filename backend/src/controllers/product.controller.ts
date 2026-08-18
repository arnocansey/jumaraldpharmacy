import { prisma } from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/auth";
import { Response } from "express";
import { z } from "zod";
import { emitInventoryUpdate } from "../lib/socket";

const productQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  requiresPrescription: z.string().optional(),
  inStockOnly: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  sortBy: z.enum(["price_asc", "price_desc", "rating", "name"]).optional(),
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("20"),
});

const createProductSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
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

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { activeIngredients: { contains: search, mode: "insensitive" } },
      ];
    }
    if (category) where.category = { slug: category };
    if (brand) where.brand = { slug: brand };
    if (requiresPrescription !== undefined) where.requiresPrescription = requiresPrescription === "true";
    if (inStockOnly === "true") where.stockQuantity = { gt: 0 };
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = Number(minPrice);
      if (maxPrice) where.price.lte = Number(maxPrice);
    }

    let orderBy: any = { createdAt: "desc" };
    if (sortBy === "price_asc") orderBy = { price: "asc" };
    if (sortBy === "price_desc") orderBy = { price: "desc" };
    if (sortBy === "rating") orderBy = { rating: "desc" };
    if (sortBy === "name") orderBy = { name: "asc" };

    const take = Number(limit);
    const skip = (Number(page) - 1) * take;

    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, orderBy, take, skip, include: { category: true, brand: true } }),
      prisma.product.count({ where }),
    ]);

    return res.json({ products, pagination: { total, page: Number(page), pages: Math.ceil(total / take) } });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to fetch products" });
  }
}

export async function getCategories(req: any, res: Response) {
  try {
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
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: {
        category: true,
        brand: true,
        reviews: { include: { user: { select: { name: true, avatarUrl: true } } } },
        batchExpiries: true,
      },
    });
    if (!product) return res.status(404).json({ message: "Product not found" });
    return res.json(product);
  } catch {
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
        name: data.name, slug, sku: data.sku, description: data.description,
        price: data.price, compareAtPrice: data.compareAtPrice ?? null,
        stockQuantity: data.stockQuantity, minStockAlert: data.minStockAlert,
        requiresPrescription: data.requiresPrescription, isFeatured: data.isFeatured,
        dosageForm: data.dosageForm ?? null, strength: data.strength ?? null,
        activeIngredients: data.activeIngredients ?? null, usageInstructions: data.usageInstructions ?? null,
        sideEffects: data.sideEffects ?? null, warnings: data.warnings ?? null,
        manufacturer: data.manufacturer ?? null, images: data.images,
        categoryId: finalCategoryId, brandId: data.brandId ?? null,
      },
      include: { category: true, brand: true },
    });

    emitInventoryUpdate(product);

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

          await prisma.product.create({
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
