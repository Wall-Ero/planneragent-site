import type { KnowledgeExposureRequestV1, KnowledgeExposureDecisionV1, KnowledgeExposureEligibilityV1, SecurityEvidenceApplicabilityV1, KnowledgeExposureAuthorityEvidenceV1 } from '../knowledge-exposure';
import type { RuntimeProviderTrustAdmissionV1, CanonicalProviderRuntimeBindingEvidenceV1 } from '../provider-trust';
import type { CognitiveTransportEvidenceV1 } from '../knowledge-exposure/transport/cognitive.transport.contracts.v1';
import type { CredentialAccessEvidenceV1, ProviderRuntimeAttemptEvidenceV1, ProviderRuntimeFallbackLineageV1 } from './security.runtime.evidence.contracts.v1';
import type { SecurityEvidenceCompositionFailureCodeV1, SecurityEvidenceCompositionV1, SecurityEvidenceHistoricalValidityV1 } from './security.evidence.composition.contracts.v1';

export const SECURITY_EVIDENCE_MISSING_CLASSES_V1 = [
	'AUTHORITY_EVIDENCE', 'OKS_EVIDENCE', 'PT_ADMISSION', 'RUNTIME_BINDING', 'CREDENTIAL_EVIDENCE',
	'RUNTIME_ATTEMPT', 'TRANSPORT_EVIDENCE', 'FALLBACK_EDGE', 'APPLICABILITY_EVIDENCE',
] as const;
export type SecurityEvidenceMissingClassV1 = (typeof SECURITY_EVIDENCE_MISSING_CLASSES_V1)[number];

export interface SecurityEvidenceComposerInputV1 {
	readonly version: 1; readonly request_id: string; readonly oks_request_id: string;
	readonly oks_request?: KnowledgeExposureRequestV1; readonly oks_decision?: KnowledgeExposureDecisionV1;
	readonly oks_eligibility?: KnowledgeExposureEligibilityV1;
	readonly organizational_authority_applicability?: SecurityEvidenceApplicabilityV1;
	readonly p9_applicability?: SecurityEvidenceApplicabilityV1;
	readonly authority_evidence?: KnowledgeExposureAuthorityEvidenceV1; readonly expected_oag_actor_id?: string;
	readonly pt_admissions: readonly RuntimeProviderTrustAdmissionV1[];
	readonly authoritative_runtime_bindings: readonly CanonicalProviderRuntimeBindingEvidenceV1[];
	readonly credential_evidence: readonly CredentialAccessEvidenceV1[];
	readonly attempts: readonly ProviderRuntimeAttemptEvidenceV1[];
	readonly transport_evidence: readonly CognitiveTransportEvidenceV1[];
	readonly fallback_edges: readonly ProviderRuntimeFallbackLineageV1[];
	readonly unexpected_p9_evidence_ids?: readonly string[];
	readonly historical_validity_basis: SecurityEvidenceHistoricalValidityV1;
	readonly composed_at: string; readonly causal_lineage: readonly string[];
}

export type SecurityEvidenceCompositionRuntimeResultV1 =
	| Readonly<{ version: 1; request_id: string; result: 'VERIFIED'; composition: SecurityEvidenceCompositionV1; failures: readonly []; missing_evidence: readonly []; evaluated_at: string; causal_lineage: readonly string[] }>
	| Readonly<{ version: 1; request_id: string; result: 'INCOMPLETE'; composition?: never; failures: readonly SecurityEvidenceCompositionFailureCodeV1[]; missing_evidence: readonly SecurityEvidenceMissingClassV1[]; evaluated_at: string; causal_lineage: readonly string[] }>
	| Readonly<{ version: 1; request_id: string; result: 'DENIED'; composition?: SecurityEvidenceCompositionV1; failures: readonly SecurityEvidenceCompositionFailureCodeV1[]; missing_evidence: readonly SecurityEvidenceMissingClassV1[]; evaluated_at: string; causal_lineage: readonly string[] }>;
