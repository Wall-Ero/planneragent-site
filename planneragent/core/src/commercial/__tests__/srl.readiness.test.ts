import { describe, it, expect } from "vitest";
import { evaluateSrlReadiness } from "../srl.readiness";
import type { RevenueMetrics } from "../revenue.metrics";

describe("P7.5 — SRL readiness (5000 USD + 60 days)", () => {
  it("is NOT ready if revenue is below threshold", () => {
    const metrics: RevenueMetrics = {
      total_revenue_usd: 1200,
      first_paid_event_at_iso: "2026-01-01T00:00:00.000Z",
      paid_event_count: 3,
    };

    const res = evaluateSrlReadiness(
      metrics,
      "2026-03-15T00:00:00.000Z"
    );

    expect(res.ready).toBe(false);
    expect(res.total_revenue_usd).toBe(1200);
    expect(res.reasons.length).toBeGreaterThan(0);
  });

  it("is NOT ready if 60 days have not passed yet", () => {
    const metrics: RevenueMetrics = {
      total_revenue_usd: 8000,
      first_paid_event_at_iso: "2026-02-20T00:00:00.000Z",
      paid_event_count: 2,
    };

    const res = evaluateSrlReadiness(
      metrics,
      "2026-03-15T00:00:00.000Z"
    );

    expect(res.ready).toBe(false);
    expect(res.days_since_first_paid_event).toBeLessThan(60);
  });

  it("IS ready when revenue >= 5000 USD AND 60 days passed", () => {
    const metrics: RevenueMetrics = {
      total_revenue_usd: 5100,
      first_paid_event_at_iso: "2026-01-01T00:00:00.000Z",
      paid_event_count: 4,
    };

    const res = evaluateSrlReadiness(
      metrics,
      "2026-03-15T00:00:00.000Z"
    );

    expect(res.ready).toBe(true);
    expect(res.total_revenue_usd).toBe(5100);
    expect(res.days_since_first_paid_event).toBeGreaterThanOrEqual(60);
    expect(res.reasons).toEqual([]);
  });

  it("is NOT ready if no paid events exist", () => {
    const metrics: RevenueMetrics = {
      total_revenue_usd: 0,
      first_paid_event_at_iso: null,
      paid_event_count: 0,
    };

    const res = evaluateSrlReadiness(
      metrics,
      "2026-03-15T00:00:00.000Z"
    );

    expect(res.ready).toBe(false);
    expect(res.days_since_first_paid_event).toBeNull();
  });
});