import type { ChatPriority, InteractionPolicy } from "../sandbox/narrative/planner.narrative.ui";
import type { NarrativePolicyResult } from "../sandbox/narrative/planner.narrative.policy";

export type PlannerNarrativeCandidateStatementKindV1 =
  | "HEADLINE"
  | "OPERATIONAL_SUMMARY"
  | "PLANNER_STATEMENT"
  | "URGENCY_STATEMENT"
  | "EXECUTION_STATEMENT";

export type PlannerNarrativeCandidateStatementV1 = Readonly<{
  kind: PlannerNarrativeCandidateStatementKindV1;
  text: string;
}>;

export type PlannerNarrativeCandidatePolicyV1 = Readonly<{
  valid: boolean;
  violations: readonly string[];
  severity: NarrativePolicyResult["severity"];
  degraded: boolean;
  compact_mode: boolean;
  suppress_recommendations: boolean;
  escalation_eligible: boolean;
}>;

/**
 * Internal pre-admission narrative material.
 *
 * Existence means only that deterministic narrative output is structurally usable
 * for later surfacing evaluation. It does not establish participant visibility,
 * entitlement, authority, freshness, delivery, display, or speech eligibility.
 */
export type PlannerNarrativeSurfacingCandidateV1 = Readonly<{
  version: 1;
  statements: readonly [
    PlannerNarrativeCandidateStatementV1,
    ...PlannerNarrativeCandidateStatementV1[],
  ];
  interaction_policy: InteractionPolicy;
  chat_priority: ChatPriority;
  policy: PlannerNarrativeCandidatePolicyV1;
}>;
