import { createHash } from "node:crypto";

export const INDUSTRIAL_INTERPRETATION_REGISTRY_VERSION = "1" as const;
export const SECURE_FILE_ACQUISITION_PROFILE =
  "UNIVERSAL_SECURE_FILE_ACQUISITION_V1" as const;

export type IndustrialInterpretationFormat =
  | "CSV"
  | "XLSX"
  | "TXT_DAT"
  | "JSON"
  | "XML";

export type InspectedFileFormat =
  | IndustrialInterpretationFormat
  | "PDF"
  | "DOCX"
  | "PPTX"
  | "IMAGE"
  | "ARCHIVE"
  | "EXECUTABLE"
  | "PROPRIETARY"
  | "UNKNOWN";

export interface UntrustedFileUpload {
  readonly uploadId: string;
  readonly tenantId: string;
  readonly companyId: string;
  readonly workloadId: string;
  readonly claimedFileName: string;
  readonly claimedMediaType: string;
  readonly bytes: Uint8Array;
}

export interface FileAcquisitionAuthorization {
  readonly authorized: boolean;
  readonly uploadId: string;
  readonly tenantId: string;
  readonly companyId: string;
  readonly authorizationReference?: string;
}

export interface FileQuarantineEvidence {
  readonly quarantined: true;
  readonly uploadId: string;
  readonly tenantId: string;
  readonly quarantineReference: string;
  readonly byteDigest: string;
  readonly byteLength: number;
  readonly quarantinedAt: string;
}

export interface FileStructuralInspection {
  readonly completed: true;
  readonly inspectionId: string;
  readonly quarantineReference: string;
  readonly byteDigest: string;
  readonly detectedFormat: InspectedFileFormat;
  readonly structureStatus: "VALID" | "INVALID" | "INCONCLUSIVE";
  readonly extensionMediaTypeCoherent: boolean;
  readonly passiveDataOnly: boolean;
  readonly encrypted: boolean;
  readonly macrosPresent: boolean;
  readonly activeContentPresent: boolean;
  readonly embeddedObjectsPresent: boolean;
  readonly externalConnectionsPresent: boolean;
  readonly archivePathTraversalDetected: boolean;
  readonly decompressionBombDetected: boolean;
  readonly resourceLimitsExceeded: boolean;
}

export interface FileMalwareScanEvidence {
  readonly completed: true;
  readonly scanId: string;
  readonly quarantineReference: string;
  readonly byteDigest: string;
  readonly scannerProfileVersion: string;
  readonly verdict: "CLEAN" | "MALICIOUS" | "INCONCLUSIVE";
  readonly scannedAt: string;
}

export interface SecureFileAcquisitionServices {
  authorize(
    request: Readonly<{
      uploadId: string;
      tenantId: string;
      companyId: string;
      workloadId: string;
    }>,
  ): Promise<FileAcquisitionAuthorization>;
  quarantine(
    request: Readonly<{
      uploadId: string;
      tenantId: string;
      companyId: string;
      byteDigest: string;
      bytes: Uint8Array;
      receivedAt: string;
    }>,
  ): Promise<FileQuarantineEvidence | null>;
  inspect(
    request: Readonly<{
      quarantineReference: string;
      byteDigest: string;
      byteLength: number;
      claimedFileName: string;
      claimedMediaType: string;
    }>,
  ): Promise<FileStructuralInspection | null>;
  scan(
    request: Readonly<{
      quarantineReference: string;
      byteDigest: string;
    }>,
  ): Promise<FileMalwareScanEvidence | null>;
}

export type SecureFileAcquisitionDenial =
  | "UPLOAD_REQUEST_INVALID"
  | "UPLOAD_TOO_LARGE"
  | "UPLOAD_AUTHORIZATION_DENIED"
  | "QUARANTINE_FAILED"
  | "QUARANTINE_EVIDENCE_INVALID"
  | "FILE_INSPECTION_FAILED"
  | "FILE_INSPECTION_INCONCLUSIVE"
  | "FILE_STRUCTURE_INVALID"
  | "FILE_TYPE_CLAIM_CONTRADICTORY"
  | "FILE_ENCRYPTED"
  | "ACTIVE_CONTENT_REJECTED"
  | "ARCHIVE_SAFETY_REJECTED"
  | "FILE_RESOURCE_LIMIT_REJECTED"
  | "MALWARE_SCAN_FAILED"
  | "MALWARE_DETECTED"
  | "MALWARE_SCAN_INCONCLUSIVE"
  | "SECURE_FILE_ACQUISITION_FAILED";

