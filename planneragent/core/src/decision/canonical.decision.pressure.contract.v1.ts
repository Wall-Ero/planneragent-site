import type { OperationalSignalScopeBindingV1 } from "../cockpit/operational.signal.evaluation.scope.v1";
import { verifyOperationalSignalEvaluationScopeV1 } from "../cockpit/operational.signal.evaluation.scope.v1";

export type CanonicalDecisionPressureLevelV1 = "LOW" | "MEDIUM" | "HIGH";

export type DecisionPressureConsequenceCategoryV1 =
  | "PRODUCTION_INTERRUPTION"
  | "CAPACITY_LOSS"
  | "DOWNSTREAM_DISRUPTION"
  | "SERVICE_IMPACT"
  | "CORRECTION_COST_INCREASE"
  | "CORRECTIVE_OPTION_LOSS";

export type DecisionPressureTemporalEvidenceKindV1 =
  | "CONSEQUENCE_TIMING"
  | "DECISION_WINDOW"
  | "OPERATIONAL_SLACK"
  | "ABSORBABLE_DELAY"
  | "OPTION_EXPIRATION"
  | "CORRECTION_FEASIBILITY"
  | "PROPAGATION_TIMING";

export type DecisionPressureCostOfWaitingKindV1 =
  | "SLACK_CONSUMPTION"
  | "CORRECTION_COST_CHANGE"
  | "CORRECTIVE_OPTION_REDUCTION"
  | "DISRUPTION_INCREASE"
  | "CORRECTION_DIFFICULTY_INCREASE";

export type DecisionPressureReasonCodeV1 =
  | "NO_MATERIAL_CONSEQUENCE_WITHIN_SCOPE"
  | "DECISION_WINDOW_REMAINS_OPEN"
  | "OPERATIONAL_SLACK_REMAINS_AVAILABLE"
  | "MATERIAL_CONSEQUENCE_APPROACHING"
  | "DECISION_WINDOW_NARROWING"
  | "OPERATIONAL_SLACK_CONSUMING"
  | "CORRECTIVE_OPTIONS_SHRINKING"
  | "CORRECTION_COST_INCREASING"
  | "DOWNSTREAM_PROPAGATION_APPROACHING";

export type DecisionPressureConditionV1 = Readonly<{
  condition_ref: string;
  governed_evidence_refs: readonly string[];
}>;

export type DecisionPressureConsequenceV1 = Readonly<{
  consequence_ref: string;
  category: DecisionPressureConsequenceCategoryV1;
  affected_operational_refs: readonly string[];
  causal_lineage_refs: readonly string[];
}>;

export type DecisionPressureMaterialityV1 = Readonly<{
  consequence_ref: string;
  material_within_scope: boolean;
  materiality_evidence_refs: readonly string[];
}>;

export type DecisionPressureTemporalEvidenceV1 = Readonly<{
  temporal_evidence_ref: string;
  kind: DecisionPressureTemporalEvidenceKindV1;
  consequence_refs: readonly string[];
}>;

export type DecisionPressureCostOfWaitingEvidenceV1 = Readonly<{
  cost_of_waiting_evidence_ref: string;
  kind: DecisionPressureCostOfWaitingKindV1;
  consequence_refs: readonly string[];
  corrective_option_refs: readonly string[];
}>;

export type CanonicalDecisionPressureAssessmentInputV1 = Readonly<{
  version: 1;
  request_id: string;
  company_id: string;
  evaluation_scope: OperationalSignalScopeBindingV1;
  conditions: readonly DecisionPressureConditionV1[];
  consequences: readonly DecisionPressureConsequenceV1[];
  materiality: readonly DecisionPressureMaterialityV1[];
  temporal_evidence: readonly DecisionPressureTemporalEvidenceV1[];
  cost_of_waiting_evidence: readonly DecisionPressureCostOfWaitingEvidenceV1[];
  corrective_option_refs: readonly string[];
  evidence_qualification_refs: readonly string[];
  provenance_refs: readonly string[];
}>;

export type CanonicalDecisionPressureAssessmentV1 = CanonicalDecisionPressureAssessmentInputV1 & Readonly<{
  assessment_id: string;
  assessment_digest: string;
  digest_algorithm: "SHA-256";
  evidence_as_of: string;
  company_global_claim: false;
  grants_execution: false;
  grants_remediation: false;
  observational_only: true;
}>;

