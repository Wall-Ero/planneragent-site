// core/src/market/discount.engine.ts
// =====================================================
// P7.3 — Discount Engine (Canonical)
// Deterministic · No marketing randomness · Cloudflare-safe
// =====================================================

import type { PlanTier } from "../sandbox/contracts.v2";
import {
  quotePricingForPlanTier,
  type PricingContext,
  type PricingDecision,
} from "./offers";

export type DiscountDecision = Readonly<{
  ok: true;
  plan: PlanTier;
  currency: "USD";
  final_price_usd: number;
  applied: PricingDecision["applied"];
  trial_days: number;
}> | Readonly<{
  ok: false;
  reason: string;
}>;

/**
 * Returns a final price decision for billing gateway.
 * Important:
 * - billing gateway must treat offers JSON as source-of-truth
 * - no provider-specific logic here
 */
export function computeDiscountedPrice(input: {
  plan: PlanTier;
  activated_at_utc?: string;
  now_utc?: string;
  phase?: PricingContext["phase"];
}): DiscountDecision {
  const now = input.now_utc ?? new Date().toISOString();

  const pricing = quotePricingForPlanTier(input.plan, {
    phase: input.phase,
    activated_at_utc: input.activated_at_utc,
    now_utc: now,
  });

  if (!pricing) {
    return { ok: false, reason: "TIER_NOT_PURCHASABLE_OR_NOT_AVAILABLE" };
  }

  return {
    ok: true,
    plan: pricing.plan,
    currency: "USD",
    final_price_usd: pricing.price_usd,
    applied: pricing.applied,
    trial_days: pricing.trial_days,
  };
}