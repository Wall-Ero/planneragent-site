// planneragent/core/src/governance/legalReadiness.monitor.v1.ts

export type LegalReadinessStatus =
  | "NO_ACTION"
  | "SRL_RECOMMENDED"
  | "SRL_REQUIRED";

export interface LegalReadinessInput {
  // HARD signals
  seniorActivationRequested: boolean;
  delegationRequested: boolean;
  agiLayerRequested: boolean;
  executionCapabilityRequested: boolean;
  recurringBillingRequired: boolean;

  // SOFT signals
  activeJuniorClients: number;
  hasForeignRecurringClients: boolean;
  monthlyDecisionVolume: number;
  delegationPresentInDecisionMemory: boolean;
  ordRiskScore: number; // 0..1
}

export interface LegalReadinessResult {
  status: LegalReadinessStatus;
  reason: string;
  notifyFounder: boolean;
}

/**
 * Legal Readiness Monitor v1
 * Detects when SRL becomes recommended or required.
 * Does NOT block execution.
 * Does NOT change system behavior.
 */
export function evaluateLegalReadiness(
  input: LegalReadinessInput
): LegalReadinessResult {
  // --- HARD triggers ---
  if (
    input.seniorActivationRequested ||
    input.delegationRequested ||
    input.agiLayerRequested ||
    input.executionCapabilityRequested ||
    input.recurringBillingRequired
  ) {
    return {
      status: "SRL_REQUIRED",
      notifyFounder: true,
      reason:
        "Delegation or execution-level capability requested. Legal entity required to proceed safely.",
    };
  }

  // --- SOFT signals ---
  let softScore = 0;

  if (input.activeJuniorClients >= 3) softScore++;
  if (input.hasForeignRecurringClients) softScore++;
  if (input.monthlyDecisionVolume >= 50) softScore++;
  if (input.delegationPresentInDecisionMemory) softScore++;
  if (input.ordRiskScore >= 0.6) softScore++;

  if (softScore >= 2) {
    return {
      status: "SRL_RECOMMENDED",
      notifyFounder: true,
      reason:
        "Growing responsibility exposure detected. SRL recommended before next phase.",
    };
  }

  return {
    status: "NO_ACTION",
    notifyFounder: false,
    reason: "No legal threshold crossed.",
  };
}
