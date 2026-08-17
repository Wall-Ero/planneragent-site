import type {
  DataAwarenessState,
  PublicPlanSignalV1,
  RealityStabilityState,
} from "../sandbox/contracts.v2";
import type { OperationalSignalScopeBindingV1 } from "./operational.signal.evaluation.scope.v1";
import { verifyOperationalSignalEvaluationScopeV1 } from "./operational.signal.evaluation.scope.v1";
import { verifyOperationalAvailabilityReadModelV1, type OperationalAvailabilityReadModelV1 } from "./operational.availability.read-model.v1";

export type PublicDecisionPressureV2 = Readonly<{
  level: "LOW" | "MEDIUM" | "HIGH";
  pressure_type: "DATA_QUALITY" | "PLAN" | "EXECUTION" | "NONE";
  blocked_reason?: "UNRELIABLE_REALITY";
}>;

export type OperationalCockpitSnapshotV1 = Readonly<{
  version: 1;
  snapshot_id: string;
  snapshot_digest: string;
  digest_algorithm: "SHA-256";
  request_id: string;
  company_id: string;
  domain: string;
  evaluation_scope: OperationalSignalScopeBindingV1;
  source_evidence: Readonly<{
    evidence_selection_ref: string;
    source_snapshot_ref: string;
  }>;
  evidence_as_of: string;
  evaluated_at: string;
  question_ref?: string;
  signals: Readonly<{
    data_awareness: DataAwarenessState;
    plan: Readonly<PublicPlanSignalV1>;
    reality: Readonly<{
      state: RealityStabilityState;
      confidence: number;
      reasons: readonly string[];
    }>;
    decision_pressure: PublicDecisionPressureV2;
    operational_availability?: OperationalAvailabilityReadModelV1;
  }>;
  lineage_refs: readonly string[];
  company_global_claim: false;
  grants_execution: false;
  observational_only: true;
}>;

export type BuildOperationalCockpitSnapshotV1Input = Readonly<{
  request_id: string;
  company_id: string;
  domain: string;
  evaluation_scope: OperationalSignalScopeBindingV1;
  data_awareness: DataAwarenessState;
  plan: PublicPlanSignalV1;
  reality: Readonly<{
    state: RealityStabilityState;
    confidence: number;
    reasons: readonly string[];
  }>;
  decision_pressure: PublicDecisionPressureV2;
  operational_availability?: OperationalAvailabilityReadModelV1;
}>;

