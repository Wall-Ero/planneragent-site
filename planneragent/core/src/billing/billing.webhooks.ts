// core/src/billing/billing.webhooks.ts
// =====================================================
// Billing Webhooks → Responsibility Ledger
// Append-only · Idempotent · Legal-grade
// =====================================================

import { appendLedgerEvent } from "../ledger/ledger.store";
import {
  subscriptionStartedEvent,
} from "../ledger/responsibility.events";

type StripeWebhookEvent = {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
};

export async function billingWebhookRoute(
  req: Request
): Promise<Response> {
  const raw = await req.text();

  // In produzione: verifica firma Stripe
  const event = JSON.parse(raw) as StripeWebhookEvent;

  switch (event.type) {
    case "checkout.session.completed": {
      /**
       * RESPONSIBILITY:
       * External payment provider confirms subscription activation
       */
      const ledgerEvent = subscriptionStartedEvent({
        external_ref: event.id,
        plan: "JUNIOR",        // TODO: estrarre da payload Stripe
        trial_days: 30,        // TODO: estrarre da payload Stripe
      });

      await appendLedgerEvent(ledgerEvent);

      return new Response(
        JSON.stringify({ ok: true }),
        { status: 200 }
      );
    }

    default:
      // Explicitly ignored but acknowledged
      return new Response(
        JSON.stringify({ ok: true, ignored: true }),
        { status: 200 }
      );
  }
}