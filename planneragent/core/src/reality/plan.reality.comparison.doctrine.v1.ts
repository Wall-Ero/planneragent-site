import type { OperationalSignalScopeBindingV1 } from "../cockpit/operational.signal.evaluation.scope.v1";
import { verifyOperationalSignalEvaluationScopeV1 } from "../cockpit/operational.signal.evaluation.scope.v1";
import type { GovernedOperationalClaimValueV1, GovernedRepresentationObservationInputV1 } from "./governed.multi-source.reality.alignment.v1";

export type GovernedPlanReferenceEligibilityV1 =
  | "ELIGIBLE"
  | "NO_APPLICABLE_PLAN"
  | "AMBIGUOUS_PLAN"
  | "INSUFFICIENT_EVIDENCE"
  | "SCOPE_MISMATCH"
  | "NON_ASSERTABLE_PLAN";

export type PlanRealityElementComparisonDispositionV1 =
  | "EXACT_TARGET_SATISFIED"
  | "DEVIATION_ESTABLISHED_MATERIALITY_UNRESOLVED"
  | "NOT_COMPARABLE";

export type PlanRealityElementNonAssertabilityReasonV1 =
  | Exclude<GovernedPlanReferenceEligibilityV1, "ELIGIBLE">
  | "SUBJECT_MISMATCH"
  | "SEMANTIC_DIMENSION_MISMATCH"
  | "OPERATIONAL_STATE_MISMATCH"
  | "PROCESS_STAGE_MISMATCH"
  | "LOCATION_MISMATCH"
  | "UNIT_MISMATCH"
  | "TEMPORAL_RELATIONSHIP_UNRESOLVED"
  | "MATERIALITY_POLICY_REQUIRED";

export type GovernedPlanRealityElementComparisonV1 = Readonly<{
  version: 1;
  doctrine_ref: "doctrine:governed-plan-reality-element-comparison-v1";
  applicable_plan_context_ref: string;
  applicable_plan_context_digest: string;
  plan_element_ref: string;
  plan_observation_ref: string;
  reality_observation_ref: string;
  request_id: string;
  company_id: string;
  scope_id: string;
  scope_digest: string;
  evidence_as_of: string;
  comparison_status: "ASSERTABLE" | "NOT_ASSERTABLE";
  disposition: PlanRealityElementComparisonDispositionV1;
  reason_codes: readonly PlanRealityElementNonAssertabilityReasonV1[];
  supports_element_alignment: boolean;
  establishes_deviation: boolean;
  establishes_drifting: false;
  establishes_misalignment: false;
  evidence_refs: readonly string[];
  qualification_refs: readonly string[];
  provenance_refs: readonly string[];
  causal_lineage_refs: readonly string[];
  comparison_id: string;
  comparison_digest: string;
  digest_algorithm: "SHA-256";
  element_level_only: true;
  scope_aggregation_performed: false;
  source_identity_independent: true;
  observational_only: true;
  recommended: false;
  executable: false;
  grants_authority: false;
  grants_execution: false;
}>;

type ComparisonObservationV1 = GovernedRepresentationObservationInputV1 & Readonly<{
  request_id: string;
  company_id: string;
  scope_id: string;
  scope_digest: string;
  evidence_as_of: string;
}>;

