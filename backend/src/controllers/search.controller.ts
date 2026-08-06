import { prisma } from "../lib/prisma";
import { Response } from "express";

const SYMPTOM_MAP: Record<string, string[]> = {
  headache: ["analgesics", "pain-relief", "nsaid"],
  fever: ["analgesics", "antipyretics", "pain-relief"],
  cough: ["antitussives", "expectorants", "respiratory"],
  cold: ["antihistamines", "decongestants", "respiratory"],
  flu: ["antivirals", "analgesics", "respiratory"],
  diabetes: ["antidiabetics", "insulin", "chronic-disease"],
  hypertension: ["antihypertensives", "cardiovascular", "chronic-disease"],
  malaria: ["antimalarials", "antiparasitic"],
  infection: ["antibiotics", "antimicrobials"],
  allergy: ["antihistamines", "allergy"],
  pain: ["analgesics", "pain-relief", "nsaid"],
  stomach: ["antacids", "gastrointestinal", "digestive"],
  skin: ["dermatological", "topical", "skin-care"],
  vitamin: ["vitamins", "supplements", "nutrition"],
  pregnancy: ["prenatal", "vitamins", "womens-health"],
  asthma: ["bronchodilators", "respiratory", "inhalers"],
  depression: ["antidepressants", "mental-health"],
  anxiety: ["anxiolytics", "mental-health"],
  insomnia: ["sleep-aids", "sedatives"],
  arthritis: ["nsaid", "analgesics", "anti-inflammatory"],
};

export async function searchMedicines(req: any, res: Response) {
  try {
    const q = (req.query.q as string || "").trim();
    const category = req.query.category as string | undefined;
    const requiresPrescription = req.query.prescription as string | undefined;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    if (!q) return res.json({ products: [], pagination: { total: 0, page: 1, pages: 0 } });

    const where: any = { isActive: true };
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { activeIngredients: { contains: q, mode: "insensitive" } },
      { tags: { has: q.toLowerCase() } },
      { drugClass: { contains: q, mode: "insensitive" } },
      { manufacturer: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
      { barcode: { contains: q, mode: "insensitive" } },
    ];

    if (category) where.category = { slug: category };
    if (requiresPrescription !== undefined) where.requiresPrescription = requiresPrescription === "true";

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true, brand: true },
        orderBy: [{ stockQuantity: "desc" }, { rating: "desc" }],
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.product.count({ where }),
    ]);

    return res.json({ products, pagination: { total, page, pages: Math.ceil(total / limit) } });
  } catch {
    return res.status(500).json({ message: "Search failed" });
  }
}

export async function searchBySymptoms(req: any, res: Response) {
  try {
    const q = (req.query.q as string || "").trim().toLowerCase();
    if (!q) return res.json({ products: [], conditions: [] });

    const matchedConditions: string[] = [];
    for (const [symptom, drugClasses] of Object.entries(SYMPTOM_MAP)) {
      if (q.includes(symptom) || symptom.includes(q)) {
        matchedConditions.push(symptom);
      }
    }

    const drugClasses = new Set<string>();
    for (const condition of matchedConditions) {
      const classes = SYMPTOM_MAP[condition] || [];
      classes.forEach((c) => drugClasses.add(c));
    }

    if (drugClasses.size === 0) {
      for (const [symptom, classes] of Object.entries(SYMPTOM_MAP)) {
        if (classes.some((c) => c.includes(q) || q.includes(c))) {
          classes.forEach((c) => drugClasses.add(c));
          matchedConditions.push(symptom);
        }
      }
    }

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { drugClass: { in: Array.from(drugClasses), mode: "insensitive" } },
          { tags: { hasSome: Array.from(drugClasses) } },
          { activeIngredients: { contains: q, mode: "insensitive" } },
          { category: { slug: { in: Array.from(drugClasses), mode: "insensitive" } } },
        ],
      },
      include: { category: true, brand: true },
      orderBy: [{ stockQuantity: "desc" }, { rating: "desc" }],
      take: 20,
    });

    return res.json({
      products,
      matchedConditions,
      suggestion: products.length === 0 ? "No exact matches found. Try searching by medicine name or browse categories." : undefined,
    });
  } catch {
    return res.status(500).json({ message: "Symptom search failed" });
  }
}

export async function getAlternatives(req: any, res: Response) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.productId },
      include: { category: true },
    });

    if (!product) return res.status(404).json({ message: "Product not found" });

    const alternatives = await prisma.product.findMany({
      where: {
        id: { not: product.id },
        isActive: true,
        OR: [
          { categoryId: product.categoryId },
          { activeIngredients: product.activeIngredients ? { contains: product.activeIngredients.split(",")[0].trim(), mode: "insensitive" } : undefined },
          { drugClass: product.drugClass ? { equals: product.drugClass, mode: "insensitive" } : undefined },
        ],
      },
      include: { category: true, brand: true },
      orderBy: [{ stockQuantity: "desc" }, { rating: "desc" }],
      take: 10,
    });

    return res.json(alternatives);
  } catch {
    return res.status(500).json({ message: "Failed to fetch alternatives" });
  }
}

export async function getPopularSearches(req: any, res: Response) {
  try {
    const popular = await prisma.orderItem.groupBy({
      by: ["productId"],
      _count: { productId: true },
      orderBy: { _count: { productId: "desc" } },
      take: 10,
    });

    const productIds = popular.map((p) => p.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, slug: true, images: true, price: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));
    const results = popular
      .map((p) => ({ ...productMap.get(p.productId), searchCount: p._count.productId }))
      .filter(Boolean);

    return res.json(results);
  } catch {
    return res.status(500).json({ message: "Failed to fetch popular searches" });
  }
}

export async function getSearchSuggestions(req: any, res: Response) {
  try {
    const q = (req.query.q as string || "").trim();
    if (q.length < 2) return res.json([]);

    const suggestions = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { activeIngredients: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, slug: true, price: true, images: true },
      take: 8,
    });

    return res.json(suggestions);
  } catch {
    return res.status(500).json({ message: "Failed to fetch suggestions" });
  }
}
