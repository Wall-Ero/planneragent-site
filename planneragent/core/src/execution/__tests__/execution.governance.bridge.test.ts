// core/src/executor/__tests__/execution.governance.bridge.test.ts
// ======================================================
// Execution Governance Bridge — Tests v1
// ======================================================

import { describe, it, expect } from "vitest";
import { executionGovernanceBridge } from "../execution.governance.bridge";

describe("Execution Governance Bridge", () => {
  it("blocks execution for GRADUATE", () => {
    const res = executionGovernanceBridge(
      {
        request_id: "r1",
        company_id: "c1",
        plan: "GRADUATE",
        intent: "EXECUTE",
        domain: "supply_chain",
        actor_id: "u1",
        action: { type: "SEND_EMAIL", payload: {} },
        issued_at: new Date().toISOString()
      },
      { charterEnabled: true }
    );

    expect(res.ok).toBe(false);
  });

  it("blocks execution when charter disabled", () => {
    const res = executionGovernanceBridge(
      {
        request_id: "r2",
        company_id: "c1",
        plan: "SENIOR",
        intent: "EXECUTE",
        domain: "supply_chain",
        actor_id: "u2",
        action: { type: "UPDATE_PLAN", payload: {} },
        issued_at: new Date().toISOString()
      },
      { charterEnabled: false }
    );

    expect(res.ok).toBe(false);
  });

  it("allows execution for SENIOR when charter enabled", () => {
    const res = executionGovernanceBridge(
      {
        request_id: "r3",
        company_id: "c1",
        plan: "SENIOR",
        intent: "EXECUTE",
        domain: "supply_chain",
        actor_id: "u3",
        action: { type: "UPDATE_PLAN", payload: {} },
        issued_at: new Date().toISOString()
      },
      { charterEnabled: true }
    );

    expect(res.ok).toBe(true);
  });
});