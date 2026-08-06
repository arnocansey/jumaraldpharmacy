import { prisma } from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/auth";
import { Response } from "express";
import { z } from "zod";

const createInteractionSchema = z.object({
  productAId: z.string(),
  productBId: z.string(),
  severity: z.enum(["MINOR", "MODERATE", "MAJOR", "CRITICAL"]),
  description: z.string().min(1),
  recommendation: z.string().optional(),
  reference: z.string().optional(),
});

const checkInteractionsSchema = z.object({
  productIds: z.array(z.string()).min(2),
});

export async function checkInteractions(req: any, res: Response) {
  try {
    const data = checkInteractionsSchema.parse(req.body);

    const interactions = await prisma.medicineInteraction.findMany({
      where: {
        isActive: true,
        OR: [
          { productAId: { in: data.productIds }, productBId: { in: data.productIds } },
          { productBId: { in: data.productIds }, productAId: { in: data.productIds } },
        ],
      },
      include: {
        productA: { select: { id: true, name: true, activeIngredients: true } },
        productB: { select: { id: true, name: true, activeIngredients: true } },
      },
    });

    const severityOrder = { CRITICAL: 0, MAJOR: 1, MODERATE: 2, MINOR: 3 };
    interactions.sort((a, b) => (severityOrder[a.severity as keyof typeof severityOrder] || 4) - (severityOrder[b.severity as keyof typeof severityOrder] || 4));

    const hasCritical = interactions.some((i) => i.severity === "CRITICAL");
    const hasMajor = interactions.some((i) => i.severity === "MAJOR");

    return res.json({
      interactions,
      riskLevel: hasCritical ? "CRITICAL" : hasMajor ? "HIGH" : interactions.length > 0 ? "MODERATE" : "LOW",
      interactionCount: interactions.length,
      recommendation: hasCritical
        ? "STOP: Critical interactions detected. Consult a pharmacist immediately."
        : hasMajor
        ? "CAUTION: Major interactions found. Pharmacist consultation recommended."
        : interactions.length > 0
        ? "Minor interactions detected. Monitor for side effects."
        : "No known interactions found between selected medicines.",
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid input", errors: error.errors });
    return res.status(500).json({ message: "Failed to check interactions" });
  }
}

export async function createInteraction(req: AuthenticatedRequest, res: Response) {
  try {
    const data = createInteractionSchema.parse(req.body);

    if (data.productAId === data.productBId) {
      return res.status(400).json({ message: "Cannot create interaction with the same product" });
    }

    const existing = await prisma.medicineInteraction.findFirst({
      where: {
        OR: [
          { productAId: data.productAId, productBId: data.productBId },
          { productAId: data.productBId, productBId: data.productAId },
        ],
      },
    });

    if (existing) return res.status(400).json({ message: "Interaction already exists" });

    const interaction = await prisma.medicineInteraction.create({
      data,
      include: {
        productA: { select: { name: true } },
        productB: { select: { name: true } },
      },
    });

    return res.status(201).json(interaction);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid input", errors: error.errors });
    return res.status(500).json({ message: "Failed to create interaction" });
  }
}

export async function updateInteraction(req: AuthenticatedRequest, res: Response) {
  try {
    const data = createInteractionSchema.partial().parse(req.body);
    const interaction = await prisma.medicineInteraction.update({
      where: { id: req.params.id },
      data,
    });
    return res.json(interaction);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid input", errors: error.errors });
    return res.status(500).json({ message: "Failed to update interaction" });
  }
}

export async function deleteInteraction(req: AuthenticatedRequest, res: Response) {
  try {
    await prisma.medicineInteraction.delete({ where: { id: req.params.id } });
    return res.json({ message: "Interaction deleted" });
  } catch {
    return res.status(500).json({ message: "Failed to delete interaction" });
  }
}

export async function getProductInteractions(req: any, res: Response) {
  try {
    const interactions = await prisma.medicineInteraction.findMany({
      where: {
        isActive: true,
        OR: [{ productAId: req.params.productId }, { productBId: req.params.productId }],
      },
      include: {
        productA: { select: { id: true, name: true, activeIngredients: true } },
        productB: { select: { id: true, name: true, activeIngredients: true } },
      },
    });
    return res.json(interactions);
  } catch {
    return res.status(500).json({ message: "Failed to fetch interactions" });
  }
}

export async function getAllInteractions(req: any, res: Response) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const severity = req.query.severity as string | undefined;

    const where: any = {};
    if (severity) where.severity = severity;

    const [interactions, total] = await Promise.all([
      prisma.medicineInteraction.findMany({
        where,
        include: {
          productA: { select: { id: true, name: true } },
          productB: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.medicineInteraction.count({ where }),
    ]);

    return res.json({ interactions, pagination: { total, page, pages: Math.ceil(total / limit) } });
  } catch {
    return res.status(500).json({ message: "Failed to fetch interactions" });
  }
}

export async function importInteractions(req: AuthenticatedRequest, res: Response) {
  try {
    const { interactions } = req.body;
    if (!Array.isArray(interactions)) return res.status(400).json({ message: "interactions array required" });

    let imported = 0;
    for (const item of interactions) {
      try {
        await prisma.medicineInteraction.create({ data: item });
        imported++;
      } catch {}
    }

    return res.json({ message: `Imported ${imported} of ${interactions.length} interactions` });
  } catch {
    return res.status(500).json({ message: "Failed to import interactions" });
  }
}
