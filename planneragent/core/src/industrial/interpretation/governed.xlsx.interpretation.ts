import { createHash } from "node:crypto";
import { unzipSync } from "fflate";
import type {
  CanonicalGovernedUploadProvenanceV1,
  VerifiedGovernedInterpretationInputV1,
} from "../provenance";
import {
  AUTHORITATIVE_EXTERNAL_DATA_VERSION,
  type AuthoritativeExternalData,
} from "./authoritative.external.data";

export const XLSX_INTERPRETATION_PROFILE = "GOVERNED_PASSIVE_XLSX_V1" as const;
export const XLSX_INTERPRETATION_VERSION = "1" as const;

export interface XlsxInterpretationConfiguration {
  readonly expectedWorksheetName: string;
  readonly maxSourceBytes: number;
  readonly maxExpandedBytes: number;
  readonly maxEntries: number;
  readonly maxCompressionRatio: number;
  readonly maxSharedStrings: number;
  readonly maxRows: number;
  readonly maxColumns: number;
  readonly maxCells: number;
  readonly maxCellLength: number;
  readonly maxTotalCharacters: number;
}

export interface VerifiedXlsxContent { readonly bytes: Uint8Array }
export type VerifiedGovernedXlsxInterpretationInputV1 =
  VerifiedGovernedInterpretationInputV1<VerifiedXlsxContent, XlsxInterpretationConfiguration>;

export type XlsxInterpretationDenial =
  | "XLSX_PROFILE_INVALID" | "XLSX_FORMAT_NOT_ADMITTED"
  | "XLSX_PACKAGE_INVALID" | "XLSX_ZIP_PATH_INVALID"
  | "XLSX_ZIP_LIMIT_EXCEEDED" | "XLSX_EXPANDED_SIZE_EXCEEDED"
  | "XLSX_UNSUPPORTED_CONTENT_TYPE" | "XLSX_MACRO_CONTENT_DETECTED"
  | "XLSX_EXTERNAL_LINK_DETECTED" | "XLSX_EMBEDDED_OBJECT_DETECTED"
  | "XLSX_ENCRYPTED_WORKBOOK" | "XLSX_CALCULATION_CHAIN_DETECTED"
  | "XLSX_WORKSHEET_COUNT_INVALID" | "XLSX_HIDDEN_WORKSHEET_DETECTED"
  | "XLSX_WORKSHEET_NAME_MISMATCH" | "XLSX_MERGED_CELL_DETECTED"
  | "XLSX_FORMULA_CELL_DETECTED" | "XLSX_ERROR_CELL_DETECTED"
  | "XLSX_UNSUPPORTED_CELL_TYPE" | "XLSX_SHARED_STRING_INVALID"
  | "XLSX_NON_FINITE_NUMBER" | "XLSX_AMBIGUOUS_DATE_VALUE"
  | "XLSX_HEADER_MISSING" | "XLSX_DUPLICATE_HEADER"
  | "XLSX_ROW_NOT_RECTANGULAR" | "XLSX_RESOURCE_LIMIT_EXCEEDED"
  | "XLSX_DATASET_EMPTY" | "XLSX_CONTENT_UNAVAILABLE"
  | "XLSX_BYTE_INTEGRITY_INVALID" | "XLSX_INTERPRETATION_FAILED";

export interface PassiveXlsxExtraction {
  readonly profile: typeof XLSX_INTERPRETATION_PROFILE;
  readonly version: typeof XLSX_INTERPRETATION_VERSION;
  readonly sourceFormat: "XLSX";
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
  readonly metadata: Readonly<Record<string, string | number | boolean | null>>;
}

export type XlsxInterpretationResult =
  | Readonly<{ interpreted: true; extraction: PassiveXlsxExtraction }>
  | Readonly<{ interpreted: false; denial: XlsxInterpretationDenial }>;
export type XlsxAuthoritativeExternalDataResult =
  | Readonly<{ constructed: true; data: AuthoritativeExternalData }>
  | Readonly<{ constructed: false; denial: "XLSX_EXTRACTION_INVALID" }>;

