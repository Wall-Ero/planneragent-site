import { createOperationalDomainEvidenceProfileV1, type OperationalDomainEvidenceProfileV1 } from "./canonical.operational.roles.v1";

export type DomainDimensionPrimitiveV1 = Readonly<{ dimension_key:string }>;
export type DomainInterventionPrimitiveV1 = Readonly<{ primitive_key:string; admitted_intervention_class_ref:string; admitted_intervention_class_digest:string; knowledge_hypothesis_refs:readonly string[]; experience_hypothesis_refs:readonly string[] }>;
export type DomainDimensionInterventionBindingV1 = Readonly<{ dimension_key:string; primitive_key:string }>;
export type DomainInterventionConstraintBindingV1 = Readonly<{ primitive_key:string; constraint_family_key:string }>;
export type DomainInterventionEvaluatorBindingV1 = Readonly<{ dimension_key:string; primitive_key:string; evaluator_family_key:string }>;

export type CanonicalDomainInterventionProfileInputV1 = Readonly<{
  version:1; binding_profile_ref:string; binding_profile_version:string;
  evidence_profile:OperationalDomainEvidenceProfileV1; policy_ref:string;
  dimension_primitives:readonly DomainDimensionPrimitiveV1[];
  intervention_primitives:readonly DomainInterventionPrimitiveV1[];
  constraint_family_keys:readonly string[]; evaluator_family_keys:readonly string[];
  dimension_intervention_bindings:readonly DomainDimensionInterventionBindingV1[];
  intervention_constraint_bindings:readonly DomainInterventionConstraintBindingV1[];
  intervention_evaluator_bindings:readonly DomainInterventionEvaluatorBindingV1[];
  qualification_refs:readonly string[];
}>;

export type CanonicalDomainInterventionProfileV1 = Readonly<{
  version:1; binding_profile_ref:string; binding_profile_version:string; domain_ref:string;
  domain_profile_ref:string; domain_profile_version:string; evidence_profile_digest:string; policy_ref:string;
  dimension_primitives:readonly DomainDimensionPrimitiveV1[];
  intervention_primitives:readonly DomainInterventionPrimitiveV1[];
  constraint_family_keys:readonly string[]; evaluator_family_keys:readonly string[];
  dimension_intervention_bindings:readonly DomainDimensionInterventionBindingV1[];
  intervention_constraint_bindings:readonly DomainInterventionConstraintBindingV1[];
  intervention_evaluator_bindings:readonly DomainInterventionEvaluatorBindingV1[];
  qualification_refs:readonly string[]; binding_profile_id:string; binding_profile_digest:string;
  digest_algorithm:"SHA-256"; declarative_only:true; establishes_current_truth:false;
  hypothesis_is_truth:false; establishes_changeability:false; establishes_admissibility:false;
  establishes_material_effect:false; recommended:false; selected:false; executable:false;
  grants_authority:false; grants_execution:false;
}>;

