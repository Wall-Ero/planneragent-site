import type { OperationalSignalScopeBindingV1 } from "../cockpit/operational.signal.evaluation.scope.v1";
import { verifyOperationalSignalEvaluationScopeV1 } from "../cockpit/operational.signal.evaluation.scope.v1";
import { createProtectedOperationalObjectiveBindingV1, type ProtectedOperationalObjectiveBindingV1 } from "../cognition/protected.operational.objective.v1";

export type CanonicalDecisionMarginStatusV1 =
  | "AVAILABLE"
  | "BOUNDARY_REACHED"
  | "BOUNDARY_EXCEEDED"
  | "UNRESOLVED"
  | "INSUFFICIENT_EVIDENCE";

export type CanonicalDecisionMarginMeasureV1 = Readonly<{
  value: number;
  unit_ref: string;
  measurement_ref: string;
}>;

export type CanonicalDecisionMarginInputV1 = Readonly<{
  version: 1;
  request_id: string;
  company_id: string;
  evaluation_scope: OperationalSignalScopeBindingV1;
  protected_objective: ProtectedOperationalObjectiveBindingV1;
  governing_condition_ref: string;
  governing_dimension_ref: string;
  current_position_ref: string;
  compromise_boundary_ref: string;
  material_compromise_refs: readonly string[];
  status: CanonicalDecisionMarginStatusV1;
  remaining_margin?: CanonicalDecisionMarginMeasureV1;
  epistemic_basis: "DETERMINISTIC";
  producer_ref: string;
  policy_ref: string;
  evidence_refs: readonly string[];
  qualification_refs: readonly string[];
  provenance_refs: readonly string[];
  causal_lineage_refs: readonly string[];
  evidence_as_of: string;
  evaluated_at: string;
}>;

export type CanonicalDecisionMarginV1 = CanonicalDecisionMarginInputV1 & Readonly<{
  objective_binding_ref: string;
  objective_binding_digest: string;
  scope_id: string;
  scope_digest: string;
  margin_id: string;
  margin_digest: string;
  digest_algorithm: "SHA-256";
  company_global_claim: false;
  observational_only: true;
  grants_authority: false;
  grants_execution: false;
  grants_remediation: false;
}>;

