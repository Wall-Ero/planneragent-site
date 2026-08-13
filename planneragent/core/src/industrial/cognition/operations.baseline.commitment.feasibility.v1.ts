import { computeAllocationV2 } from "../../decision/allocation/computeAllocation.v2";
import type { OperationsOrderDeliveryCommitmentV1 } from "./operations.protected.objective.v1";

export type OperationsBaselineCommitmentFeasibilityResultV1 =
  | "FULFILLABLE_BY_COMMITMENT"
  | "NOT_FULFILLABLE_BY_COMMITMENT"
  | "UNRESOLVED";

type Evidence = Readonly<{
  evidence_observed_at: string;
  evidence_refs: readonly string[];
  qualification_refs: readonly string[];
  provenance_refs: readonly string[];
  causal_lineage_refs: readonly string[];
}>;

export type BaselinePlanOrderV1 = Evidence & Readonly<{
  order_fact_ref: string;
  order_version_ref: string;
  item_ref: string;
  quantity: Readonly<{ value: number; unit_ref: "unit:EACH" }>;
  due_at: string;
  priority?: number;
}>;

export type BaselineAvailabilityV1 = Evidence & Readonly<{
  availability_ref: string;
  kind: "EFFECTIVE_INVENTORY" | "GOVERNED_FUTURE_SUPPLY" | "PLANNED_PRODUCTION";
  item_ref: string;
  quantity: Readonly<{ value: number; unit_ref: "unit:EACH" }>;
  available_at: string;
  material_feasibility?: "ESTABLISHED" | "UNRESOLVED";
}>;

export type OperationsBaselineCommitmentFeasibilityV1 = Readonly<{
  version: 1;
  feasibility_id: string;
  feasibility_digest: string;
  digest_algorithm: "SHA-256";
  baseline_semantics: "BASELINE_CURRENT_PLAN";
  protected_objective_ref: string;
  protected_objective_digest: string;
  order_fact_ref: string;
  order_version_ref: string;
  item_ref: string;
  committed_quantity: Readonly<{ value: number; unit_ref: "unit:EACH" }>;
  commitment_boundary: string;
  result: OperationsBaselineCommitmentFeasibilityResultV1;
  allocated_quantity: Readonly<{ value: number; unit_ref: "unit:EACH" }>;
  shortage_quantity: Readonly<{ value: number; unit_ref: "unit:EACH" }>;
  evidence_boundary: "COMPLETE" | "PARTIAL";
  evidence_refs: readonly string[];
  qualification_refs: readonly string[];
  provenance_refs: readonly string[];
  causal_lineage_refs: readonly string[];
  request_id: string;
  company_id: string;
  scope_id: string;
  scope_digest: string;
  evidence_selection_ref: string;
  evidence_as_of: string;
  evaluated_at: string;
  observational_only: true;
  grants_execution: false;
  grants_authority: false;
  grants_remediation: false;
  company_global_claim: false;
}>;

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).filter(([,v])=>v!==undefined).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;
  return JSON.stringify(value);
}
async function sha(value: unknown): Promise<string> { const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(canonical(value)));return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,"0")).join(""); }
function freeze<T>(value:T):Readonly<T>{if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value as Record<string,unknown>).forEach(freeze);Object.freeze(value);}return value;}
function refs(values: readonly string[], code: string): readonly string[] { const out=[...new Set(values.map(x=>x.trim()).filter(Boolean))].sort();if(!out.length)throw new Error(code);return out; }
function instant(value:string,code:string):number{const n=Date.parse(value);if(!Number.isFinite(n))throw new Error(code);return n;}
function positive(value:number,code:string):number{if(!Number.isFinite(value)||value<=0)throw new Error(code);return value;}