export type CanonicalDecisionPressureResultInputV1 = Readonly<{
  version: 1;
  assessment: CanonicalDecisionPressureAssessmentV1;
  level: CanonicalDecisionPressureLevelV1;
  material_consequence_refs: readonly string[];
  decision_window_evidence_refs: readonly string[];
  cost_of_waiting_evidence_refs: readonly string[];
  reason_codes: readonly DecisionPressureReasonCodeV1[];
  evidence_qualification_refs: readonly string[];
  causal_lineage_refs: readonly string[];
}>;

export type CanonicalDecisionPressureResultV1 = Readonly<{
  version: 1;
  result_id: string;
  result_digest: string;
  digest_algorithm: "SHA-256";
  assessment_id: string;
  assessment_digest: string;
  level: CanonicalDecisionPressureLevelV1;
  request_id: string;
  company_id: string;
  scope_id: string;
  scope_digest: string;
  evidence_as_of: string;
  material_consequence_refs: readonly string[];
  decision_window_evidence_refs: readonly string[];
  cost_of_waiting_evidence_refs: readonly string[];
  reason_codes: readonly DecisionPressureReasonCodeV1[];
  evidence_qualification_refs: readonly string[];
  causal_lineage_refs: readonly string[];
  company_global_claim: false;
  grants_execution: false;
  grants_remediation: false;
  observational_only: true;
}>;

const consequenceCategories = new Set<string>([
  "PRODUCTION_INTERRUPTION", "CAPACITY_LOSS", "DOWNSTREAM_DISRUPTION", "SERVICE_IMPACT",
  "CORRECTION_COST_INCREASE", "CORRECTIVE_OPTION_LOSS",
]);
const temporalKinds = new Set<string>([
  "CONSEQUENCE_TIMING", "DECISION_WINDOW", "OPERATIONAL_SLACK", "ABSORBABLE_DELAY",
  "OPTION_EXPIRATION", "CORRECTION_FEASIBILITY", "PROPAGATION_TIMING",
]);
const costKinds = new Set<string>([
  "SLACK_CONSUMPTION", "CORRECTION_COST_CHANGE", "CORRECTIVE_OPTION_REDUCTION",
  "DISRUPTION_INCREASE", "CORRECTION_DIFFICULTY_INCREASE",
]);
const levels = new Set<string>(["LOW", "MEDIUM", "HIGH"]);
const reasons = new Set<string>([
  "NO_MATERIAL_CONSEQUENCE_WITHIN_SCOPE", "DECISION_WINDOW_REMAINS_OPEN", "OPERATIONAL_SLACK_REMAINS_AVAILABLE",
  "MATERIAL_CONSEQUENCE_APPROACHING", "DECISION_WINDOW_NARROWING", "OPERATIONAL_SLACK_CONSUMING",
  "CORRECTIVE_OPTIONS_SHRINKING", "CORRECTION_COST_INCREASING", "DOWNSTREAM_PROPAGATION_APPROACHING",
]);
const inputKeys = new Set([
  "version", "request_id", "company_id", "evaluation_scope", "conditions", "consequences", "materiality",
  "temporal_evidence", "cost_of_waiting_evidence", "corrective_option_refs", "evidence_qualification_refs", "provenance_refs",
]);
const resultInputKeys = new Set([
  "version", "assessment", "level", "material_consequence_refs", "decision_window_evidence_refs",
  "cost_of_waiting_evidence_refs", "reason_codes", "evidence_qualification_refs", "causal_lineage_refs",
]);
const conditionKeys = new Set(["condition_ref", "governed_evidence_refs"]);
const consequenceKeys = new Set(["consequence_ref", "category", "affected_operational_refs", "causal_lineage_refs"]);
const materialityKeys = new Set(["consequence_ref", "material_within_scope", "materiality_evidence_refs"]);
const temporalKeys = new Set(["temporal_evidence_ref", "kind", "consequence_refs"]);
const costKeys = new Set(["cost_of_waiting_evidence_ref", "kind", "consequence_refs", "corrective_option_refs"]);

function exactKeys(value: object, allowed: ReadonlySet<string>, code: string): void {
  if (Object.keys(value).some((key) => !allowed.has(key))) throw new Error(code);
}

function ref(value: string, code: string): string {
  const normalized = value.trim();
  if (!normalized || normalized.length > 256 || !/^[A-Za-z0-9][A-Za-z0-9._-]*:[^\s]+$/.test(normalized)) throw new Error(code);
  return normalized;
}

