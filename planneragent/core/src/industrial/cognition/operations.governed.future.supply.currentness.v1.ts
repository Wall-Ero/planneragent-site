import type { OperationalSignalScopeBindingV1 } from "../../cockpit/operational.signal.evaluation.scope.v1";
import { verifyOperationalSignalEvaluationScopeV1 } from "../../cockpit/operational.signal.evaluation.scope.v1";
import type { GovernedSourceEventCoverageCapabilityV1 } from "../../cognition/governed.source.event.coverage.capability.v1";
import { verifyGovernedSourceEventCoverageCapabilityV1 } from "../../cognition/governed.source.event.coverage.capability.v1";
import type { OperationsGovernedFutureSupplyFactV1 } from "./operations.governed.future.supply.fact.v1";
import { resolveOperationsCurrentGovernedFutureSupplyVersionV1, verifyOperationsGovernedFutureSupplyFactV1 } from "./operations.governed.future.supply.fact.v1";

export const OPERATIONS_FUTURE_SUPPLY_CURRENTNESS_POLICY_REF = "policy:operations-governed-future-supply-currentness-v1" as const;
export const OPERATIONS_FUTURE_SUPPLY_CURRENTNESS_PRODUCER_REF = "producer:operations-governed-future-supply-current-set-v1" as const;
export const OPERATIONS_FUTURE_SUPPLY_EVENT_CLASS = "event-class:governed-future-supply-statement" as const;
export const OPERATIONS_FUTURE_SUPPLY_REQUIRED_FIELDS = Object.freeze([
  "field:available-at", "field:commitment-identity", "field:commitment-line-identity", "field:commitment-version",
  "field:company", "field:effective-at", "field:item", "field:lifecycle", "field:quantity",
  "field:realization-relation", "field:source-namespace", "field:source-record-identity",
  "field:supersession-relation", "field:unit",
] as const);

export type OperationsGovernedFutureSupplyCurrentSetV1 = Readonly<{
  version: 1;
  policy_ref: typeof OPERATIONS_FUTURE_SUPPLY_CURRENTNESS_POLICY_REF;
  policy_version: "1";
  producer_ref: typeof OPERATIONS_FUTURE_SUPPLY_CURRENTNESS_PRODUCER_REF;
  producer_version: "1";
  tenant_id: string;
  company_id: string;
  request_id: string;
  scope_id: string;
  scope_digest: string;
  evidence_selection_ref: string;
  source_snapshot_ref: string;
  evidence_as_of: string;
  source_identity_ref: string;
  source_namespace: string;
  coverage_ref: string;
  coverage_digest: string;
  coverage_status: "COMPLETE";
  current_fact_refs: readonly string[];
  current_fact_digests: readonly string[];
  historical_or_excluded_fact_refs: readonly string[];
  qualification_refs: readonly string[];
  provenance_refs: readonly string[];
  causal_lineage_refs: readonly string[];
  current_set_id: string;
  current_set_digest: string;
  digest_algorithm: "SHA-256";
  complete_current_set: true;
  single_source_only: true;
  caller_selected_membership: false;
  caller_asserted_completeness: false;
  counterfactual: false;
  recommended: false;
  executable: false;
  grants_authority: false;
  grants_execution: false;
}>;

export type OperationsGovernedFutureSupplyCurrentSetResultV1 = Readonly<{
  current_set: OperationsGovernedFutureSupplyCurrentSetV1;
  current_facts: readonly OperationsGovernedFutureSupplyFactV1[];
}>;

const forbidden = ["current_version", "current_members", "complete_current_set", "scenario_supply", "optimizer_supply", "counterfactual_supply", "learned_eta", "llm_eta", "authority_tier"];
function required(value: string | undefined, code: string): string { const result = value?.trim(); if (!result) throw new Error(code); return result; }
function refs(values: readonly string[], code: string, allowEmpty = false): readonly string[] { const result = [...new Set(values.map(value => required(value, code)))].sort(); if (!allowEmpty && !result.length) throw new Error(code); return result; }
function canonical(value: unknown): string { if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`; if (value && typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).filter(([, child]) => child !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => `${JSON.stringify(key)}:${canonical(child)}`).join(",")}}`; return JSON.stringify(value); }
async function sha(value: unknown): Promise<string> { const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical(value))); return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join(""); }
function freeze<T>(value: T): Readonly<T> { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.values(value as Record<string, unknown>).forEach(freeze); Object.freeze(value); } return value; }
function commitmentKey(fact: OperationsGovernedFutureSupplyFactV1): string { return `${fact.tenant_id}|${fact.company_id}|${fact.source_namespace}|${fact.external_commitment_ref}|${fact.external_line_ref ?? ""}`; }

