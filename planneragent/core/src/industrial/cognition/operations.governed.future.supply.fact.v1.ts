export const OPERATIONS_GOVERNED_FUTURE_SUPPLY_FACT_POLICY_REF =
  "policy:operations-governed-future-supply-fact-v1" as const;

export type OperationsFutureSupplyLifecycleV1 =
  | "ACTIVE"
  | "CANCELLED"
  | "REALIZED"
  | "SUPERSEDED";

export type OperationsGovernedFutureSupplyFactV1 = Readonly<{
  version: 1;
  policy_ref: typeof OPERATIONS_GOVERNED_FUTURE_SUPPLY_FACT_POLICY_REF;
  policy_version: "1";
  tenant_id: string;
  company_id: string;
  source_namespace: string;
  source_record_ref: string;
  external_commitment_ref: string;
  external_line_ref?: string;
  commitment_version_ref: string;
  supersedes_version_ref?: string;
  item_ref: string;
  quantity: Readonly<{ value: number; source_unit: string }>;
  available_at: string;
  effective_at: string;
  observed_at: string;
  lifecycle: OperationsFutureSupplyLifecycleV1;
  lifecycle_evidence_ref: string;
  realization?: Readonly<{
    receipt_event_ref: string;
    realized_quantity: Readonly<{ value: number; source_unit: string }>;
  }>;
  qualification_refs: readonly string[];
  provenance_refs: readonly string[];
  causal_lineage_refs: readonly string[];
  fact_id: string;
  fact_digest: string;
  digest_algorithm: "SHA-256";
  epistemic_basis: "DETERMINISTIC_GOVERNED_SOURCE_FACT";
  current_knowledge_fact: true;
  physical_inventory: false;
  forecast: false;
  counterfactual: false;
  recommended: false;
  executable: false;
  grants_authority: false;
  grants_execution: false;
}>;

type Input = Readonly<{
  version: 1;
  tenant_id: string;
  company_id: string;
  source_namespace: string;
  source_record_ref: string;
  external_commitment_ref: string;
  external_line_ref?: string;
  commitment_version_ref: string;
  supersedes_version_ref?: string;
  item_ref: string;
  quantity: Readonly<{ value: number; source_unit: string }>;
  available_at: string;
  effective_at: string;
  observed_at: string;
  lifecycle: OperationsFutureSupplyLifecycleV1;
  lifecycle_evidence_ref: string;
  realization?: Readonly<{
    receipt_event_ref: string;
    realized_quantity: Readonly<{ value: number; source_unit: string }>;
  }>;
  qualification_refs: readonly string[];
  provenance_refs: readonly string[];
  causal_lineage_refs: readonly string[];
}>;

const lifecycles = new Set<OperationsFutureSupplyLifecycleV1>([
  "ACTIVE", "CANCELLED", "REALIZED", "SUPERSEDED",
]);
const forbidden = [
  "scenario_supply", "optimizer_supply", "counterfactual_supply", "learned_eta",
  "llm_eta", "baseline_availability", "authority_tier",
];

