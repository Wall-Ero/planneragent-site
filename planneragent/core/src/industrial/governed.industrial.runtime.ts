import { types } from "node:util";
import type {
  GovernedUploadOperationalContextV1,
} from "../operational-identity/contracts/track-a.v1";
import {
  GovernedUploadVerificationError,
  type GovernedUploadVerificationFailureCode,
  type GovernedUploadVerificationResultV1,
} from "../operational-identity/verification";
import {
  acquireUntrustedFileSecurely,
  type SecureFileAcquisitionDenial,
  type SecureFileAcquisitionServices,
  type UntrustedFileUpload,
} from "./acquisition/secure.file.acquisition";
import type {
  AuthoritativeExternalData,
} from "./interpretation/authoritative.external.data";
import {
  constructAuthoritativeExternalData,
  interpretAdmittedCsv,
  type CsvInterpretationConfiguration,
  type CsvInterpretationDenial,
  type VerifiedCsvContent,
} from "./interpretation/governed.csv.interpretation";
import {
  constructTxtDatAuthoritativeExternalData,
  interpretAdmittedTxtDat,
  type TxtDatInterpretationConfiguration,
  type TxtDatInterpretationDenial,
  type VerifiedTxtDatContent,
} from "./interpretation/governed.flatfile.interpretation";
import {
  assembleCanonicalGovernedUploadProvenanceV1,
  createVerifiedGovernedInterpretationInputV1,
  verifyAdmissionCoherenceV1,
  type CanonicalGovernedUploadProvenanceFailureCode,
  type GovernedInterpretationContentReaderV1,
  type GovernedInterpretationInputFailureCode,
  type VerifiedAdmissionCoherenceInputV1,
} from "./provenance";

type Admitted = Extract<
  Awaited<ReturnType<typeof acquireUntrustedFileSecurely>>,
  { disposition: "ADMITTED_FOR_GOVERNED_INTERPRETATION" }
>;

export interface GovernedIndustrialRuntimeDependencies {
  readonly acquisition_services: SecureFileAcquisitionServices;
  readonly admission_repository: Readonly<{
    recordAdmission(
      ids: Readonly<{
        admitted_object_id: string;
        acquisition_id: string;
      }>,
      context: GovernedUploadOperationalContextV1,
      result: Admitted,
      recordedAt: string,
    ): Promise<void>;
  }>;
  readonly verifier: Readonly<{
    verify(admittedObjectId: string):
      Promise<GovernedUploadVerificationResultV1>;
  }>;
  readonly content_reader: GovernedInterpretationContentReaderV1<
    VerifiedCsvContent | VerifiedTxtDatContent
  >;
  readonly now: () => number;
}

interface GovernedIndustrialRuntimeInputBase {
  readonly version: 1;
  readonly upload: UntrustedFileUpload;
  readonly governed_context: GovernedUploadOperationalContextV1;
  readonly admitted_object_id: string;
  readonly acquisition_id: string;
}

export type GovernedIndustrialRuntimeInput =
  | Readonly<GovernedIndustrialRuntimeInputBase & {
      expected_format: "CSV";
      adapter_configuration: CsvInterpretationConfiguration;
    }>
  | Readonly<GovernedIndustrialRuntimeInputBase & {
      expected_format: "TXT_DAT";
      adapter_configuration: TxtDatInterpretationConfiguration;
    }>;

export type GovernedIndustrialRuntimeFailure =
  | SecureFileAcquisitionDenial
  | GovernedUploadVerificationFailureCode
  | CanonicalGovernedUploadProvenanceFailureCode
  | GovernedInterpretationInputFailureCode
  | CsvInterpretationDenial
  | TxtDatInterpretationDenial
  | "GOVERNED_RUNTIME_INPUT_INVALID"
  | "GOVERNED_RUNTIME_FORMAT_UNSUPPORTED"
  | "GOVERNED_RUNTIME_ADMISSION_RECORDING_FAILED"
  | "GOVERNED_RUNTIME_DATA_CONSTRUCTION_FAILED"
  | "GOVERNED_RUNTIME_FAILED";

export type GovernedIndustrialRuntimeResult =
  | Readonly<{
      completed: true;
      data: AuthoritativeExternalData;
    }>
  | Readonly<{
      completed: false;
      stage:
        | "INPUT"
        | "ACQUISITION"
        | "ADMISSION_RECORDING"
        | "VERIFICATION"
        | "PROVENANCE"
        | "INTERPRETATION_INPUT"
        | "INTERPRETATION"
        | "DATA_CONSTRUCTION";
      failure: GovernedIndustrialRuntimeFailure;
    }>;