function refs(values: readonly string[], code: string, required = true): readonly string[] {
  if (!Array.isArray(values)) throw new Error(code);
  const normalized = [...new Set(values.map((value) => ref(value, code)))].sort((a, b) => a.localeCompare(b));
  if (required && normalized.length === 0) throw new Error(code);
  return normalized;
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

async function sha256(value: unknown): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonicalJson(value)));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function members(values: readonly string[], allowed: ReadonlySet<string>, code: string): void {
  if (values.some((value) => !allowed.has(value))) throw new Error(code);
}

function unique(values: readonly string[], code: string): void {
  if (new Set(values).size !== values.length) throw new Error(code);
}

export async function createCanonicalDecisionPressureAssessmentV1(
  input: CanonicalDecisionPressureAssessmentInputV1,
): Promise<CanonicalDecisionPressureAssessmentV1> {
  exactKeys(input, inputKeys, "PRESSURE_INPUT_FIELD_UNSUPPORTED");
  if (input.version !== 1) throw new Error("PRESSURE_VERSION_UNSUPPORTED");
  await verifyOperationalSignalEvaluationScopeV1(input.evaluation_scope.scope, input);
  if (input.evaluation_scope.scope.request_id !== input.request_id) throw new Error("PRESSURE_REQUEST_MISMATCH");
  if (input.evaluation_scope.scope.company_id !== input.company_id) throw new Error("PRESSURE_COMPANY_MISMATCH");
  const evidenceAsOf = Date.parse(input.evaluation_scope.evidence_as_of);
  const evaluatedAt = Date.parse(input.evaluation_scope.evaluated_at);
  if (!Number.isFinite(evidenceAsOf) || !Number.isFinite(evaluatedAt) || evidenceAsOf > evaluatedAt) {
    throw new Error("PRESSURE_TIME_INVALID");
  }
  if (!input.conditions.length || !input.consequences.length || !input.materiality.length) throw new Error("PRESSURE_SEMANTIC_EVIDENCE_REQUIRED");
  if (!input.temporal_evidence.length && !input.cost_of_waiting_evidence.length) throw new Error("PRESSURE_WAITING_EVIDENCE_REQUIRED");

  const conditions = input.conditions.map((item) => {
    exactKeys(item, conditionKeys, "PRESSURE_CONDITION_FIELD_UNSUPPORTED");
    return { condition_ref: ref(item.condition_ref, "PRESSURE_CONDITION_REF_INVALID"),
      governed_evidence_refs: refs(item.governed_evidence_refs, "PRESSURE_CONDITION_EVIDENCE_INVALID") };
  }).sort((a, b) => a.condition_ref.localeCompare(b.condition_ref));
  unique(conditions.map((item) => item.condition_ref), "PRESSURE_CONDITION_DUPLICATE");
  const consequences = input.consequences.map((item) => {
    exactKeys(item, consequenceKeys, "PRESSURE_CONSEQUENCE_FIELD_UNSUPPORTED");
    if (!consequenceCategories.has(item.category)) throw new Error("PRESSURE_CONSEQUENCE_CATEGORY_INVALID");
    return { consequence_ref: ref(item.consequence_ref, "PRESSURE_CONSEQUENCE_REF_INVALID"), category: item.category,
      affected_operational_refs: refs(item.affected_operational_refs, "PRESSURE_AFFECTED_REF_INVALID"),
      causal_lineage_refs: refs(item.causal_lineage_refs, "PRESSURE_CAUSAL_LINEAGE_INVALID") };
  }).sort((a, b) => a.consequence_ref.localeCompare(b.consequence_ref));
  unique(consequences.map((item) => item.consequence_ref), "PRESSURE_CONSEQUENCE_DUPLICATE");
  const consequenceRefs = new Set(consequences.map((item) => item.consequence_ref));
  const materiality = input.materiality.map((item) => {
    exactKeys(item, materialityKeys, "PRESSURE_MATERIALITY_FIELD_UNSUPPORTED");
    const consequenceRef = ref(item.consequence_ref, "PRESSURE_MATERIALITY_REF_INVALID");
    if (!consequenceRefs.has(consequenceRef) || typeof item.material_within_scope !== "boolean") throw new Error("PRESSURE_MATERIALITY_INVALID");
    return { consequence_ref: consequenceRef, material_within_scope: item.material_within_scope,
      materiality_evidence_refs: refs(item.materiality_evidence_refs, "PRESSURE_MATERIALITY_EVIDENCE_INVALID") };
  }).sort((a, b) => a.consequence_ref.localeCompare(b.consequence_ref));
  unique(materiality.map((item) => item.consequence_ref), "PRESSURE_MATERIALITY_DUPLICATE");
  if (materiality.length !== consequenceRefs.size) throw new Error("PRESSURE_MATERIALITY_INCOMPLETE");
  const temporal_evidence = input.temporal_evidence.map((item) => {
    exactKeys(item, temporalKeys, "PRESSURE_TEMPORAL_FIELD_UNSUPPORTED");
    if (!temporalKinds.has(item.kind)) throw new Error("PRESSURE_TEMPORAL_KIND_INVALID");
    const linked = refs(item.consequence_refs, "PRESSURE_TEMPORAL_CONSEQUENCE_INVALID");
    members(linked, consequenceRefs, "PRESSURE_TEMPORAL_CONSEQUENCE_INVALID");
    return { temporal_evidence_ref: ref(item.temporal_evidence_ref, "PRESSURE_TEMPORAL_REF_INVALID"), kind: item.kind, consequence_refs: linked };
  }).sort((a, b) => a.temporal_evidence_ref.localeCompare(b.temporal_evidence_ref));
  unique(temporal_evidence.map((item) => item.temporal_evidence_ref), "PRESSURE_TEMPORAL_DUPLICATE");
  const corrective_option_refs = refs(input.corrective_option_refs, "PRESSURE_CORRECTIVE_OPTION_INVALID", false);
  const optionSet = new Set(corrective_option_refs);
  const cost_of_waiting_evidence = input.cost_of_waiting_evidence.map((item) => {
    exactKeys(item, costKeys, "PRESSURE_COST_FIELD_UNSUPPORTED");
    if (!costKinds.has(item.kind)) throw new Error("PRESSURE_COST_KIND_INVALID");
    const linked = refs(item.consequence_refs, "PRESSURE_COST_CONSEQUENCE_INVALID");
    const options = refs(item.corrective_option_refs, "PRESSURE_COST_OPTION_INVALID", false);
    members(linked, consequenceRefs, "PRESSURE_COST_CONSEQUENCE_INVALID");
    members(options, optionSet, "PRESSURE_COST_OPTION_INVALID");
    return { cost_of_waiting_evidence_ref: ref(item.cost_of_waiting_evidence_ref, "PRESSURE_COST_REF_INVALID"),
      kind: item.kind, consequence_refs: linked, corrective_option_refs: options };
  }).sort((a, b) => a.cost_of_waiting_evidence_ref.localeCompare(b.cost_of_waiting_evidence_ref));
  unique(cost_of_waiting_evidence.map((item) => item.cost_of_waiting_evidence_ref), "PRESSURE_COST_DUPLICATE");

  const semantic = { version: 1 as const, request_id: input.request_id, company_id: input.company_id,
    scope_id: input.evaluation_scope.scope.scope_id, scope_digest: input.evaluation_scope.scope.scope_digest,
    evidence_as_of: input.evaluation_scope.evidence_as_of, conditions, consequences, materiality, temporal_evidence,
    cost_of_waiting_evidence, corrective_option_refs,
    evidence_qualification_refs: refs(input.evidence_qualification_refs, "PRESSURE_QUALIFICATION_REF_INVALID"),
    provenance_refs: refs(input.provenance_refs, "PRESSURE_PROVENANCE_REF_INVALID") };
  const assessment_digest = await sha256(semantic);
  return deepFreeze({ version: 1, request_id: input.request_id, company_id: input.company_id,
    evaluation_scope: input.evaluation_scope, conditions, consequences, materiality, temporal_evidence,
    cost_of_waiting_evidence, corrective_option_refs, evidence_qualification_refs: semantic.evidence_qualification_refs,
    provenance_refs: semantic.provenance_refs, assessment_id: `canonical-decision-pressure-assessment:sha256:${assessment_digest}`,
    assessment_digest, digest_algorithm: "SHA-256", evidence_as_of: input.evaluation_scope.evidence_as_of,
    company_global_claim: false, grants_execution: false, grants_remediation: false, observational_only: true }) as CanonicalDecisionPressureAssessmentV1;
}

