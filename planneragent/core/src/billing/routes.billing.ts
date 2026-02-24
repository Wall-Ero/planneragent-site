// core/src/billing/routes.billing.ts
// =====================================================
// Billing Routes — Canonical HTTP Entry Points
// P7.2 — Provider-neutral
// =====================================================

import { createCheckout } from "./billing.gateway";
import { appendLedgerEvent } from "../ledger/ledger.store";
import type { LedgerEvent } from "../ledger/ledger.event";
import type { PlanTier } from "../sandbox/contracts.v2";

type CheckoutRequestBody = {
  plan: PlanTier;
  tenant_id: string;
  buyer_email: string;
};

export async function billingCheckoutRoute(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ ok: false, reason: "METHOD_NOT_ALLOWED" }),
      { status: 405 }
    );
  }

  const body = (await req.json()) as CheckoutRequestBody;

  const result = await createCheckout({
    plan: body.plan,
    tenant_id: body.tenant_id,
    buyer_email: body.buyer_email,
    now_utc: new Date().toISOString(),
  });

  // ---------------------------------------------
  // Ledger — commercial event (append-only)
  // ---------------------------------------------
  const event: LedgerEvent = {
    id: crypto.randomUUID(),
    category: "commercial",
    type: "CHECKOUT_CREATED",
    payload: {
      tenant_id: body.tenant_id,
      plan: body.plan,
      provider: result.provider,
      checkout_url: result.checkout_url,
    },
    created_at: new Date().toISOString(),
  };

  await appendLedgerEvent(event);

  return new Response(JSON.stringify({ ok: true, ...result }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}