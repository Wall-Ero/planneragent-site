// planneragent/core/src/market/offers.validate.ts
// =====================================================
// P7.1 — Offers Schema + Validator v1 (Canonical)
// Deterministic · No billing deps
// =====================================================

import { z } from "zod";

export const PLAN_TIERS = [
  "VISION",
  "GRADUATE",
  "JUNIOR",
  "SENIOR",
  "PRINCIPAL",
  "CHARTER",
] as const;

export type PlanTier = (typeof PLAN_TIERS)[number];

export const PlanTierSchema = z.enum(PLAN_TIERS);

export const MarketPhaseSchema = z.enum(["pre_srl", "srl"]);
export type MarketPhase = z.infer<typeof MarketPhaseSchema>;

const EarlyActivationSchema = z
  .object({
    price_usd: z.number().int().min(0),
    window_days: z.number().int().min(1),
  })
  .strict();

const AvailabilitySchema = z
  .object({
    pre_srl: z.boolean(),
    srl: z.boolean(),
  })
  .strict();

const OfferTierSchema = z
  .object({
    plan: PlanTierSchema,
    list_price_usd: z.number().int().min(0),
    trial_days: z.number().int().min(0),
    early_activation: EarlyActivationSchema.nullable(),
    visible_on_site: z.boolean(),

    // Whether the tier can be activated/purchased via self-service flow
    purchasable: z.boolean(),

    // Phase switch should NOT require code changes
    availability: AvailabilitySchema,
  })
  .strict();

export const OffersV1Schema = z
  .object({
    version: z.literal("v1"),
    currency: z.literal("USD"),
    generated_at_utc: z.string().min(1),
    tiers: z
      .object({
        VISION: OfferTierSchema,
        GRADUATE: OfferTierSchema,
        JUNIOR: OfferTierSchema,
        SENIOR: OfferTierSchema,
        PRINCIPAL: OfferTierSchema,
        CHARTER: OfferTierSchema,
      })
      .strict(),
  })
  .strict();

export type OfferTier = z.infer<typeof OfferTierSchema>;
export type OffersV1 = z.infer<typeof OffersV1Schema>;

export function validateOffersV1(input: unknown): OffersV1 {
  const parsed = OffersV1Schema.parse(input);

  // Invariant: key must match tier.plan
  for (const [k, v] of Object.entries(parsed.tiers)) {
    if (k !== v.plan) {
      throw new Error(
        `offers.v1.json invariant violated: key=${k} plan=${v.plan}`
      );
    }
  }

  // Canonical: VISION must be free
  if (parsed.tiers.VISION.list_price_usd !== 0) {
    throw new Error(
      "offers.v1.json invariant violated: VISION must be free (list_price_usd=0)."
    );
  }

  // Canonical: If early_activation exists, it must be <= list price
  for (const tier of Object.values(parsed.tiers)) {
    if (tier.early_activation) {
      if (tier.early_activation.price_usd > tier.list_price_usd) {
        throw new Error(
          `offers.v1.json invariant violated: early_activation.price_usd > list_price_usd for ${tier.plan}`
        );
      }
    }
  }

  return parsed;
}