/**
 * Decision Pressure — Core Internal Check
 * v1.0 (FREEZED)
 *
 * Purpose:
 * Evaluate whether a situation deserves to enter the decision pipeline.
 *
 * This module:
 * - does NOT decide
 * - does NOT notify
 * - does NOT mutate state
 * - does NOT use ML / LLM
 *
 * It only measures pressure.
 */

export type DecisionPressureInput = {
  contextId: string;               // fingerprint / snapshot hash
  decisionType: string;            // e.g. inventory_alignment, capacity_shift
  noveltyScore: number;            // 0..1 (new vs known pattern)
  impactScore: number;             // 0..1 (business impact magnitude)
  urgencyScore: number;            // 0..1 (time sensitivity)
  reversibilityScore: number;      // 0..1 (1 = fully reversible)
  responsibilityLevel: "LOW" | "MEDIUM" | "HIGH";
  historicalConfidence?: number;   // optional 0..1 (from Decision Memory)
};

export type DecisionPressureResult = {
  pressureScore: number;           // 0..1
  pressureLevel: "NONE" | "LOW" | "MEDIUM" | "HIGH";
  shouldEnterDecisionFlow: boolean;
  contributingFactors: {
    novelty: number;
    impact: number;
    urgency: number;
    irreversibility: number;
    responsibility: number;
  };
};

/**
 * Canonical weights — NON NEGOTIABLE
 * These weights encode governance, not optimization.
 */
const WEIGHTS = {
  novelty: 0.20,
  impact: 0.30,
  urgency: 0.25,
  irreversibility: 0.15,
  responsibility: 0.10
} as const;

function responsibilityToScore(level: "LOW" | "MEDIUM" | "HIGH"): number {
  switch (level) {
    case "LOW":
      return 0.2;
    case "MEDIUM":
      return 0.6;
    case "HIGH":
      return 1.0;
  }
}

/**
 * Main evaluator
 */
export function evaluateDecisionPressure(
  input: DecisionPressureInput
): DecisionPressureResult {

  const irreversibility = 1 - input.reversibilityScore;

  const responsibility = responsibilityToScore(input.responsibilityLevel);

  const pressureScore =
    input.noveltyScore * WEIGHTS.novelty +
    input.impactScore * WEIGHTS.impact +
    input.urgencyScore * WEIGHTS.urgency +
    irreversibility * WEIGHTS.irreversibility +
    responsibility * WEIGHTS.responsibility;

  let pressureLevel: DecisionPressureResult["pressureLevel"] = "NONE";

  if (pressureScore >= 0.75) {
    pressureLevel = "HIGH";
  } else if (pressureScore >= 0.45) {
    pressureLevel = "MEDIUM";
  } else if (pressureScore >= 0.20) {
    pressureLevel = "LOW";
  }

  const shouldEnterDecisionFlow =
    pressureLevel === "MEDIUM" || pressureLevel === "HIGH";

  return {
    pressureScore: Number(pressureScore.toFixed(3)),
    pressureLevel,
    shouldEnterDecisionFlow,
    contributingFactors: {
      novelty: input.noveltyScore,
      impact: input.impactScore,
      urgency: input.urgencyScore,
      irreversibility,
      responsibility
    }
  };
}
