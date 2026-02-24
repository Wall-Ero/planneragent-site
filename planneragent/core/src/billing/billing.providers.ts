// core/src/billing/billing.providers.ts
// =====================================================
// P7.2 — Billing Providers (Canonical)
// Stripe lives HERE, nowhere else
// =====================================================

export type BillingCheckoutRequest = Readonly<{
  tenant_id: string;
  buyer_email: string;
  plan: string;
  price_usd: number;
  trial_days: number;
}>;

export type BillingCheckoutResult = Readonly<{
  provider: "stripe" | "mock";
  checkout_url: string;
}>;

export interface BillingProvider {
  createCheckout(
    input: BillingCheckoutRequest
  ): Promise<BillingCheckoutResult>;
}

// -----------------------------------------------------
// Mock provider (dev / test)
// -----------------------------------------------------

const mockProvider: BillingProvider = {
  async createCheckout(input) {
    return {
      provider: "mock",
      checkout_url: `https://mock.checkout/${input.tenant_id}/${input.plan}`,
    };
  },
};

// -----------------------------------------------------
// Stripe provider (placeholder, real impl later)
// -----------------------------------------------------

const stripeProvider: BillingProvider = {
  async createCheckout(input) {
    // 🔒 Stripe SDK WILL live here (later)
    return {
      provider: "stripe",
      checkout_url: "https://checkout.stripe.com/pay/test",
    };
  },
};

// -----------------------------------------------------
// Provider resolver
// -----------------------------------------------------

export function getBillingProvider(): BillingProvider {
  // PRE-SRL: mock by default
  return mockProvider;
}