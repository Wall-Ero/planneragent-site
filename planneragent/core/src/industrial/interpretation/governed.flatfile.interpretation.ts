import { createHash } from "node:crypto";
import type {
  CanonicalGovernedUploadProvenanceV1,
  VerifiedGovernedInterpretationInputV1,
} from "../provenance";
import {
  AUTHORITATIVE_EXTERNAL_DATA_VERSION,
  type AuthoritativeExternalData,
  type AuthoritativeExternalDataMetadata,
} from "./authoritative.external.data";

export const DELIMITED_TXT_DAT_INTERPRETATION_PROFILE =
  "GOVERNED_PASSIVE_DELIMITED_TXT_DAT_V1" as const;
export const FIXED_WIDTH_TXT_DAT_INTERPRETATION_PROFILE =
  "GOVERNED_PASSIVE_FIXED_WIDTH_TXT_DAT_V1" as const;
export const TXT_DAT_INTERPRETATION_VERSION = "1" as const;

type TxtDatProfile =
  | typeof DELIMITED_TXT_DAT_INTERPRETATION_PROFILE
  | typeof FIXED_WIDTH_TXT_DAT_INTERPRETATION_PROFILE;
export interface TxtDatFieldDefinition {
  readonly name: string;
  readonly start?: number;
  readonly length?: number;
}

interface TxtDatConfigurationBase {
  readonly dataKind: "TXT" | "DAT";
  readonly newline: "\n" | "\r\n";
  readonly fields: readonly TxtDatFieldDefinition[];
  readonly maxRows: number;
  readonly maxFields: number;
  readonly maxFieldLength: number;
  readonly maxRecordLength: number;
}

export interface DelimitedTxtDatConfiguration
  extends TxtDatConfigurationBase {
  readonly layout: "DELIMITED";
  readonly delimiter: "," | ";" | "\t" | "|";
}

export interface FixedWidthTxtDatConfiguration
  extends TxtDatConfigurationBase {
  readonly layout: "FIXED_WIDTH";
}

export type TxtDatInterpretationConfiguration =
  | DelimitedTxtDatConfiguration
  | FixedWidthTxtDatConfiguration;

export interface VerifiedTxtDatContent {
  readonly bytes: Uint8Array;
}

export type VerifiedGovernedTxtDatInterpretationInputV1 =
  VerifiedGovernedInterpretationInputV1<
    VerifiedTxtDatContent,
    TxtDatInterpretationConfiguration
  >;

export type PassiveTxtDatExtractionMetadata =
  AuthoritativeExternalDataMetadata & Readonly<{
    readonly delimiter: string | null;
    readonly quote: null;
    readonly newline: "\n" | "\r\n";
    readonly encoding: "UTF-8";
    readonly headerCount: number;
    readonly rowCount: number;
    readonly byteLength: number;
    readonly formulaSafety: "REJECT_LEADING_FORMULA_MARKERS";
  }>;

export interface PassiveTxtDatExtraction {
  readonly profile: TxtDatProfile;
  readonly version: typeof TXT_DAT_INTERPRETATION_VERSION;
  readonly sourceFormat: "TXT_DAT";
  readonly tenantId: string;
  readonly sourceIdentity: string;
  readonly uploadId: string;
  readonly uploadDigest: string;
  readonly acquisitionIdentity: string;
  readonly canonicalProvenance: CanonicalGovernedUploadProvenanceV1;
  readonly interpretationIdentity: string;
  readonly datasetIdentity: string;
  readonly headers: readonly string[];
  readonly rows: readonly (readonly string[])[];
  readonly metadata: PassiveTxtDatExtractionMetadata;
}