function required(value: string | undefined, code: string): string {
  const normalized = value?.trim();
  if (!normalized) throw new Error(code);
  return normalized;
}
function instant(value: string, code: string): string {
  if (!Number.isFinite(Date.parse(value))) throw new Error(code);
  return value;
}
function refs(values: readonly string[], code: string): readonly string[] {
  const normalized = [...new Set(values.map(value => required(value, code)))].sort();
  if (!normalized.length) throw new Error(code);
  return normalized;
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value as Record<string, unknown>)
    .filter(([, child]) => child !== undefined).sort(([a], [b]) => a.localeCompare(b))
    .map(([key, child]) => `${JSON.stringify(key)}:${canonical(child)}`).join(",")}}`;
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

export async function createOperationsGovernedFutureSupplyFactV1(input: Input): Promise<OperationsGovernedFutureSupplyFactV1> {
  if (input.version !== 1) throw new Error("OPS_FUTURE_SUPPLY_FACT_VERSION_UNSUPPORTED");
  for (const key of forbidden) if (key in (input as object)) throw new Error("OPS_FUTURE_SUPPLY_UNSAFE_INPUT");
  if (!lifecycles.has(input.lifecycle)) throw new Error("OPS_FUTURE_SUPPLY_LIFECYCLE_INVALID");
  if (!Number.isFinite(input.quantity?.value) || input.quantity.value <= 0) throw new Error("OPS_FUTURE_SUPPLY_QUANTITY_INVALID");
  const sourceUnit = required(input.quantity.source_unit, "OPS_FUTURE_SUPPLY_UNIT_REQUIRED");
  if (input.supersedes_version_ref === input.commitment_version_ref) throw new Error("OPS_FUTURE_SUPPLY_SELF_SUPERSESSION");
  if (input.lifecycle === "SUPERSEDED" && !input.supersedes_version_ref) throw new Error("OPS_FUTURE_SUPPLY_SUPERSESSION_REF_REQUIRED");
  if (input.lifecycle === "REALIZED") {
    if (!input.realization || input.realization.realized_quantity.value !== input.quantity.value || input.realization.realized_quantity.source_unit !== sourceUnit)
      throw new Error("OPS_FUTURE_SUPPLY_FULL_REALIZATION_REQUIRED");
  } else if (input.realization) throw new Error("OPS_FUTURE_SUPPLY_REALIZATION_LIFECYCLE_MISMATCH");
  const semantic = {
    version: 1 as const,
    policy_ref: OPERATIONS_GOVERNED_FUTURE_SUPPLY_FACT_POLICY_REF,
    policy_version: "1" as const,
    tenant_id: required(input.tenant_id, "OPS_FUTURE_SUPPLY_TENANT_REQUIRED"),
    company_id: required(input.company_id, "OPS_FUTURE_SUPPLY_COMPANY_REQUIRED"),
    source_namespace: required(input.source_namespace, "OPS_FUTURE_SUPPLY_SOURCE_REQUIRED"),
    source_record_ref: required(input.source_record_ref, "OPS_FUTURE_SUPPLY_SOURCE_RECORD_REQUIRED"),
    external_commitment_ref: required(input.external_commitment_ref, "OPS_FUTURE_SUPPLY_COMMITMENT_REQUIRED"),
    ...(input.external_line_ref ? { external_line_ref: required(input.external_line_ref, "OPS_FUTURE_SUPPLY_LINE_INVALID") } : {}),
    commitment_version_ref: required(input.commitment_version_ref, "OPS_FUTURE_SUPPLY_REVISION_REQUIRED"),
    ...(input.supersedes_version_ref ? { supersedes_version_ref: required(input.supersedes_version_ref, "OPS_FUTURE_SUPPLY_SUPERSESSION_INVALID") } : {}),
    item_ref: required(input.item_ref, "OPS_FUTURE_SUPPLY_ITEM_REQUIRED"),
    quantity: { value: input.quantity.value, source_unit: sourceUnit },
    available_at: instant(input.available_at, "OPS_FUTURE_SUPPLY_AVAILABLE_AT_INVALID"),
    effective_at: instant(input.effective_at, "OPS_FUTURE_SUPPLY_EFFECTIVE_AT_INVALID"),
    observed_at: instant(input.observed_at, "OPS_FUTURE_SUPPLY_OBSERVED_AT_INVALID"),
    lifecycle: input.lifecycle,
    lifecycle_evidence_ref: required(input.lifecycle_evidence_ref, "OPS_FUTURE_SUPPLY_LIFECYCLE_EVIDENCE_REQUIRED"),
    ...(input.realization ? { realization: {
      receipt_event_ref: required(input.realization.receipt_event_ref, "OPS_FUTURE_SUPPLY_RECEIPT_REF_REQUIRED"),
      realized_quantity: { value: input.realization.realized_quantity.value, source_unit: sourceUnit },
    } } : {}),
    qualification_refs: refs(input.qualification_refs, "OPS_FUTURE_SUPPLY_QUALIFICATION_REQUIRED"),
    provenance_refs: refs(input.provenance_refs, "OPS_FUTURE_SUPPLY_PROVENANCE_REQUIRED"),
    causal_lineage_refs: refs([input.source_record_ref, input.external_commitment_ref, input.commitment_version_ref, input.lifecycle_evidence_ref, ...input.causal_lineage_refs], "OPS_FUTURE_SUPPLY_LINEAGE_REQUIRED"),
  };
  const fact_digest = await sha(semantic);
  return freeze({ ...semantic, fact_id: `operations-governed-future-supply:sha256:${fact_digest}`, fact_digest,
    digest_algorithm: "SHA-256" as const, epistemic_basis: "DETERMINISTIC_GOVERNED_SOURCE_FACT" as const,
    current_knowledge_fact: true as const, physical_inventory: false as const, forecast: false as const,
    counterfactual: false as const, recommended: false as const, executable: false as const,
    grants_authority: false as const, grants_execution: false as const });
}

export async function verifyOperationsGovernedFutureSupplyFactV1(value: OperationsGovernedFutureSupplyFactV1): Promise<void> {
  const { fact_id: _id, fact_digest: _digest, digest_algorithm: _algorithm, epistemic_basis: _basis,
    current_knowledge_fact: _current, physical_inventory: _inventory, forecast: _forecast,
    counterfactual: _counterfactual, recommended: _recommended, executable: _executable,
    grants_authority: _authority, grants_execution: _execution, ...semantic } = value;
  const digest = await sha(semantic);
  if (value.policy_ref !== OPERATIONS_GOVERNED_FUTURE_SUPPLY_FACT_POLICY_REF || value.policy_version !== "1" ||
    value.fact_digest !== digest || value.fact_id !== `operations-governed-future-supply:sha256:${digest}` ||
    value.digest_algorithm !== "SHA-256" || value.epistemic_basis !== "DETERMINISTIC_GOVERNED_SOURCE_FACT" ||
    value.current_knowledge_fact !== true || value.physical_inventory !== false || value.forecast !== false ||
    value.counterfactual !== false || value.recommended !== false || value.executable !== false ||
    value.grants_authority !== false || value.grants_execution !== false)
    throw new Error("OPS_FUTURE_SUPPLY_FACT_INTEGRITY_INVALID");
}

export async function resolveOperationsCurrentGovernedFutureSupplyVersionV1(
  facts: readonly OperationsGovernedFutureSupplyFactV1[],
  key: Readonly<{ tenant_id: string; company_id: string; source_namespace: string; external_commitment_ref: string; external_line_ref?: string; evidence_as_of: string }>,
): Promise<OperationsGovernedFutureSupplyFactV1 | undefined> {
  await Promise.all(facts.map(verifyOperationsGovernedFutureSupplyFactV1));
  const asOf = Date.parse(instant(key.evidence_as_of, "OPS_FUTURE_SUPPLY_EVIDENCE_AS_OF_INVALID"));
  const matches = facts.filter(fact => fact.tenant_id === key.tenant_id && fact.company_id === key.company_id &&
    fact.source_namespace === key.source_namespace && fact.external_commitment_ref === key.external_commitment_ref &&
    fact.external_line_ref === key.external_line_ref && Date.parse(fact.effective_at) <= asOf);
  if (!matches.length) return undefined;
  const byVersion = new Map(matches.map(fact => [fact.commitment_version_ref, fact]));
  if (byVersion.size !== matches.length) throw new Error("OPS_FUTURE_SUPPLY_VERSION_DUPLICATE");
  const dominates = (candidate: OperationsGovernedFutureSupplyFactV1, other: OperationsGovernedFutureSupplyFactV1): boolean => {
    let cursor: OperationsGovernedFutureSupplyFactV1 | undefined = candidate;
    const seen = new Set<string>();
    while (cursor?.supersedes_version_ref && !seen.has(cursor.commitment_version_ref)) {
      seen.add(cursor.commitment_version_ref);
      if (cursor.supersedes_version_ref === other.commitment_version_ref) return true;
      cursor = byVersion.get(cursor.supersedes_version_ref);
    }
    return false;
  };
  const governing = matches.filter(candidate => matches.every(other => candidate === other || dominates(candidate, other)));
  if (governing.length !== 1) throw new Error("OPS_FUTURE_SUPPLY_CURRENT_VERSION_AMBIGUOUS");
  return governing[0]!.lifecycle === "ACTIVE" ? governing[0] : undefined;
}
