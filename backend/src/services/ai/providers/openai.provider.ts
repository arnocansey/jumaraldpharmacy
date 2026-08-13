import { AIProvider, ChatCompletionOptions, ChatMessageInput, StructuredCompletionResult } from "./ai-provider.interface";

export class OpenAIProvider implements AIProvider {
  public name = "OpenAIProvider";
  private apiKey: string;
  private defaultModel = "gpt-4o-mini";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || "";
  }

  async generateText(
    messages: ChatMessageInput[],
    options?: ChatCompletionOptions
  ): Promise<{ text: string; usage?: any }> {
    if (!this.apiKey) {
      throw new Error("OpenAI API key is not configured");
    }

    const payloadMessages: any[] = [];
    if (options?.systemPrompt) {
      payloadMessages.push({ role: "system", content: options.systemPrompt });
    }
    messages.forEach((m) => {
      payloadMessages.push({ role: m.role === "assistant" ? "assistant" : "user", content: m.content });
    });

    const fetchFn = (globalThis as any).fetch;
    const res = await fetchFn("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model || this.defaultModel,
        messages: payloadMessages,
        temperature: options?.temperature ?? 0.7,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || "OpenAI API request failed");
    }

    return {
      text: data.choices[0]?.message?.content || "",
      usage: data.usage,
    };
  }

  async generateStructuredJSON<T = any>(
    prompt: string,
    schemaDescription: string,
    options?: ChatCompletionOptions
  ): Promise<StructuredCompletionResult<T>> {
    if (!this.apiKey) {
      throw new Error("OpenAI API key is not configured");
    }

    const systemPrompt = `${options?.systemPrompt || ""}\n\nYou are a structured JSON generator. Return ONLY valid JSON conforming to the requested schema.\nSchema:\n${schemaDescription}`;

    const fetchFn = (globalThis as any).fetch;
    const res = await fetchFn("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model || this.defaultModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || "OpenAI structured completion failed");
    }

    const rawText = data.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(rawText) as T;

    return {
      data: parsed,
      rawText,
      usage: data.usage,
    };
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.apiKey) {
      return new Array(1536).fill(0).map((_, i) => (text.charCodeAt(i % text.length) || 0) / 255);
    }

    const fetchFn = (globalThis as any).fetch;
    const res = await fetchFn("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return new Array(1536).fill(0).map((_, i) => (text.charCodeAt(i % text.length) || 0) / 255);
    }

    return data.data[0]?.embedding || [];
  }
}
