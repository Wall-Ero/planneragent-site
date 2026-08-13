import type { OperationalSignalScopeBindingV1 } from "../cockpit/operational.signal.evaluation.scope.v1";
import { verifyOperationalSignalEvaluationScopeV1 } from "../cockpit/operational.signal.evaluation.scope.v1";
import type { CanonicalDurationV1 } from "./canonical.decision.window.contract.v1";

export type OperationalResponseFeasibilityV1 = "AVAILABLE" | "UNAVAILABLE" | "UNRESOLVED" | "INSUFFICIENT_EVIDENCE";
export type OperationalResponseUsefulnessV1 = "USEFUL" | "NOT_USEFUL" | "UNRESOLVED" | "INSUFFICIENT_EVIDENCE";
export type SafetyMarginApplicabilityV1 = "APPLIES" | "NO_SEPARATE_MARGIN_APPLICABLE" | "UNRESOLVED" | "INSUFFICIENT_EVIDENCE";

type BoundInput = Readonly<{
  version: 1;
  request_id: string;
  company_id: string;
  evaluation_scope: OperationalSignalScopeBindingV1;
  evidence_selection_ref: string;
  evidence_refs: readonly string[];
  qualification_refs: readonly string[];
  provenance_refs: readonly string[];
  causal_lineage_refs: readonly string[];
  producer_ref: string;
  policy_ref: string;
}>;

type ObservationalBoundary = Readonly<{
  scope_id: string;
  scope_digest: string;
  evidence_as_of: string;
  evaluated_at: string;
  digest_algorithm: "SHA-256";
  company_global_claim: false;
  observational_only: true;
  grants_authority: false;
  grants_execution: false;
  grants_remediation: false;
  executable: false;
  recommended: false;
}>;

export type EffectiveOperationalResponseTimingInputV1 = BoundInput & Readonly<{
  response_class_ref: string;
  protected_objective_ref?: string;
  governing_condition_ref: string;
  feasibility: OperationalResponseFeasibilityV1;
  usefulness: OperationalResponseUsefulnessV1;
  usefulness_evidence_refs: readonly string[];
  effective_duration?: CanonicalDurationV1;
  effective_at?: string;
}>;

export type EffectiveOperationalResponseTimingV1 = EffectiveOperationalResponseTimingInputV1 & ObservationalBoundary & Readonly<{
  response_timing_id: string;
  response_timing_digest: string;
}>;

export type GovernedOperationalSafetyMarginInputV1 = BoundInput & Readonly<{
  response_timing_ref: string;
  governing_condition_ref: string;
  applicability: SafetyMarginApplicabilityV1;
  margin_duration?: CanonicalDurationV1;
  determination_evidence_refs: readonly string[];
}>;

export type GovernedOperationalSafetyMarginV1 = GovernedOperationalSafetyMarginInputV1 & ObservationalBoundary & Readonly<{
  safety_margin_id: string;
  safety_margin_digest: string;
}>;

