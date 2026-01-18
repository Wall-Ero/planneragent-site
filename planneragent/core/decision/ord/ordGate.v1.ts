// planneragent/core/src/ord/ordGate.v1.ts

export type OrdLevel = "BASIC" | "JUNIOR" | "SENIOR";

export interface OrdGateInput {
  level: OrdLevel;
  contextType: "OBSERVATION" | "PROPOSAL" | "EXECUTION";
  anomalySeverity: "INFO" | "WARNING" | "CRITICAL";
  ambiguityScore: number;        // 0..1
  historicalPayoffScore: number; // 0..1
  actionProximity: number;       // 0..1
  urgency: number;               // 0..1
  llmCostEstimate: number;
  budgetRemaining: number;
}

export interface OrdGateResult {
  allowPaidLlm: boolean;
  recommendedTier: "OSS" | "PAID";
  reason: string;
}

/**
 * ORD Gate v1
 * Decides ONLY whether to spend for paid LLM.
 * Never blocks OSS or deterministic intelligence.
 */
export function ordGateV1(input: OrdGateInput): OrdGateResult {
  // BASIC: never spend on paid LLM
  if (input.level === "BASIC") {
    return {
      allowPaidLlm: false,
      recommendedTier: "OSS",
      reason: "BASIC level: paid LLM usage disabled by policy",
    };
  }

  // No budget → no spend
  if (input.budgetRemaining <= 0) {
    return {
      allowPaidLlm: false,
      recommendedTier: "OSS",
      reason: "No remaining budget for paid LLM",
    };
  }

  // Execution context almost always justifies clarity
  if (input.contextType === "EXECUTION") {
    return {
      allowPaidLlm: true,
      recommendedTier: "PAID",
      reason: "Execution context: clarity required before action",
    };
  }

  // Compute expected value (very simple v1)
  const expectedValue =
    (input.ambiguityScore * 0.4) +
    (input.historicalPayoffScore * 0.3) +
    (input.actionProximity * 0.2) +
    (input.urgency * 0.1);

  // Cost sensitivity (cheap calls easier to justify)
  const costFactor =
    input.llmCostEstimate <= input.budgetRemaining ? 1 : 0;

  const finalScore = expectedValue * costFactor;

  // Thresholds by level
  const threshold =
    input.level === "SENIOR" ? 0.35 :
    input.level === "JUNIOR" ? 0.55 :
    1; // BASIC already returned

  if (finalScore >= threshold) {
    return {
      allowPaidLlm: true,
      recommendedTier: "PAID",
      reason: `ORD positive (score=${finalScore.toFixed(2)})`,
    };
  }

  return {
    allowPaidLlm: false,
    recommendedTier: "OSS",
    reason: `ORD negative (score=${finalScore.toFixed(2)})`,
  };
}