export type TxtDatInterpretationDenial =
  | "TXT_DAT_ADMISSION_INVALID"
  | "TXT_DAT_CONTENT_UNAVAILABLE"
  | "TXT_DAT_BYTE_INTEGRITY_INVALID"
  | "TXT_DAT_LAYOUT_MISSING"
  | "TXT_DAT_LAYOUT_INVALID"
  | "TXT_DAT_DELIMITER_INVALID"
  | "TXT_DAT_UTF8_INVALID"
  | "TXT_DAT_EMPTY"
  | "TXT_DAT_WHITESPACE_ONLY"
  | "TXT_DAT_FIELD_DEFINITION_INVALID"
  | "TXT_DAT_FIELD_LIMIT_EXCEEDED"
  | "TXT_DAT_FIELD_LENGTH_EXCEEDED"
  | "TXT_DAT_ROW_LIMIT_EXCEEDED"
  | "TXT_DAT_RECORD_LENGTH_EXCEEDED"
  | "TXT_DAT_RECORD_INCONSISTENT"
  | "TXT_DAT_FORMULA_REJECTED"
  | "TXT_DAT_MALFORMED"
  | "TXT_DAT_INTERPRETATION_FAILED";

export type TxtDatInterpretationResult =
  | Readonly<{ interpreted: true; extraction: PassiveTxtDatExtraction }>
  | Readonly<{ interpreted: false; denial: TxtDatInterpretationDenial }>;

export type TxtDatAuthoritativeExternalDataResult =
  | Readonly<{ constructed: true; data: AuthoritativeExternalData }>
  | Readonly<{
      constructed: false;
      denial: "TXT_DAT_EXTRACTION_INVALID";
    }>;

const HEX = /^[0-9a-f]{64}$/;
const FIELD_NAME = /^[^\r\n]+$/;
const FORMULA = new Set(["=", "+", "-", "@"]);
const producedExtractions = new WeakSet<object>();

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}

