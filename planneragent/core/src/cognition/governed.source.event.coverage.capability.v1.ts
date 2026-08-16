import type { OperationalSignalScopeBindingV1 } from "../cockpit/operational.signal.evaluation.scope.v1";
import { verifyOperationalSignalEvaluationScopeV1 } from "../cockpit/operational.signal.evaluation.scope.v1";

export type GovernedSourceCoverageStatusV1 = "COMPLETE" | "PARTIAL" | "INSUFFICIENT";

export type GovernedSourceEventClassCapabilityV1 = Readonly<{
  domain_ref: string;
  event_class_ref: string;
  required_semantic_field_refs: readonly string[];
  guaranteed_semantic_field_refs: readonly string[];
  optional_semantic_field_refs: readonly string[];
}>;

export type GovernedSourceEventCoverageCapabilityV1 = Readonly<{
  version: 1;
  declaration_kind: "CURRENT_SNAPSHOT_COVERAGE";
  capability_policy_ref: string;
  capability_policy_version: string;
  tenant_id: string;
  company_id: string;
  source_identity_ref: string;
  source_profile_ref: string;
  source_profile_version: string;
  source_boundary_ref: string;
  request_id: string;
  scope_id: string;
  scope_digest: string;
  evidence_selection_ref: string;
  source_snapshot_ref: string;
  event_class_capabilities: readonly GovernedSourceEventClassCapabilityV1[];
  coverage_start: string;
  coverage_end: string;
  coverage_status: GovernedSourceCoverageStatusV1;
  profile_capability_evidence_refs: readonly string[];
  snapshot_completeness_evidence_refs: readonly string[];
  qualification_refs: readonly string[];
  provenance_refs: readonly string[];
  causal_lineage_refs: readonly string[];
  capability_id: string;
  capability_digest: string;
  digest_algorithm: "SHA-256";
  asserts_event_occurrence: false;
  asserts_event_absence: false;
  establishes_domain_coverage: false;
  establishes_fixation: false;
  establishes_changeability: false;
  observational_only: true;
  recommended: false;
  executable: false;
  grants_authority: false;
  grants_execution: false;
  company_global_claim: false;
  multi_source_composition: false;
  cross_source_deduplication: false;
}>;

const STATUSES = new Set<GovernedSourceCoverageStatusV1>(["COMPLETE", "PARTIAL", "INSUFFICIENT"]);
const FORBIDDEN = ["authority_tier", "subscription_tier", "approval_ref", "delegation_ref", "credential_ref", "recommendation_ref", "event_occurred", "no_event_occurred", "domain_coverage_result", "fixation_result", "changeability_status", "multi_source_policy", "deduplication_policy"];

function required(value: string | undefined, code: string): string {
  const normalized = value?.trim();
  if (!normalized) throw new Error(code);
  return normalized;
}
function ref(value: string | undefined, code: string): string {
  const normalized = required(value, code);
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*:[^\s]+$/.test(normalized)) throw new Error(code);
  return normalized;
}
function refs(values: readonly string[], code: string, allowEmpty = false): readonly string[] {
  if (!Array.isArray(values)) throw new Error(code);
  const normalized = [...new Set(values.map(value => ref(value, code)))].sort();
  if (!allowEmpty && normalized.length === 0) throw new Error(code);
  return normalized;
}
function time(value: string, code: string): string {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== value) throw new Error(code);
  return value;
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>).filter(([, item]) => item !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
async function sha(value: unknown): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical(value)));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}
function freeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value as Record<string, unknown>).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
function semantic(value: GovernedSourceEventCoverageCapabilityV1) {
  const { capability_id: _id, capability_digest: _digest, digest_algorithm: _algorithm, asserts_event_occurrence: _occurrence, asserts_event_absence: _absence, establishes_domain_coverage: _domain, establishes_fixation: _fixation, establishes_changeability: _changeability, observational_only: _observational, recommended: _recommended, executable: _executable, grants_authority: _authority, grants_execution: _execution, company_global_claim: _global, multi_source_composition: _composition, cross_source_deduplication: _deduplication, ...result } = value;
  return result;
}

