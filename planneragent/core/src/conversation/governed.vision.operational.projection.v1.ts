import type { IdentityRole } from "../identity/identity.types";
import { manifestCanonicalExplanationV1 } from "../explainability/canonicalExplanation";
import { verifyOperationalCockpitSnapshotV1, type OperationalCockpitSnapshotV1 } from "../cockpit/operational.cockpit.snapshot.v1";
import { verifyOperationsBaselineCommitmentFeasibilityV1, type OperationsBaselineCommitmentFeasibilityV1 } from "../industrial/cognition/operations.baseline.commitment.feasibility.v1";
import { verifyOperationsObjectiveStateAssessmentV1, type OperationsObjectiveStateAssessmentV1 } from "../industrial/cognition/operations.objective.state.v1";
import { CognitiveTransportConversationalRealizationAdapterV1, type CurrentPublicRealizationRouteV1, type PublicCognitiveRealizationTransportV1 } from "./cognition/cognitive.transport.conversational.realization.adapter.v1";

export const GOVERNED_VISION_OPERATIONAL_REALIZATION_INSTRUCTION_V1 = [
  "Manifest only the supplied GOVERNED_MEANING in natural language.",
  "Preserve every status and uncertainty qualification exactly; do not strengthen incomplete evidence.",
  "Do not recommend, approve, authorize, remediate, or execute any action.",
  'Return only one JSON object with exactly this shape: {"version":1,"answer":"Natural-language PlannerAgent observation"}.',
].join(" ");

export type GovernedVisionOperationalProjectionV1 = Readonly<{
  version: 1;
  projection_kind: "GOVERNED_VISION_OPERATIONAL_MEANING";
  audience: IdentityRole;
  detail: "SUMMARY" | "STANDARD" | "AUDIT";
  observation: Readonly<{
    required_quantity: Readonly<{ value: number; unit: "EACH" }>;
    available_quantity: Readonly<{ value: number; unit: "EACH" }>;
    shortage_quantity: Readonly<{ value: number; unit: "EACH" }>;
    feasibility: OperationsBaselineCommitmentFeasibilityV1["result"];
    objective_state: "PRESERVED" | "BREACHED" | "UNRESOLVED";
    impact: string | number;
    urgency: string | number;
    cost_of_waiting: string | number | "INSUFFICIENT_EVIDENCE" | "UNRESOLVED";
    decision_pressure: string;
    canonical_reality: "COMPOSED" | "UNRESOLVED_CONFLICT";
  }>;
  audit: Readonly<{ canonical_reality_ref: string; explanation_basis_ref: string; decision_pressure_ref: string; evidence_refs: readonly string[] }>;
  observational_only: true;
  recommended: false;
  executable: false;
  grants_authority: false;
  grants_execution: false;
}>;

export function createGovernedVisionOperationalRealizationAdapterV1(transport: PublicCognitiveRealizationTransportV1, route: CurrentPublicRealizationRouteV1) {
  return new CognitiveTransportConversationalRealizationAdapterV1<GovernedVisionOperationalProjectionV1>(transport, route, GOVERNED_VISION_OPERATIONAL_REALIZATION_INSTRUCTION_V1, "GOVERNED_MEANING");
}

const componentValue = (component: NonNullable<OperationalCockpitSnapshotV1["canonical_cognition"]>["decision_pressure"]["components"][number]) =>
  component.status === "ESTABLISHED" ? component.ordinal_state ?? component.continuous_value ?? "UNRESOLVED" : component.status;

export async function projectCanonicalCognitionToGovernedVisionV1(input: Readonly<{
  version: 1;
  cockpit: OperationalCockpitSnapshotV1;
  feasibility: OperationsBaselineCommitmentFeasibilityV1;
  objective_state: OperationsObjectiveStateAssessmentV1;
  audience: IdentityRole;
}>): Promise<GovernedVisionOperationalProjectionV1> {
  if (input.version !== 1) throw new Error("VISION_OPERATIONAL_PROJECTION_VERSION_UNSUPPORTED");
  await Promise.all([
    verifyOperationalCockpitSnapshotV1(input.cockpit),
    verifyOperationsBaselineCommitmentFeasibilityV1(input.feasibility),
    verifyOperationsObjectiveStateAssessmentV1(input.objective_state),
  ]);
  const cognition = input.cockpit.canonical_cognition;
  if (!cognition) throw new Error("VISION_OPERATIONAL_CANONICAL_COGNITION_REQUIRED");
  const f = input.feasibility, o = input.objective_state, r = cognition.reality, p = cognition.decision_pressure;
  if (f.request_id !== r.request_id || f.company_id !== r.company_id || f.scope_id !== r.scope_id || f.scope_digest !== r.scope_digest ||
      o.request_id !== r.request_id || o.company_id !== r.company_id || o.scope_id !== r.scope_id || o.scope_digest !== r.scope_digest ||
      o.feasibility_ref !== f.feasibility_id || o.feasibility_digest !== f.feasibility_digest) throw new Error("VISION_OPERATIONAL_CONTEXT_MISMATCH");
  const manifestation = manifestCanonicalExplanationV1(cognition.explanation, { audience: input.audience, tier: "VISION" });
  const byDimension = new Map(p.components.map((component) => [component.dimension, component]));
  const unresolved = r.composition_status === "UNRESOLVED_CONFLICT" || f.result === "UNRESOLVED" || o.assessment_status === "UNRESOLVED";
  const objective_state = unresolved ? "UNRESOLVED" as const : o.objective_state!;
  const evidence_refs = Object.freeze([...new Set([...r.evidence_refs, ...f.evidence_refs, ...o.evidence_refs, ...p.evidence_refs])].sort());
  return Object.freeze({
    version: 1,
    projection_kind: "GOVERNED_VISION_OPERATIONAL_MEANING",
    audience: input.audience,
    detail: manifestation.detail,
    observation: Object.freeze({
      required_quantity: Object.freeze({ value: f.committed_quantity.value, unit: "EACH" as const }),
      available_quantity: Object.freeze({ value: f.allocated_quantity.value, unit: "EACH" as const }),
      shortage_quantity: Object.freeze({ value: f.shortage_quantity.value, unit: "EACH" as const }),
      feasibility: f.result,
      objective_state,
      impact: unresolved ? "UNRESOLVED" : componentValue(byDimension.get("IMPACT")!),
      urgency: unresolved ? "UNRESOLVED" : componentValue(byDimension.get("URGENCY")!),
      cost_of_waiting: unresolved ? "UNRESOLVED" : componentValue(byDimension.get("COST_OF_WAITING")!),
      decision_pressure: unresolved ? "QUALIFIED_PARTIAL_UNRESOLVED" : p.completeness_status,
      canonical_reality: r.composition_status,
    }),
    audit: Object.freeze({ canonical_reality_ref: r.composition_id, explanation_basis_ref: cognition.explanation.basis_id, decision_pressure_ref: p.pressure_id, evidence_refs }),
    observational_only: true,
    recommended: false,
    executable: false,
    grants_authority: false,
    grants_execution: false,
  });
}
