import { computeAllocationV2 } from "../../decision/allocation/computeAllocation.v2";
import { createProtectedOperationalObjectiveBindingV1 } from "../../cognition/protected.operational.objective.v1";
import { evaluateOperationsBaselineCommitmentFeasibilityV1, type BaselineAvailabilityV1, type BaselinePlanOrderV1, type OperationsBaselineCommitmentFeasibilityV1 } from "./operations.baseline.commitment.feasibility.v1";
import type { OperationsOrderDeliveryCommitmentV1 } from "./operations.protected.objective.v1";

export type OperationsCurrentFulfillmentPositionStatusV1 = "RESOLVED" | "UNRESOLVED" | "INSUFFICIENT_EVIDENCE";

export type OperationsCurrentFulfillmentPositionV1 = Readonly<{
  version: 1;
  position_id: string;
  position_digest: string;
  digest_algorithm: "SHA-256";
  position_kind: "CURRENT_PLAN_FULFILLMENT_RELEVANT_AVAILABILITY";
  status: OperationsCurrentFulfillmentPositionStatusV1;
  current_position_at?: string;
  temporal_unit_ref: "time:INSTANT";
  protected_objective_ref: string;
  protected_objective_digest: string;
  objective_binding_ref: string;
  objective_binding_digest: string;
  baseline_feasibility_ref: string;
  baseline_feasibility_digest: string;
  order_fact_ref: string;
  order_version_ref: string;
  item_ref: string;
  committed_quantity: Readonly<{ value:number; unit_ref:"unit:EACH" }>;
  request_id: string;
  company_id: string;
  scope_id: string;
  scope_digest: string;
  evidence_selection_ref: string;
  evidence_refs: readonly string[];
  qualification_refs: readonly string[];
  provenance_refs: readonly string[];
  causal_lineage_refs: readonly string[];
  evidence_as_of: string;
  evaluated_at: string;
  epistemic_basis: "DETERMINISTIC";
  observational_only: true;
  grants_authority: false;
  grants_execution: false;
  grants_remediation: false;
  company_global_claim: false;
}>;

