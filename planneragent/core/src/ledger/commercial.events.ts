// core/src/ledger/commercial.events.ts
// =====================================================
// Commercial Ledger Events — Legal Proof (Append-only)
// Canonical · Provider-agnostic · Audit-friendly
// =====================================================

import type { LedgerEvent } from "./ledger.event";
import type { PlanTier } from "../sandbox/contracts.v2";

function baseEvent(partial: Omit<LedgerEvent, "id" | "recorded_at_iso">): LedgerEvent {
  return {
    id: crypto.randomUUID(),
    recorded_at_iso: new Date().toISOString(),
    ...partial,
  };
}

// -----------------------------------------------------
// CHECKOUT CREATED
// -----------------------------------------------------

export function checkoutCreatedEvent(input: Readonly<{
  tenant_id: string;
  plan: PlanTier;
  provider: string;          // ledger ≠ billing
  checkout_url: string;

  // traceability
  request_id?: string;
}>): LedgerEvent {
  return baseEvent({
    category: "commercial",
    statement: "A checkout session was created for a subscription purchase.",

    actor: {
      kind: "system",
      role: "billing_gateway",
    },

    authority_scope: "SUBSCRIPTION_PURCHASE",
    system_state: "PAYMENT_FLOW",

    evidence: {
      tenant_id: input.tenant_id,
      plan: input.plan,
      provider: input.provider,
      checkout_url: input.checkout_url,
      request_id: input.request_id,
    },
  });
}

// -----------------------------------------------------
// PAYMENT SUCCEEDED (invoice/charge paid)
// MUST carry evidence.amount_usd for SRL readiness
// -----------------------------------------------------

export function paymentSucceededEvent(input: Readonly<{
  tenant_id: string;
  provider: string;          // e.g. "stripe"
  raw_event_id: string;      // provider webhook event id (idempotency key)
  invoice_id?: string;
  subscription_id?: string;

  // canonical commercial evidence
  amount_usd: number;        // REQUIRED for revenue metrics
  currency: "USD";           // keep strict for now (offers are USD)
}>): LedgerEvent {
  return baseEvent({
    category: "commercial",
    statement: "A payment was successfully collected for a subscription invoice.",

    actor: {
      kind: "external_service",
      id: input.provider,
      role: "payment_processor",
    },

    authority_scope: "PAYMENT_CONFIRMATION",
    system_state: "PAYMENT_FLOW",

    evidence: {
      tenant_id: input.tenant_id,
      provider: input.provider,
      raw_event_id: input.raw_event_id,
      invoice_id: input.invoice_id,
      subscription_id: input.subscription_id,
      amount_usd: input.amount_usd,
      currency: input.currency,
    },
  });
}

// -----------------------------------------------------
// SUBSCRIPTION STARTED / ACTIVE
// -----------------------------------------------------

export function subscriptionStartedEvent(input: Readonly<{
  tenant_id: string;
  provider: string;
  external_ref: string;      // subscription id (provider)
  plan: PlanTier;
  trial_days?: number;

  // traceability
  raw_event_id?: string;
}>): LedgerEvent {
  return baseEvent({
    category: "commercial",
    statement: "A commercial subscription is active for the tenant.",

    actor: {
      kind: "external_service",
      id: input.provider,
      role: "payment_processor",
    },

    authority_scope: "SUBSCRIPTION_ACTIVATION",
    system_state: "PAYMENT_FLOW",

    evidence: {
      tenant_id: input.tenant_id,
      provider: input.provider,
      external_ref: input.external_ref,
      plan: input.plan,
      trial_days: input.trial_days,
      raw_event_id: input.raw_event_id,
    },
  });
}

// -----------------------------------------------------
// PAYMENT FAILED
// -----------------------------------------------------

export function paymentFailedEvent(input: Readonly<{
  tenant_id: string;
  provider: string;
  raw_event_id: string;

  invoice_id?: string;
  reason?: string;
}>): LedgerEvent {
  return baseEvent({
    category: "commercial",
    statement: "A payment attempt failed for a subscription invoice.",

    actor: {
      kind: "external_service",
      id: input.provider,
      role: "payment_processor",
    },

    authority_scope: "PAYMENT_CONFIRMATION",
    system_state: "PAYMENT_FLOW",

    evidence: {
      tenant_id: input.tenant_id,
      provider: input.provider,
      raw_event_id: input.raw_event_id,
      invoice_id: input.invoice_id,
      reason: input.reason,
    },
  });
}

// -----------------------------------------------------
// SUBSCRIPTION CANCELED
// -----------------------------------------------------

export function subscriptionCanceledEvent(input: Readonly<{
  tenant_id: string;
  provider: string;
  raw_event_id: string;
  subscription_id?: string;
}>): LedgerEvent {
  return baseEvent({
    category: "commercial",
    statement: "A commercial subscription was canceled.",

    actor: {
      kind: "external_service",
      id: input.provider,
      role: "payment_processor",
    },

    authority_scope: "SUBSCRIPTION_MANAGEMENT",
    system_state: "PAYMENT_FLOW",

    evidence: {
      tenant_id: input.tenant_id,
      provider: input.provider,
      raw_event_id: input.raw_event_id,
      subscription_id: input.subscription_id,
    },
  });
}