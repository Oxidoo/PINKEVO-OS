/** USD per 1M tokens. Approximate public pricing — adjust as needed. */
const PRICING: Record<string, { input: number; output: number }> = {
  "claude-opus-4-5": { input: 15, output: 75 },
  "claude-haiku-4-5": { input: 1, output: 5 },
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
};

const FALLBACK = { input: 3, output: 15 };

export function computeCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  const p = PRICING[model] ?? FALLBACK;
  const cost = (inputTokens / 1_000_000) * p.input + (outputTokens / 1_000_000) * p.output;
  return Math.round(cost * 1_000_000) / 1_000_000;
}

export function providerForModel(model: string): "anthropic" | "openai" {
  return model.startsWith("claude") ? "anthropic" : "openai";
}
