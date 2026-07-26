import { beforeEach, describe, expect, it } from "vitest";
import {
  acquireUntrustedFileSecurely,
  INDUSTRIAL_INTERPRETATION_REGISTRY_VERSION,
  SECURE_FILE_ACQUISITION_PROFILE,
  type FileStructuralInspection,
  type InspectedFileFormat,
  type SecureFileAcquisitionServices,
} from "../acquisition/secure.file.acquisition";

const NOW = Date.parse("2026-07-26T20:00:00.000Z");
const TIME = "2026-07-26T20:00:00.000Z";
const bytes = new TextEncoder().encode("passive,industrial,data");
const digest = "1517a398e675bdbd1b979ccc9dc903d49a18d7ac19f9f33da8ae021fe8b1f334";

let format: InspectedFileFormat;
let verdict: "CLEAN" | "MALICIOUS" | "INCONCLUSIVE";
let inspectionOverrides: Partial<FileStructuralInspection>;
let calls: string[];
let quarantinedBytes: Uint8Array | undefined;

function upload(overrides: Record<string, unknown> = {}) {
  return {
    uploadId: "upload-001",
    tenantId: "tenant-001",
    companyId: "company-001",
    workloadId: "planner-worker",
    claimedFileName: "industrial-data.csv",
    claimedMediaType: "text/csv",
    bytes,
    ...overrides,
  } as any;
}

function services(
  overrides: Partial<SecureFileAcquisitionServices> = {},
): SecureFileAcquisitionServices {
  return {
    async authorize(request) {
      calls.push("AUTHORIZE");
      return {
        authorized: true,
        uploadId: request.uploadId,
        tenantId: request.tenantId,
        companyId: request.companyId,
        authorizationReference: "upload-authorization:001",
      };
    },
    async quarantine(request) {
      calls.push("QUARANTINE");
      quarantinedBytes = request.bytes;
      return {
        quarantined: true,
        uploadId: request.uploadId,
        tenantId: request.tenantId,
        quarantineReference: "quarantine:upload-001",
        byteDigest: request.byteDigest,
        byteLength: request.bytes.byteLength,
        quarantinedAt: TIME,
      };
    },
    async inspect(request) {
      calls.push("INSPECT");
      return {
        completed: true,
        inspectionId: "inspection:upload-001",
        quarantineReference: request.quarantineReference,
        byteDigest: request.byteDigest,
        detectedFormat: format,
        structureStatus: "VALID",
        extensionMediaTypeCoherent: true,
        passiveDataOnly: true,
        encrypted: false,
        macrosPresent: false,
        activeContentPresent: false,
        embeddedObjectsPresent: false,
        externalConnectionsPresent: false,
        archivePathTraversalDetected: false,
        decompressionBombDetected: false,
        resourceLimitsExceeded: false,
        ...inspectionOverrides,
      };
    },
    async scan(request) {
      calls.push("SCAN");
      return {
        completed: true,
        scanId: "malware-scan:upload-001",
        quarantineReference: request.quarantineReference,
        byteDigest: request.byteDigest,
        scannerProfileVersion: "scanner-v1",
        verdict,
        scannedAt: TIME,
      };
    },
    ...overrides,
  };
}

