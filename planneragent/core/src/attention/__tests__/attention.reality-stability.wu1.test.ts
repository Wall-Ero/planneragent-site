import { describe, expect, it } from "vitest";
import { evaluateAttentionSubscriptions } from "../attention.engine";
import { buildAttentionNotificationPayload } from "../attention.notification.bridge";
import { AttentionSubscriptionStore } from "../attention.subscription";
import type { AttentionSubscription, AttentionTrigger, CreateAttentionSubscriptionInput } from "../attention.types";

const now = "2026-08-12T10:00:00.000Z";

function subscription(trigger: AttentionTrigger): AttentionSubscription {
  return {
    attention_id: `attention:${trigger}`,
    tenant_id: "default",
    company_id: "company-1",
    context_id: "scope:path:sku-1",
    actor_id: "actor-1",
    scope: "REALITY",
    trigger,
    priority: trigger === "REALITY_UNSTABLE" ? "CRITICAL" : "MEDIUM",
    status: "ACTIVE",
    noise_policy: "IMMEDIATE_ON_TRIGGER",
    target_ref: "path:sku-1",
    target_label: "SKU 1 path",
    human_request: "Watch Reality in this path.",
    created_at: now,
    updated_at: now,
  };
}

function evaluate(trigger: AttentionTrigger, reality: string) {
  return evaluateAttentionSubscriptions({
    subscriptions: [subscription(trigger)],
    context: {
      company_id: "company-1",
      context_id: "scope:path:sku-1",
      actor_id: "actor-1",
      now_iso: now,
      signals: { reality },
    },
  });
}

describe("REALITY-ATTN-WU1", () => {
  it.each([
    ["STABLE", false, false],
    ["SHIFTING", true, false],
    ["UNSTABLE", false, true],
    ["ASSUMED", false, false],
  ] as const)("matches canonical state %s exactly", (reality, shifting, unstable) => {
    expect(evaluate("REALITY_SHIFTING", reality).triggered).toHaveLength(shifting ? 1 : 0);
    expect(evaluate("REALITY_UNSTABLE", reality).triggered).toHaveLength(unstable ? 1 : 0);
  });

  it.each(["STABLE", "SHIFTING", "UNSTABLE", "ASSUMED"])(
    "does not execute legacy subscriptions against %s",
    (reality) => {
      expect(evaluate("REALITY_DRIFTING", reality).triggered).toHaveLength(0);
      expect(evaluate("REALITY_MISALIGNED", reality).triggered).toHaveLength(0);
    },
  );

  it("preserves event identity, scope, priority, and notification semantics", () => {
    const shifting = evaluate("REALITY_SHIFTING", "SHIFTING").triggered[0];
    const unstable = evaluate("REALITY_UNSTABLE", "UNSTABLE").triggered[0];
    expect(shifting).toMatchObject({
      attention_id: "attention:REALITY_SHIFTING",
      trigger: "REALITY_SHIFTING",
      scope: "REALITY",
      target_ref: "path:sku-1",
      priority: "MEDIUM",
      evidence: { reality: "SHIFTING" },
    });
    expect(unstable).toMatchObject({
      attention_id: "attention:REALITY_UNSTABLE",
      trigger: "REALITY_UNSTABLE",
      priority: "CRITICAL",
      evidence: { reality: "UNSTABLE" },
    });
    expect(buildAttentionNotificationPayload(shifting).title).toBe("Reality is shifting");
    expect(buildAttentionNotificationPayload(unstable).title).toBe("Reality is unstable");
    expect(buildAttentionNotificationPayload(shifting).metadata).toMatchObject({
      scope: "REALITY",
      trigger: "REALITY_SHIFTING",
    });
  });

  it("reads persisted legacy rows without rewriting identity", async () => {
    const rows = ["REALITY_DRIFTING", "REALITY_MISALIGNED"].map((trigger, index) => ({
      ...subscription(trigger as AttentionTrigger),
      attention_id: `legacy-${index + 1}`,
      trigger,
      condition_json: null,
      metadata_json: "{}",
      expires_at: null,
      last_checked_at: null,
      last_triggered_at: null,
    }));
    const db = {
      prepare: () => ({ bind: () => ({ all: async () => ({ results: rows }) }) }),
    } as unknown as D1Database;
    const stored = await new AttentionSubscriptionStore(db).getActive({
      company_id: "company-1",
      context_id: "scope:path:sku-1",
      now_iso: now,
    });
    expect(stored.map((item) => item.trigger)).toEqual([
      "REALITY_DRIFTING",
      "REALITY_MISALIGNED",
    ]);
  });

  it("allows only canonical Reality triggers in the creation type", () => {
    const shifting: CreateAttentionSubscriptionInput["trigger"] = "REALITY_SHIFTING";
    const unstable: CreateAttentionSubscriptionInput["trigger"] = "REALITY_UNSTABLE";
    // @ts-expect-error persisted legacy identity is not creation-facing
    const drifting: CreateAttentionSubscriptionInput["trigger"] = "REALITY_DRIFTING";
    // @ts-expect-error persisted legacy identity is not creation-facing
    const misaligned: CreateAttentionSubscriptionInput["trigger"] = "REALITY_MISALIGNED";
    expect([shifting, unstable, drifting, misaligned]).toHaveLength(4);
  });

  it.each(["REALITY_DRIFTING", "REALITY_MISALIGNED"])(
    "rejects legacy trigger %s at the runtime creation boundary",
    async (trigger) => {
      let writes = 0;
      const db = {
        prepare: () => {
          writes += 1;
          return { bind: () => ({ run: async () => ({}) }) };
        },
      } as unknown as D1Database;
      const store = new AttentionSubscriptionStore(db);
      const input = {
        company_id: "company-1",
        context_id: "scope:path:sku-1",
        actor_id: "actor-1",
        scope: "REALITY",
        trigger,
        human_request: "Create a legacy subscription.",
      } as unknown as CreateAttentionSubscriptionInput;

      await expect(store.create(input)).rejects.toThrow("Legacy Reality attention triggers");
      expect(writes).toBe(0);
    },
  );
});
