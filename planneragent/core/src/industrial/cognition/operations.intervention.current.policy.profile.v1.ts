import type { CanonicalDomainContextBindingV1 } from "../../cognition/canonical.domain.context.v1";
import { verifyCanonicalDomainContextBindingV1 } from "../../cognition/canonical.domain.context.v1";
import type { CanonicalDomainInterventionProfileV1 } from "../../cognition/canonical.domain.intervention.profile.v1";
import { verifyCanonicalDomainInterventionProfileV1 } from "../../cognition/canonical.domain.intervention.profile.v1";
import type { GovernedConstraintApplicabilityV1, GovernedConstraintRoleV1 } from "../../cognition/current.changeability.constraint.semantics.v1";
import { createOperationsDomainContextBindingV1, createOperationsDomainInterventionProfileV1 } from "./operations.domain.intervention.profile.v1";

export type OperationsAllocationFixationClassV1=Readonly<{fixation_class_key:string;fixation_class_ref:string;requires_effected_physical_evidence:true}>;
export type OperationsConstraintPolicyBindingV1=Readonly<{constraint_family_key:string;applicability:GovernedConstraintApplicabilityV1;constraint_role?:GovernedConstraintRoleV1}>;
export type OperationsInterventionCurrentPolicyProfileV1=Readonly<{
 version:1;policy_ref:string;policy_version:string;domain_ref:"domain:operations";domain_context_ref:string;domain_context_digest:string;
 intervention_profile_ref:string;intervention_profile_digest:string;supported_dimension_key:"ALLOCATION_RELATIONSHIP";
 intervention_primitive_key:"CHANGE_ALLOCATION_RELATIONSHIP";evaluator_family_key:"ALLOCATION_FEASIBILITY";
 changeability_boundary_policy_ref:string;changeability_boundary_policy_version:string;
 fixation_classes:readonly OperationsAllocationFixationClassV1[];non_fixation_state_keys:readonly string[];
 fixation_requires_exact_quantity_binding:true;absence_of_fixation_is_changeable_only_with_complete_coverage:true;
 release_policy_ref:string;release_policy_version:string;release_requires_explicit_governed_reversal_evidence:true;
 release_currently_supported:false;required_constraint_family_keys:readonly string[];
 constraint_bindings:readonly OperationsConstraintPolicyBindingV1[];admissibility_policy_ref:string;admissibility_policy_version:string;
 zero_hard_constraint_rule:"ADMISSIBLE_WHEN_APPLICABILITY_COMPLETE";qualification_refs:readonly string[];
 policy_profile_id:string;policy_profile_digest:string;digest_algorithm:"SHA-256";declarative_only:true;
 establishes_current_changeability:false;establishes_current_constraint_result:false;establishes_admissibility:false;
 recommended:false;selected:false;executable:false;grants_authority:false;grants_execution:false;company_specific:false;
}>;

