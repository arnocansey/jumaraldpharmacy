import { z } from "zod";
import { getAIProvider } from "./providers/provider-factory";
import { ALL_AI_TOOLS } from "./tools/tool-registry";
import { prisma } from "../../lib/prisma";
import { AISafetyRiskLevel } from "@prisma/client";

export const intentClassificationSchema = z.object({
  intent: z.enum([
    "PRODUCT_SEARCH",
    "PRODUCT_COMPARISON",
    "MEDICINE_INFORMATION",
    "SYMPTOM_INFORMATION",
    "DRUG_INTERACTION",
    "PRESCRIPTION_ANALYSIS",
    "ORDER_STATUS",
    "DELIVERY_TRACKING",
    "BRANCH_SEARCH",
    "LOYALTY",
    "PHARMACIST_CONSULTATION",
    "GENERAL_HEALTH",
    "EMERGENCY",
    "UNSAFE_REQUEST",
  ]),
  confidence: z.number().min(0).max(1),
  riskLevel: z.enum(["LOW", "MODERATE", "HIGH", "EMERGENCY"]),
  requiresTool: z.boolean(),
  suggestedToolName: z.string().optional(),
  emergencyDetected: z.boolean(),
  summary: z.string(),
});

export type IntentClassification = z.infer<typeof intentClassificationSchema>;

export interface ProcessChatMessageInput {
  conversationId?: string;
  userId?: string;
  userMessage: string;
  channel?: "WEB_WIDGET" | "WEB_FULLSCREEN" | "MOBILE_APP" | "PHARMACIST_COPILOT";
}

export interface ProcessChatMessageOutput {
  conversationId: string;
  reply: string;
  intent: string;
  riskLevel: AISafetyRiskLevel;
  executedTools: Array<{ name: string; output: any }>;
  isEscalated: boolean;
  escalationId?: string;
}

export class AIOrchestrator {
  private provider = getAIProvider();

  async classifyIntent(message: string): Promise<IntentClassification> {
    const prompt = `Classify the patient's intent and assess safety risk level for this pharmacy query: "${message}"`;

    const schemaDescription = `{
  "intent": "PRODUCT_SEARCH" | "PRODUCT_COMPARISON" | "MEDICINE_INFORMATION" | "SYMPTOM_INFORMATION" | "DRUG_INTERACTION" | "PRESCRIPTION_ANALYSIS" | "ORDER_STATUS" | "DELIVERY_TRACKING" | "BRANCH_SEARCH" | "LOYALTY" | "PHARMACIST_CONSULTATION" | "GENERAL_HEALTH" | "EMERGENCY" | "UNSAFE_REQUEST",
  "confidence": number (0 to 1),
  "riskLevel": "LOW" | "MODERATE" | "HIGH" | "EMERGENCY",
  "requiresTool": boolean,
  "suggestedToolName": string or null (e.g. "searchProducts", "checkDrugInteraction", "getUserOrders", "findNearbyBranches"),
  "emergencyDetected": boolean (true if chest pain, severe dyspnea, anaphylaxis, stroke symptoms),
  "summary": "Brief 1-sentence classification summary"
}`;

    try {
      const res = await this.provider.generateStructuredJSON<IntentClassification>(
        prompt,
        schemaDescription,
        {
          systemPrompt: "You are the Jumarald Clinical Safety & Intent Classifier. Assess patient risk objectively.",
        }
      );
      return intentClassificationSchema.parse(res.data);
    } catch {
      // Fallback Classification
      const lower = message.toLowerCase();
      const isEmergency = lower.includes("chest pain") || lower.includes("shortness of breath") || lower.includes("anaphylaxis");
      const isProduct = lower.includes("buy") || lower.includes("price") || lower.includes("cost") || lower.includes("medicine for");
      const isInteraction = lower.includes("interact") || lower.includes("take together");
      const isOrder = lower.includes("order") || lower.includes("where is my package");

      return {
        intent: isEmergency ? "EMERGENCY" : isInteraction ? "DRUG_INTERACTION" : isProduct ? "PRODUCT_SEARCH" : isOrder ? "ORDER_STATUS" : "GENERAL_HEALTH",
        confidence: 0.85,
        riskLevel: isEmergency ? "EMERGENCY" : isInteraction ? "MODERATE" : "LOW",
        requiresTool: isProduct || isInteraction || isOrder,
        suggestedToolName: isInteraction ? "checkDrugInteraction" : isProduct ? "searchProducts" : isOrder ? "getUserOrders" : undefined,
        emergencyDetected: isEmergency,
        summary: "Fallback classification executed",
      };
    }
  }

