import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  GovernedUploadVerificationError,
  type GovernedUploadVerificationResultV1,
} from "../../operational-identity/verification";
import type {
  SecureFileAcquisitionServices,
} from "../acquisition/secure.file.acquisition";
import {
  runGovernedIndustrialRuntime,
  type GovernedIndustrialRuntimeDependencies,
  type GovernedIndustrialRuntimeInput,
} from "../governed.industrial.runtime";

const TIME = "2026-07-30T10:00:00.000Z";
const NOW = Date.parse(TIME);

function freeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

function input(
  format: "CSV" | "TXT_DAT",
  bytes: Uint8Array,
): GovernedIndustrialRuntimeInput {
  const common = {
    version: 1 as const,
    upload: {
      uploadId: "upload-runtime-001",
      tenantId: "tenant-001",
      companyId: "company-001",
      workloadId: "workload-001",
      claimedFileName: format === "CSV" ? "orders.csv" : "orders.txt",
      claimedMediaType: "text/plain",
      bytes,
    },
    governed_context: freeze({
      version: 1,
      upload_operational_context_id: "upload-context-001",
      principal_id: "principal-001",
      session_id: "session-001",
      membership_id: "membership-001",
      company_id: "company-001",
      tenant_id: "tenant-001",
      ownership_reference: "ownership-001",
      authorization_decision_id: "authorization-001",
      consumption_reference: "governed-upload:upload-runtime-001:consume",
      replay_state_reference: "replay-001",
      permission: "UPLOAD_DATA",
      upload_id: "upload-runtime-001",
      resource: "governed-upload:industrial-file",
      purpose: "operational-planning",
      policy_version: "upload-policy-v1",
      issued_at: TIME,
      expires_at: "2026-07-30T11:00:00.000Z",
      audit_lineage: ["audit-001"],
    }) as any,
    admitted_object_id: "admitted-object-runtime-001",
    acquisition_id: "acquisition-runtime-001",
    expected_format: format,
  };
  return format === "CSV"
    ? {
        ...common,
        expected_format: "CSV",
        adapter_configuration: {
          delimiter: ",",
          quote: '"',
          newline: "\n",
          maxRows: 10,
          maxColumns: 10,
          maxCellLength: 100,
        },
      }
    : {
        ...common,
        expected_format: "TXT_DAT",
        adapter_configuration: {
          dataKind: "TXT",
          layout: "DELIMITED",
          delimiter: "|",
          newline: "\n",
          fields: [{ name: "code" }, { name: "amount" }],
          maxRows: 10,
          maxFields: 10,
          maxFieldLength: 100,
          maxRecordLength: 200,
        },
      };
}

function dependencies(
  format: "CSV" | "TXT_DAT",
  bytes: Uint8Array,
  events: string[],
  options: Readonly<{
    authorize?: boolean;
    readBytes?: Uint8Array;
    recordFailure?: boolean;
    verificationFailure?: boolean;
    malformedVerification?: boolean;
  }> = {},
): GovernedIndustrialRuntimeDependencies {
  let admission: any;
  const digest = createHash("sha256").update(bytes).digest("hex");
  const services: SecureFileAcquisitionServices = {
    async authorize(request) {
      events.push("authorize");
      return {
        authorized: options.authorize !== false,
        uploadId: request.uploadId,
        tenantId: request.tenantId,
        companyId: request.companyId,
        ...(options.authorize !== false
          ? { authorizationReference: "authorization-001" }
          : {}),
      };
    },
    async quarantine(request) {
      events.push("quarantine");
      return {
        quarantined: true,
        uploadId: request.uploadId,
        tenantId: request.tenantId,
        quarantineReference: "quarantine-001",
        byteDigest: request.byteDigest,
        byteLength: request.bytes.byteLength,
        quarantinedAt: TIME,
      };
    },
    async inspect(request) {
      events.push("inspect");
      return {
        completed: true,
        inspectionId: "inspection-001",
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
      };
    },
    async scan(request) {
      events.push("scan");
      return {
        completed: true,
        scanId: "scan-001",
        quarantineReference: request.quarantineReference,
        byteDigest: request.byteDigest,
        scannerProfileVersion: "scanner-v1",
        verdict: "CLEAN",
        scannedAt: TIME,
      };
    },
  };
  return {
    acquisition_services: services,
    admission_repository: {
      async recordAdmission(_ids, _context, value) {
        events.push("record");
        if (options.recordFailure) throw new Error("record failed");
        admission = value;
      },
    },
    verifier: {
      async verify(admittedObjectId) {
        events.push("verify");
        if (options.verificationFailure) {
          throw new GovernedUploadVerificationError(
            "AUTHORIZATION_LINEAGE_SUBSTITUTED",
          );
        }
        const reference = admission.reference;
        return freeze({
          version: 1,
          outcome: "VERIFIED",
          admitted_object_id: admittedObjectId,
          acquisition_id: "acquisition-runtime-001",
          upload_id: reference.uploadId,
          principal_id: "principal-001",
          session_id: "session-001",
          membership_id: "membership-001",
          company_id: reference.companyId,
          tenant_id: reference.tenantId,
          ownership_reference: "ownership-001",
          authorization_decision_id: reference.authorizationReference,
          consumption_reference: "governed-upload:upload-runtime-001:consume",
          resource: "governed-upload:industrial-file",
          purpose: "operational-planning",
          permission: "UPLOAD_DATA",
          policy_version: "upload-policy-v1",
          byte_digest: options.malformedVerification
            ? "not-a-digest"
            : digest,
          byte_length: reference.byteLength,
          acquisition_profile: reference.acquisitionProfile,
          interpretation_registry_version:
            reference.interpretationRegistryVersion,
          quarantine_reference: reference.quarantineReference,
          inspection_id: reference.inspectionId,
          malware_scan_id: reference.malwareScanId,
          detected_format: reference.detectedFormat,
          admitted_at: reference.admittedAt,
          correlation_id: "correlation-001",
          audit_lineage: ["audit-001"],
          current_state: {
            principal: "ACTIVE",
            session: "ACTIVE",
            membership: "ACTIVE",
            company: "ACTIVE",
            tenant: "ACTIVE",
            drifted: false,
          },
        }) as GovernedUploadVerificationResultV1;
      },
    },
    content_reader: {
      async readVerifiedContent(request) {
        events.push("read");
        expect(request.admitted_object_id)
          .toBe("admitted-object-runtime-001");
        expect(request.acquisition_id).toBe("acquisition-runtime-001");
        return { bytes: options.readBytes ?? bytes };
      },
    },
    now: () => NOW,
  };
}

