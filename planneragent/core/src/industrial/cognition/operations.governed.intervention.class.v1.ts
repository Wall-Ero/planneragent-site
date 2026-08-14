import type { OperationalSignalScopeBindingV1 } from "../../cockpit/operational.signal.evaluation.scope.v1";
import { verifyOperationalSignalEvaluationScopeV1 } from "../../cockpit/operational.signal.evaluation.scope.v1";
import type { MaterialOperationalConsequenceRefV1 } from "../../cognition/canonical.operational.roles.v1";
import type { ProtectedOperationalObjectiveBindingV1 } from "../../cognition/protected.operational.objective.v1";
import { createProtectedOperationalObjectiveBindingV1 } from "../../cognition/protected.operational.objective.v1";

export type OperationsInterventionApplicabilityStatusV1 = "APPLICABLE" | "NOT_APPLICABLE" | "UNRESOLVED" | "INSUFFICIENT_EVIDENCE";
export type OperationsInterventionMaterialEffectStatusV1 = "MATERIAL_EFFECT_ESTABLISHED" | "NO_MATERIAL_EFFECT_ESTABLISHED" | "UNRESOLVED" | "INSUFFICIENT_EVIDENCE";
export type OperationsInterventionEpistemicBasisV1 = "DETERMINISTIC" | "DETERMINISTIC_COUNTERFACTUAL";

export type OperationsGovernedInterventionClassV1 = Readonly<{
  version:1; domain_ref:"domain:operations"; domain_profile_ref:string; domain_profile_version:string;
  class_key:string; producer_ref:string; policy_ref:string; intervention_class_id:string;
  intervention_class_digest:string; digest_algorithm:"SHA-256"; class_only:true; instance_payload_absent:true;
  observational_only:true; recommended:false; selected:false; executable:false; grants_authority:false;
  grants_execution:false; grants_remediation:false;
}>;

export type OperationsGovernedInterventionEvidenceV1 = Readonly<{
  version:1; intervention_class_ref:string; intervention_class_digest:string; domain_ref:"domain:operations";
  domain_profile_ref:string; domain_profile_version:string; producer_ref:string; policy_ref:string;
  request_id:string; company_id:string; scope_id:string; scope_digest:string;
  protected_objective_ref?:string; protected_objective_digest?:string;
  material_consequence_ref?:string; material_consequence_digest?:string;
  governing_condition_ref:string; trajectory_ref:string;
  applicability_status:OperationsInterventionApplicabilityStatusV1;
  applicability_evidence_refs:readonly string[]; material_effect_status:OperationsInterventionMaterialEffectStatusV1;
  material_effect_evidence_refs:readonly string[]; determination_basis_refs:readonly string[];
  qualification_refs:readonly string[]; provenance_refs:readonly string[]; causal_lineage_refs:readonly string[];
  epistemic_basis:OperationsInterventionEpistemicBasisV1; evidence_as_of:string; evaluated_at:string;
  intervention_evidence_id:string; intervention_evidence_digest:string; digest_algorithm:"SHA-256";
  guarantees_success:false; observational_only:true; recommended:false; selected:false; executable:false;
  grants_authority:false; grants_execution:false; grants_remediation:false; company_global_claim:false;
}>;

const applicabilityStatuses=new Set<string>(["APPLICABLE","NOT_APPLICABLE","UNRESOLVED","INSUFFICIENT_EVIDENCE"]);
const effectStatuses=new Set<string>(["MATERIAL_EFFECT_ESTABLISHED","NO_MATERIAL_EFFECT_ESTABLISHED","UNRESOLVED","INSUFFICIENT_EVIDENCE"]);
const epistemicBases=new Set<string>(["DETERMINISTIC","DETERMINISTIC_COUNTERFACTUAL"]);
const forbidden=["authority_tier","subscription_tier","approval_ref","delegation_ref","credential_ref","execution_authority_ref","execution_capability_ref","capability_registry_ref","optimizer_action","optimizer_candidate_ref","candidate_plan_ref","derived_action_ref","sandbox_action_ref","correction_effect","recommendation_ref","selected_option_ref","selected_action_ref","action_instance","execution_payload","decision_opportunity_ref","decision_influenceability_ref","decision_margin_ref","urgency","cost_of_waiting","pressure"];

