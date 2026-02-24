// core/src/ledger/ledger.event.ts
// ======================================================
// Ledger Event — Canonical Definition
// Append-only · Audit-grade · Deterministic
// ======================================================

// --------------------------------------
// Event Categories (semantic nature)
// --------------------------------------
export type LedgerEventCategory =
  | "commercial"
  | "governance"
  | "notification"
  | "onboarding"
  | "ui_signal";

// --------------------------------------
// Domain Event Types (closed set)
// --------------------------------------
export type LedgerEventType =
  | "OPEN_SRL_ELIGIBLE"
  | "OPEN_SRL_TRIGGERED";

// --------------------------------------
// Canonical Ledger Event
// --------------------------------------
export type LedgerEvent = {
  id: string;

  /**
   * Semantic category of the event.
   * Used for aggregation, filtering, dashboards.
   */
  category: LedgerEventCategory;

  /**
   * Event type.
   * - For domain events: use LedgerEventType
   * - For ui_signal: free string (e.g. "UI_UPLOAD_STARTED")
   */
  type: LedgerEventType | string;

  /**
   * Event payload (opaque, append-only).
   * No logic should depend on payload shape.
   */
  payload: Record<string, unknown>;

  /**
   * ISO timestamp (event creation time).
   */
  created_at: string;
};