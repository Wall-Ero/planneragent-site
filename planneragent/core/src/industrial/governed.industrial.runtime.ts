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
  type CanonicalGovernedUploadProvenanceFailureCode,
  type GovernedInterpretationContentReaderV1,
  type GovernedInterpretationInputFailureCode,
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

    try {
      await dependencies.admission_repository.recordAdmission(
        Object.freeze({
          admitted_object_id: input.admitted_object_id,
          acquisition_id: input.acquisition_id,
        }),
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
        input.admitted_object_id,
      );
    } catch (error) {
      return denied(
        "VERIFICATION",
        error instanceof GovernedUploadVerificationError
          ? error.code
          : "GOVERNED_RUNTIME_FAILED",
      );
    }

    const assembled = assembleCanonicalGovernedUploadProvenanceV1(
      verification,
    );
    if (!assembled.assembled) {
      return denied("PROVENANCE", assembled.failure);
    }
    if (input.expected_format === "CSV") {
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
      const interpreted = await interpretAdmittedCsv(created.input);
      if (!interpreted.interpreted) {
        return denied("INTERPRETATION", interpreted.denial);
      }
      const constructed = constructAuthoritativeExternalData(
        interpreted.extraction,
      );
      return constructed.constructed
        ? Object.freeze({ completed: true, data: constructed.data })
        : denied(
          "DATA_CONSTRUCTION",
          "GOVERNED_RUNTIME_DATA_CONSTRUCTION_FAILED",
        );
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