export type SecureFileAcquisitionResult =
  | Readonly<{
      processed: true;
      disposition: "ADMITTED_FOR_GOVERNED_INTERPRETATION";
      reference: Readonly<{
        acquisitionProfile: typeof SECURE_FILE_ACQUISITION_PROFILE;
        interpretationRegistryVersion:
          typeof INDUSTRIAL_INTERPRETATION_REGISTRY_VERSION;
        uploadId: string;
        tenantId: string;
        companyId: string;
        authorizationReference: string;
        quarantineReference: string;
        inspectionId: string;
        malwareScanId: string;
        detectedFormat: IndustrialInterpretationFormat;
        byteDigestAlgorithm: "SHA-256";
        byteDigest: string;
        byteLength: number;
        admittedAt: string;
      }>;
    }>
  | Readonly<{
      processed: true;
      disposition: "QUARANTINED_UNSUPPORTED";
      reference: Readonly<{
        acquisitionProfile: typeof SECURE_FILE_ACQUISITION_PROFILE;
        uploadId: string;
        tenantId: string;
        companyId: string;
        quarantineReference: string;
        inspectionId: string;
        malwareScanId: string;
        detectedFormat: Exclude<
          InspectedFileFormat,
          IndustrialInterpretationFormat
        >;
        byteDigestAlgorithm: "SHA-256";
        byteDigest: string;
        byteLength: number;
        quarantinedAt: string;
      }>;
    }>
  | Readonly<{
      processed: false;
      denial: SecureFileAcquisitionDenial;
    }>;

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ID = /^[A-Za-z0-9][A-Za-z0-9:._-]{0,127}$/;
const REFERENCE = /^[A-Za-z0-9][A-Za-z0-9:/._-]{0,255}$/;
const UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const HEX = /^[0-9a-f]{64}$/;
const SUPPORTED = new Set<InspectedFileFormat>([
  "CSV", "XLSX", "TXT_DAT", "JSON", "XML",
]);

function deny(denial: SecureFileAcquisitionDenial):
Extract<SecureFileAcquisitionResult, { processed: false }> {
  return Object.freeze({ processed: false, denial });
}

function exactTime(value: unknown): value is string {
  return typeof value === "string" && UTC.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value;
}

function identifier(value: unknown): value is string {
  return typeof value === "string" && ID.test(value);
}

function reference(value: unknown): value is string {
  return typeof value === "string" && REFERENCE.test(value);
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}

function inspectionDenial(
  inspection: FileStructuralInspection,
): SecureFileAcquisitionDenial | null {
  if (inspection.structureStatus === "INCONCLUSIVE") {
    return "FILE_INSPECTION_INCONCLUSIVE";
  }
  if (inspection.structureStatus !== "VALID") {
    return "FILE_STRUCTURE_INVALID";
  }
  if (!inspection.extensionMediaTypeCoherent) {
    return "FILE_TYPE_CLAIM_CONTRADICTORY";
  }
  if (inspection.encrypted) return "FILE_ENCRYPTED";
  if (
    inspection.macrosPresent ||
    inspection.activeContentPresent ||
    inspection.embeddedObjectsPresent ||
    inspection.externalConnectionsPresent ||
    !inspection.passiveDataOnly
  ) return "ACTIVE_CONTENT_REJECTED";
  if (
    inspection.archivePathTraversalDetected ||
    inspection.decompressionBombDetected
  ) return "ARCHIVE_SAFETY_REJECTED";
  if (inspection.resourceLimitsExceeded) {
    return "FILE_RESOURCE_LIMIT_REJECTED";
  }
  return null;
}