const HEX = /^[0-9a-f]{64}$/;
const produced = new WeakSet<object>();
const textDecoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: false });

function deny(denial: XlsxInterpretationDenial): XlsxInterpretationResult {
  return Object.freeze({ interpreted: false, denial });
}
function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
function sha(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}
function identity(kind: string, fields: readonly unknown[]): string {
  return `${kind}:sha256:${sha(JSON.stringify(fields))}`;
}
function validConfig(c: XlsxInterpretationConfiguration): boolean {
  return !!c && typeof c.expectedWorksheetName === "string" &&
    c.expectedWorksheetName.length > 0 && c.expectedWorksheetName.length <= 31 &&
    !/[\\/?*:[\]]/.test(c.expectedWorksheetName) &&
    [c.maxSourceBytes, c.maxExpandedBytes, c.maxEntries, c.maxSharedStrings,
      c.maxRows, c.maxColumns, c.maxCells, c.maxCellLength,
      c.maxTotalCharacters].every(n => Number.isSafeInteger(n) && n > 0) &&
    Number.isFinite(c.maxCompressionRatio) && c.maxCompressionRatio >= 1;
}
function u16(b: Uint8Array, o: number): number {
  return b[o]! | (b[o + 1]! << 8);
}
function u32(b: Uint8Array, o: number): number {
  return (b[o]! | (b[o + 1]! << 8) | (b[o + 2]! << 16) | (b[o + 3]! << 24)) >>> 0;
}
function safePath(path: string): boolean {
  return path.length > 0 && path.length <= 255 && !path.includes("\\") &&
    !path.startsWith("/") && !/^[A-Za-z]:/.test(path) &&
    path.split("/").every(p => p !== "" && p !== "." && p !== "..");
}

