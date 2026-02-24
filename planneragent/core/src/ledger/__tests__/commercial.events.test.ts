// core/src/ledger/__tests__/commercial.events.test.ts
// =====================================================
// P7.2 — Commercial Ledger Events Tests
// =====================================================

import { describe, it, expect } from "vitest";
import { subscriptionStartedEvent } from "../commercial.events";
  
describe("P7.2 — commercial.events", () => {
  it("creates SUBSCRIPTION_STARTED commercial event", () => {
    const evt = subscriptionStartedEvent({
      external_ref: "sub_456",
      plan: "JUNIOR",
      trial_days: 30,
    });

    expect(evt.category).toBe("commercial");
    expect(evt.type).toBe("SUBSCRIPTION_STARTED");

    expect(evt.payload).toEqual({
      external_ref: "sub_456",
      plan: "JUNIOR",
      trial_days: 30,
    });

    expect(typeof evt.id).toBe("string");
    expect(typeof evt.created_at).toBe("string");
  });
});