function sha256(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function identity(kind: string, fields: readonly unknown[]): string {
  return `${kind}:sha256:${sha256(JSON.stringify(fields))}`;
}

function deny(
  denial: TxtDatInterpretationDenial,
): TxtDatInterpretationResult {
  return Object.freeze({ interpreted: false, denial });
}

function validBase(
  value: TxtDatInterpretationConfiguration,
): boolean {
  return (
    (value?.dataKind === "TXT" || value?.dataKind === "DAT") &&
    (value?.newline === "\n" || value?.newline === "\r\n") &&
    Array.isArray(value?.fields) &&
    value.fields.length > 0 &&
    Number.isSafeInteger(value.maxRows) && value.maxRows > 0 &&
    Number.isSafeInteger(value.maxFields) && value.maxFields > 0 &&
    Number.isSafeInteger(value.maxFieldLength) &&
    value.maxFieldLength > 0 &&
    Number.isSafeInteger(value.maxRecordLength) &&
    value.maxRecordLength > 0
  );
}

function validateConfiguration(
  value: TxtDatInterpretationConfiguration,
): TxtDatInterpretationDenial | null {
  if (!value || !("layout" in value) || value.layout == null) {
    return "TXT_DAT_LAYOUT_MISSING";
  }
  if (value.layout !== "DELIMITED" && value.layout !== "FIXED_WIDTH") {
    return "TXT_DAT_LAYOUT_INVALID";
  }
  if (!validBase(value)) return "TXT_DAT_LAYOUT_INVALID";
  if (value.fields.length > value.maxFields) {
    return "TXT_DAT_FIELD_LIMIT_EXCEEDED";
  }
  const names = value.fields.map(field => field?.name);
  if (
    names.some(name =>
      typeof name !== "string" ||
      name.trim().length === 0 ||
      !FIELD_NAME.test(name)
    ) ||
    new Set(names).size !== names.length
  ) return "TXT_DAT_FIELD_DEFINITION_INVALID";

  if (value.layout === "DELIMITED") {
    if (![",", ";", "\t", "|"].includes(value.delimiter)) {
      return "TXT_DAT_DELIMITER_INVALID";
    }
    if (value.fields.some(field =>
      field.start !== undefined || field.length !== undefined
    )) return "TXT_DAT_FIELD_DEFINITION_INVALID";
    return null;
  }

  let boundary = 0;
  for (const field of value.fields) {
    if (
      !Number.isSafeInteger(field.start) ||
      !Number.isSafeInteger(field.length) ||
      field.start !== boundary ||
      (field.length ?? 0) < 1 ||
      (field.length ?? 0) > value.maxFieldLength
    ) return "TXT_DAT_FIELD_DEFINITION_INVALID";
    boundary += field.length!;
  }
  if (boundary > value.maxRecordLength) {
    return "TXT_DAT_RECORD_LENGTH_EXCEEDED";
  }
  return null;
}

function splitRecords(
  text: string,
  newline: "\n" | "\r\n",
): string[] | TxtDatInterpretationDenial {
  if (newline === "\n" && text.includes("\r")) return "TXT_DAT_MALFORMED";
  if (newline === "\r\n") {
    const withoutPairs = text.replaceAll("\r\n", "");
    if (withoutPairs.includes("\r") || withoutPairs.includes("\n")) {
      return "TXT_DAT_MALFORMED";
    }
  }
  const records = text.split(newline);
  if (records.at(-1) === "") records.pop();
  return records;
}

function validatePassiveField(
  field: string,
  maxFieldLength: number,
): TxtDatInterpretationDenial | null {
  if (field.length > maxFieldLength) {
    return "TXT_DAT_FIELD_LENGTH_EXCEEDED";
  }
  if (field.length > 0 && FORMULA.has(field[0])) {
    return "TXT_DAT_FORMULA_REJECTED";
  }
  return null;
}

function parseRecords(
  records: readonly string[],
  profile: TxtDatInterpretationConfiguration,
): string[][] | TxtDatInterpretationDenial {
  if (records.length > profile.maxRows) {
    return "TXT_DAT_ROW_LIMIT_EXCEEDED";
  }
  const rows: string[][] = [];
  for (const record of records) {
    if (record.length > profile.maxRecordLength) {
      return "TXT_DAT_RECORD_LENGTH_EXCEEDED";
    }
    let fields: string[];
    if (profile.layout === "DELIMITED") {
      fields = record.split(profile.delimiter);
      if (fields.length !== profile.fields.length) {
        return "TXT_DAT_RECORD_INCONSISTENT";
      }
    } else {
      const expectedLength = profile.fields.reduce(
        (length, field) => length + field.length!,
        0,
      );
      if (record.length !== expectedLength) {
        return "TXT_DAT_RECORD_INCONSISTENT";
      }
      fields = profile.fields.map(field =>
        record.slice(field.start!, field.start! + field.length!)
      );
    }
    for (const field of fields) {
      const failure = validatePassiveField(field, profile.maxFieldLength);
      if (failure) return failure;
    }
    rows.push(fields);
  }
  return rows;
}

export async function interpretAdmittedTxtDat(
  input: VerifiedGovernedTxtDatInterpretationInputV1,
): Promise<TxtDatInterpretationResult> {
  if (
    input?.version !== 1 ||
    input.admission?.reference?.detectedFormat !== "TXT_DAT" ||
    input.acquisition_provenance?.facts?.detected_format !== "TXT_DAT" ||
    !Object.isFrozen(input) ||
    !Object.isFrozen(input.canonical_provenance) ||
    !Object.isFrozen(input.acquisition_provenance) ||
    input.canonical_provenance.chain_head !== input.acquisition_provenance
  ) return deny("TXT_DAT_ADMISSION_INVALID");
  const configurationFailure = validateConfiguration(
    input.adapter_configuration,
  );
  if (configurationFailure) return deny(configurationFailure);
  const profile = input.adapter_configuration;
  const acquisition = input.acquisition_provenance.facts;
  const governedIdentity =
    input.acquisition_provenance.previous.previous.facts;

  try {
    const content = await input.content_reader.readVerifiedContent(
      input.content_read_request,
    );
    if (!content) return deny("TXT_DAT_CONTENT_UNAVAILABLE");
    if (
      !(content.bytes instanceof Uint8Array) ||
      content.bytes.byteLength !== acquisition.byte_length ||
      !HEX.test(acquisition.source_byte_digest.value) ||
      sha256(content.bytes) !== acquisition.source_byte_digest.value
    ) return deny("TXT_DAT_BYTE_INTEGRITY_INVALID");

    let text: string;
    try {
      text = new TextDecoder("utf-8", {
        fatal: true,
        ignoreBOM: false,
      }).decode(content.bytes);
    } catch {
      return deny("TXT_DAT_UTF8_INVALID");
    }
    if (text.length === 0) return deny("TXT_DAT_EMPTY");
    if (text.trim().length === 0) return deny("TXT_DAT_WHITESPACE_ONLY");
    const records = splitRecords(text, profile.newline);
    if (!Array.isArray(records)) return deny(records);
    const parsed = parseRecords(records, profile);
    if (!Array.isArray(parsed)) return deny(parsed);

    const acquisitionIdentity = acquisition.acquisition_id;
    const interpretationProfile = profile.layout === "DELIMITED"
      ? DELIMITED_TXT_DAT_INTERPRETATION_PROFILE
      : FIXED_WIDTH_TXT_DAT_INTERPRETATION_PROFILE;
    const interpretationIdentity = identity("interpretation", [
      acquisitionIdentity,
      interpretationProfile,
      TXT_DAT_INTERPRETATION_VERSION,
      profile,
    ]);
    const headers = profile.fields.map(field => field.name);
    const datasetIdentity = identity("dataset", [
      interpretationIdentity,
      headers,
      parsed,
    ]);
    const extraction = deepFreeze({
      profile: interpretationProfile,
      version: TXT_DAT_INTERPRETATION_VERSION,
      sourceFormat: "TXT_DAT" as const,
      tenantId: governedIdentity.tenant_id,
      sourceIdentity: `upload:sha256:${acquisition.source_byte_digest.value}`,
      uploadId: acquisition.upload_id,
      uploadDigest: acquisition.source_byte_digest.value,
      acquisitionIdentity,
      canonicalProvenance: input.canonical_provenance,
      interpretationIdentity,
      datasetIdentity,
      headers,
      rows: parsed,
      metadata: {
        delimiter: profile.layout === "DELIMITED" ? profile.delimiter : null,
        quote: null,
        newline: profile.newline,
        encoding: "UTF-8" as const,
        headerCount: headers.length,
        rowCount: parsed.length,
        byteLength: acquisition.byte_length,
        formulaSafety: "REJECT_LEADING_FORMULA_MARKERS" as const,
      },
    }) as PassiveTxtDatExtraction;
    producedExtractions.add(extraction);
    return Object.freeze({ interpreted: true, extraction });
  } catch {
    return deny("TXT_DAT_INTERPRETATION_FAILED");
  }
}

export function constructTxtDatAuthoritativeExternalData(
  extraction: PassiveTxtDatExtraction,
): TxtDatAuthoritativeExternalDataResult {
  if (!extraction || !producedExtractions.has(extraction)) {
    return Object.freeze({
      constructed: false,
      denial: "TXT_DAT_EXTRACTION_INVALID",
    });
  }
  const data = deepFreeze({
    contractVersion: AUTHORITATIVE_EXTERNAL_DATA_VERSION,
    tenantId: extraction.tenantId,
    sourceIdentity: extraction.sourceIdentity,
    acquisitionIdentity: extraction.acquisitionIdentity,
    interpretationIdentity: extraction.interpretationIdentity,
    interpretationProfile: extraction.profile,
    interpretationVersion: extraction.version,
    datasetIdentity: extraction.datasetIdentity,
    headers: extraction.headers,
    rows: extraction.rows,
    extractionMetadata: extraction.metadata,
    provenance: extraction.canonicalProvenance,
    lineage: {
      uploadId: extraction.uploadId,
      uploadDigestAlgorithm: "SHA-256" as const,
      uploadDigest: extraction.uploadDigest,
      acquisitionIdentity: extraction.acquisitionIdentity,
      interpretationIdentity: extraction.interpretationIdentity,
      datasetIdentity: extraction.datasetIdentity,
    },
  }) as AuthoritativeExternalData;
  return Object.freeze({ constructed: true, data });
}