export async function createGovernedSourceEventCoverageCapabilityV1(input: Readonly<{
  version: 1;
  capability_policy_ref: string;
  capability_policy_version: string;
  tenant_id: string;
  source_identity_ref: string;
  source_profile_ref: string;
  source_profile_version: string;
  source_boundary_ref: string;
  evaluation_scope: OperationalSignalScopeBindingV1;
  event_class_capabilities: readonly GovernedSourceEventClassCapabilityV1[];
  coverage_start: string;
  coverage_end: string;
  coverage_status: GovernedSourceCoverageStatusV1;
  profile_capability_evidence_refs: readonly string[];
  snapshot_completeness_evidence_refs: readonly string[];
  qualification_refs: readonly string[];
  provenance_refs: readonly string[];
  causal_lineage_refs: readonly string[];
}>): Promise<GovernedSourceEventCoverageCapabilityV1> {
  if (input.version !== 1) throw new Error("SOURCE_COVERAGE_VERSION_UNSUPPORTED");
  for (const key of FORBIDDEN) if (key in (input as object)) throw new Error("SOURCE_COVERAGE_UNSAFE_INPUT");
  await verifyOperationalSignalEvaluationScopeV1(input.evaluation_scope.scope, input.evaluation_scope.scope);
  if (!STATUSES.has(input.coverage_status)) throw new Error("SOURCE_COVERAGE_STATUS_INVALID");
  const scope = input.evaluation_scope.scope;
  const coverage_start = time(input.coverage_start, "SOURCE_COVERAGE_START_INVALID");
  const coverage_end = time(input.coverage_end, "SOURCE_COVERAGE_END_INVALID");
  if (Date.parse(coverage_start) > Date.parse(coverage_end) || coverage_end !== input.evaluation_scope.evidence_as_of) throw new Error("SOURCE_COVERAGE_INTERVAL_INVALID");
  const event_class_capabilities = input.event_class_capabilities.map(item => {
    const requiredFields = refs(item.required_semantic_field_refs, "SOURCE_COVERAGE_REQUIRED_FIELDS_REQUIRED");
    const guaranteedFields = refs(item.guaranteed_semantic_field_refs, "SOURCE_COVERAGE_GUARANTEED_FIELDS_REQUIRED", input.coverage_status !== "COMPLETE");
    const optionalFields = refs(item.optional_semantic_field_refs, "SOURCE_COVERAGE_OPTIONAL_FIELDS_INVALID", true);
    if (input.coverage_status === "COMPLETE" && requiredFields.some(field => !guaranteedFields.includes(field))) throw new Error("SOURCE_COVERAGE_REQUIRED_FIELD_NOT_GUARANTEED");
    return { domain_ref: ref(item.domain_ref, "SOURCE_COVERAGE_DOMAIN_REQUIRED"), event_class_ref: ref(item.event_class_ref, "SOURCE_COVERAGE_EVENT_CLASS_REQUIRED"), required_semantic_field_refs: requiredFields, guaranteed_semantic_field_refs: guaranteedFields, optional_semantic_field_refs: optionalFields };
  }).sort((a, b) => `${a.domain_ref}:${a.event_class_ref}`.localeCompare(`${b.domain_ref}:${b.event_class_ref}`));
  if (event_class_capabilities.length === 0 || new Set(event_class_capabilities.map(item => `${item.domain_ref}|${item.event_class_ref}`)).size !== event_class_capabilities.length) throw new Error("SOURCE_COVERAGE_EVENT_CLASSES_INVALID");
  const profileEvidence = refs(input.profile_capability_evidence_refs, "SOURCE_COVERAGE_PROFILE_EVIDENCE_REQUIRED");
  const completenessEvidence = refs(input.snapshot_completeness_evidence_refs, "SOURCE_COVERAGE_COMPLETENESS_EVIDENCE_REQUIRED", input.coverage_status !== "COMPLETE");
  const qualification = refs(input.qualification_refs, "SOURCE_COVERAGE_QUALIFICATION_REQUIRED", input.coverage_status !== "COMPLETE");
  const provenance = refs(input.provenance_refs, "SOURCE_COVERAGE_PROVENANCE_REQUIRED");
  const value = {
    version: 1 as const, declaration_kind: "CURRENT_SNAPSHOT_COVERAGE" as const,
    capability_policy_ref: ref(input.capability_policy_ref, "SOURCE_COVERAGE_POLICY_REQUIRED"), capability_policy_version: required(input.capability_policy_version, "SOURCE_COVERAGE_POLICY_VERSION_REQUIRED"),
    tenant_id: required(input.tenant_id, "SOURCE_COVERAGE_TENANT_REQUIRED"), company_id: scope.company_id,
    source_identity_ref: ref(input.source_identity_ref, "SOURCE_COVERAGE_SOURCE_REQUIRED"), source_profile_ref: ref(input.source_profile_ref, "SOURCE_COVERAGE_PROFILE_REQUIRED"), source_profile_version: required(input.source_profile_version, "SOURCE_COVERAGE_PROFILE_VERSION_REQUIRED"), source_boundary_ref: ref(input.source_boundary_ref, "SOURCE_COVERAGE_BOUNDARY_REQUIRED"),
    request_id: scope.request_id, scope_id: scope.scope_id, scope_digest: scope.scope_digest, evidence_selection_ref: ref(scope.evidence_selection_ref, "SOURCE_COVERAGE_SELECTION_REQUIRED"), source_snapshot_ref: ref(scope.source_snapshot_ref, "SOURCE_COVERAGE_SNAPSHOT_REQUIRED"),
    event_class_capabilities, coverage_start, coverage_end, coverage_status: input.coverage_status,
    profile_capability_evidence_refs: profileEvidence, snapshot_completeness_evidence_refs: completenessEvidence,
    qualification_refs: qualification, provenance_refs: provenance,
    causal_lineage_refs: refs([...input.causal_lineage_refs, scope.scope_id, scope.evidence_selection_ref, scope.source_snapshot_ref, input.source_identity_ref, input.source_profile_ref, ...profileEvidence, ...completenessEvidence], "SOURCE_COVERAGE_LINEAGE_REQUIRED"),
  };
  const capability_digest = await sha(value);
  return freeze({ ...value, capability_id: `governed-source-event-coverage-capability:sha256:${capability_digest}`, capability_digest, digest_algorithm: "SHA-256" as const, asserts_event_occurrence: false as const, asserts_event_absence: false as const, establishes_domain_coverage: false as const, establishes_fixation: false as const, establishes_changeability: false as const, observational_only: true as const, recommended: false as const, executable: false as const, grants_authority: false as const, grants_execution: false as const, company_global_claim: false as const, multi_source_composition: false as const, cross_source_deduplication: false as const });
}

