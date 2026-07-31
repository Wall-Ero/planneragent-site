import { describe, expect, it } from "vitest";
import { admitIndustrialDataset } from "../cognition/governed.dataset.admission";
import {
  constructXlsxAuthoritativeExternalData,
  interpretAdmittedXlsx,
  XLSX_INTERPRETATION_PROFILE,
  XLSX_INTERPRETATION_VERSION,
  type XlsxInterpretationConfiguration,
} from "../interpretation/governed.xlsx.interpretation";
import { addZipFlag, governedXlsxInput, replaceZipName, xlsxBytes, xlsxLimits } from "./governed.xlsx.test.fixture";

const one = (overrides: Partial<XlsxInterpretationConfiguration>): XlsxInterpretationConfiguration =>
  Object.freeze({ ...xlsxLimits, ...overrides });
async function denial(bytes: Uint8Array, expected: string, config = xlsxLimits) {
  await expect(interpretAdmittedXlsx(governedXlsxInput(bytes, config))).resolves.toEqual({ interpreted: false, denial: expected });
}

describe("WU12B governed passive XLSX interpretation", () => {
  it("interprets a minimal passive XLSX and constructs unchanged AED", async () => {
    const input = governedXlsxInput(xlsxBytes());
    const result = await interpretAdmittedXlsx(input);
    expect(result.interpreted).toBe(true);
    if (!result.interpreted) return;
    expect(result.extraction).toMatchObject({ profile: XLSX_INTERPRETATION_PROFILE,
      version: XLSX_INTERPRETATION_VERSION, sourceFormat: "XLSX",
      headers: ["orderId", "sku", "qty"], rows: [["O1", "SKU1", "2"]],
      acquisitionIdentity: "acquisition-xlsx-1" });
    expect(result.extraction.canonicalProvenance).toBe(input.canonical_provenance);
    const built = constructXlsxAuthoritativeExternalData(result.extraction);
    expect(built.constructed).toBe(true);
    if (built.constructed) {
      expect(built.data.provenance).toBe(input.canonical_provenance);
      expect(built.data.contractVersion).toBe("1");
      expect(Object.isFrozen(built.data)).toBe(true);
      expect(Object.isFrozen(built.data.rows[0])).toBe(true);
    }
  });

  it("supports shared strings, inline strings, finite numbers, booleans, blanks and missing interior cells", async () => {
    const sheet = `<worksheet><sheetData><row><c r="A1" t="s"><v>0</v></c><c r="B1" t="inlineStr"><is><t>b</t></is></c><c r="C1" t="inlineStr"><is><t>c</t></is></c><c r="D1" t="inlineStr"><is><t>d</t></is></c></row><row><c r="A2" t="s"><v>1</v></c><c r="C2"><v>1.5</v></c><c r="D2" t="b"><v>1</v></c></row></sheetData></worksheet>`;
    const sharedStrings = `<sst><si><t>a</t></si><si><t>x</t></si></sst>`;
    const result = await interpretAdmittedXlsx(governedXlsxInput(xlsxBytes({ sheet, sharedStrings })));
    expect(result.interpreted && result.extraction.rows).toEqual([["x", "", "1.5", "true"]]);
  });

  it("is deterministic across repeated runs", async () => {
    const bytes = xlsxBytes();
    const [a, b] = await Promise.all([interpretAdmittedXlsx(governedXlsxInput(bytes)), interpretAdmittedXlsx(governedXlsxInput(bytes))]);
    expect(a.interpreted && b.interpreted).toBe(true);
    if (a.interpreted && b.interpreted) {
      expect(a.extraction.interpretationIdentity).toBe(b.extraction.interpretationIdentity);
      expect(a.extraction.datasetIdentity).toBe(b.extraction.datasetIdentity);
      expect(a.extraction).toEqual(b.extraction);
    }
  });

  it("changes dataset identity when passive tabular content changes", async () => {
    const a = await interpretAdmittedXlsx(governedXlsxInput(xlsxBytes()));
    const changed = xlsxBytes({ sheet: `<worksheet><sheetData><row><c r="A1" t="inlineStr"><is><t>orderId</t></is></c></row><row><c r="A2" t="inlineStr"><is><t>O2</t></is></c></row></sheetData></worksheet>` });
    const b = await interpretAdmittedXlsx(governedXlsxInput(changed));
    expect(a.interpreted && b.interpreted && a.extraction.datasetIdentity).not.toBe(b.interpreted && b.extraction.datasetIdentity);
  });

  it("preserves all governed acquisition lineage rather than reader-supplied facts", async () => {
    const input = governedXlsxInput(xlsxBytes());
    const result = await interpretAdmittedXlsx(input);
    expect(result.interpreted && result.extraction).toMatchObject({ tenantId: "tenant-1",
      uploadId: "upload-xlsx-1", acquisitionIdentity: "acquisition-xlsx-1" });
  });

  it("deep-freezes the extraction contract", async () => {
    const result = await interpretAdmittedXlsx(governedXlsxInput(xlsxBytes()));
    expect(result.interpreted).toBe(true);
    if (result.interpreted) {
      expect(Object.isFrozen(result.extraction)).toBe(true);
      expect(Object.isFrozen(result.extraction.headers)).toBe(true);
      expect(Object.isFrozen(result.extraction.rows[0])).toBe(true);
      expect(Object.isFrozen(result.extraction.metadata)).toBe(true);
    }
  });

  it("defensively separates extracted data from the source byte buffer", async () => {
    const bytes = xlsxBytes();
    const result = await interpretAdmittedXlsx(governedXlsxInput(bytes));
    bytes.fill(0);
    expect(result.interpreted && result.extraction.rows).toEqual([["O1", "SKU1", "2"]]);
  });

  it("deterministically ignores completely empty trailing rows", async () => {
    const sheet = `<worksheet><sheetData><row><c r="A1" t="inlineStr"><is><t>a</t></is></c></row><row><c r="A2"><v>1</v></c></row><row r="3"></row></sheetData></worksheet>`;
    const result = await interpretAdmittedXlsx(governedXlsxInput(xlsxBytes({ sheet })));
    expect(result.interpreted && result.extraction.rows).toEqual([["1"]]);
  });

  it("binds interpretation identity to immutable workbook configuration", async () => {
    const bytes = xlsxBytes();
    const a = await interpretAdmittedXlsx(governedXlsxInput(bytes));
    const b = await interpretAdmittedXlsx(governedXlsxInput(bytes, one({ maxRows: 99 })));
    expect(a.interpreted && b.interpreted && a.extraction.interpretationIdentity).not.toBe(b.interpreted && b.extraction.interpretationIdentity);
    expect(a.interpreted && b.interpreted && a.extraction.datasetIdentity).not.toBe(b.interpreted && b.extraction.datasetIdentity);
  });

  it("admits XLSX AED through the unchanged WU11 role contract", async () => {
    const interpreted = await interpretAdmittedXlsx(governedXlsxInput(xlsxBytes()));
    if (!interpreted.interpreted) throw new Error(interpreted.denial);
    const built = constructXlsxAuthoritativeExternalData(interpreted.extraction);
    if (!built.constructed) throw new Error(built.denial);
    const admission = admitIndustrialDataset(built.data, Object.freeze({ version: 1, role: "ORDERS" }));
    expect(admission.admitted).toBe(true);
  });

  it("rejects unproduced extraction objects", () => {
    expect(constructXlsxAuthoritativeExternalData({} as any)).toEqual({ constructed: false, denial: "XLSX_EXTRACTION_INVALID" });
  });

  it("rejects contradictory bytes from the canonical content reader", async () => {
    const bytes = xlsxBytes();
    const input = governedXlsxInput(bytes, xlsxLimits, bytes.slice(0, -1));
    await expect(interpretAdmittedXlsx(input)).resolves.toEqual({ interpreted: false, denial: "XLSX_BYTE_INTEGRITY_INVALID" });
  });

  const workbookCases: readonly [string, Parameters<typeof xlsxBytes>[0], string][] = [
    ["worksheet name mismatch", {}, "XLSX_WORKSHEET_NAME_MISMATCH"],
    ["multiple worksheets", { workbook: `<workbook xmlns:r="r"><sheets><sheet name="Plan" r:id="rId1"/><sheet name="Two" r:id="rId2"/></sheets></workbook>` }, "XLSX_WORKSHEET_COUNT_INVALID"],
    ["hidden worksheet", { workbook: `<workbook xmlns:r="r"><sheets><sheet name="Plan" state="hidden" r:id="rId1"/></sheets></workbook>` }, "XLSX_HIDDEN_WORKSHEET_DETECTED"],
    ["very-hidden worksheet", { workbook: `<workbook xmlns:r="r"><sheets><sheet name="Plan" state="veryHidden" r:id="rId1"/></sheets></workbook>` }, "XLSX_HIDDEN_WORKSHEET_DETECTED"],
    ["macro part", { extra: { "xl/vbaProject.bin": "vba" } }, "XLSX_MACRO_CONTENT_DETECTED"],
    ["macro-enabled content type", { contentTypes: `<Types><Override ContentType="application/vnd.ms-excel.sheet.macroEnabled.main+xml"/></Types>` }, "XLSX_MACRO_CONTENT_DETECTED"],
    ["calculation chain", { extra: { "xl/calcChain.xml": "<calcChain/>" } }, "XLSX_CALCULATION_CHAIN_DETECTED"],
    ["external link part", { extra: { "xl/externalLinks/externalLink1.xml": "<externalLink/>" } }, "XLSX_EXTERNAL_LINK_DETECTED"],
    ["external relationship", { workbookRels: `<Relationships><Relationship Id="rId1" Type="x/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="x" Type="x" Target="https://example.test" TargetMode="External"/></Relationships>` }, "XLSX_EXTERNAL_LINK_DETECTED"],
    ["embedded object", { extra: { "xl/embeddings/object1.bin": "x" } }, "XLSX_EMBEDDED_OBJECT_DETECTED"],
    ["OLE relationship", { workbookRels: `<Relationships><Relationship Id="rId1" Type="x/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="x" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/oleObject" Target="x"/></Relationships>` }, "XLSX_EMBEDDED_OBJECT_DETECTED"],
    ["encrypted package indicator", { extra: { "EncryptedPackage": "x" } }, "XLSX_ENCRYPTED_WORKBOOK"],
    ["merged cells", { sheet: `<worksheet><sheetData><row><c r="A1" t="inlineStr"><is><t>a</t></is></c></row><row><c r="A2"><v>1</v></c></row></sheetData><mergeCells><mergeCell ref="A1:A2"/></mergeCells></worksheet>` }, "XLSX_MERGED_CELL_DETECTED"],
    ["formula without cache", { sheet: `<worksheet><sheetData><row><c r="A1" t="inlineStr"><is><t>a</t></is></c></row><row><c r="A2"><f>1+1</f></c></row></sheetData></worksheet>` }, "XLSX_FORMULA_CELL_DETECTED"],
    ["formula with cache", { sheet: `<worksheet><sheetData><row><c r="A1" t="inlineStr"><is><t>a</t></is></c></row><row><c r="A2"><f>1+1</f><v>2</v></c></row></sheetData></worksheet>` }, "XLSX_FORMULA_CELL_DETECTED"],
    ["error cell", { sheet: `<worksheet><sheetData><row><c r="A1" t="inlineStr"><is><t>a</t></is></c></row><row><c r="A2" t="e"><v>#N/A</v></c></row></sheetData></worksheet>` }, "XLSX_ERROR_CELL_DETECTED"],
    ["ambiguous date styled number", { sheet: `<worksheet><sheetData><row><c r="A1" t="inlineStr"><is><t>a</t></is></c></row><row><c r="A2" s="1"><v>45000</v></c></row></sheetData></worksheet>` }, "XLSX_AMBIGUOUS_DATE_VALUE"],
    ["invalid shared-string reference", { sheet: `<worksheet><sheetData><row><c r="A1" t="inlineStr"><is><t>a</t></is></c></row><row><c r="A2" t="s"><v>9</v></c></row></sheetData></worksheet>`, sharedStrings: `<sst><si><t>x</t></si></sst>` }, "XLSX_SHARED_STRING_INVALID"],
    ["rich shared string", { sheet: `<worksheet><sheetData><row><c r="A1" t="inlineStr"><is><t>a</t></is></c></row><row><c r="A2" t="s"><v>0</v></c></row></sheetData></worksheet>`, sharedStrings: `<sst><si><r><t>x</t></r></si></sst>` }, "XLSX_UNSUPPORTED_CELL_TYPE"],
    ["non-finite number", { sheet: `<worksheet><sheetData><row><c r="A1" t="inlineStr"><is><t>a</t></is></c></row><row><c r="A2"><v>Infinity</v></c></row></sheetData></worksheet>` }, "XLSX_NON_FINITE_NUMBER"],
    ["missing header", { sheet: `<worksheet><sheetData><row><c r="A1"/></row><row><c r="A2"><v>1</v></c></row></sheetData></worksheet>` }, "XLSX_HEADER_MISSING"],
    ["duplicate header", { sheet: `<worksheet><sheetData><row><c r="A1" t="inlineStr"><is><t>a</t></is></c><c r="B1" t="inlineStr"><is><t>a</t></is></c></row><row><c r="A2"><v>1</v></c><c r="B2"><v>2</v></c></row></sheetData></worksheet>` }, "XLSX_DUPLICATE_HEADER"],
    ["non-rectangular trailing row", { sheet: `<worksheet><sheetData><row><c r="A1" t="inlineStr"><is><t>a</t></is></c></row><row><c r="A2"><v>1</v></c><c r="B2"><v>2</v></c></row></sheetData></worksheet>` }, "XLSX_ROW_NOT_RECTANGULAR"],
    ["empty data", { sheet: `<worksheet><sheetData><row><c r="A1" t="inlineStr"><is><t>a</t></is></c></row></sheetData></worksheet>` }, "XLSX_DATASET_EMPTY"],
    ["unsupported cell type", { sheet: `<worksheet><sheetData><row><c r="A1" t="inlineStr"><is><t>a</t></is></c></row><row><c r="A2" t="d"><v>2026-01-01</v></c></row></sheetData></worksheet>` }, "XLSX_UNSUPPORTED_CELL_TYPE"],
    ["required part absence", { rootRels: "" }, "XLSX_PACKAGE_INVALID"],
    ["unsupported content type", { contentTypes: `<Types><Override ContentType="text/plain"/></Types>` }, "XLSX_UNSUPPORTED_CONTENT_TYPE"],
  ];
  it.each(workbookCases)("rejects %s", async (_name, options, expected) => {
    const config = expected === "XLSX_WORKSHEET_NAME_MISMATCH" ? one({ expectedWorksheetName: "Other" }) : xlsxLimits;
    await denial(xlsxBytes(options), expected, config);
  });

  it("rejects malformed ZIP", async () => denial(xlsxBytes().slice(0, -12), "XLSX_PACKAGE_INVALID"));
  it("rejects ZIP traversal", async () => denial(xlsxBytes({ extra: { "../evil.xml": "x" } }), "XLSX_ZIP_PATH_INVALID"));
  it("rejects duplicate ZIP package paths", async () => {
    const bytes = xlsxBytes({ extra: { "xl/a.xml": "a", "xl/b.xml": "b" } });
    await denial(replaceZipName(bytes, "xl/b.xml", "xl/a.xml"), "XLSX_PACKAGE_INVALID");
  });
  it("rejects encrypted ZIP entries", async () => denial(addZipFlag(xlsxBytes(), 0x01), "XLSX_ENCRYPTED_WORKBOOK"));
  it("rejects unsupported ZIP features", async () => denial(addZipFlag(xlsxBytes(), 0x40), "XLSX_PACKAGE_INVALID"));
  it("enforces source/compressed package size", async () => denial(xlsxBytes(), "XLSX_ZIP_LIMIT_EXCEEDED", one({ maxSourceBytes: 10 })));
  it("enforces expanded size", async () => denial(xlsxBytes(), "XLSX_EXPANDED_SIZE_EXCEEDED", one({ maxExpandedBytes: 10 })));
  it("enforces compression ratio", async () => denial(xlsxBytes(), "XLSX_ZIP_LIMIT_EXCEEDED", one({ maxCompressionRatio: 1 })));
  it("enforces entry count", async () => denial(xlsxBytes(), "XLSX_ZIP_LIMIT_EXCEEDED", one({ maxEntries: 4 })));
  it("enforces row count", async () => {
    const sheet = `<worksheet><sheetData><row><c r="A1" t="inlineStr"><is><t>a</t></is></c></row><row><c r="A2"><v>1</v></c></row><row><c r="A3"><v>2</v></c></row></sheetData></worksheet>`;
    await denial(xlsxBytes({ sheet }), "XLSX_RESOURCE_LIMIT_EXCEEDED", one({ maxRows: 1 }));
  });
  it("enforces column count", async () => denial(xlsxBytes(), "XLSX_ROW_NOT_RECTANGULAR", one({ maxColumns: 2 })));
  it("enforces cell count", async () => denial(xlsxBytes(), "XLSX_RESOURCE_LIMIT_EXCEEDED", one({ maxCells: 4 })));
  it("enforces cell length", async () => denial(xlsxBytes(), "XLSX_RESOURCE_LIMIT_EXCEEDED", one({ maxCellLength: 3 })));
  it("enforces total characters", async () => denial(xlsxBytes(), "XLSX_RESOURCE_LIMIT_EXCEEDED", one({ maxTotalCharacters: 5 })));
  it("rejects invalid immutable adapter configuration", async () => denial(xlsxBytes(), "XLSX_PROFILE_INVALID", one({ expectedWorksheetName: "" })));
});
