import type { OperationalSignalScopeBindingV1 } from "../../cockpit/operational.signal.evaluation.scope.v1";
import { verifyOperationalSignalEvaluationScopeV1 } from "../../cockpit/operational.signal.evaluation.scope.v1";
import type { GovernedSourceEventCoverageCapabilityV1 } from "../../cognition/governed.source.event.coverage.capability.v1";
import { verifyGovernedSourceEventCoverageCapabilityV1 } from "../../cognition/governed.source.event.coverage.capability.v1";
import type { GovernedOperationsFactV1 } from "../preservation/governed.operational.fact.preservation.v1";

export const OPERATIONS_PLANNED_PRODUCTION_EVENT_CLASS = "event-class:operations-current-planned-production-order" as const;
export const OPERATIONS_PLANNED_PRODUCTION_REQUIRED_FIELDS = Object.freeze([
  "field:output-item",
  "field:planned-output-available-at",
  "field:planned-quantity",
  "field:production-identity",
  "field:source-fact-identity",
  "field:source-namespace",
  "field:unit",
] as const);
export const OPERATIONS_PLANNED_PRODUCTION_OPTIONAL_FIELDS = Object.freeze([
  "field:scheduled-start-at",
] as const);

export type OperationsPlannedProductionSnapshotCoverageProfileV1 = Readonly<{
  version: 1;
  profile_ref: "coverage-profile:operations-planned-production-current-snapshot-v1";
  profile_version: "1";
  domain_ref: "domain:operations";
  event_class_ref: typeof OPERATIONS_PLANNED_PRODUCTION_EVENT_CLASS;
  required_semantic_field_refs: typeof OPERATIONS_PLANNED_PRODUCTION_REQUIRED_FIELDS;
  optional_semantic_field_refs: typeof OPERATIONS_PLANNED_PRODUCTION_OPTIONAL_FIELDS;
  source_profile_support_rule: "EXPLICIT_GOVERNED_CAPABILITY_EVIDENCE";
  complete_snapshot_required: true;
  qualification_required: true;
  single_source_only: true;
  profile_id: string;
  profile_digest: string;
  digest_algorithm: "SHA-256";
  current_snapshot_only: true;
  establishes_membership: false;
  establishes_material_feasibility: false;
  establishes_realization: false;
  recommended: false;
  executable: false;
  grants_authority: false;
  grants_execution: false;
}>;

