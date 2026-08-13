import { Request, Response } from "express";
import { z } from "zod";
import {
  consultHealthAssistant,
  analyzeDrugInteractions,
  explainPrescription,
  getInStockProducts,
} from "../services/ai.service";

const consultSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "model", "system"]),
      content: z.string().min(1),
    })
  ).min(1),
  userContext: z
    .object({
      name: z.string().optional(),
      age: z.number().optional(),
      medicalHistory: z.string().optional(),
    })
    .optional(),
});

const interactionSchema = z.object({
  drugs: z.array(z.string().min(1)).min(2, "Provide at least 2 medications to analyze interactions"),
});

const explainSchema = z.object({
  prescriptionText: z.string().min(3, "Prescription text is required"),
});

export async function handleAIConsult(req: Request, res: Response) {
  try {
    const { messages, userContext } = consultSchema.parse(req.body);
    const result = await consultHealthAssistant(messages, userContext);
    return res.json({
      status: "success",
      reply: result.reply,
      triage: result.triage,
      recommendedProducts: result.recommendedProducts || [],
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid chat payload", errors: err.errors });
    }
    return res.status(500).json({ message: "AI consultation failed: " + (err.message || "") });
  }
}

export async function handleCheckInteractions(req: Request, res: Response) {
  try {
    const { drugs } = interactionSchema.parse(req.body);
    const result = await analyzeDrugInteractions(drugs);
    return res.json({
      status: "success",
      ...result,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid interaction request", errors: err.errors });
    }
    return res.status(500).json({ message: "Interaction analysis failed: " + (err.message || "") });
  }
}

export async function handleExplainPrescription(req: Request, res: Response) {
  try {
    const { prescriptionText } = explainSchema.parse(req.body);
    const result = await explainPrescription(prescriptionText);
    return res.json({
      status: "success",
      ...result,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid prescription payload", errors: err.errors });
    }
    return res.status(500).json({ message: "Prescription breakdown failed: " + (err.message || "") });
  }
}

export async function handleGetRecommendations(_req: Request, res: Response) {
  try {
    const products = await getInStockProducts();
    return res.json({
      status: "success",
      products: products.slice(0, 10),
    });
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to fetch AI recommendations" });
  }
}
