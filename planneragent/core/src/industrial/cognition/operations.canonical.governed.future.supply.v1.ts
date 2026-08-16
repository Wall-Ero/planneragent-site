import type { BaselineAvailabilityV1 } from "./operations.baseline.commitment.feasibility.v1";
import type { OperationsGovernedFutureSupplyFactV1 } from "./operations.governed.future.supply.fact.v1";
import { verifyOperationsGovernedFutureSupplyFactV1 } from "./operations.governed.future.supply.fact.v1";
import type { OperationsGovernedFutureSupplyCurrentSetResultV1 } from "./operations.governed.future.supply.currentness.v1";
import { verifyOperationsGovernedFutureSupplyCurrentSetV1 } from "./operations.governed.future.supply.currentness.v1";

export const OPERATIONS_CANONICAL_GOVERNED_FUTURE_SUPPLY_POLICY_REF = "policy:operations-canonical-governed-future-supply-v1" as const;
export const OPERATIONS_CANONICAL_GOVERNED_FUTURE_SUPPLY_PRODUCER_REF = "producer:operations-current-set-to-canonical-future-supply-v1" as const;

export type OperationsCanonicalGovernedFutureSupplyV1 = Readonly<{
  version: 1;
  supply_kind: "GOVERNED_FUTURE_SUPPLY";
  policy_ref: typeof OPERATIONS_CANONICAL_GOVERNED_FUTURE_SUPPLY_POLICY_REF;
  policy_version: "1";
  producer_ref: typeof OPERATIONS_CANONICAL_GOVERNED_FUTURE_SUPPLY_PRODUCER_REF;
  producer_version: "1";
  current_set_ref: string;
  current_set_digest: string;
  source_fact_ref: string;
  source_fact_digest: string;
  tenant_id: string;
  company_id: string;
  request_id: string;
  scope_id: string;
  scope_digest: string;
  evidence_selection_ref: string;
  source_snapshot_ref: string;
  evidence_as_of: string;
  source_namespace: string;
  external_commitment_ref: string;
  external_line_ref?: string;
  commitment_version_ref: string;
  item_ref: string;
  quantity: Readonly<{ value: number; source_unit: string }>;
  knowledge_effective_at: string;
  available_at: string;
  qualification_refs: readonly string[];
  provenance_refs: readonly string[];
  causal_lineage_refs: readonly string[];
  canonical_supply_id: string;
  canonical_supply_digest: string;
  digest_algorithm: "SHA-256";
  epistemic_basis: "DETERMINISTIC_GOVERNED_CURRENT_KNOWLEDGE";
  current_governed_knowledge: true;
  physical_inventory: false;
  forecast: false;
  counterfactual: false;
  aggregated: false;
  caller_supplied_quantity: false;
  caller_supplied_eta: false;
  selected: false;
  recommended: false;
  executable: false;
  grants_authority: false;
  grants_execution: false;
}>;

const forbidden = ["quantity", "available_at", "effective_at", "current_version", "current_membership", "scenario_supply", "optimizer_supply", "counterfactual_supply", "learned_supply", "llm_eta", "authority_tier", "commercial_plan", "credit_balance", "remaining_capacity", "economic_approval", "upgrade_state", "model_cost"];
function required(value: string | undefined, code: string): string { const result = value?.trim(); if (!result) throw new Error(code); return result; }
function refs(values: readonly string[], code: string): readonly string[] { const result = [...new Set(values.map(value => required(value, code)))].sort(); if (!result.length) throw new Error(code); return result; }
function canonical(value: unknown): string { if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`; if (value && typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).filter(([, child]) => child !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => `${JSON.stringify(key)}:${canonical(child)}`).join(",")}}`; return JSON.stringify(value); }
async function sha(value: unknown): Promise<string> { const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical(value))); return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join(""); }
function freeze<T>(value: T): Readonly<T> { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.values(value as Record<string, unknown>).forEach(freeze); Object.freeze(value); } return value; }

