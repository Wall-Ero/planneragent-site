// core/src/commercial/srl.readiness.ts
// =====================================================
// P7.5 — SRL Readiness Evaluation (Canonical)
// Deterministic · Ledger-only · Idempotent
// =====================================================

import type { RevenueMetrics } from "./revenue.metrics";

export type SrlReadinessResult = Readonly<{
  ready: boolean;
  reasons: string[];

  total_revenue_usd: number;
  days_since_first_paid_event: number | null;
}>;

// -----------------------------------------------------
// Constants (PRE-SRL canonical rule)
// -----------------------------------------------------

const MIN_REVENUE_USD = 5000;
const MIN_DAYS_SINCE_FIRST_PAYMENT = 60;

// -----------------------------------------------------
// Core evaluator
// -----------------------------------------------------

export function evaluateSrlReadiness(
  metrics: RevenueMetrics,
  nowIso: string = new Date().toISOString()
): SrlReadinessResult {
  const reasons: string[] = [];

  // -------------------------------
  // Revenue check
  // -------------------------------

  if (metrics.total_revenue_usd < MIN_REVENUE_USD) {
    reasons.push(
      `Revenue below threshold (${metrics.total_revenue_usd} < ${MIN_REVENUE_USD} USD)`
    );
  }

  // -------------------------------
  // Time since first paid event
  // -------------------------------

  let daysSince: number | null = null;

  if (!metrics.first_paid_event_at_iso) {
    reasons.push("No paid events recorded yet");
  } else {
    const ms =
      Date.parse(nowIso) - Date.parse(metrics.first_paid_event_at_iso);
    daysSince = Math.floor(ms / (1000 * 60 * 60 * 24));

    if (daysSince < MIN_DAYS_SINCE_FIRST_PAYMENT) {
      reasons.push(
        `Too early since first payment (${daysSince} < ${MIN_DAYS_SINCE_FIRST_PAYMENT} days)`
      );
    }
  }

  return {
    ready: reasons.length === 0,
    reasons,

    total_revenue_usd: metrics.total_revenue_usd,
    days_since_first_paid_event: daysSince,
  };
}