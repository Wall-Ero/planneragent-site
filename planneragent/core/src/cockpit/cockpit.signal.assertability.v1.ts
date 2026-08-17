import type { OperationalCockpitSnapshotV1 } from "./operational.cockpit.snapshot.v1";
import type { CockpitSignalEvidenceQualificationV1, CockpitSignalFamilyV1 } from "../minimum-operational-evidence";

export type CockpitManifestedStateV1 = "SNAPSHOT" | "BEHAVIORAL" | "STRUCTURAL" | "COHERENT" | "SOME_GAPS" | "INCOHERENT" | "STABLE" | "SHIFTING" | "UNSTABLE" | "UNRESOLVED_CONFLICT" | "COMPLETE" | "QUALIFIED_PARTIAL_UNRESOLVED" | "QUALIFIED_PARTIAL_INSUFFICIENT_EVIDENCE" | "LOW" | "MEDIUM" | "HIGH";
export type CockpitNonManifestationReasonV1 = "MOE_INSUFFICIENT" | "MOE_UNSUPPORTED_EVIDENCE" | "MOE_UNNECESSARY_EVIDENCE" | "MOE_CAPABILITY_UNDECLARED" | "MOE_INPUT_INVALID" | "INSUFFICIENT_GROUNDING";
export type CockpitSignalAssertabilityV1 = Readonly<{
  version: 1; assertability_id: string; assertability_digest: string; digest_algorithm: "SHA-256";
  signal_family: CockpitSignalFamilyV1; status: "ASSERTABLE" | "NOT_ASSERTABLE";
  manifested_state?: CockpitManifestedStateV1; reason_codes: readonly CockpitNonManifestationReasonV1[];
  snapshot_id: string; snapshot_digest: string; qualification_id: string; qualification_digest: string;
  request_id: string; company_id: string; scope_id: string; scope_digest: string;
  pressure_type?: "DATA_QUALITY" | "PLAN" | "EXECUTION" | "NONE"; blocked_reason?: "UNRELIABLE_REALITY";
  reality_reason_codes?: readonly string[]; grants_execution: false;
}>;
export const COCKPIT_SIGNAL_CAPABILITIES_V1 = { DATA_AWARENESS: "SCOPED_OPERATIONAL_DATA_AWARENESS", PLAN_COHERENCE: "CANONICAL_COCKPIT_PLAN_COHERENCE", REALITY_STABILITY: "CANONICAL_REALITY_STABILITY", DECISION_PRESSURE: "FULL_REALITY_AWARE_DECISION_PRESSURE" } as const;
export function canonicalCockpitJsonV1(value: unknown): string { if (Array.isArray(value)) return `[${value.map(canonicalCockpitJsonV1).join(",")}]`; if (value && typeof value === "object") { const e=Object.entries(value as Record<string,unknown>).filter(([,v])=>v!==undefined).sort(([a],[b])=>a.localeCompare(b)); return `{${e.map(([k,v])=>`${JSON.stringify(k)}:${canonicalCockpitJsonV1(v)}`).join(",")}}`; } return JSON.stringify(value); }
export async function cockpitDigestV1(value: unknown): Promise<string> { const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(canonicalCockpitJsonV1(value))); return Array.from(new Uint8Array(d),b=>b.toString(16).padStart(2,"0")).join(""); }
function moeReason(status: string): CockpitNonManifestationReasonV1 { return ({ INSUFFICIENT:"MOE_INSUFFICIENT", UNSUPPORTED_EVIDENCE_PRESENT:"MOE_UNSUPPORTED_EVIDENCE", UNNECESSARY_EVIDENCE_PRESENT:"MOE_UNNECESSARY_EVIDENCE", CAPABILITY_UNDECLARED:"MOE_CAPABILITY_UNDECLARED", INPUT_INVALID:"MOE_INPUT_INVALID" } as Record<string,CockpitNonManifestationReasonV1>)[status] ?? "MOE_INPUT_INVALID"; }
function state(snapshot: OperationalCockpitSnapshotV1, family: CockpitSignalFamilyV1): string { if(family==="DATA_AWARENESS") return snapshot.signals.data_awareness; if(family==="PLAN_COHERENCE") return snapshot.signals.plan.level; if(family==="REALITY_STABILITY") return snapshot.canonical_cognition?.reality.composition_status??snapshot.signals.reality.state; return snapshot.canonical_cognition?.decision_pressure.completeness_status??snapshot.signals.decision_pressure.level; }
export async function evaluateCockpitSignalAssertabilityV1(snapshot: OperationalCockpitSnapshotV1, q: CockpitSignalEvidenceQualificationV1): Promise<CockpitSignalAssertabilityV1> {
  if(q.capability_id!==COCKPIT_SIGNAL_CAPABILITIES_V1[q.signal_family]) throw new Error("COCKPIT_ASSERTABILITY_CAPABILITY_MISMATCH");
  if(q.request_id!==snapshot.request_id||q.company_id!==snapshot.company_id) throw new Error("COCKPIT_ASSERTABILITY_PARTY_MISMATCH");
  if(q.scope_id!==snapshot.evaluation_scope.scope.scope_id||q.scope_digest!==snapshot.evaluation_scope.scope.scope_digest||q.evidence_selection_ref!==snapshot.source_evidence.evidence_selection_ref||q.evidence_as_of!==snapshot.evidence_as_of) throw new Error("COCKPIT_ASSERTABILITY_SCOPE_MISMATCH");
  const evaluated=state(snapshot,q.signal_family), sufficient=q.moe_result.status==="SUFFICIENT"&&q.moe_result.sufficient;
  const grounded=!(q.signal_family==="REALITY_STABILITY"&&evaluated==="ASSUMED"), assertable=sufficient&&grounded;
  const semantic={version:1 as const,signal_family:q.signal_family,status:assertable?"ASSERTABLE" as const:"NOT_ASSERTABLE" as const,...(assertable?{manifested_state:evaluated as CockpitManifestedStateV1}:{}),reason_codes:Object.freeze(assertable?[]:[grounded?moeReason(q.moe_result.status):"INSUFFICIENT_GROUNDING"]),snapshot_id:snapshot.snapshot_id,snapshot_digest:snapshot.snapshot_digest,qualification_id:q.qualification_id,qualification_digest:q.qualification_digest,request_id:snapshot.request_id,company_id:snapshot.company_id,scope_id:q.scope_id,scope_digest:q.scope_digest,...(q.signal_family==="DECISION_PRESSURE"?{pressure_type:snapshot.signals.decision_pressure.pressure_type,...(snapshot.signals.decision_pressure.blocked_reason?{blocked_reason:snapshot.signals.decision_pressure.blocked_reason}:{})}:{}),...(q.signal_family==="REALITY_STABILITY"?{reality_reason_codes:Object.freeze([...snapshot.signals.reality.reasons])}:{}),grants_execution:false as const};
  const assertability_digest=await cockpitDigestV1(semantic); return Object.freeze({...semantic,assertability_id:`cockpit-signal-assertability:sha256:${assertability_digest}`,assertability_digest,digest_algorithm:"SHA-256"});
}
