import type { OperationalSignalScopeBindingV1 } from "../cockpit/operational.signal.evaluation.scope.v1";
import { verifyOperationalSignalEvaluationScopeV1 } from "../cockpit/operational.signal.evaluation.scope.v1";
import type {
  EvidenceDependencyIdV1,
  MinimumEvidenceEvaluationResultV1,
  PresentedOperationalEvidenceV1,
} from "./minimum.operational.evidence.contracts.v1";
import { evaluateCapabilityMinimumEvidenceV1 } from "./minimum.operational.evidence.evaluator.v1";

export type CockpitPlanCoherenceQualificationV1 = Readonly<{
  version: 1;
  capability_id: "CANONICAL_COCKPIT_PLAN_COHERENCE";
  request_id: string;
  company_id: string;
  scope_id: string;
  scope_digest: string;
  evidence_selection_ref: string;
  evidence_as_of: string;
  evaluated_at: string;
  moe_result: MinimumEvidenceEvaluationResultV1;
  company_global_claim: false;
  grants_execution: false;
}>;

export async function qualifyCockpitPlanCoherenceV1(input: Readonly<{
  evaluation_scope: OperationalSignalScopeBindingV1;
  evidence_scope: OperationalSignalScopeBindingV1;
  presented_evidence: readonly PresentedOperationalEvidenceV1[];
  satisfied_dependencies?: readonly EvidenceDependencyIdV1[];
}>): Promise<CockpitPlanCoherenceQualificationV1> {
  const binding = input.evaluation_scope;
  if (binding?.version !== 1) throw new Error("PLAN_COHERENCE_SCOPE_BINDING_INVALID");
  await verifyOperationalSignalEvaluationScopeV1(binding.scope, binding.scope);
  const evidenceBinding = input.evidence_scope;
  if (evidenceBinding?.version !== 1) throw new Error("PLAN_COHERENCE_EVIDENCE_SCOPE_INVALID");
  await verifyOperationalSignalEvaluationScopeV1(evidenceBinding.scope, evidenceBinding.scope);
  if (evidenceBinding.scope.scope_id !== binding.scope.scope_id ||
      evidenceBinding.scope.scope_digest !== binding.scope.scope_digest ||
      evidenceBinding.scope.evidence_selection_ref !== binding.scope.evidence_selection_ref ||
      evidenceBinding.evidence_as_of !== binding.evidence_as_of) {
    throw new Error("PLAN_COHERENCE_EVIDENCE_SCOPE_MISMATCH");
  }
  const evidenceTime = Date.parse(binding.evidence_as_of);
  const evaluationTime = Date.parse(binding.evaluated_at);
  if (!Number.isFinite(evidenceTime) || !Number.isFinite(evaluationTime) || evidenceTime > evaluationTime) {
    throw new Error("PLAN_COHERENCE_SCOPE_TIME_INVALID");
  }
  const moe_result = evaluateCapabilityMinimumEvidenceV1({
    version: 1,
    capability_id: "CANONICAL_COCKPIT_PLAN_COHERENCE",
    presented_evidence: input.presented_evidence,
    satisfied_dependencies: input.satisfied_dependencies ?? [],
  });
  return Object.freeze({
    version: 1,
    capability_id: "CANONICAL_COCKPIT_PLAN_COHERENCE",
    request_id: binding.scope.request_id,
    company_id: binding.scope.company_id,
    scope_id: binding.scope.scope_id,
    scope_digest: binding.scope.scope_digest,
    evidence_selection_ref: binding.scope.evidence_selection_ref,
    evidence_as_of: binding.evidence_as_of,
    evaluated_at: binding.evaluated_at,
    moe_result,
    company_global_claim: false,
    grants_execution: false,
  });
}
