import { verifyOperationsBaselineCommitmentFeasibilityV1, type OperationsBaselineCommitmentFeasibilityV1 } from "./operations.baseline.commitment.feasibility.v1";
import type { OperationsOrderDeliveryCommitmentV1, OperationsProtectedObjectiveStateV1 } from "./operations.protected.objective.v1";

export type OperationsObjectiveStateAssessmentV1 = Readonly<{
  version: 1;
  assessment_id: string;
  assessment_digest: string;
  digest_algorithm: "SHA-256";
  assessment_perspective: "CURRENT_EXPECTED";
  assessment_status: "ASSESSED" | "UNRESOLVED";
  objective_state?: Extract<OperationsProtectedObjectiveStateV1,"PRESERVED"|"BREACHED">;
  protected_objective_ref: string;
  protected_objective_digest: string;
  feasibility_ref: string;
  feasibility_digest: string;
  order_fact_ref: string;
  order_version_ref: string;
  item_ref: string;
  request_id: string;
  company_id: string;
  scope_id: string;
  scope_digest: string;
  evidence_selection_ref: string;
  evidence_as_of: string;
  evaluated_at: string;
  evidence_refs: readonly string[];
  qualification_refs: readonly string[];
  provenance_refs: readonly string[];
  causal_lineage_refs: readonly string[];
  observational_only: true;
  grants_execution: false;
  grants_authority: false;
  grants_remediation: false;
  company_global_claim: false;
}>;

