// core/src/market/__tests__/trial_discount_rules.test.ts
// =====================================================
// P7.3 — Trial + Discount Rules (Canonical Tests)
// =====================================================

import { describe, it, expect } from "vitest";
import { computeTrialStatus } from "../trial.engine";
import { computeDiscountedPrice } from "../discount.engine";

describe("P7.3 — Trial + Discount Engine", () => {
  it("computes trial window deterministically (JUNIOR)", () => {
    const res = computeTrialStatus({
      plan: "JUNIOR",
      trial_started_at_utc: "2026-02-01T00:00:00.000Z",
      now_utc: "2026-02-10T00:00:00.000Z",
    });

    expect(res.trial_days).toBe(30);
    expect(res.is_trial_active).toBe(true);
    expect(res.days_remaining).toBeGreaterThan(0);
  });

  it("applies early activation price inside window (JUNIOR)", () => {
    const d = computeDiscountedPrice({
      plan: "JUNIOR",
      activated_at_utc: "2026-02-01T00:00:00.000Z",
      now_utc: "2026-02-10T00:00:00.000Z",
      phase: "pre_srl",
    });

    expect(d.ok).toBe(true);
    if (!d.ok) return;

    expect(d.applied).toBe("EARLY_ACTIVATION");
    expect(d.final_price_usd).toBe(699);
    expect(d.trial_days).toBe(30);
  });

  it("falls back to list price after early activation window (JUNIOR)", () => {
    const d = computeDiscountedPrice({
      plan: "JUNIOR",
      activated_at_utc: "2026-02-01T00:00:00.000Z",
      now_utc: "2026-03-15T00:00:00.000Z",
      phase: "pre_srl",
    });

    expect(d.ok).toBe(true);
    if (!d.ok) return;

    expect(d.applied).toBe("LIST");
    expect(d.final_price_usd).toBe(999);
  });

  it("returns not purchasable for GRADUATE", () => {
    const d = computeDiscountedPrice({
      plan: "GRADUATE",
      now_utc: "2026-02-10T00:00:00.000Z",
      phase: "pre_srl",
    });

    expect(d.ok).toBe(false);
  });
});