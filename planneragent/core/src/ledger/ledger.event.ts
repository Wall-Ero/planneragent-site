// core/src/ledger/ledger.event.ts
// ======================================================
// Ledger Event — Canonical Definition
// Append-only · Audit-grade · Deterministic
// ======================================================

export type LedgerEventType =
  | "OPEN_SRL_ELIGIBLE"
  | "OPEN_SRL_TRIGGERED";

export type LedgerEvent = {
  id: string;
  type: LedgerEventType;
  payload: Record<string, unknown>;
  created_at: string; // ISO
};