import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  INDUSTRIAL_INTERPRETATION_REGISTRY_VERSION,
  SECURE_FILE_ACQUISITION_PROFILE,
  type SecureFileAcquisitionResult,
} from "../acquisition/secure.file.acquisition";
import {
  AUTHORITATIVE_EXTERNAL_DATA_VERSION,
  constructAuthoritativeExternalData,
  CSV_INTERPRETATION_PROFILE,
  CSV_INTERPRETATION_VERSION,
  interpretAdmittedCsv,
  type AdmittedCsvContentReader,
  type CsvInterpretationConfiguration,
} from "../interpretation/governed.csv.interpretation";

const configuration: CsvInterpretationConfiguration = {
  delimiter: ",",
  quote: '"',
  newline: "\n",
  maxRows: 3,
  maxColumns: 4,
  maxCellLength: 20,
};

function admitted(bytes: Uint8Array, overrides: Record<string, unknown> = {}) {
  const byteDigest = createHash("sha256").update(bytes).digest("hex");
  const result = {
    processed: true,
    disposition: "ADMITTED_FOR_GOVERNED_INTERPRETATION",
    reference: Object.freeze({
      acquisitionProfile: SECURE_FILE_ACQUISITION_PROFILE,
      interpretationRegistryVersion:
        INDUSTRIAL_INTERPRETATION_REGISTRY_VERSION,
      uploadId: "upload-001",
      tenantId: "tenant-001",
      companyId: "company-001",
      authorizationReference: "authorization:001",
      quarantineReference: "quarantine:001",
      inspectionId: "inspection:001",
      malwareScanId: "scan:001",
      detectedFormat: "CSV",
      byteDigestAlgorithm: "SHA-256",
      byteDigest,
      byteLength: bytes.byteLength,
      admittedAt: "2026-07-27T10:00:00.000Z",
      ...overrides,
    }),
  } as Extract<
    SecureFileAcquisitionResult,
    { disposition: "ADMITTED_FOR_GOVERNED_INTERPRETATION" }
  >;
  return Object.freeze(result);
}

function reader(
  bytes: Uint8Array,
  overrides: Record<string, unknown> = {},
): AdmittedCsvContentReader {
  return {
    async readAdmittedCsv(reference) {
      return {
        acquisitionProfile: reference.acquisitionProfile,
        interpretationRegistryVersion:
          reference.interpretationRegistryVersion,
        uploadId: reference.uploadId,
        tenantId: reference.tenantId,
        companyId: reference.companyId,
        quarantineReference: reference.quarantineReference,
        inspectionId: reference.inspectionId,
        malwareScanId: reference.malwareScanId,
        byteDigestAlgorithm: reference.byteDigestAlgorithm,
        byteDigest: reference.byteDigest,
        byteLength: reference.byteLength,
        bytes,
        ...overrides,
      };
    },
  };
}

async function interpret(
  source: string | Uint8Array,
  config: CsvInterpretationConfiguration = configuration,
) {
  const bytes = typeof source === "string"
    ? new TextEncoder().encode(source)
    : source;
  return interpretAdmittedCsv(admitted(bytes), reader(bytes), config);
}

