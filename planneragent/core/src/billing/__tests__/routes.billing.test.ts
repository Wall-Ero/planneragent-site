// core/src/billing/__tests__/routes.billing.test.ts
// =====================================================
// P7.2 — routes.billing.ts tests (Canonical)
// =====================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { billingCheckoutRoute } from "../routes.billing";

import * as gateway from "../billing.gateway";
import * as ledgerStore from "../../ledger/ledger.store";

describe("P7.2 — billingCheckoutRoute", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects non-POST methods", async () => {
    const req = new Request("http://localhost/billing/checkout", { method: "GET" });

    const res = await billingCheckoutRoute(req);
    const json = (await res.json()) as any;

    expect(res.status).toBe(405);
    expect(json.ok).toBe(false);
    expect(json.reason).toBe("METHOD_NOT_ALLOWED");
  });

  it("rejects invalid plan tiers", async () => {
    const req = new Request("http://localhost/billing/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        plan: "NOT_A_PLAN",
        tenant_id: "t_demo",
        buyer_email: "a@b.com",
      }),
    });

    const res = await billingCheckoutRoute(req);
    const json = (await res.json()) as any;

    expect(res.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.reason).toBe("INVALID_PLAN_TIER");
  });

  it("creates checkout + writes ledger events", async () => {
    vi.spyOn(gateway, "createCheckout").mockResolvedValue({
      provider: "mock",
      checkout_url: "https://mock.checkout/t_demo/JUNIOR",
    });

    const appendSpy = vi.spyOn(ledgerStore, "appendLedgerEvent").mockResolvedValue(undefined as any);

    const req = new Request("http://localhost/billing/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        plan: "JUNIOR",
        tenant_id: "t_demo",
        buyer_email: "a@b.com",
      }),
    });

    const res = await billingCheckoutRoute(req);
    const json = (await res.json()) as any;

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.provider).toBe("mock");
    expect(typeof json.checkout_url).toBe("string");

    // At least: INTENT_DECLARED + EXECUTION_ATTEMPTED + CHECKOUT_CREATED
    expect(appendSpy).toHaveBeenCalled();
    expect(appendSpy.mock.calls.length).toBeGreaterThanOrEqual(3);
  });
});