const statuses = new Set(["AVAILABLE", "BOUNDARY_REACHED", "BOUNDARY_EXCEEDED", "UNRESOLVED", "INSUFFICIENT_EVIDENCE"]);
function required(value:string|undefined,code:string):string{const v=value?.trim();if(!v)throw new Error(code);return v;}
function ref(value:string|undefined,code:string):string{const v=required(value,code);if(!/^[A-Za-z0-9][A-Za-z0-9._-]*:[^\s]+$/.test(v))throw new Error(code);return v;}
function refs(values:readonly string[],code:string):readonly string[]{if(!Array.isArray(values))throw new Error(code);const out=[...new Set(values.map(x=>ref(x,code)))].sort();if(!out.length)throw new Error(code);return out;}
function time(value:string|undefined,code:string):string{if(!value||!Number.isFinite(Date.parse(value)))throw new Error(code);return value;}
function measure(value:CanonicalDecisionMarginMeasureV1|undefined,code:string):CanonicalDecisionMarginMeasureV1{if(!value||!Number.isFinite(value.value)||value.value<0)throw new Error(code);return Object.freeze({value:value.value,unit_ref:ref(value.unit_ref,code),measurement_ref:ref(value.measurement_ref,code)});}
function canonical(value:unknown):string{if(Array.isArray(value))return`[${value.map(canonical).join(",")}]`;if(value&&typeof value==="object")return`{${Object.entries(value as Record<string,unknown>).filter(([,v])=>v!==undefined).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;return JSON.stringify(value);}
async function sha(value:unknown):Promise<string>{const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(canonical(value)));return Array.from(new Uint8Array(d),b=>b.toString(16).padStart(2,"0")).join("");}
function freeze<T>(value:T):Readonly<T>{if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value as Record<string,unknown>).forEach(freeze);Object.freeze(value);}return value;}

async function verifyObjective(objective:ProtectedOperationalObjectiveBindingV1):Promise<void>{
  const rebuilt=await createProtectedOperationalObjectiveBindingV1(objective);
  if(rebuilt.objective_binding_id!==objective.objective_binding_id||rebuilt.objective_binding_digest!==objective.objective_binding_digest)throw new Error("DECISION_MARGIN_OBJECTIVE_INTEGRITY_INVALID");
}

export async function createCanonicalDecisionMarginV1(input:CanonicalDecisionMarginInputV1):Promise<CanonicalDecisionMarginV1>{
  if(input.version!==1)throw new Error("DECISION_MARGIN_VERSION_UNSUPPORTED");
  if(!statuses.has(input.status))throw new Error("DECISION_MARGIN_STATUS_INVALID");
  await verifyOperationalSignalEvaluationScopeV1(input.evaluation_scope.scope,input);
  await verifyObjective(input.protected_objective);
  const scope=input.evaluation_scope.scope;
  if(scope.scope_type!=="ENTITY")throw new Error("DECISION_MARGIN_SCOPE_UNSUPPORTED");
  if(input.protected_objective.request_id!==input.request_id||input.protected_objective.company_id!==input.company_id)throw new Error("DECISION_MARGIN_OBJECTIVE_BINDING_MISMATCH");
  if(input.protected_objective.scope_id!==scope.scope_id||input.protected_objective.scope_digest!==scope.scope_digest)throw new Error("DECISION_MARGIN_OBJECTIVE_SCOPE_MISMATCH");
  const evidence_as_of=time(input.evidence_as_of,"DECISION_MARGIN_AS_OF_INVALID");
  const evaluated_at=time(input.evaluated_at,"DECISION_MARGIN_EVALUATED_AT_INVALID");
  if(evidence_as_of!==input.evaluation_scope.evidence_as_of||evaluated_at!==input.evaluation_scope.evaluated_at)throw new Error("DECISION_MARGIN_TIME_BINDING_MISMATCH");
  if(Date.parse(evidence_as_of)>Date.parse(evaluated_at))throw new Error("DECISION_MARGIN_TIME_ORDER_INVALID");
  if(input.epistemic_basis!=="DETERMINISTIC")throw new Error("DECISION_MARGIN_EPISTEMIC_BASIS_UNSUPPORTED");
  const resolved=input.status==="AVAILABLE"||input.status==="BOUNDARY_REACHED";
  if(resolved&&!input.remaining_margin)throw new Error("DECISION_MARGIN_REMAINING_REQUIRED");
  if(!resolved&&input.remaining_margin)throw new Error("DECISION_MARGIN_REMAINING_NOT_APPLICABLE");
  const remaining=input.remaining_margin?measure(input.remaining_margin,"DECISION_MARGIN_MEASURE_INVALID"):undefined;
  if(input.status==="AVAILABLE"&&remaining!.value<=0)throw new Error("DECISION_MARGIN_AVAILABLE_MUST_BE_POSITIVE");
  if(input.status==="BOUNDARY_REACHED"&&remaining!.value!==0)throw new Error("DECISION_MARGIN_REACHED_MUST_BE_ZERO");
  const semantic={version:1 as const,request_id:required(input.request_id,"DECISION_MARGIN_REQUEST_REQUIRED"),company_id:required(input.company_id,"DECISION_MARGIN_COMPANY_REQUIRED"),scope_id:scope.scope_id,scope_digest:scope.scope_digest,objective_binding_ref:input.protected_objective.objective_binding_id,objective_binding_digest:input.protected_objective.objective_binding_digest,governing_condition_ref:ref(input.governing_condition_ref,"DECISION_MARGIN_CONDITION_REQUIRED"),governing_dimension_ref:ref(input.governing_dimension_ref,"DECISION_MARGIN_DIMENSION_REQUIRED"),current_position_ref:ref(input.current_position_ref,"DECISION_MARGIN_POSITION_REQUIRED"),compromise_boundary_ref:ref(input.compromise_boundary_ref,"DECISION_MARGIN_BOUNDARY_REQUIRED"),material_compromise_refs:refs(input.material_compromise_refs,"DECISION_MARGIN_COMPROMISE_REQUIRED"),status:input.status,...(remaining?{remaining_margin:remaining}:{ }),epistemic_basis:"DETERMINISTIC" as const,producer_ref:ref(input.producer_ref,"DECISION_MARGIN_PRODUCER_REQUIRED"),policy_ref:ref(input.policy_ref,"DECISION_MARGIN_POLICY_REQUIRED"),evidence_refs:refs(input.evidence_refs,"DECISION_MARGIN_EVIDENCE_REQUIRED"),qualification_refs:refs(input.qualification_refs,"DECISION_MARGIN_QUALIFICATION_REQUIRED"),provenance_refs:refs(input.provenance_refs,"DECISION_MARGIN_PROVENANCE_REQUIRED"),causal_lineage_refs:refs(input.causal_lineage_refs,"DECISION_MARGIN_LINEAGE_REQUIRED"),evidence_as_of,evaluated_at};
  const margin_digest=await sha(semantic);
  const {remaining_margin:_callerRemaining,...boundInput}=input;
  return freeze({...boundInput,...semantic,margin_id:`canonical-decision-margin:sha256:${margin_digest}`,margin_digest,digest_algorithm:"SHA-256" as const,company_global_claim:false as const,observational_only:true as const,grants_authority:false as const,grants_execution:false as const,grants_remediation:false as const}) as CanonicalDecisionMarginV1;
}