const feasibilityStates = new Set(["AVAILABLE", "UNAVAILABLE", "UNRESOLVED", "INSUFFICIENT_EVIDENCE"]);
const usefulnessStates = new Set(["USEFUL", "NOT_USEFUL", "UNRESOLVED", "INSUFFICIENT_EVIDENCE"]);
const marginStates = new Set(["APPLIES", "NO_SEPARATE_MARGIN_APPLICABLE", "UNRESOLVED", "INSUFFICIENT_EVIDENCE"]);
function ref(value:string|undefined,code:string):string{const v=value?.trim();if(!v||!/^[A-Za-z0-9][A-Za-z0-9._-]*:[^\s]+$/.test(v))throw new Error(code);return v;}
function refs(values:readonly string[],code:string):readonly string[]{const v=[...new Set(values.map(x=>ref(x,code)))].sort();if(!v.length)throw new Error(code);return v;}
function time(value:string|undefined,code:string):string{if(!value||!Number.isFinite(Date.parse(value)))throw new Error(code);return value;}
function duration(value:CanonicalDurationV1|undefined,code:string):CanonicalDurationV1{if(!value||!Number.isFinite(value.value)||value.value<0)throw new Error(code);return Object.freeze({value:value.value,unit_ref:ref(value.unit_ref,code)});}
function canonical(value:unknown):string{if(Array.isArray(value))return`[${value.map(canonical).join(",")}]`;if(value&&typeof value==="object")return`{${Object.entries(value as Record<string,unknown>).filter(([,v])=>v!==undefined).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;return JSON.stringify(value);}
async function sha(value:unknown):Promise<string>{const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(canonical(value)));return Array.from(new Uint8Array(d),b=>b.toString(16).padStart(2,"0")).join("");}
function freeze<T>(value:T):Readonly<T>{if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value as Record<string,unknown>).forEach(freeze);Object.freeze(value);}return value;}

async function boundary(input:BoundInput):Promise<ObservationalBoundary>{
  if(input.version!==1)throw new Error("RESPONSE_TIMING_VERSION_UNSUPPORTED");
  await verifyOperationalSignalEvaluationScopeV1(input.evaluation_scope.scope,input);
  if(input.evaluation_scope.scope.request_id!==input.request_id||input.evaluation_scope.scope.company_id!==input.company_id)throw new Error("RESPONSE_TIMING_SCOPE_BINDING_MISMATCH");
  if(input.evidence_selection_ref!==input.evaluation_scope.scope.evidence_selection_ref)throw new Error("RESPONSE_TIMING_EVIDENCE_SELECTION_MISMATCH");
  const evidence_as_of=time(input.evaluation_scope.evidence_as_of,"RESPONSE_TIMING_AS_OF_INVALID");
  const evaluated_at=time(input.evaluation_scope.evaluated_at,"RESPONSE_TIMING_EVALUATED_AT_INVALID");
  if(Date.parse(evidence_as_of)>Date.parse(evaluated_at))throw new Error("RESPONSE_TIMING_TIME_ORDER_INVALID");
  refs(input.evidence_refs,"RESPONSE_TIMING_EVIDENCE_REQUIRED");refs(input.qualification_refs,"RESPONSE_TIMING_QUALIFICATION_REQUIRED");refs(input.provenance_refs,"RESPONSE_TIMING_PROVENANCE_REQUIRED");refs(input.causal_lineage_refs,"RESPONSE_TIMING_LINEAGE_REQUIRED");ref(input.producer_ref,"RESPONSE_TIMING_PRODUCER_REQUIRED");ref(input.policy_ref,"RESPONSE_TIMING_POLICY_REQUIRED");
  return{scope_id:input.evaluation_scope.scope.scope_id,scope_digest:input.evaluation_scope.scope.scope_digest,evidence_as_of,evaluated_at,digest_algorithm:"SHA-256",company_global_claim:false,observational_only:true,grants_authority:false,grants_execution:false,grants_remediation:false,executable:false,recommended:false};
}

export async function createEffectiveOperationalResponseTimingV1(input:EffectiveOperationalResponseTimingInputV1):Promise<EffectiveOperationalResponseTimingV1>{
  const envelope=await boundary(input);
  if(!feasibilityStates.has(input.feasibility)||!usefulnessStates.has(input.usefulness))throw new Error("RESPONSE_TIMING_STATUS_INVALID");
  const resolved=input.feasibility==="AVAILABLE"&&input.usefulness==="USEFUL";
  if(resolved===(!input.effective_duration&&!input.effective_at))throw new Error(resolved?"RESPONSE_TIMING_VALUE_REQUIRED":"RESPONSE_TIMING_VALUE_NOT_RESOLVED");
  if(input.effective_duration&&input.effective_at)throw new Error("RESPONSE_TIMING_VALUE_AMBIGUOUS");
  const effective_at=input.effective_at?time(input.effective_at,"RESPONSE_EFFECTIVE_AT_INVALID"):undefined;
  if(effective_at&&Date.parse(effective_at)<Date.parse(envelope.evaluated_at))throw new Error("RESPONSE_EFFECTIVE_AT_PAST");
  const semantic={version:1 as const,response_class_ref:ref(input.response_class_ref,"RESPONSE_CLASS_REQUIRED"),...(input.protected_objective_ref?{protected_objective_ref:ref(input.protected_objective_ref,"RESPONSE_OBJECTIVE_INVALID")}:{ }),governing_condition_ref:ref(input.governing_condition_ref,"RESPONSE_CONDITION_REQUIRED"),feasibility:input.feasibility,usefulness:input.usefulness,usefulness_evidence_refs:refs(input.usefulness_evidence_refs,"RESPONSE_USEFULNESS_EVIDENCE_REQUIRED"),...(input.effective_duration?{effective_duration:duration(input.effective_duration,"RESPONSE_DURATION_INVALID")}:{ }),...(effective_at?{effective_at}:{ }),request_id:input.request_id,company_id:input.company_id,scope_digest:envelope.scope_digest,evidence_selection_ref:input.evidence_selection_ref,evidence_refs:refs(input.evidence_refs,"RESPONSE_TIMING_EVIDENCE_REQUIRED"),qualification_refs:refs(input.qualification_refs,"RESPONSE_TIMING_QUALIFICATION_REQUIRED"),provenance_refs:refs(input.provenance_refs,"RESPONSE_TIMING_PROVENANCE_REQUIRED"),causal_lineage_refs:refs(input.causal_lineage_refs,"RESPONSE_TIMING_LINEAGE_REQUIRED"),producer_ref:ref(input.producer_ref,"RESPONSE_TIMING_PRODUCER_REQUIRED"),policy_ref:ref(input.policy_ref,"RESPONSE_TIMING_POLICY_REQUIRED")};
  const response_timing_digest=await sha(semantic);return freeze({...input,...semantic,...envelope,response_timing_id:`effective-operational-response-timing:sha256:${response_timing_digest}`,response_timing_digest}) as EffectiveOperationalResponseTimingV1;
}

export async function createGovernedOperationalSafetyMarginV1(input:GovernedOperationalSafetyMarginInputV1):Promise<GovernedOperationalSafetyMarginV1>{
  const envelope=await boundary(input);if(!marginStates.has(input.applicability))throw new Error("SAFETY_MARGIN_STATUS_INVALID");
  if(input.applicability==="APPLIES"&&!input.margin_duration)throw new Error("SAFETY_MARGIN_DURATION_REQUIRED");
  if(input.applicability!=="APPLIES"&&input.margin_duration)throw new Error("SAFETY_MARGIN_DURATION_NOT_APPLICABLE");
  const semantic={version:1 as const,response_timing_ref:ref(input.response_timing_ref,"SAFETY_MARGIN_RESPONSE_REQUIRED"),governing_condition_ref:ref(input.governing_condition_ref,"SAFETY_MARGIN_CONDITION_REQUIRED"),applicability:input.applicability,...(input.margin_duration?{margin_duration:duration(input.margin_duration,"SAFETY_MARGIN_DURATION_INVALID")}:{ }),determination_evidence_refs:refs(input.determination_evidence_refs,"SAFETY_MARGIN_DETERMINATION_EVIDENCE_REQUIRED"),request_id:input.request_id,company_id:input.company_id,scope_digest:envelope.scope_digest,evidence_selection_ref:input.evidence_selection_ref,evidence_refs:refs(input.evidence_refs,"RESPONSE_TIMING_EVIDENCE_REQUIRED"),qualification_refs:refs(input.qualification_refs,"RESPONSE_TIMING_QUALIFICATION_REQUIRED"),provenance_refs:refs(input.provenance_refs,"RESPONSE_TIMING_PROVENANCE_REQUIRED"),causal_lineage_refs:refs(input.causal_lineage_refs,"RESPONSE_TIMING_LINEAGE_REQUIRED"),producer_ref:ref(input.producer_ref,"RESPONSE_TIMING_PRODUCER_REQUIRED"),policy_ref:ref(input.policy_ref,"RESPONSE_TIMING_POLICY_REQUIRED")};
  const safety_margin_digest=await sha(semantic);return freeze({...input,...semantic,...envelope,safety_margin_id:`governed-operational-safety-margin:sha256:${safety_margin_digest}`,safety_margin_digest}) as GovernedOperationalSafetyMarginV1;
}
