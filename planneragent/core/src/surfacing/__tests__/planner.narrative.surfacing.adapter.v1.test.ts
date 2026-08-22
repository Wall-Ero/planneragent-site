import { describe, expect, it } from "vitest";
import type { NarrativePolicyResult } from "../../sandbox/narrative/planner.narrative.policy";
import type { PlannerNarrativeRender } from "../../sandbox/narrative/planner.narrative.render";
import type { PlannerNarrativeUiState } from "../../sandbox/narrative/planner.narrative.ui";
import { convergePlannerNarrativeSurfacingCandidateV1 } from "../planner.narrative.surfacing.adapter.v1";

function trio() {
  const render: PlannerNarrativeRender = {
    headline: "Operational instability detected.",
    operationalSummary: "Observed inventory differs from recorded system state.",
    plannerStatement: "Operational stabilization is currently required.",
    urgencyStatement: "Operational pressure is building.",
    executionStatement: "Execution authority is currently restricted.",
  };
  const ui_state: PlannerNarrativeUiState = {
    cockpitTone: "ELEVATED",
    visualPressure: "MEDIUM",
    focusZone: "RECONCILIATION",
    chatPriority: "IMPORTANT",
    interactionPolicy: "LOCK_EXECUTION",
    governanceVisibility: "REVIEW_VISIBLE",
    tracePriority: "LOW",
    executionHighlight: false,
    stabilizationMode: true,
    recoveryVisible: true,
    governanceVisible: true,
    anomalyVisible: true,
  };
  const policy: NarrativePolicyResult = {
    valid: true,
    violations: [],
    severity: "MEDIUM",
    degraded: true,
    degradationReason: "observation_only_runtime",
    compactMode: false,
    suppressRecommendations: true,
    escalationEligible: false,
  };
  return { render, ui_state, policy };
}

describe("PLANNER-NARRATIVE-SURFACING-CANDIDATE-V1", () => {
  it("deterministically converges the live narrative trio", () => {
    const first = convergePlannerNarrativeSurfacingCandidateV1(trio());
    const second = convergePlannerNarrativeSurfacingCandidateV1(trio());
    expect(first).toEqual(second);
    expect(first).toMatchObject({
      version: 1,
      interaction_policy: "LOCK_EXECUTION",
      chat_priority: "IMPORTANT",
      policy: {
        valid: true,
        violations: [],
        severity: "MEDIUM",
        degraded: true,
        compact_mode: false,
        suppress_recommendations: true,
        escalation_eligible: false,
      },
    });
  });

  it("preserves exact statement text and canonical render ordering", () => {
    const candidate = convergePlannerNarrativeSurfacingCandidateV1(trio());
    expect(candidate?.statements).toEqual([
      { kind: "HEADLINE", text: "Operational instability detected." },
      { kind: "OPERATIONAL_SUMMARY", text: "Observed inventory differs from recorded system state." },
      { kind: "PLANNER_STATEMENT", text: "Operational stabilization is currently required." },
      { kind: "URGENCY_STATEMENT", text: "Operational pressure is building." },
      { kind: "EXECUTION_STATEMENT", text: "Execution authority is currently restricted." },
    ]);
  });

  it("preserves policy and interaction semantics without treating them as authority", () => {
    const input = trio();
    input.policy.valid = false;
    input.policy.violations = ["execution_posture_without_authority"];
    input.policy.escalationEligible = true;
    const candidate = convergePlannerNarrativeSurfacingCandidateV1(input);
    expect(candidate?.policy).toEqual({
      valid: false,
      violations: ["execution_posture_without_authority"],
      severity: "MEDIUM",
      degraded: true,
      compact_mode: false,
      suppress_recommendations: true,
      escalation_eligible: true,
    });
    expect(candidate?.interaction_policy).toBe("LOCK_EXECUTION");
    expect(candidate).not.toHaveProperty("authority");
    expect(candidate).not.toHaveProperty("allowed");
  });

  it("does not mutate inputs and returns recursively immutable candidate data", () => {
    const input = trio();
    const before = structuredClone(input);
    const candidate = convergePlannerNarrativeSurfacingCandidateV1(input);
    expect(input).toEqual(before);
    expect(Object.isFrozen(candidate)).toBe(true);
    expect(Object.isFrozen(candidate?.statements)).toBe(true);
    expect(candidate?.statements.every(Object.isFrozen)).toBe(true);
    expect(Object.isFrozen(candidate?.policy)).toBe(true);
    expect(Object.isFrozen(candidate?.policy.violations)).toBe(true);
  });

  it("omits absent optional statements without manufacturing filler", () => {
    const input = trio();
    delete input.render.urgencyStatement;
    delete input.render.executionStatement;
    const candidate = convergePlannerNarrativeSurfacingCandidateV1(input);
    expect(candidate?.statements.map(({ kind }) => kind)).toEqual([
      "HEADLINE", "OPERATIONAL_SUMMARY", "PLANNER_STATEMENT",
    ]);
  });

  it.each([
    ["empty required statement", (input: ReturnType<typeof trio>) => { input.render.headline = ""; }],
    ["blank optional statement", (input: ReturnType<typeof trio>) => { input.render.urgencyStatement = "  "; }],
    ["HTML statement", (input: ReturnType<typeof trio>) => { input.render.plannerStatement = "<strong>Act</strong>"; }],
    ["unknown posture", (input: ReturnType<typeof trio>) => { input.ui_state.interactionPolicy = "SHOW" as any; }],
    ["malformed policy", (input: ReturnType<typeof trio>) => { input.policy.severity = "EXTREME" as any; }],
  ] as const)("fails closed for %s", (_label, corrupt) => {
    const input = trio();
    corrupt(input);
    expect(convergePlannerNarrativeSurfacingCandidateV1(input)).toBeUndefined();
  });

  it("introduces no participant, admitted-content, identity, freshness, or delivery decisions", () => {
    const candidate = convergePlannerNarrativeSurfacingCandidateV1(trio());
    const serialized = JSON.stringify(candidate);
    for (const field of [
      "participant", "actor", "company", "tenant", "audience", "entitlement", "admitted", "allowed",
      "content_id", "source_ref", "source_digest", "evidence_refs", "causal_references", "issued_at",
      "expires_at", "fresh", "dedup", "delivery", "channel", "classification", "html", "actions",
    ]) expect(candidate).not.toHaveProperty(field);
    expect(serialized).not.toMatch(/ParticipantSurfacedContentV1|generatedByLlm/);
  });
});
