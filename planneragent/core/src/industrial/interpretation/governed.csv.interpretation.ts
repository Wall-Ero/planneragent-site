import { createHash } from "node:crypto";
import type {
  CanonicalGovernedUploadProvenanceV1,
  VerifiedGovernedInterpretationInputV1,
} from "../provenance";
import {
  AUTHORITATIVE_EXTERNAL_DATA_VERSION,
  type AuthoritativeExternalData,
} from "./authoritative.external.data";

export {
  AUTHORITATIVE_EXTERNAL_DATA_VERSION,
} from "./authoritative.external.data";
export type {
  AuthoritativeExternalData,
} from "./authoritative.external.data";

export const CSV_INTERPRETATION_PROFILE =
  "GOVERNED_PASSIVE_CSV_V1" as const;
export const CSV_INTERPRETATION_VERSION = "1" as const;

export interface CsvInterpretationConfiguration {
  readonly delimiter: "," | ";" | "\t" | "|";
  readonly quote: '"' | "'";
  readonly newline: "\n" | "\r\n";
  readonly maxRows: number;
  readonly maxColumns: number;
  readonly maxCellLength: number;
}

export interface VerifiedCsvContent {
  readonly bytes: Uint8Array;
}

export type VerifiedGovernedCsvInterpretationInputV1 =
  VerifiedGovernedInterpretationInputV1<
    VerifiedCsvContent,
    CsvInterpretationConfiguration
  >;

export interface PassiveCsvExtraction {
  readonly profile: typeof CSV_INTERPRETATION_PROFILE;
  readonly version: typeof CSV_INTERPRETATION_VERSION;
  readonly sourceFormat: "CSV";
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
  readonly metadata: Readonly<{
    delimiter: CsvInterpretationConfiguration["delimiter"];
    quote: CsvInterpretationConfiguration["quote"];
    newline: CsvInterpretationConfiguration["newline"];
    encoding: "UTF-8";
    headerCount: number;
    rowCount: number;
    byteLength: number;
    formulaSafety: "REJECT_LEADING_FORMULA_MARKERS";
  }>;
}

export type CsvInterpretationDenial =
  | "CSV_ADMISSION_INVALID"
  | "CSV_CONTENT_UNAVAILABLE"
  | "CSV_BYTE_INTEGRITY_INVALID"
  | "CSV_CONFIGURATION_UNSUPPORTED"
  | "CSV_UTF8_INVALID"
  | "CSV_EMPTY"
  | "CSV_WHITESPACE_ONLY"
  | "CSV_HEADER_MISSING"
  | "CSV_HEADER_EMPTY"
  | "CSV_HEADER_DUPLICATE"
  | "CSV_COLUMN_COUNT_INCONSISTENT"
  | "CSV_ROW_LIMIT_EXCEEDED"
  | "CSV_COLUMN_LIMIT_EXCEEDED"
  | "CSV_CELL_LIMIT_EXCEEDED"
  | "CSV_FORMULA_REJECTED"
  | "CSV_MALFORMED"
  | "CSV_INTERPRETATION_FAILED";

export type CsvInterpretationResult =
  | Readonly<{
      interpreted: true;
      extraction: PassiveCsvExtraction;
    }>
  | Readonly<{
      interpreted: false;
      denial: CsvInterpretationDenial;
    }>;

export type AuthoritativeExternalDataResult =
  | Readonly<{ constructed: true; data: AuthoritativeExternalData }>
  | Readonly<{
      constructed: false;
      denial: "CSV_EXTRACTION_INVALID";
    }>;

const HEX = /^[0-9a-f]{64}$/;
const FORMULA = new Set(["=", "+", "-", "@"]);
const producedExtractions = new WeakSet<object>();

function freeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      freeze(child);
    }
    Object.freeze(value);
  }
  return value;
}

