// core/src/scheduler/scheduler.runtime.ts
// ============================================
// P7.3 — Governance Scheduler Runtime (Canonical)
// Cloudflare-safe · Deterministic · No hard deps
// ============================================

import { evaluateOpenSrlRule } from "../governance/rules/open-srl.rule";
import type {
  GovernanceSchedulerInput,
  GovernanceSchedulerResult
} from "./scheduler.types";

export async function runGovernanceScheduler(
  input: GovernanceSchedulerInput
): Promise<GovernanceSchedulerResult> {

  const decision = evaluateOpenSrlRule(input.open_srl_input);

  // 🔹 RULE FIRED
  if (decision.allowed) {
    return {
      ok: true,
      action: "OPEN_SRL_TRIGGERED"
    };
  }

  // 🔹 NO-OP (canonical)
  return { ok: true };
}