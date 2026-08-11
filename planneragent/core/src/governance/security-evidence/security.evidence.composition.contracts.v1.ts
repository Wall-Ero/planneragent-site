import type {
	CredentialAccessEvidenceV1,
	ProviderRuntimeAttemptEvidenceV1,
	ProviderRuntimeFallbackLineageV1,
} from './security.runtime.evidence.contracts.v1';
import type { SecurityEvidenceApplicabilityV1, KnowledgeExposureAuthorityEvidenceV1 } from '../knowledge-exposure';
import type { RuntimeProviderTrustAdmissionV1, ProviderRuntimeBindingV1 } from '../provider-trust';
import type { CognitiveTransportEvidenceV1 } from '../knowledge-exposure/transport/cognitive.transport.contracts.v1';

export const SECURITY_EVIDENCE_COMPOSITION_RESULTS_V1 = ['VERIFIED', 'DENIED', 'INCOMPLETE'] as const;
export type SecurityEvidenceCompositionResultV1 = (typeof SECURITY_EVIDENCE_COMPOSITION_RESULTS_V1)[number];

export const SECURITY_EVIDENCE_EDGE_INTEGRITIES_V1 = [
	'CRYPTOGRAPHICALLY_BOUND',
	'DIGEST_BOUND',
	'IDENTITY_REFERENCED',
	'APPLICABILITY_ASSERTED',
] as const;
export type SecurityEvidenceEdgeIntegrityV1 = (typeof SECURITY_EVIDENCE_EDGE_INTEGRITIES_V1)[number];

export const SECURITY_EVIDENCE_OPERATION_OUTCOMES_V1 = [
	'COMPLETED',
	'COMPLETED_AFTER_TECHNICAL_FALLBACK',
	'GOVERNANCE_DENIED',
	'CONFIGURATION_DENIED',
	'CREDENTIAL_DENIED',
	'CREDENTIAL_FAILED',
	'TRANSPORT_FAILED',
	'CREDENTIAL_NOT_APPLICABLE',
] as const;
export type SecurityEvidenceOperationOutcomeV1 = (typeof SECURITY_EVIDENCE_OPERATION_OUTCOMES_V1)[number];

export type SecurityEvidenceHistoricalValidityV1 = 'VALID_AT_OPERATION_TIME' | 'CURRENT_NOW';
export type SecurityEvidenceAuthorityRequirementV1 = 'NOT_APPLICABLE' | 'REQUIRED';

export type SecurityEvidenceCompositionFailureCodeV1 =
	| 'SECURITY_COMPOSITION_INCOMPLETE' | 'SECURITY_COMPOSITION_DENIED' | 'SECURITY_COMPOSITION_IDENTITY_MISMATCH'
	| 'SECURITY_COMPOSITION_TENANT_MISMATCH' | 'SECURITY_COMPOSITION_COMPANY_MISMATCH'
	| 'SECURITY_COMPOSITION_PRINCIPAL_MISMATCH' | 'SECURITY_COMPOSITION_SESSION_MISMATCH'
	| 'SECURITY_COMPOSITION_OKS_REQUEST_MISMATCH' | 'SECURITY_COMPOSITION_OKS_DECISION_MISMATCH'
	| 'SECURITY_COMPOSITION_PROJECTION_MISMATCH' | 'SECURITY_COMPOSITION_CONSUMPTION_MISMATCH'
	| 'SECURITY_COMPOSITION_AUTHORITY_REQUIRED' | 'SECURITY_COMPOSITION_AUTHORITY_MISMATCH'
	| 'SECURITY_COMPOSITION_AUTHORITY_APPLICABILITY_CONFLICT' | 'SECURITY_COMPOSITION_PT_ADMISSION_MISMATCH'
	| 'SECURITY_COMPOSITION_RUNTIME_BINDING_MISMATCH' | 'SECURITY_COMPOSITION_RUNTIME_BINDING_DIGEST_MISMATCH'
	| 'SECURITY_COMPOSITION_CREDENTIAL_EVIDENCE_MISMATCH' | 'SECURITY_COMPOSITION_ATTEMPT_MISMATCH'
	| 'SECURITY_COMPOSITION_TRANSPORT_MISMATCH' | 'SECURITY_COMPOSITION_FALLBACK_LINEAGE_INVALID'
	| 'SECURITY_COMPOSITION_TEMPORAL_ORDER_INVALID' | 'SECURITY_COMPOSITION_P9_APPLICABILITY_MISMATCH'
	| 'SECURITY_COMPOSITION_P9_REFERENCE_INVALID' | 'SECURITY_COMPOSITION_COMPOSITION_DIGEST_MISMATCH';

