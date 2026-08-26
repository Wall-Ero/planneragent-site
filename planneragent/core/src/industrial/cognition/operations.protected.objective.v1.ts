import type { OperationalSignalScopeBindingV1 } from "../../cockpit/operational.signal.evaluation.scope.v1";
import { createProtectedOperationalObjectiveBindingV1, type ProtectedOperationalObjectiveBindingV1 } from "../../cognition/protected.operational.objective.v1";
import type { CanonicalOrderFact } from "../canonicalization/authoritative.order.fact";

export const OPERATIONS_ORDER_DELIVERY_COMMITMENT = "operations-objective:ORDER_DELIVERY_COMMITMENT" as const;

export type OperationsOrderDeliveryCommitmentV1 = Readonly<{
  version: 1;
  kind: "ORDER_DELIVERY_COMMITMENT";
  order_fact_ref: string;
  order_version_ref: string;
  item_ref: string;
  committed_quantity: Readonly<{ value: number; unit_ref: "unit:EACH" }>;
  committed_due_at: string;
  commitment_status: "OPEN";
  objective_binding: ProtectedOperationalObjectiveBindingV1;
  commitment_id: string;
  commitment_digest: string;
  digest_algorithm: "SHA-256";
  observational_only: true;
  grants_execution: false;
  grants_authority: false;
}>;

function canonicalJson(value:unknown):string{if(Array.isArray(value))return`[${value.map(canonicalJson).join(",")}]`;if(value&&typeof value==="object")return`{${Object.entries(value as Record<string,unknown>).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${JSON.stringify(k)}:${canonicalJson(v)}`).join(",")}}`;return JSON.stringify(value);}
async function digest(value:unknown):Promise<string>{const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(canonicalJson(value)));return Array.from(new Uint8Array(d),b=>b.toString(16).padStart(2,"0")).join("");}
function freeze<T>(value:T):Readonly<T>{if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value as Record<string,unknown>).forEach(freeze);Object.freeze(value);}return value;}

export async function bindOperationsOrderDeliveryCommitmentV1(input:Readonly<{
  version:1;
  order_fact:CanonicalOrderFact;
  evaluation_scope:OperationalSignalScopeBindingV1;
  selected_objective_kind:"ORDER_DELIVERY_COMMITMENT";
  objective_selection_ref:string;
  plan_element_ref:string;
  protected_subject_ref:string;
  qualification_refs:readonly string[];
  causal_lineage_refs:readonly string[];
  plan_lineage_refs:readonly string[];
}>):Promise<OperationsOrderDeliveryCommitmentV1>{
  if(input.version!==1)throw new Error("OPS_OBJECTIVE_VERSION_UNSUPPORTED");
  if(input.selected_objective_kind!=="ORDER_DELIVERY_COMMITMENT")throw new Error("OPS_OBJECTIVE_KIND_UNSUPPORTED");
  const fact=input.order_fact,scope=input.evaluation_scope.scope;
  if(fact.factFamily!=="INDUSTRIAL_ORDER"||fact.order.status!=="OPEN")throw new Error("OPS_OBJECTIVE_ORDER_FACT_INVALID");
  if(scope.scope_type!=="ENTITY"||scope.entity?.entity_type!=="ORDER"||scope.entity.entity_ref!==fact.factId)throw new Error("OPS_OBJECTIVE_ORDER_SCOPE_MISMATCH");
  if(scope.company_id!==fact.owner.companyId)throw new Error("OPS_OBJECTIVE_ORDER_COMPANY_MISMATCH");
  const semantic={version:1 as const,kind:"ORDER_DELIVERY_COMMITMENT" as const,order_fact_ref:fact.factId,order_version_ref:`order-version:${fact.source.externalObjectVersion}`,item_ref:`operations-item:${fact.order.sku}`,committed_quantity:{value:fact.order.quantity.value,unit_ref:"unit:EACH" as const},committed_due_at:fact.order.dueAt,commitment_status:"OPEN" as const};
  const commitment_digest=await digest(semantic);
  const objective_ref=`operations-order-delivery-commitment:sha256:${commitment_digest}`;
  const objective_binding=await createProtectedOperationalObjectiveBindingV1({version:1,request_id:scope.request_id,company_id:scope.company_id,evaluation_scope:input.evaluation_scope,domain_profile_ref:"domain-profile:operations",domain_profile_version:"1",objective_kind_ref:OPERATIONS_ORDER_DELIVERY_COMMITMENT,objective_ref,governing_expected_state_refs:[],governing_plan_element_refs:[input.plan_element_ref],protected_subject_refs:[input.protected_subject_ref],commitment_criteria_refs:[`commitment-criteria:quantity:${fact.order.quantity.value}:EACH`,`commitment-criteria:due:${fact.order.dueAt}`,`commitment-criteria:status:OPEN`,`commitment-criteria:version:${fact.source.externalObjectVersion}`],objective_selection_ref:input.objective_selection_ref,source_evidence_refs:[fact.factId],provenance_refs:[`provenance:${fact.provenance.acquisitionReference}`],qualification_refs:input.qualification_refs,causal_lineage_refs:input.causal_lineage_refs,plan_lineage_refs:input.plan_lineage_refs,effective_at:fact.effectiveAt,evidence_as_of:input.evaluation_scope.evidence_as_of,evaluated_at:input.evaluation_scope.evaluated_at});
  return freeze({...semantic,objective_binding,commitment_id:objective_ref,commitment_digest,digest_algorithm:"SHA-256" as const,observational_only:true as const,grants_execution:false as const,grants_authority:false as const}) as OperationsOrderDeliveryCommitmentV1;
}

export type OperationsProtectedObjectiveStateV1 = "PRESERVED"|"DEGRADED"|"BREACHED"|"LOST";

export async function verifyOperationsOrderDeliveryCommitmentV1(value:OperationsOrderDeliveryCommitmentV1):Promise<void>{
  const semantic={version:value.version,kind:value.kind,order_fact_ref:value.order_fact_ref,order_version_ref:value.order_version_ref,item_ref:value.item_ref,committed_quantity:value.committed_quantity,committed_due_at:value.committed_due_at,commitment_status:value.commitment_status},expected=await digest(semantic),rebuilt=await createProtectedOperationalObjectiveBindingV1(value.objective_binding);
  const criteria=[`commitment-criteria:quantity:${value.committed_quantity.value}:EACH`,`commitment-criteria:due:${value.committed_due_at}`,`commitment-criteria:status:OPEN`,`commitment-criteria:version:${value.order_version_ref.replace(/^order-version:/,"")}`];
  if(value.commitment_id!==`operations-order-delivery-commitment:sha256:${expected}`||value.commitment_digest!==expected||value.digest_algorithm!=="SHA-256"||value.objective_binding.objective_kind_ref!==OPERATIONS_ORDER_DELIVERY_COMMITMENT||value.objective_binding.objective_ref!==value.commitment_id||criteria.some(x=>!value.objective_binding.commitment_criteria_refs.includes(x))||rebuilt.objective_binding_id!==value.objective_binding.objective_binding_id||rebuilt.objective_binding_digest!==value.objective_binding.objective_binding_digest||value.observational_only!==true||value.grants_execution!==false||value.grants_authority!==false)throw new Error("OPS_OBJECTIVE_INTEGRITY_INVALID");
}
