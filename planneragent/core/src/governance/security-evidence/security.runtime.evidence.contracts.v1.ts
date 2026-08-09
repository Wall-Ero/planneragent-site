import type { CredentialResolutionPermitV1, ProviderRuntimeBindingReferenceV1 } from '../provider-trust';

export type SecurityRuntimeEvidenceFailureCodeV1 =
	| 'SECURITY_EVIDENCE_CREDENTIAL_REQUEST_INVALID'
	| 'SECURITY_EVIDENCE_ADMISSION_MISMATCH'
	| 'SECURITY_EVIDENCE_PERMIT_MISMATCH'
	| 'SECURITY_EVIDENCE_BINDING_MISMATCH'
	| 'SECURITY_EVIDENCE_CREDENTIAL_REFERENCE_MISMATCH'
	| 'SECURITY_EVIDENCE_CREDENTIAL_ACCESS_DENIED'
	| 'SECURITY_EVIDENCE_CREDENTIAL_RESOLUTION_FAILED'
	| 'SECURITY_EVIDENCE_ATTEMPT_INVALID'
	| 'SECURITY_EVIDENCE_ATTEMPT_LINEAGE_INVALID'
	| 'SECURITY_EVIDENCE_FALLBACK_LINEAGE_INVALID'
	| 'SECURITY_EVIDENCE_TRANSPORT_REFERENCE_INVALID'
	| 'SECURITY_EVIDENCE_PERSISTENCE_FAILED'
	| 'SECURITY_EVIDENCE_AUDIT_FAILED';
export class SecurityRuntimeEvidenceFailureV1 extends Error { constructor(readonly code:SecurityRuntimeEvidenceFailureCodeV1){super(code);this.name='SecurityRuntimeEvidenceFailureV1';} }
export type CredentialAccessOutcomeV1='NOT_APPLICABLE'|'RESOLUTION_SUCCEEDED'|'RESOLUTION_FAILED'|'RESOLUTION_DENIED';
export interface SecurityEvidenceContextV1 { readonly admission_id:string;readonly admission_digest:string;readonly runtime_binding_id:string;readonly runtime_binding_digest:string;readonly oks_consumption_id:string;readonly correlation_id:string;readonly causal_references:readonly string[]; }
export interface CredentialAccessEvidenceV1 { readonly version:1;readonly evidence_id:string;readonly admission_id:string;readonly admission_digest:string;readonly permit_digest:string;readonly runtime_binding_id:string;readonly runtime_binding_digest:string;readonly provider:string;readonly provider_account_id:string;readonly provider_deployment_id:string;readonly adapter_identity:string;readonly credential_reference:string;readonly outcome:CredentialAccessOutcomeV1;readonly attempted_at:string;readonly completed_at:string;readonly failure_code?:string;readonly correlation_id:string;readonly causal_references:readonly string[]; }
export type ProviderRuntimeAttemptOutcomeV1='GOVERNANCE_DENIED'|'CONFIGURATION_FAILED'|'CREDENTIAL_RESOLUTION_FAILED'|'TRANSPORT_FAILED'|'TRANSPORT_SUCCEEDED'|'CREDENTIAL_NOT_APPLICABLE';
export interface ProviderRuntimeAttemptEvidenceV1 { readonly version:1;readonly attempt_id:string;readonly request_id:string;readonly sequence:number;readonly predecessor_attempt_id?:string;readonly runtime_binding_id?:string;readonly runtime_binding_digest?:string;readonly admission_id?:string;readonly admission_digest?:string;readonly oks_consumption_id?:string;readonly credential_access_evidence_id?:string;readonly provider:string;readonly provider_account_id?:string;readonly provider_deployment_id?:string;readonly adapter_identity?:string;readonly model:string;readonly outcome:ProviderRuntimeAttemptOutcomeV1;readonly failure_class?:'GOVERNANCE'|'CONFIGURATION'|'TECHNICAL';readonly failure_code?:string;readonly transport_evidence_id?:string;readonly started_at:string;readonly completed_at:string;readonly correlation_id:string;readonly causal_references:readonly string[]; }
export interface ProviderRuntimeFallbackLineageV1 { readonly lineage_id:string;readonly predecessor_attempt_id:string;readonly successor_attempt_id:string;readonly reason:'TECHNICAL_FAILURE';readonly linked_at:string;readonly correlation_id:string; }
export interface SecurityRuntimeEvidenceRepositoryV1 { persistCredential(e:CredentialAccessEvidenceV1):Promise<void>;persistAttempt(e:ProviderRuntimeAttemptEvidenceV1):Promise<void>;persistFallback(e:ProviderRuntimeFallbackLineageV1):Promise<void>; }
export interface GovernedCredentialResolutionInputV1 { readonly binding:ProviderRuntimeBindingReferenceV1;readonly permit?:CredentialResolutionPermitV1;readonly context?:SecurityEvidenceContextV1; }
