// core/src/executor/__tests__/executor.runtime.v1.test.ts
// =======================================================
// P5 — Executor FULL
// Status: CANONICAL · COMMIT-GATE
// Verifies: approved EXECUTE runs and returns audit_ref
// =======================================================

import { describe, it, expect } from "vitest";
import { runExecutionV1 } from "../executor.runtime.v1";
import type { ExecutionRequestV1 } from "../../../../contracts/executor/execution.request.v1";

describe("P5 — Executor runtime v1", () => {
  it("executes approved request and returns audit_ref", () => {
    const req: ExecutionRequestV1 = {
      request_id: "req-001",
      actor_id: "scm-001",
      company_id: "acme",
      intent: "EXECUTE",
      scope: {
        domain: "supply_chain",
        action: "replan",
      },
      approval: {
        approver_id: "human-001",
        approved_at: new Date().toISOString(),
      },
      payload: {},
    };

    const res = runExecutionV1(req, "audit-test-001");

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.audit_ref).toBeDefined();
    }
  });
});