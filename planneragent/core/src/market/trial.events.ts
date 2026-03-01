//planneragent/core/src/ledger/trial.events.ts

// =====================================================
// P7 — Trial Ledger Events (Append-only, Legal Proof)
// =====================================================

import type { LedgerEvent } from "../ledger/ledger.event";

// -----------------------------------------------------
// TRIAL STARTED
// -----------------------------------------------------

export function trialStartedEvent(input: {
  tenant_id: string;
  plan: string;
  started_at_iso: string;
  expires_at_iso: string;
  trial_days: number;
}): LedgerEvent {
  return {
    id: crypto.randomUUID(),
    recorded_at_iso: new Date().toISOString(),

    category: "commercial",
    statement: "Trial period started for subscription plan.",

    actor: {
      kind: "system",
      id: "onboarding",
      role: "commercial_flow",
    },

    authority_scope: "TRIAL_START",

    evidence: {
      tenant_id: input.tenant_id,
      plan: input.plan,
      started_at_iso: input.started_at_iso,
      expires_at_iso: input.expires_at_iso,
      trial_days: input.trial_days,
    },
  };
}

// -----------------------------------------------------
// TRIAL EXPIRED
// -----------------------------------------------------

export function trialExpiredEvent(input: {
  tenant_id: string;
  plan: string;
  expired_at_iso: string;
}): LedgerEvent {
  return {
    id: crypto.randomUUID(),
    recorded_at_iso: new Date().toISOString(),

    category: "commercial",
    statement: "Trial period expired.",

    actor: {
      kind: "system",
      id: "scheduler",
      role: "commercial_flow",
    },

    authority_scope: "TRIAL_EXPIRED",

    evidence: {
      tenant_id: input.tenant_id,
      plan: input.plan,
      expired_at_iso: input.expired_at_iso,
    },
  };
}
