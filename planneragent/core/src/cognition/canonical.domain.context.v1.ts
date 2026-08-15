import { createOperationalDomainEvidenceProfileV1, type OperationalDomainEvidenceProfileV1 } from "./canonical.operational.roles.v1";
import { verifyCanonicalDomainInterventionProfileV1, type CanonicalDomainInterventionProfileV1 } from "./canonical.domain.intervention.profile.v1";

export type CanonicalDomainContextBindingV1=Readonly<{
  version:1;domain_ref:string;domain_semantic_profile_ref:string;domain_semantic_profile_version:string;
  evidence_profile_ref:string;evidence_profile_version:string;evidence_profile_id:string;evidence_profile_digest:string;
  intervention_profile_ref:string;intervention_profile_version:string;intervention_profile_id:string;intervention_profile_digest:string;
  policy_ref:string;qualification_refs:readonly string[];domain_context_id:string;domain_context_digest:string;digest_algorithm:"SHA-256";
  declarative_only:true;establishes_current_truth:false;recommended:false;grants_authority:false;grants_execution:false;
}>;

function required(v:string|undefined,c:string){const n=v?.trim();if(!n)throw new Error(c);return n;}
function ref(v:string|undefined,c:string){const n=required(v,c);if(!/^[A-Za-z0-9][A-Za-z0-9._-]*:[^\s]+$/.test(n))throw new Error(c);return n;}
function refs(v:readonly string[],c:string){if(!Array.isArray(v))throw new Error(c);const n=[...new Set(v.map(x=>ref(x,c)))].sort();if(!n.length)throw new Error(c);return n;}
function canonical(v:unknown):string{if(Array.isArray(v))return`[${v.map(canonical).join(",")}]`;if(v&&typeof v==="object")return`{${Object.entries(v as Record<string,unknown>).filter(([,x])=>x!==undefined).sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>`${JSON.stringify(k)}:${canonical(x)}`).join(",")}}`;return JSON.stringify(v);}
async function sha(v:unknown){const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(canonical(v)));return Array.from(new Uint8Array(d),b=>b.toString(16).padStart(2,"0")).join("");}
function freeze<T>(v:T):Readonly<T>{if(v&&typeof v==="object"&&!Object.isFrozen(v)){Object.values(v as Record<string,unknown>).forEach(freeze);Object.freeze(v);}return v;}
function semantic(v:CanonicalDomainContextBindingV1){const {domain_context_id:_id,domain_context_digest:_digest,digest_algorithm:_algorithm,declarative_only:_declarative,establishes_current_truth:_truth,recommended:_recommended,grants_authority:_authority,grants_execution:_execution,...value}=v;return value;}

export async function createCanonicalDomainContextBindingV1(input:Readonly<{version:1;domain_ref:string;domain_semantic_profile_ref:string;domain_semantic_profile_version:string;evidence_profile:OperationalDomainEvidenceProfileV1;intervention_profile:CanonicalDomainInterventionProfileV1;policy_ref:string;qualification_refs:readonly string[]}>):Promise<CanonicalDomainContextBindingV1>{
  if(input.version!==1)throw new Error("DOMAIN_CONTEXT_VERSION_UNSUPPORTED");
  const evidence=await createOperationalDomainEvidenceProfileV1(input.evidence_profile);await verifyCanonicalDomainInterventionProfileV1(input.intervention_profile);
  const domain_ref=ref(input.domain_ref,"DOMAIN_CONTEXT_DOMAIN_INVALID");
  if(evidence.profile_id!==input.evidence_profile.profile_id||evidence.profile_digest!==input.evidence_profile.profile_digest)throw new Error("DOMAIN_CONTEXT_EVIDENCE_INTEGRITY_INVALID");
  if(evidence.domain_ref!==domain_ref||input.intervention_profile.domain_ref!==domain_ref)throw new Error("DOMAIN_CONTEXT_DOMAIN_MISMATCH");
  if(input.intervention_profile.domain_profile_ref!==evidence.profile_ref||input.intervention_profile.domain_profile_version!==evidence.profile_version||input.intervention_profile.evidence_profile_digest!==evidence.profile_digest)throw new Error("DOMAIN_CONTEXT_PROFILE_BINDING_MISMATCH");
  const value={version:1 as const,domain_ref,domain_semantic_profile_ref:ref(input.domain_semantic_profile_ref,"DOMAIN_CONTEXT_SEMANTIC_PROFILE_INVALID"),domain_semantic_profile_version:required(input.domain_semantic_profile_version,"DOMAIN_CONTEXT_SEMANTIC_VERSION_INVALID"),evidence_profile_ref:evidence.profile_ref,evidence_profile_version:evidence.profile_version,evidence_profile_id:evidence.profile_id,evidence_profile_digest:evidence.profile_digest,intervention_profile_ref:input.intervention_profile.binding_profile_ref,intervention_profile_version:input.intervention_profile.binding_profile_version,intervention_profile_id:input.intervention_profile.binding_profile_id,intervention_profile_digest:input.intervention_profile.binding_profile_digest,policy_ref:ref(input.policy_ref,"DOMAIN_CONTEXT_POLICY_INVALID"),qualification_refs:refs(input.qualification_refs,"DOMAIN_CONTEXT_QUALIFICATION_REQUIRED")};
  const domain_context_digest=await sha(value);return freeze({...value,domain_context_id:`canonical-domain-context:sha256:${domain_context_digest}`,domain_context_digest,digest_algorithm:"SHA-256" as const,declarative_only:true as const,establishes_current_truth:false as const,recommended:false as const,grants_authority:false as const,grants_execution:false as const});
}

export async function verifyCanonicalDomainContextBindingV1(value:CanonicalDomainContextBindingV1):Promise<void>{const d=await sha(semantic(value));if(value.domain_context_digest!==d||value.domain_context_id!==`canonical-domain-context:sha256:${d}`)throw new Error("DOMAIN_CONTEXT_INTEGRITY_INVALID");if(value.digest_algorithm!=="SHA-256"||value.declarative_only!==true||value.establishes_current_truth!==false||value.recommended!==false||value.grants_authority!==false||value.grants_execution!==false)throw new Error("DOMAIN_CONTEXT_BOUNDARY_INVALID");}