const awarenessStates = new Set(["SNAPSHOT", "BEHAVIORAL", "STRUCTURAL"]);
const planLevels = new Set(["COHERENT", "SOME_GAPS", "INCOHERENT"]);
const planSources = new Set(["MASTER", "ORDERS_INFERRED", "REALITY_INFERRED", "ASSUMED"]);
const planQualities = new Set(["HIGH", "MEDIUM", "LOW", "UNUSABLE"]);
const realityStates = new Set(["STABLE", "SHIFTING", "UNSTABLE", "ASSUMED"]);
const pressureLevels = new Set(["LOW", "MEDIUM", "HIGH"]);
const pressureTypes = new Set(["DATA_QUALITY", "PLAN", "EXECUTION", "NONE"]);

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function unit(value: number, code: string): number {
  if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error(code);
  return value;
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

export async function buildOperationalCockpitSnapshotV1(
  input: BuildOperationalCockpitSnapshotV1Input,
): Promise<OperationalCockpitSnapshotV1> {
  const binding = input.evaluation_scope;
  await verifyOperationalSignalEvaluationScopeV1(binding.scope, input);
  if (binding.scope.domain !== input.domain) throw new Error("COCKPIT_SNAPSHOT_DOMAIN_MISMATCH");
  if (binding.scope.request_id !== input.request_id) throw new Error("COCKPIT_SNAPSHOT_REQUEST_MISMATCH");
  if (binding.scope.company_id !== input.company_id) throw new Error("COCKPIT_SNAPSHOT_COMPANY_MISMATCH");
  const evidenceTime = Date.parse(binding.evidence_as_of);
  const evaluationTime = Date.parse(binding.evaluated_at);
  if (!Number.isFinite(evidenceTime) || !Number.isFinite(evaluationTime) || evidenceTime > evaluationTime) {
    throw new Error("COCKPIT_SNAPSHOT_TIME_INVALID");
  }
  if (!awarenessStates.has(input.data_awareness)) throw new Error("COCKPIT_SNAPSHOT_AWARENESS_INVALID");
  if (!planLevels.has(input.plan.level) || !planSources.has(input.plan.source) || !planQualities.has(input.plan.quality)) {
    throw new Error("COCKPIT_SNAPSHOT_PLAN_INVALID");
  }
  unit(input.plan.confidence, "COCKPIT_SNAPSHOT_PLAN_CONFIDENCE_INVALID");
  unit(input.plan.score, "COCKPIT_SNAPSHOT_PLAN_SCORE_INVALID");
  unit(input.plan.quality_score, "COCKPIT_SNAPSHOT_PLAN_QUALITY_SCORE_INVALID");
  if (!realityStates.has(input.reality.state)) throw new Error("COCKPIT_SNAPSHOT_REALITY_INVALID");
  unit(input.reality.confidence, "COCKPIT_SNAPSHOT_REALITY_CONFIDENCE_INVALID");
  if (!Array.isArray(input.reality.reasons) || input.reality.reasons.some((reason) => !reason.trim())) {
    throw new Error("COCKPIT_SNAPSHOT_REALITY_REASONS_INVALID");
  }
  if (!pressureLevels.has(input.decision_pressure.level) || !pressureTypes.has(input.decision_pressure.pressure_type)) {
    throw new Error("COCKPIT_SNAPSHOT_PRESSURE_INVALID");
  }
  if (input.decision_pressure.blocked_reason && input.decision_pressure.blocked_reason !== "UNRELIABLE_REALITY") {
    throw new Error("COCKPIT_SNAPSHOT_PRESSURE_REASON_INVALID");
  }
  if(input.operational_availability){await verifyOperationalAvailabilityReadModelV1(input.operational_availability);if(input.operational_availability.request_id!==input.request_id||input.operational_availability.company_id!==input.company_id||input.operational_availability.scope_id!==binding.scope.scope_id||input.operational_availability.scope_digest!==binding.scope.scope_digest||input.operational_availability.evidence_selection_ref!==binding.scope.evidence_selection_ref||input.operational_availability.source_snapshot_ref!==binding.scope.source_snapshot_ref||input.operational_availability.evidence_as_of!==binding.evidence_as_of)throw new Error("COCKPIT_SNAPSHOT_AVAILABILITY_MISMATCH");}

  const semantic = {
    version: 1 as const,
    request_id: input.request_id,
    company_id: input.company_id,
    domain: input.domain,
    scope_digest: binding.scope.scope_digest,
    evidence_selection_ref: binding.scope.evidence_selection_ref,
    source_snapshot_ref: binding.scope.source_snapshot_ref,
    evidence_as_of: binding.evidence_as_of,
    data_awareness: input.data_awareness,
    plan: input.plan,
    reality: input.reality,
    decision_pressure: input.decision_pressure,
    ...(input.operational_availability?{operational_availability:input.operational_availability}:{}),
  };
  const snapshot_digest = await sha256(canonicalJson(semantic));
  const snapshot: OperationalCockpitSnapshotV1 = {
    version: 1,
    snapshot_id: `operational-cockpit-snapshot:sha256:${snapshot_digest}`,
    snapshot_digest,
    digest_algorithm: "SHA-256",
    request_id: input.request_id,
    company_id: input.company_id,
    domain: input.domain,
    evaluation_scope: binding,
    source_evidence: {
      evidence_selection_ref: binding.scope.evidence_selection_ref,
      source_snapshot_ref: binding.scope.source_snapshot_ref,
    },
    evidence_as_of: binding.evidence_as_of,
    evaluated_at: binding.evaluated_at,
    ...(binding.scope.question_ref ? { question_ref: binding.scope.question_ref } : {}),
    signals: {
      data_awareness: input.data_awareness,
      plan: { ...input.plan },
      reality: { ...input.reality, reasons: [...input.reality.reasons] },
      decision_pressure: { ...input.decision_pressure },
      ...(input.operational_availability?{operational_availability:input.operational_availability}:{}),
    },
    lineage_refs: [binding.scope.scope_id, binding.scope.evidence_selection_ref, binding.scope.source_snapshot_ref, ...(input.operational_availability?[input.operational_availability.read_model_id]:[])],
    company_global_claim: false,
    grants_execution: false,
    observational_only: true,
  };
  return deepFreeze(snapshot) as OperationalCockpitSnapshotV1;
}
