export interface ModelOption {
  id: string;
  label: string;
  provider: "anthropic" | "openai" | "google";
  tagline: string;
  /** Marqué « free » quand le modèle est utilisable avec le free tier du provider. */
  free?: boolean;
}

/**
 * Modèles LLM exposés à l'UI. Chaque ID doit être accepté tel quel par
 * `@ai-sdk/anthropic`, `@ai-sdk/openai` ou `@ai-sdk/google`. Tout ID hors
 * de cette liste est rejeté côté serveur (cf. `isSupportedModel`).
 */
export const SUPPORTED_MODELS: readonly ModelOption[] = [
  {
    id: "gemini-2.0-flash",
    label: "Gemini 2.0 Flash",
    provider: "google",
    tagline: "Google · 1 500 req/jour gratuites · Rapide & polyvalent",
    free: true,
  },
  {
    id: "gemini-1.5-pro",
    label: "Gemini 1.5 Pro",
    provider: "google",
    tagline: "Google · 50 req/jour gratuites · Top qualité",
    free: true,
  },
  {
    id: "gemini-1.5-flash",
    label: "Gemini 1.5 Flash",
    provider: "google",
    tagline: "Google · 1 500 req/jour gratuites · Légèrement plus ancien",
    free: true,
  },
  {
    id: "claude-opus-4-5",
    label: "Claude Opus 4.5",
    provider: "anthropic",
    tagline: "Anthropic · Payant · Qualité max",
  },
  {
    id: "claude-sonnet-4-5",
    label: "Claude Sonnet 4.5",
    provider: "anthropic",
    tagline: "Anthropic · Payant · Bon équilibre",
  },
  {
    id: "claude-haiku-4-5",
    label: "Claude Haiku 4.5",
    provider: "anthropic",
    tagline: "Anthropic · Payant · Rapide & économique",
  },
  {
    id: "gpt-4o",
    label: "GPT-4o",
    provider: "openai",
    tagline: "OpenAI · Payant · Polyvalent",
  },
  {
    id: "gpt-4o-mini",
    label: "GPT-4o mini",
    provider: "openai",
    tagline: "OpenAI · Payant · Économique",
  },
] as const;

/** Modèle par défaut suggéré (utilisé pour les nouveaux agents). */
export const DEFAULT_MODEL_ID = "gemini-2.0-flash";

export function isSupportedModel(id: string): boolean {
  return SUPPORTED_MODELS.some((m) => m.id === id);
}

export function getModelOption(id: string): ModelOption | undefined {
  return SUPPORTED_MODELS.find((m) => m.id === id);
}
