// core/src/ledger/ledger.event.ts
// =====================================================
// Ledger Event — Legal Proof Schema (Append-only)
// =====================================================

export type LedgerEventCategory =
  | "ui_signal"
  | "intent_declared"
  | "authority_granted"
  | "approval_given"
  | "execution_attempted"
  | "execution_blocked"
  | "execution_completed"
  | "commercial"
  | "governance"
  | "notification"
  | "onboarding";

export type LedgerEvent = Readonly<{
  // Immutable identifiers
  id: string;
  recorded_at_iso: string;

  // Responsibility semantics
  category: LedgerEventCategory;

  // Human-readable, audit-friendly description
  statement: string;

  // Actor & authority context
  actor: {
    kind: "user" | "system" | "external_service";
    id?: string;
    role?: string;
  };

  authority_scope?: string;
  system_state?: string;

  // Evidence payload (non executable)
  evidence: Record<string, unknown>;
}>;