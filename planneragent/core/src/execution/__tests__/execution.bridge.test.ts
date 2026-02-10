// core/src/execution/__tests__/execution.bridge.test.ts
// ======================================================
// Execution Governance Bridge — Tests V1
// ======================================================

import { describe, it, expect } from "vitest";
import { executeSafeBridgeV1 } from "../adapters/executor.safe.adapter.v1";

describe("Execution Governance Bridge", () => {

  it("blocks VISION execution", async () => {
    const res = await executeSafeBridgeV1({
      request_id: "r1",
      company_id: "c1",
      actor_id: "a1",

      plan: "VISION",
      intent: "EXECUTE",
      domain: "supply_chain",

      action_type: "send_email",
      payload: {},

      issued_at: new Date().toISOString()
    });

    expect(res.ok).toBe(false);
  });

  it("requires approval for JUNIOR", async () => {
    const res = await executeSafeBridgeV1({
      request_id: "r2",
      company_id: "c1",
      actor_id: "a1",

      plan: "JUNIOR",
      intent: "EXECUTE",
      domain: "supply_chain",

      action_type: "send_email",
      payload: {},

      issued_at: new Date().toISOString()
    });

    expect(res.ok).toBe(false);
  });

  it("allows JUNIOR with approval", async () => {
    const res = await executeSafeBridgeV1({
      request_id: "r3",
      company_id: "c1",
      actor_id: "a1",

      plan: "JUNIOR",
      intent: "EXECUTE",
      domain: "supply_chain",

      action_type: "send_email",
      payload: {},

      approved_by: "human-01",
      issued_at: new Date().toISOString()
    });

    expect(res.ok).toBe(true);
  });

  it("allows SENIOR with delegation", async () => {
    const res = await executeSafeBridgeV1({
      request_id: "r4",
      company_id: "c1",
      actor_id: "a1",

      plan: "SENIOR",
      intent: "EXECUTE",
      domain: "supply_chain",

      action_type: "update_plan",
      payload: {},

      delegation_ref: "deleg-001",
      issued_at: new Date().toISOString()
    });

    expect(res.ok).toBe(true);
  });

});