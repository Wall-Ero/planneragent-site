import type { OperationalSignalScopeBindingV1 } from "../../cockpit/operational.signal.evaluation.scope.v1";
import { verifyOperationalSignalEvaluationScopeV1 } from "../../cockpit/operational.signal.evaluation.scope.v1";

export const OPERATIONS_LOCATION_BINDING_POLICY_REF = "policy:operations-canonical-location-binding-v1" as const;

export type OperationsSourceLocationBindingV1 = Readonly<{
  version: 1;
  company_id: string;
  canonical_location_key: string;
  source_namespace: string;
  external_location_ref: string;
  location_kind_ref: string;
  mapping_evidence_refs: readonly string[];
  qualification_refs: readonly string[];
  provenance_refs: readonly string[];
  causal_lineage_refs: readonly string[];
  binding_id: string;
  binding_digest: string;
}>;

export type OperationsCanonicalLocationV1 = Readonly<{
  version: 1;
  policy_ref: typeof OPERATIONS_LOCATION_BINDING_POLICY_REF;
  policy_version: "1";
  tenant_id: string;
  company_id: string;
  canonical_location_key: string;
  inventory_state_granularity_ref: string;
  request_id: string;
  scope_id: string;
  scope_digest: string;
  evidence_selection_ref: string;
  source_snapshot_ref: string;
  evidence_as_of: string;
  source_bindings: readonly OperationsSourceLocationBindingV1[];
  qualification_refs: readonly string[];
  provenance_refs: readonly string[];
  causal_lineage_refs: readonly string[];
  location_id: string;
  location_digest: string;
  digest_algorithm: "SHA-256";
  identity_semantics: "EXPLICIT_GOVERNED_SOURCE_MAPPING";
  current_configured_binding: true;
  historical_remapping_supported: false;
  hierarchy_establishes_identity: false;
  observational_only: true;
  recommended: false;
  executable: false;
  grants_authority: false;
  grants_execution: false;
}>;

const forbidden = ["authority_tier", "subscription_tier", "topology_relation", "parent_location_ref", "similar_name", "address_match", "learned_mapping", "llm_mapping"];
function required(v:string|undefined,c:string){const x=v?.trim();if(!x)throw new Error(c);return x;}
function ref(v:string|undefined,c:string){const x=required(v,c);if(!/^[A-Za-z0-9][A-Za-z0-9._-]*:[^\s]+$/.test(x))throw new Error(c);return x;}
function refs(v:readonly string[],c:string){if(!Array.isArray(v))throw new Error(c);const x=[...new Set(v.map(y=>ref(y,c)))].sort();if(!x.length)throw new Error(c);return x;}
function canonical(v:unknown):string{if(Array.isArray(v))return`[${v.map(canonical).join(",")}]`;if(v&&typeof v==="object")return`{${Object.entries(v as Record<string,unknown>).filter(([,x])=>x!==undefined).sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>`${JSON.stringify(k)}:${canonical(x)}`).join(",")}}`;return JSON.stringify(v);}
async function sha(v:unknown){const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(canonical(v)));return Array.from(new Uint8Array(d),b=>b.toString(16).padStart(2,"0")).join("");}
function freeze<T>(v:T):Readonly<T>{if(v&&typeof v==="object"&&!Object.isFrozen(v)){Object.values(v as Record<string,unknown>).forEach(freeze);Object.freeze(v);}return v;}
function reject(v:object,c:string){for(const k of forbidden)if(k in (v as Record<string,unknown>))throw new Error(c);}

type BindingInput=Readonly<{source_namespace:string;external_location_ref:string;location_kind_ref:string;mapping_evidence_refs:readonly string[];qualification_refs:readonly string[];provenance_refs:readonly string[];causal_lineage_refs:readonly string[]}>;

