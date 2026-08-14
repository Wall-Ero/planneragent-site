import { createCanonicalDecisionMarginV1, type CanonicalDecisionMarginV1 } from "../../decision/canonical.decision.margin.v1";
import type { OperationsCurrentFulfillmentPositionV1 } from "./operations.current.fulfillment.position.v1";
import type { OperationsOrderDeliveryCommitmentV1 } from "./operations.protected.objective.v1";

export const OPERATIONS_DECISION_MARGIN_DIMENSION_TIME = "dimension:time" as const;
export const OPERATIONS_DECISION_MARGIN_DURATION_UNIT = "duration:milliseconds" as const;
export const OPERATIONS_DECISION_MARGIN_PRODUCER = "producer:operations-decision-margin-v1" as const;
export const OPERATIONS_DECISION_MARGIN_POLICY = "policy:order-delivery-commitment-due-boundary-v1" as const;

function canonical(value:unknown):string{if(Array.isArray(value))return`[${value.map(canonical).join(",")}]`;if(value&&typeof value==="object")return`{${Object.entries(value as Record<string,unknown>).filter(([,v])=>v!==undefined).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;return JSON.stringify(value);}
async function sha(value:unknown):Promise<string>{const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(canonical(value)));return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,"0")).join("");}
function refs(values:readonly string[],code:string):readonly string[]{const out=[...new Set(values.map(x=>x.trim()).filter(Boolean))].sort();if(!out.length)throw new Error(code);return out;}
function instant(value:string,code:string):number{const n=Date.parse(value);if(!Number.isFinite(n))throw new Error(code);return n;}

async function verifyCommitment(c:OperationsOrderDeliveryCommitmentV1):Promise<void>{
  const semantic={version:1 as const,kind:c.kind,order_fact_ref:c.order_fact_ref,order_version_ref:c.order_version_ref,item_ref:c.item_ref,committed_quantity:c.committed_quantity,committed_due_at:c.committed_due_at,commitment_status:c.commitment_status};
  const digest=await sha(semantic);
  if(digest!==c.commitment_digest||c.commitment_id!==`operations-order-delivery-commitment:sha256:${digest}`)throw new Error("OPS_MARGIN_OBJECTIVE_INTEGRITY_INVALID");
}

async function verifyPosition(p:OperationsCurrentFulfillmentPositionV1):Promise<void>{
  const semantic={version:p.version,position_kind:p.position_kind,status:p.status,...(p.current_position_at?{current_position_at:p.current_position_at}:{}),temporal_unit_ref:p.temporal_unit_ref,protected_objective_ref:p.protected_objective_ref,protected_objective_digest:p.protected_objective_digest,objective_binding_ref:p.objective_binding_ref,objective_binding_digest:p.objective_binding_digest,baseline_feasibility_ref:p.baseline_feasibility_ref,baseline_feasibility_digest:p.baseline_feasibility_digest,order_fact_ref:p.order_fact_ref,order_version_ref:p.order_version_ref,item_ref:p.item_ref,committed_quantity:p.committed_quantity,request_id:p.request_id,company_id:p.company_id,scope_id:p.scope_id,scope_digest:p.scope_digest,evidence_selection_ref:p.evidence_selection_ref,evidence_refs:p.evidence_refs,qualification_refs:p.qualification_refs,provenance_refs:p.provenance_refs,causal_lineage_refs:p.causal_lineage_refs,evidence_as_of:p.evidence_as_of,evaluated_at:p.evaluated_at,epistemic_basis:p.epistemic_basis};
  const digest=await sha(semantic);
  if(digest!==p.position_digest||p.position_id!==`operations-current-fulfillment-position:sha256:${digest}`)throw new Error("OPS_MARGIN_POSITION_INTEGRITY_INVALID");
  if(p.digest_algorithm!=="SHA-256"||p.observational_only!==true||p.grants_authority!==false||p.grants_execution!==false||p.grants_remediation!==false||p.company_global_claim!==false)throw new Error("OPS_MARGIN_POSITION_BOUNDARY_INVALID");
}

export async function deriveOperationsDecisionMarginV1(input:Readonly<{
  version:1;
  commitment:OperationsOrderDeliveryCommitmentV1;
  current_position:OperationsCurrentFulfillmentPositionV1;
  governing_condition_ref:string;
  material_compromise_refs:readonly string[];
  authority_tier_ref?:never;
  corrective_action_refs?:readonly string[];
  scenario_modification_refs?:readonly string[];
  epistemic_basis?:"DETERMINISTIC";
}>):Promise<CanonicalDecisionMarginV1>{
  if(input.version!==1)throw new Error("OPS_MARGIN_VERSION_UNSUPPORTED");
  if(input.corrective_action_refs?.length)throw new Error("OPS_MARGIN_CORRECTIVE_CANDIDATE_REJECTED");
  if(input.scenario_modification_refs?.length)throw new Error("OPS_MARGIN_SCENARIO_REJECTED");
  if((input as {authority_tier_ref?:unknown}).authority_tier_ref!==undefined)throw new Error("OPS_MARGIN_TIER_INPUT_REJECTED");
  if(input.epistemic_basis!==undefined&&input.epistemic_basis!=="DETERMINISTIC")throw new Error("OPS_MARGIN_EPISTEMIC_BASIS_UNSUPPORTED");
  const c=input.commitment,p=input.current_position,b=c.objective_binding,s=b.evaluation_scope.scope;
  await verifyCommitment(c);await verifyPosition(p);
  if(c.kind!=="ORDER_DELIVERY_COMMITMENT"||c.commitment_status!=="OPEN")throw new Error("OPS_MARGIN_OBJECTIVE_UNSUPPORTED");
  if(p.position_kind!=="CURRENT_PLAN_FULFILLMENT_RELEVANT_AVAILABILITY"||p.temporal_unit_ref!=="time:INSTANT")throw new Error("OPS_MARGIN_POSITION_KIND_UNSUPPORTED");
  if(s.scope_type!=="ENTITY"||s.entity?.entity_type!=="ORDER"||s.entity.entity_ref!==c.order_fact_ref)throw new Error("OPS_MARGIN_SCOPE_UNSUPPORTED");
  if(p.protected_objective_ref!==c.commitment_id||p.protected_objective_digest!==c.commitment_digest||p.objective_binding_ref!==b.objective_binding_id||p.objective_binding_digest!==b.objective_binding_digest)throw new Error("OPS_MARGIN_OBJECTIVE_POSITION_MISMATCH");
  if(p.order_fact_ref!==c.order_fact_ref)throw new Error("OPS_MARGIN_ORDER_MISMATCH");
  if(p.order_version_ref!==c.order_version_ref)throw new Error("OPS_MARGIN_ORDER_VERSION_MISMATCH");
  if(p.item_ref!==c.item_ref)throw new Error("OPS_MARGIN_ITEM_MISMATCH");
  if(p.committed_quantity.value!==c.committed_quantity.value||p.committed_quantity.unit_ref!==c.committed_quantity.unit_ref)throw new Error("OPS_MARGIN_QUANTITY_UNIT_MISMATCH");
  if(p.request_id!==b.request_id||p.company_id!==b.company_id)throw new Error("OPS_MARGIN_REQUEST_COMPANY_MISMATCH");
  if(p.scope_id!==b.scope_id||p.scope_digest!==b.scope_digest)throw new Error("OPS_MARGIN_SCOPE_MISMATCH");
  if(p.evidence_selection_ref!==s.evidence_selection_ref)throw new Error("OPS_MARGIN_EVIDENCE_SELECTION_MISMATCH");
  if(p.evidence_as_of!==b.evidence_as_of||p.evaluated_at!==b.evaluated_at)throw new Error("OPS_MARGIN_TIMESTAMP_MISMATCH");
  if(p.epistemic_basis!=="DETERMINISTIC")throw new Error("OPS_MARGIN_EPISTEMIC_BASIS_UNSUPPORTED");
  refs(p.evidence_refs,"OPS_MARGIN_EVIDENCE_REQUIRED");refs(p.qualification_refs,"OPS_MARGIN_QUALIFICATION_REQUIRED");refs(p.provenance_refs,"OPS_MARGIN_PROVENANCE_REQUIRED");refs(p.causal_lineage_refs,"OPS_MARGIN_LINEAGE_REQUIRED");
  const boundary=instant(c.committed_due_at,"OPS_MARGIN_BOUNDARY_TIME_INVALID");
  let status:"AVAILABLE"|"BOUNDARY_REACHED"|"BOUNDARY_EXCEEDED"|"UNRESOLVED"|"INSUFFICIENT_EVIDENCE";
  let remaining_margin:{value:number;unit_ref:typeof OPERATIONS_DECISION_MARGIN_DURATION_UNIT;measurement_ref:string}|undefined;
  if(p.status==="UNRESOLVED")status="UNRESOLVED";
  else if(p.status==="INSUFFICIENT_EVIDENCE")status="INSUFFICIENT_EVIDENCE";
  else{
    if(!p.current_position_at)throw new Error("OPS_MARGIN_POSITION_TIME_REQUIRED");
    const position=instant(p.current_position_at,"OPS_MARGIN_POSITION_TIME_INVALID"),difference=boundary-position;
    status=difference>0?"AVAILABLE":difference===0?"BOUNDARY_REACHED":"BOUNDARY_EXCEEDED";
    if(difference>=0)remaining_margin={value:difference,unit_ref:OPERATIONS_DECISION_MARGIN_DURATION_UNIT,measurement_ref:`measurement:${p.position_id}`};
  }
  return createCanonicalDecisionMarginV1({version:1,request_id:b.request_id,company_id:b.company_id,evaluation_scope:b.evaluation_scope,protected_objective:b,governing_condition_ref:input.governing_condition_ref,governing_dimension_ref:OPERATIONS_DECISION_MARGIN_DIMENSION_TIME,current_position_ref:p.position_id,compromise_boundary_ref:`boundary:${c.commitment_id}`,material_compromise_refs:refs(input.material_compromise_refs,"OPS_MARGIN_MATERIAL_COMPROMISE_REQUIRED"),status,...(remaining_margin?{remaining_margin}:{}),epistemic_basis:"DETERMINISTIC",producer_ref:OPERATIONS_DECISION_MARGIN_PRODUCER,policy_ref:OPERATIONS_DECISION_MARGIN_POLICY,evidence_refs:p.evidence_refs,qualification_refs:p.qualification_refs,provenance_refs:p.provenance_refs,causal_lineage_refs:refs([...p.causal_lineage_refs,c.commitment_id,p.position_id],"OPS_MARGIN_LINEAGE_REQUIRED"),evidence_as_of:p.evidence_as_of,evaluated_at:p.evaluated_at});
}