const baseFixation:readonly OperationsAllocationFixationClassV1[]=[
 {fixation_class_key:"EFFECTED_CONSUMPTION_OR_USE",fixation_class_ref:"operations-fixation-class:effected-consumption-or-use",requires_effected_physical_evidence:true},
 {fixation_class_key:"EFFECTED_DESTINATION_SHIPMENT",fixation_class_ref:"operations-fixation-class:effected-destination-shipment",requires_effected_physical_evidence:true},
];
const constraints:readonly OperationsConstraintPolicyBindingV1[]=[
 {constraint_family_key:"COMMITMENT_BOUNDARY",applicability:"NOT_APPLICABLE"},
 {constraint_family_key:"COMPETING_DEMAND_PRIORITY",applicability:"APPLICABLE",constraint_role:"NON_BLOCKING"},
 {constraint_family_key:"ITEM_UNIT_COHERENCE",applicability:"APPLICABLE",constraint_role:"HARD"},
 {constraint_family_key:"MATERIAL_FEASIBILITY",applicability:"NOT_APPLICABLE"},
 {constraint_family_key:"QUANTITY_CONSERVATION",applicability:"APPLICABLE",constraint_role:"HARD"},
 {constraint_family_key:"TOPOLOGY_VALIDITY",applicability:"NOT_APPLICABLE"},
];
const nonFixation=["GENERIC_PRODUCTION_START","INTERNAL_SOFTWARE_LOCK","OPTIMIZER_ASSIGNMENT","PLANNED_ALLOCATION","PLANNING_FREEZE_HORIZON","RESERVATION","SCENARIO_MUTATION","SOFTWARE_CAPABILITY_STATE"] as const;
function required(v:string|undefined,c:string){const n=v?.trim();if(!n)throw new Error(c);return n;}
function ref(v:string|undefined,c:string){const n=required(v,c);if(!/^[A-Za-z0-9][A-Za-z0-9._-]*:[^\s]+$/.test(n))throw new Error(c);return n;}
function token(v:string|undefined,c:string){const n=required(v,c);if(!/^[A-Z][A-Z0-9_]{0,95}$/.test(n))throw new Error(c);return n;}
function refs(v:readonly string[],c:string){if(!Array.isArray(v))throw new Error(c);const n=[...new Set(v.map(x=>ref(x,c)))].sort();if(!n.length)throw new Error(c);return n;}
function canonical(v:unknown):string{if(Array.isArray(v))return`[${v.map(canonical).join(",")}]`;if(v&&typeof v==="object")return`{${Object.entries(v as Record<string,unknown>).filter(([,x])=>x!==undefined).sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>`${JSON.stringify(k)}:${canonical(x)}`).join(",")}}`;return JSON.stringify(v);}
async function sha(v:unknown){const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(canonical(v)));return Array.from(new Uint8Array(d),b=>b.toString(16).padStart(2,"0")).join("");}
function freeze<T>(v:T):Readonly<T>{if(v&&typeof v==="object"&&!Object.isFrozen(v)){Object.values(v as Record<string,unknown>).forEach(freeze);Object.freeze(v);}return v;}
function semantic(v:OperationsInterventionCurrentPolicyProfileV1){const {policy_profile_id:_id,policy_profile_digest:_digest,digest_algorithm:_algorithm,declarative_only:_declarative,establishes_current_changeability:_changeability,establishes_current_constraint_result:_constraint,establishes_admissibility:_admissibility,recommended:_recommended,selected:_selected,executable:_executable,grants_authority:_authority,grants_execution:_execution,company_specific:_company,...value}=v;return value;}

