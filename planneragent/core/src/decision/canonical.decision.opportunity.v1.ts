import type { OperationalSignalScopeBindingV1 } from "../cockpit/operational.signal.evaluation.scope.v1";
import { verifyOperationalSignalEvaluationScopeV1 } from "../cockpit/operational.signal.evaluation.scope.v1";
import type { MaterialOperationalConsequenceRefV1 } from "../cognition/canonical.operational.roles.v1";
import { createProtectedOperationalObjectiveBindingV1, type ProtectedOperationalObjectiveBindingV1 } from "../cognition/protected.operational.objective.v1";
import { createCanonicalDecisionMarginV1, type CanonicalDecisionMarginV1 } from "./canonical.decision.margin.v1";

export type CanonicalDecisionOpportunityPurposeV1 = "PRESERVATION"|"RECOVERY"|"CONTAINMENT"|"ADAPTATION";
export type CanonicalDecisionOpportunityStatusV1 = "OPEN"|"CLOSED"|"UNRESOLVED"|"INSUFFICIENT_EVIDENCE";

export type CanonicalDecisionOpportunityInputV1 = Readonly<{
  version:1;
  request_id:string;
  company_id:string;
  evaluation_scope:OperationalSignalScopeBindingV1;
  protected_objective?:ProtectedOperationalObjectiveBindingV1;
  material_consequence?:MaterialOperationalConsequenceRefV1;
  governing_condition_ref:string;
  purpose:CanonicalDecisionOpportunityPurposeV1;
  status:CanonicalDecisionOpportunityStatusV1;
  decision_margin?:CanonicalDecisionMarginV1;
  predecessor_opportunity?:CanonicalDecisionOpportunityV1;
  transition_trigger_refs:readonly string[];
  closure_reason_ref?:string;
  evidence_refs:readonly string[];
  qualification_refs:readonly string[];
  provenance_refs:readonly string[];
  causal_lineage_refs:readonly string[];
  evidence_as_of:string;
  evaluated_at:string;
}>;

export type CanonicalDecisionOpportunityV1 = Readonly<{
  version:1;request_id:string;company_id:string;scope_id:string;scope_digest:string;
  protected_objective_ref?:string;protected_objective_digest?:string;
  material_consequence_ref?:string;material_consequence_digest?:string;
  governing_condition_ref:string;purpose:CanonicalDecisionOpportunityPurposeV1;status:CanonicalDecisionOpportunityStatusV1;
  decision_margin_ref?:string;decision_margin_digest?:string;
  predecessor_opportunity_ref?:string;predecessor_opportunity_digest?:string;
  transition_trigger_refs:readonly string[];closure_reason_ref?:string;
  evidence_refs:readonly string[];qualification_refs:readonly string[];provenance_refs:readonly string[];causal_lineage_refs:readonly string[];
  evidence_as_of:string;evaluated_at:string;opportunity_id:string;opportunity_digest:string;digest_algorithm:"SHA-256";
  current_opportunity_claim:boolean;global_no_decision_claim:false;successor_created_automatically:false;
  observational_only:true;grants_authority:false;grants_execution:false;grants_remediation:false;recommended:false;executable:false;company_global_claim:false;
}>;

