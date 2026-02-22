// planneragent/core/src/market/offers.ts
// =====================================================
// P7.1 — Offer & Pricing Runtime v1 (Canonical)
// Cloudflare-safe · Deterministic · No billing deps
// =====================================================

import type { PlanTier } from "../sandbox/contracts.v2";
import offersJson from "../../../contracts/market/offers.v1.json";

import {
  validateOffersV1,
  type OffersV1,
  type MarketPhase,
} from "./offers.validate";

// -----------------------------------------------------
// Load + validate canonical offers JSON
// -----------------------------------------------------

export const OFFERS_V1: OffersV1 = validateOffersV1(offersJson);

// -----------------------------------------------------
// Types
// -----------------------------------------------------

export type PricingContext = Readonly<{
  phase?: MarketPhase; // pre_srl | srl (default: pre_srl)
  activated_at_utc?: string; // ISO date when user started activation
  now_utc?: string; // injected for deterministic tests
}>;

export type PricingDecision = Readonly<{
  plan: PlanTier;
  currency: "USD";
  price_usd: number;
  applied: "LIST" | "EARLY_ACTIVATION";
  trial_days: number;

  // Exposure controls
  visible_on_site: boolean;
  purchasable: boolean;
  available: boolean;
  phase: MarketPhase;
}>;

// -----------------------------------------------------
// Helpers
// -----------------------------------------------------

function phaseOf(ctx?: PricingContext): MarketPhase {
  return ctx?.phase ?? "pre_srl";
}

function nowIso(ctx?: PricingContext): string {
  return ctx?.now_utc ?? new Date().toISOString();
}

function daysBetween(a: string, b: string): number {
  const ms = Math.abs(Date.parse(a) - Date.parse(b));
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

// -----------------------------------------------------
// Public guards
// -----------------------------------------------------

export function isKnownPlanTier(plan: PlanTier): plan is keyof OffersV1["tiers"] {
  // PlanTier in contracts.v2 is the superset; offers.v1.json must keep all keys
  return plan in OFFERS_V1.tiers;
}

export function getOfferV1(plan: keyof OffersV1["tiers"]) {
  return OFFERS_V1.tiers[plan];
}

export function isTierAvailable(plan: PlanTier, ctx?: PricingContext): boolean {
  if (!isKnownPlanTier(plan)) return false;
  const tier = OFFERS_V1.tiers[plan];
  const phase = phaseOf(ctx);
  return Boolean(tier.availability?.[phase]);
}

// -----------------------------------------------------
// Core pricing logic (deterministic)
// -----------------------------------------------------

export function quotePricingV1(
  plan: keyof OffersV1["tiers"],
  ctx?: PricingContext
): PricingDecision {
  const tier = OFFERS_V1.tiers[plan];
  const phase = phaseOf(ctx);

  const available = Boolean(tier.availability?.[phase]);

  // Base (list price)
  let price = tier.list_price_usd;
  let applied: PricingDecision["applied"] = "LIST";

  // Early activation logic (if defined)
  if (tier.early_activation && ctx?.activated_at_utc) {
    const days = daysBetween(ctx.activated_at_utc, nowIso(ctx));
    if (days <= tier.early_activation.window_days) {
      price = tier.early_activation.price_usd;
      applied = "EARLY_ACTIVATION";
    }
  }

  return {
    plan,
    currency: "USD",
    price_usd: price,
    applied,
    trial_days: tier.trial_days,

    visible_on_site: tier.visible_on_site,
    purchasable: tier.purchasable,
    available,
    phase,
  };
}

/**
 * Returns pricing decision or null if the tier is not purchasable
 * or not available in the current market phase.
 *
 * NOTE:
 * - tiers exist for ALL plan levels (VISION..CHARTER)
 * - “propose or not” is controlled by tier.availability + purchasable
 *   (pre_srl vs srl requires only JSON edits, no TS changes)
 */
export function quotePricingForPlanTier(
  plan: PlanTier,
  ctx?: PricingContext
): PricingDecision | null {
  if (!isKnownPlanTier(plan)) return null;

  const q = quotePricingV1(plan, ctx);
  if (!q.available) return null;
  if (!q.purchasable) return null;

  return q;
}