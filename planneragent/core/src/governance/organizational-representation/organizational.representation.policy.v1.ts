import type { OrganizationalRepresentationScopeV1 } from "./organizational.representation.contracts.v1";
export const ORPA_SCOPES_V1:readonly OrganizationalRepresentationScopeV1[]=Object.freeze(["ACCEPT_ENTERPRISE_NDA","ACCEPT_DATA_PROCESSING_AGREEMENT","ACCEPT_PROVIDER_PROCESSING_TERMS","DEFINE_TENANT_PROVIDER_TRUST_REQUIREMENTS","APPOINT_PROCESSING_AUTHORITY","REPRESENT_LEGAL_ENTITY_FOR_PLATFORM_ONBOARDING"]);
export const ORPA_OAG_REQUIRED_SCOPES_V1:readonly OrganizationalRepresentationScopeV1[]=Object.freeze(["DEFINE_TENANT_PROVIDER_TRUST_REQUIREMENTS","APPOINT_PROCESSING_AUTHORITY"]);
export const ORPA_TRUSTED_REPRESENTATION_ISSUERS_V1=Object.freeze(["PLANNERNET_ORPA_REVIEW"]);
export const ORPA_POLICY_VERSION_V1="ORPA_POLICY_V1" as const;
export function deepFreeze<T>(v:T):T{if(v&&typeof v==="object"&&!Object.isFrozen(v)){for(const x of Object.values(v as Record<string,unknown>))deepFreeze(x);Object.freeze(v);}return v;}
