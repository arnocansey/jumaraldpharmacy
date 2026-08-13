import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIProvider, ChatCompletionOptions, ChatMessageInput, StructuredCompletionResult } from "./ai-provider.interface";

export class GeminiProvider implements AIProvider {
  public name = "GeminiProvider";
  private genAI: GoogleGenerativeAI | null = null;
  private defaultModel = "gemini-1.5-flash";

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY;
    if (key) {
      this.genAI = new GoogleGenerativeAI(key);
    }
  }

  async generateText(
    messages: ChatMessageInput[],
    options?: ChatCompletionOptions
  ): Promise<{ text: string; usage?: any }> {
    if (!this.genAI) {
      throw new Error("Gemini API key is not configured");
    }

    const modelName = options?.model || this.defaultModel;
    const model = this.genAI.getGenerativeModel({ model: modelName });

    const systemPrompt = options?.systemPrompt ? `[SYSTEM INSTRUCTION]\n${options.systemPrompt}\n\n` : "";
    const conversation = messages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n");

    const prompt = `${systemPrompt}${conversation}\nASSISTANT:`;
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return { text };
  }

  async generateStructuredJSON<T = any>(
    prompt: string,
    schemaDescription: string,
    options?: ChatCompletionOptions
  ): Promise<StructuredCompletionResult<T>> {
    if (!this.genAI) {
      throw new Error("Gemini API key is not configured");
    }

    const modelName = options?.model || this.defaultModel;
    const model = this.genAI.getGenerativeModel({ model: modelName });

    const fullPrompt = `${options?.systemPrompt || ""}\n\nTask: ${prompt}\n\nExpected Output Format Schema:\n${schemaDescription}\n\nIMPORTANT: Return ONLY valid JSON wrapped in no extra text or markdown formatting.`;

    const result = await model.generateContent(fullPrompt);
    const rawText = result.response.text().replace(/```json|```/g, "").trim();

    try {
      const data = JSON.parse(rawText) as T;
      return { data, rawText };
    } catch (err: any) {
      throw new Error(`Failed to parse structured JSON response from Gemini: ${err.message}. Raw text was: ${rawText}`);
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.genAI) {
      // Fallback deterministic pseudo-embedding
      return new Array(1536).fill(0).map((_, i) => (text.charCodeAt(i % text.length) || 0) / 255);
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: "embedding-001" });
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch {
      return new Array(1536).fill(0).map((_, i) => (text.charCodeAt(i % text.length) || 0) / 255);
    }
  }
}
