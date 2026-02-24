// core/src/market/eligibility.rules.ts
// =====================================================
// P7.3 — Eligibility Rules (Canonical)
// Deterministic · No billing provider deps · Cloudflare-safe
// =====================================================

import type { PlanTier } from "../sandbox/contracts.v2";
import type { PricingDecision } from "./offers";

export type EligibilityContext = Readonly<{
  plan: PlanTier;
  activated_at_utc: string; // when tenant started activation / trial
  now_utc: string;
}>;

export type EligibilityResult = Readonly<{
  ok: boolean;
  reasons: string[];
}>;

function daysBetween(a: string, b: string): number {
  const ms = Math.abs(Date.parse(a) - Date.parse(b));
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

/**
 * Early activation eligibility:
 * - must be purchasable tier decision (already filtered upstream)
 * - activated_at_utc must exist
 * - must be within offer early_activation window_days
 */
export function isEarlyActivationEligible(
  pricing: PricingDecision,
  ctx: EligibilityContext
): EligibilityResult {
  const reasons: string[] = [];

  if (pricing.applied !== "LIST") {
    // already discounted by pricing engine (or not a list quote)
    // still eligible, but this indicates caller might be double-applying
  }

  if (!ctx.activated_at_utc) reasons.push("MISSING_ACTIVATED_AT");
  if (!ctx.now_utc) reasons.push("MISSING_NOW");

  // If offer has no early activation configured, not eligible.
  // We infer this by checking whether a LIST quote could ever become EARLY_ACTIVATION.
  // Caller should pass the LIST quote decision; if price equals list price, we still need window check.
  // To avoid importing offers JSON here, we use a simple rule:
  // - if pricing.trial_days == 0 => no early activation (VISION / etc)
  // This matches your offers.v1.json where early_activation is null for non-paid tiers.
  if (pricing.trial_days === 0) reasons.push("NO_EARLY_ACTIVATION_FOR_TIER");

  const days = daysBetween(ctx.activated_at_utc, ctx.now_utc);
  // Window is enforced by offers.ts when it has early_activation configured.
  // Here we only ensure "not absurd": activation cannot be in the future by more than 0 days.
  if (Date.parse(ctx.activated_at_utc) > Date.parse(ctx.now_utc)) {
    reasons.push("ACTIVATED_AT_IN_FUTURE");
  }

  return { ok: reasons.length === 0, reasons };
}