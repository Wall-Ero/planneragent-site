// src/scheduler/scheduler.types.ts
// ============================================
// Governance Scheduler Types — v1
// Canonical Snapshot · Source of Truth
// ============================================

export type SrlDecisionInput = {
  cash_available_eur: number;

  active_junior_accounts: number;
  junior_continuity_months: number;
  has_real_usage: boolean;

  operational_friction_high: boolean;

  governs_real_systems: boolean;
  orchestrates_external_ai: boolean;
  used_in_decisional_contexts: boolean;

  founder_wants_institution: boolean;
};

export type GovernanceSchedulerInput = {
  now_iso: string;
  srl_decision_input: SrlDecisionInput;
};

export type GovernanceSchedulerResult =
  | { action: "NO_ACTION" }
  | { action: "OPEN_SRL_TRIGGERED"; reason: string };