import { describe, expect, it } from "vitest";
import {
  constructAuthoritativeExternalData,
  interpretAdmittedCsv,
  type CsvInterpretationConfiguration,
} from "../interpretation/governed.csv.interpretation";
import { governedCsvInput } from "./governed.csv.test.fixture";
import {
  constructTxtDatAuthoritativeExternalData,
  DELIMITED_TXT_DAT_INTERPRETATION_PROFILE,
  FIXED_WIDTH_TXT_DAT_INTERPRETATION_PROFILE,
  interpretAdmittedTxtDat,
  type TxtDatInterpretationConfiguration,
} from "../interpretation/governed.flatfile.interpretation";
import { governedTxtDatInput } from "./governed.flatfile.test.fixture";

const delimited: TxtDatInterpretationConfiguration = {
  dataKind: "TXT",
  layout: "DELIMITED",
  delimiter: "|",
  newline: "\n",
  fields: [{ name: "code" }, { name: "amount" }],
  maxRows: 3,
  maxFields: 4,
  maxFieldLength: 10,
  maxRecordLength: 30,
};
const fixed: TxtDatInterpretationConfiguration = {
  dataKind: "TXT",
  layout: "FIXED_WIDTH",
  newline: "\n",
  fields: [
    { name: "code", start: 0, length: 3 },
    { name: "amount", start: 3, length: 2 },
  ],
  maxRows: 3,
  maxFields: 4,
  maxFieldLength: 10,
  maxRecordLength: 30,
};

async function interpret(
  source: string | Uint8Array,
  configuration: TxtDatInterpretationConfiguration,
) {
  const bytes = typeof source === "string"
    ? new TextEncoder().encode(source)
    : source;
  return interpretAdmittedTxtDat(governedTxtDatInput(bytes, configuration));
}

