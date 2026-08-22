import { describe, expect, it } from "vitest";
import { enforceVisionExecutionBoundary } from "../../sandbox/authority/visionExecutionBoundary.v1";
import type { PlannerNarrativeSurfacingCandidateV1 } from "../planner.narrative.surfacing.candidate.contracts.v1";
import { createAnonymousVisionDirectResponseV1 } from "../anonymous.vision.direct.response.v1";

function candidate(): PlannerNarrativeSurfacingCandidateV1 {
  return {
    version: 1,
    statements: [
      { kind: "HEADLINE", text: "Operational instability detected." },
      { kind: "PLANNER_STATEMENT", text: "PlannerAgent is currently observing operational reality." },
    ],
    interaction_policy: "LOCK_EXECUTION",
    chat_priority: "IMPORTANT",
    policy: {
      valid: true,
      violations: [],
      severity: "MEDIUM",
      degraded: false,
      compact_mode: false,
      suppress_recommendations: true,
      escalation_eligible: false,
    },
  };
}

function project(overrides: Record<string, unknown> = {}) {
  return createAnonymousVisionDirectResponseV1({
    plan: "VISION",
    request_id: "request-1",
    context_request_id: "request-1",
    candidate: candidate(),
    vision_boundary: enforceVisionExecutionBoundary({
      plan: "VISION",
      executionAllowed: true,
      governanceReason: "upstream",
    }),
    ...overrides,
  });
}

describe("ANONYMOUS-VISION-DIRECT-RESPONSE-V1", () => {
  it("preserves statement text and order in an observational request-bound response", () => {
    expect(project()).toEqual({
      version: 1,
      request_id: "request-1",
      classification: {
        observational: true,
        request_bound: true,
        executable: false,
        participant: false,
        proactive: false,
      },
      source: "PLANNER_NARRATIVE_SURFACING_CANDIDATE_V1",
      statements: [
        { kind: "HEADLINE", text: "Operational instability detected." },
        { kind: "PLANNER_STATEMENT", text: "PlannerAgent is currently observing operational reality." },
      ],
    });
  });

  it("introduces no participant, identity, authority, Attention, or execution fields", () => {
    const response = project();
    const serialized = JSON.stringify(response);
    expect(serialized).not.toMatch(/tenant|company|membership|principal|oag|actor|attention|subscription|audience|authority|action_id|credential|ParticipantSurfacedContentV1/i);
  });

  it.each([
    ["non-VISION plan", { plan: "JUNIOR" }],
    ["request mismatch", { context_request_id: "request-2" }],
    ["missing candidate", { candidate: undefined }],
    ["invalid candidate policy", { candidate: { ...candidate(), policy: { ...candidate().policy, valid: false } } }],
    ["empty statements", { candidate: { ...candidate(), statements: [] } }],
    ["malformed statement", { candidate: { ...candidate(), statements: [{ kind: "HEADLINE", text: " " }] } }],
    ["execution-capable state", { vision_boundary: enforceVisionExecutionBoundary({ plan: "JUNIOR", executionAllowed: true, governanceReason: "allowed" }) }],
  ] as const)("fails closed for %s", (_label, overrides) => {
    expect(project(overrides as Record<string, unknown>)).toBeUndefined();
  });

  it("represents silence as absence and returns recursively immutable data", () => {
    expect(project({ candidate: undefined })).toBeUndefined();
    const response = project();
    expect(Object.isFrozen(response)).toBe(true);
    expect(Object.isFrozen(response?.classification)).toBe(true);
    expect(Object.isFrozen(response?.statements)).toBe(true);
    expect(response?.statements.every(Object.isFrozen)).toBe(true);
  });
});
