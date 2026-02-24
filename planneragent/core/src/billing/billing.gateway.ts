// core/src/billing/billing.gateway.ts
// =====================================================
// Billing Gateway — Canonical Entry Point
// P7.2 — Provider-neutral, pricing delegated to Market
// =====================================================

import { getBillingProvider } from "./billing.providers";
import { canCreateCheckout } from "./billing.policy";
import { quotePricingForPlanTier } from "../market/offers";

import type { PlanTier } from "../sandbox/contracts.v2";
import type { BillingCheckoutResult } from "./billing.providers";

export type CreateCheckoutInput = Readonly<{
  tenant_id: string;
  buyer_email: string;
  plan: PlanTier;
  now_utc: string;
}>;

export async function createCheckout(
  input: CreateCheckoutInput
): Promise<BillingCheckoutResult> {
  // ---------------------------------------------------
  // 1. Policy gate (pure allow / deny)
  // ---------------------------------------------------
  if (!canCreateCheckout(input.plan)) {
    throw new Error("CHECKOUT_NOT_ALLOWED");
  }

  // ---------------------------------------------------
  // 2. Pricing decision (Market = source of truth)
  // ---------------------------------------------------
  const pricing = quotePricingForPlanTier(input.plan, {
    now_utc: input.now_utc,
  });

  if (!pricing) {
    throw new Error("PLAN_NOT_PURCHASABLE");
  }

  // ---------------------------------------------------
  // 3. Delegate to billing provider
  // ---------------------------------------------------
  const provider = getBillingProvider();

  return provider.createCheckout({
    tenant_id: input.tenant_id,
    buyer_email: input.buyer_email,
    plan: pricing.plan,
    price_usd: pricing.price_usd,
    trial_days: pricing.trial_days,
  });
}