  async processMessage({
    conversationId: existingConvId,
    userId,
    userMessage,
    channel = "WEB_WIDGET",
  }: ProcessChatMessageInput): Promise<ProcessChatMessageOutput> {
    // 1. Fetch or Create Conversation Session
    let convId = existingConvId;
    if (!convId) {
      const conv = await prisma.aIConversation.create({
        data: {
          userId: userId || null,
          channel,
          title: userMessage.slice(0, 40),
        },
      });
      convId = conv.id;
    }

    // 2. Classify Intent & Evaluate Safety Risk
    const classification = await this.classifyIntent(userMessage);

    // Save User Message
    const userMsgRecord = await prisma.aIMessage.create({
      data: {
        conversationId: convId,
        role: "user",
        content: userMessage,
        intent: classification.intent,
        riskLevel: classification.riskLevel as AISafetyRiskLevel,
      },
    });

    // 3. Handle Emergency / High Risk Escalation First
    if (classification.emergencyDetected || classification.riskLevel === "EMERGENCY") {
      const escalation = await prisma.aIEscalation.create({
        data: {
          conversationId: convId,
          userId: userId || null,
          reason: "Emergency symptoms detected by Safety Layer",
          severity: "EMERGENCY",
          summary: `Patient reported emergency symptoms: "${userMessage}"`,
          status: "OPEN",
        },
      });

      await prisma.aISafetyEvent.create({
        data: {
          conversationId: convId,
          userId: userId || null,
          eventCategory: "EMERGENCY_SYMPTOM",
          inputSnippet: userMessage,
          riskLevel: "EMERGENCY",
          actionTaken: "ESCALATED",
        },
      });

      const reply = "⚠️ EMERGENCY WARNING: If you are experiencing severe chest pain, extreme difficulty breathing, or acute numbness, please call emergency medical services immediately (112 or 193 in Ghana) or visit the nearest emergency room.\n\nOur Superintendent Pharmacist has been alerted to review your situation.";

      await prisma.aIMessage.create({
        data: {
          conversationId: convId,
          role: "assistant",
          content: reply,
          intent: "EMERGENCY",
          riskLevel: "EMERGENCY",
        },
      });

      return {
        conversationId: convId,
        reply,
        intent: classification.intent,
        riskLevel: "EMERGENCY",
        executedTools: [],
        isEscalated: true,
        escalationId: escalation.id,
      };
    }

    // 4. Tool Execution Phase
    const executedTools: Array<{ name: string; output: any }> = [];

    if (classification.requiresTool && classification.suggestedToolName) {
      const tool = ALL_AI_TOOLS[classification.suggestedToolName];
      if (tool) {
        try {
          const startTime = Date.now();
          let toolInput: any = {};

          if (tool.name === "searchProducts") {
            const cleaned = userMessage
              .replace(/^(do you have|can i get|i want|i need|looking for|buy|search for|show me|is there|any)\s+/i, "")
              .replace(/\s+(available|in stock|here|please)\??$/i, "")
              .trim();
            toolInput = { query: cleaned || userMessage };
          } else if (tool.name === "checkDrugInteraction") {
            const words = userMessage.split(/[, and&]+/).filter((w) => w.length > 2);
            toolInput = { drugs: words.length >= 2 ? words : ["Paracetamol", "Ibuprofen"] };
          }

          const toolOutput = await tool.execute(toolInput, { userId });
          const duration = Date.now() - startTime;

          executedTools.push({ name: tool.name, output: toolOutput });

          await prisma.aIToolCall.create({
            data: {
              messageId: userMsgRecord.id,
              toolName: tool.name,
              inputJson: JSON.stringify(toolInput),
              outputJson: JSON.stringify(toolOutput),
              executionTimeMs: duration,
              status: "SUCCESS",
            },
          });
        } catch (toolErr: any) {
          console.error(`Tool execution failed for ${tool.name}:`, toolErr);
        }
      }
    }

    // 5. Generate Grounded AI Response
    const historyMessages = await prisma.aIMessage.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: "asc" },
      take: 10,
    });

    const formattedHistory = historyMessages.map((m) => ({
      role: (m.role === "assistant" ? "assistant" : "user") as "assistant" | "user",
      content: m.content,
    }));

    const systemPrompt = `You are "Dr. Jumarald AI", the Superintendent Clinical Pharmacy Assistant for Jumarald Pharmacy & Wellness in Ghana.

Core Philosophy:
AI assists. Licensed Pharmacists decide.

Executed Tool Data Context:
${executedTools.length > 0 ? JSON.stringify(executedTools, null, 2) : "No tool execution required."}

Guidelines:
1. Identify as Dr. Jumarald AI, your virtual Superintendent Clinical Pharmacy Assistant.
2. Be helpful, clear, empathetic, and clinically precise.
3. Format output cleanly in plain readable text. DO NOT use markdown headers (such as ## or ###), hash characters, or raw markdown syntax.
4. Use simple bullet points (•) or numbered lists for recommendations.
5. If tool data returned products, mention them with prices in GHS and stock availability.
6. For high-risk symptoms or direct prescription queries, provide clear safety advice and offer escalation to our human Superintendent Pharmacist on duty.`;

    const response = await this.provider.generateText(formattedHistory, {
      systemPrompt,
      temperature: 0.7,
    });

    // 6. Save Assistant Response
    await prisma.aIMessage.create({
      data: {
        conversationId: convId,
        role: "assistant",
        content: response.text,
        intent: classification.intent,
        riskLevel: classification.riskLevel as AISafetyRiskLevel,
        toolCallsJson: executedTools.length > 0 ? JSON.stringify(executedTools) : null,
      },
    });

    return {
      conversationId: convId,
      reply: response.text,
      intent: classification.intent,
      riskLevel: classification.riskLevel as AISafetyRiskLevel,
      executedTools,
      isEscalated: false,
    };
  }
}

export const orchestrator = new AIOrchestrator();
