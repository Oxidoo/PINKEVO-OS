/** USD per 1M tokens. Approximate public pricing — adjust as needed. */
/**
 * USD per 1M tokens. Approximate public pricing for paid tiers. Gemini models
 * sont à 0 ici parce qu'on les utilise via le free tier (jusqu'aux quotas
 * journaliers ils ne facturent rien).
 */
const PRICING: Record<string, { input: number; output: number }> = {
  "claude-opus-4-5": { input: 15, output: 75 },
  "claude-sonnet-4-5": { input: 3, output: 15 },
  "claude-haiku-4-5": { input: 1, output: 5 },
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gemini-2.0-flash": { input: 0, output: 0 },
  "gemini-1.5-flash": { input: 0, output: 0 },
  "gemini-1.5-pro": { input: 0, output: 0 },
};

const FALLBACK = { input: 3, output: 15 };

export function computeCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  const p = PRICING[model] ?? FALLBACK;
  const cost = (inputTokens / 1_000_000) * p.input + (outputTokens / 1_000_000) * p.output;
  return Math.round(cost * 1_000_000) / 1_000_000;
}

export function providerForModel(model: string): "anthropic" | "openai" {
  // Note : la colonne `api_usage.provider` est un enum SQL qui n'a que
  // "anthropic" / "openai" / "elevenlabs" / "resend" / "psi" / "gsc". On
  // mappe Gemini sur "openai" en attendant l'ajout de "google" à l'enum.
  if (model.startsWith("claude")) return "anthropic";
  return "openai";
}