function validateChains(facts: readonly OperationsGovernedFutureSupplyFactV1[]): Map<string, OperationsGovernedFutureSupplyFactV1[]> {
  const groups = new Map<string, OperationsGovernedFutureSupplyFactV1[]>();
  for (const fact of facts) { const key = commitmentKey(fact), group = groups.get(key) ?? []; group.push(fact); groups.set(key, group); }
  for (const group of groups.values()) {
    const byVersion = new Map<string, OperationsGovernedFutureSupplyFactV1>();
    for (const fact of group) { if (byVersion.has(fact.commitment_version_ref)) throw new Error("OPS_FUTURE_SUPPLY_CURRENTNESS_DUPLICATE_VERSION"); byVersion.set(fact.commitment_version_ref, fact); }
    const successors = new Map<string, number>();
    for (const fact of group) if (fact.supersedes_version_ref) {
      const predecessor = byVersion.get(fact.supersedes_version_ref);
      if (!predecessor) {
        const elsewhere = facts.some(candidate => candidate.commitment_version_ref === fact.supersedes_version_ref && commitmentKey(candidate) !== commitmentKey(fact));
        throw new Error(elsewhere ? "OPS_FUTURE_SUPPLY_CURRENTNESS_CROSS_COMMITMENT_SUPERSESSION" : "OPS_FUTURE_SUPPLY_CURRENTNESS_PREDECESSOR_MISSING");
      }
      successors.set(fact.supersedes_version_ref, (successors.get(fact.supersedes_version_ref) ?? 0) + 1);
    }
    if ([...successors.values()].some(count => count > 1)) throw new Error("OPS_FUTURE_SUPPLY_CURRENTNESS_SUCCESSOR_BRANCH");
    for (const fact of group) { const seen = new Set<string>(); let cursor: OperationsGovernedFutureSupplyFactV1 | undefined = fact; while (cursor?.supersedes_version_ref) { if (seen.has(cursor.commitment_version_ref)) throw new Error("OPS_FUTURE_SUPPLY_CURRENTNESS_SUPERSESSION_CYCLE"); seen.add(cursor.commitment_version_ref); cursor = byVersion.get(cursor.supersedes_version_ref); } }
  }
  return groups;
}