export async function bindOperationsCanonicalGovernedFutureSupplyV1(input: Readonly<{
  version: 1;
  current_set_result: OperationsGovernedFutureSupplyCurrentSetResultV1;
  source_fact: OperationsGovernedFutureSupplyFactV1;
  qualification_refs: readonly string[];
  provenance_refs: readonly string[];
  causal_lineage_refs: readonly string[];
}>): Promise<OperationsCanonicalGovernedFutureSupplyV1> {
  if (input.version !== 1) throw new Error("OPS_CANONICAL_FUTURE_SUPPLY_VERSION_UNSUPPORTED");
  for (const key of forbidden) if (key in (input as object)) throw new Error("OPS_CANONICAL_FUTURE_SUPPLY_UNSAFE_INPUT");
  await Promise.all([verifyOperationsGovernedFutureSupplyCurrentSetV1(input.current_set_result), verifyOperationsGovernedFutureSupplyFactV1(input.source_fact)]);
  const set = input.current_set_result.current_set, fact = input.source_fact;
  const member = input.current_set_result.current_facts.find(candidate => candidate.fact_id === fact.fact_id);
  const index = set.current_fact_refs.indexOf(fact.fact_id);
  if (!member || member.fact_digest !== fact.fact_digest || index < 0 || set.current_fact_digests[index] !== fact.fact_digest)
    throw new Error("OPS_CANONICAL_FUTURE_SUPPLY_EXACT_MEMBERSHIP_REQUIRED");
  if (fact.lifecycle !== "ACTIVE" || fact.realization) throw new Error("OPS_CANONICAL_FUTURE_SUPPLY_ACTIVE_MEMBER_REQUIRED");
  if (fact.tenant_id !== set.tenant_id || fact.company_id !== set.company_id || fact.source_namespace !== set.source_namespace || Date.parse(fact.effective_at) > Date.parse(set.evidence_as_of))
    throw new Error("OPS_CANONICAL_FUTURE_SUPPLY_CONTEXT_MISMATCH");
  const semantic = {
    version: 1 as const, supply_kind: "GOVERNED_FUTURE_SUPPLY" as const,
    policy_ref: OPERATIONS_CANONICAL_GOVERNED_FUTURE_SUPPLY_POLICY_REF, policy_version: "1" as const,
    producer_ref: OPERATIONS_CANONICAL_GOVERNED_FUTURE_SUPPLY_PRODUCER_REF, producer_version: "1" as const,
    current_set_ref: set.current_set_id, current_set_digest: set.current_set_digest,
    source_fact_ref: fact.fact_id, source_fact_digest: fact.fact_digest,
    tenant_id: set.tenant_id, company_id: set.company_id, request_id: set.request_id, scope_id: set.scope_id, scope_digest: set.scope_digest,
    evidence_selection_ref: set.evidence_selection_ref, source_snapshot_ref: set.source_snapshot_ref, evidence_as_of: set.evidence_as_of,
    source_namespace: fact.source_namespace, external_commitment_ref: fact.external_commitment_ref,
    ...(fact.external_line_ref ? { external_line_ref: fact.external_line_ref } : {}), commitment_version_ref: fact.commitment_version_ref,
    item_ref: fact.item_ref, quantity: { value: fact.quantity.value, source_unit: fact.quantity.source_unit },
    knowledge_effective_at: fact.effective_at, available_at: fact.available_at,
    qualification_refs: refs([...set.qualification_refs, ...fact.qualification_refs, ...input.qualification_refs], "OPS_CANONICAL_FUTURE_SUPPLY_QUALIFICATION_REQUIRED"),
    provenance_refs: refs([...set.provenance_refs, ...fact.provenance_refs, ...input.provenance_refs], "OPS_CANONICAL_FUTURE_SUPPLY_PROVENANCE_REQUIRED"),
    causal_lineage_refs: refs([...set.causal_lineage_refs, ...fact.causal_lineage_refs, set.current_set_id, fact.fact_id, ...input.causal_lineage_refs, OPERATIONS_CANONICAL_GOVERNED_FUTURE_SUPPLY_POLICY_REF, OPERATIONS_CANONICAL_GOVERNED_FUTURE_SUPPLY_PRODUCER_REF], "OPS_CANONICAL_FUTURE_SUPPLY_LINEAGE_REQUIRED"),
  };
  const canonical_supply_digest = await sha(semantic);
  return freeze({ ...semantic, canonical_supply_id: `operations-canonical-governed-future-supply:sha256:${canonical_supply_digest}`, canonical_supply_digest,
    digest_algorithm: "SHA-256" as const, epistemic_basis: "DETERMINISTIC_GOVERNED_CURRENT_KNOWLEDGE" as const,
    current_governed_knowledge: true as const, physical_inventory: false as const, forecast: false as const, counterfactual: false as const,
    aggregated: false as const, caller_supplied_quantity: false as const, caller_supplied_eta: false as const, selected: false as const,
    recommended: false as const, executable: false as const, grants_authority: false as const, grants_execution: false as const });
}