describe("Work Unit 10 — Governed TXT/DAT Industrial Interpretation", () => {
  it.each(["TXT", "DAT"] as const)(
    "deterministically interprets valid delimited %s",
    async dataKind => {
      const profile = { ...delimited, dataKind };
      const first = await interpret("A01|10\nB02|20", profile);
      const second = await interpret("A01|10\nB02|20", profile);
      expect(first).toEqual(second);
      expect(first).toMatchObject({
        interpreted: true,
        extraction: {
          profile: DELIMITED_TXT_DAT_INTERPRETATION_PROFILE,
          sourceFormat: "TXT_DAT",
          headers: ["code", "amount"],
          rows: [["A01", "10"], ["B02", "20"]],
        },
      });
    },
  );

  it.each(["TXT", "DAT"] as const)(
    "deterministically interprets valid fixed-width %s",
    async dataKind => {
      const profile = { ...fixed, dataKind };
      const result = await interpret("A0110\nB0220", profile);
      expect(result).toMatchObject({
        interpreted: true,
        extraction: {
          profile: FIXED_WIDTH_TXT_DAT_INTERPRETATION_PROFILE,
          headers: ["code", "amount"],
          rows: [["A01", "10"], ["B02", "20"]],
        },
      });
    },
  );

  it("rejects missing and malformed layouts", async () => {
    const { layout: _layout, ...missingLayout } = delimited;
    expect(await interpret("A01|10", missingLayout as any)).toEqual({
      interpreted: false, denial: "TXT_DAT_LAYOUT_MISSING",
    });
    expect(await interpret("A0110", {
      ...fixed,
      fields: [
        { name: "code", start: 0, length: 3 },
        { name: "amount", start: 4, length: 2 },
      ],
    })).toEqual({
      interpreted: false, denial: "TXT_DAT_FIELD_DEFINITION_INVALID",
    });
  });

  it("rejects inconsistent fixed-width records", async () => {
    expect(await interpret("A0110\nB022", fixed)).toEqual({
      interpreted: false, denial: "TXT_DAT_RECORD_INCONSISTENT",
    });
  });

  it("rejects invalid delimiter configuration", async () => {
    expect(await interpret("A01^10", {
      ...delimited, delimiter: "^",
    } as any)).toEqual({
      interpreted: false, denial: "TXT_DAT_DELIMITER_INVALID",
    });
  });

  it("requires valid immutable field definitions", async () => {
    expect(await interpret("A01", {
      ...delimited, fields: [],
    })).toEqual({
      interpreted: false, denial: "TXT_DAT_LAYOUT_INVALID",
    });
    expect(await interpret("A01", {
      ...delimited, fields: [{ name: " " }],
    })).toEqual({
      interpreted: false, denial: "TXT_DAT_FIELD_DEFINITION_INVALID",
    });
  });

  it("enforces field, record and row bounds", async () => {
    expect(await interpret("TOO-LONG-11|1", delimited)).toEqual({
      interpreted: false, denial: "TXT_DAT_FIELD_LENGTH_EXCEEDED",
    });
    expect(await interpret("12345678901|1", {
      ...delimited, maxRecordLength: 10,
    })).toEqual({
      interpreted: false, denial: "TXT_DAT_RECORD_LENGTH_EXCEEDED",
    });
    expect(await interpret("A01|1\nB02|2\nC03|3\nD04|4", delimited)).toEqual({
      interpreted: false, denial: "TXT_DAT_ROW_LIMIT_EXCEEDED",
    });
  });

  it("rejects malformed UTF-8 and newline mismatch", async () => {
    expect(await interpret(new Uint8Array([0xc3, 0x28]), delimited)).toEqual({
      interpreted: false, denial: "TXT_DAT_UTF8_INVALID",
    });
    expect(await interpret("A01|1\r\nB02|2", delimited)).toEqual({
      interpreted: false, denial: "TXT_DAT_MALFORMED",
    });
  });

  it("projects immutable identity, provenance and digest lineage from WU10B-3", async () => {
    const bytes = new TextEncoder().encode("A01|10");
    const input = governedTxtDatInput(bytes, delimited);
    const result = await interpretAdmittedTxtDat(input);
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

  it("rejects substituted source bytes against attested digest lineage", async () => {
    const bytes = new TextEncoder().encode("A01|10");
    const substituted = new TextEncoder().encode("B02|20");
    expect(await interpretAdmittedTxtDat(governedTxtDatInput(
      bytes, delimited, substituted,
    ))).toEqual({
      interpreted: false, denial: "TXT_DAT_BYTE_INTEGRITY_INVALID",
    });
  });

  it("rejects active spreadsheet semantics as passive data", async () => {
    expect(await interpret("A01|=1+1", delimited)).toEqual({
      interpreted: false, denial: "TXT_DAT_FORMULA_REJECTED",
    });
  });

  it("deeply freezes extraction and Authoritative External Data", async () => {
    const result = await interpret("A01|10", delimited);
    if (!result.interpreted) throw new Error("expected extraction");
    expect(Object.isFrozen(result.extraction)).toBe(true);
    expect(Object.isFrozen(result.extraction.headers)).toBe(true);
    expect(Object.isFrozen(result.extraction.rows)).toBe(true);
    expect(Object.isFrozen(result.extraction.rows[0])).toBe(true);
    expect(Object.isFrozen(result.extraction.metadata)).toBe(true);
    expect(() => {
      (result.extraction.rows[0] as string[])[0] = "forged";
    }).toThrow();
    const first = constructTxtDatAuthoritativeExternalData(
      result.extraction,
    );
    const second = constructTxtDatAuthoritativeExternalData(
      result.extraction,
    );
    expect(first).toEqual(second);
    if (first.constructed) {
      expect(first.data.provenance)
        .toBe(result.extraction.canonicalProvenance);
      expect(Object.isFrozen(first.data)).toBe(true);
      expect(Object.isFrozen(first.data.provenance)).toBe(true);
      expect(Object.isFrozen(first.data.lineage)).toBe(true);
    }
  });

  it("rejects forged extraction construction", () => {
    expect(constructTxtDatAuthoritativeExternalData({
      profile: DELIMITED_TXT_DAT_INTERPRETATION_PROFILE,
    } as any)).toEqual({
      constructed: false, denial: "TXT_DAT_EXTRACTION_INVALID",
    });
  });

  it("proves CSV and TXT/DAT emit the identical AED field contract", async () => {
    const txt = await interpret("A01|10", delimited);
    if (!txt.interpreted) throw new Error("expected TXT extraction");
    const txtAed = constructTxtDatAuthoritativeExternalData(txt.extraction);
    if (!txtAed.constructed) throw new Error("expected TXT AED");

    const csvBytes = new TextEncoder().encode("code,amount\nA01,10");
    const csvConfig: CsvInterpretationConfiguration = {
      delimiter: ",", quote: '"', newline: "\n",
      maxRows: 3, maxColumns: 4, maxCellLength: 10,
    };
    const csv = await interpretAdmittedCsv(
      governedCsvInput(csvBytes, csvConfig),
    );
    if (!csv.interpreted) throw new Error("expected CSV extraction");
    const csvAed = constructAuthoritativeExternalData(csv.extraction);
    if (!csvAed.constructed) throw new Error("expected CSV AED");

    expect(Object.keys(txtAed.data).sort()).toEqual(
      Object.keys(csvAed.data).sort(),
    );
    expect(Object.keys(txtAed.data.lineage).sort()).toEqual(
      Object.keys(csvAed.data.lineage).sort(),
    );
    expect(Object.keys(txtAed.data.extractionMetadata).sort()).toEqual(
      Object.keys(csvAed.data.extractionMetadata).sort(),
    );
    expect(txtAed.data.headers).toEqual(csvAed.data.headers);
    expect(txtAed.data.rows).toEqual(csvAed.data.rows);
    for (const forbidden of [
      "INDUSTRIAL_ORDER", "canonicalFact", "businessMeaning",
      "normalizedQuantity", "fixedWidth", "dataKind",
    ]) expect(JSON.stringify(txtAed.data)).not.toContain(forbidden);
  });
});