function digest(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function stableIdentity(kind: string, fields: readonly unknown[]): string {
  return `${kind}:sha256:${digest(JSON.stringify(fields))}`;
}

function deny(denial: CsvInterpretationDenial): CsvInterpretationResult {
  return Object.freeze({ interpreted: false, denial });
}

function supportedConfiguration(
  configuration: CsvInterpretationConfiguration,
): boolean {
  return (
    [",", ";", "\t", "|"].includes(configuration?.delimiter) &&
    ['"', "'"].includes(configuration?.quote) &&
    ["\n", "\r\n"].includes(configuration?.newline) &&
    Number.isSafeInteger(configuration?.maxRows) &&
    configuration.maxRows > 0 &&
    Number.isSafeInteger(configuration?.maxColumns) &&
    configuration.maxColumns > 0 &&
    Number.isSafeInteger(configuration?.maxCellLength) &&
    configuration.maxCellLength > 0
  );
}

function parseCsv(
  text: string,
  configuration: CsvInterpretationConfiguration,
): string[][] | CsvInterpretationDenial {
  const records: string[][] = [];
  let record: string[] = [];
  let cell = "";
  let quoted = false;
  let afterQuote = false;
  let index = 0;

  const finishCell = (): CsvInterpretationDenial | null => {
    if (cell.length > configuration.maxCellLength) {
      return "CSV_CELL_LIMIT_EXCEEDED";
    }
    if (cell.length > 0 && FORMULA.has(cell[0])) {
      return "CSV_FORMULA_REJECTED";
    }
    record.push(cell);
    cell = "";
    if (record.length > configuration.maxColumns) {
      return "CSV_COLUMN_LIMIT_EXCEEDED";
    }
    return null;
  };
  const finishRecord = (): CsvInterpretationDenial | null => {
    const failure = finishCell();
    if (failure) return failure;
    records.push(record);
    record = [];
    if (records.length - 1 > configuration.maxRows) {
      return "CSV_ROW_LIMIT_EXCEEDED";
    }
    return null;
  };

  while (index < text.length) {
    if (quoted) {
      if (text[index] === configuration.quote) {
        if (text[index + 1] === configuration.quote) {
          cell += configuration.quote;
          index += 2;
        } else {
          quoted = false;
          afterQuote = true;
          index += 1;
        }
      } else {
        cell += text[index++];
        if (cell.length > configuration.maxCellLength) {
          return "CSV_CELL_LIMIT_EXCEEDED";
        }
      }
      continue;
    }
    if (afterQuote) {
      if (text[index] === configuration.delimiter) {
        const failure = finishCell();
        if (failure) return failure;
        afterQuote = false;
        index += 1;
        continue;
      }
      if (text.startsWith(configuration.newline, index)) {
        const failure = finishRecord();
        if (failure) return failure;
        afterQuote = false;
        index += configuration.newline.length;
        continue;
      }
      return "CSV_MALFORMED";
    }
    if (text[index] === configuration.quote) {
      if (cell.length !== 0) return "CSV_MALFORMED";
      quoted = true;
      index += 1;
    } else if (text[index] === configuration.delimiter) {
      const failure = finishCell();
      if (failure) return failure;
      index += 1;
    } else if (text.startsWith(configuration.newline, index)) {
      const failure = finishRecord();
      if (failure) return failure;
      index += configuration.newline.length;
    } else if (text[index] === "\r" || text[index] === "\n") {
      return "CSV_MALFORMED";
    } else {
      cell += text[index++];
      if (cell.length > configuration.maxCellLength) {
        return "CSV_CELL_LIMIT_EXCEEDED";
      }
    }
  }
  if (quoted) return "CSV_MALFORMED";
  if (afterQuote || cell.length > 0 || record.length > 0) {
    const failure = finishRecord();
    if (failure) return failure;
  }
  return records;
}

export async function interpretAdmittedCsv(
  input: VerifiedGovernedCsvInterpretationInputV1,
): Promise<CsvInterpretationResult> {
  if (
    input?.version !== 1 ||
    input.admission?.reference?.detectedFormat !== "CSV" ||
    input.acquisition_provenance?.facts?.detected_format !== "CSV" ||
    !Object.isFrozen(input) ||
    !Object.isFrozen(input.canonical_provenance) ||
    !Object.isFrozen(input.acquisition_provenance) ||
    input.canonical_provenance.chain_head !== input.acquisition_provenance
  ) return deny("CSV_ADMISSION_INVALID");
  if (!supportedConfiguration(input.adapter_configuration)) {
    return deny("CSV_CONFIGURATION_UNSUPPORTED");
  }
  const profile = input.adapter_configuration;
  const acquisition = input.acquisition_provenance.facts;
  const identity = input.acquisition_provenance.previous.previous.facts;
  try {
    const content = await input.content_reader.readVerifiedContent(
      input.content_read_request,
    );
    if (!content) return deny("CSV_CONTENT_UNAVAILABLE");
    if (
      !(content.bytes instanceof Uint8Array) ||
      content.bytes.byteLength !== acquisition.byte_length ||
      !HEX.test(acquisition.source_byte_digest.value) ||
      digest(content.bytes) !== acquisition.source_byte_digest.value
    ) return deny("CSV_BYTE_INTEGRITY_INVALID");

    let text: string;
    try {
      text = new TextDecoder("utf-8", {
        fatal: true,
        ignoreBOM: false,
      }).decode(content.bytes);
    } catch {
      return deny("CSV_UTF8_INVALID");
    }
    if (text.length === 0) return deny("CSV_EMPTY");
    if (text.trim().length === 0) return deny("CSV_WHITESPACE_ONLY");

    const parsed = parseCsv(text, profile);
    if (!Array.isArray(parsed)) return deny(parsed);
    if (parsed.length === 0 || parsed[0].length === 0) {
      return deny("CSV_HEADER_MISSING");
    }
    const headers = parsed[0];
    if (headers.length === 1 && headers[0].length === 0) {
      return deny("CSV_HEADER_MISSING");
    }
    if (headers.some(header => header.trim().length === 0)) {
      return deny("CSV_HEADER_EMPTY");
    }
    if (new Set(headers).size !== headers.length) {
      return deny("CSV_HEADER_DUPLICATE");
    }
    const rows = parsed.slice(1);
    if (rows.some(row => row.length !== headers.length)) {
      return deny("CSV_COLUMN_COUNT_INCONSISTENT");
    }

    const acquisitionIdentity = acquisition.acquisition_id;
    const profileFields = [
      CSV_INTERPRETATION_PROFILE,
      CSV_INTERPRETATION_VERSION,
      profile.delimiter,
      profile.quote,
      profile.newline,
      profile.maxRows,
      profile.maxColumns,
      profile.maxCellLength,
    ] as const;
    const interpretationIdentity = stableIdentity("interpretation", [
      acquisitionIdentity,
      ...profileFields,
    ]);
    const datasetIdentity = stableIdentity("dataset", [
      interpretationIdentity,
      headers,
      rows,
    ]);
    const extraction = freeze({
      profile: CSV_INTERPRETATION_PROFILE,
      version: CSV_INTERPRETATION_VERSION,
      sourceFormat: "CSV" as const,
      tenantId: identity.tenant_id,
      sourceIdentity: `upload:sha256:${acquisition.source_byte_digest.value}`,
      uploadId: acquisition.upload_id,
      uploadDigest: acquisition.source_byte_digest.value,
      acquisitionIdentity,
      canonicalProvenance: input.canonical_provenance,
      interpretationIdentity,
      datasetIdentity,
      headers: headers.slice(),
      rows: rows.map(row => row.slice()),
      metadata: {
        delimiter: profile.delimiter,
        quote: profile.quote,
        newline: profile.newline,
        encoding: "UTF-8" as const,
        headerCount: headers.length,
        rowCount: rows.length,
        byteLength: acquisition.byte_length,
        formulaSafety: "REJECT_LEADING_FORMULA_MARKERS" as const,
      },
    }) as PassiveCsvExtraction;
    producedExtractions.add(extraction);
    return Object.freeze({ interpreted: true, extraction });
  } catch {
    return deny("CSV_INTERPRETATION_FAILED");
  }
}

export function constructAuthoritativeExternalData(
  extraction: PassiveCsvExtraction,
): AuthoritativeExternalDataResult {
  if (!extraction || !producedExtractions.has(extraction)) {
    return Object.freeze({
      constructed: false,
      denial: "CSV_EXTRACTION_INVALID",
    });
  }
  const data = freeze({
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