describe("WU10B-7 governed industrial runtime integration", () => {
  it.each([
    ["CSV", "code,amount\nA01,10"],
    ["TXT_DAT", "A01|10"],
  ] as const)("composes the complete authorized %s pipeline", async (
    format,
    source,
  ) => {
    const bytes = new TextEncoder().encode(source);
    const events: string[] = [];
    const result = await runGovernedIndustrialRuntime(
      input(format, bytes),
      dependencies(format, bytes, events),
    );
    expect(result.completed).toBe(true);
    if (!result.completed) return;
    expect(result.data.rows).toEqual([["A01", "10"]]);
    expect(result.data.acquisitionIdentity)
      .toBe("acquisition-runtime-001");
    expect(result.data.provenance.chain_head.facts.acquisition_id)
      .toBe(result.data.acquisitionIdentity);
    expect(Object.isFrozen(result.data.provenance)).toBe(true);
    expect(events).toEqual([
      "authorize", "quarantine", "inspect", "scan",
      "record", "verify", "read",
    ]);
  });

  it("fails closed when the frozen authorization boundary denies", async () => {
    const bytes = new TextEncoder().encode("code,amount\nA01,10");
    const events: string[] = [];
    const result = await runGovernedIndustrialRuntime(
      input("CSV", bytes),
      dependencies("CSV", bytes, events, { authorize: false }),
    );
    expect(result).toEqual({
      completed: false,
      stage: "ACQUISITION",
      failure: "UPLOAD_AUTHORIZATION_DENIED",
    });
    expect(events).toEqual(["authorize"]);
  });

  it("does not verify or interpret an unrecorded admission", async () => {
    const bytes = new TextEncoder().encode("A01|10");
    const events: string[] = [];
    const result = await runGovernedIndustrialRuntime(
      input("TXT_DAT", bytes),
      dependencies("TXT_DAT", bytes, events, { recordFailure: true }),
    );
    expect(result).toMatchObject({
      completed: false,
      stage: "ADMISSION_RECORDING",
      failure: "GOVERNED_RUNTIME_ADMISSION_RECORDING_FAILED",
    });
    expect(events).not.toContain("verify");
    expect(events).not.toContain("read");
  });

  it("preserves verifier denials and never reads rejected content", async () => {
    const bytes = new TextEncoder().encode("code,amount\nA01,10");
    const events: string[] = [];
    const result = await runGovernedIndustrialRuntime(
      input("CSV", bytes),
      dependencies("CSV", bytes, events, { verificationFailure: true }),
    );
    expect(result).toEqual({
      completed: false,
      stage: "VERIFICATION",
      failure: "AUTHORIZATION_LINEAGE_SUBSTITUTED",
    });
    expect(events).not.toContain("read");
  });

  it("rejects noncanonical verification before interpretation", async () => {
    const bytes = new TextEncoder().encode("A01|10");
    const events: string[] = [];
    const result = await runGovernedIndustrialRuntime(
      input("TXT_DAT", bytes),
      dependencies("TXT_DAT", bytes, events, {
        malformedVerification: true,
      }),
    );
    expect(result).toEqual({
      completed: false,
      stage: "PROVENANCE",
      failure: "PROVENANCE_INPUT_INVALID",
    });
    expect(events).not.toContain("read");
  });

  it("rejects substituted bytes through the governed adapter boundary", async () => {
    const bytes = new TextEncoder().encode("code,amount\nA01,10");
    const events: string[] = [];
    const result = await runGovernedIndustrialRuntime(
      input("CSV", bytes),
      dependencies("CSV", bytes, events, {
        readBytes: new TextEncoder().encode("code,amount\nA01,11"),
      }),
    );
    expect(result).toEqual({
      completed: false,
      stage: "INTERPRETATION",
      failure: "CSV_BYTE_INTEGRITY_INVALID",
    });
  });
});
