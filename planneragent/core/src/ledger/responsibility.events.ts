// core/src/ledger/responsibility.events.ts
// =====================================================
// Responsibility Event Factories (Canonical)
// =====================================================

import type { LedgerEvent } from "./ledger.event";

function baseEvent(
  partial: Omit<LedgerEvent, "id" | "recorded_at_iso">
): LedgerEvent {
  return {
    id: crypto.randomUUID(),
    recorded_at_iso: new Date().toISOString(),
    ...partial,
  };
}

// -----------------------------------------------------
// GOVERNANCE — SRL OPEN TRIGGERED
// -----------------------------------------------------

export function srlOpenTriggeredEvent(input: {
  decided_at_iso: string;
}): LedgerEvent {
  return baseEvent({
    category: "governance",
    statement:
      "All canonical governance conditions satisfied. SRL incorporation is now recommended.",

    actor: {
      kind: "system",
      id: "governance_scheduler",
      role: "constitutional_guard",
    },

    authority_scope: "LEGAL_ENTITY_DECISION",
    system_state: "PRE_SRL",

    evidence: {
      decided_at_iso: input.decided_at_iso,
    },
  });
}