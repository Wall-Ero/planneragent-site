import type { MaterialOperationalConsequenceRefV1 } from "../../cognition/canonical.operational.roles.v1";
import { createCanonicalDecisionPressureDimensionV1, type CanonicalDecisionPressureDimensionV1 } from "../../decision/canonical.decision.pressure.dimension.v1";
import { createCanonicalDecisionPressureProducerCertificationV1, type CanonicalDecisionPressureProducerCertificationV1, verifyCanonicalDecisionPressureProducerCertificationV1 } from "../../decision/canonical.decision.pressure.normalization.policy.v1";
import type { OperationsObjectiveStateAssessmentV1 } from "./operations.objective.state.v1";
import type { OperationsOrderDeliveryCommitmentV1 } from "./operations.protected.objective.v1";

export const OPERATIONS_IMPACT_PRODUCER_ID="pressure-producer:operations-order-delivery-impact-v1" as const;
export const OPERATIONS_IMPACT_NORMALIZATION_POLICY_ID="normalization-policy:operations-order-delivery-impact-ordinal-v1" as const;

export type OperationsImpactMaterialityV1=Readonly<{
  consequence_ref:string;
  material_within_scope:boolean;
  affected_operational_refs:readonly string[];
  materiality_evidence_refs:readonly string[];
  qualification_refs:readonly string[];
  provenance_refs:readonly string[];
  causal_lineage_refs:readonly string[];
}>;

