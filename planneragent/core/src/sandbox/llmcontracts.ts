export type PlanTier = "BASIC" | "JUNIOR" | "SENIOR";

export type LlmCostType =
  | "paid"        // OpenAI, Anthropic, Mistral paid
  | "openrouter"  // routed (paid or free)
  | "oss"         // fully open source / free
  | "mock";

export interface LlmProviderCandidate {
  /** provider id, es: openai, mistral, openrouter */
  id: string;

  /** plan that is allowed to use it */
  allowedFor: PlanTier[];

  /** priority: lower = tried first */
  priority: number;

  /** cost category */
  costType: LlmCostType;

  /** estimated cost per call (EUR) */
  estimatedCostEur: number;

  /** whether it is a fallback provider */
  fallback?: boolean;
}