const forbidden=["company_id","tenant_id","current_state_ref","changeability_status","admissibility_status","material_effect_status","recommendation_ref","selected_action_ref","action_instance","execution_payload","authority_tier","subscription_tier","approval_ref","delegation_ref","credential_ref","source_system","decision_influenceability_ref","decision_opportunity_ref","decision_margin_ref","urgency","cost_of_waiting","pressure"];
function required(value:string|undefined,code:string):string{const v=value?.trim();if(!v)throw new Error(code);return v;}
function ref(value:string|undefined,code:string):string{const v=required(value,code);if(!/^[A-Za-z0-9][A-Za-z0-9._-]*:[^\s]+$/.test(v))throw new Error(code);return v;}
function token(value:string|undefined,code:string):string{const v=required(value,code);if(!/^[A-Z][A-Z0-9_]{0,95}$/.test(v))throw new Error(code);return v;}
function digest(value:string|undefined,code:string):string{const v=required(value,code);if(!/^[0-9a-f]{64}$/.test(v))throw new Error(code);return v;}
function refs(values:readonly string[],code:string):readonly string[]{if(!Array.isArray(values))throw new Error(code);return[...new Set(values.map(x=>ref(x,code)))].sort();}
function canonical(value:unknown):string{if(Array.isArray(value))return`[${value.map(canonical).join(",")}]`;if(value&&typeof value==="object")return`{${Object.entries(value as Record<string,unknown>).filter(([,v])=>v!==undefined).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;return JSON.stringify(value);}
async function sha(value:unknown):Promise<string>{const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(canonical(value)));return Array.from(new Uint8Array(d),b=>b.toString(16).padStart(2,"0")).join("");}
function freeze<T>(value:T):Readonly<T>{if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value as Record<string,unknown>).forEach(freeze);Object.freeze(value);}return value;}
function unique<T>(values:readonly T[],key:(value:T)=>string):T[]{const map=new Map<string,T>();for(const value of values)map.set(key(value),value);return[...map.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([,value])=>value);}

async function verifyEvidenceProfile(profile:OperationalDomainEvidenceProfileV1):Promise<void>{
  const rebuilt=await createOperationalDomainEvidenceProfileV1(profile);
  if(rebuilt.profile_id!==profile.profile_id||rebuilt.profile_digest!==profile.profile_digest||profile.declarative_only!==true||profile.grants_execution!==false)throw new Error("DOMAIN_BINDING_EVIDENCE_PROFILE_INTEGRITY_INVALID");
}

export async function createCanonicalDomainInterventionProfileV1(input:CanonicalDomainInterventionProfileInputV1):Promise<CanonicalDomainInterventionProfileV1>{
  if(input.version!==1)throw new Error("DOMAIN_BINDING_VERSION_UNSUPPORTED");
  for(const key of forbidden)if(key in (input as unknown as Record<string,unknown>))throw new Error("DOMAIN_BINDING_UNSUPPORTED_INPUT");
  await verifyEvidenceProfile(input.evidence_profile);
  const dimensions=unique(input.dimension_primitives.map(x=>({dimension_key:token(x.dimension_key,"DOMAIN_BINDING_DIMENSION_INVALID")})),x=>x.dimension_key);
  const interventions=unique(input.intervention_primitives.map(x=>({primitive_key:token(x.primitive_key,"DOMAIN_BINDING_PRIMITIVE_INVALID"),admitted_intervention_class_ref:ref(x.admitted_intervention_class_ref,"DOMAIN_BINDING_ADMITTED_CLASS_INVALID"),admitted_intervention_class_digest:digest(x.admitted_intervention_class_digest,"DOMAIN_BINDING_ADMITTED_DIGEST_INVALID"),knowledge_hypothesis_refs:refs(x.knowledge_hypothesis_refs,"DOMAIN_BINDING_KNOWLEDGE_HYPOTHESIS_INVALID"),experience_hypothesis_refs:refs(x.experience_hypothesis_refs,"DOMAIN_BINDING_EXPERIENCE_HYPOTHESIS_INVALID")})),x=>x.primitive_key);
  const constraint_family_keys=[...new Set(input.constraint_family_keys.map(x=>token(x,"DOMAIN_BINDING_CONSTRAINT_FAMILY_INVALID")))].sort();
  const evaluator_family_keys=[...new Set(input.evaluator_family_keys.map(x=>token(x,"DOMAIN_BINDING_EVALUATOR_FAMILY_INVALID")))].sort();
  if(!dimensions.length||!interventions.length||!constraint_family_keys.length||!evaluator_family_keys.length)throw new Error("DOMAIN_BINDING_PRIMITIVES_REQUIRED");
  const dimensionKeys=new Set(dimensions.map(x=>x.dimension_key)),primitiveKeys=new Set(interventions.map(x=>x.primitive_key)),constraintKeys=new Set(constraint_family_keys),evaluatorKeys=new Set(evaluator_family_keys);
  const dimension_intervention_bindings=unique(input.dimension_intervention_bindings.map(x=>({dimension_key:token(x.dimension_key,"DOMAIN_BINDING_DIMENSION_INVALID"),primitive_key:token(x.primitive_key,"DOMAIN_BINDING_PRIMITIVE_INVALID")})),x=>canonical(x));
  const intervention_constraint_bindings=unique(input.intervention_constraint_bindings.map(x=>({primitive_key:token(x.primitive_key,"DOMAIN_BINDING_PRIMITIVE_INVALID"),constraint_family_key:token(x.constraint_family_key,"DOMAIN_BINDING_CONSTRAINT_FAMILY_INVALID")})),x=>canonical(x));
  const intervention_evaluator_bindings=unique(input.intervention_evaluator_bindings.map(x=>({dimension_key:token(x.dimension_key,"DOMAIN_BINDING_DIMENSION_INVALID"),primitive_key:token(x.primitive_key,"DOMAIN_BINDING_PRIMITIVE_INVALID"),evaluator_family_key:token(x.evaluator_family_key,"DOMAIN_BINDING_EVALUATOR_FAMILY_INVALID")})),x=>canonical(x));
  if(!dimension_intervention_bindings.length||!intervention_constraint_bindings.length||!intervention_evaluator_bindings.length)throw new Error("DOMAIN_BINDING_RELATIONSHIPS_REQUIRED");
  for(const x of dimension_intervention_bindings)if(!dimensionKeys.has(x.dimension_key)||!primitiveKeys.has(x.primitive_key))throw new Error("DOMAIN_BINDING_DIMENSION_INTERVENTION_UNDECLARED");
  for(const x of intervention_constraint_bindings)if(!primitiveKeys.has(x.primitive_key)||!constraintKeys.has(x.constraint_family_key))throw new Error("DOMAIN_BINDING_CONSTRAINT_UNDECLARED");
  for(const x of intervention_evaluator_bindings)if(!dimensionKeys.has(x.dimension_key)||!primitiveKeys.has(x.primitive_key)||!evaluatorKeys.has(x.evaluator_family_key))throw new Error("DOMAIN_BINDING_EVALUATOR_UNDECLARED");
  const semantic={version:1 as const,binding_profile_ref:ref(input.binding_profile_ref,"DOMAIN_BINDING_PROFILE_REF_INVALID"),binding_profile_version:required(input.binding_profile_version,"DOMAIN_BINDING_PROFILE_VERSION_INVALID"),domain_ref:input.evidence_profile.domain_ref,domain_profile_ref:input.evidence_profile.profile_ref,domain_profile_version:input.evidence_profile.profile_version,evidence_profile_digest:input.evidence_profile.profile_digest,policy_ref:ref(input.policy_ref,"DOMAIN_BINDING_POLICY_INVALID"),dimension_primitives:dimensions,intervention_primitives:interventions,constraint_family_keys,evaluator_family_keys,dimension_intervention_bindings,intervention_constraint_bindings,intervention_evaluator_bindings,qualification_refs:refs(input.qualification_refs,"DOMAIN_BINDING_QUALIFICATION_INVALID")};
  if(!semantic.qualification_refs.length)throw new Error("DOMAIN_BINDING_QUALIFICATION_REQUIRED");
  const binding_profile_digest=await sha(semantic);
  return freeze({...semantic,binding_profile_id:`canonical-domain-intervention-profile:sha256:${binding_profile_digest}`,binding_profile_digest,digest_algorithm:"SHA-256" as const,declarative_only:true as const,establishes_current_truth:false as const,hypothesis_is_truth:false as const,establishes_changeability:false as const,establishes_admissibility:false as const,establishes_material_effect:false as const,recommended:false as const,selected:false as const,executable:false as const,grants_authority:false as const,grants_execution:false as const});
}

export async function verifyCanonicalDomainInterventionProfileV1(value:CanonicalDomainInterventionProfileV1):Promise<void>{
  const semantic={version:value.version,binding_profile_ref:value.binding_profile_ref,binding_profile_version:value.binding_profile_version,domain_ref:value.domain_ref,domain_profile_ref:value.domain_profile_ref,domain_profile_version:value.domain_profile_version,evidence_profile_digest:value.evidence_profile_digest,policy_ref:value.policy_ref,dimension_primitives:value.dimension_primitives,intervention_primitives:value.intervention_primitives,constraint_family_keys:value.constraint_family_keys,evaluator_family_keys:value.evaluator_family_keys,dimension_intervention_bindings:value.dimension_intervention_bindings,intervention_constraint_bindings:value.intervention_constraint_bindings,intervention_evaluator_bindings:value.intervention_evaluator_bindings,qualification_refs:value.qualification_refs};
  const expected=await sha(semantic);
  if(expected!==value.binding_profile_digest||value.binding_profile_id!==`canonical-domain-intervention-profile:sha256:${expected}`)throw new Error("DOMAIN_BINDING_INTEGRITY_INVALID");
  if(value.declarative_only!==true||value.establishes_current_truth!==false||value.hypothesis_is_truth!==false||value.establishes_changeability!==false||value.establishes_admissibility!==false||value.establishes_material_effect!==false||value.recommended!==false||value.selected!==false||value.executable!==false||value.grants_authority!==false||value.grants_execution!==false)throw new Error("DOMAIN_BINDING_BOUNDARY_INVALID");
}
