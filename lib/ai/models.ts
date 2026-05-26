export interface ModelOption {
  id: string;
  label: string;
  provider: "anthropic" | "openai";
  tagline: string;
}

/**
 * Modèles LLM exposés à l'UI. Chaque ID doit être accepté tel quel par
 * `@ai-sdk/anthropic` ou `@ai-sdk/openai`. Tout ID hors de cette liste est
 * rejeté côté serveur (cf. `isSupportedModel`).
 */
export const SUPPORTED_MODELS: readonly ModelOption[] = [
  {
    id: "claude-opus-4-5",
    label: "Claude Opus 4.5",
    provider: "anthropic",
    tagline: "Anthropic · Qualité max, plus lent et coûteux",
  },
  {
    id: "claude-sonnet-4-5",
    label: "Claude Sonnet 4.5",
    provider: "anthropic",
    tagline: "Anthropic · Bon équilibre qualité / coût",
  },
  {
    id: "claude-haiku-4-5",
    label: "Claude Haiku 4.5",
    provider: "anthropic",
    tagline: "Anthropic · Rapide & économique",
  },
  {
    id: "gpt-4o",
    label: "GPT-4o",
    provider: "openai",
    tagline: "OpenAI · Polyvalent",
  },
  {
    id: "gpt-4o-mini",
    label: "GPT-4o mini",
    provider: "openai",
    tagline: "OpenAI · Économique",
  },
] as const;

export function isSupportedModel(id: string): boolean {
  return SUPPORTED_MODELS.some((m) => m.id === id);
}

export function getModelOption(id: string): ModelOption | undefined {
  return SUPPORTED_MODELS.find((m) => m.id === id);
}
