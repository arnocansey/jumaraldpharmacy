import { Request, Response } from "express";
import { z } from "zod";
import {
  consultHealthAssistant,
  analyzeDrugInteractions,
  explainPrescription,
  getInStockProducts,
} from "../services/ai.service";
import { orchestrator } from "../services/ai/orchestrator.service";
import { ragService } from "../services/ai/rag/rag.service";
import { prisma } from "../lib/prisma";

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

const chatSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1, "Message is required"),
  channel: z.enum(["WEB_WIDGET", "WEB_FULLSCREEN", "MOBILE_APP", "PHARMACIST_COPILOT"]).optional(),
});

export async function handleOrchestratedChat(req: Request, res: Response) {
  try {
    const { conversationId, message, channel } = chatSchema.parse(req.body);
    const userId = (req as any).user?.id;

    const result = await orchestrator.processMessage({
      conversationId,
      userId,
      userMessage: message,
      channel,
    });

    return res.json({
      status: "success",
      ...result,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid chat payload", errors: err.errors });
    }
    return res.status(500).json({ message: "Chat orchestration failed: " + (err.message || "") });
  }
}

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

export async function handleIngestKnowledge(req: Request, res: Response) {
  try {
    const { title, source, category, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    const result = await ragService.ingestDocument({
      title,
      source: source || "Admin Upload",
      category,
      content,
      approvedBy: (req as any).user?.email || "Admin Pharmacist",
    });

    return res.json({
      status: "success",
      ...result,
    });
  } catch (err: any) {
    return res.status(500).json({ message: "Knowledge ingestion failed: " + err.message });
  }
}

export async function handleSearchKnowledge(req: Request, res: Response) {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ message: "Search query required" });

    const results = await ragService.searchKnowledge(String(query));
    return res.json({ status: "success", results });
  } catch (err: any) {
    return res.status(500).json({ message: "Knowledge search failed: " + err.message });
  }
}

export async function handleGetEscalations(_req: Request, res: Response) {
  try {
    const escalations = await prisma.aIEscalation.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        conversation: {
          include: {
            messages: { take: 5, orderBy: { createdAt: "desc" } },
          },
        },
      },
    });

    return res.json({ status: "success", escalations });
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to fetch escalations: " + err.message });
  }
}

export async function handleResolveEscalation(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { pharmacistNotes } = req.body;

    const escalation = await prisma.aIEscalation.update({
      where: { id },
      data: {
        status: "RESOLVED",
        pharmacistNotes,
        assignedPharmacistId: (req as any).user?.id || null,
      },
    });

    return res.json({ status: "success", escalation });
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to resolve escalation: " + err.message });
  }
}

export async function handleGetAIAnalytics(_req: Request, res: Response) {
  try {
    const [totalConversations, totalMessages, totalEscalations, safetyEvents] = await Promise.all([
      prisma.aIConversation.count(),
      prisma.aIMessage.count(),
      prisma.aIEscalation.count(),
      prisma.aISafetyEvent.count(),
    ]);

    return res.json({
      status: "success",
      analytics: {
        totalConversations,
        totalMessages,
        totalEscalations,
        safetyEvents,
        activeResolutionRate: totalConversations > 0 ? (((totalConversations - totalEscalations) / totalConversations) * 100).toFixed(1) + "%" : "100%",
      },
    });
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to fetch AI analytics: " + err.message });
  }
}
