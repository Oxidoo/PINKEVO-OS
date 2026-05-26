import { generateObject } from "ai";
import type { z } from "zod";
import { resolveModel } from "../provider";

export interface LlmJsonResult<T> {
  data: T;
  tokensInput: number;
  tokensOutput: number;
}

/**
 * Structured LLM call. Throws `LlmUnavailableError` from provider.ts when the
 * required API key is missing — the executor catches it and marks the run as
 * failed with the message. No silent mock fallback : results are always real.
 */
export async function llmJson<T>(args: {
  model: string;
  schema: z.ZodType<T>;
  system: string;
  prompt: string;
}): Promise<LlmJsonResult<T>> {
  const model = resolveModel(args.model);
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
  return { data: object, tokensInput: inputTokens, tokensOutput: outputTokens };
}