export async function createOperationsInterventionCurrentPolicyProfileV1(input:Readonly<{version:1;domain_context:CanonicalDomainContextBindingV1;intervention_profile:CanonicalDomainInterventionProfileV1;policy_version:string;additional_fixation_classes?:readonly Readonly<{fixation_class_key:string;fixation_class_ref:string}>[]}>) :Promise<OperationsInterventionCurrentPolicyProfileV1>{
 if(input.version!==1)throw new Error("OPS_CURRENT_POLICY_VERSION_UNSUPPORTED");await Promise.all([verifyCanonicalDomainContextBindingV1(input.domain_context),verifyCanonicalDomainInterventionProfileV1(input.intervention_profile)]);const [context,profile]=await Promise.all([createOperationsDomainContextBindingV1(),createOperationsDomainInterventionProfileV1()]);if(input.domain_context.domain_context_id!==context.domain_context_id||input.intervention_profile.binding_profile_id!==profile.binding_profile_id||input.domain_context.intervention_profile_id!==input.intervention_profile.binding_profile_id)throw new Error("OPS_CURRENT_POLICY_CONTEXT_PROFILE_MISMATCH");
 const extras=(input.additional_fixation_classes??[]).map(x=>({fixation_class_key:token(x.fixation_class_key,"OPS_CURRENT_POLICY_FIXATION_CLASS_INVALID"),fixation_class_ref:ref(x.fixation_class_ref,"OPS_CURRENT_POLICY_FIXATION_CLASS_INVALID"),requires_effected_physical_evidence:true as const}));const fixationMap=new Map([...baseFixation,...extras].map(x=>[x.fixation_class_key,x]));if(fixationMap.size!==baseFixation.length+extras.length)throw new Error("OPS_CURRENT_POLICY_FIXATION_CLASS_DUPLICATE");const fixation_classes=[...fixationMap.values()].sort((a,b)=>a.fixation_class_key.localeCompare(b.fixation_class_key));const required_constraint_family_keys=constraints.map(x=>x.constraint_family_key).sort();if(required_constraint_family_keys.some(x=>!profile.constraint_family_keys.includes(x)))throw new Error("OPS_CURRENT_POLICY_CONSTRAINT_PROFILE_MISMATCH");
 const policy_version=required(input.policy_version,"OPS_CURRENT_POLICY_VERSION_REQUIRED"),value={version:1 as const,policy_ref:"policy:operations-allocation-current-v1",policy_version,domain_ref:"domain:operations" as const,domain_context_ref:context.domain_context_id,domain_context_digest:context.domain_context_digest,intervention_profile_ref:profile.binding_profile_id,intervention_profile_digest:profile.binding_profile_digest,supported_dimension_key:"ALLOCATION_RELATIONSHIP" as const,intervention_primitive_key:"CHANGE_ALLOCATION_RELATIONSHIP" as const,evaluator_family_key:"ALLOCATION_FEASIBILITY" as const,changeability_boundary_policy_ref:"policy:operations-allocation-effective-fixation-v1",changeability_boundary_policy_version:policy_version,fixation_classes,non_fixation_state_keys:[...nonFixation].sort(),fixation_requires_exact_quantity_binding:true as const,absence_of_fixation_is_changeable_only_with_complete_coverage:true as const,release_policy_ref:"policy:operations-allocation-governed-reversal-v1",release_policy_version:policy_version,release_requires_explicit_governed_reversal_evidence:true as const,release_currently_supported:false as const,required_constraint_family_keys,constraint_bindings:[...constraints].sort((a,b)=>a.constraint_family_key.localeCompare(b.constraint_family_key)),admissibility_policy_ref:"policy:operations-allocation-admissibility-v1",admissibility_policy_version:policy_version,zero_hard_constraint_rule:"ADMISSIBLE_WHEN_APPLICABILITY_COMPLETE" as const,qualification_refs:refs(["qualification:founder-approved-operations-allocation-policy-v1"],"OPS_CURRENT_POLICY_QUALIFICATION_REQUIRED")};const policy_profile_digest=await sha(value);return freeze({...value,policy_profile_id:`operations-intervention-current-policy:sha256:${policy_profile_digest}`,policy_profile_digest,digest_algorithm:"SHA-256" as const,declarative_only:true as const,establishes_current_changeability:false as const,establishes_current_constraint_result:false as const,establishes_admissibility:false as const,recommended:false as const,selected:false as const,executable:false as const,grants_authority:false as const,grants_execution:false as const,company_specific:false as const});
}

export async function verifyOperationsInterventionCurrentPolicyProfileV1(v:OperationsInterventionCurrentPolicyProfileV1){const d=await sha(semantic(v));if(v.policy_profile_digest!==d||v.policy_profile_id!==`operations-intervention-current-policy:sha256:${d}`)throw new Error("OPS_CURRENT_POLICY_INTEGRITY_INVALID");if(v.digest_algorithm!=="SHA-256"||v.declarative_only!==true||v.establishes_current_changeability!==false||v.establishes_current_constraint_result!==false||v.establishes_admissibility!==false||v.recommended!==false||v.selected!==false||v.executable!==false||v.grants_authority!==false||v.grants_execution!==false||v.company_specific!==false)throw new Error("OPS_CURRENT_POLICY_BOUNDARY_INVALID");}

export function resolveOperationsAllocationConstraintPolicyV1(profile:OperationsInterventionCurrentPolicyProfileV1,family:string):OperationsConstraintPolicyBindingV1{const found=profile.constraint_bindings.find(x=>x.constraint_family_key===family);if(!found)throw new Error("OPS_CURRENT_POLICY_CONSTRAINT_UNSUPPORTED");return found;}
export function resolveOperationsAllocationBoundaryPolicyV1(profile:OperationsInterventionCurrentPolicyProfileV1,dimension:string){if(dimension!==profile.supported_dimension_key)throw new Error("OPS_CURRENT_POLICY_DIMENSION_UNSUPPORTED");return freeze({boundary_policy_ref:profile.changeability_boundary_policy_ref,boundary_policy_version:profile.changeability_boundary_policy_version,fixation_classes:profile.fixation_classes,release_policy_ref:profile.release_policy_ref,release_policy_version:profile.release_policy_version,release_currently_supported:profile.release_currently_supported});}
