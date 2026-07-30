import type {
  CanonicalGovernedUploadProvenanceV1,
} from "../provenance";

export const AUTHORITATIVE_EXTERNAL_DATA_VERSION = "1" as const;

export type AuthoritativeExternalDataMetadataValue =
  | string
  | number
  | boolean
  | null;

export type AuthoritativeExternalDataMetadata = Readonly<
  Record<string, AuthoritativeExternalDataMetadataValue>
>;

export interface AuthoritativeExternalData {
  readonly contractVersion: typeof AUTHORITATIVE_EXTERNAL_DATA_VERSION;
  readonly tenantId: string;
  readonly sourceIdentity: string;
  readonly acquisitionIdentity: string;
  readonly interpretationIdentity: string;
  readonly interpretationProfile: string;
  readonly interpretationVersion: string;
  readonly datasetIdentity: string;
  readonly headers: readonly string[];
  readonly rows: readonly (readonly string[])[];
  readonly extractionMetadata: AuthoritativeExternalDataMetadata;
  readonly provenance: CanonicalGovernedUploadProvenanceV1;
  readonly lineage: Readonly<{
    uploadId: string;
    uploadDigestAlgorithm: "SHA-256";
    uploadDigest: string;
    acquisitionIdentity: string;
    interpretationIdentity: string;
    datasetIdentity: string;
  }>;
}