export async function verifyCanonicalDecisionPressureAssessmentV1(
  assessment: CanonicalDecisionPressureAssessmentV1,
): Promise<void> {
  const rebuilt = await createCanonicalDecisionPressureAssessmentV1({
    version: assessment.version,
    request_id: assessment.request_id,
    company_id: assessment.company_id,
    evaluation_scope: assessment.evaluation_scope,
    conditions: assessment.conditions,
    consequences: assessment.consequences,
    materiality: assessment.materiality,
    temporal_evidence: assessment.temporal_evidence,
    cost_of_waiting_evidence: assessment.cost_of_waiting_evidence,
    corrective_option_refs: assessment.corrective_option_refs,
    evidence_qualification_refs: assessment.evidence_qualification_refs,
    provenance_refs: assessment.provenance_refs,
  });
  if (rebuilt.assessment_digest !== assessment.assessment_digest || rebuilt.assessment_id !== assessment.assessment_id) {
    throw new Error("PRESSURE_ASSESSMENT_DIGEST_MISMATCH");
  }
  if (assessment.company_global_claim !== false || assessment.grants_execution !== false ||
      assessment.grants_remediation !== false || assessment.observational_only !== true) throw new Error("PRESSURE_BOUNDARY_INVALID");
}

export async function createCanonicalDecisionPressureResultV1(
  input: CanonicalDecisionPressureResultInputV1,
): Promise<CanonicalDecisionPressureResultV1> {
  exactKeys(input, resultInputKeys, "PRESSURE_RESULT_FIELD_UNSUPPORTED");
  if (input.version !== 1 || !levels.has(input.level)) throw new Error("PRESSURE_RESULT_LEVEL_INVALID");
  await verifyCanonicalDecisionPressureAssessmentV1(input.assessment);
  const material = new Set(input.assessment.materiality.filter((item) => item.material_within_scope).map((item) => item.consequence_ref));
  const temporal = new Set(input.assessment.temporal_evidence.map((item) => item.temporal_evidence_ref));
  const costs = new Set(input.assessment.cost_of_waiting_evidence.map((item) => item.cost_of_waiting_evidence_ref));
  const materialRefs = refs(input.material_consequence_refs, "PRESSURE_RESULT_MATERIAL_REF_INVALID", false);
  const windowRefs = refs(input.decision_window_evidence_refs, "PRESSURE_RESULT_WINDOW_REF_INVALID", false);
  const costRefs = refs(input.cost_of_waiting_evidence_refs, "PRESSURE_RESULT_COST_REF_INVALID", false);
  members(materialRefs, material, "PRESSURE_RESULT_MATERIAL_REF_INVALID");
  members(windowRefs, temporal, "PRESSURE_RESULT_WINDOW_REF_INVALID");
  members(costRefs, costs, "PRESSURE_RESULT_COST_REF_INVALID");
  const reason_codes = [...new Set(input.reason_codes)].sort();
  if (!reason_codes.length) throw new Error("PRESSURE_RESULT_REASON_REQUIRED");
  members(reason_codes, reasons, "PRESSURE_RESULT_REASON_INVALID");
  const semantic = { version: 1 as const, assessment_id: input.assessment.assessment_id,
    assessment_digest: input.assessment.assessment_digest, level: input.level, request_id: input.assessment.request_id,
    company_id: input.assessment.company_id, scope_id: input.assessment.evaluation_scope.scope.scope_id,
    scope_digest: input.assessment.evaluation_scope.scope.scope_digest, evidence_as_of: input.assessment.evidence_as_of,
    material_consequence_refs: materialRefs, decision_window_evidence_refs: windowRefs,
    cost_of_waiting_evidence_refs: costRefs, reason_codes,
    evidence_qualification_refs: refs(input.evidence_qualification_refs, "PRESSURE_RESULT_QUALIFICATION_REF_INVALID"),
    causal_lineage_refs: refs(input.causal_lineage_refs, "PRESSURE_RESULT_LINEAGE_INVALID") };
  const result_digest = await sha256(semantic);
  return deepFreeze({ ...semantic, result_id: `canonical-decision-pressure-result:sha256:${result_digest}`,
    result_digest, digest_algorithm: "SHA-256", company_global_claim: false, grants_execution: false,
    grants_remediation: false, observational_only: true }) as CanonicalDecisionPressureResultV1;
}
