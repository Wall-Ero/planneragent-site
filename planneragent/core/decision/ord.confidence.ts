/**
 * ORD.confidence_score — Core Internal Evaluator
 * v1.0 (FREEZED)
 *
 * Status: CANONICAL
 * Source of truth: chat-prodotto
 *
 * Purpose:
 * Measure how reliable the system is to act within a given scope,
 * based only on validated historical behavior.
 *
 * This module:
 * - does NOT decide
 * - does NOT evaluate urgency
 * - does NOT predict outcomes
 * - does NOT use ML / LLM
 * - does NOT read raw operational data
 *
 * It only measures operational confidence.
 */

export type OrdConfidenceInput = {
  scopeId: string;                 // scope / process fingerprint
  executionCount: number;          // total executions in scope
  successCount: number;            // executions without correction
  correctionCount: number;         // rollbacks / overrides / fixes
  escalationComplianceRate: number;// 0..1 (policy-respecting escalations)
  reversibilityHandledRate: number;// 0..1 (reversals handled correctly)
  scopeStabilityScore: number;     // 0..1 (scope unchanged over time)
};

export type OrdConfidenceResult = {
  confidenceScore: number;         // 0..1
  confidenceLevel: "NONE" | "LOW" | "MEDIUM" | "HIGH";
  isOperationallyReady: boolean;
  contributingFactors: {
    successRate: number;
    correctionPenalty: number;
    escalationCompliance: number;
    reversibilityHandling: number;
    scopeStability: number;
  };
};

/**
 * Canonical weights — NON NEGOTIABLE
 * These weights encode governance, not optimization.
 */
const WEIGHTS = {
  successRate: 0.35,
  correctionPenalty: 0.25,
  escalationCompliance: 0.15,
  reversibilityHandling: 0.15,
  scopeStability: 0.10
} as const;

/**
 * Main evaluator
 */
export function evaluateOrdConfidence(
  input: OrdConfidenceInput
): OrdConfidenceResult {

  // No history → no confidence
  if (input.executionCount === 0) {
    return {
      confidenceScore: 0,
      confidenceLevel: "NONE",
      isOperationallyReady: false,
      contributingFactors: {
        successRate: 0,
        correctionPenalty: 1,
        escalationCompliance: 0,
        reversibilityHandling: 0,
        scopeStability: input.scopeStabilityScore
      }
    };
  }

  const successRate = input.successCount / input.executionCount;

  const correctionPenalty =
    input.correctionCount === 0
      ? 1
      : 1 - (input.correctionCount / input.executionCount);

  const confidenceScore =
    successRate * WEIGHTS.successRate +
    correctionPenalty * WEIGHTS.correctionPenalty +
    input.escalationComplianceRate * WEIGHTS.escalationCompliance +
    input.reversibilityHandledRate * WEIGHTS.reversibilityHandling +
    input.scopeStabilityScore * WEIGHTS.scopeStability;

  let confidenceLevel: OrdConfidenceResult["confidenceLevel"] = "NONE";

  if (confidenceScore >= 0.80) {
    confidenceLevel = "HIGH";
  } else if (confidenceScore >= 0.55) {
    confidenceLevel = "MEDIUM";
  } else if (confidenceScore >= 0.30) {
    confidenceLevel = "LOW";
  }

  return {
    confidenceScore: Number(confidenceScore.toFixed(3)),
    confidenceLevel,
    isOperationallyReady:
      confidenceLevel === "MEDIUM" || confidenceLevel === "HIGH",
    contributingFactors: {
      successRate,
      correctionPenalty,
      escalationCompliance: input.escalationComplianceRate,
      reversibilityHandling: input.reversibilityHandledRate,
      scopeStability: input.scopeStabilityScore
    }
  };
}