describe("Work Unit 9 — Governed CSV Industrial Interpretation", () => {
  it("deterministically extracts valid admitted CSV as passive primitives", async () => {
    const first = await interpret('sku,quantity\n"A-1","2"\nB-2,3');
    const second = await interpret('sku,quantity\n"A-1","2"\nB-2,3');
    expect(first).toEqual(second);
    expect(first).toMatchObject({
      interpreted: true,
      extraction: {
        profile: CSV_INTERPRETATION_PROFILE,
        version: CSV_INTERPRETATION_VERSION,
        sourceFormat: "CSV",
        headers: ["sku", "quantity"],
        rows: [["A-1", "2"], ["B-2", "3"]],
        metadata: {
          formulaSafety: "REJECT_LEADING_FORMULA_MARKERS",
        },
      },
    });
    expect(JSON.stringify(first)).not.toContain("INDUSTRIAL_ORDER");
    expect(JSON.stringify(first)).not.toContain("canonical");
  });

  it("rejects malformed UTF-8, empty and whitespace-only content", async () => {
    expect(await interpret(new Uint8Array([0xc3, 0x28]))).toEqual({
      interpreted: false, denial: "CSV_UTF8_INVALID",
    });
    expect(await interpret("")).toEqual({
      interpreted: false, denial: "CSV_EMPTY",
    });
    expect(await interpret(" \t \n")).toEqual({
      interpreted: false, denial: "CSV_WHITESPACE_ONLY",
    });
  });

  it.each([
    ["inconsistent columns", "a,b\n1", "CSV_COLUMN_COUNT_INCONSISTENT"],
    ["duplicate headers", "a,a\n1,2", "CSV_HEADER_DUPLICATE"],
    ["empty header", "a, \n1,2", "CSV_HEADER_EMPTY"],
    ["missing header", "\n1,2", "CSV_HEADER_MISSING"],
    ["malformed quote", 'a,b\n"one,two', "CSV_MALFORMED"],
  ])("rejects %s deterministically", async (_name, csv, denial) => {
    expect(await interpret(csv)).toEqual({ interpreted: false, denial });
    expect(await interpret(csv)).toEqual({ interpreted: false, denial });
  });

  it("enforces row, column and cell bounds", async () => {
    expect(await interpret("a\n1\n2\n3\n4")).toEqual({
      interpreted: false, denial: "CSV_ROW_LIMIT_EXCEEDED",
    });
    expect(await interpret("a,b,c,d,e\n1,2,3,4,5")).toEqual({
      interpreted: false, denial: "CSV_COLUMN_LIMIT_EXCEEDED",
    });
    expect(await interpret(`a\n${"x".repeat(21)}`)).toEqual({
      interpreted: false, denial: "CSV_CELL_LIMIT_EXCEEDED",
    });
  });

  it("rejects unsupported configuration", async () => {
    expect(await interpret("a\n1", {
      ...configuration,
      delimiter: "^" as any,
    })).toEqual({
      interpreted: false, denial: "CSV_CONFIGURATION_UNSUPPORTED",
    });
  });

  it.each(["=1+1", "+cmd", "-2+3", "@SUM(A1)"])(
    "rejects formula-injection cell %s",
    async value => {
      expect(await interpret(`value\n${value}`)).toEqual({
        interpreted: false, denial: "CSV_FORMULA_REJECTED",
      });
    },
  );

  it("accepts configurable passive CSV syntax", async () => {
    const result = await interpret("a;'b;2'\r\nx;'y''z'", {
      ...configuration,
      delimiter: ";",
      quote: "'",
      newline: "\r\n",
    });
    expect(result).toMatchObject({
      interpreted: true,
      extraction: { rows: [["x", "y'z"]] },
    });
  });

  it("rejects uploads not admitted by WU8", async () => {
    const bytes = new TextEncoder().encode("a\n1");
    const result = await interpretAdmittedCsv({
      processed: false,
      denial: "MALWARE_DETECTED",
    } as any, reader(bytes), configuration);
    expect(result).toEqual({
      interpreted: false, denial: "CSV_ADMISSION_INVALID",
    });
  });

  it("rejects forged upload, acquisition and byte lineage", async () => {
    const bytes = new TextEncoder().encode("a\n1");
    const admission = admitted(bytes);
    expect(await interpretAdmittedCsv(
      admission,
      reader(bytes, { uploadId: "upload-forged" }),
      configuration,
    )).toEqual({ interpreted: false, denial: "CSV_LINEAGE_INVALID" });
    expect(await interpretAdmittedCsv(
      admission,
      reader(bytes, { quarantineReference: "quarantine:forged" }),
      configuration,
    )).toEqual({ interpreted: false, denial: "CSV_LINEAGE_INVALID" });
    const substituted = new TextEncoder().encode("a\n2");
    expect(await interpretAdmittedCsv(
      admission,
      reader(substituted),
      configuration,
    )).toEqual({ interpreted: false, denial: "CSV_BYTE_INTEGRITY_INVALID" });
  });

  it("deeply freezes extraction and Authoritative External Data", async () => {
    const result = await interpret("a,b\n1,2");
    expect(result.interpreted).toBe(true);
    if (!result.interpreted) return;
    expect(Object.isFrozen(result.extraction)).toBe(true);
    expect(Object.isFrozen(result.extraction.headers)).toBe(true);
    expect(Object.isFrozen(result.extraction.rows)).toBe(true);
    expect(Object.isFrozen(result.extraction.rows[0])).toBe(true);
    expect(Object.isFrozen(result.extraction.metadata)).toBe(true);
    expect(() => {
      (result.extraction.rows[0] as string[])[0] = "forged";
    }).toThrow();

    const first = constructAuthoritativeExternalData(result.extraction);
    const second = constructAuthoritativeExternalData(result.extraction);
    expect(first).toEqual(second);
    expect(first).toMatchObject({
      constructed: true,
      data: {
        contractVersion: AUTHORITATIVE_EXTERNAL_DATA_VERSION,
        interpretationProfile: CSV_INTERPRETATION_PROFILE,
        headers: ["a", "b"],
        rows: [["1", "2"]],
      },
    });
    if (first.constructed) {
      expect(Object.isFrozen(first.data)).toBe(true);
      expect(Object.isFrozen(first.data.lineage)).toBe(true);
      expect(Object.isFrozen(first.data.rows[0])).toBe(true);
    }
  });

  it("rejects forged extraction construction and infers no semantics", async () => {
    expect(constructAuthoritativeExternalData({
      profile: CSV_INTERPRETATION_PROFILE,
    } as any)).toEqual({
      constructed: false, denial: "CSV_EXTRACTION_INVALID",
    });
    const result = await interpret("order_id,quantity\nO-1,10");
    if (!result.interpreted) throw new Error("expected extraction");
    const authoritative = constructAuthoritativeExternalData(result.extraction);
    const serialized = JSON.stringify(authoritative);
    for (const forbidden of [
      "INDUSTRIAL_ORDER", "canonicalFact", "businessMeaning",
      "normalizedQuantity",
    ]) expect(serialized).not.toContain(forbidden);
  });
});
