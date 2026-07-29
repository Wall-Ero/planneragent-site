import { describe, expect, it } from "vitest";
import {
  AUTHORITATIVE_EXTERNAL_DATA_VERSION,
  constructAuthoritativeExternalData,
  CSV_INTERPRETATION_PROFILE,
  CSV_INTERPRETATION_VERSION,
  interpretAdmittedCsv,
  type CsvInterpretationConfiguration,
} from "../interpretation/governed.csv.interpretation";
import { governedCsvInput } from "./governed.csv.test.fixture";

const configuration: CsvInterpretationConfiguration = {
  delimiter: ",",
  quote: '"',
  newline: "\n",
  maxRows: 3,
  maxColumns: 4,
  maxCellLength: 20,
};

async function interpret(
  source: string | Uint8Array,
  config: CsvInterpretationConfiguration = configuration,
) {
  const bytes = typeof source === "string"
    ? new TextEncoder().encode(source)
    : source;
  return interpretAdmittedCsv(governedCsvInput(bytes, config));
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
  });

  it("projects immutable identity, provenance and digest lineage from WU10B-3", async () => {
    const bytes = new TextEncoder().encode("sku,quantity\nA-1,2");
    const input = governedCsvInput(bytes, configuration);
    const result = await interpretAdmittedCsv(input);
    expect(result.interpreted).toBe(true);
    if (!result.interpreted) return;
    expect(result.extraction.canonicalProvenance)
      .toBe(input.canonical_provenance);
    expect(result.extraction.acquisitionIdentity)
      .toBe(input.acquisition_provenance.facts.acquisition_id);
    expect(result.extraction.uploadDigest)
      .toBe(input.acquisition_provenance.facts.source_byte_digest.value);
    expect(result.extraction.tenantId)
      .toBe(input.acquisition_provenance.previous.previous.facts.tenant_id);
    expect(Object.isFrozen(result.extraction.canonicalProvenance)).toBe(true);
  });

  it("rejects malformed UTF-8, substituted empty and whitespace-only content", async () => {
    expect(await interpret(new Uint8Array([0xc3, 0x28]))).toEqual({
      interpreted: false, denial: "CSV_UTF8_INVALID",
    });
    const admitted = new TextEncoder().encode("a\n1");
    expect(await interpretAdmittedCsv(governedCsvInput(
      admitted, configuration, new Uint8Array(),
    ))).toEqual({
      interpreted: false, denial: "CSV_BYTE_INTEGRITY_INVALID",
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

  it("rejects substituted source bytes against attested digest lineage", async () => {
    const bytes = new TextEncoder().encode("a\n1");
    const substituted = new TextEncoder().encode("a\n2");
    expect(await interpretAdmittedCsv(governedCsvInput(
      bytes, configuration, substituted,
    ))).toEqual({ interpreted: false, denial: "CSV_BYTE_INTEGRITY_INVALID" });
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