function denied(
  stage: Extract<GovernedIndustrialRuntimeResult, {
    completed: false;
  }>["stage"],
  failure: GovernedIndustrialRuntimeFailure,
): GovernedIndustrialRuntimeResult {
  return Object.freeze({ completed: false, stage, failure });
}

function validInput(input: GovernedIndustrialRuntimeInput): boolean {
  return input?.version === 1 &&
    typeof input.admitted_object_id === "string" &&
    input.admitted_object_id.length > 0 &&
    typeof input.acquisition_id === "string" &&
    input.acquisition_id.length > 0 &&
    input.admitted_object_id !== input.acquisition_id &&
    !!input.upload &&
    !!input.governed_context &&
    (input.expected_format === "CSV" ||
      input.expected_format === "TXT_DAT") &&
    !!input.adapter_configuration;
}

const csvIngestionProofs = new WeakMap<
  AuthoritativeExternalData,
  VerifiedAdmissionCoherenceInputV1
>();

function isFrozenData(value: unknown, ancestors = new Set<object>()): boolean {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "object" || !Object.isFrozen(value) || ancestors.has(value)) return false;

  const array = Array.isArray(value);
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== (array ? Array.prototype : Object.prototype)) return false;
  ancestors.add(value);
  const valid = Reflect.ownKeys(value).every(key => {
    const field = Object.getOwnPropertyDescriptor(value, key);
    return typeof key === "string" && !!field && Object.hasOwn(field, "value") &&
      (field.enumerable || (array && key === "length")) &&
      isFrozenData(field.value, ancestors);
  });
  ancestors.delete(value);
  return valid;
}

function acceptsCsvArtifacts(admission: Admitted, verification: GovernedUploadVerificationResultV1): boolean {
  const artifacts = Object.freeze({ admission, verification });
  try {
    if (!isFrozenData(artifacts)) return false;
    // Check the entire input graph, keeping the original artifacts for coherence verification.
    // Reflection can execute traps. These dependencies belong to the trusted Core boundary.
    structuredClone(artifacts);
    return true;
  } catch {
    return false;
  }
}

const typedArrayBuffer = Object.getOwnPropertyDescriptor(
  Object.getPrototypeOf(Uint8Array.prototype), "buffer",
)!.get!;

function privateCsvReader(
  reader: GovernedIndustrialRuntimeDependencies["content_reader"],
): GovernedInterpretationContentReaderV1<VerifiedCsvContent> {
  return {
    async readVerifiedContent(request) {
      const content = await reader.readVerifiedContent(request);
      const source = content?.bytes;
      if (!types.isUint8Array(source) || !types.isArrayBuffer(typedArrayBuffer.call(source))) {
        return null;
      }
      // Copy the typed array's elements without using its iterator or species.
      // The interpreter alone receives the resulting private buffer.
      return Object.freeze({ bytes: new Uint8Array(source) });
    },
  };
}

/** Internal lookup scoped to the exact CSV object in this module instance. */
export function lookupCsvIngestionProofV1(candidate: unknown) {
  if (typeof candidate !== "object" || candidate === null) return undefined;
  const data = candidate as AuthoritativeExternalData;
  const evidence = csvIngestionProofs.get(data);
  if (!evidence) return undefined;

  try {
    const coherence = verifyAdmissionCoherenceV1(evidence);
    if (!coherence.coherent) return undefined;
    const identity = evidence.provenance.chain_head.previous.previous.facts;
    return Object.freeze({
      tenant_id: identity.tenant_id,
      company_id: identity.company_id,
      admitted_object_id: coherence.admitted_object_id,
      acquisition_id: coherence.acquisition_id,
      source_identity: data.sourceIdentity,
      interpretation_identity: data.interpretationIdentity,
      dataset_identity: data.datasetIdentity,
      chain_head_attestation_id: coherence.chain_head_attestation_id,
    });
  } catch {
    return undefined;
  }
}