const FORBIDDEN = [
  "scenario", "counterfactual", "chat", "alternative_plan", "optimizer_candidate",
  "twin_snapshot", "authority_tier", "subscription_tier", "commercial_plan",
  "credit_balance", "material_feasibility", "realization", "recommendation",
  "execution",
];

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).filter(([, item]) => item !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(",")}}`;
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

export async function createOperationsPlannedProductionSnapshotCoverageProfileV1(): Promise<OperationsPlannedProductionSnapshotCoverageProfileV1> {
  const semantic = {
    version: 1 as const,
    profile_ref: "coverage-profile:operations-planned-production-current-snapshot-v1" as const,
    profile_version: "1" as const,
    domain_ref: "domain:operations" as const,
    event_class_ref: OPERATIONS_PLANNED_PRODUCTION_EVENT_CLASS,
    required_semantic_field_refs: OPERATIONS_PLANNED_PRODUCTION_REQUIRED_FIELDS,
    optional_semantic_field_refs: OPERATIONS_PLANNED_PRODUCTION_OPTIONAL_FIELDS,
    source_profile_support_rule: "EXPLICIT_GOVERNED_CAPABILITY_EVIDENCE" as const,
    complete_snapshot_required: true as const,
    qualification_required: true as const,
    single_source_only: true as const,
  };
  const profile_digest = await sha(semantic);
  return freeze({ ...semantic, profile_id: `operations-planned-production-snapshot-coverage-profile:sha256:${profile_digest}`, profile_digest, digest_algorithm: "SHA-256" as const, current_snapshot_only: true as const, establishes_membership: false as const, establishes_material_feasibility: false as const, establishes_realization: false as const, recommended: false as const, executable: false as const, grants_authority: false as const, grants_execution: false as const });
}

export async function assertOperationsPlannedProductionSnapshotCoverageV1(input: Readonly<{
  version: 1;
  tenant_id: string;
  source_namespace: string;
  evaluation_scope: OperationalSignalScopeBindingV1;
  coverage: GovernedSourceEventCoverageCapabilityV1;
  production_facts: readonly GovernedOperationsFactV1[];
}>): Promise<OperationsPlannedProductionSnapshotCoverageProfileV1> {
  if (input.version !== 1) throw new Error("OPS_PRODUCTION_COVERAGE_VERSION_UNSUPPORTED");
  for (const key of FORBIDDEN) if (key in (input as object)) throw new Error("OPS_PRODUCTION_COVERAGE_UNSAFE_INPUT");
  await Promise.all([
    verifyOperationalSignalEvaluationScopeV1(input.evaluation_scope.scope, input.evaluation_scope.scope),
    verifyGovernedSourceEventCoverageCapabilityV1(input.coverage),
  ]);
  const scope = input.evaluation_scope.scope;
  const coverage = input.coverage;
  if (scope.domain !== "operations" || (scope.scope_type !== "REQUEST_DATASET" && scope.scope_type !== "ENTITY")) throw new Error("OPS_PRODUCTION_COVERAGE_SCOPE_UNSUPPORTED");
  if (coverage.coverage_status !== "COMPLETE") throw new Error("OPS_PRODUCTION_COVERAGE_COMPLETE_REQUIRED");
  if (coverage.tenant_id !== input.tenant_id || coverage.company_id !== scope.company_id || coverage.request_id !== scope.request_id || coverage.scope_id !== scope.scope_id || coverage.scope_digest !== scope.scope_digest || coverage.evidence_selection_ref !== scope.evidence_selection_ref || coverage.source_snapshot_ref !== scope.source_snapshot_ref || coverage.coverage_end !== input.evaluation_scope.evidence_as_of) throw new Error("OPS_PRODUCTION_COVERAGE_CONTEXT_MISMATCH");
  if (coverage.multi_source_composition !== false || coverage.cross_source_deduplication !== false) throw new Error("OPS_PRODUCTION_COVERAGE_SINGLE_SOURCE_REQUIRED");
  const capability = coverage.event_class_capabilities.find(item => item.domain_ref === "domain:operations" && item.event_class_ref === OPERATIONS_PLANNED_PRODUCTION_EVENT_CLASS);
  if (!capability || OPERATIONS_PLANNED_PRODUCTION_REQUIRED_FIELDS.some(field => !capability.required_semantic_field_refs.includes(field) || !capability.guaranteed_semantic_field_refs.includes(field))) throw new Error("OPS_PRODUCTION_COVERAGE_REQUIRED_FIELDS_NOT_GUARANTEED");
  const identities = new Set<string>();
  for (const fact of input.production_facts) {
    if (fact.fact_family !== "PRODUCTION_ORDERS" || fact.semantic.family !== "PRODUCTION_ORDERS") throw new Error("OPS_PRODUCTION_COVERAGE_FACT_FAMILY_INVALID");
    if (fact.company_id !== scope.company_id || fact.provenance.source_system !== input.source_namespace) throw new Error("OPS_PRODUCTION_COVERAGE_FACT_SOURCE_MISMATCH");
    if (!fact.source_fact_ref.trim() || !fact.semantic.production_order_id.trim() || !fact.semantic.output_article.trim() || !fact.semantic.quantity.source_unit.trim() || !Number.isFinite(fact.semantic.quantity.value)) throw new Error("OPS_PRODUCTION_COVERAGE_FACT_FIELDS_INVALID");
    const availableAt = fact.semantic.planned_output_available_at;
    if (!availableAt || !Number.isFinite(Date.parse(availableAt)) || new Date(Date.parse(availableAt)).toISOString() !== availableAt) throw new Error("OPS_PRODUCTION_COVERAGE_OUTPUT_AVAILABILITY_REQUIRED");
    const identity = `${fact.provenance.source_system}|${fact.semantic.production_order_id}`;
    if (identities.has(identity)) throw new Error("OPS_PRODUCTION_COVERAGE_FACT_IDENTITY_DUPLICATE");
    identities.add(identity);
  }
  return createOperationsPlannedProductionSnapshotCoverageProfileV1();
}