export class SecurityEvidenceCompositionFailureV1 extends Error {
	constructor(readonly code: SecurityEvidenceCompositionFailureCodeV1) { super(code); this.name = 'SecurityEvidenceCompositionFailureV1'; }
}

export type SecurityEvidenceDomainV1 =
	| 'IDENTITY' | 'AUTHORITY_APPLICABILITY' | 'ORGANIZATIONAL_AUTHORITY' | 'OKS_REQUEST' | 'OKS_DECISION'
	| 'OKS_PROJECTION' | 'OKS_CONSUMPTION' | 'PT_ADMISSION' | 'RUNTIME_BINDING' | 'CREDENTIAL_ACCESS'
	| 'RUNTIME_ATTEMPT' | 'COGNITIVE_TRANSPORT' | 'FALLBACK_LINEAGE' | 'P9_APPLICABILITY';

export interface SecurityEvidenceEndpointV1 {
	readonly domain: SecurityEvidenceDomainV1;
	readonly evidence_id: string;
	readonly digest?: string;
}
export interface SecurityEvidenceEdgeV1 {
	readonly version: 1; readonly edge_id: string;
	readonly source: SecurityEvidenceEndpointV1; readonly target: SecurityEvidenceEndpointV1;
	readonly integrity: SecurityEvidenceEdgeIntegrityV1; readonly causal_relation: string;
	readonly referenced_at?: string;
}
export interface SecurityEvidenceAttemptReferenceV1 {
	readonly attempt_id: string; readonly sequence: number; readonly outcome: ProviderRuntimeAttemptEvidenceV1['outcome'];
	readonly predecessor_attempt_id?: string;
	readonly admission_id?: string; readonly admission_digest?: string; readonly runtime_binding_id?: string;
	readonly runtime_binding_digest?: string; readonly credential_access_evidence_id?: string;
	readonly transport_evidence_id?: string;
}
export interface SecurityEvidenceFallbackReferenceV1 {
	readonly fallback_edge_id: string; readonly request_id: string; readonly predecessor_attempt_id: string;
	readonly successor_attempt_id: string; readonly reason: ProviderRuntimeFallbackLineageV1['reason'];
}
export interface SecurityEvidenceCompositionSemanticV1 {
	readonly version: 1; readonly request_id: string;
	readonly principal_id?: string; readonly session_id?: string; readonly tenant_id: string; readonly company_id: string;
	readonly oks_request_id: string; readonly oks_decision_id: string; readonly projection_id: string;
	readonly projection_digest: string; readonly oks_consumption_id: string;
	readonly organizational_authority: Readonly<{ applicability_evidence_id: string; requirement: SecurityEvidenceAuthorityRequirementV1;
		authority_evidence_id?: string; authority_proof_id?: string; authority_proof_digest?: string }>;
	readonly p9: Readonly<{ applicability_evidence_id: string; status: 'NOT_APPLICABLE' }>;
	readonly pt_admissions: readonly Readonly<{ admission_id: string; admission_digest: string }>[];
	readonly runtime_bindings: readonly Readonly<{ runtime_binding_id: string; runtime_binding_digest: string }>[];
	readonly credential_access_evidence_ids: readonly string[];
	readonly attempts: readonly SecurityEvidenceAttemptReferenceV1[];
	readonly transport_evidence_ids: readonly string[];
	readonly fallback_edges: readonly SecurityEvidenceFallbackReferenceV1[];
	readonly edges: readonly SecurityEvidenceEdgeV1[];
	readonly final_outcome: SecurityEvidenceOperationOutcomeV1;
	readonly verification_result: SecurityEvidenceCompositionResultV1;
	readonly historical_validity_basis: SecurityEvidenceHistoricalValidityV1;
	readonly composed_at: string; readonly causal_lineage: readonly string[];
}
export interface SecurityEvidenceCompositionV1 extends SecurityEvidenceCompositionSemanticV1 {
	readonly composition_id: string; readonly composition_digest: string;
}

// Compile-time source compatibility: composition references remain projections of frozen source contracts.
export interface SecurityEvidenceCompositionSourceTypesV1 {
	readonly credential: CredentialAccessEvidenceV1; readonly attempt: ProviderRuntimeAttemptEvidenceV1;
	readonly fallback: ProviderRuntimeFallbackLineageV1; readonly applicability: SecurityEvidenceApplicabilityV1;
	readonly authority: KnowledgeExposureAuthorityEvidenceV1; readonly admission: RuntimeProviderTrustAdmissionV1;
	readonly binding: ProviderRuntimeBindingV1; readonly transport: CognitiveTransportEvidenceV1;
}
