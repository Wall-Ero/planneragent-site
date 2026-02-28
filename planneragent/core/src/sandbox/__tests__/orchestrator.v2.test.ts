// core/src/sandbox/__tests__/orchestrator.v2.test.ts


import { describe, it, expect } from "vitest";
import { evaluateSandboxV2 } from "../orchestrator.v2";
import type {
  SignedSnapshotV1,
  SandboxEvaluateRequestV2
} from "../contracts.v2";

function baseSnapshot(overrides?: Partial<SignedSnapshotV1>): SignedSnapshotV1 {
  return {
    v: 1,
    company_id: "c1",
    request_id: "r1",
    plan: "JUNIOR",
    intent: "EXECUTE",
    domain: "governance",
    actor_id: "founder",

    legal_state: "PRE_SRL", // 🔴 OBBLIGATORIO

    oag_proof: {
      company_id: "c1",
      actor_id: "founder",
      plan: "JUNIOR",
      domain: "governance",
      intent: "EXECUTE",
      issued_at: new Date().toISOString(),
      authority: "human",
    },

    budget: {
      budget_remaining_eur: 100,
      reset_at: new Date().toISOString(),
    },

    governance_flags: {
      sovereignty: "paid",
    },

    issued_at: new Date().toISOString(),
    signature: "test-signature",

    ...overrides,
  };
}

describe("evaluateSandboxV2 — canonical execution rules", () => {
  it("allows execution for JUNIOR in PRE_SRL (canonical)", async () => {
    const snapshot = baseSnapshot();

    const req: SandboxEvaluateRequestV2 = {
      company_id: "c1",
      request_id: "r1",
      plan: "JUNIOR",
      intent: "EXECUTE",
      domain: "governance",
      actor_id: "founder",
      baseline_snapshot_id: "b1",
      baseline_metrics: {},
      snapshot,
    };

    const res = await evaluateSandboxV2(req);

    expect(res.ok).toBe(true);

    if (res.ok) {
      expect(res.governance.execution_allowed).toBe(true);
    }
  });
});