function canonical(value:unknown):string{if(Array.isArray(value))return`[${value.map(canonical).join(",")}]`;if(value&&typeof value==="object")return`{${Object.entries(value as Record<string,unknown>).filter(([,v])=>v!==undefined).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;return JSON.stringify(value);}
async function sha(value:unknown):Promise<string>{const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(canonical(value)));return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,"0")).join("");}
function refs(values:readonly string[],code:string):readonly string[]{const out=[...new Set(values.map(x=>x.trim()).filter(Boolean))].sort();if(!out.length)throw new Error(code);return out;}

export function createOperationsImpactProducerCertificationV1():Promise<CanonicalDecisionPressureProducerCertificationV1>{return createCanonicalDecisionPressureProducerCertificationV1({version:1,dimension:"IMPACT",projection_mode:"ORDINAL",producer_id:OPERATIONS_IMPACT_PRODUCER_ID,producer_version:"1",normalization_policy_id:OPERATIONS_IMPACT_NORMALIZATION_POLICY_ID,normalization_policy_version:"1",domain_profile_id:"domain-profile:operations",domain_profile_version:"1",supported_scope_kinds:["ENTITY"],endpoint_semantics:"CANONICAL_PRESSURE_DIMENSION_ENDPOINTS_V1",monotonicity:"NON_DECREASING_CANONICAL_MAGNITUDE",reference_basis_semantics:"CURRENT_EXPECTED_BREACHED_ORDER_DELIVERY_COMMITMENT_WITH_EXACT_MATERIAL_CAUSAL_CONSEQUENCE_SUPPORTS_HIGH_ONLY",evidence_requirement_refs:["evidence-requirement:protected-objective","evidence-requirement:current-expected-objective-state","evidence-requirement:material-consequence","evidence-requirement:materiality-within-scope","evidence-requirement:exact-objective-causality"],qualification_requirement_refs:["qualification-requirement:objective-state-qualified","qualification-requirement:material-consequence-qualified"],composition_restriction:"DOMAIN_SCOPED_PROJECTION_NO_GENERIC_CHILD_COMPOSITION",provenance_required:true,causal_lineage_required:true,ordinal_vocabulary:["LOW","MODERATE","HIGH","CRITICAL"]});}

async function verifyState(s:OperationsObjectiveStateAssessmentV1):Promise<void>{
  if(s.version!==1||s.assessment_perspective!=="CURRENT_EXPECTED"||s.observational_only!==true||s.grants_execution!==false||s.grants_authority!==false||s.grants_remediation!==false||s.company_global_claim!==false)throw new Error("OPS_IMPACT_OBJECTIVE_STATE_BOUNDARY_INVALID");
  const semantic={version:s.version,assessment_perspective:s.assessment_perspective,assessment_status:s.assessment_status,...(s.objective_state?{objective_state:s.objective_state}:{}),protected_objective_ref:s.protected_objective_ref,protected_objective_digest:s.protected_objective_digest,feasibility_ref:s.feasibility_ref,feasibility_digest:s.feasibility_digest,order_fact_ref:s.order_fact_ref,order_version_ref:s.order_version_ref,item_ref:s.item_ref,request_id:s.request_id,company_id:s.company_id,scope_id:s.scope_id,scope_digest:s.scope_digest,evidence_selection_ref:s.evidence_selection_ref,evidence_as_of:s.evidence_as_of,evaluated_at:s.evaluated_at,evidence_refs:s.evidence_refs,qualification_refs:s.qualification_refs,provenance_refs:s.provenance_refs,causal_lineage_refs:s.causal_lineage_refs};
  const digest=await sha(semantic);if(digest!==s.assessment_digest||s.assessment_id!==`operations-objective-state-assessment:sha256:${digest}`)throw new Error("OPS_IMPACT_OBJECTIVE_STATE_INTEGRITY_INVALID");
}

export async function assessOperationsImpactV1(input:Readonly<{
  version:1;
  commitment:OperationsOrderDeliveryCommitmentV1;
  objective_state:OperationsObjectiveStateAssessmentV1;
  consequence:MaterialOperationalConsequenceRefV1;
  materiality:OperationsImpactMaterialityV1;
  producer_certification:CanonicalDecisionPressureProducerCertificationV1;
}>):Promise<CanonicalDecisionPressureDimensionV1|null>{
  if(input.version!==1)throw new Error("OPS_IMPACT_VERSION_UNSUPPORTED");
  const c=input.commitment,s=input.objective_state,k=input.consequence,m=input.materiality,b=c.objective_binding,scope=b.evaluation_scope.scope;
  await verifyState(s);await verifyCanonicalDecisionPressureProducerCertificationV1(input.producer_certification);
  const expected=await createOperationsImpactProducerCertificationV1();if(input.producer_certification.certification_id!==expected.certification_id)throw new Error("OPS_IMPACT_CERTIFICATION_MISMATCH");
  const consequenceSemantic={version:k.version,subject:k.subject,scope_ref:k.scope_ref,evidence_refs:k.evidence_refs,provenance_refs:k.provenance_refs,causal_lineage_refs:k.causal_lineage_refs,role:k.role,consequence_ref:k.consequence_ref,consequence_kind_ref:k.consequence_kind_ref,materiality_ref:k.materiality_ref};
  const consequenceDigest=await sha(consequenceSemantic);if(k.digest_algorithm!=="SHA-256"||k.observational_only!==true||k.grants_execution!==false||k.grants_authority!==false||consequenceDigest!==k.role_digest||k.role_id!==`operational-role:consequence:sha256:${consequenceDigest}`)throw new Error("OPS_IMPACT_CONSEQUENCE_INTEGRITY_INVALID");
  if(c.kind!=="ORDER_DELIVERY_COMMITMENT"||scope.scope_type!=="ENTITY"||scope.entity?.entity_type!=="ORDER")throw new Error("OPS_IMPACT_OBJECTIVE_SCOPE_INVALID");
  if(s.protected_objective_ref!==c.commitment_id||s.protected_objective_digest!==c.commitment_digest)throw new Error("OPS_IMPACT_OBJECTIVE_MISMATCH");
  if(s.order_fact_ref!==c.order_fact_ref||s.order_version_ref!==c.order_version_ref||s.item_ref!==c.item_ref)throw new Error("OPS_IMPACT_ORDER_BINDING_MISMATCH");
  if(s.request_id!==b.request_id||s.company_id!==b.company_id||s.scope_id!==b.scope_id||s.scope_digest!==b.scope_digest)throw new Error("OPS_IMPACT_SCOPE_BINDING_MISMATCH");
  if(s.evidence_selection_ref!==scope.evidence_selection_ref||s.evidence_as_of!==b.evidence_as_of||s.evaluated_at!==b.evaluated_at)throw new Error("OPS_IMPACT_EVIDENCE_BINDING_MISMATCH");
  if(k.role!=="CONSEQUENCE"||k.scope_ref!==s.scope_id||k.subject.domain_ref!=="domain:operations"||k.subject.subject_kind!=="ORDER")throw new Error("OPS_IMPACT_CONSEQUENCE_SCOPE_MISMATCH");
  if(m.consequence_ref!==k.consequence_ref)throw new Error("OPS_IMPACT_CONSEQUENCE_MISMATCH");
  if(!m.affected_operational_refs.includes(c.commitment_id))throw new Error("OPS_IMPACT_CONSEQUENCE_OBJECTIVE_LINK_REQUIRED");
  const causal=new Set([...k.causal_lineage_refs,...m.causal_lineage_refs]);if(!causal.has(c.commitment_id)||!causal.has(s.assessment_id))throw new Error("OPS_IMPACT_CAUSAL_LINK_REQUIRED");
  refs(m.materiality_evidence_refs,"OPS_IMPACT_MATERIALITY_EVIDENCE_REQUIRED");refs(m.qualification_refs,"OPS_IMPACT_MATERIALITY_QUALIFICATION_REQUIRED");refs(m.provenance_refs,"OPS_IMPACT_MATERIALITY_PROVENANCE_REQUIRED");
  if(s.assessment_status==="UNRESOLVED"||!s.objective_state)return null;
  if(!m.material_within_scope)return null;
  if(s.objective_state!=="BREACHED")return null;
  return createCanonicalDecisionPressureDimensionV1({version:1,dimension:"IMPACT",projection_mode:"ORDINAL",ordinal_state:"HIGH",request_id:s.request_id,company_id:s.company_id,evaluation_scope:b.evaluation_scope,evidence_as_of:s.evidence_as_of,evaluated_at:s.evaluated_at,producer_certification:input.producer_certification,normalization_input_refs:[s.assessment_id,k.role_id,k.materiality_ref],evidence_refs:[...s.evidence_refs,...k.evidence_refs,...m.materiality_evidence_refs],provenance_refs:[...s.provenance_refs,...k.provenance_refs,...m.provenance_refs],causal_lineage_refs:[...s.causal_lineage_refs,...k.causal_lineage_refs,...m.causal_lineage_refs,c.commitment_id,s.assessment_id,k.role_id],qualification_refs:[...s.qualification_refs,...m.qualification_refs]});
}
