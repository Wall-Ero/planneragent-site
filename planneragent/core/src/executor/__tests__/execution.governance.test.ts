// core/src/executor/__tests__/executor.guard.test.ts

import { describe, test, expect } from "vitest";

import {
  assertExecutorAuthority,
  assertExecutorScope
} from "../executor.guard";

describe("Executor Guard", () => {

  test("should throw if human approval missing", () => {

    const req = {
      approver_id: undefined,
      approved_at: undefined,
      scope: {
        domain: "supply-chain",
        action: "RESCHEDULE_DELIVERY"
      }
    };

    expect(() =>
      assertExecutorAuthority(req as any)
    ).toThrow();

  });

  test("should allow execution when approval present", () => {

    const req = {
      approver_id: "scm-user",
      approved_at: "2026-01-01T10:00:00Z",
      scope: {
        domain: "supply-chain",
        action: "RESCHEDULE_DELIVERY"
      }
    };

    expect(() =>
      assertExecutorAuthority(req as any)
    ).not.toThrow();

  });

  test("should throw if scope missing", () => {

    const req = {
      approver_id: "scm-user",
      approved_at: "2026-01-01T10:00:00Z",
      scope: {}
    };

    expect(() =>
      assertExecutorScope(req as any)
    ).toThrow();

  });

  test("should allow valid scope", () => {

    const req = {
      approver_id: "scm-user",
      approved_at: "2026-01-01T10:00:00Z",
      scope: {
        domain: "supply-chain",
        action: "RESCHEDULE_DELIVERY"
      }
    };

    expect(() =>
      assertExecutorScope(req as any)
    ).not.toThrow();

  });

});