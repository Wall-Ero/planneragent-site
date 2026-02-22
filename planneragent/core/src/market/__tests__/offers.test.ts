// planneragent/core/src/market/__tests__/offers.test.ts
// =====================================================
// P7.1 — Offers Runtime Tests v1 (Canonical)
// =====================================================

import { describe, it, expect } from "vitest";

import { OFFERS_V1, quotePricingForPlanTier, quotePricingV1 } from "../offers";
import type { PlanTier } from "../../sandbox/contracts.v2";

describe("P7.1 — Offer & Pricing", () => {
  it("loads offers.v1.json and contains all plan tiers", () => {
    const keys = Object.keys(OFFERS_V1.tiers).sort();
    expect(keys).toEqual(
      ["VISION", "GRADUATE", "JUNIOR", "SENIOR", "PRINCIPAL", "CHARTER"].sort()
    );
  });

  it("VISION is free and purchasable", () => {
    const q = quotePricingForPlanTier("VISION" as PlanTier, {
      phase: "pre_srl",
      now_utc: "2026-02-22T00:00:00.000Z",
    });

    expect(q).not.toBeNull();
    if (!q) return;

    expect(q.price_usd).toBe(0);
    expect(q.currency).toBe("USD");
    expect(q.purchasable).toBe(true);
    expect(q.available).toBe(true);
  });

  it("JUNIOR applies early activation price within window", () => {
    const q = quotePricingForPlanTier("JUNIOR" as PlanTier, {
      phase: "pre_srl",
      activated_at_utc: "2026-02-01T00:00:00.000Z",
      now_utc: "2026-02-20T00:00:00.000Z", // 19 days
    });

    expect(q).not.toBeNull();
    if (!q) return;

    expect(q.applied).toBe("EARLY_ACTIVATION");
    expect(q.price_usd).toBe(699);
    expect(q.trial_days).toBe(30);
  });

  it("JUNIOR falls back to list price after window", () => {
    const q = quotePricingForPlanTier("JUNIOR" as PlanTier, {
      phase: "pre_srl",
      activated_at_utc: "2026-01-01T00:00:00.000Z",
      now_utc: "2026-02-20T00:00:00.000Z", // 50 days
    });

    expect(q).not.toBeNull();
    if (!q) return;

    expect(q.applied).toBe("LIST");
    expect(q.price_usd).toBe(999);
  });

  it("GRADUATE exists but is not purchasable", () => {
    const q = quotePricingForPlanTier("GRADUATE" as PlanTier, {
      phase: "pre_srl",
      now_utc: "2026-02-22T00:00:00.000Z",
    });

    expect(q).toBeNull();

    // But raw quote still works (for internal UI/debug)
    const raw = quotePricingV1("GRADUATE", {
      phase: "pre_srl",
      now_utc: "2026-02-22T00:00:00.000Z",
    });
    expect(raw.plan).toBe("GRADUATE");
    expect(raw.purchasable).toBe(false);
  });

  it("CHARTER exists but is not purchasable and not available", () => {
    const q = quotePricingForPlanTier("CHARTER" as PlanTier, {
      phase: "pre_srl",
      now_utc: "2026-02-22T00:00:00.000Z",
    });

    expect(q).toBeNull();

    const raw = quotePricingV1("CHARTER", {
      phase: "pre_srl",
      now_utc: "2026-02-22T00:00:00.000Z",
    });
    expect(raw.purchasable).toBe(false);
    expect(raw.available).toBe(false);
  });

  it("phase switching is data-driven", () => {
    const p = quotePricingV1("PRINCIPAL", {
      phase: "srl",
      activated_at_utc: "2026-02-01T00:00:00.000Z",
      now_utc: "2026-02-22T00:00:00.000Z",
    });

    expect(p.phase).toBe("srl");
    // availability is controlled by JSON; this test asserts the shape is consistent
    expect(typeof p.available).toBe("boolean");
  });
});