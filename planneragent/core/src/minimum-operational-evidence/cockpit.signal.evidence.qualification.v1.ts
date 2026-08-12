import type { OperationalSignalScopeBindingV1 } from "../cockpit/operational.signal.evaluation.scope.v1";
import { verifyOperationalSignalEvaluationScopeV1 } from "../cockpit/operational.signal.evaluation.scope.v1";
import type { EvidenceDependencyIdV1, MinimumEvidenceEvaluationResultV1, PresentedOperationalEvidenceV1 } from "./minimum.operational.evidence.contracts.v1";
import { evaluateCapabilityMinimumEvidenceV1 } from "./minimum.operational.evidence.evaluator.v1";

export type CockpitSignalFamilyV1 = "DATA_AWARENESS" | "PLAN_COHERENCE" | "REALITY_STABILITY" | "DECISION_PRESSURE";
const CAPABILITY = {
  DATA_AWARENESS: "SCOPED_OPERATIONAL_DATA_AWARENESS",
  PLAN_COHERENCE: "CANONICAL_COCKPIT_PLAN_COHERENCE",
  REALITY_STABILITY: "CANONICAL_REALITY_STABILITY",
  DECISION_PRESSURE: "FULL_REALITY_AWARE_DECISION_PRESSURE",
} as const;

export type CockpitSignalEvidenceQualificationV1 = Readonly<{
  version: 1;
  qualification_id: string;
  qualification_digest: string;
  digest_algorithm: "SHA-256";
  signal_family: CockpitSignalFamilyV1;
  capability_id: typeof CAPABILITY[CockpitSignalFamilyV1];
  moe_result: MinimumEvidenceEvaluationResultV1;
  request_id: string;
  company_id: string;
  scope_id: string;
  scope_digest: string;
  evidence_selection_ref: string;
  source_snapshot_ref: string;
  evidence_qualification_refs: readonly string[];
  evidence_as_of: string;
  qualified_at: string;
  causal_lineage_refs: readonly string[];
  company_global_claim: false;
  grants_execution: false;
}>;

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).filter(([, x]) => x !== undefined).sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([k, x]) => `${JSON.stringify(k)}:${canonicalJson(x)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

async function sha256(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalJson(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
}

function refs(values: readonly string[]): readonly string[] {
  const normalized = [...new Set(values.map(x => x.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  if (!normalized.length) throw new Error("COCKPIT_SIGNAL_QUALIFICATION_REFERENCES_REQUIRED");
  return Object.freeze(normalized);
}

export async function qualifyCockpitSignalEvidenceV1(input: Readonly<{
  signal_family: CockpitSignalFamilyV1;
  evaluation_scope: OperationalSignalScopeBindingV1;
  evidence_scope: OperationalSignalScopeBindingV1;
  presented_evidence: readonly PresentedOperationalEvidenceV1[];
  satisfied_dependencies?: readonly EvidenceDependencyIdV1[];
  active_conditions?: readonly string[];
  evidence_qualification_refs: readonly string[];
  qualified_at: string;
}>): Promise<CockpitSignalEvidenceQualificationV1> {
  const capability_id = CAPABILITY[input.signal_family];
  if (!capability_id) throw new Error("COCKPIT_SIGNAL_FAMILY_UNSUPPORTED");
  const binding = input.evaluation_scope, evidence = input.evidence_scope;
  await verifyOperationalSignalEvaluationScopeV1(binding.scope, binding.scope);
  await verifyOperationalSignalEvaluationScopeV1(evidence.scope, evidence.scope);
  if (binding.scope.scope_id !== evidence.scope.scope_id || binding.scope.scope_digest !== evidence.scope.scope_digest ||
      binding.scope.request_id !== evidence.scope.request_id || binding.scope.company_id !== evidence.scope.company_id ||
      binding.scope.evidence_selection_ref !== evidence.scope.evidence_selection_ref || binding.evidence_as_of !== evidence.evidence_as_of) {
    throw new Error("COCKPIT_SIGNAL_EVIDENCE_SCOPE_MISMATCH");
  }
  const qualifiedTime = Date.parse(input.qualified_at), evidenceTime = Date.parse(binding.evidence_as_of);
  if (!Number.isFinite(qualifiedTime) || !Number.isFinite(evidenceTime) || qualifiedTime < evidenceTime) throw new Error("COCKPIT_SIGNAL_QUALIFICATION_TIME_INVALID");
  const evidenceRefs = refs(input.evidence_qualification_refs);
  const moe_result = evaluateCapabilityMinimumEvidenceV1({ version: 1, capability_id,
    presented_evidence: input.presented_evidence, satisfied_dependencies: input.satisfied_dependencies ?? [], active_conditions: input.active_conditions });
  const semantic = { version: 1 as const, signal_family: input.signal_family, capability_id, moe_result,
    request_id: binding.scope.request_id, company_id: binding.scope.company_id, scope_id: binding.scope.scope_id,
    scope_digest: binding.scope.scope_digest, evidence_selection_ref: binding.scope.evidence_selection_ref,
    source_snapshot_ref: binding.scope.source_snapshot_ref, evidence_qualification_refs: evidenceRefs,
    evidence_as_of: binding.evidence_as_of, qualified_at: input.qualified_at };
  const qualification_digest = await sha256(semantic);
  return Object.freeze({ ...semantic, qualification_id: `cockpit-signal-evidence-qualification:sha256:${qualification_digest}`,
    qualification_digest, digest_algorithm: "SHA-256", causal_lineage_refs: Object.freeze([
      binding.scope.scope_id, binding.scope.evidence_selection_ref, binding.scope.source_snapshot_ref, ...evidenceRefs,
    ]), company_global_claim: false, grants_execution: false });
}
