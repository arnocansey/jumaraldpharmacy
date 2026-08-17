import { AIProvider } from "./ai-provider.interface";
import { GeminiProvider } from "./gemini.provider";
import { OpenAIProvider } from "./openai.provider";

export function getAIProvider(preferredProvider?: string): AIProvider {
  const providerName = (preferredProvider || process.env.AI_PROVIDER || "").toLowerCase();

  if (providerName === "gemini" && process.env.GEMINI_API_KEY) {
    return new GeminiProvider();
  }

  if (process.env.OPENAI_API_KEY) {
    return new OpenAIProvider();
  }

  // Default to GeminiProvider
  return new GeminiProvider();
}
