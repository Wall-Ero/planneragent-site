import type { VisionExecutionBoundaryResult } from "../sandbox/authority/visionExecutionBoundary.v1";
import { VISION_NO_EXECUTION_REASON } from "../sandbox/authority/visionExecutionBoundary.v1";
import type { PlanTier } from "../sandbox/contracts.v2";
import type { AnonymousVisionDirectResponseV1 } from "./anonymous.vision.direct.response.contracts.v1";
import type { PlannerNarrativeSurfacingCandidateV1 } from "./planner.narrative.surfacing.candidate.contracts.v1";

function usableIdentifier(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 256;
}

function usableStatement(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const statement = value as Record<string, unknown>;
  return typeof statement.kind === "string" &&
    typeof statement.text === "string" &&
    statement.text.trim().length > 0 &&
    !/<\/?[A-Za-z][^>]*>/.test(statement.text);
}

function isObservationOnly(boundary: VisionExecutionBoundaryResult): boolean {
  return boundary.executionAllowed === false &&
    boundary.governanceReason === VISION_NO_EXECUTION_REASON &&
    boundary.executionPreviewExecutable === false &&
    boundary.issueExecutionActionId === false &&
    boundary.resolveExecutionCredential === false &&
    boundary.permitExecutionSuccessEvidence === false;
}

/** Projects already-admitted deterministic narrative into the same request. */
export function createAnonymousVisionDirectResponseV1(input: Readonly<{
  plan: PlanTier;
  request_id: string;
  context_request_id: string;
  candidate: PlannerNarrativeSurfacingCandidateV1 | undefined;
  vision_boundary: VisionExecutionBoundaryResult;
}>): AnonymousVisionDirectResponseV1 | undefined {
  if (input.plan !== "VISION") return undefined;
  if (!usableIdentifier(input.request_id) || input.request_id !== input.context_request_id) return undefined;
  if (!input.candidate || input.candidate.version !== 1 || input.candidate.policy.valid !== true) return undefined;
  if (!Array.isArray(input.candidate.statements) || input.candidate.statements.length === 0) return undefined;
  if (!input.candidate.statements.every(usableStatement) || !isObservationOnly(input.vision_boundary)) return undefined;

  const statements = input.candidate.statements.map((statement) => Object.freeze({
    kind: statement.kind,
    text: statement.text,
  })) as unknown as AnonymousVisionDirectResponseV1["statements"];

  return Object.freeze({
    version: 1,
    request_id: input.request_id,
    classification: Object.freeze({
      observational: true,
      request_bound: true,
      executable: false,
      participant: false,
      proactive: false,
    }),
    source: "PLANNER_NARRATIVE_SURFACING_CANDIDATE_V1",
    statements: Object.freeze(statements),
  });
}
