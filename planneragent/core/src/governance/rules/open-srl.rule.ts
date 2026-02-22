// core/src/governance/rules/open-srl.rule.ts
// ============================================
// OPEN-SRL RULE — Canonical Governance Rule
// ============================================
// Decides WHEN the system is allowed to suggest
// legal incorporation (SRL).
//
// ⚠️ This rule NEVER executes actions.
// It only emits a GOVERNANCE SIGNAL.
// ============================================

export interface OpenSrlInputs {
  // Financial sustainability
  cash_available_eur: number;

  // Market validation
  active_junior_accounts: number;
  junior_continuity_months: number;

  // Usage evidence
  has_real_usage: boolean;

  // Operational friction
  operational_friction_high: boolean;

  // Risk exposure
  governs_real_systems: boolean;
  orchestrates_external_ai: boolean;
  used_in_decisional_contexts: boolean;

  // Governance intent
  founder_wants_institution: boolean;
}

export interface OpenSrlDecision {
  allowed: boolean;
  reasons: string[];
}

export function evaluateOpenSrlRule(
  input: OpenSrlInputs
): OpenSrlDecision {
  const reasons: string[] = [];

  // 1. Economic sustainability
  if (input.cash_available_eur < 12_000) {
    reasons.push("INSUFFICIENT_CASH_BUFFER");
  }

  // 2. Market validation
  if (input.active_junior_accounts < 5) {
    reasons.push("INSUFFICIENT_PAYING_JUNIOR_ACCOUNTS");
  }

  if (input.junior_continuity_months < 2) {
    reasons.push("INSUFFICIENT_ACCOUNT_CONTINUITY");
  }

  if (!input.has_real_usage) {
    reasons.push("NO_REAL_SYSTEM_USAGE");
  }

  // 3. Operational friction
  if (!input.operational_friction_high) {
    reasons.push("OPERATIONAL_FRICTION_STILL_MANAGEABLE");
  }

  // 4. Risk exposure
  const riskSignals = [
    input.governs_real_systems,
    input.orchestrates_external_ai,
    input.used_in_decisional_contexts
  ].filter(Boolean).length;

  if (riskSignals === 0) {
    reasons.push("NO_SIGNIFICANT_RISK_EXPOSURE");
  }

  // 5. Governance intent
  if (!input.founder_wants_institution) {
    reasons.push("GOVERNANCE_INTENT_NOT_CONFIRMED");
  }

  return {
    allowed: reasons.length === 0,
    reasons
  };
}