export async function produceOperationsGovernedFutureSupplyCurrentSetV1(input: Readonly<{
  version: 1; tenant_id: string; source_namespace: string; evaluation_scope: OperationalSignalScopeBindingV1;
  source_coverage: GovernedSourceEventCoverageCapabilityV1; source_facts: readonly OperationsGovernedFutureSupplyFactV1[];
  qualification_refs: readonly string[]; provenance_refs: readonly string[]; causal_lineage_refs: readonly string[];
}>): Promise<OperationsGovernedFutureSupplyCurrentSetResultV1> {
  if (input.version !== 1) throw new Error("OPS_FUTURE_SUPPLY_CURRENTNESS_VERSION_UNSUPPORTED");
  for (const key of forbidden) if (key in (input as object)) throw new Error("OPS_FUTURE_SUPPLY_CURRENTNESS_UNSAFE_INPUT");
  await Promise.all([verifyOperationalSignalEvaluationScopeV1(input.evaluation_scope.scope, input.evaluation_scope.scope), verifyGovernedSourceEventCoverageCapabilityV1(input.source_coverage), ...input.source_facts.map(verifyOperationsGovernedFutureSupplyFactV1)]);
  const scope = input.evaluation_scope.scope, coverage = input.source_coverage;
  if (scope.domain !== "operations") throw new Error("OPS_FUTURE_SUPPLY_CURRENTNESS_SCOPE_UNSUPPORTED");
  if (coverage.coverage_status !== "COMPLETE") throw new Error("OPS_FUTURE_SUPPLY_CURRENTNESS_COMPLETE_COVERAGE_REQUIRED");
  if (coverage.tenant_id !== input.tenant_id || coverage.company_id !== scope.company_id || coverage.request_id !== scope.request_id || coverage.scope_id !== scope.scope_id || coverage.scope_digest !== scope.scope_digest || coverage.evidence_selection_ref !== scope.evidence_selection_ref || coverage.source_snapshot_ref !== scope.source_snapshot_ref || coverage.coverage_end !== input.evaluation_scope.evidence_as_of || coverage.multi_source_composition !== false)
    throw new Error("OPS_FUTURE_SUPPLY_CURRENTNESS_COVERAGE_CONTEXT_MISMATCH");
  if (coverage.source_identity_ref !== input.source_namespace || input.source_facts.some(fact => fact.tenant_id !== input.tenant_id || fact.company_id !== scope.company_id || fact.source_namespace !== input.source_namespace))
    throw new Error("OPS_FUTURE_SUPPLY_CURRENTNESS_SOURCE_CONTEXT_MISMATCH");
  const capability = coverage.event_class_capabilities.find(value => value.domain_ref === "domain:operations" && value.event_class_ref === OPERATIONS_FUTURE_SUPPLY_EVENT_CLASS);
  if (!capability || OPERATIONS_FUTURE_SUPPLY_REQUIRED_FIELDS.some(field => !capability.guaranteed_semantic_field_refs.includes(field)))
    throw new Error("OPS_FUTURE_SUPPLY_CURRENTNESS_COVERAGE_FIELDS_REQUIRED");
  const groups = validateChains(input.source_facts), current: OperationsGovernedFutureSupplyFactV1[] = [];
  for (const group of groups.values()) {
    const selected = await resolveOperationsCurrentGovernedFutureSupplyVersionV1(group, { tenant_id: input.tenant_id, company_id: scope.company_id, source_namespace: input.source_namespace, external_commitment_ref: group[0]!.external_commitment_ref, ...(group[0]!.external_line_ref ? { external_line_ref: group[0]!.external_line_ref } : {}), evidence_as_of: input.evaluation_scope.evidence_as_of });
    if (selected) current.push(selected);
  }
  current.sort((a, b) => a.fact_id.localeCompare(b.fact_id));
  const currentIds = new Set(current.map(fact => fact.fact_id));
  const historical = input.source_facts.filter(fact => !currentIds.has(fact.fact_id)).map(fact => fact.fact_id).sort();
  const qualification = refs([...coverage.qualification_refs, ...input.source_facts.flatMap(fact => fact.qualification_refs), ...input.qualification_refs], "OPS_FUTURE_SUPPLY_CURRENTNESS_QUALIFICATION_REQUIRED");
  const provenance = refs([...coverage.provenance_refs, ...input.source_facts.flatMap(fact => fact.provenance_refs), ...input.provenance_refs], "OPS_FUTURE_SUPPLY_CURRENTNESS_PROVENANCE_REQUIRED");
  const lineage = refs([coverage.capability_id, ...input.source_facts.map(fact => fact.fact_id), ...input.source_facts.flatMap(fact => fact.causal_lineage_refs), ...input.causal_lineage_refs, OPERATIONS_FUTURE_SUPPLY_CURRENTNESS_POLICY_REF, OPERATIONS_FUTURE_SUPPLY_CURRENTNESS_PRODUCER_REF], "OPS_FUTURE_SUPPLY_CURRENTNESS_LINEAGE_REQUIRED");
  const semantic = { version: 1 as const, policy_ref: OPERATIONS_FUTURE_SUPPLY_CURRENTNESS_POLICY_REF, policy_version: "1" as const, producer_ref: OPERATIONS_FUTURE_SUPPLY_CURRENTNESS_PRODUCER_REF, producer_version: "1" as const,
    tenant_id: input.tenant_id, company_id: scope.company_id, request_id: scope.request_id, scope_id: scope.scope_id, scope_digest: scope.scope_digest,
    evidence_selection_ref: scope.evidence_selection_ref, source_snapshot_ref: scope.source_snapshot_ref, evidence_as_of: input.evaluation_scope.evidence_as_of,
    source_identity_ref: coverage.source_identity_ref, source_namespace: input.source_namespace, coverage_ref: coverage.capability_id, coverage_digest: coverage.capability_digest, coverage_status: "COMPLETE" as const,
    current_fact_refs: current.map(fact => fact.fact_id), current_fact_digests: current.map(fact => fact.fact_digest), historical_or_excluded_fact_refs: historical,
    qualification_refs: qualification, provenance_refs: provenance, causal_lineage_refs: lineage };
  const current_set_digest = await sha(semantic);
  const current_set = freeze({ ...semantic, current_set_id: `operations-governed-future-supply-current-set:sha256:${current_set_digest}`, current_set_digest, digest_algorithm: "SHA-256" as const,
    complete_current_set: true as const, single_source_only: true as const, caller_selected_membership: false as const, caller_asserted_completeness: false as const,
    counterfactual: false as const, recommended: false as const, executable: false as const, grants_authority: false as const, grants_execution: false as const });
  return freeze({ current_set, current_facts: freeze(current) });
}

export async function verifyOperationsGovernedFutureSupplyCurrentSetV1(result: OperationsGovernedFutureSupplyCurrentSetResultV1): Promise<void> {
  await Promise.all(result.current_facts.map(verifyOperationsGovernedFutureSupplyFactV1));
  const value = result.current_set;
  const { current_set_id: _id, current_set_digest: _digest, digest_algorithm: _algorithm, complete_current_set: _complete, single_source_only: _single,
    caller_selected_membership: _membership, caller_asserted_completeness: _callerComplete, counterfactual: _counterfactual, recommended: _recommended,
    executable: _executable, grants_authority: _authority, grants_execution: _execution, ...semantic } = value;
  const digest = await sha(semantic);
  if (value.current_set_digest !== digest || value.current_set_id !== `operations-governed-future-supply-current-set:sha256:${digest}` || value.digest_algorithm !== "SHA-256" || value.complete_current_set !== true || value.single_source_only !== true || value.caller_selected_membership !== false || value.caller_asserted_completeness !== false || value.counterfactual !== false || value.recommended !== false || value.executable !== false || value.grants_authority !== false || value.grants_execution !== false || canonical(value.current_fact_refs) !== canonical(result.current_facts.map(fact => fact.fact_id)) || canonical(value.current_fact_digests) !== canonical(result.current_facts.map(fact => fact.fact_digest)))
    throw new Error("OPS_FUTURE_SUPPLY_CURRENT_SET_INTEGRITY_INVALID");
}