type Entry = { name: string; compressed: number; expanded: number; method: number };
function inspectZip(bytes: Uint8Array, c: XlsxInterpretationConfiguration):
  Entry[] | XlsxInterpretationDenial {
  if (bytes.length > c.maxSourceBytes) return "XLSX_ZIP_LIMIT_EXCEEDED";
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65_557); i--) {
    if (u32(bytes, i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0 || eocd + 22 + u16(bytes, eocd + 20) !== bytes.length ||
    u16(bytes, eocd + 4) !== 0 || u16(bytes, eocd + 6) !== 0) {
    return "XLSX_PACKAGE_INVALID";
  }
  const count = u16(bytes, eocd + 10);
  const cdSize = u32(bytes, eocd + 12);
  const cdOffset = u32(bytes, eocd + 16);
  if (count < 1 || count > c.maxEntries) return "XLSX_ZIP_LIMIT_EXCEEDED";
  if (cdOffset + cdSize !== eocd) return "XLSX_PACKAGE_INVALID";
  const names = new Set<string>();
  const entries: Entry[] = [];
  let total = 0;
  let p = cdOffset;
  for (let i = 0; i < count; i++) {
    if (p + 46 > eocd || u32(bytes, p) !== 0x02014b50) return "XLSX_PACKAGE_INVALID";
    const flags = u16(bytes, p + 8);
    const method = u16(bytes, p + 10);
    const compressed = u32(bytes, p + 20);
    const expanded = u32(bytes, p + 24);
    const nameLen = u16(bytes, p + 28), extraLen = u16(bytes, p + 30), commentLen = u16(bytes, p + 32);
    if ((flags & 1) !== 0) return "XLSX_ENCRYPTED_WORKBOOK";
    if ((flags & ~(0x0008 | 0x0800)) !== 0 || (method !== 0 && method !== 8) ||
      compressed === 0xffffffff || expanded === 0xffffffff) return "XLSX_PACKAGE_INVALID";
    let name: string;
    try { name = textDecoder.decode(bytes.slice(p + 46, p + 46 + nameLen)); }
    catch { return "XLSX_PACKAGE_INVALID"; }
    if ((flags & 0x800) === 0 && !/^[\x20-\x7e]+$/.test(name)) return "XLSX_PACKAGE_INVALID";
    if (!safePath(name)) return "XLSX_ZIP_PATH_INVALID";
    if (names.has(name)) return "XLSX_PACKAGE_INVALID";
    names.add(name);
    total += expanded;
    if (total > c.maxExpandedBytes) return "XLSX_EXPANDED_SIZE_EXCEEDED";
    if (expanded > 0 && expanded / Math.max(1, compressed) > c.maxCompressionRatio) {
      return "XLSX_ZIP_LIMIT_EXCEEDED";
    }
    entries.push({ name, compressed, expanded, method });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return p === eocd ? entries : "XLSX_PACKAGE_INVALID";
}

function xml(bytes: Uint8Array | undefined): string | null {
  if (!bytes) return null;
  try {
    const value = textDecoder.decode(bytes);
    return /<!DOCTYPE|<!ENTITY/i.test(value) ? null : value;
  } catch { return null; }
}
function attrs(source: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of source.matchAll(/([A-Za-z_][\w:.-]*)\s*=\s*(["'])(.*?)\2/gs)) out[m[1]!] = decodeXml(m[3]!);
  return out;
}
function decodeXml(value: string): string {
  return value.replace(/&(?:lt|gt|amp|quot|apos|#\d+|#x[0-9a-fA-F]+);/g, entity => {
    const named: Record<string, string> = { "&lt;": "<", "&gt;": ">", "&amp;": "&", "&quot;": '"', "&apos;": "'" };
    if (named[entity]) return named[entity];
    const n = entity.startsWith("&#x") ? parseInt(entity.slice(3, -1), 16) : parseInt(entity.slice(2, -1), 10);
    if (!Number.isInteger(n) || n < 0 || n > 0x10ffff || (n >= 0xd800 && n <= 0xdfff)) throw new Error("XML_ENTITY");
    return String.fromCodePoint(n);
  });
}
function relTarget(workbookRels: string, id: string): { target: string; type: string } | null {
  for (const m of workbookRels.matchAll(/<Relationship\b([^>]*)\/?\s*>/g)) {
    const a = attrs(m[1]!);
    if (a.Id === id) return { target: a.Target ?? "", type: a.Type ?? "" };
  }
  return null;
}
function normalizeTarget(target: string): string | null {
  const raw = target.startsWith("/") ? target.slice(1) : `xl/${target}`;
  const parts: string[] = [];
  for (const p of raw.split("/")) {
    if (p === "..") parts.pop(); else if (p !== "." && p !== "") parts.push(p);
  }
  const value = parts.join("/");
  return safePath(value) ? value : null;
}
function columnIndex(ref: string): number | null {
  const m = /^([A-Z]+)([1-9]\d*)$/.exec(ref);
  if (!m) return null;
  let n = 0;
  for (const ch of m[1]!) n = n * 26 + ch.charCodeAt(0) - 64;
  return n - 1;
}

function parseSharedStrings(source: string | null, c: XlsxInterpretationConfiguration):
  string[] | XlsxInterpretationDenial {
  if (!source) return [];
  const values: string[] = [];
  for (const m of source.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)) {
    if (/<r\b|<rPh\b|<phoneticPr\b/.test(m[1]!)) return "XLSX_UNSUPPORTED_CELL_TYPE";
    const texts = [...m[1]!.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)];
    if (texts.length !== 1) return "XLSX_SHARED_STRING_INVALID";
    let value: string;
    try { value = decodeXml(texts[0]![1]!); } catch { return "XLSX_SHARED_STRING_INVALID"; }
    if (value.length > c.maxCellLength) return "XLSX_RESOURCE_LIMIT_EXCEEDED";
    values.push(value);
    if (values.length > c.maxSharedStrings) return "XLSX_RESOURCE_LIMIT_EXCEEDED";
  }
  return values;
}

function parseSheet(source: string, shared: string[], c: XlsxInterpretationConfiguration):
  { headers: string[]; rows: string[][]; chars: number; cells: number } | XlsxInterpretationDenial {
  if (/<mergeCells\b|<mergeCell\b/.test(source)) return "XLSX_MERGED_CELL_DETECTED";
  const rows: string[][] = [];
  let cells = 0, chars = 0;
  for (const rm of source.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const map = new Map<number, string>();
    let last = -1;
    for (const cm of rm[1]!.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const a = attrs(cm[1]!); const body = cm[2] ?? "";
      if (/<f\b/.test(body)) return "XLSX_FORMULA_CELL_DETECTED";
      if (a.t === "e") return "XLSX_ERROR_CELL_DETECTED";
      if (a.s && a.s !== "0" && (!a.t || a.t === "n")) return "XLSX_AMBIGUOUS_DATE_VALUE";
      const col = columnIndex(a.r ?? "");
      if (col == null || col <= last || col >= c.maxColumns) return "XLSX_ROW_NOT_RECTANGULAR";
      last = col; let value = "";
      const vm = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(body);
      const tm = /<is\b[^>]*>([\s\S]*?)<\/is>/.exec(body);
      try {
        if (a.t === "inlineStr") {
          if (!tm || /<r\b/.test(tm[1]!)) return "XLSX_UNSUPPORTED_CELL_TYPE";
          const text = /<t\b[^>]*>([\s\S]*?)<\/t>/.exec(tm[1]!);
          if (!text) return "XLSX_UNSUPPORTED_CELL_TYPE";
          value = decodeXml(text[1]!);
        } else if (a.t === "s") {
          if (!vm || !/^\d+$/.test(vm[1]!)) return "XLSX_SHARED_STRING_INVALID";
          const index = Number(vm[1]);
          if (index >= shared.length) return "XLSX_SHARED_STRING_INVALID";
          value = shared[index]!;
        } else if (a.t === "b") {
          if (!vm || (vm[1] !== "0" && vm[1] !== "1")) return "XLSX_UNSUPPORTED_CELL_TYPE";
          value = vm[1] === "1" ? "true" : "false";
        } else if (!a.t || a.t === "n") {
          if (vm) {
            const n = Number(vm[1]);
            if (!Number.isFinite(n)) return "XLSX_NON_FINITE_NUMBER";
            value = String(n);
          }
        } else return "XLSX_UNSUPPORTED_CELL_TYPE";
      } catch { return "XLSX_UNSUPPORTED_CELL_TYPE"; }
      if (value.length > c.maxCellLength) return "XLSX_RESOURCE_LIMIT_EXCEEDED";
      cells++; chars += value.length;
      if (cells > c.maxCells || chars > c.maxTotalCharacters) return "XLSX_RESOURCE_LIMIT_EXCEEDED";
      map.set(col, value);
    }
    if (map.size === 0) continue;
    const width = Math.max(...map.keys()) + 1;
    const row = Array.from({ length: width }, (_, i) => map.get(i) ?? "");
    rows.push(row);
    if (rows.length > c.maxRows + 1) return "XLSX_RESOURCE_LIMIT_EXCEEDED";
  }
  if (rows.length === 0) return "XLSX_DATASET_EMPTY";
  const headers = rows.shift()!;
  if (headers.length === 0 || headers.some(h => h.trim().length === 0)) return "XLSX_HEADER_MISSING";
  if (new Set(headers).size !== headers.length) return "XLSX_DUPLICATE_HEADER";
  for (const row of rows) {
    if (row.length !== headers.length) return "XLSX_ROW_NOT_RECTANGULAR";
  }
  if (rows.length === 0) return "XLSX_DATASET_EMPTY";
  return { headers, rows, chars, cells };
}

function parsePackage(bytes: Uint8Array, c: XlsxInterpretationConfiguration):
  { headers: string[]; rows: string[][]; metadata: Record<string, string | number | boolean | null> } | XlsxInterpretationDenial {
  const inspected = inspectZip(bytes, c);
  if (!Array.isArray(inspected)) return inspected;
  const names = new Set(inspected.map(e => e.name));
  for (const name of names) {
    const lower = name.toLowerCase();
    if (lower.includes("vbaproject") || lower.includes("macrosheet")) return "XLSX_MACRO_CONTENT_DETECTED";
    if (lower.startsWith("xl/externallinks/")) return "XLSX_EXTERNAL_LINK_DETECTED";
    if (lower.startsWith("xl/embeddings/") || lower.startsWith("xl/drawings/") || lower.startsWith("xl/media/")) return "XLSX_EMBEDDED_OBJECT_DETECTED";
    if (lower === "xl/calcchain.xml") return "XLSX_CALCULATION_CHAIN_DETECTED";
    if (lower === "encryptedpackage" || lower === "encryptioninfo") return "XLSX_ENCRYPTED_WORKBOOK";
  }
  let files: Record<string, Uint8Array>;
  try { files = unzipSync(bytes); } catch { return "XLSX_PACKAGE_INVALID"; }
  for (const entry of inspected) if (!files[entry.name] || files[entry.name]!.length !== entry.expanded) return "XLSX_PACKAGE_INVALID";
  const contentTypes = xml(files["[Content_Types].xml"]);
  const workbook = xml(files["xl/workbook.xml"]);
  const rels = xml(files["xl/_rels/workbook.xml.rels"]);
  const rootRels = xml(files["_rels/.rels"]);
  if (!contentTypes || !workbook || !rels || !rootRels) return "XLSX_PACKAGE_INVALID";
  if (/macroEnabled|vbaProject|activeX|oleObject/i.test(contentTypes)) return "XLSX_MACRO_CONTENT_DETECTED";
  if (!/application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet\.main\+xml/.test(contentTypes)) return "XLSX_UNSUPPORTED_CONTENT_TYPE";
  const relationshipXml = Object.entries(files)
    .filter(([name]) => name.toLowerCase().endsWith(".rels"))
    .map(([, value]) => xml(value));
  if (relationshipXml.some(value => value == null)) return "XLSX_PACKAGE_INVALID";
  const allRelationships = relationshipXml.join("\n");
  if (/TargetMode\s*=\s*["']External["']/i.test(allRelationships)) return "XLSX_EXTERNAL_LINK_DETECTED";
  if (/(?:relationships\/)?(?:oleObject|package|image)(?:["']|$)/i.test(allRelationships)) return "XLSX_EMBEDDED_OBJECT_DETECTED";
  const sheets = [...workbook.matchAll(/<sheet\b([^>]*)\/?\s*>/g)].map(m => attrs(m[1]!));
  if (sheets.length !== 1) return "XLSX_WORKSHEET_COUNT_INVALID";
  const sheet = sheets[0]!;
  if (sheet.state && sheet.state !== "visible") return "XLSX_HIDDEN_WORKSHEET_DETECTED";
  if (sheet.name !== c.expectedWorksheetName) return "XLSX_WORKSHEET_NAME_MISMATCH";
  const relation = relTarget(rels, sheet["r:id"] ?? "");
  if (!relation || !relation.type.endsWith("/worksheet")) return "XLSX_PACKAGE_INVALID";
  const sheetPath = normalizeTarget(relation.target);
  if (!sheetPath || !names.has(sheetPath)) return "XLSX_PACKAGE_INVALID";
  const sheetXml = xml(files[sheetPath]);
  if (!sheetXml) return "XLSX_PACKAGE_INVALID";
  const shared = parseSharedStrings(xml(files["xl/sharedStrings.xml"]), c);
  if (!Array.isArray(shared)) return shared;
  const parsed = parseSheet(sheetXml, shared, c);
  if (typeof parsed === "string") return parsed;
  return {
    headers: parsed.headers, rows: parsed.rows,
    metadata: {
      encoding: "UTF-8", worksheetCount: 1,
      worksheetName: c.expectedWorksheetName,
      headerCount: parsed.headers.length, rowCount: parsed.rows.length,
      cellCount: parsed.cells, totalCharacters: parsed.chars,
      formulaSafety: "REJECT_ALL_FORMULA_CELLS",
      sourceByteLength: bytes.length,
    },
  };
}

export async function interpretAdmittedXlsx(
  input: VerifiedGovernedXlsxInterpretationInputV1,
): Promise<XlsxInterpretationResult> {
  if (!input || input.version !== 1 || !Object.isFrozen(input) ||
    !Object.isFrozen(input.canonical_provenance) ||
    input.canonical_provenance.chain_head !== input.acquisition_provenance) return deny("XLSX_PROFILE_INVALID");
  if (input.admission?.reference?.detectedFormat !== "XLSX" ||
    input.acquisition_provenance?.facts?.detected_format !== "XLSX") return deny("XLSX_FORMAT_NOT_ADMITTED");
  if (!validConfig(input.adapter_configuration)) return deny("XLSX_PROFILE_INVALID");
  const acquisition = input.acquisition_provenance.facts;
  try {
    const content = await input.content_reader.readVerifiedContent(input.content_read_request);
    if (!content) return deny("XLSX_CONTENT_UNAVAILABLE");
    if (!(content.bytes instanceof Uint8Array) || content.bytes.length !== acquisition.byte_length ||
      !HEX.test(acquisition.source_byte_digest.value) || sha(content.bytes) !== acquisition.source_byte_digest.value) {
      return deny("XLSX_BYTE_INTEGRITY_INVALID");
    }
    const parsed = parsePackage(content.bytes.slice(), input.adapter_configuration);
    if (typeof parsed === "string") return deny(parsed);
    const governed = input.acquisition_provenance.previous.previous.facts;
    const sourceIdentity = `upload:sha256:${acquisition.source_byte_digest.value}`;
    const interpretationIdentity = identity("interpretation", [
      acquisition.acquisition_id, sourceIdentity, XLSX_INTERPRETATION_PROFILE,
      XLSX_INTERPRETATION_VERSION, input.adapter_configuration,
    ]);
    const datasetIdentity = identity("dataset", [interpretationIdentity, parsed.headers, parsed.rows]);
    const extraction = deepFreeze({
      profile: XLSX_INTERPRETATION_PROFILE, version: XLSX_INTERPRETATION_VERSION,
      sourceFormat: "XLSX" as const, tenantId: governed.tenant_id,
      sourceIdentity, uploadId: acquisition.upload_id,
      uploadDigest: acquisition.source_byte_digest.value,
      acquisitionIdentity: acquisition.acquisition_id,
      canonicalProvenance: input.canonical_provenance,
      interpretationIdentity, datasetIdentity,
      headers: parsed.headers, rows: parsed.rows, metadata: parsed.metadata,
    }) as PassiveXlsxExtraction;
    produced.add(extraction);
    return Object.freeze({ interpreted: true, extraction });
  } catch { return deny("XLSX_INTERPRETATION_FAILED"); }
}

export function constructXlsxAuthoritativeExternalData(
  extraction: PassiveXlsxExtraction,
): XlsxAuthoritativeExternalDataResult {
  if (!extraction || !produced.has(extraction)) return Object.freeze({ constructed: false, denial: "XLSX_EXTRACTION_INVALID" });
  const data = deepFreeze({
    contractVersion: AUTHORITATIVE_EXTERNAL_DATA_VERSION,
    tenantId: extraction.tenantId, sourceIdentity: extraction.sourceIdentity,
    acquisitionIdentity: extraction.acquisitionIdentity,
    interpretationIdentity: extraction.interpretationIdentity,
    interpretationProfile: extraction.profile,
    interpretationVersion: extraction.version,
    datasetIdentity: extraction.datasetIdentity, headers: extraction.headers,
    rows: extraction.rows, extractionMetadata: extraction.metadata,
    provenance: extraction.canonicalProvenance,
    lineage: {
      uploadId: extraction.uploadId, uploadDigestAlgorithm: "SHA-256" as const,
      uploadDigest: extraction.uploadDigest,
      acquisitionIdentity: extraction.acquisitionIdentity,
      interpretationIdentity: extraction.interpretationIdentity,
      datasetIdentity: extraction.datasetIdentity,
    },
  }) as AuthoritativeExternalData;
  return Object.freeze({ constructed: true, data });
}
