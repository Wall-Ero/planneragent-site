/**
 * LLM Types — Canonical v1
 *
 * Scope:
 * - Pure interface between PlannerAgent and any language model
 * - No budget, no governance, no policy, no cost logic
 * - Providers are "dumb executors"
 */

/* ===============================
 * Scenario Output
 * =============================== */

export type LlmScenario = {
  label: string;
  assumptions?: string[];
  proposed_actions?: {
    action_type: string;
    target?: string;
    quantity?: number;
    meta?: Record<string, unknown>;
  }[];
  expected_effects?: Record<string, number>;
  confidence?: number; // 0..1 advisory
};

/* ===============================
 * Usage Metadata (optional)
 * =============================== */

export type LlmUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  model?: string; // es. gpt-4o-mini, mistral-7b, claude-3.5
};

/* ===============================
 * Provider Result
 * =============================== */

export type LlmProviderResult = {
  scenarios: LlmScenario[];
  model?:string,
  usage?: LlmUsage;
};

/* ===============================
 * Provider Interface
 * =============================== */

export interface LlmProvider {
  /** unique id, e.g. "openai", "openrouter", "anthropic", "mistral", "oss", "mock" */
  id: string;

  /** true if this provider has zero marginal cost */
  isFree: boolean;

  /** relative quality signal (used for ordering / fallback) */
  quality: "low" | "medium" | "high";

  generateScenarios(input: {
    domain: string;
    intent: string;
    baseline: unknown;
  }): Promise<LlmProviderResult>;
}