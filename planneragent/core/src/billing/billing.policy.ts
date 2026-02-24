// core/src/billing/billing.policy.ts
// =====================================================
// Billing Policy — Who can create a checkout
// Pure governance rule · Deterministic
// =====================================================

import type { PlanTier } from "../sandbox/contracts.v2";

// NOTE:
// - VISION is free
// - GRADUATE is internal
// - CHARTER is not purchasable
const PURCHASABLE_PLANS: readonly PlanTier[] = [
  "JUNIOR",
  "SENIOR",
  "PRINCIPAL",
];

export function canCreateCheckout(plan: PlanTier): boolean {
  return PURCHASABLE_PLANS.includes(plan);
}