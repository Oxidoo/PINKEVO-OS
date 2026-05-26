import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

const anthropicKey = process.env.ANTHROPIC_API_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

const anthropic = anthropicKey ? createAnthropic({ apiKey: anthropicKey }) : null;
const openai = openaiKey ? createOpenAI({ apiKey: openaiKey }) : null;

/** Thrown when the requested model's provider key is not configured. */
export class LlmUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LlmUnavailableError";
  }
}

/** True when at least one LLM provider key is configured. */
export function hasLlm(): boolean {
  return Boolean(anthropic || openai);
}

/** Which providers are actually wired up — for surfacing in admin UI. */
export function availableProviders(): { anthropic: boolean; openai: boolean } {
  return { anthropic: Boolean(anthropic), openai: Boolean(openai) };
}

/**
 * Resolve a model id to a LanguageModel. Anthropic model ids start with
 * "claude", otherwise we route to OpenAI. Throws `LlmUnavailableError` when
 * the provider key for the requested model is missing — callers must let
 * the error bubble up so the run is marked as failed with a clear message
 * (no silent mock fallback).
 */
export function resolveModel(modelId: string): LanguageModel {
  const isClaude = modelId.startsWith("claude");
  if (isClaude) {
    if (!anthropic) {
      throw new LlmUnavailableError(
        `Modèle ${modelId} : ANTHROPIC_API_KEY manquante dans les variables d'environnement.`,
      );
    }
    return anthropic(modelId);
  }
  if (!openai) {
    throw new LlmUnavailableError(
      `Modèle ${modelId} : OPENAI_API_KEY manquante dans les variables d'environnement.`,
    );
  }
  return openai(modelId);
}
