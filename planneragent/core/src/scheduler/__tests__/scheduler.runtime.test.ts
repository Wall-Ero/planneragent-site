import { describe, it, expect } from "vitest";
import { runGovernanceScheduler } from "../scheduler.runtime";
import type { GovernanceSchedulerInput } from "../scheduler.types";

describe("P7 — Governance Scheduler (OPEN SRL rule)", () => {

  it("TRIGGERS OPEN_SRL when all conditions are satisfied", async () => {
    const input: GovernanceSchedulerInput = {
      now_iso: new Date().toISOString(),
      open_srl_input: {
        cash_available_eur: 15000,
        active_junior_accounts: 6,
        junior_continuity_months: 3,
        has_real_usage: true,
        operational_friction_high: true,
        governs_real_systems: true,
        orchestrates_external_ai: false,
        used_in_decisional_contexts: true,
        founder_wants_institution: true
      }
    };

    const res = await runGovernanceScheduler(input);

    expect(res.ok).toBe(true);
    expect(res.action).toBe("OPEN_SRL_TRIGGERED");
  });

  it("DOES NOT trigger OPEN_SRL when conditions are not met", async () => {
    const input: GovernanceSchedulerInput = {
      now_iso: new Date().toISOString(),
      open_srl_input: {
        cash_available_eur: 2000,
        active_junior_accounts: 1,
        junior_continuity_months: 0,
        has_real_usage: false,
        operational_friction_high: false,
        governs_real_systems: false,
        orchestrates_external_ai: false,
        used_in_decisional_contexts: false,
        founder_wants_institution: false
      }
    };

    const res = await runGovernanceScheduler(input);

    expect(res.ok).toBe(true);
    expect(res.action).toBeUndefined();
  });
});