export async function evaluateOperationsBaselineCommitmentFeasibilityV1(input:Readonly<{
  version:1;
  commitment:OperationsOrderDeliveryCommitmentV1;
  baseline_semantics:"BASELINE_CURRENT_PLAN";
  evidence_selection_ref:string;
  plan_orders:readonly BaselinePlanOrderV1[];
  availability:readonly BaselineAvailabilityV1[];
  evidence_boundary:"COMPLETE"|"PARTIAL";
  corrective_action_refs?:readonly string[];
  scenario_modification_refs?:readonly string[];
}>):Promise<OperationsBaselineCommitmentFeasibilityV1>{
  if(input.version!==1)throw new Error("OPS_BASELINE_FEASIBILITY_VERSION_UNSUPPORTED");
  if(input.baseline_semantics!=="BASELINE_CURRENT_PLAN")throw new Error("OPS_BASELINE_SEMANTICS_INVALID");
  if(input.corrective_action_refs?.length)throw new Error("OPS_BASELINE_CORRECTIVE_CANDIDATE_REJECTED");
  if(input.scenario_modification_refs?.length)throw new Error("OPS_BASELINE_SCENARIO_REJECTED");
  const c=input.commitment,b=c.objective_binding,s=b.evaluation_scope.scope;
  if(c.kind!=="ORDER_DELIVERY_COMMITMENT"||c.commitment_status!=="OPEN")throw new Error("OPS_BASELINE_OBJECTIVE_INVALID");
  if(s.scope_type!=="ENTITY"||s.entity?.entity_type!=="ORDER"||s.entity.entity_ref!==c.order_fact_ref)throw new Error("OPS_BASELINE_SCOPE_MISMATCH");
  if(input.evidence_selection_ref!==s.evidence_selection_ref)throw new Error("OPS_BASELINE_EVIDENCE_SELECTION_MISMATCH");
  if(b.request_id!==s.request_id||b.company_id!==s.company_id)throw new Error("OPS_BASELINE_REQUEST_COMPANY_MISMATCH");
  const asOf=instant(b.evidence_as_of,"OPS_BASELINE_AS_OF_INVALID"), boundary=instant(c.committed_due_at,"OPS_BASELINE_BOUNDARY_INVALID");
  positive(c.committed_quantity.value,"OPS_BASELINE_COMMITTED_QUANTITY_INVALID");
  const protectedOrder=input.plan_orders.find(o=>o.order_fact_ref===c.order_fact_ref);
  if(!protectedOrder)throw new Error("OPS_BASELINE_ORDER_REQUIRED");
  if(protectedOrder.order_version_ref!==c.order_version_ref)throw new Error("OPS_BASELINE_ORDER_VERSION_MISMATCH");
  if(protectedOrder.item_ref!==c.item_ref)throw new Error("OPS_BASELINE_ITEM_MISMATCH");
  if(protectedOrder.quantity.unit_ref!==c.committed_quantity.unit_ref)throw new Error("OPS_BASELINE_UNIT_MISMATCH");
  if(protectedOrder.quantity.value!==c.committed_quantity.value||protectedOrder.due_at!==c.committed_due_at)throw new Error("OPS_BASELINE_COMMITMENT_MISMATCH");

  let unresolved=boundary<asOf;
  for(const evidence of [...input.plan_orders,...input.availability])if(instant(evidence.evidence_observed_at,"OPS_BASELINE_EVIDENCE_TIME_INVALID")>asOf)throw new Error("OPS_BASELINE_EVIDENCE_AFTER_AS_OF");
  const usable:BaselineAvailabilityV1[]=[];
  for(const a of input.availability){
    positive(a.quantity.value,"OPS_BASELINE_AVAILABILITY_QUANTITY_INVALID");
    if(a.quantity.unit_ref!=="unit:EACH")throw new Error("OPS_BASELINE_UNIT_MISMATCH");
    if(!a.available_at){unresolved=true;continue;}
    const at=instant(a.available_at,"OPS_BASELINE_AVAILABILITY_TIME_INVALID");
    if(at>asOf&&a.kind==="EFFECTIVE_INVENTORY")throw new Error("OPS_BASELINE_EVIDENCE_AFTER_AS_OF");
    if(a.kind==="PLANNED_PRODUCTION"&&a.material_feasibility!=="ESTABLISHED"){unresolved=true;continue;}
    if(a.item_ref===c.item_ref&&at<=boundary)usable.push(a);
  }
  for(const o of input.plan_orders){positive(o.quantity.value,"OPS_BASELINE_ORDER_QUANTITY_INVALID");instant(o.due_at,"OPS_BASELINE_ORDER_TIME_INVALID");if(o.quantity.unit_ref!=="unit:EACH")throw new Error("OPS_BASELINE_UNIT_MISMATCH");}
  const supply=new Map<string,number>();for(const a of usable)supply.set(a.item_ref,(supply.get(a.item_ref)??0)+a.quantity.value);
  const allocation=computeAllocationV2(input.plan_orders.map(o=>({orderId:o.order_fact_ref,sku:o.item_ref,qty:o.quantity.value,dueDate:o.due_at,priority:o.priority})),Array.from(supply,([sku,qty])=>({sku,qty})));
  const row=allocation.allocationLog.find(x=>x.orderId===c.order_fact_ref);if(!row)throw new Error("OPS_BASELINE_ORDER_ALLOCATION_MISSING");
  const all=[...input.plan_orders,...usable];
  const evidence_refs=refs(all.flatMap(x=>x.evidence_refs),"OPS_BASELINE_EVIDENCE_REQUIRED");
  const qualification_refs=refs(all.flatMap(x=>x.qualification_refs),"OPS_BASELINE_QUALIFICATION_REQUIRED");
  const provenance_refs=refs(all.flatMap(x=>x.provenance_refs),"OPS_BASELINE_PROVENANCE_REQUIRED");
  const causal_lineage_refs=refs(all.flatMap(x=>x.causal_lineage_refs),"OPS_BASELINE_CAUSAL_LINEAGE_REQUIRED");
  let result:OperationsBaselineCommitmentFeasibilityResultV1="UNRESOLVED";
  if(!unresolved&&input.evidence_boundary==="COMPLETE"&&row.shortage===0)result="FULFILLABLE_BY_COMMITMENT";
  else if(!unresolved&&input.evidence_boundary==="COMPLETE")result="NOT_FULFILLABLE_BY_COMMITMENT";
  const semantic={version:1 as const,baseline_semantics:"BASELINE_CURRENT_PLAN" as const,protected_objective_ref:c.commitment_id,protected_objective_digest:c.commitment_digest,order_fact_ref:c.order_fact_ref,order_version_ref:c.order_version_ref,item_ref:c.item_ref,committed_quantity:c.committed_quantity,commitment_boundary:c.committed_due_at,result,allocated_quantity:{value:row.allocated,unit_ref:"unit:EACH" as const},shortage_quantity:{value:row.shortage,unit_ref:"unit:EACH" as const},evidence_boundary:input.evidence_boundary,evidence_refs,qualification_refs,provenance_refs,causal_lineage_refs,request_id:b.request_id,company_id:b.company_id,scope_id:b.scope_id,scope_digest:b.scope_digest,evidence_selection_ref:input.evidence_selection_ref,evidence_as_of:b.evidence_as_of,evaluated_at:b.evaluated_at};
  const feasibility_digest=await sha(semantic);
  return freeze({...semantic,feasibility_id:`operations-baseline-commitment-feasibility:sha256:${feasibility_digest}`,feasibility_digest,digest_algorithm:"SHA-256" as const,observational_only:true as const,grants_execution:false as const,grants_authority:false as const,grants_remediation:false as const,company_global_claim:false as const}) as OperationsBaselineCommitmentFeasibilityV1;
}
