import { describe, it, expect } from "vitest";
import { evaluateOpenSrlRule } from "../open-srl.rule";

describe("Open SRL Governance Rule", () => {
  it("allows SRL opening only when ALL conditions are met", () => {
    const result = evaluateOpenSrlRule({
      cash_available_eur: 15_000,

      active_junior_accounts: 5,
      junior_continuity_months: 3,
      has_real_usage: true,

      operational_friction_high: true,

      governs_real_systems: true,
      orchestrates_external_ai: true,
      used_in_decisional_contexts: true,

      founder_wants_institution: true
    });

    expect(result.allowed).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });

  it("blocks SRL opening if even one condition is missing", () => {
    const result = evaluateOpenSrlRule({
      cash_available_eur: 8_000,

      active_junior_accounts: 2,
      junior_continuity_months: 1,
      has_real_usage: false,

      operational_friction_high: false,

      governs_real_systems: false,
      orchestrates_external_ai: false,
      used_in_decisional_contexts: false,

      founder_wants_institution: false
    });

    expect(result.allowed).toBe(false);
    expect(result.reasons.length).toBeGreaterThan(0);
  });
});