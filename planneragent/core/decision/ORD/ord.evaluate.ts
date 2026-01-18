import { evaluateDecisionPressure } from "../pressure";
import { ordGateV1, OrdGateInput, OrdGateResult } from "./ordGate.v1";

export type OrdStatus = "HIDDEN" | "VISIBLE" | "OPERATIONAL";

export interface OrdEvaluateInput extends OrdGateInput {
  contextId: string;
  decisionType: string;

  signals: {
    novelty: number;
    impact: number;
    urgency: number;
    reversibility: number;
  };

  responsibilityLevel: "LOW" | "MEDIUM" | "HIGH";
  historicalConfidence?: number;
}

export interface OrdEvaluateResult {
  ordStatus: OrdStatus;
  pressure: ReturnType<typeof evaluateDecisionPressure>;
  costGate: OrdGateResult | null;
}

/**
 * ORD Evaluate — v1 (CANONICAL)
 *
 * Decides:
 * - if a situation deserves human attention
 * - if it deserves paid intelligence
 *
 * Never decides actions.
 * Never executes.
 */
export function evaluateORD(input: OrdEvaluateInput): OrdEvaluateResult {
  // 1. Pressure gate (attention legitimacy)
  const pressure = evaluateDecisionPressure({
    contextId: input.contextId,
    decisionType: input.decisionType,
    noveltyScore: input.signals.novelty,
    impactScore: input.signals.impact,
    urgencyScore: input.signals.urgency,
    reversibilityScore: input.signals.reversibility,
    responsibilityLevel: input.responsibilityLevel,
    historicalConfidence: input.historicalConfidence
  });

  if (!pressure.shouldEnterDecisionFlow) {
    return {
      ordStatus: "HIDDEN",
      pressure,
      costGate: null
    };
  }

  // 2. Cost gate (economic legitimacy)
  const costGate = ordGateV1(input);

  return {
    ordStatus: "VISIBLE",
    pressure,
    costGate
  };
}