export async function acquireUntrustedFileSecurely(
  upload: UntrustedFileUpload,
  services: SecureFileAcquisitionServices,
  now: () => number = Date.now,
): Promise<SecureFileAcquisitionResult> {
  if (
    !identifier(upload?.uploadId) ||
    !identifier(upload?.tenantId) ||
    !identifier(upload?.companyId) ||
    !identifier(upload?.workloadId) ||
    upload.tenantId === upload.companyId ||
    typeof upload.claimedFileName !== "string" ||
    upload.claimedFileName.length < 1 ||
    upload.claimedFileName.length > 255 ||
    typeof upload.claimedMediaType !== "string" ||
    upload.claimedMediaType.length < 1 ||
    upload.claimedMediaType.length > 127 ||
    !(upload.bytes instanceof Uint8Array) ||
    upload.bytes.byteLength < 1
  ) return deny("UPLOAD_REQUEST_INVALID");
  if (upload.bytes.byteLength > MAX_UPLOAD_BYTES) {
    return deny("UPLOAD_TOO_LARGE");
  }

  const receivedAt = new Date(now()).toISOString();
  const byteDigest = createHash("sha256").update(upload.bytes).digest("hex");
  try {
    const authorization = await services.authorize(Object.freeze({
      uploadId: upload.uploadId,
      tenantId: upload.tenantId,
      companyId: upload.companyId,
      workloadId: upload.workloadId,
    }));
    if (
      !authorization.authorized ||
      authorization.uploadId !== upload.uploadId ||
      authorization.tenantId !== upload.tenantId ||
      authorization.companyId !== upload.companyId ||
      !reference(authorization.authorizationReference)
    ) return deny("UPLOAD_AUTHORIZATION_DENIED");

    const quarantine = await services.quarantine(Object.freeze({
      uploadId: upload.uploadId,
      tenantId: upload.tenantId,
      companyId: upload.companyId,
      byteDigest,
      bytes: upload.bytes.slice(),
      receivedAt,
    }));
    if (!quarantine) return deny("QUARANTINE_FAILED");
    if (
      quarantine.quarantined !== true ||
      quarantine.uploadId !== upload.uploadId ||
      quarantine.tenantId !== upload.tenantId ||
      !reference(quarantine.quarantineReference) ||
      quarantine.byteDigest !== byteDigest ||
      !HEX.test(quarantine.byteDigest) ||
      quarantine.byteLength !== upload.bytes.byteLength ||
      !exactTime(quarantine.quarantinedAt) ||
      Date.parse(quarantine.quarantinedAt) < Date.parse(receivedAt)
    ) return deny("QUARANTINE_EVIDENCE_INVALID");

    const inspection = await services.inspect(Object.freeze({
      quarantineReference: quarantine.quarantineReference,
      byteDigest,
      byteLength: upload.bytes.byteLength,
      claimedFileName: upload.claimedFileName,
      claimedMediaType: upload.claimedMediaType,
    }));
    if (
      !inspection ||
      inspection.completed !== true ||
      !reference(inspection.inspectionId) ||
      inspection.quarantineReference !== quarantine.quarantineReference ||
      inspection.byteDigest !== byteDigest
    ) return deny("FILE_INSPECTION_FAILED");
    const structuralDenial = inspectionDenial(inspection);
    if (structuralDenial) return deny(structuralDenial);

    const scan = await services.scan(Object.freeze({
      quarantineReference: quarantine.quarantineReference,
      byteDigest,
    }));
    if (
      !scan ||
      scan.completed !== true ||
      !reference(scan.scanId) ||
      scan.quarantineReference !== quarantine.quarantineReference ||
      scan.byteDigest !== byteDigest ||
      !identifier(scan.scannerProfileVersion) ||
      !exactTime(scan.scannedAt) ||
      Date.parse(scan.scannedAt) < Date.parse(quarantine.quarantinedAt) ||
      Date.parse(scan.scannedAt) > now()
    ) return deny("MALWARE_SCAN_FAILED");
    if (scan.verdict === "MALICIOUS") return deny("MALWARE_DETECTED");
    if (scan.verdict !== "CLEAN") return deny("MALWARE_SCAN_INCONCLUSIVE");

    if (!SUPPORTED.has(inspection.detectedFormat)) {
      return Object.freeze({
        processed: true,
        disposition: "QUARANTINED_UNSUPPORTED",
        reference: deepFreeze({
          acquisitionProfile: SECURE_FILE_ACQUISITION_PROFILE,
          uploadId: upload.uploadId,
          tenantId: upload.tenantId,
          companyId: upload.companyId,
          quarantineReference: quarantine.quarantineReference,
          inspectionId: inspection.inspectionId,
          malwareScanId: scan.scanId,
          detectedFormat: inspection.detectedFormat as Exclude<
            InspectedFileFormat,
            IndustrialInterpretationFormat
          >,
          byteDigestAlgorithm: "SHA-256" as const,
          byteDigest,
          byteLength: upload.bytes.byteLength,
          quarantinedAt: quarantine.quarantinedAt,
        }),
      });
    }
    return Object.freeze({
      processed: true,
      disposition: "ADMITTED_FOR_GOVERNED_INTERPRETATION",
      reference: deepFreeze({
        acquisitionProfile: SECURE_FILE_ACQUISITION_PROFILE,
        interpretationRegistryVersion:
          INDUSTRIAL_INTERPRETATION_REGISTRY_VERSION,
        uploadId: upload.uploadId,
        tenantId: upload.tenantId,
        companyId: upload.companyId,
        authorizationReference: authorization.authorizationReference,
        quarantineReference: quarantine.quarantineReference,
        inspectionId: inspection.inspectionId,
        malwareScanId: scan.scanId,
        detectedFormat:
          inspection.detectedFormat as IndustrialInterpretationFormat,
        byteDigestAlgorithm: "SHA-256" as const,
        byteDigest,
        byteLength: upload.bytes.byteLength,
        admittedAt: scan.scannedAt,
      }),
    });
  } catch {
    return deny("SECURE_FILE_ACQUISITION_FAILED");
  }
}
