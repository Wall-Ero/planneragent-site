// core/src/billing/__tests__/routes.billing.test.ts
// =====================================================
// P7.2 — Billing Routes Tests (Canonical)
// Provider-neutral · Ledger-aware · Cloudflare-style
// =====================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { billingCheckoutRoute } from "../routes.billing";

// -----------------------------------------------------
// Mocks
// -----------------------------------------------------

vi.mock("../billing.gateway", () => ({
  createCheckout: vi.fn(async () => ({
    provider: "mock" as const,
    checkout_url: "https://checkout.mock/test",
  })),
}));

vi.mock("../../ledger/ledger.store", () => ({
  appendLedgerEvent: vi.fn(async () => undefined),
}));

// -----------------------------------------------------
// Helpers
// -----------------------------------------------------

function makeRequest(
  method: string,
  body?: unknown
): Request {
  return new Request("http://localhost/billing/checkout", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// -----------------------------------------------------
// Tests
// -----------------------------------------------------

describe("P7.2 — billingCheckoutRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates checkout and returns result", async () => {
    const req = makeRequest("POST", {
      plan: "JUNIOR",
      tenant_id: "t_demo",
      buyer_email: "a@b.com",
    });

    const res = await billingCheckoutRoute(req);
    const json = (await res.json()) as {
      ok: boolean;
      provider: "mock" | "stripe";
      checkout_url: string;
    };

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.provider).toBe("mock");
    expect(json.checkout_url).toContain("checkout.mock");
  });

  it("rejects non-POST methods", async () => {
    const req = makeRequest("GET");

    const res = await billingCheckoutRoute(req);
    const json = (await res.json()) as {
      ok: boolean;
      reason: string;
    };

    expect(res.status).toBe(405);
    expect(json.ok).toBe(false);
    expect(json.reason).toBe("METHOD_NOT_ALLOWED");
  });
});