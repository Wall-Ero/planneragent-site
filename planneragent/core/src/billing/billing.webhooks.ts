// core/src/billing/billing.webhooks.ts
// =====================================================
// Billing Webhooks — Provider → Ledger Translation
// P7.2 — Append-only · Idempotent
// =====================================================

import { appendLedgerEvent } from "../ledger/ledger.store";
import type { LedgerEvent } from "../ledger/ledger.event";

type StripeWebhookEvent = {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
};

export async function billingWebhookRoute(req: Request): Promise<Response> {
  const raw = await req.text();

  // ⚠️ Firma Stripe: qui stub / mock / verify in prod
  // const signature = req.headers.get("stripe-signature");

  const event = JSON.parse(raw) as StripeWebhookEvent;

  let ledgerType: string | null = null;

  switch (event.type) {
    case "checkout.session.completed":
      ledgerType = "PAYMENT_SUCCEEDED";
      break;

    case "customer.subscription.deleted":
      ledgerType = "SUBSCRIPTION_CANCELED";
      break;

    default:
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        status: 200,
      });
  }

  const ledgerEvent: LedgerEvent = {
    id: crypto.randomUUID(),
    category: "commercial",
    type: ledgerType,
    payload: {
      provider: "stripe",
      raw_event_id: event.id,
    },
    created_at: new Date().toISOString(),
  };

  await appendLedgerEvent(ledgerEvent);

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}