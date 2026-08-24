//planneragent/core/src/sandbox/llm/llmcontracts

export type PlanTier = "VISION" | "BASIC" | "JUNIOR" | "SENIOR";

export type IntelligenceMode = "EFFICIENT";
export type InferenceSource = "FREE";
export type LlmEconomicClass = "paid" | "free" | "oss";

export type LlmCostType =
  | "paid"        // OpenAI, Anthropic, Mistral paid
  | "openrouter"  // routed (paid or free)
  | "oss"         // fully open source / free
  | "mock";

export interface LlmProviderCandidate {
  /** provider id, es: openai, mistral, openrouter */
  id: string;

  /** exact model selected with this provider */
  model?: string;

  /** plan that is allowed to use it */
  allowedFor: PlanTier[];

  /** priority: lower = tried first */
  priority: number;

  /** cost category */
  costType: LlmCostType;

  /** explicit provider + model economics; never inferred from remaining budget */
  economicClass?: LlmEconomicClass;

  /** estimated cost per call (EUR) */
  estimatedCostEur: number;

  /** whether it is a fallback provider */
  fallback?: boolean;
}
