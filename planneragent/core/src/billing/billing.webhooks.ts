// core/src/billing/billing.webhooks.ts
// =====================================================
// Billing Webhooks → Responsibility Ledger
// Append-only · Idempotent · Legal-grade
// =====================================================

import { appendLedgerEvent } from "../ledger/ledger.store";
import {
  subscriptionStartedEvent,
} from "../ledger/responsibility.events";

// -----------------------------------------------------
// Minimal Stripe webhook shape (intentionally loose)
// -----------------------------------------------------

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

  // In produzione: verifica firma Stripe (qui volutamente esclusa)
  const event = JSON.parse(raw) as StripeWebhookEvent;

  switch (event.type) {
    case "checkout.session.completed": {
      /**
       * RESPONSIBILITY EVENT:
       * External payment provider confirms subscription activation.
       * This is legal-grade evidence.
       */

      // ⚠️ PRE-SRL:
      // Stripe payload parsing è volutamente minimale.
      // I valori reali verranno estratti quando Stripe è live.
      const ledgerEvent = subscriptionStartedEvent({
        external_ref: event.id,
        plan: "JUNIOR",     // TODO: estrarre da metadata Stripe
        trial_days: 30,     // TODO: estrarre da subscription
        amount_usd: 999,    // TODO: estrarre da invoice.amount_paid / 100
      });

      await appendLedgerEvent(ledgerEvent);

      return new Response(
        JSON.stringify({ ok: true }),
        { status: 200 }
      );
    }

    default:
      // Explicitly ignored but acknowledged (idempotent-safe)
      return new Response(
        JSON.stringify({ ok: true, ignored: true }),
        { status: 200 }
      );
  }
}