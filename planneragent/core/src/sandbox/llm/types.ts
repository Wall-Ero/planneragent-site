export type LlmScenario = {
  label: string;
  assumptions?: string[];
  proposed_actions?: any[];
  expected_effects?: any;
};

export type LlmProviderResult = {
  scenarios: LlmScenario[];
};

/**
 * A single LLM provider implementation.
 * The provider does NOT know about budget, plans, or tiers.
 */
export interface LlmProvider {
  /** unique id, e.g. "openai", "openrouter", "mistral-open" */
  id: string;

  /** true if this provider has zero marginal cost */
  isFree: boolean;

  /** relative quality signal (used for ordering) */
  quality: "low" | "medium" | "high";

  generateScenarios(input: {
    domain: string;
    intent: string;
    baseline: unknown;
  }): Promise<LlmProviderResult>;
}