function canonical(value:unknown):string{if(Array.isArray(value))return`[${value.map(canonical).join(",")}]`;if(value&&typeof value==="object")return`{${Object.entries(value as Record<string,unknown>).filter(([,v])=>v!==undefined).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;return JSON.stringify(value);}
async function sha(value:unknown):Promise<string>{const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(canonical(value)));return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,"0")).join("");}
function freeze<T>(value:T):Readonly<T>{if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value as Record<string,unknown>).forEach(freeze);Object.freeze(value);}return value;}
function refs(values:readonly string[],code:string):readonly string[]{const out=[...new Set(values.map(x=>x.trim()).filter(Boolean))].sort();if(!out.length)throw new Error(code);return out;}
function instant(value:string,code:string):number{const n=Date.parse(value);if(!Number.isFinite(n))throw new Error(code);return n;}

async function verifyCommitment(c:OperationsOrderDeliveryCommitmentV1):Promise<void>{
  const binding=await createProtectedOperationalObjectiveBindingV1(c.objective_binding);
  if(binding.objective_binding_id!==c.objective_binding.objective_binding_id||binding.objective_binding_digest!==c.objective_binding.objective_binding_digest)throw new Error("OPS_POSITION_OBJECTIVE_BINDING_INVALID");
  const semantic={version:1 as const,kind:c.kind,order_fact_ref:c.order_fact_ref,order_version_ref:c.order_version_ref,item_ref:c.item_ref,committed_quantity:c.committed_quantity,committed_due_at:c.committed_due_at,commitment_status:c.commitment_status};
  const digest=await sha(semantic);
  if(digest!==c.commitment_digest||c.commitment_id!==`operations-order-delivery-commitment:sha256:${digest}`)throw new Error("OPS_POSITION_OBJECTIVE_INTEGRITY_INVALID");
}

export async function deriveOperationsCurrentFulfillmentPositionV1(input:Readonly<{
  version:1;
  commitment:OperationsOrderDeliveryCommitmentV1;
  baseline_feasibility:OperationsBaselineCommitmentFeasibilityV1;
  baseline_semantics:"BASELINE_CURRENT_PLAN";
  evidence_selection_ref:string;
  plan_orders:readonly BaselinePlanOrderV1[];
  availability:readonly BaselineAvailabilityV1[];
  evidence_boundary:"COMPLETE"|"PARTIAL";
  corrective_action_refs?:readonly string[];
  scenario_modification_refs?:readonly string[];
  authority_tier_ref?:never;
}>):Promise<OperationsCurrentFulfillmentPositionV1>{
  if(input.version!==1)throw new Error("OPS_POSITION_VERSION_UNSUPPORTED");
  if(input.corrective_action_refs?.length)throw new Error("OPS_POSITION_CORRECTIVE_CANDIDATE_REJECTED");
  if(input.scenario_modification_refs?.length)throw new Error("OPS_POSITION_SCENARIO_REJECTED");
  if((input as {authority_tier_ref?:unknown}).authority_tier_ref!==undefined)throw new Error("OPS_POSITION_TIER_INPUT_REJECTED");
  await verifyCommitment(input.commitment);
  const rebuilt=await evaluateOperationsBaselineCommitmentFeasibilityV1({version:1,commitment:input.commitment,baseline_semantics:input.baseline_semantics,evidence_selection_ref:input.evidence_selection_ref,plan_orders:input.plan_orders,availability:input.availability,evidence_boundary:input.evidence_boundary});
  if(rebuilt.feasibility_id!==input.baseline_feasibility.feasibility_id||rebuilt.feasibility_digest!==input.baseline_feasibility.feasibility_digest)throw new Error("OPS_POSITION_BASELINE_INTEGRITY_INVALID");
  const c=input.commitment,b=c.objective_binding,s=b.evaluation_scope.scope;
  const relevant:BaselineAvailabilityV1[]=[];
  let unresolved=input.evidence_boundary==="PARTIAL";
  for(const a of input.availability){
    if(a.item_ref!==c.item_ref)continue;
    if(a.quantity.unit_ref!==c.committed_quantity.unit_ref)throw new Error("OPS_POSITION_UNIT_MISMATCH");
    if(!Number.isFinite(a.quantity.value)||a.quantity.value<=0)throw new Error("OPS_POSITION_QUANTITY_INVALID");
    refs(a.evidence_refs,"OPS_POSITION_EVIDENCE_REQUIRED");refs(a.qualification_refs,"OPS_POSITION_QUALIFICATION_REQUIRED");refs(a.provenance_refs,"OPS_POSITION_PROVENANCE_REQUIRED");refs(a.causal_lineage_refs,"OPS_POSITION_LINEAGE_REQUIRED");
    if(!a.available_at){unresolved=true;continue;}
    instant(a.available_at,"OPS_POSITION_TIME_INVALID");
    if(a.kind==="PLANNED_PRODUCTION"&&a.material_feasibility!=="ESTABLISHED"){unresolved=true;continue;}
    relevant.push(a);
  }
  let current_position_at:string|undefined;
  if(!unresolved){
    const times=[...new Set(relevant.map(a=>a.available_at))].sort((a,b)=>instant(a,"OPS_POSITION_TIME_INVALID")-instant(b,"OPS_POSITION_TIME_INVALID"));
    for(const at of times){
      const supply=new Map<string,number>();
      for(const a of relevant)if(instant(a.available_at,"OPS_POSITION_TIME_INVALID")<=instant(at,"OPS_POSITION_TIME_INVALID"))supply.set(a.item_ref,(supply.get(a.item_ref)??0)+a.quantity.value);
      const allocation=computeAllocationV2(input.plan_orders.map(o=>({orderId:o.order_fact_ref,sku:o.item_ref,qty:o.quantity.value,dueDate:o.due_at,priority:o.priority})),Array.from(supply,([sku,qty])=>({sku,qty})));
      if(allocation.allocationLog.find(row=>row.orderId===c.order_fact_ref)?.shortage===0){current_position_at=at;break;}
    }
  }
  const status:OperationsCurrentFulfillmentPositionStatusV1=unresolved?"UNRESOLVED":current_position_at?"RESOLVED":"INSUFFICIENT_EVIDENCE";
  const contributors=current_position_at?relevant.filter(a=>instant(a.available_at,"OPS_POSITION_TIME_INVALID")<=instant(current_position_at!,"OPS_POSITION_TIME_INVALID")):relevant;
  const evidence_refs=refs([...input.baseline_feasibility.evidence_refs,...contributors.flatMap(x=>x.evidence_refs)],"OPS_POSITION_EVIDENCE_REQUIRED");
  const qualification_refs=refs([...input.baseline_feasibility.qualification_refs,...contributors.flatMap(x=>x.qualification_refs)],"OPS_POSITION_QUALIFICATION_REQUIRED");
  const provenance_refs=refs([...input.baseline_feasibility.provenance_refs,...contributors.flatMap(x=>x.provenance_refs)],"OPS_POSITION_PROVENANCE_REQUIRED");
  const causal_lineage_refs=refs([...input.baseline_feasibility.causal_lineage_refs,...contributors.flatMap(x=>x.causal_lineage_refs),c.commitment_id,input.baseline_feasibility.feasibility_id],"OPS_POSITION_LINEAGE_REQUIRED");
  const semantic={version:1 as const,position_kind:"CURRENT_PLAN_FULFILLMENT_RELEVANT_AVAILABILITY" as const,status,...(current_position_at?{current_position_at}:{}),temporal_unit_ref:"time:INSTANT" as const,protected_objective_ref:c.commitment_id,protected_objective_digest:c.commitment_digest,objective_binding_ref:b.objective_binding_id,objective_binding_digest:b.objective_binding_digest,baseline_feasibility_ref:input.baseline_feasibility.feasibility_id,baseline_feasibility_digest:input.baseline_feasibility.feasibility_digest,order_fact_ref:c.order_fact_ref,order_version_ref:c.order_version_ref,item_ref:c.item_ref,committed_quantity:c.committed_quantity,request_id:b.request_id,company_id:b.company_id,scope_id:b.scope_id,scope_digest:b.scope_digest,evidence_selection_ref:input.evidence_selection_ref,evidence_refs,qualification_refs,provenance_refs,causal_lineage_refs,evidence_as_of:b.evidence_as_of,evaluated_at:b.evaluated_at,epistemic_basis:"DETERMINISTIC" as const};
  const position_digest=await sha(semantic);
  return freeze({...semantic,position_id:`operations-current-fulfillment-position:sha256:${position_digest}`,position_digest,digest_algorithm:"SHA-256" as const,observational_only:true as const,grants_authority:false as const,grants_execution:false as const,grants_remediation:false as const,company_global_claim:false as const}) as OperationsCurrentFulfillmentPositionV1;
}
