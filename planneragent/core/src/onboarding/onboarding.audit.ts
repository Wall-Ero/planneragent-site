// core/src/onboarding/onboarding.audit.ts
// =====================================================
// Onboarding Audit — Ledger bridge
// =====================================================

import { writeLedgerEvent } from "../ledger/writeLedgerEvent";
import type { LedgerEvent } from "../ledger/ledger.event";

export async function auditOnboardingStep(
  tenant_id: string,
  step: string,
  evidence: Record<string, unknown> = {}
): Promise<void> {
  const event: LedgerEvent = {
    id: crypto.randomUUID(),
    recorded_at_iso: new Date().toISOString(),
    category: "onboarding",
    statement: `Onboarding step completed: ${step}`,
    actor: {
      kind: "system",
    },
    system_state: "onboarding",
    evidence: {
      tenant_id,
      step,
      ...evidence,
    },
  };

  await writeLedgerEvent(event);
}