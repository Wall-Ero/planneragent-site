import type { CognitiveProviderV1, CognitiveTransportFailureCode } from "./cognitive.transport.contracts.v1";

export const PUBLIC_COGNITIVE_EXPOSURE_PURPOSE_V1 = "PUBLIC_PRODUCT_CONVERSATION" as const;
export const PUBLIC_COGNITIVE_EXPOSURE_MANIFEST_ID_V1 = "public-cognitive-exposure@1" as const;
export const PUBLIC_COGNITIVE_EXPOSURE_MAX_CONTENT_LENGTH_V1 = 32_768;

export type PublicCognitiveExposurePurposeV1 = typeof PUBLIC_COGNITIVE_EXPOSURE_PURPOSE_V1;

export type PublicCognitiveProjectionV1 = Readonly<{
  classification: "PUBLIC_SAFE";
  content: string;
}>;

export type PublicCognitiveExposureV1 = Readonly<{
  version: 1;
  trust_domain: "PUBLIC";
  scope: "REQUEST_BOUND";
  organizational_status: "NON_ORGANIZATIONAL";
  retention: "NO_RETENTION";
  purpose: PublicCognitiveExposurePurposeV1;
  request_id: string;
  consumption_id: string;
  provider: CognitiveProviderV1;
  model: string;
  projection: PublicCognitiveProjectionV1;
}>;

export type SealedPublicCognitiveExposureV1 = Readonly<{
  version: 1;
  trust_domain: "PUBLIC";
  scope: "REQUEST_BOUND";
  organizational_status: "NON_ORGANIZATIONAL";
  retention: "NO_RETENTION";
  purpose: PublicCognitiveExposurePurposeV1;
  manifest_id: typeof PUBLIC_COGNITIVE_EXPOSURE_MANIFEST_ID_V1;
  request_id: string;
  consumption_id: string;
  provider: CognitiveProviderV1;
  provider_identity: string;
  model: string;
  canonical_projection: string;
  canonical_projection_digest: string;
  request_binding_digest: string;
}>;

export type PublicCognitiveTransportEvidenceV1 = Readonly<{
  version: 1;
  evidence_id: string;
  request_id: string;
  consumption_id: string;
  projection_digest: string;
  request_digest: string;
  provider: CognitiveProviderV1;
  model: string;
  purpose: PublicCognitiveExposurePurposeV1;
  retention: "NO_RETENTION";
  dispatched_at: string;
  status: "SUCCEEDED" | "FAILED";
  response_digest?: string;
  failure_code?: CognitiveTransportFailureCode;
}>;

export interface PublicCognitiveTransportEvidenceRepositoryV1 {
  reserve(consumptionId: string, provider: CognitiveProviderV1, at: string): Promise<boolean>;
  append(evidence: PublicCognitiveTransportEvidenceV1): Promise<void>;
}

export type PublicCognitiveAdvisoryResponseV1 = Readonly<{
  version: 1;
  provider: CognitiveProviderV1;
  model: string;
  text: string;
  response_digest: string;
  usage?: Readonly<{ input_tokens?: number; output_tokens?: number }>;
  evidence: PublicCognitiveTransportEvidenceV1;
  advisory_only: true;
}>;