export async function verifyOperationsCanonicalGovernedFutureSupplyV1(value: OperationsCanonicalGovernedFutureSupplyV1): Promise<void> {
  const { canonical_supply_id: _id, canonical_supply_digest: _digest, digest_algorithm: _algorithm, epistemic_basis: _basis,
    current_governed_knowledge: _current, physical_inventory: _inventory, forecast: _forecast, counterfactual: _counterfactual,
    aggregated: _aggregated, caller_supplied_quantity: _quantity, caller_supplied_eta: _eta, selected: _selected,
    recommended: _recommended, executable: _executable, grants_authority: _authority, grants_execution: _execution, ...semantic } = value;
  const digest = await sha(semantic);
  if (value.policy_ref !== OPERATIONS_CANONICAL_GOVERNED_FUTURE_SUPPLY_POLICY_REF || value.producer_ref !== OPERATIONS_CANONICAL_GOVERNED_FUTURE_SUPPLY_PRODUCER_REF ||
    value.canonical_supply_digest !== digest || value.canonical_supply_id !== `operations-canonical-governed-future-supply:sha256:${digest}` || value.digest_algorithm !== "SHA-256" ||
    value.epistemic_basis !== "DETERMINISTIC_GOVERNED_CURRENT_KNOWLEDGE" || value.current_governed_knowledge !== true || value.physical_inventory !== false ||
    value.forecast !== false || value.counterfactual !== false || value.aggregated !== false || value.caller_supplied_quantity !== false || value.caller_supplied_eta !== false ||
    value.selected !== false || value.recommended !== false || value.executable !== false || value.grants_authority !== false || value.grants_execution !== false)
    throw new Error("OPS_CANONICAL_FUTURE_SUPPLY_INTEGRITY_INVALID");
}

export async function projectOperationsCanonicalGovernedFutureSupplyToBaselineAvailabilityV1(value: OperationsCanonicalGovernedFutureSupplyV1): Promise<BaselineAvailabilityV1> {
  await verifyOperationsCanonicalGovernedFutureSupplyV1(value);
  if (value.quantity.source_unit !== "EA") throw new Error("OPS_CANONICAL_FUTURE_SUPPLY_UNIT_PROJECTION_UNSUPPORTED");
  return freeze({ evidence_observed_at: value.knowledge_effective_at, evidence_refs: [value.canonical_supply_id, value.current_set_ref, value.source_fact_ref],
    qualification_refs: value.qualification_refs, provenance_refs: value.provenance_refs,
    causal_lineage_refs: refs([...value.causal_lineage_refs, value.canonical_supply_id], "OPS_CANONICAL_FUTURE_SUPPLY_PROJECTION_LINEAGE_REQUIRED"),
    availability_ref: value.canonical_supply_id, kind: "GOVERNED_FUTURE_SUPPLY" as const, item_ref: value.item_ref,
    quantity: { value: value.quantity.value, unit_ref: "unit:EACH" as const }, available_at: value.available_at });
}
