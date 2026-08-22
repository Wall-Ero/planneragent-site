import type { PlannerNarrativeCandidateStatementV1 } from "./planner.narrative.surfacing.candidate.contracts.v1";

export type AnonymousVisionDirectResponseV1 = Readonly<{
  version: 1;
  request_id: string;
  classification: Readonly<{
    observational: true;
    request_bound: true;
    executable: false;
    participant: false;
    proactive: false;
  }>;
  source: "PLANNER_NARRATIVE_SURFACING_CANDIDATE_V1";
  statements: readonly [
    PlannerNarrativeCandidateStatementV1,
    ...PlannerNarrativeCandidateStatementV1[],
  ];
}>;
