// core/src/commercial/revenue.metrics.ts
// =====================================================
// P7.5 — Commercial Revenue Metrics (Ledger-derived)
// Deterministic · Read-only · Legal-grade
// =====================================================

import type { LedgerEvent } from "../ledger/ledger.event";

// -----------------------------------------------------
// Canonical output type
// -----------------------------------------------------

export type RevenueMetrics = Readonly<{
  total_revenue_usd: number;
  first_paid_event_at_iso: string | null;
  paid_event_count: number;
}>;

// -----------------------------------------------------
// Extract revenue metrics from ledger events
// -----------------------------------------------------

export function getCommercialMetrics(
  events: ReadonlyArray<LedgerEvent>
): RevenueMetrics {
  let total = 0;
  let firstPaid: string | null = null;
  let count = 0;

  for (const e of events) {
    if (e.category !== "commercial") continue;

    const amount = e.evidence?.amount_usd;
    if (typeof amount !== "number") continue;

    total += amount;
    count += 1;

    if (!firstPaid || e.recorded_at_iso < firstPaid) {
      firstPaid = e.recorded_at_iso;
    }
  }

  return {
    total_revenue_usd: total,
    first_paid_event_at_iso: firstPaid,
    paid_event_count: count,
  };
}