function required(value:string|undefined,code:string):string{const v=value?.trim();if(!v)throw new Error(code);return v;}
function ref(value:string|undefined,code:string):string{const v=required(value,code);if(!/^[A-Za-z0-9][A-Za-z0-9._-]*:[^\s]+$/.test(v))throw new Error(code);return v;}
function refs(values:readonly string[],code:string):readonly string[]{if(!Array.isArray(values))throw new Error(code);const out=[...new Set(values.map(x=>ref(x,code)))].sort();if(!out.length)throw new Error(code);return out;}
function token(value:string|undefined,code:string):string{const v=required(value,code);if(!/^[A-Z][A-Z0-9_]{0,95}$/.test(v))throw new Error(code);return v;}
function time(value:string,code:string):string{if(!Number.isFinite(Date.parse(value)))throw new Error(code);return value;}
function canonical(value:unknown):string{if(Array.isArray(value))return`[${value.map(canonical).join(",")}]`;if(value&&typeof value==="object")return`{${Object.entries(value as Record<string,unknown>).filter(([,v])=>v!==undefined).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;return JSON.stringify(value);}
async function sha(value:unknown):Promise<string>{const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(canonical(value)));return Array.from(new Uint8Array(d),b=>b.toString(16).padStart(2,"0")).join("");}
function freeze<T>(value:T):Readonly<T>{if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value as Record<string,unknown>).forEach(freeze);Object.freeze(value);}return value;}

export async function createOperationsGovernedInterventionClassV1(input:Readonly<{version:1;domain_profile_ref:string;domain_profile_version:string;class_key:string;producer_ref:string;policy_ref:string}>):Promise<OperationsGovernedInterventionClassV1>{
  if(input.version!==1)throw new Error("OPS_INTERVENTION_CLASS_VERSION_UNSUPPORTED");
  const semantic={version:1 as const,domain_ref:"domain:operations" as const,domain_profile_ref:ref(input.domain_profile_ref,"OPS_INTERVENTION_PROFILE_REQUIRED"),domain_profile_version:required(input.domain_profile_version,"OPS_INTERVENTION_PROFILE_VERSION_REQUIRED"),class_key:token(input.class_key,"OPS_INTERVENTION_CLASS_KEY_INVALID"),producer_ref:ref(input.producer_ref,"OPS_INTERVENTION_PRODUCER_REQUIRED"),policy_ref:ref(input.policy_ref,"OPS_INTERVENTION_POLICY_REQUIRED")};
  const intervention_class_digest=await sha(semantic);
  return freeze({...semantic,intervention_class_id:`operations-intervention-class:sha256:${intervention_class_digest}`,intervention_class_digest,digest_algorithm:"SHA-256" as const,class_only:true as const,instance_payload_absent:true as const,observational_only:true as const,recommended:false as const,selected:false as const,executable:false as const,grants_authority:false as const,grants_execution:false as const,grants_remediation:false as const});
}

async function verifyClass(value:OperationsGovernedInterventionClassV1):Promise<void>{const rebuilt=await createOperationsGovernedInterventionClassV1(value);if(rebuilt.intervention_class_id!==value.intervention_class_id||rebuilt.intervention_class_digest!==value.intervention_class_digest)throw new Error("OPS_INTERVENTION_CLASS_INTEGRITY_INVALID");if(value.class_only!==true||value.instance_payload_absent!==true||value.observational_only!==true||value.recommended!==false||value.selected!==false||value.executable!==false||value.grants_authority!==false||value.grants_execution!==false||value.grants_remediation!==false)throw new Error("OPS_INTERVENTION_CLASS_BOUNDARY_INVALID");}

export async function createOperationsGovernedInterventionEvidenceV1(input:Readonly<{version:1;intervention_class:OperationsGovernedInterventionClassV1;request_id:string;company_id:string;evaluation_scope:OperationalSignalScopeBindingV1;protected_objective?:ProtectedOperationalObjectiveBindingV1;material_consequence?:MaterialOperationalConsequenceRefV1;governing_condition_ref:string;trajectory_ref:string;applicability_status:OperationsInterventionApplicabilityStatusV1;applicability_evidence_refs:readonly string[];material_effect_status:OperationsInterventionMaterialEffectStatusV1;material_effect_evidence_refs:readonly string[];determination_basis_refs:readonly string[];qualification_refs:readonly string[];provenance_refs:readonly string[];causal_lineage_refs:readonly string[];epistemic_basis:OperationsInterventionEpistemicBasisV1;evidence_as_of:string;evaluated_at:string}>):Promise<OperationsGovernedInterventionEvidenceV1>{
  if(input.version!==1)throw new Error("OPS_INTERVENTION_EVIDENCE_VERSION_UNSUPPORTED");
  for(const key of forbidden)if(key in (input as unknown as Record<string,unknown>))throw new Error("OPS_INTERVENTION_UNSUPPORTED_INPUT");
  await verifyClass(input.intervention_class);await verifyOperationalSignalEvaluationScopeV1(input.evaluation_scope.scope,input);
  if(input.evaluation_scope.scope.domain!=="operations")throw new Error("OPS_INTERVENTION_DOMAIN_MISMATCH");
  const evidence_as_of=time(input.evidence_as_of,"OPS_INTERVENTION_AS_OF_INVALID"),evaluated_at=time(input.evaluated_at,"OPS_INTERVENTION_EVALUATED_AT_INVALID");
  if(evidence_as_of!==input.evaluation_scope.evidence_as_of||evaluated_at!==input.evaluation_scope.evaluated_at||Date.parse(evidence_as_of)>Date.parse(evaluated_at))throw new Error("OPS_INTERVENTION_TIME_BINDING_MISMATCH");
  if(!input.protected_objective&&!input.material_consequence)throw new Error("OPS_INTERVENTION_GOVERNED_TARGET_REQUIRED");
  if(input.protected_objective){const rebuilt=await createProtectedOperationalObjectiveBindingV1(input.protected_objective);if(rebuilt.objective_binding_digest!==input.protected_objective.objective_binding_digest)throw new Error("OPS_INTERVENTION_OBJECTIVE_INTEGRITY_INVALID");if(input.protected_objective.request_id!==input.request_id||input.protected_objective.company_id!==input.company_id||input.protected_objective.scope_digest!==input.evaluation_scope.scope.scope_digest||input.protected_objective.domain_profile_ref!==input.intervention_class.domain_profile_ref||input.protected_objective.domain_profile_version!==input.intervention_class.domain_profile_version)throw new Error("OPS_INTERVENTION_OBJECTIVE_BINDING_MISMATCH");}
  if(input.material_consequence&&(input.material_consequence.role!=="CONSEQUENCE"||input.material_consequence.subject.company_id!==input.company_id||input.material_consequence.scope_ref!==input.evaluation_scope.scope.scope_id||input.material_consequence.observational_only!==true||input.material_consequence.grants_execution!==false||input.material_consequence.grants_authority!==false))throw new Error("OPS_INTERVENTION_CONSEQUENCE_BINDING_MISMATCH");
  if(!applicabilityStatuses.has(input.applicability_status))throw new Error("OPS_INTERVENTION_APPLICABILITY_STATUS_INVALID");
  if(!effectStatuses.has(input.material_effect_status))throw new Error("OPS_INTERVENTION_EFFECT_STATUS_INVALID");
  if(!epistemicBases.has(input.epistemic_basis))throw new Error("OPS_INTERVENTION_EPISTEMIC_BASIS_UNSUPPORTED");
  const semantic={version:1 as const,intervention_class_ref:input.intervention_class.intervention_class_id,intervention_class_digest:input.intervention_class.intervention_class_digest,domain_ref:input.intervention_class.domain_ref,domain_profile_ref:input.intervention_class.domain_profile_ref,domain_profile_version:input.intervention_class.domain_profile_version,producer_ref:input.intervention_class.producer_ref,policy_ref:input.intervention_class.policy_ref,request_id:required(input.request_id,"OPS_INTERVENTION_REQUEST_REQUIRED"),company_id:required(input.company_id,"OPS_INTERVENTION_COMPANY_REQUIRED"),scope_id:input.evaluation_scope.scope.scope_id,scope_digest:input.evaluation_scope.scope.scope_digest,...(input.protected_objective?{protected_objective_ref:input.protected_objective.objective_binding_id,protected_objective_digest:input.protected_objective.objective_binding_digest}:{}),...(input.material_consequence?{material_consequence_ref:input.material_consequence.role_id,material_consequence_digest:input.material_consequence.role_digest}:{}),governing_condition_ref:ref(input.governing_condition_ref,"OPS_INTERVENTION_CONDITION_REQUIRED"),trajectory_ref:ref(input.trajectory_ref,"OPS_INTERVENTION_TRAJECTORY_REQUIRED"),applicability_status:input.applicability_status,applicability_evidence_refs:refs(input.applicability_evidence_refs,"OPS_INTERVENTION_APPLICABILITY_EVIDENCE_REQUIRED"),material_effect_status:input.material_effect_status,material_effect_evidence_refs:refs(input.material_effect_evidence_refs,"OPS_INTERVENTION_EFFECT_EVIDENCE_REQUIRED"),determination_basis_refs:refs(input.determination_basis_refs,"OPS_INTERVENTION_BASIS_REQUIRED"),qualification_refs:refs(input.qualification_refs,"OPS_INTERVENTION_QUALIFICATION_REQUIRED"),provenance_refs:refs(input.provenance_refs,"OPS_INTERVENTION_PROVENANCE_REQUIRED"),causal_lineage_refs:refs(input.causal_lineage_refs,"OPS_INTERVENTION_LINEAGE_REQUIRED"),epistemic_basis:input.epistemic_basis,evidence_as_of,evaluated_at};
  const intervention_evidence_digest=await sha(semantic);
  return freeze({...semantic,intervention_evidence_id:`operations-intervention-evidence:sha256:${intervention_evidence_digest}`,intervention_evidence_digest,digest_algorithm:"SHA-256" as const,guarantees_success:false as const,observational_only:true as const,recommended:false as const,selected:false as const,executable:false as const,grants_authority:false as const,grants_execution:false as const,grants_remediation:false as const,company_global_claim:false as const});
}
