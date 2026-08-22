import type { NarrativePolicyResult } from "../sandbox/narrative/planner.narrative.policy";
import type { PlannerNarrativeRender } from "../sandbox/narrative/planner.narrative.render";
import type { PlannerNarrativeUiState } from "../sandbox/narrative/planner.narrative.ui";
import type {
  PlannerNarrativeCandidateStatementV1,
  PlannerNarrativeSurfacingCandidateV1,
} from "./planner.narrative.surfacing.candidate.contracts.v1";

const severities = new Set(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
const interactionPolicies = new Set(["NORMAL", "REDUCE_NOISE", "LOCK_EXECUTION", "GUIDED_RECOVERY"]);
const chatPriorities = new Set(["NORMAL", "IMPORTANT", "URGENT"]);

function usableText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && !/<\/?[A-Za-z][^>]*>/.test(value);
}

function optionalStatement(
  kind: PlannerNarrativeCandidateStatementV1["kind"],
  value: unknown,
): PlannerNarrativeCandidateStatementV1 | undefined | false {
  if (value === undefined) return undefined;
  if (!usableText(value)) return false;
  return Object.freeze({ kind, text: value });
}

export function convergePlannerNarrativeSurfacingCandidateV1(input: Readonly<{
  render: PlannerNarrativeRender;
  ui_state: PlannerNarrativeUiState;
  policy: NarrativePolicyResult;
}>): PlannerNarrativeSurfacingCandidateV1 | undefined {
  const { render, ui_state: uiState, policy } = input;

  if (!render || !uiState || !policy) return undefined;
  if (!usableText(render.headline) || !usableText(render.operationalSummary) || !usableText(render.plannerStatement)) {
    return undefined;
  }
  if (!interactionPolicies.has(uiState.interactionPolicy) || !chatPriorities.has(uiState.chatPriority)) {
    return undefined;
  }
  if (
    typeof policy.valid !== "boolean" ||
    !Array.isArray(policy.violations) ||
    policy.violations.some((violation) => !usableText(violation)) ||
    !severities.has(policy.severity) ||
    typeof policy.degraded !== "boolean" ||
    typeof policy.compactMode !== "boolean" ||
    typeof policy.suppressRecommendations !== "boolean" ||
    typeof policy.escalationEligible !== "boolean"
  ) return undefined;

  const urgency = optionalStatement("URGENCY_STATEMENT", render.urgencyStatement);
  const execution = optionalStatement("EXECUTION_STATEMENT", render.executionStatement);
  if (urgency === false || execution === false) return undefined;

  const statements: PlannerNarrativeCandidateStatementV1[] = [
    Object.freeze({ kind: "HEADLINE", text: render.headline }),
    Object.freeze({ kind: "OPERATIONAL_SUMMARY", text: render.operationalSummary }),
    Object.freeze({ kind: "PLANNER_STATEMENT", text: render.plannerStatement }),
  ];
  if (urgency) statements.push(urgency);
  if (execution) statements.push(execution);

  return Object.freeze({
    version: 1,
    statements: Object.freeze(statements) as PlannerNarrativeSurfacingCandidateV1["statements"],
    interaction_policy: uiState.interactionPolicy,
    chat_priority: uiState.chatPriority,
    policy: Object.freeze({
      valid: policy.valid,
      violations: Object.freeze([...policy.violations]),
      severity: policy.severity,
      degraded: policy.degraded,
      compact_mode: policy.compactMode,
      suppress_recommendations: policy.suppressRecommendations,
      escalation_eligible: policy.escalationEligible,
    }),
  });
}