export async function runGovernedIndustrialRuntime(
  input: GovernedIndustrialRuntimeInput,
  dependencies: GovernedIndustrialRuntimeDependencies,
): Promise<GovernedIndustrialRuntimeResult> {
  if (!validInput(input) || !dependencies ||
    typeof dependencies.now !== "function") {
    return denied("INPUT", "GOVERNED_RUNTIME_INPUT_INVALID");
  }
  try {
    const admission = await acquireUntrustedFileSecurely(
      input.upload,
      dependencies.acquisition_services,
      dependencies.now,
    );
    if (!admission.processed) {
      return denied("ACQUISITION", admission.denial);
    }
    if (admission.disposition !==
      "ADMITTED_FOR_GOVERNED_INTERPRETATION" ||
      admission.reference.detectedFormat !== input.expected_format) {
      return denied("ACQUISITION", "GOVERNED_RUNTIME_FORMAT_UNSUPPORTED");
    }

    const recordedIds = Object.freeze({
      admitted_object_id: input.admitted_object_id,
      acquisition_id: input.acquisition_id,
    });
    try {
      await dependencies.admission_repository.recordAdmission(
        recordedIds,
        input.governed_context,
        admission,
        new Date(dependencies.now()).toISOString(),
      );
    } catch {
      return denied(
        "ADMISSION_RECORDING",
        "GOVERNED_RUNTIME_ADMISSION_RECORDING_FAILED",
      );
    }

    let verification: GovernedUploadVerificationResultV1;
    try {
      verification = await dependencies.verifier.verify(
        recordedIds.admitted_object_id,
      );
    } catch (error) {
      return denied(
        "VERIFICATION",
        error instanceof GovernedUploadVerificationError
          ? error.code
          : "GOVERNED_RUNTIME_FAILED",
      );
    }

    const isCsv = input.expected_format === "CSV";
    if (isCsv) {
      if (!acceptsCsvArtifacts(admission, verification)) {
        return denied("INTERPRETATION_INPUT", "INTERPRETATION_ADMISSION_INCOHERENT");
      }
      if (verification.admitted_object_id !== recordedIds.admitted_object_id ||
        verification.acquisition_id !== recordedIds.acquisition_id) {
        return denied("VERIFICATION", "ACQUISITION_LINEAGE_SUBSTITUTED");
      }
    }
    const assembled = assembleCanonicalGovernedUploadProvenanceV1(
      verification,
    );
    if (!assembled.assembled) {
      return denied("PROVENANCE", assembled.failure);
    }
    if (isCsv) {
      const reader = dependencies.content_reader;
      const created = createVerifiedGovernedInterpretationInputV1({
        version: 1,
        admission,
        verification,
        provenance: assembled.provenance,
        content_reader: typeof reader?.readVerifiedContent === "function"
          ? privateCsvReader(reader)
          : reader,
        adapter_configuration: input.adapter_configuration,
      });
      if (!created.created) {
        return denied("INTERPRETATION_INPUT", created.failure);
      }
      const interpreted = await interpretAdmittedCsv(created.input);
      if (!interpreted.interpreted) {
        return denied("INTERPRETATION", interpreted.denial);
      }
      const constructed = constructAuthoritativeExternalData(
        interpreted.extraction,
      );
      if (!constructed.constructed) {
        return denied(
          "DATA_CONSTRUCTION",
          "GOVERNED_RUNTIME_DATA_CONSTRUCTION_FAILED",
        );
      }
      csvIngestionProofs.set(constructed.data, Object.freeze({
        version: 1,
        admission: created.input.admission,
        verification: created.input.verification,
        provenance: created.input.canonical_provenance,
      }));
      return Object.freeze({ completed: true, data: constructed.data });
    }

    const created = createVerifiedGovernedInterpretationInputV1({
      version: 1,
      admission,
      verification,
      provenance: assembled.provenance,
      content_reader: dependencies.content_reader,
      adapter_configuration: input.adapter_configuration,
    });
    if (!created.created) {
      return denied("INTERPRETATION_INPUT", created.failure);
    }
    const interpreted = await interpretAdmittedTxtDat(created.input);
    if (!interpreted.interpreted) {
      return denied("INTERPRETATION", interpreted.denial);
    }
    const constructed = constructTxtDatAuthoritativeExternalData(
      interpreted.extraction,
    );
    return constructed.constructed
      ? Object.freeze({ completed: true, data: constructed.data })
      : denied(
        "DATA_CONSTRUCTION",
        "GOVERNED_RUNTIME_DATA_CONSTRUCTION_FAILED",
      );
  } catch {
    return denied("INPUT", "GOVERNED_RUNTIME_FAILED");
  }
}
