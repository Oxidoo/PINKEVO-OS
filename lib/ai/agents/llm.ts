import { generateObject } from "ai";
import type { z } from "zod";
import { resolveModel } from "../provider";

export interface LlmJsonResult<T> {
  data: T;
  tokensInput: number;
  tokensOutput: number;
  mock: boolean;
}

/**
 * Structured LLM call with graceful fallback. When no provider key is set,
 * `mockData` is returned with zero token usage so agent flows stay testable.
 */
export async function llmJson<T>(args: {
  model: string;
  schema: z.ZodType<T>;
  system: string;
  prompt: string;
  mockData: T;
}): Promise<LlmJsonResult<T>> {
  const model = resolveModel(args.model);
  if (!model) {
    return { data: args.mockData, tokensInput: 0, tokensOutput: 0, mock: true };
  }
  const { object, usage } = await generateObject({
    model,
    schema: args.schema,
    system: args.system,
    prompt: args.prompt,
  });
  const inputTokens =
    (usage as { inputTokens?: number; promptTokens?: number }).inputTokens ??
    (usage as { promptTokens?: number }).promptTokens ??
    0;
  const outputTokens =
    (usage as { outputTokens?: number; completionTokens?: number }).outputTokens ??
    (usage as { completionTokens?: number }).completionTokens ??
    0;
  return { data: object, tokensInput: inputTokens, tokensOutput: outputTokens, mock: false };
}
