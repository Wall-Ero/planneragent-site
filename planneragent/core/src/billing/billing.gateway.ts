// core/src/billing/billing.gateway.ts
// =====================================================
// P7.2 — Billing Gateway (Canonical)
// Provider-neutral · Reads ONLY offers.ts
// =====================================================

import { quotePricingForPlanTier } from "../market/offers";
import { canCreateCheckout } from "./billing.policy";
import { getBillingProvider } from "./billing.providers";
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
  // 1. Policy gate
  if (!canCreateCheckout(input.plan)) {
    throw new Error("CHECKOUT_NOT_ALLOWED_FOR_PLAN");
  }

  // 2. Deterministic pricing (domain-owned)
  const pricing = quotePricingForPlanTier(input.plan, {
    phase: "pre_srl",
    now_utc: input.now_utc,
  });

  if (!pricing) {
    throw new Error("PLAN_NOT_PURCHASABLE");
  }

  // 3. Provider delegation
  const provider = getBillingProvider();

  return provider.createCheckout({
    tenant_id: input.tenant_id,
    buyer_email: input.buyer_email,
    plan: pricing.plan,
    price_usd: pricing.price_usd,
    trial_days: pricing.trial_days,
  });
}