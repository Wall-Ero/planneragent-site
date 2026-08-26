import { createProtectedOperationalObjectiveBindingV1, type ProtectedOperationalObjectiveBindingV1 } from "../cognition/protected.operational.objective.v1";
import { verifyOperationsBaselineCommitmentFeasibilityV1, type OperationsBaselineCommitmentFeasibilityV1 } from "../industrial/cognition/operations.baseline.commitment.feasibility.v1";
import { verifyOperationsObjectiveStateAssessmentV1, type OperationsObjectiveStateAssessmentV1 } from "../industrial/cognition/operations.objective.state.v1";
import { verifyGovernedPlanRealityElementComparisonV1, type GovernedPlanRealityElementComparisonV1 } from "./plan.reality.comparison.doctrine.v1";

export type GovernedPlanRealityMaterialityDispositionV1=
  |"ELEMENT_ALIGNED_SUPPORT"
  |"MATERIAL_INCOMPATIBILITY_ESTABLISHED"
  |"RECOVERABLE_PLAN_DEVIATION_ESTABLISHED"
  |"DEVIATION_RECOVERABILITY_UNRESOLVED"
  |"NOT_ASSERTABLE";

export type GovernedPlanRealityMaterialityReasonV1=
  |"ELEMENT_TARGET_EXACTLY_SATISFIED"
  |"PROTECTED_OBJECTIVE_BREACHED"
  |"AFFIRMATIVE_BASELINE_COMMITMENT_FEASIBILITY"
  |"DRIFTING_RECOVERABILITY_POLICY_REQUIRED"
  |"OBJECTIVE_STATE_CONFLICT"
  |"OBJECTIVE_STATE_UNRESOLVED"
  |"ELEMENT_COMPARISON_NOT_ASSERTABLE";

export type GovernedPlanRealityElementMaterialityV1=Readonly<{
  version:1;
  policy_ref:"policy:governed-plan-reality-element-materiality-v1";
  comparison_ref:string;
  comparison_digest:string;
  applicable_plan_context_ref:string;
  plan_element_ref:string;
  protected_objective_ref?:string;
  protected_objective_digest?:string;
  objective_assessment_ref?:string;
  objective_assessment_digest?:string;
  baseline_feasibility_ref?:string;
  baseline_feasibility_digest?:string;
  request_id:string;
  company_id:string;
  scope_id:string;
  scope_digest:string;
  evidence_as_of:string;
  disposition:GovernedPlanRealityMaterialityDispositionV1;
  reason_codes:readonly GovernedPlanRealityMaterialityReasonV1[];
  supports_element_alignment:boolean;
  supports_element_drifting:boolean;
  supports_element_misalignment:boolean;
  scope_aggregation_performed:false;
  source_count_independent:true;
  decision_pressure_independent:true;
  intrinsic_reality_state_independent:true;
  evidence_refs:readonly string[];
  qualification_refs:readonly string[];
  provenance_refs:readonly string[];
  causal_lineage_refs:readonly string[];
  materiality_id:string;
  materiality_digest:string;
  digest_algorithm:"SHA-256";
  observational_only:true;
  recommended:false;
  executable:false;
  grants_authority:false;
  grants_execution:false;
}>;

function canonical(value:unknown):string{if(Array.isArray(value))return`[${value.map(canonical).join(",")}]`;if(value&&typeof value==="object")return`{${Object.entries(value as Record<string,unknown>).filter(([,member])=>member!==undefined).sort(([left],[right])=>left.localeCompare(right)).map(([key,member])=>`${JSON.stringify(key)}:${canonical(member)}`).join(",")}}`;return JSON.stringify(value)}
async function sha(value:unknown):Promise<string>{const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(canonical(value)));return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,"0")).join("")}
function freeze<T>(value:T):Readonly<T>{if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value as Record<string,unknown>).forEach(freeze);Object.freeze(value)}return value}
function refs(values:readonly string[]):readonly string[]{return Object.freeze([...new Set(values.map(value=>value.trim()).filter(Boolean))].sort())}