function required(value:string,code:string):string{const normalized=value?.trim();if(!normalized)throw new Error(code);return normalized}
function digest(value:string,code:string):string{const normalized=required(value,code);if(!/^[a-f0-9]{64}$/.test(normalized))throw new Error(code);return normalized}
function refs(values:readonly string[],code:string):readonly string[]{const normalized=[...new Set(values.map(value=>required(value,code)))].sort();if(!normalized.length)throw new Error(code);return Object.freeze(normalized)}
function canonical(value:unknown):string{if(Array.isArray(value))return`[${value.map(canonical).join(",")}]`;if(value&&typeof value==="object")return`{${Object.entries(value as Record<string,unknown>).filter(([,member])=>member!==undefined).sort(([left],[right])=>left.localeCompare(right)).map(([key,member])=>`${JSON.stringify(key)}:${canonical(member)}`).join(",")}}`;return JSON.stringify(value)}
async function sha(value:unknown):Promise<string>{const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(canonical(value)));return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,"0")).join("")}
function freeze<T>(value:T):Readonly<T>{if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value as Record<string,unknown>).forEach(freeze);Object.freeze(value)}return value}
function instant(value:string|undefined,code:string):string|undefined{if(value===undefined)return undefined;const parsed=Date.parse(value);if(!Number.isFinite(parsed)||new Date(parsed).toISOString()!==value)throw new Error(code);return value}
function sameRefs(left:readonly string[],right:readonly string[]):boolean{return canonical([...new Set(left)].sort())===canonical([...new Set(right)].sort())}
function unit(claim:GovernedOperationalClaimValueV1):string|undefined{return claim.kind==="QUANTITY"?required(claim.unit_ref,"PLAN_REALITY_UNIT_REQUIRED"):undefined}
function canonicalSubject(observation:ComparisonObservationV1):string|undefined{return observation.subject_binding.outcome==="SAME_SUBJECT"?observation.subject_binding.canonical_subject?.subject_id:undefined}
function directTimeMatch(plan:ComparisonObservationV1,reality:ComparisonObservationV1):boolean{return Boolean(plan.effective_from&&reality.effective_from&&plan.effective_from===reality.effective_from&&plan.effective_until===reality.effective_until)}

