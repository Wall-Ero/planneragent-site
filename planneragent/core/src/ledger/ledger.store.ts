// core/src/ledger/ledger.store.ts
// ======================================================
// Ledger Store — In-memory (PRE-SRL)
// Replace with D1 later (same interface)
// ======================================================

import type { LedgerEvent } from "./ledger.event";

const ledger: LedgerEvent[] = [];

export function appendLedgerEvent(event: LedgerEvent): void {
  ledger.push(event);
}

export function getLedgerEvents(type?: string): LedgerEvent[] {
  return type ? ledger.filter(e => e.type === type) : [...ledger];
}