export async function verifyGovernedSourceEventCoverageCapabilityV1(value: GovernedSourceEventCoverageCapabilityV1): Promise<void> {
  const digest = await sha(semantic(value));
  if (value.capability_digest !== digest || value.capability_id !== `governed-source-event-coverage-capability:sha256:${digest}`) throw new Error("SOURCE_COVERAGE_INTEGRITY_INVALID");
  if (value.declaration_kind !== "CURRENT_SNAPSHOT_COVERAGE" || !STATUSES.has(value.coverage_status) || value.asserts_event_occurrence !== false || value.asserts_event_absence !== false || value.establishes_domain_coverage !== false || value.establishes_fixation !== false || value.establishes_changeability !== false || value.observational_only !== true || value.recommended !== false || value.executable !== false || value.grants_authority !== false || value.grants_execution !== false || value.company_global_claim !== false || value.multi_source_composition !== false || value.cross_source_deduplication !== false) throw new Error("SOURCE_COVERAGE_BOUNDARY_INVALID");
  if (value.coverage_status === "COMPLETE" && (value.snapshot_completeness_evidence_refs.length === 0 || value.qualification_refs.length === 0 || value.event_class_capabilities.some(item => item.required_semantic_field_refs.some(field => !item.guaranteed_semantic_field_refs.includes(field))))) throw new Error("SOURCE_COVERAGE_COMPLETENESS_INVALID");
}
