import { z } from "zod";
import { prisma } from "../../../lib/prisma";

export interface AIToolDefinition<TInput = any, TOutput = any> {
  name: string;
  description: string;
  inputSchema: z.ZodSchema<TInput>;
  execute: (input: TInput, context?: { userId?: string }) => Promise<TOutput>;
}

export const searchProductsTool: AIToolDefinition = {
  name: "searchProducts",
  description: "Search for in-stock medications, OTC remedies, vitamins, and personal care products at Jumarald Pharmacy.",
  inputSchema: z.object({
    query: z.string().min(1),
    maxPrice: z.number().optional(),
    category: z.string().optional(),
  }),
  execute: async ({ query, maxPrice, category }) => {
    const where: any = { isActive: true, stockQuantity: { gt: 0 } };
    if (query) {
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { activeIngredients: { contains: query, mode: "insensitive" } },
      ];
    }
    if (maxPrice) {
      where.price = { lte: maxPrice };
    }
    if (category) {
      where.category = { name: { contains: category, mode: "insensitive" } };
    }

    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        stockQuantity: true,
        requiresPrescription: true,
        category: { select: { name: true } },
        description: true,
      },
      take: 6,
    });

    return {
      count: products.length,
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        inStock: p.stockQuantity > 0,
        requiresPrescription: p.requiresPrescription,
        category: p.category?.name || "General Pharmacy",
        summary: p.description?.slice(0, 100) || "",
      })),
    };
  },
};

export const getProductDetailsTool: AIToolDefinition = {
  name: "getProductDetails",
  description: "Get complete clinical details, active ingredients, dosage form, warnings, and usage instructions for a specific medicine.",
  inputSchema: z.object({
    productSlugOrId: z.string().min(1),
  }),
  execute: async ({ productSlugOrId }) => {
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id: productSlugOrId }, { slug: productSlugOrId }],
      },
      include: {
        category: true,
        brand: true,
      },
    });

    if (!product) return { error: "Product not found" };

    return {
      id: product.id,
      name: product.name,
      price: product.price,
      dosageForm: product.dosageForm,
      strength: product.strength,
      activeIngredients: product.activeIngredients,
      usageInstructions: product.usageInstructions,
      sideEffects: product.sideEffects,
      warnings: product.warnings,
      contraindications: product.contraindications,
      requiresPrescription: product.requiresPrescription,
      inStock: product.stockQuantity > 0,
    };
  },
};

export const checkDrugInteractionTool: AIToolDefinition = {
  name: "checkDrugInteraction",
  description: "Check potential drug-drug and drug-food interactions between two or more medications.",
  inputSchema: z.object({
    drugs: z.array(z.string().min(1)).min(2),
  }),
  execute: async ({ drugs }) => {
    const interactions = await prisma.medicineInteraction.findMany({
      include: {
        productA: { select: { name: true } },
        productB: { select: { name: true } },
      },
    });

    const matches = interactions.filter((i) => {
      const nameA = i.productA.name.toLowerCase();
      const nameB = i.productB.name.toLowerCase();
      return drugs.some((d: string) => nameA.includes(d.toLowerCase())) && drugs.some((d: string) => nameB.includes(d.toLowerCase()));
    });

    return {
      testedDrugs: drugs,
      hasInteraction: matches.length > 0,
      severity: matches.some((m) => m.description.toLowerCase().includes("severe")) ? "SEVERE" : matches.length > 0 ? "MODERATE" : "NONE",
      details: matches.map((m) => ({
        drugA: m.productA.name,
        drugB: m.productB.name,
        description: m.description,
        recommendation: m.recommendation || "Consult pharmacist before combining.",
      })),
    };
  },
};

export const findNearbyBranchesTool: AIToolDefinition = {
  name: "findNearbyBranches",
  description: "Find Jumarald Pharmacy branch locations, opening hours, contact numbers, and pickup availability.",
  inputSchema: z.object({
    cityOrRegion: z.string().optional(),
  }),
  execute: async ({ cityOrRegion }) => {
    const where: any = { isActive: true };
    if (cityOrRegion) {
      where.OR = [
        { city: { contains: cityOrRegion, mode: "insensitive" } },
        { region: { contains: cityOrRegion, mode: "insensitive" } },
        { name: { contains: cityOrRegion, mode: "insensitive" } },
      ];
    }

    const branches = await prisma.branch.findMany({
      where,
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        phone: true,
        operatingHours: true,
      },
    });

    return { branches };
  },
};

export const getUserOrdersTool: AIToolDefinition = {
  name: "getUserOrders",
  description: "Retrieve recent order history and order tracking status for an authenticated patient.",
  inputSchema: z.object({}),
  execute: async (_, context) => {
    if (!context?.userId) {
      return { error: "Authentication required to view orders" };
    }

    const orders = await prisma.order.findMany({
      where: { userId: context.userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        orderItems: { select: { quantity: true, unitPrice: true, product: { select: { name: true } } } },
        deliveryTracking: { select: { status: true } },
      },
    });

    return {
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        totalAmount: o.totalAmount,
        createdAt: o.createdAt,
        estimatedDelivery: o.estimatedDelivery,
        deliveryStatus: o.deliveryTracking?.status || "PREPARING",
        itemCount: o.orderItems.length,
      })),
    };
  },
};

export const createPharmacistConsultationTool: AIToolDefinition = {
  name: "createPharmacistConsultation",
  description: "Escalate a high-risk symptom, complex interaction, or patient request directly to a licensed Jumarald Pharmacist.",
  inputSchema: z.object({
    reason: z.string().min(3),
    severity: z.enum(["LOW", "MODERATE", "HIGH", "EMERGENCY"]),
    summary: z.string().min(5),
  }),
  execute: async ({ reason, severity, summary }, context) => {
    const conversation = await (prisma as any).aIConversation.create({
      data: {
        userId: context?.userId || null,
        title: `Escalated: ${reason.slice(0, 30)}`,
      },
    });

    const escalation = await (prisma as any).aIEscalation.create({
      data: {
        conversationId: conversation.id,
        userId: context?.userId || null,
        reason,
        severity,
        summary,
        status: "OPEN",
      },
    });

    return {
      status: "ESCALATED",
      escalationId: escalation.id,
      message: "Your situation has been escalated to our Superintendent Pharmacist on duty. A clinical pharmacist will review your case immediately.",
    };
  },
};

export const ALL_AI_TOOLS: Record<string, AIToolDefinition> = {
  searchProducts: searchProductsTool,
  getProductDetails: getProductDetailsTool,
  checkDrugInteraction: checkDrugInteractionTool,
  findNearbyBranches: findNearbyBranchesTool,
  getUserOrders: getUserOrdersTool,
  createPharmacistConsultation: createPharmacistConsultationTool,
};
