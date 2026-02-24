// core/src/ledger/responsibility.events.ts
// =====================================================
// Responsibility Event Factories (Canonical + Aliases)
// All LedgerEvent MUST be created here
// =====================================================

import type { LedgerEvent } from "./ledger.event";

// -----------------------------------------------------
// Base factory (append-only, legal proof)
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
// INTENT
// =====================================================

export function intentDeclaredEvent(input: {
  tenant_id: string;
  plan: string;
}): LedgerEvent {
  return baseEvent({
    category: "intent_declared",
    statement: "A tenant explicitly declared intent to start a checkout.",

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

// ⛓ Alias canonico (retro-compatibilità semantica)
export const checkoutIntentDeclaredEvent = intentDeclaredEvent;

// =====================================================
// EXECUTION — ATTEMPTED
// =====================================================

export function executionAttemptedEvent(input: {
  provider: string;
  plan: string;
}): LedgerEvent {
  return baseEvent({
    category: "execution_attempted",
    statement: "A billing execution was attempted via external provider.",

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
// EXECUTION — COMPLETED
// =====================================================

export function executionCompletedEvent(input: {
  external_ref: string;
  plan: string;
  trial_days: number;
}): LedgerEvent {
  return baseEvent({
    category: "execution_completed",
    statement: "A commercial subscription was successfully activated.",

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
    },
  });
}

// ⛓ Alias storico / test / webhook
export const subscriptionStartedEvent = executionCompletedEvent;

// =====================================================
// EXECUTION — BLOCKED
// =====================================================

export function executionBlockedEvent(input: {
  reason: string;
  provider?: string;
}): LedgerEvent {
  return baseEvent({
    category: "execution_blocked",
    statement: "A billing execution was blocked due to policy or system state.",

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