import { createHash } from "node:crypto";
import { strToU8, zipSync } from "fflate";
import type { GovernedUploadVerificationResultV1 } from "../../operational-identity/verification";
import {
  assembleCanonicalGovernedUploadProvenanceV1,
  createVerifiedGovernedInterpretationInputV1,
} from "../provenance";
import type {
  VerifiedGovernedXlsxInterpretationInputV1,
  XlsxInterpretationConfiguration,
} from "../interpretation/governed.xlsx.interpretation";

function freeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

export const xlsxLimits: XlsxInterpretationConfiguration = Object.freeze({
  expectedWorksheetName: "Plan", maxSourceBytes: 1_000_000,
  maxExpandedBytes: 2_000_000, maxEntries: 40, maxCompressionRatio: 100,
  maxSharedStrings: 100, maxRows: 100, maxColumns: 20, maxCells: 2_000,
  maxCellLength: 1_000, maxTotalCharacters: 20_000,
});

export type XlsxPartsOptions = Readonly<{
  workbook?: string; sheet?: string; workbookRels?: string;
  contentTypes?: string; rootRels?: string; sharedStrings?: string;
  extra?: Readonly<Record<string, string>>;
}>;

export function xlsxBytes(options: XlsxPartsOptions = {}): Uint8Array {
  const workbook = options.workbook ?? `<?xml version="1.0"?><workbook xmlns:r="r"><sheets><sheet name="Plan" sheetId="1" r:id="rId1"/></sheets></workbook>`;
  const sheet = options.sheet ?? `<worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>orderId</t></is></c><c r="B1" t="inlineStr"><is><t>sku</t></is></c><c r="C1" t="inlineStr"><is><t>qty</t></is></c></row><row r="2"><c r="A2" t="inlineStr"><is><t>O1</t></is></c><c r="B2" t="inlineStr"><is><t>SKU1</t></is></c><c r="C2"><v>2</v></c></row></sheetData></worksheet>`;
  const files: Record<string, Uint8Array> = {
    "[Content_Types].xml": strToU8(options.contentTypes ?? `<Types><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/></Types>`),
    "_rels/.rels": strToU8(options.rootRels ?? `<Relationships><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
    "xl/workbook.xml": strToU8(workbook),
    "xl/_rels/workbook.xml.rels": strToU8(options.workbookRels ?? `<Relationships><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`),
    "xl/worksheets/sheet1.xml": strToU8(sheet),
  };
  if (options.sharedStrings !== undefined) files["xl/sharedStrings.xml"] = strToU8(options.sharedStrings);
  for (const [name, value] of Object.entries(options.extra ?? {})) files[name] = strToU8(value);
  return zipSync(files, { level: 6 });
}

export function replaceZipName(bytes: Uint8Array, from: string, to: string): Uint8Array {
  if (from.length !== to.length) throw new Error("ZIP names must have equal byte length");
  const output = bytes.slice();
  const source = strToU8(from), replacement = strToU8(to);
  for (let i = 0; i <= output.length - source.length; i++) {
    if (source.every((value, offset) => output[i + offset] === value)) {
      output.set(replacement, i); i += source.length - 1;
    }
  }
  return output;
}

export function addZipFlag(bytes: Uint8Array, flag: number): Uint8Array {
  const output = bytes.slice();
  for (let i = 0; i + 10 < output.length; i++) {
    const signature = output[i]! | output[i + 1]! << 8 | output[i + 2]! << 16 | output[i + 3]! << 24;
    const offset = signature === 0x04034b50 ? i + 6 : signature === 0x02014b50 ? i + 8 : -1;
    if (offset >= 0) output[offset] = output[offset]! | flag;
  }
  return output;
}

export function governedXlsxInput(
  bytes: Uint8Array,
  configuration: XlsxInterpretationConfiguration = xlsxLimits,
  readBytes: Uint8Array = bytes,
): VerifiedGovernedXlsxInterpretationInputV1 {
  const digest = createHash("sha256").update(bytes).digest("hex");
  const verification = freeze({
    version: 1, outcome: "VERIFIED", admitted_object_id: "admitted-xlsx-1",
    acquisition_id: "acquisition-xlsx-1", upload_id: "upload-xlsx-1",
    principal_id: "principal-1", session_id: "session-1", membership_id: "membership-1",
    company_id: "company-1", tenant_id: "tenant-1", ownership_reference: "ownership-1",
    authorization_decision_id: "authorization:1",
    consumption_reference: "governed-upload:upload-xlsx-1:wu8:authorization:1",
    resource: "governed-upload:industrial-file", purpose: "operational-planning",
    permission: "UPLOAD_DATA", policy_version: "upload-policy-v1", byte_digest: digest,
    byte_length: bytes.length, acquisition_profile: "UNIVERSAL_SECURE_FILE_ACQUISITION_V1",
    interpretation_registry_version: "1", quarantine_reference: "quarantine:1",
    inspection_id: "inspection:1", malware_scan_id: "scan:1", detected_format: "XLSX",
    admitted_at: "2026-07-31T10:00:00.000Z", correlation_id: "correlation-1",
    audit_lineage: ["audit-1"], current_state: { principal: "ACTIVE", session: "ACTIVE",
      membership: "ACTIVE", company: "ACTIVE", tenant: "ACTIVE", drifted: false },
  }) as GovernedUploadVerificationResultV1;
  const admission = freeze({ processed: true, disposition: "ADMITTED_FOR_GOVERNED_INTERPRETATION",
    reference: { acquisitionProfile: verification.acquisition_profile,
      interpretationRegistryVersion: verification.interpretation_registry_version,
      uploadId: verification.upload_id, tenantId: verification.tenant_id,
      companyId: verification.company_id, authorizationReference: verification.authorization_decision_id,
      quarantineReference: verification.quarantine_reference, inspectionId: verification.inspection_id,
      malwareScanId: verification.malware_scan_id, detectedFormat: "XLSX",
      byteDigestAlgorithm: "SHA-256", byteDigest: digest, byteLength: bytes.length,
      admittedAt: verification.admitted_at } });
  const assembled = assembleCanonicalGovernedUploadProvenanceV1(verification);
  if (!assembled.assembled) throw new Error(assembled.failure);
  const created = createVerifiedGovernedInterpretationInputV1({ version: 1,
    admission: admission as any, verification, provenance: assembled.provenance,
    content_reader: { async readVerifiedContent() { return { bytes: readBytes }; } },
    adapter_configuration: configuration });
  if (!created.created) throw new Error(created.failure);
  return created.input as VerifiedGovernedXlsxInterpretationInputV1;
}
