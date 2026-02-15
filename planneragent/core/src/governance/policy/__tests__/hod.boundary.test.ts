/**
 * PATH: core/src/governance/policy/__tests__/hod.boundary.test.ts
 *
 * P4.3 — Governance Boundary + Human Override (HOD)
 * Status: CANONICAL TEST
 *
 * Verifies:
 * - Action is blocked without authority
 * - HOD is policy-gated
 * - Override allows execution ONLY when enabled
 */

import { describe, it, expect, beforeAll } from "vitest";

import { bootstrapGovernance } from "../bootstrap";
import { isHodEnabled } from "../hod";
import { assertGovernanceBoundary } from "../boundary";

describe("P4.3 — Governance Boundary + Human Override", () => {
  beforeAll(async () => {
    await bootstrapGovernance();
  });

  it("blocks execution without authority", () => {
    const res = assertGovernanceBoundary({
      hasAuthority: false,
      humanOverride: false,
    });

    expect(res.ok).toBe(false);
  });

  it("blocks execution when HOD is disabled", () => {
    if (isHodEnabled()) return; // skip if policy enables HOD

    const res = assertGovernanceBoundary({
      hasAuthority: true,
      humanOverride: true,
    });

    expect(res.ok).toBe(false);
  });

  it("allows execution when HOD is enabled and override is present", () => {
    if (!isHodEnabled()) return; // skip if policy disables HOD

    const res = assertGovernanceBoundary({
      hasAuthority: true,
      humanOverride: true,
    });

    expect(res.ok).toBe(true);
  });
});