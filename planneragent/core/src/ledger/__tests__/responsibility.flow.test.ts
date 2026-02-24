import { describe, it, expect } from "vitest";
import {
  checkoutIntentDeclaredEvent,
  subscriptionStartedEvent,
} from "../responsibility.events";

describe("P7 – Responsibility Ledger (Legal Proof)", () => {
  it("records a complete commercial responsibility chain", () => {
    const intent = checkoutIntentDeclaredEvent({
      tenant_id: "tenant_123",
      plan: "JUNIOR",
    });

    const execution = subscriptionStartedEvent({
      external_ref: "sub_456",
      plan: "JUNIOR",
      trial_days: 30,
    });

    // ---- INTENT ----
    expect(intent.category).toBe("intent_declared");

    expect(intent.actor).toEqual({
      kind: "user",
      id: "tenant_123",
      role: "tenant_admin",
    });

    expect(intent.authority_scope).toBe("SUBSCRIPTION_PURCHASE");

    expect(intent.evidence).toEqual({
      plan: "JUNIOR",
    });

    // ---- EXECUTION ----
    expect(execution.category).toBe("execution_completed");

    expect(execution.actor.kind).toBe("external_service");
    expect(execution.actor.role).toBe("payment_processor");

    expect(execution.authority_scope).toBe("PAYMENT_CONFIRMATION");

    expect(execution.evidence).toEqual({
      external_ref: "sub_456",
      plan: "JUNIOR",
      trial_days: 30,
    });

    // ---- LEGAL PROOF ----
    expect(intent.recorded_at_iso).toBeDefined();
    expect(execution.recorded_at_iso).toBeDefined();

    expect(typeof intent.id).toBe("string");
    expect(typeof execution.id).toBe("string");
  });
});