describe("Data Acquisition — Universal Secure File Acquisition", () => {
  beforeEach(() => {
    format = "CSV";
    verdict = "CLEAN";
    inspectionOverrides = {};
    calls = [];
    quarantinedBytes = undefined;
  });

  it.each(["CSV", "XLSX", "TXT_DAT", "JSON", "XML"] as const)(
    "admits passive clean %s only for governed interpretation",
    async detectedFormat => {
      format = detectedFormat;
      const result = await acquireUntrustedFileSecurely(
        upload(), services(), () => NOW,
      );
      expect(result).toMatchObject({
        processed: true,
        disposition: "ADMITTED_FOR_GOVERNED_INTERPRETATION",
        reference: {
          acquisitionProfile: SECURE_FILE_ACQUISITION_PROFILE,
          interpretationRegistryVersion:
            INDUSTRIAL_INTERPRETATION_REGISTRY_VERSION,
          detectedFormat,
          byteDigestAlgorithm: "SHA-256",
          byteDigest: digest,
        },
      });
      expect(calls).toEqual([
        "AUTHORIZE", "QUARANTINE", "INSPECT", "SCAN",
      ]);
    },
  );

  it.each([
    "PDF", "DOCX", "PPTX", "IMAGE", "ARCHIVE", "PROPRIETARY", "UNKNOWN",
  ] as const)("quarantines clean unsupported %s without interpretation", async value => {
    format = value;
    const result = await acquireUntrustedFileSecurely(
      upload(), services(), () => NOW,
    );
    expect(result).toMatchObject({
      processed: true,
      disposition: "QUARANTINED_UNSUPPORTED",
      reference: { detectedFormat: value },
    });
    expect(JSON.stringify(result)).not.toContain("AuthoritativeExternalData");
    expect(JSON.stringify(result)).not.toContain("canonical");
  });

  it("defensively copies bytes into quarantine and never returns them", async () => {
    const result = await acquireUntrustedFileSecurely(
      upload(), services(), () => NOW,
    );
    expect(quarantinedBytes).not.toBe(bytes);
    expect(quarantinedBytes).toEqual(bytes);
    expect(JSON.stringify(result)).not.toContain("passive,industrial,data");
    expect(result).not.toHaveProperty("bytes");
    if (result.processed) expect(result.reference).not.toHaveProperty("bytes");
  });

  it("denies unauthorized uploads before quarantine", async () => {
    const result = await acquireUntrustedFileSecurely(
      upload(),
      services({
        async authorize(request) {
          calls.push("AUTHORIZE");
          return {
            authorized: false,
            uploadId: request.uploadId,
            tenantId: request.tenantId,
            companyId: request.companyId,
          };
        },
      }),
      () => NOW,
    );
    expect(result).toEqual({
      processed: false,
      denial: "UPLOAD_AUTHORIZATION_DENIED",
    });
    expect(calls).toEqual(["AUTHORIZE"]);
  });

  it("rejects empty, malformed and oversized uploads", async () => {
    expect(await acquireUntrustedFileSecurely(
      upload({ bytes: new Uint8Array() }), services(), () => NOW,
    )).toEqual({ processed: false, denial: "UPLOAD_REQUEST_INVALID" });
    expect(await acquireUntrustedFileSecurely(
      upload({ tenantId: "../tenant" }), services(), () => NOW,
    )).toEqual({ processed: false, denial: "UPLOAD_REQUEST_INVALID" });
    expect(await acquireUntrustedFileSecurely(
      upload({ bytes: new Uint8Array(10 * 1024 * 1024 + 1) }),
      services(),
      () => NOW,
    )).toEqual({ processed: false, denial: "UPLOAD_TOO_LARGE" });
  });

  it.each([
    ["inconclusive inspection", { structureStatus: "INCONCLUSIVE" },
      "FILE_INSPECTION_INCONCLUSIVE"],
    ["invalid structure", { structureStatus: "INVALID" },
      "FILE_STRUCTURE_INVALID"],
    ["extension/MIME contradiction",
      { extensionMediaTypeCoherent: false },
      "FILE_TYPE_CLAIM_CONTRADICTORY"],
    ["encrypted content", { encrypted: true }, "FILE_ENCRYPTED"],
    ["macros", { macrosPresent: true }, "ACTIVE_CONTENT_REJECTED"],
    ["active content", { activeContentPresent: true },
      "ACTIVE_CONTENT_REJECTED"],
    ["embedded objects", { embeddedObjectsPresent: true },
      "ACTIVE_CONTENT_REJECTED"],
    ["external connections", { externalConnectionsPresent: true },
      "ACTIVE_CONTENT_REJECTED"],
    ["non-passive data", { passiveDataOnly: false },
      "ACTIVE_CONTENT_REJECTED"],
    ["archive traversal", { archivePathTraversalDetected: true },
      "ARCHIVE_SAFETY_REJECTED"],
    ["decompression bomb", { decompressionBombDetected: true },
      "ARCHIVE_SAFETY_REJECTED"],
    ["resource exhaustion", { resourceLimitsExceeded: true },
      "FILE_RESOURCE_LIMIT_REJECTED"],
  ])("fails closed for %s", async (_name, overrides, denial) => {
    inspectionOverrides = overrides as Partial<FileStructuralInspection>;
    expect(await acquireUntrustedFileSecurely(
      upload(), services(), () => NOW,
    )).toEqual({ processed: false, denial });
    expect(calls).not.toContain("SCAN");
  });

  it("rejects malware and inconclusive scans", async () => {
    verdict = "MALICIOUS";
    expect(await acquireUntrustedFileSecurely(
      upload(), services(), () => NOW,
    )).toEqual({ processed: false, denial: "MALWARE_DETECTED" });
    verdict = "INCONCLUSIVE";
    expect(await acquireUntrustedFileSecurely(
      upload(), services(), () => NOW,
    )).toEqual({
      processed: false,
      denial: "MALWARE_SCAN_INCONCLUSIVE",
    });
  });

  it("rejects quarantine, inspection and scan lineage substitution", async () => {
    expect(await acquireUntrustedFileSecurely(
      upload(),
      services({
        async quarantine(request) {
          return {
            quarantined: true,
            uploadId: request.uploadId,
            tenantId: request.tenantId,
            quarantineReference: "quarantine:upload-001",
            byteDigest: "0".repeat(64),
            byteLength: request.bytes.byteLength,
            quarantinedAt: TIME,
          };
        },
      }),
      () => NOW,
    )).toEqual({
      processed: false,
      denial: "QUARANTINE_EVIDENCE_INVALID",
    });
    expect(await acquireUntrustedFileSecurely(
      upload(),
      services({
        async inspect(request) {
          return {
            ...(await services().inspect(request))!,
            quarantineReference: "quarantine:other",
          };
        },
      }),
      () => NOW,
    )).toEqual({ processed: false, denial: "FILE_INSPECTION_FAILED" });
    expect(await acquireUntrustedFileSecurely(
      upload(),
      services({
        async scan(request) {
          return {
            ...(await services().scan(request))!,
            byteDigest: "0".repeat(64),
          };
        },
      }),
      () => NOW,
    )).toEqual({ processed: false, denial: "MALWARE_SCAN_FAILED" });
  });

  it("deeply freezes admission and quarantine references", async () => {
    const admitted = await acquireUntrustedFileSecurely(
      upload(), services(), () => NOW,
    );
    expect(Object.isFrozen(admitted)).toBe(true);
    if (admitted.processed) {
      expect(Object.isFrozen(admitted.reference)).toBe(true);
      expect(() => {
        (admitted.reference as any).tenantId = "tenant-002";
      }).toThrow();
    }
    format = "PDF";
    const quarantined = await acquireUntrustedFileSecurely(
      upload(), services(), () => NOW,
    );
    expect(Object.isFrozen(quarantined)).toBe(true);
    if (quarantined.processed) {
      expect(Object.isFrozen(quarantined.reference)).toBe(true);
    }
  });

  it("sanitizes infrastructure, scanner and quarantine exceptions", async () => {
    const result = await acquireUntrustedFileSecurely(
      upload(),
      services({
        async scan() {
          throw new Error(
            "secret credential scanner-host quarantine-bucket"
          );
        },
      }),
      () => NOW,
    );
    const serialized = JSON.stringify(result);
    expect(serialized).toBe(
      '{"processed":false,"denial":"SECURE_FILE_ACQUISITION_FAILED"}'
    );
    for (const value of [
      "secret", "credential", "scanner-host", "quarantine-bucket",
    ]) expect(serialized).not.toContain(value);
  });

  it("does not interpret or emit industrial facts", async () => {
    const result = await acquireUntrustedFileSecurely(
      upload(), services(), () => NOW,
    );
    const serialized = JSON.stringify(result);
    for (const field of [
      "orders", "rows", "cells", "canonicalFact", "sku", "quantity",
    ]) expect(serialized).not.toContain(field);
  });
});
