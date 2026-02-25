// core/src/ledger/responsibility.events.ts
// =====================================================
// Responsibility Event Factories (Canonical + Aliases)
// ALL legal-grade LedgerEvent MUST be created here
// =====================================================

import type { LedgerEvent } from "./ledger.event";

// -----------------------------------------------------
// Base factory — append-only, legal proof
// -----------------------------------------------------

function baseEvent(
  partial: Omit<LedgerEvent, "id" | "recorded_at_iso">
): LedgerEvent {
  return {
    id: crypto.randomUUID(),
    recorded_at_iso: new Date().toISOString(),
    ...partial,
  };
}

// =====================================================
// INTENT — declared by human
// =====================================================

export function intentDeclaredEvent(input: {
  tenant_id: string;
  plan: string;
}): LedgerEvent {
  return baseEvent({
    category: "intent_declared",
    statement: "A tenant explicitly declared intent to start a subscription checkout.",

    actor: {
      kind: "user",
      id: input.tenant_id,
      role: "tenant_admin",
    },

    authority_scope: "SUBSCRIPTION_PURCHASE",

    evidence: {
      plan: input.plan,
    },
  });
}

// Canonical alias (retro-compat / semantic freeze)
export const checkoutIntentDeclaredEvent = intentDeclaredEvent;

// =====================================================
// EXECUTION — attempted by system
// =====================================================

export function executionAttemptedEvent(input: {
  provider: string;
  plan: string;
}): LedgerEvent {
  return baseEvent({
    category: "execution_attempted",
    statement: "A billing execution was attempted via an external payment provider.",

    actor: {
      kind: "system",
      id: "billing_gateway",
      role: "execution_layer",
    },

    authority_scope: "PAYMENT_EXECUTION",

    evidence: {
      provider: input.provider,
      plan: input.plan,
    },
  });
}

// =====================================================
// EXECUTION — completed (PAYMENT CONFIRMED)
// =====================================================

export function executionCompletedEvent(input: {
  external_ref: string;
  plan: string;
  trial_days: number;
  amount_usd?: number;
}): LedgerEvent {
  return baseEvent({
    category: "execution_completed",
    statement: "A commercial subscription was successfully activated by the payment provider.",

    actor: {
      kind: "external_service",
      id: "billing_provider",
      role: "payment_processor",
    },

    authority_scope: "PAYMENT_CONFIRMATION",
    system_state: "PAYMENT_FLOW",

    evidence: {
      external_ref: input.external_ref,
      plan: input.plan,
      trial_days: input.trial_days,
      amount_usd: input.amount_usd, // ⬅️ chiave per P7.5 revenue metrics
    },
  });
}

// Canonical alias used by billing/webhooks
export const subscriptionStartedEvent = executionCompletedEvent;

// =====================================================
// EXECUTION — blocked by policy
// =====================================================

export function executionBlockedEvent(input: {
  reason: string;
  provider?: string;
}): LedgerEvent {
  return baseEvent({
    category: "execution_blocked",
    statement: "A billing execution was blocked due to policy or system constraints.",

    actor: {
      kind: "system",
      id: "billing_policy",
      role: "governance_layer",
    },

    authority_scope: "EXECUTION_GUARD",

    evidence: {
      reason: input.reason,
      provider: input.provider,
    },
  });
}