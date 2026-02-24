// core/src/ledger/commercial.events.ts
// ============================================
// Commercial Ledger Events (Append-only, Legal-grade)
// P7.2 — Canonical source
// ============================================

import type { LedgerEvent } from "./ledger.event";
import type { PlanTier } from "../sandbox/contracts.v2";

// --------------------------------------------
// SUBSCRIPTION STARTED
// --------------------------------------------
// Legal question answered:
// "When did a paid responsibility relationship start, and under which terms?"

export function subscriptionStartedEvent(input: Readonly<{
  external_ref: string;        // Stripe subscription id
  plan: PlanTier;
  trial_days?: number;
}>): LedgerEvent {
  return {
    id: crypto.randomUUID(),

    // Responsibility class
    category: "commercial",

    // Frozen semantic term (do not rename)
    type: "SUBSCRIPTION_STARTED",

    // Payload must be readable without code
    payload: {
      external_ref: input.external_ref,
      plan: input.plan,
      trial_days: input.trial_days ?? 0,
    },

    created_at: new Date().toISOString(),
  };
}