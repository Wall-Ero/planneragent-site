// core/src/ledger/commercial.events.ts
// ============================================
// Commercial Ledger Events (Append-only)
// Canonical · Provider-agnostic
// ============================================

import type { LedgerEvent } from "./ledger.event";
import type { PlanTier } from "../sandbox/contracts.v2";

// -----------------------------------------------------
// CHECKOUT CREATED
// -----------------------------------------------------

export function checkoutCreatedEvent(input: Readonly<{
  tenant_id: string;
  plan: PlanTier;
  provider: string;          // string intenzionale (ledger ≠ billing)
  checkout_url: string;
}>): LedgerEvent {
  return {
    id: crypto.randomUUID(),
    category: "commercial",
    type: "CHECKOUT_CREATED",
    payload: input,
    created_at: new Date().toISOString(),
  };
}

// -----------------------------------------------------
// PAYMENT SUCCEEDED
// -----------------------------------------------------

export function paymentSucceededEvent(input: Readonly<{
  provider: string;          // es: "stripe"
  raw_event_id: string;      // id webhook provider (per idempotenza)
}>): LedgerEvent {
  return {
    id: crypto.randomUUID(),
    category: "commercial",
    type: "PAYMENT_SUCCEEDED",
    payload: input,
    created_at: new Date().toISOString(),
  };
}

// -----------------------------------------------------
// SUBSCRIPTION STARTED
// -----------------------------------------------------

export function subscriptionStartedEvent(input: Readonly<{
  external_ref: string;      // subscription id (provider)
  plan: PlanTier;
  trial_days?: number;
}>): LedgerEvent {
  return {
    id: crypto.randomUUID(),
    category: "commercial",
    type: "SUBSCRIPTION_STARTED",
    payload: input,
    created_at: new Date().toISOString(),
  };
}

// -----------------------------------------------------
// SUBSCRIPTION CANCELED
// -----------------------------------------------------

export function subscriptionCanceledEvent(input: Readonly<{
  provider: string;
  raw_event_id: string;
}>): LedgerEvent {
  return {
    id: crypto.randomUUID(),
    category: "commercial",
    type: "SUBSCRIPTION_CANCELED",
    payload: input,
    created_at: new Date().toISOString(),
  };
}