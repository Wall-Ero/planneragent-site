import type { SecureFileAcquisitionResult } from "../acquisition/secure.file.acquisition";
import type {
  GovernedUploadVerificationResultV1,
} from "../../operational-identity/verification";
import type {
  AcquisitionProvenanceAttestationV1,
  CanonicalGovernedUploadProvenanceV1,
} from "./canonical.governed-upload.provenance.v1";
import {
  verifyAdmissionCoherenceV1,
  type VerifiedAdmissionCoherenceFailureCode,
  type VerifiedAdmissionCoherenceInputV1,
} from "./verified.admission.coherence.v1";

type AdmittedUpload = Extract<SecureFileAcquisitionResult, {
  processed: true;
  disposition: "ADMITTED_FOR_GOVERNED_INTERPRETATION";
}>;

export interface VerifiedGovernedContentReadRequestV1 {
  readonly version: 1;
  readonly admitted_object_id: string;
  readonly acquisition_id: string;
  readonly upload_id: string;
  readonly quarantine_reference: string;
  readonly byte_digest: Readonly<{
    subject: "ACQUIRED_SOURCE_BYTES";
    algorithm: "SHA-256";
    value: string;
  }>;
  readonly byte_length: number;
}

export interface GovernedInterpretationContentReaderV1<TContent = unknown> {
  readVerifiedContent(
    request: VerifiedGovernedContentReadRequestV1,
  ): Promise<TContent | null>;
}

export interface CreateVerifiedGovernedInterpretationInputV1<
  TContent = unknown,
  TConfiguration extends object = Record<string, unknown>,
> extends VerifiedAdmissionCoherenceInputV1 {
  readonly content_reader: GovernedInterpretationContentReaderV1<TContent>;
  readonly adapter_configuration: TConfiguration;
}

export interface VerifiedGovernedInterpretationInputV1<
  TContent = unknown,
  TConfiguration extends object = Record<string, unknown>,
> {
  readonly version: 1;
  readonly admission: AdmittedUpload;
  readonly verification: GovernedUploadVerificationResultV1;
  readonly canonical_provenance: CanonicalGovernedUploadProvenanceV1;
  readonly acquisition_provenance: AcquisitionProvenanceAttestationV1;
  readonly content_read_request: VerifiedGovernedContentReadRequestV1;
  readonly content_reader: Readonly<GovernedInterpretationContentReaderV1<TContent>>;
  readonly adapter_configuration: Readonly<TConfiguration>;
}

export type GovernedInterpretationInputFailureCode =
  | "INTERPRETATION_INPUT_INVALID"
  | "INTERPRETATION_ADMISSION_INCOHERENT"
  | "INTERPRETATION_CONTENT_READER_INVALID"
  | "INTERPRETATION_CONFIGURATION_INVALID";

export type VerifiedGovernedInterpretationInputResultV1<
  TContent = unknown,
  TConfiguration extends object = Record<string, unknown>,
> =
  | Readonly<{
      created: true;
      input: VerifiedGovernedInterpretationInputV1<TContent, TConfiguration>;
    }>
  | Readonly<{
      created: false;
      failure: GovernedInterpretationInputFailureCode;
      coherence_failure?: VerifiedAdmissionCoherenceFailureCode;
    }>;

function denied(
  failure: GovernedInterpretationInputFailureCode,
  coherenceFailure?: VerifiedAdmissionCoherenceFailureCode,
): VerifiedGovernedInterpretationInputResultV1<any, any> {
  return Object.freeze({
    created: false,
    failure,
    ...(coherenceFailure ? { coherence_failure: coherenceFailure } : {}),
  });
}

function cloneConfiguration(value: unknown, seen = new Set<object>()): unknown {
  if (value === null || typeof value === "string" ||
    typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("CONFIGURATION_NUMBER_INVALID");
    return value;
  }
  if (!value || typeof value !== "object" || seen.has(value as object)) {
    throw new Error("CONFIGURATION_VALUE_INVALID");
  }
  seen.add(value as object);
  let clone: unknown;
  if (Array.isArray(value)) {
    clone = value.map(child => cloneConfiguration(child, seen));
  } else {
    if (Object.getPrototypeOf(value) !== Object.prototype) {
      throw new Error("CONFIGURATION_PROTOTYPE_INVALID");
    }
    const record: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      if (child === undefined || typeof child === "function" ||
        typeof child === "symbol" || typeof child === "bigint") {
        throw new Error("CONFIGURATION_VALUE_INVALID");
      }
      record[key] = cloneConfiguration(child, seen);
    }
    clone = record;
  }
  seen.delete(value as object);
  return Object.freeze(clone);
}

export function createVerifiedGovernedInterpretationInputV1<
  TContent,
  TConfiguration extends object,
>(
  value: CreateVerifiedGovernedInterpretationInputV1<TContent, TConfiguration>,
): VerifiedGovernedInterpretationInputResultV1<TContent, TConfiguration> {
  if (!value || value.version !== 1 || !value.content_reader ||
    !value.adapter_configuration) {
    return denied("INTERPRETATION_INPUT_INVALID");
  }
  const coherence = verifyAdmissionCoherenceV1(value);
  if (!coherence.coherent) {
    return denied("INTERPRETATION_ADMISSION_INCOHERENT", coherence.failure);
  }
  if (typeof value.content_reader.readVerifiedContent !== "function") {
    return denied("INTERPRETATION_CONTENT_READER_INVALID");
  }
  let configuration: Readonly<TConfiguration>;
  try {
    configuration = cloneConfiguration(
      value.adapter_configuration,
    ) as Readonly<TConfiguration>;
  } catch {
    return denied("INTERPRETATION_CONFIGURATION_INVALID");
  }

  const acquisition = value.provenance.chain_head;
  const request = Object.freeze({
    version: 1 as const,
    admitted_object_id: coherence.admitted_object_id,
    acquisition_id: coherence.acquisition_id,
    upload_id: coherence.upload_id,
    quarantine_reference: acquisition.facts.quarantine_reference,
    byte_digest: acquisition.facts.source_byte_digest,
    byte_length: acquisition.facts.byte_length,
  });
  const reader = Object.freeze({
    readVerifiedContent: value.content_reader.readVerifiedContent
      .bind(value.content_reader),
  });
  return Object.freeze({
    created: true,
    input: Object.freeze({
      version: 1 as const,
      admission: value.admission,
      verification: value.verification,
      canonical_provenance: value.provenance,
      acquisition_provenance: acquisition,
      content_read_request: request,
      content_reader: reader,
      adapter_configuration: configuration,
    }),
  });
}
