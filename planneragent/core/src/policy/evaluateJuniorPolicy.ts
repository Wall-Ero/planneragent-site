import { PolicyRecord } from "./types";

/**
 * Junior Policy Evaluation
 *
 * - NON modifica risultati
 * - NON blocca
 * - NON esegue
 * - Produce solo segnali strutturati
 */

export type PolicySignal = {
  type: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  metric: string;
  value: number;
  requiredAction: "HUMAN_REVIEW" | "HUMAN_REVIEW_IMMEDIATE";
};

export type PolicyEvaluationResult = {
  policyId: string;
  level: "JUNIOR";
  signals: PolicySignal[];
  canProceed: true;
  decisionAuthority: "HUMAN";
};

type AnalyzeResult = {
  results: Array<{
    sku: string;
    qty: number;
    shortage?: number;
  }>;
};

/**
 * Evaluate Junior Policy against core output
 */
export function evaluateJuniorPolicy(
  policy: PolicyRecord,
  analyzeResult: AnalyzeResult
): PolicyEvaluationResult {
  const signals: PolicySignal[] = [];

  // 1. Detect shortages
  for (const r of analyzeResult.results) {
    if (typeof r.shortage === "number" && r.shortage > 0) {
      signals.push({
        type: "SHORTAGE_DETECTED",
        severity: r.shortage > 0 ? "HIGH" : "MEDIUM",
        metric: "shortage",
        value: r.shortage,
        requiredAction: "HUMAN_REVIEW",
      });
    }
  }

  // 2. Policy-level sanity guard (Junior can never block)
  // (intentionally explicit – this is a contract, not logic)
  return {
    policyId: policy.policyId,
    level: "JUNIOR",
    signals,
    canProceed: true, // Junior NEVER blocks
    decisionAuthority: "HUMAN",
  };
}