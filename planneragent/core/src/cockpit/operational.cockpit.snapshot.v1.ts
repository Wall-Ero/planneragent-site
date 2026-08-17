import type {
  DataAwarenessState,
  PublicPlanSignalV1,
  RealityStabilityState,
} from "../sandbox/contracts.v2";
import type { OperationalSignalScopeBindingV1 } from "./operational.signal.evaluation.scope.v1";
import { verifyOperationalSignalEvaluationScopeV1 } from "./operational.signal.evaluation.scope.v1";
import { verifyOperationalAvailabilityReadModelV1, type OperationalAvailabilityReadModelV1 } from "./operational.availability.read-model.v1";
import type { CanonicalOperationalRealityCompositionV1 } from "../reality/canonical.operational.reality.composition.v1";
import { verifyCanonicalOperationalRealityCompositionV1 } from "../reality/canonical.operational.reality.composition.v1";
import type { CanonicalDecisionPressureCompositionV1 } from "../decision/canonical.decision.pressure.composition.v1";
import { verifyCanonicalDecisionPressureCompositionV1 } from "../decision/canonical.decision.pressure.composition.v1";
import { verifyAttentionBindingV1, type CanonicalPressureAttentionBindingV1 } from "../attention/canonicalAttention";
import type { CanonicalExplanationBasisV1 } from "../explainability/canonicalExplanation";
import { verifyCanonicalExplanationBasisV1 } from "../explainability/canonicalExplanation";

export type CanonicalCockpitSignalBindingV1=Readonly<{tenant_id:string;company_id:string;request_id:string;scope_id:string;scope_digest:string;artifact_ref:string;artifact_digest:string;evidence_refs:readonly string[];qualification_refs:readonly string[];provenance_refs:readonly string[];causal_lineage_refs:readonly string[]}>;
export type CanonicalCockpitCognitionV1=Readonly<{tenant_id:string;data_awareness:CanonicalCockpitSignalBindingV1;plan_coherence:CanonicalCockpitSignalBindingV1;reality:CanonicalOperationalRealityCompositionV1;decision_pressure:CanonicalDecisionPressureCompositionV1;explanation:CanonicalExplanationBasisV1;working_attention?:CanonicalPressureAttentionBindingV1;pressure_compatibility_projection:"LEGACY_PUBLIC_V2_PRESENTATION_ONLY";current_reality:true;counterfactual:false;tier_independent:true}>;

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
  canonical_cognition?: CanonicalCockpitCognitionV1;
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
  canonical_cognition?: CanonicalCockpitCognitionV1;
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
function nonempty(v:readonly string[],code:string){if(!Array.isArray(v)||!v.length||v.some(x=>!x.trim()))throw new Error(code)}
function rejectUnsafeCanonicalCognition(c:CanonicalCockpitCognitionV1){for(const k of ["commercial_plan","subscription","credit_balance","economic_capacity","provider","model","simulation","optimizer_candidate","raw_source_rows","recommendation","approval","delegation","execution_payload"])if(k in(c as object))throw new Error("COCKPIT_CANONICAL_UNSAFE_INPUT")}
async function verifyCanonicalCognition(c:CanonicalCockpitCognitionV1,input:BuildOperationalCockpitSnapshotV1Input){const b=input.evaluation_scope,r=c.reality,p=c.decision_pressure,e=c.explanation;if(c.current_reality!==true||c.counterfactual!==false||c.tier_independent!==true||c.pressure_compatibility_projection!=="LEGACY_PUBLIC_V2_PRESENTATION_ONLY")throw new Error("COCKPIT_CANONICAL_SEMANTICS_INVALID");await Promise.all([verifyCanonicalOperationalRealityCompositionV1(r),verifyCanonicalDecisionPressureCompositionV1(p),verifyCanonicalExplanationBasisV1(e)]);if(c.tenant_id!==r.tenant_id||r.company_id!==input.company_id||r.request_id!==input.request_id||r.scope_id!==b.scope.scope_id||r.scope_digest!==b.scope.scope_digest||r.evidence_as_of!==b.evidence_as_of)throw new Error("COCKPIT_CANONICAL_REALITY_MISMATCH");if(p.company_id!==input.company_id||p.request_id!==input.request_id||p.scope_id!==r.scope_id||p.scope_digest!==r.scope_digest||p.evidence_as_of!==r.evidence_as_of)throw new Error("COCKPIT_CANONICAL_PRESSURE_MISMATCH");if(e.tenant_id!==c.tenant_id||e.company_id!==input.company_id||e.request_id!==input.request_id||e.scope_id!==r.scope_id||e.scope_digest!==r.scope_digest||e.context.mode!=="CURRENT"||e.reality.ref!==r.composition_id||e.reality.digest!==r.composition_digest||e.pressure?.ref!==p.pressure_id||e.pressure.digest!==p.pressure_digest)throw new Error("COCKPIT_CANONICAL_EXPLANATION_MISMATCH");for(const x of [c.data_awareness,c.plan_coherence]){if(x.tenant_id!==c.tenant_id||x.company_id!==input.company_id||x.request_id!==input.request_id||x.scope_id!==r.scope_id||x.scope_digest!==r.scope_digest||!x.artifact_ref.trim()||!/^[a-f0-9]{64}$/.test(x.artifact_digest))throw new Error("COCKPIT_CANONICAL_SIGNAL_MISMATCH");nonempty(x.evidence_refs,"COCKPIT_CANONICAL_EVIDENCE_REQUIRED");nonempty(x.qualification_refs,"COCKPIT_CANONICAL_QUALIFICATION_REQUIRED");nonempty(x.provenance_refs,"COCKPIT_CANONICAL_PROVENANCE_REQUIRED");nonempty(x.causal_lineage_refs,"COCKPIT_CANONICAL_LINEAGE_REQUIRED")};const a=c.working_attention;if(a&&(a.tenant_id!==c.tenant_id||a.company_id!==input.company_id||a.context_id!==input.request_id||a.scope_id!==r.scope_id||a.scope_digest!==r.scope_digest||a.pressure_ref!==p.pressure_id||a.pressure_digest!==p.pressure_digest||a.notification_requested!==false))throw new Error("COCKPIT_CANONICAL_ATTENTION_MISMATCH")}

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
  if(input.canonical_cognition){rejectUnsafeCanonicalCognition(input.canonical_cognition);if(input.canonical_cognition.working_attention)await verifyAttentionBindingV1(input.canonical_cognition.working_attention);await verifyCanonicalCognition(input.canonical_cognition,input);}

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
    ...(input.canonical_cognition?{canonical_cognition:input.canonical_cognition}:{}),
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
    ...(input.canonical_cognition?{canonical_cognition:input.canonical_cognition}:{}),
    lineage_refs: [binding.scope.scope_id, binding.scope.evidence_selection_ref, binding.scope.source_snapshot_ref, ...(input.operational_availability?[input.operational_availability.read_model_id]:[]),...(input.canonical_cognition?[input.canonical_cognition.data_awareness.artifact_ref,input.canonical_cognition.plan_coherence.artifact_ref,input.canonical_cognition.reality.composition_id,input.canonical_cognition.decision_pressure.pressure_id,input.canonical_cognition.explanation.basis_id,...(input.canonical_cognition.working_attention?[input.canonical_cognition.working_attention.binding_id]:[])]:[])],
    company_global_claim: false,
    grants_execution: false,
    observational_only: true,
  };
  return deepFreeze(snapshot) as OperationalCockpitSnapshotV1;
}