export async function evaluateGovernedPlanRealityElementComparisonV1(input:Readonly<{
  version:1;
  evaluation_scope:OperationalSignalScopeBindingV1;
  plan_reference_eligibility:GovernedPlanReferenceEligibilityV1;
  applicable_plan_context_ref:string;
  applicable_plan_context_digest:string;
  plan_element_ref:string;
  plan_target:ComparisonObservationV1;
  reality_observation:ComparisonObservationV1;
}>):Promise<GovernedPlanRealityElementComparisonV1>{
  if(input.version!==1)throw new Error("PLAN_REALITY_DOCTRINE_VERSION_UNSUPPORTED");
  await verifyOperationalSignalEvaluationScopeV1(input.evaluation_scope.scope,input.evaluation_scope.scope);
  const scope=input.evaluation_scope.scope,plan=input.plan_target,reality=input.reality_observation;
  if(plan.evidence_role!=="CURRENT_PLAN"&&plan.evidence_role!=="PLANNED_PRODUCTION")throw new Error("PLAN_REALITY_PLAN_TARGET_ROLE_REQUIRED");
  if(reality.evidence_role==="CURRENT_PLAN"||reality.evidence_role==="PLANNED_PRODUCTION")throw new Error("PLAN_REALITY_CURRENT_REALITY_ROLE_REQUIRED");
  const contextMatches=(observation:ComparisonObservationV1)=>observation.request_id===scope.request_id&&observation.company_id===scope.company_id&&observation.scope_id===scope.scope_id&&observation.scope_digest===scope.scope_digest&&observation.evidence_as_of===input.evaluation_scope.evidence_as_of;
  const reasons:PlanRealityElementNonAssertabilityReasonV1[]=[];
  if(input.plan_reference_eligibility!=="ELIGIBLE")reasons.push(input.plan_reference_eligibility);
  if(!contextMatches(plan)||!contextMatches(reality))reasons.push("SCOPE_MISMATCH");
  const planSubject=canonicalSubject(plan),realitySubject=canonicalSubject(reality);
  if(!planSubject||planSubject!==realitySubject)reasons.push("SUBJECT_MISMATCH");
  if(required(plan.dimension_ref,"PLAN_REALITY_DIMENSION_REQUIRED")!==required(reality.dimension_ref,"PLAN_REALITY_DIMENSION_REQUIRED"))reasons.push("SEMANTIC_DIMENSION_MISMATCH");
  if(required(plan.operational_state_ref,"PLAN_REALITY_STATE_REQUIRED")!==required(reality.operational_state_ref,"PLAN_REALITY_STATE_REQUIRED"))reasons.push("OPERATIONAL_STATE_MISMATCH");
  if((plan.process_stage_ref??"")!==(reality.process_stage_ref??""))reasons.push("PROCESS_STAGE_MISMATCH");
  if(!sameRefs(plan.location_refs,reality.location_refs))reasons.push("LOCATION_MISMATCH");
  if(unit(plan.claim)!==unit(reality.claim))reasons.push("UNIT_MISMATCH");
  instant(plan.effective_from,"PLAN_REALITY_EFFECTIVITY_INVALID");instant(plan.effective_until,"PLAN_REALITY_EFFECTIVITY_INVALID");instant(reality.effective_from,"PLAN_REALITY_EFFECTIVITY_INVALID");instant(reality.effective_until,"PLAN_REALITY_EFFECTIVITY_INVALID");
  if(!directTimeMatch(plan,reality))reasons.push("TEMPORAL_RELATIONSHIP_UNRESOLVED");
  const comparable=reasons.length===0,claimsEqual=comparable&&canonical(plan.claim)===canonical(reality.claim),deviation=comparable&&!claimsEqual;
  if(deviation)reasons.push("MATERIALITY_POLICY_REQUIRED");
  const disposition:PlanRealityElementComparisonDispositionV1=!comparable?"NOT_COMPARABLE":claimsEqual?"EXACT_TARGET_SATISFIED":"DEVIATION_ESTABLISHED_MATERIALITY_UNRESOLVED";
  const comparison_status=claimsEqual?"ASSERTABLE"as const:"NOT_ASSERTABLE"as const;
  const evidence_refs=refs([plan.observation_ref,reality.observation_ref],"PLAN_REALITY_EVIDENCE_REQUIRED"),qualification_refs=refs([...plan.qualification_refs,...reality.qualification_refs],"PLAN_REALITY_QUALIFICATION_REQUIRED"),provenance_refs=refs([...plan.provenance_refs,...reality.provenance_refs],"PLAN_REALITY_PROVENANCE_REQUIRED"),causal_lineage_refs=refs([...plan.causal_lineage_refs,...reality.causal_lineage_refs,input.applicable_plan_context_ref,input.plan_element_ref],"PLAN_REALITY_LINEAGE_REQUIRED");
  const semantic={version:1 as const,doctrine_ref:"doctrine:governed-plan-reality-element-comparison-v1"as const,applicable_plan_context_ref:required(input.applicable_plan_context_ref,"PLAN_REALITY_PLAN_CONTEXT_REQUIRED"),applicable_plan_context_digest:digest(input.applicable_plan_context_digest,"PLAN_REALITY_PLAN_CONTEXT_DIGEST_REQUIRED"),plan_element_ref:required(input.plan_element_ref,"PLAN_REALITY_PLAN_ELEMENT_REQUIRED"),plan_observation_ref:required(plan.observation_ref,"PLAN_REALITY_PLAN_OBSERVATION_REQUIRED"),reality_observation_ref:required(reality.observation_ref,"PLAN_REALITY_REALITY_OBSERVATION_REQUIRED"),request_id:scope.request_id,company_id:scope.company_id,scope_id:scope.scope_id,scope_digest:scope.scope_digest,evidence_as_of:input.evaluation_scope.evidence_as_of,comparison_status,disposition,reason_codes:Object.freeze([...new Set(reasons)].sort()),supports_element_alignment:claimsEqual,establishes_deviation:deviation,establishes_drifting:false as const,establishes_misalignment:false as const,evidence_refs,qualification_refs,provenance_refs,causal_lineage_refs};
  const comparison_digest=await sha(semantic);
  return freeze({...semantic,comparison_id:`governed-plan-reality-element-comparison:sha256:${comparison_digest}`,comparison_digest,digest_algorithm:"SHA-256"as const,element_level_only:true as const,scope_aggregation_performed:false as const,source_identity_independent:true as const,observational_only:true as const,recommended:false as const,executable:false as const,grants_authority:false as const,grants_execution:false as const});
}

export async function verifyGovernedPlanRealityElementComparisonV1(value:GovernedPlanRealityElementComparisonV1):Promise<void>{
  const{comparison_id,comparison_digest,digest_algorithm,element_level_only,scope_aggregation_performed,source_identity_independent,observational_only,recommended,executable,grants_authority,grants_execution,...semantic}=value;
  const expected=await sha(semantic);
  if(comparison_digest!==expected||comparison_id!==`governed-plan-reality-element-comparison:sha256:${expected}`||digest_algorithm!=="SHA-256"||element_level_only!==true||scope_aggregation_performed!==false||source_identity_independent!==true||observational_only!==true||recommended!==false||executable!==false||grants_authority!==false||grants_execution!==false)throw new Error("PLAN_REALITY_COMPARISON_INTEGRITY_INVALID");
}