function canonical(value:unknown):string{if(Array.isArray(value))return`[${value.map(canonical).join(",")}]`;if(value&&typeof value==="object")return`{${Object.entries(value as Record<string,unknown>).filter(([,v])=>v!==undefined).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;return JSON.stringify(value);}
async function sha(value:unknown):Promise<string>{const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(canonical(value)));return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,"0")).join("");}
function freeze<T>(value:T):Readonly<T>{if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value as Record<string,unknown>).forEach(freeze);Object.freeze(value);}return value;}

export async function assessOperationsObjectiveStateV1(input:Readonly<{
  version:1;
  assessment_perspective:"CURRENT_EXPECTED";
  commitment:OperationsOrderDeliveryCommitmentV1;
  feasibility:OperationsBaselineCommitmentFeasibilityV1;
}>):Promise<OperationsObjectiveStateAssessmentV1>{
  if(input.version!==1)throw new Error("OPS_OBJECTIVE_STATE_VERSION_UNSUPPORTED");
  if(input.assessment_perspective!=="CURRENT_EXPECTED")throw new Error("OPS_OBJECTIVE_STATE_PERSPECTIVE_UNSUPPORTED");
  const c=input.commitment,f=input.feasibility,b=c.objective_binding,s=b.evaluation_scope.scope;
  await verifyOperationsBaselineCommitmentFeasibilityV1(f);
  if(c.kind!=="ORDER_DELIVERY_COMMITMENT"||c.commitment_status!=="OPEN")throw new Error("OPS_OBJECTIVE_STATE_OBJECTIVE_INVALID");
  if(f.baseline_semantics!=="BASELINE_CURRENT_PLAN")throw new Error("OPS_OBJECTIVE_STATE_CANDIDATE_REJECTED");
  if(f.protected_objective_ref!==c.commitment_id||f.protected_objective_digest!==c.commitment_digest)throw new Error("OPS_OBJECTIVE_STATE_OBJECTIVE_MISMATCH");
  if(f.order_fact_ref!==c.order_fact_ref)throw new Error("OPS_OBJECTIVE_STATE_ORDER_MISMATCH");
  if(f.order_version_ref!==c.order_version_ref)throw new Error("OPS_OBJECTIVE_STATE_VERSION_MISMATCH");
  if(f.item_ref!==c.item_ref)throw new Error("OPS_OBJECTIVE_STATE_ITEM_MISMATCH");
  if(f.committed_quantity.value!==c.committed_quantity.value||f.committed_quantity.unit_ref!==c.committed_quantity.unit_ref||f.commitment_boundary!==c.committed_due_at)throw new Error("OPS_OBJECTIVE_STATE_COMMITMENT_MISMATCH");
  if(f.request_id!==b.request_id||f.company_id!==b.company_id)throw new Error("OPS_OBJECTIVE_STATE_REQUEST_COMPANY_MISMATCH");
  if(f.scope_id!==b.scope_id||f.scope_digest!==b.scope_digest||s.scope_type!=="ENTITY"||s.entity?.entity_type!=="ORDER")throw new Error("OPS_OBJECTIVE_STATE_SCOPE_MISMATCH");
  if(f.evidence_selection_ref!==s.evidence_selection_ref)throw new Error("OPS_OBJECTIVE_STATE_EVIDENCE_SELECTION_MISMATCH");
  if(f.evidence_as_of!==b.evidence_as_of||f.evaluated_at!==b.evaluated_at)throw new Error("OPS_OBJECTIVE_STATE_TIME_MISMATCH");
  const assessed=f.result!=="UNRESOLVED";
  const objective_state= f.result==="FULFILLABLE_BY_COMMITMENT"?"PRESERVED" as const:f.result==="NOT_FULFILLABLE_BY_COMMITMENT"?"BREACHED" as const:undefined;
  const semantic={version:1 as const,assessment_perspective:"CURRENT_EXPECTED" as const,assessment_status:assessed?"ASSESSED" as const:"UNRESOLVED" as const,...(objective_state?{objective_state}:{}),protected_objective_ref:c.commitment_id,protected_objective_digest:c.commitment_digest,feasibility_ref:f.feasibility_id,feasibility_digest:f.feasibility_digest,order_fact_ref:c.order_fact_ref,order_version_ref:c.order_version_ref,item_ref:c.item_ref,request_id:b.request_id,company_id:b.company_id,scope_id:b.scope_id,scope_digest:b.scope_digest,evidence_selection_ref:f.evidence_selection_ref,evidence_as_of:f.evidence_as_of,evaluated_at:f.evaluated_at,evidence_refs:f.evidence_refs,qualification_refs:f.qualification_refs,provenance_refs:f.provenance_refs,causal_lineage_refs:Object.freeze([...new Set([...f.causal_lineage_refs,c.commitment_id,f.feasibility_id])].sort())};
  const assessment_digest=await sha(semantic);
  return freeze({...semantic,assessment_id:`operations-objective-state-assessment:sha256:${assessment_digest}`,assessment_digest,digest_algorithm:"SHA-256" as const,observational_only:true as const,grants_execution:false as const,grants_authority:false as const,grants_remediation:false as const,company_global_claim:false as const}) as OperationsObjectiveStateAssessmentV1;
}

export async function verifyOperationsObjectiveStateAssessmentV1(value:OperationsObjectiveStateAssessmentV1):Promise<void>{
  const semantic={version:value.version,assessment_perspective:value.assessment_perspective,assessment_status:value.assessment_status,...(value.objective_state?{objective_state:value.objective_state}:{}),protected_objective_ref:value.protected_objective_ref,protected_objective_digest:value.protected_objective_digest,feasibility_ref:value.feasibility_ref,feasibility_digest:value.feasibility_digest,order_fact_ref:value.order_fact_ref,order_version_ref:value.order_version_ref,item_ref:value.item_ref,request_id:value.request_id,company_id:value.company_id,scope_id:value.scope_id,scope_digest:value.scope_digest,evidence_selection_ref:value.evidence_selection_ref,evidence_as_of:value.evidence_as_of,evaluated_at:value.evaluated_at,evidence_refs:value.evidence_refs,qualification_refs:value.qualification_refs,provenance_refs:value.provenance_refs,causal_lineage_refs:value.causal_lineage_refs};
  const expected=await sha(semantic);
  if(value.assessment_digest!==expected||value.assessment_id!==`operations-objective-state-assessment:sha256:${expected}`||value.digest_algorithm!=="SHA-256"||value.observational_only!==true||value.grants_execution!==false||value.grants_authority!==false||value.grants_remediation!==false||value.company_global_claim!==false)throw new Error("OPS_OBJECTIVE_STATE_INTEGRITY_INVALID");
}
