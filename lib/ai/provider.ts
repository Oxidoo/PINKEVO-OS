import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

const anthropicKey = process.env.ANTHROPIC_API_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

const anthropic = anthropicKey ? createAnthropic({ apiKey: anthropicKey }) : null;
const openai = openaiKey ? createOpenAI({ apiKey: openaiKey }) : null;

/** True when at least one LLM provider key is configured. */
export function hasLlm(): boolean {
  return Boolean(anthropic || openai);
}

/**
 * Resolve a model id to a LanguageModel. Anthropic model ids start with
 * "claude", otherwise we route to OpenAI. Returns null when no provider key
 * is set (callers then fall back to deterministic mock output).
 */
export function resolveModel(modelId: string): LanguageModel | null {
  if (modelId.startsWith("claude") && anthropic) return anthropic(modelId);
  if (openai) return openai(modelId.startsWith("claude") ? "gpt-4o-mini" : modelId);
  if (anthropic) return anthropic("claude-haiku-4-5");
  return null;
}
