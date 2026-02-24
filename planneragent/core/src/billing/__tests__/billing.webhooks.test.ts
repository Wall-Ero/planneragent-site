// core/src/billing/__tests__/billing.webhooks.test.ts
// =====================================================
// P7.2 — billing.webhooks.ts tests (Canonical)
// =====================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { billingWebhookRoute } from "../billing.webhooks";
import * as ledgerStore from "../../ledger/ledger.store";

describe("P7.2 — billingWebhookRoute", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("ignores unsupported webhook events without writing to ledger", async () => {
    const appendSpy = vi.spyOn(ledgerStore, "appendLedgerEvent").mockResolvedValue(undefined as any);

    const req = new Request("http://localhost/billing/webhook", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "evt_ignored",
        type: "something.unknown",
        data: { object: {} },
      }),
    });

    const res = await billingWebhookRoute(req);
    const json = (await res.json()) as any;

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.ignored).toBe(true);
    expect(appendSpy).not.toHaveBeenCalled();
  });

  it("writes ledger event for checkout.session.completed", async () => {
    const appendSpy = vi.spyOn(ledgerStore, "appendLedgerEvent").mockResolvedValue(undefined as any);

    const req = new Request("http://localhost/billing/webhook", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "evt_1",
        type: "checkout.session.completed",
        data: { object: { id: "cs_123" } },
      }),
    });

    const res = await billingWebhookRoute(req);
    const json = (await res.json()) as any;

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(appendSpy).toHaveBeenCalled();
  });
});