export async function createOperationsCanonicalLocationV1(input:Readonly<{version:1;tenant_id:string;evaluation_scope:OperationalSignalScopeBindingV1;canonical_location_key:string;inventory_state_granularity_ref:string;source_bindings:readonly BindingInput[];qualification_refs:readonly string[];provenance_refs:readonly string[];causal_lineage_refs:readonly string[]}>):Promise<OperationsCanonicalLocationV1>{
  if(input.version!==1)throw new Error("OPS_LOCATION_VERSION_UNSUPPORTED");reject(input,"OPS_LOCATION_UNSAFE_INPUT");
  await verifyOperationalSignalEvaluationScopeV1(input.evaluation_scope.scope,input.evaluation_scope.scope);
  const s=input.evaluation_scope.scope,tenant_id=required(input.tenant_id,"OPS_LOCATION_TENANT_REQUIRED"),company_id=required(s.company_id,"OPS_LOCATION_COMPANY_REQUIRED"),canonical_location_key=required(input.canonical_location_key,"OPS_LOCATION_KEY_REQUIRED"),granularity=ref(input.inventory_state_granularity_ref,"OPS_LOCATION_GRANULARITY_REQUIRED");
  if(!input.source_bindings.length)throw new Error("OPS_LOCATION_BINDING_REQUIRED");
  const seen=new Set<string>(),bindings:OperationsSourceLocationBindingV1[]=[];
  for(const b of input.source_bindings){reject(b,"OPS_LOCATION_BINDING_UNSAFE_INPUT");const source_namespace=required(b.source_namespace,"OPS_LOCATION_NAMESPACE_REQUIRED"),external_location_ref=required(b.external_location_ref,"OPS_LOCATION_EXTERNAL_REF_REQUIRED"),location_kind_ref=ref(b.location_kind_ref,"OPS_LOCATION_KIND_REQUIRED");if(location_kind_ref!==granularity)throw new Error("OPS_LOCATION_GRANULARITY_MISMATCH");const k=`${company_id}|${source_namespace}|${external_location_ref}|${location_kind_ref}`;if(seen.has(k))throw new Error("OPS_LOCATION_BINDING_DUPLICATE");seen.add(k);const value={version:1 as const,company_id,canonical_location_key,source_namespace,external_location_ref,location_kind_ref,mapping_evidence_refs:refs(b.mapping_evidence_refs,"OPS_LOCATION_MAPPING_EVIDENCE_REQUIRED"),qualification_refs:refs(b.qualification_refs,"OPS_LOCATION_BINDING_QUALIFICATION_REQUIRED"),provenance_refs:refs(b.provenance_refs,"OPS_LOCATION_BINDING_PROVENANCE_REQUIRED"),causal_lineage_refs:refs(b.causal_lineage_refs,"OPS_LOCATION_BINDING_LINEAGE_REQUIRED")};const binding_digest=await sha(value);bindings.push(freeze({...value,binding_id:`operations-source-location-binding:sha256:${binding_digest}`,binding_digest}));}
  bindings.sort((a,b)=>`${a.source_namespace}|${a.external_location_ref}|${a.location_kind_ref}`.localeCompare(`${b.source_namespace}|${b.external_location_ref}|${b.location_kind_ref}`));
  const value={version:1 as const,policy_ref:OPERATIONS_LOCATION_BINDING_POLICY_REF,policy_version:"1" as const,tenant_id,company_id,canonical_location_key,inventory_state_granularity_ref:granularity,request_id:s.request_id,scope_id:s.scope_id,scope_digest:s.scope_digest,evidence_selection_ref:s.evidence_selection_ref,source_snapshot_ref:s.source_snapshot_ref,evidence_as_of:input.evaluation_scope.evidence_as_of,source_bindings:bindings,qualification_refs:refs(input.qualification_refs,"OPS_LOCATION_QUALIFICATION_REQUIRED"),provenance_refs:refs(input.provenance_refs,"OPS_LOCATION_PROVENANCE_REQUIRED"),causal_lineage_refs:refs([...input.causal_lineage_refs,...bindings.map(x=>x.binding_id)],"OPS_LOCATION_LINEAGE_REQUIRED")};const location_digest=await sha(value);return freeze({...value,location_id:`operations-canonical-location:sha256:${location_digest}`,location_digest,digest_algorithm:"SHA-256" as const,identity_semantics:"EXPLICIT_GOVERNED_SOURCE_MAPPING" as const,current_configured_binding:true as const,historical_remapping_supported:false as const,hierarchy_establishes_identity:false as const,observational_only:true as const,recommended:false as const,executable:false as const,grants_authority:false as const,grants_execution:false as const});
}

export async function verifyOperationsCanonicalLocationV1(v:OperationsCanonicalLocationV1):Promise<void>{
  const {location_id:_id,location_digest:_digest,digest_algorithm:_algorithm,identity_semantics:_identity,current_configured_binding:_current,historical_remapping_supported:_history,hierarchy_establishes_identity:_hierarchy,observational_only:_observational,recommended:_recommended,executable:_executable,grants_authority:_authority,grants_execution:_execution,...value}=v;
  for(const b of v.source_bindings){const {binding_id:_bid,binding_digest:_bd,...semantic}=b,d=await sha(semantic);if(b.binding_digest!==d||b.binding_id!==`operations-source-location-binding:sha256:${d}`||b.company_id!==v.company_id||b.canonical_location_key!==v.canonical_location_key||b.location_kind_ref!==v.inventory_state_granularity_ref)throw new Error("OPS_LOCATION_BINDING_INTEGRITY_INVALID");}
  const d=await sha(value);if(v.location_digest!==d||v.location_id!==`operations-canonical-location:sha256:${d}`||v.identity_semantics!=="EXPLICIT_GOVERNED_SOURCE_MAPPING"||v.current_configured_binding!==true||v.historical_remapping_supported!==false||v.hierarchy_establishes_identity!==false||v.observational_only!==true||v.recommended!==false||v.executable!==false||v.grants_authority!==false||v.grants_execution!==false)throw new Error("OPS_LOCATION_INTEGRITY_INVALID");
}

export async function resolveOperationsCanonicalLocationV1(input:Readonly<{version:1;tenant_id:string;company_id:string;source_namespace:string;external_location_ref:string;location_kind_ref:string;evidence_as_of:string;candidates:readonly OperationsCanonicalLocationV1[]}>):Promise<OperationsCanonicalLocationV1>{
  if(input.version!==1)throw new Error("OPS_LOCATION_RESOLUTION_VERSION_UNSUPPORTED");const namespace=required(input.source_namespace,"OPS_LOCATION_RESOLUTION_NAMESPACE_REQUIRED"),external=required(input.external_location_ref,"OPS_LOCATION_RESOLUTION_REF_REQUIRED"),kind=ref(input.location_kind_ref,"OPS_LOCATION_RESOLUTION_KIND_REQUIRED");
  await Promise.all(input.candidates.map(verifyOperationsCanonicalLocationV1));const matches=input.candidates.filter(x=>x.tenant_id===input.tenant_id&&x.company_id===input.company_id&&x.evidence_as_of===input.evidence_as_of&&x.source_bindings.some(b=>b.source_namespace===namespace&&b.external_location_ref===external&&b.location_kind_ref===kind));if(matches.length!==1)throw new Error(matches.length?"OPS_LOCATION_RESOLUTION_AMBIGUOUS":"OPS_LOCATION_RESOLUTION_NOT_FOUND");return matches[0]!;
}
