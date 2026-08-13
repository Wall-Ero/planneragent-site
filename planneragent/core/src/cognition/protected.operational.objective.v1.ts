import type { OperationalSignalScopeBindingV1 } from "../cockpit/operational.signal.evaluation.scope.v1";
import { verifyOperationalSignalEvaluationScopeV1 } from "../cockpit/operational.signal.evaluation.scope.v1";

export type ProtectedOperationalObjectiveBindingInputV1 = Readonly<{
  version: 1;
  request_id: string;
  company_id: string;
  evaluation_scope: OperationalSignalScopeBindingV1;
  domain_profile_ref: string;
  domain_profile_version: string;
  objective_kind_ref: string;
  objective_ref: string;
  governing_expected_state_refs: readonly string[];
  governing_plan_element_refs: readonly string[];
  protected_subject_refs: readonly string[];
  commitment_criteria_refs: readonly string[];
  objective_selection_ref: string;
  source_evidence_refs: readonly string[];
  provenance_refs: readonly string[];
  qualification_refs: readonly string[];
  causal_lineage_refs: readonly string[];
  plan_lineage_refs: readonly string[];
  effective_at: string;
  evidence_as_of: string;
  evaluated_at: string;
}>;

export type ProtectedOperationalObjectiveBindingV1 = ProtectedOperationalObjectiveBindingInputV1 & Readonly<{
  objective_binding_id: string;
  objective_binding_digest: string;
  scope_id: string;
  scope_digest: string;
  digest_algorithm: "SHA-256";
  company_global_claim: false;
  grants_execution: false;
  grants_authority: false;
  grants_remediation: false;
  observational_only: true;
}>;

function required(value: string, code: string): string { const v=value?.trim(); if(!v)throw new Error(code); return v; }
function ref(value:string,code:string):string{const v=required(value,code);if(!/^[A-Za-z0-9][A-Za-z0-9._-]*:[^\s]+$/.test(v))throw new Error(code);return v;}
function refs(values:readonly string[],code:string,requiredList=true):readonly string[]{const v=[...new Set(values.map(x=>ref(x,code)))].sort();if(requiredList&&!v.length)throw new Error(code);return v;}
function time(value:string,code:string):string{if(!Number.isFinite(Date.parse(value)))throw new Error(code);return value;}
function canonicalJson(value:unknown):string{if(Array.isArray(value))return`[${value.map(canonicalJson).join(",")}]`;if(value&&typeof value==="object")return`{${Object.entries(value as Record<string,unknown>).filter(([,v])=>v!==undefined).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${JSON.stringify(k)}:${canonicalJson(v)}`).join(",")}}`;return JSON.stringify(value);}
async function digest(value:unknown):Promise<string>{const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(canonicalJson(value)));return Array.from(new Uint8Array(d),b=>b.toString(16).padStart(2,"0")).join("");}
function freeze<T>(value:T):Readonly<T>{if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value as Record<string,unknown>).forEach(freeze);Object.freeze(value);}return value;}

export async function createProtectedOperationalObjectiveBindingV1(
  input: ProtectedOperationalObjectiveBindingInputV1,
): Promise<ProtectedOperationalObjectiveBindingV1> {
  if(input.version!==1)throw new Error("PROTECTED_OBJECTIVE_VERSION_UNSUPPORTED");
  await verifyOperationalSignalEvaluationScopeV1(input.evaluation_scope.scope,input);
  const evidence_as_of=time(input.evidence_as_of,"PROTECTED_OBJECTIVE_AS_OF_INVALID");
  const evaluated_at=time(input.evaluated_at,"PROTECTED_OBJECTIVE_EVALUATED_AT_INVALID");
  const effective_at=time(input.effective_at,"PROTECTED_OBJECTIVE_EFFECTIVE_AT_INVALID");
  if(evidence_as_of!==input.evaluation_scope.evidence_as_of||evaluated_at!==input.evaluation_scope.evaluated_at)throw new Error("PROTECTED_OBJECTIVE_TIME_BINDING_MISMATCH");
  if(Date.parse(effective_at)>Date.parse(evidence_as_of)||Date.parse(evidence_as_of)>Date.parse(evaluated_at))throw new Error("PROTECTED_OBJECTIVE_TIME_ORDER_INVALID");
  const semantic={version:1 as const,request_id:required(input.request_id,"PROTECTED_OBJECTIVE_REQUEST_REQUIRED"),company_id:required(input.company_id,"PROTECTED_OBJECTIVE_COMPANY_REQUIRED"),scope_id:input.evaluation_scope.scope.scope_id,scope_digest:input.evaluation_scope.scope.scope_digest,domain_profile_ref:ref(input.domain_profile_ref,"PROTECTED_OBJECTIVE_PROFILE_REQUIRED"),domain_profile_version:required(input.domain_profile_version,"PROTECTED_OBJECTIVE_PROFILE_VERSION_REQUIRED"),objective_kind_ref:ref(input.objective_kind_ref,"PROTECTED_OBJECTIVE_KIND_REQUIRED"),objective_ref:ref(input.objective_ref,"PROTECTED_OBJECTIVE_REF_REQUIRED"),governing_expected_state_refs:refs(input.governing_expected_state_refs,"PROTECTED_OBJECTIVE_EXPECTED_STATE_INVALID",false),governing_plan_element_refs:refs(input.governing_plan_element_refs,"PROTECTED_OBJECTIVE_PLAN_ELEMENT_REQUIRED"),protected_subject_refs:refs(input.protected_subject_refs,"PROTECTED_OBJECTIVE_SUBJECT_REQUIRED"),commitment_criteria_refs:refs(input.commitment_criteria_refs,"PROTECTED_OBJECTIVE_CRITERIA_REQUIRED"),objective_selection_ref:ref(input.objective_selection_ref,"PROTECTED_OBJECTIVE_SELECTION_REQUIRED"),source_evidence_refs:refs(input.source_evidence_refs,"PROTECTED_OBJECTIVE_EVIDENCE_REQUIRED"),provenance_refs:refs(input.provenance_refs,"PROTECTED_OBJECTIVE_PROVENANCE_REQUIRED"),qualification_refs:refs(input.qualification_refs,"PROTECTED_OBJECTIVE_QUALIFICATION_REQUIRED"),causal_lineage_refs:refs(input.causal_lineage_refs,"PROTECTED_OBJECTIVE_CAUSAL_LINEAGE_REQUIRED"),plan_lineage_refs:refs(input.plan_lineage_refs,"PROTECTED_OBJECTIVE_PLAN_LINEAGE_REQUIRED"),effective_at,evidence_as_of,evaluated_at};
  const objective_binding_digest=await digest(semantic);
  return freeze({...input,...semantic,objective_binding_id:`protected-operational-objective:sha256:${objective_binding_digest}`,objective_binding_digest,digest_algorithm:"SHA-256" as const,company_global_claim:false as const,grants_execution:false as const,grants_authority:false as const,grants_remediation:false as const,observational_only:true as const}) as ProtectedOperationalObjectiveBindingV1;
}