export async function applyGovernedPlanRealityMaterialityPolicyV1(input:Readonly<{
  version:1;
  comparison:GovernedPlanRealityElementComparisonV1;
  protected_objective?:ProtectedOperationalObjectiveBindingV1;
  objective_assessment?:OperationsObjectiveStateAssessmentV1;
  baseline_feasibility?:OperationsBaselineCommitmentFeasibilityV1;
}>):Promise<GovernedPlanRealityElementMaterialityV1>{
  if(input.version!==1)throw new Error("PLAN_REALITY_MATERIALITY_VERSION_UNSUPPORTED");
  const comparison=input.comparison;await verifyGovernedPlanRealityElementComparisonV1(comparison);
  const objective=input.protected_objective,assessment=input.objective_assessment,feasibility=input.baseline_feasibility;
  if(Boolean(objective)!==Boolean(assessment))throw new Error("PLAN_REALITY_OBJECTIVE_EVIDENCE_PAIR_REQUIRED");
  if(feasibility&&(!objective||!assessment))throw new Error("PLAN_REALITY_RECOVERABILITY_CHAIN_REQUIRED");
  if(objective&&assessment){
    const rebuilt=await createProtectedOperationalObjectiveBindingV1(objective);await verifyOperationsObjectiveStateAssessmentV1(assessment);
    if(rebuilt.objective_binding_id!==objective.objective_binding_id||rebuilt.objective_binding_digest!==objective.objective_binding_digest)throw new Error("PLAN_REALITY_OBJECTIVE_INTEGRITY_INVALID");
    if(!objective.governing_plan_element_refs.includes(comparison.plan_element_ref)||objective.objective_ref!==assessment.protected_objective_ref||objective.request_id!==comparison.request_id||objective.company_id!==comparison.company_id||objective.scope_id!==comparison.scope_id||objective.scope_digest!==comparison.scope_digest||objective.evidence_as_of!==comparison.evidence_as_of||assessment.request_id!==comparison.request_id||assessment.company_id!==comparison.company_id||assessment.scope_id!==comparison.scope_id||assessment.scope_digest!==comparison.scope_digest||assessment.evidence_as_of!==comparison.evidence_as_of)throw new Error("PLAN_REALITY_OBJECTIVE_CONTEXT_MISMATCH");
  }
  if(feasibility&&objective&&assessment){await verifyOperationsBaselineCommitmentFeasibilityV1(feasibility);if(feasibility.feasibility_id!==assessment.feasibility_ref||feasibility.feasibility_digest!==assessment.feasibility_digest||feasibility.protected_objective_ref!==objective.objective_ref||feasibility.protected_objective_digest!==assessment.protected_objective_digest||feasibility.request_id!==comparison.request_id||feasibility.company_id!==comparison.company_id||feasibility.scope_id!==comparison.scope_id||feasibility.scope_digest!==comparison.scope_digest||feasibility.evidence_as_of!==comparison.evidence_as_of)throw new Error("PLAN_REALITY_RECOVERABILITY_CONTEXT_MISMATCH")}
  let disposition:GovernedPlanRealityMaterialityDispositionV1="NOT_ASSERTABLE",reason_codes:GovernedPlanRealityMaterialityReasonV1[]=["ELEMENT_COMPARISON_NOT_ASSERTABLE"],supports_element_alignment=false,supports_element_drifting=false,supports_element_misalignment=false;
  if(comparison.comparison_status==="ASSERTABLE"&&comparison.disposition==="EXACT_TARGET_SATISFIED"&&assessment?.assessment_status==="ASSESSED"&&assessment.objective_state==="BREACHED"){
    disposition="NOT_ASSERTABLE";reason_codes=["OBJECTIVE_STATE_CONFLICT"];
  }else if(comparison.comparison_status==="ASSERTABLE"&&comparison.disposition==="EXACT_TARGET_SATISFIED"){
    disposition="ELEMENT_ALIGNED_SUPPORT";reason_codes=["ELEMENT_TARGET_EXACTLY_SATISFIED"];supports_element_alignment=true;
  }else if(comparison.disposition==="DEVIATION_ESTABLISHED_MATERIALITY_UNRESOLVED"){
    if(assessment?.assessment_status==="ASSESSED"&&assessment.objective_state==="BREACHED"){
      disposition="MATERIAL_INCOMPATIBILITY_ESTABLISHED";reason_codes=["PROTECTED_OBJECTIVE_BREACHED"];supports_element_misalignment=true;
    }else if(assessment?.assessment_status==="ASSESSED"&&assessment.objective_state==="PRESERVED"){
      if(feasibility?.evidence_boundary==="COMPLETE"&&feasibility.result==="FULFILLABLE_BY_COMMITMENT"){disposition="RECOVERABLE_PLAN_DEVIATION_ESTABLISHED";reason_codes=["AFFIRMATIVE_BASELINE_COMMITMENT_FEASIBILITY"];supports_element_drifting=true}
      else{disposition="DEVIATION_RECOVERABILITY_UNRESOLVED";reason_codes=["DRIFTING_RECOVERABILITY_POLICY_REQUIRED"]}
    }else{disposition="NOT_ASSERTABLE";reason_codes=["OBJECTIVE_STATE_UNRESOLVED"]}
  }
  const evidence_refs=refs([...comparison.evidence_refs,...(assessment?.evidence_refs??[]),...(feasibility?.evidence_refs??[])]),qualification_refs=refs([...comparison.qualification_refs,...(assessment?.qualification_refs??[]),...(feasibility?.qualification_refs??[])]),provenance_refs=refs([...comparison.provenance_refs,...(assessment?.provenance_refs??[]),...(feasibility?.provenance_refs??[])]),causal_lineage_refs=refs([...comparison.causal_lineage_refs,...(assessment?.causal_lineage_refs??[]),...(feasibility?.causal_lineage_refs??[]),comparison.comparison_id,...(objective?[objective.objective_binding_id]:[]),...(assessment?[assessment.assessment_id]:[]),...(feasibility?[feasibility.feasibility_id]:[])]);
  const semantic={version:1 as const,policy_ref:"policy:governed-plan-reality-element-materiality-v1"as const,comparison_ref:comparison.comparison_id,comparison_digest:comparison.comparison_digest,applicable_plan_context_ref:comparison.applicable_plan_context_ref,plan_element_ref:comparison.plan_element_ref,...(objective?{protected_objective_ref:objective.objective_binding_id,protected_objective_digest:objective.objective_binding_digest}:{}),...(assessment?{objective_assessment_ref:assessment.assessment_id,objective_assessment_digest:assessment.assessment_digest}:{}),...(feasibility?{baseline_feasibility_ref:feasibility.feasibility_id,baseline_feasibility_digest:feasibility.feasibility_digest}:{}),request_id:comparison.request_id,company_id:comparison.company_id,scope_id:comparison.scope_id,scope_digest:comparison.scope_digest,evidence_as_of:comparison.evidence_as_of,disposition,reason_codes:Object.freeze(reason_codes),supports_element_alignment,supports_element_drifting,supports_element_misalignment,scope_aggregation_performed:false as const,source_count_independent:true as const,decision_pressure_independent:true as const,intrinsic_reality_state_independent:true as const,evidence_refs,qualification_refs,provenance_refs,causal_lineage_refs};
  const materiality_digest=await sha(semantic);return freeze({...semantic,materiality_id:`governed-plan-reality-element-materiality:sha256:${materiality_digest}`,materiality_digest,digest_algorithm:"SHA-256"as const,observational_only:true as const,recommended:false as const,executable:false as const,grants_authority:false as const,grants_execution:false as const});
}

export async function verifyGovernedPlanRealityElementMaterialityV1(value:GovernedPlanRealityElementMaterialityV1):Promise<void>{
 const{materiality_id,materiality_digest,digest_algorithm,observational_only,recommended,executable,grants_authority,grants_execution,...semantic}=value,expected=await sha(semantic);if(materiality_id!==`governed-plan-reality-element-materiality:sha256:${expected}`||materiality_digest!==expected||digest_algorithm!=="SHA-256"||observational_only!==true||recommended!==false||executable!==false||grants_authority!==false||grants_execution!==false||value.scope_aggregation_performed!==false||value.source_count_independent!==true||value.decision_pressure_independent!==true||value.intrinsic_reality_state_independent!==true)throw new Error("PLAN_REALITY_MATERIALITY_INTEGRITY_INVALID")
}