const purposes=new Set(["PRESERVATION","RECOVERY","CONTAINMENT","ADAPTATION"]),statuses=new Set(["OPEN","CLOSED","UNRESOLVED","INSUFFICIENT_EVIDENCE"]);
function ref(value:string|undefined,code:string):string{const v=value?.trim();if(!v||!/^[A-Za-z0-9][A-Za-z0-9._-]*:[^\s]+$/.test(v))throw new Error(code);return v;}
function refs(values:readonly string[],code:string,required=true):readonly string[]{if(!Array.isArray(values))throw new Error(code);const out=[...new Set(values.map(x=>ref(x,code)))].sort();if(required&&!out.length)throw new Error(code);return out;}
function time(value:string|undefined,code:string):string{if(!value||!Number.isFinite(Date.parse(value)))throw new Error(code);return value;}
function canonical(value:unknown):string{if(Array.isArray(value))return`[${value.map(canonical).join(",")}]`;if(value&&typeof value==="object")return`{${Object.entries(value as Record<string,unknown>).filter(([,v])=>v!==undefined).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;return JSON.stringify(value);}
async function sha(value:unknown):Promise<string>{const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(canonical(value)));return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,"0")).join("");}
function freeze<T>(value:T):Readonly<T>{if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value as Record<string,unknown>).forEach(freeze);Object.freeze(value);}return value;}
function semanticFromOpportunity(o:CanonicalDecisionOpportunityV1){return{version:o.version,request_id:o.request_id,company_id:o.company_id,scope_id:o.scope_id,scope_digest:o.scope_digest,...(o.protected_objective_ref?{protected_objective_ref:o.protected_objective_ref,protected_objective_digest:o.protected_objective_digest}:{}),...(o.material_consequence_ref?{material_consequence_ref:o.material_consequence_ref,material_consequence_digest:o.material_consequence_digest}:{}),governing_condition_ref:o.governing_condition_ref,purpose:o.purpose,status:o.status,...(o.decision_margin_ref?{decision_margin_ref:o.decision_margin_ref,decision_margin_digest:o.decision_margin_digest}:{}),...(o.predecessor_opportunity_ref?{predecessor_opportunity_ref:o.predecessor_opportunity_ref,predecessor_opportunity_digest:o.predecessor_opportunity_digest}:{}),transition_trigger_refs:o.transition_trigger_refs,...(o.closure_reason_ref?{closure_reason_ref:o.closure_reason_ref}:{}),evidence_refs:o.evidence_refs,qualification_refs:o.qualification_refs,provenance_refs:o.provenance_refs,causal_lineage_refs:o.causal_lineage_refs,evidence_as_of:o.evidence_as_of,evaluated_at:o.evaluated_at,current_opportunity_claim:o.current_opportunity_claim};}

export async function verifyCanonicalDecisionOpportunityV1(o:CanonicalDecisionOpportunityV1):Promise<void>{
  const digest=await sha(semanticFromOpportunity(o));
  if(digest!==o.opportunity_digest||o.opportunity_id!==`canonical-decision-opportunity:sha256:${digest}`)throw new Error("DECISION_OPPORTUNITY_INTEGRITY_INVALID");
  if(o.digest_algorithm!=="SHA-256"||o.global_no_decision_claim!==false||o.successor_created_automatically!==false||o.observational_only!==true||o.grants_authority!==false||o.grants_execution!==false||o.grants_remediation!==false||o.recommended!==false||o.executable!==false||o.company_global_claim!==false)throw new Error("DECISION_OPPORTUNITY_BOUNDARY_INVALID");
}

export async function createCanonicalDecisionOpportunityV1(input:CanonicalDecisionOpportunityInputV1):Promise<CanonicalDecisionOpportunityV1>{
  if(input.version!==1)throw new Error("DECISION_OPPORTUNITY_VERSION_UNSUPPORTED");
  for(const forbidden of ["authority_tier","subscription_tier","approval_ref","delegation_ref","credential_ref","execution_capability_ref","recommended_action_ref","candidate_action_ref","optimizer_output_ref","successor_opportunity"]){if(forbidden in (input as unknown as Record<string,unknown>))throw new Error("DECISION_OPPORTUNITY_UNSUPPORTED_INPUT");}
  if(!purposes.has(input.purpose))throw new Error("DECISION_OPPORTUNITY_PURPOSE_INVALID");
  if(!statuses.has(input.status))throw new Error("DECISION_OPPORTUNITY_STATUS_INVALID");
  await verifyOperationalSignalEvaluationScopeV1(input.evaluation_scope.scope,input);
  const scope=input.evaluation_scope.scope;
  if(scope.request_id!==input.request_id||scope.company_id!==input.company_id)throw new Error("DECISION_OPPORTUNITY_SCOPE_BINDING_MISMATCH");
  const evidence_as_of=time(input.evidence_as_of,"DECISION_OPPORTUNITY_AS_OF_INVALID"),evaluated_at=time(input.evaluated_at,"DECISION_OPPORTUNITY_EVALUATED_AT_INVALID");
  if(evidence_as_of!==input.evaluation_scope.evidence_as_of||evaluated_at!==input.evaluation_scope.evaluated_at||Date.parse(evidence_as_of)>Date.parse(evaluated_at))throw new Error("DECISION_OPPORTUNITY_TIME_BINDING_INVALID");
  if(!input.protected_objective&&!input.material_consequence)throw new Error("DECISION_OPPORTUNITY_CONTEXT_REQUIRED");
  if(input.protected_objective){const rebuilt=await createProtectedOperationalObjectiveBindingV1(input.protected_objective);if(rebuilt.objective_binding_id!==input.protected_objective.objective_binding_id||rebuilt.objective_binding_digest!==input.protected_objective.objective_binding_digest)throw new Error("DECISION_OPPORTUNITY_OBJECTIVE_INTEGRITY_INVALID");if(input.protected_objective.request_id!==input.request_id||input.protected_objective.company_id!==input.company_id||input.protected_objective.scope_id!==scope.scope_id||input.protected_objective.scope_digest!==scope.scope_digest)throw new Error("DECISION_OPPORTUNITY_OBJECTIVE_SCOPE_MISMATCH");}
  if(input.material_consequence){const c=input.material_consequence,semantic={version:c.version,subject:c.subject,scope_ref:c.scope_ref,evidence_refs:c.evidence_refs,provenance_refs:c.provenance_refs,causal_lineage_refs:c.causal_lineage_refs,role:c.role,consequence_ref:c.consequence_ref,consequence_kind_ref:c.consequence_kind_ref,materiality_ref:c.materiality_ref},digest=await sha(semantic);if(digest!==c.role_digest||c.role_id!==`operational-role:consequence:sha256:${digest}`)throw new Error("DECISION_OPPORTUNITY_CONSEQUENCE_INTEGRITY_INVALID");if(c.subject.company_id!==input.company_id||c.scope_ref!==scope.scope_id)throw new Error("DECISION_OPPORTUNITY_CONSEQUENCE_SCOPE_MISMATCH");}
  if(input.decision_margin){const m=input.decision_margin,rebuilt=await createCanonicalDecisionMarginV1(m);if(rebuilt.margin_id!==m.margin_id||rebuilt.margin_digest!==m.margin_digest)throw new Error("DECISION_OPPORTUNITY_MARGIN_INTEGRITY_INVALID");if(m.request_id!==input.request_id||m.company_id!==input.company_id||m.scope_id!==scope.scope_id||m.scope_digest!==scope.scope_digest||m.governing_condition_ref!==input.governing_condition_ref)throw new Error("DECISION_OPPORTUNITY_MARGIN_BINDING_MISMATCH");if(input.protected_objective&&(m.objective_binding_ref!==input.protected_objective.objective_binding_id||m.objective_binding_digest!==input.protected_objective.objective_binding_digest))throw new Error("DECISION_OPPORTUNITY_MARGIN_OBJECTIVE_MISMATCH");}
  if(input.predecessor_opportunity){await verifyCanonicalDecisionOpportunityV1(input.predecessor_opportunity);const p=input.predecessor_opportunity;if(p.request_id!==input.request_id||p.company_id!==input.company_id||p.scope_id!==scope.scope_id||p.scope_digest!==scope.scope_digest)throw new Error("DECISION_OPPORTUNITY_PREDECESSOR_SCOPE_MISMATCH");if(Date.parse(p.evaluated_at)>Date.parse(evidence_as_of))throw new Error("DECISION_OPPORTUNITY_PREDECESSOR_TIME_INVALID");}
  const transition_trigger_refs=refs(input.transition_trigger_refs,"DECISION_OPPORTUNITY_TRANSITION_TRIGGER_INVALID",false);
  if(input.predecessor_opportunity&&!transition_trigger_refs.length)throw new Error("DECISION_OPPORTUNITY_TRANSITION_TRIGGER_REQUIRED");
  if(input.status==="CLOSED"&&(!input.closure_reason_ref||!transition_trigger_refs.length))throw new Error("DECISION_OPPORTUNITY_CLOSURE_EVIDENCE_REQUIRED");
  if(input.status!=="CLOSED"&&input.closure_reason_ref)throw new Error("DECISION_OPPORTUNITY_CLOSURE_NOT_APPLICABLE");
  const current_opportunity_claim=input.status==="OPEN";
  const semantic={version:1 as const,request_id:input.request_id.trim(),company_id:input.company_id.trim(),scope_id:scope.scope_id,scope_digest:scope.scope_digest,...(input.protected_objective?{protected_objective_ref:input.protected_objective.objective_binding_id,protected_objective_digest:input.protected_objective.objective_binding_digest}:{}),...(input.material_consequence?{material_consequence_ref:input.material_consequence.role_id,material_consequence_digest:input.material_consequence.role_digest}:{}),governing_condition_ref:ref(input.governing_condition_ref,"DECISION_OPPORTUNITY_CONDITION_REQUIRED"),purpose:input.purpose,status:input.status,...(input.decision_margin?{decision_margin_ref:input.decision_margin.margin_id,decision_margin_digest:input.decision_margin.margin_digest}:{}),...(input.predecessor_opportunity?{predecessor_opportunity_ref:input.predecessor_opportunity.opportunity_id,predecessor_opportunity_digest:input.predecessor_opportunity.opportunity_digest}:{}),transition_trigger_refs,...(input.closure_reason_ref?{closure_reason_ref:ref(input.closure_reason_ref,"DECISION_OPPORTUNITY_CLOSURE_REASON_INVALID")}:{}),evidence_refs:refs(input.evidence_refs,"DECISION_OPPORTUNITY_EVIDENCE_REQUIRED"),qualification_refs:refs(input.qualification_refs,"DECISION_OPPORTUNITY_QUALIFICATION_REQUIRED"),provenance_refs:refs(input.provenance_refs,"DECISION_OPPORTUNITY_PROVENANCE_REQUIRED"),causal_lineage_refs:refs(input.causal_lineage_refs,"DECISION_OPPORTUNITY_LINEAGE_REQUIRED"),evidence_as_of,evaluated_at,current_opportunity_claim};
  const opportunity_digest=await sha(semantic);
  return freeze({...semantic,opportunity_id:`canonical-decision-opportunity:sha256:${opportunity_digest}`,opportunity_digest,digest_algorithm:"SHA-256" as const,global_no_decision_claim:false as const,successor_created_automatically:false as const,observational_only:true as const,grants_authority:false as const,grants_execution:false as const,grants_remediation:false as const,recommended:false as const,executable:false as const,company_global_claim:false as const});
}
