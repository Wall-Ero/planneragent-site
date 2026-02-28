// core/src/commercial/srl.decision.ts
// =====================================================
// P7.5 — SRL Decision Engine (Canonical)
// Deterministic · Governance-grade · PRE-SRL
// =====================================================

export type SrlDecisionInput = Readonly<{
  // ECONOMIC
  cash_available_eur: number;

  // MARKET
  active_junior_accounts: number;
  junior_continuity_months: number;
  has_real_usage: boolean;

  // OPERATIONAL
  operational_friction_high: boolean;

  // RISK
  governs_real_systems: boolean;
  orchestrates_external_ai: boolean;
  used_in_decisional_contexts: boolean;

  // GOVERNANCE INTENT
  founder_wants_institution: boolean;
}>;

export type SrlDecisionResult = Readonly<{
  allowed: boolean;
  blocking_reasons: string[];
}>;

// -----------------------------------------------------
// Canonical thresholds
// -----------------------------------------------------

const MIN_CASH_EUR = 12_000;
const MIN_JUNIOR_ACCOUNTS = 5;
const MIN_CONTINUITY_MONTHS = 2;

// -----------------------------------------------------
// Decision evaluator
// -----------------------------------------------------

export function evaluateSrlDecision(
  input: SrlDecisionInput
): SrlDecisionResult {
  const reasons: string[] = [];

  // 1. Economic sustainability
  if (input.cash_available_eur < MIN_CASH_EUR) {
    reasons.push("INSUFFICIENT_CASH_BUFFER");
  }

  // 2. Market validation
  if (input.active_junior_accounts < MIN_JUNIOR_ACCOUNTS) {
    reasons.push("INSUFFICIENT_PAYING_JUNIOR_ACCOUNTS");
  }

  if (input.junior_continuity_months < MIN_CONTINUITY_MONTHS) {
    reasons.push("INSUFFICIENT_ACCOUNT_CONTINUITY");
  }

  if (!input.has_real_usage) {
    reasons.push("NO_REAL_USAGE_SIGNAL");
  }

  // 3. Operational friction
  if (!input.operational_friction_high) {
    reasons.push("OPERATIONAL_FRICTION_STILL_MANAGEABLE");
  }

  // 4. Risk exposure
  const riskSignals = [
    input.governs_real_systems,
    input.orchestrates_external_ai,
    input.used_in_decisional_contexts,
  ].filter(Boolean).length;

  if (riskSignals === 0) {
    reasons.push("NO_SIGNIFICANT_RISK_EXPOSURE");
  }

  // 5. Governance intent
  if (!input.founder_wants_institution) {
    reasons.push("FOUNDER_INTENT_NOT_CONFIRMED");
  }

  return {
    allowed: reasons.length === 0,
    blocking_reasons: reasons,
  };
}