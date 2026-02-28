// core/src/scheduler/scheduler.runtime.ts
// =====================================================
// Governance Scheduler Runtime (Canonical)
// =====================================================

import { evaluateSrlDecision } from "../commercial/srl.decision";
import type {
  GovernanceSchedulerInput,
  GovernanceSchedulerResult,
} from "./scheduler.types";

import { appendLedgerEvent } from "../ledger/ledger.store";
import { srlOpenTriggeredEvent } from "../ledger/responsibility.events";

export async function runGovernanceScheduler(
  input: GovernanceSchedulerInput
): Promise<GovernanceSchedulerResult> {
  const decision = evaluateSrlDecision(input.srl_decision_input);

  if (!decision.allowed) {
    return {
      action: "NO_ACTION",
      reasons: decision.blocking_reasons,
    };
  }

  // ---------------------------------------------------
  // Ledger — SRL decision (idempotency handled at store)
  // ---------------------------------------------------

  await appendLedgerEvent(
    srlOpenTriggeredEvent({
      decided_at_iso: input.now_iso,
    })
  );

  return {
    action: "OPEN_SRL_TRIGGERED",
  };
}