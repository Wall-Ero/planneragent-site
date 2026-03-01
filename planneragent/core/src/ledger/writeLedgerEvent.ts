// core/src/ledger/writeLedgerEvent.ts
// =====================================================
// Ledger Writer — Append-only, side-effect boundary
// =====================================================

import type { LedgerEvent } from "./ledger.event";

export async function writeLedgerEvent(event: LedgerEvent): Promise<void> {
  // P7 canonical: append-only ledger
  // In PRE-SRL this can be in-memory / console / D1 stub

  // eslint-disable-next-line no-console
  console.log("[LEDGER]", JSON.stringify(event));

  // Future:
  // - persist to D1
  // - ensure idempotency
}