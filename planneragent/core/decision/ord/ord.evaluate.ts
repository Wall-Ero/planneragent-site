import { evaluateDecisionPressure } from "../pressure";
import { ordGateV1, OrdGateInput, OrdGateResult } from "./ordGate.v1";

// GOVERNANCE / LEGAL
import {
  evaluateLegalReadiness,
  LegalReadinessResult
} from "../../src/governance/legalReadiness.monitor.v1";

import { governanceEvents } from "../../src/governance/events";

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

  // Legal soft signals (runtime / memory derived)
  activeJuniorClients: number;
  hasForeignRecurringClients: boolean;
  monthlyDecisionVolume: number;
  delegationPresentInDecisionMemory: boolean;
  ordRiskScore: number; // 0..1
}

export interface OrdEvaluateResult {
  ordStatus: OrdStatus;
  pressure: ReturnType<typeof evaluateDecisionPressure>;
  costGate: OrdGateResult | null;
  legal: LegalReadinessResult;
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
export function evaluateORD(
  input: OrdEvaluateInput
): OrdEvaluateResult {
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
    const legal = evaluateLegalReadiness({
      // HARD
      seniorActivationRequested: false,
      delegationRequested: false,
      agiLayerRequested: false,
      executionCapabilityRequested: false,
      recurringBillingRequired: false,

      // SOFT
      activeJuniorClients: input.activeJuniorClients,
      hasForeignRecurringClients: input.hasForeignRecurringClients,
      monthlyDecisionVolume: input.monthlyDecisionVolume,
      delegationPresentInDecisionMemory:
        input.delegationPresentInDecisionMemory,
      ordRiskScore: input.ordRiskScore
    });

    return {
      ordStatus: "HIDDEN",
      pressure,
      costGate: null,
      legal
    };
  }

  // 2. Cost gate (economic legitimacy)
  const costGate = ordGateV1(input);

  // 3. Legal gate (liability legitimacy — monitor only)
  const legal = evaluateLegalReadiness({
    // HARD
    seniorActivationRequested: input.decisionType === "SENIOR",
    delegationRequested: input.decisionType === "DELEGATION",
    agiLayerRequested: input.decisionType === "AGI",
    executionCapabilityRequested: input.decisionType === "EXECUTION",
    recurringBillingRequired: false,

    // SOFT
    activeJuniorClients: input.activeJuniorClients,
    hasForeignRecurringClients: input.hasForeignRecurringClients,
    monthlyDecisionVolume: input.monthlyDecisionVolume,
    delegationPresentInDecisionMemory:
      input.delegationPresentInDecisionMemory,
    ordRiskScore: input.ordRiskScore
  });

  // 4. Emit governance signal (never notify directly)
  if (legal.notifyFounder) {
    governanceEvents.emit("FOUNDER_NOTIFICATION_REQUIRED", {
      status: legal.status,
      reason: legal.reason,
      contextId: input.contextId,
      decisionType: input.decisionType
    });
  }

  return {
    ordStatus: "VISIBLE",
    pressure,
    costGate,
    legal
  };
}