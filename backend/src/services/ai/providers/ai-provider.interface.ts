export interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  tools?: any[];
}

export interface ChatMessageInput {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  name?: string;
}

export interface StructuredCompletionResult<T = any> {
  data: T;
  rawText: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
}

export interface AIProvider {
  name: string;

  generateText(
    messages: ChatMessageInput[],
    options?: ChatCompletionOptions
  ): Promise<{ text: string; usage?: any }>;

  generateStructuredJSON<T = any>(
    prompt: string,
    schemaDescription: string,
    options?: ChatCompletionOptions
  ): Promise<StructuredCompletionResult<T>>;

  generateEmbedding(text: string): Promise<number[]>;
}
