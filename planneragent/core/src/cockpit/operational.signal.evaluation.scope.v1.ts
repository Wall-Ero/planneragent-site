// Content-free attribution for an operational cockpit signal evaluation.
// It identifies caller-selected context; it does not select evidence or parse questions.
import type { OperationalSubjectRefV1 } from "../cognition/canonical.operational.roles.v1";

export type OperationalSignalScopeTypeV1 = "REQUEST_DATASET" | "ENTITY" | "PATH";
export type OperationalSignalEntityTypeV1 = "SKU" | "ORDER" | "SUPPLIER";

export type OperationalSignalEvaluationScopeInputV1 = Readonly<{
  version: 1;
  scope_type: OperationalSignalScopeTypeV1;
  request_id: string;
  company_id: string;
  domain: string;
  evidence_selection_ref: string;
  source_snapshot_ref: string;
  question_ref?: string;
  entity?: Readonly<{ entity_type: OperationalSignalEntityTypeV1; entity_ref: string }>;
  operational_subject?: OperationalSubjectRefV1;
  path?: Readonly<{ subgraph_ref: string; seed_refs: readonly string[] }>;
}>;

export type OperationalSignalEvaluationScopeV1 = OperationalSignalEvaluationScopeInputV1 & Readonly<{
  scope_id: string;
  scope_digest: string;
  digest_algorithm: "SHA-256";
  company_global_claim: false;
  grants_execution: false;
}>;

export type OperationalSignalScopeBindingV1 = Readonly<{
  version: 1;
  scope: OperationalSignalEvaluationScopeV1;
  evidence_as_of: string;
  evaluated_at: string;
}>;

function required(value: string, code: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(code);
  return normalized;
}

function normalizeInput(input: OperationalSignalEvaluationScopeInputV1): OperationalSignalEvaluationScopeInputV1 {
  if (input.version !== 1) throw new Error("SCOPE_VERSION_UNSUPPORTED");
  const base = {
    version: 1 as const,
    scope_type: input.scope_type,
    request_id: required(input.request_id, "SCOPE_REQUEST_ID_REQUIRED"),
    company_id: required(input.company_id, "SCOPE_COMPANY_ID_REQUIRED"),
    domain: required(input.domain, "SCOPE_DOMAIN_REQUIRED"),
    evidence_selection_ref: required(input.evidence_selection_ref, "SCOPE_EVIDENCE_SELECTION_REF_REQUIRED"),
    source_snapshot_ref: required(input.source_snapshot_ref, "SCOPE_SOURCE_SNAPSHOT_REF_REQUIRED"),
    ...(input.question_ref ? { question_ref: required(input.question_ref, "SCOPE_QUESTION_REF_INVALID") } : {}),
  };

  if (input.scope_type === "REQUEST_DATASET") {
    if (input.entity || input.operational_subject || input.path) throw new Error("SCOPE_TYPE_SUBSTITUTION");
    return base;
  }
  if (input.scope_type === "ENTITY") {
    if ((!input.entity && !input.operational_subject) || (input.entity && input.operational_subject) || input.path) throw new Error("SCOPE_TYPE_SUBSTITUTION");
    if (input.operational_subject) {
      if (input.operational_subject.company_id !== base.company_id || input.operational_subject.domain_ref !== `domain:${base.domain}`) throw new Error("SCOPE_SUBJECT_BINDING_MISMATCH");
      return { ...base, operational_subject: input.operational_subject };
    }
    return { ...base, entity: { entity_type: input.entity!.entity_type,
      entity_ref: required(input.entity!.entity_ref, "SCOPE_ENTITY_REF_REQUIRED") } };
  }
  if (input.scope_type === "PATH") {
    if (!input.path || input.entity || input.operational_subject) throw new Error("SCOPE_TYPE_SUBSTITUTION");
    const seed_refs = [...new Set(input.path.seed_refs.map((x) => x.trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
    if (!seed_refs.length) throw new Error("SCOPE_PATH_SEEDS_REQUIRED");
    return { ...base, path: {
      subgraph_ref: required(input.path.subgraph_ref, "SCOPE_SUBGRAPH_REF_REQUIRED"),
      seed_refs,
    } };
  }
  throw new Error("SCOPE_TYPE_UNSUPPORTED");
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined).sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function createOperationalSignalEvaluationScopeV1(
  input: OperationalSignalEvaluationScopeInputV1,
): Promise<OperationalSignalEvaluationScopeV1> {
  const normalized = normalizeInput(input);
  const scope_digest = await sha256(canonicalJson(normalized));
  return Object.freeze({ ...normalized,
    scope_id: `operational-signal-scope:sha256:${scope_digest}`,
    scope_digest, digest_algorithm: "SHA-256" as const,
    company_global_claim: false as const, grants_execution: false as const,
  });
}

export async function verifyOperationalSignalEvaluationScopeV1(
  scope: OperationalSignalEvaluationScopeV1,
  expected: Readonly<{ request_id: string; company_id: string }>,
): Promise<void> {
  if (scope.request_id !== expected.request_id) throw new Error("SCOPE_REQUEST_MISMATCH");
  if (scope.company_id !== expected.company_id) throw new Error("SCOPE_COMPANY_MISMATCH");
  if (scope.company_global_claim !== false || scope.grants_execution !== false) throw new Error("SCOPE_BOUNDARY_INVALID");
  const rebuilt = await createOperationalSignalEvaluationScopeV1(scope);
  if (rebuilt.scope_digest !== scope.scope_digest || rebuilt.scope_id !== scope.scope_id) throw new Error("SCOPE_DIGEST_MISMATCH");
}

export async function bindOperationalSignalsToScopeV1(input: Readonly<{
  scope: OperationalSignalEvaluationScopeV1;
  request_id: string;
  company_id: string;
  evidence_as_of: string;
  evaluated_at: string;
}>): Promise<OperationalSignalScopeBindingV1> {
  await verifyOperationalSignalEvaluationScopeV1(input.scope, input);
  if (!Number.isFinite(Date.parse(input.evidence_as_of))) throw new Error("SCOPE_AS_OF_INVALID");
  if (!Number.isFinite(Date.parse(input.evaluated_at))) throw new Error("SCOPE_EVALUATED_AT_INVALID");
  return Object.freeze({ version: 1, scope: input.scope,
    evidence_as_of: input.evidence_as_of, evaluated_at: input.evaluated_at });
}
