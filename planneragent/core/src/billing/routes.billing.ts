// core/src/billing/routes.billing.ts
// =====================================================
// Billing Routes — Canonical HTTP Entry Points
// P7.2 — Responsibility-aware
// =====================================================

import { createCheckout } from "./billing.gateway";
import { appendLedgerEvent } from "../ledger/ledger.store";
import { checkoutIntentDeclaredEvent } from "../ledger/responsibility.events";
import type { LedgerEvent } from "../ledger/ledger.event";
import type { PlanTier } from "../sandbox/contracts.v2";

// -----------------------------------------------------
// Runtime guard (HTTP → Domain boundary)
// -----------------------------------------------------

function isPlanTier(value: string): value is PlanTier {
  return [
    "VISION",
    "JUNIOR",
    "SENIOR",
    "PRINCIPAL",
    "GRADUATE",
    "CHARTER",
  ].includes(value);
}

type CheckoutRequestBody = {
  plan: string; // HTTP is string. Period.
  tenant_id: string;
  buyer_email: string;
};

// -----------------------------------------------------
// Route
// -----------------------------------------------------

export async function billingCheckoutRoute(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ ok: false, reason: "METHOD_NOT_ALLOWED" }),
      { status: 405 }
    );
  }

  const body = (await req.json()) as CheckoutRequestBody;

  // ---------------------------------------------------
  // 🔒 TYPE NARROWING (this is the missing piece)
  // ---------------------------------------------------
  if (!isPlanTier(body.plan)) {
    return new Response(
      JSON.stringify({ ok: false, reason: "INVALID_PLAN_TIER" }),
      { status: 400 }
    );
  }

  const plan: PlanTier = body.plan;

  // ---------------------------------------------------
  // Ledger — Intent declared (responsibility)
  // ---------------------------------------------------
  const intentEvent: LedgerEvent = checkoutIntentDeclaredEvent({
    tenant_id: body.tenant_id,
    plan,
  });

  await appendLedgerEvent(intentEvent);

  // ---------------------------------------------------
  // Domain execution
  // ---------------------------------------------------
  const result = await createCheckout({
    tenant_id: body.tenant_id,
    buyer_email: body.buyer_email,
    plan,
    now_utc: new Date().toISOString(),
  });

  return new Response(JSON.stringify({ ok: true, ...result }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}