import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  GovernedUploadVerificationError,
  GovernedUploadLineageVerifierV1,
  type GovernedAdmissionRecord,
  type GovernedUploadVerificationResultV1,
} from "../../operational-identity/verification";
import type {
  SecureFileAcquisitionServices,
} from "../acquisition/secure.file.acquisition";
import * as runtimeExports from "../governed.industrial.runtime";
import {
  lookupCsvIngestionProofV1,
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

describe("local CSV ingestion proof", () => {
  const csv = () => new TextEncoder().encode("code,amount\nA01,10");

  it("resolves only the exact runtime output, with a frozen identity-only projection", async () => {
    const bytes = csv(), events: string[] = [];
    const run = await runGovernedIndustrialRuntime(input("CSV", bytes), dependencies("CSV", bytes, events));
    if (!run.completed) throw new Error(run.failure);
    const { data } = run;
    expect(Object.keys(run).sort()).toEqual(["completed", "data"]);
    const beforeLookup = [...events];
    const proof = lookupCsvIngestionProofV1(data);
    expect(proof).toEqual({
      tenant_id: "tenant-001", company_id: "company-001",
      admitted_object_id: "admitted-object-runtime-001", acquisition_id: data.acquisitionIdentity,
      source_identity: data.sourceIdentity, interpretation_identity: data.interpretationIdentity,
      dataset_identity: data.datasetIdentity, chain_head_attestation_id: data.provenance.chain_head.attestation_id,
    });
    expect(Object.isFrozen(proof)).toBe(true);
    for (const other of [JSON.parse(JSON.stringify(data)), { ...data }, { ...data, rows: [] }, {}]) {
      expect(lookupCsvIngestionProofV1(other)).toBeUndefined();
    }
    expect(Reflect.set(data.rows[0]!, "1", "99")).toBe(false);
    expect(lookupCsvIngestionProofV1(data)).toEqual(proof);
    expect(events).toEqual(beforeLookup);
  });

  it("leaves a successful TXT_DAT result outside the CSV proof registry", async () => {
    const bytes = new TextEncoder().encode("A01|10");
    const run = await runGovernedIndustrialRuntime(input("TXT_DAT", bytes), dependencies("TXT_DAT", bytes, []));
    if (!run.completed) throw new Error(run.failure);
    expect(lookupCsvIngestionProofV1(run.data)).toBeUndefined();
  });

  it.each([["incoherent"], ["mutable"]] as const)("rejects %s verification before the content read", async mode => {
    const bytes = csv(), events: string[] = [];
    const deps = dependencies("CSV", bytes, events);
    let candidate: GovernedUploadVerificationResultV1 | undefined;
    const result = await runGovernedIndustrialRuntime(input("CSV", bytes), {
      ...deps, verifier: { async verify(id) {
        const original = await deps.verifier.verify(id);
        candidate = mode === "mutable" ? { ...original } : freeze({ ...original, company_id: "another-company" });
        return candidate;
      } },
    });
    expect(result).toEqual({ completed: false, stage: "INTERPRETATION_INPUT", failure: "INTERPRETATION_ADMISSION_INCOHERENT" });
    expect(events).not.toContain("read");
    Object.freeze(candidate);
    expect(lookupCsvIngestionProofV1(candidate)).toBeUndefined();
    expect(lookupCsvIngestionProofV1(result)).toBeUndefined();
  });

  it.each([["digest"], ["syntax"]] as const)("creates no dataset on CSV %s failure", async mode => {
    const bytes = mode === "digest" ? csv() : new TextEncoder().encode('code,amount\n"A01,10');
    const result = await runGovernedIndustrialRuntime(input("CSV", bytes),
      dependencies("CSV", bytes, [], mode === "digest" ? { readBytes: new Uint8Array() } : {}));
    expect(result).toMatchObject({ completed: false, stage: "INTERPRETATION" });
    expect("data" in result).toBe(false);
    expect(lookupCsvIngestionProofV1(result)).toBeUndefined();
  });
});

describe("CSV ingestion proof binding", () => {
  const csv = () => new TextEncoder().encode("code,amount\nA01,10");

  it.each([["admitted_object_id"], ["acquisition_id"]] as const)(
    "rejects a different %s before reading CSV content",
    async field => {
      const bytes = csv();
      const events: string[] = [];
      const deps = dependencies("CSV", bytes, events);
      const result = await runGovernedIndustrialRuntime(input("CSV", bytes), {
        ...deps,
        verifier: {
          async verify(id) {
            return freeze({ ...await deps.verifier.verify(id), [field]: "different-id" });
          },
        },
      });
      expect(result).toEqual({
        completed: false,
        stage: "VERIFICATION",
        failure: "ACQUISITION_LINEAGE_SUBSTITUTED",
      });
      expect(events).not.toContain("read");
      expect(lookupCsvIngestionProofV1(result)).toBeUndefined();
    },
  );

  it("binds the proof to both IDs passed to recordAdmission", async () => {
    const bytes = csv();
    const deps = dependencies("CSV", bytes, []);
    const recorded: unknown[] = [];
    const result = await runGovernedIndustrialRuntime(input("CSV", bytes), {
      ...deps,
      admission_repository: {
        async recordAdmission(ids, ...rest) {
          recorded.push(ids);
          await deps.admission_repository.recordAdmission(ids, ...rest);
        },
      },
    });
    if (!result.completed) throw new Error(result.failure);
    const ids = { admitted_object_id: "admitted-object-runtime-001", acquisition_id: "acquisition-runtime-001" };
    expect(recorded).toEqual([ids]);
    expect(lookupCsvIngestionProofV1(result.data)).toMatchObject(ids);
    expect(Object.keys(result).sort()).toEqual(["completed", "data"]);
  });

  it("reads bytes once and interprets the same bytes used for the digest", async () => {
    const bytes = csv();
    const different = new TextEncoder().encode("code,amount\nA01,99");
    let accesses = 0;
    const result = await runGovernedIndustrialRuntime(input("CSV", bytes), {
      ...dependencies("CSV", bytes, []),
      content_reader: {
        async readVerifiedContent() {
          return { get bytes() { return ++accesses <= 3 ? bytes : different; } };
        },
      },
    });
    if (!result.completed) throw new Error(result.failure);
    expect(result.data.rows).toEqual([["A01", "10"]]);
    expect(accesses).toBe(1);
    expect(lookupCsvIngestionProofV1(result.data)).toBeDefined();
  });

  it("fails closed for a reader backed by shared memory", async () => {
    const bytes = csv();
    const shared = new Uint8Array(new SharedArrayBuffer(bytes.length));
    shared.set(bytes);
    const result = await runGovernedIndustrialRuntime(input("CSV", bytes),
      dependencies("CSV", bytes, [], { readBytes: shared }));
    expect(result).toMatchObject({ completed: false, stage: "INTERPRETATION" });
    expect("data" in result).toBe(false);
    expect(lookupCsvIngestionProofV1(result)).toBeUndefined();
  });

  it.each([["accessor"], ["proxy"]] as const)(
    "rejects frozen verification with an %s at the artifact boundary",
    async kind => {
      const bytes = csv();
      const events: string[] = [];
      const deps = dependencies("CSV", bytes, events);
      let reads = 0;
      const result = await runGovernedIndustrialRuntime(input("CSV", bytes), {
        ...deps,
        verifier: {
          async verify(id) {
            const original = await deps.verifier.verify(id);
            if (kind === "proxy") return new Proxy(original, {});
            return Object.freeze({
              ...original,
              get company_id() { reads++; return original.company_id; },
            });
          },
        },
      });
      expect(result).toMatchObject({ completed: false, stage: "INTERPRETATION_INPUT" });
      expect(events).not.toContain("read");
      expect(reads).toBe(0);
      expect(lookupCsvIngestionProofV1(result)).toBeUndefined();
    },
  );
});

describe("portable CSV artifact boundary", () => {
  it("accepts the artifacts produced by the canonical CSV pipeline and lineage verifier", async () => {
    const bytes = new TextEncoder().encode("code,amount\nA01,10");
    const request = input("CSV", bytes);
    const deps = dependencies("CSV", bytes, []);
    let record: GovernedAdmissionRecord | null = null;
    let canonicalAdmission: unknown;
    let canonicalVerification: GovernedUploadVerificationResultV1 | undefined;
    const verifier = new GovernedUploadLineageVerifierV1({
      async resolve(id) {
        return record?.admission.admitted_object_id === id ? record : null;
      },
    });
    const result = await runGovernedIndustrialRuntime(request, {
      ...deps,
      admission_repository: {
        async recordAdmission(ids, context, value, recordedAt) {
          const ref = value.reference;
          const consumptionReference = `governed-upload:${ref.uploadId}:consume`;
          canonicalAdmission = value;
          const admission = {
            ...ids,
            ...context,
            consumption_reference: consumptionReference,
            authorization_reference: ref.authorizationReference,
            acquisition_profile: ref.acquisitionProfile,
            interpretation_registry_version: ref.interpretationRegistryVersion,
            quarantine_reference: ref.quarantineReference,
            inspection_id: ref.inspectionId,
            malware_scan_id: ref.malwareScanId,
            detected_format: ref.detectedFormat,
            byte_digest_algorithm: ref.byteDigestAlgorithm,
            byte_digest: ref.byteDigest,
            byte_length: ref.byteLength,
            authorization_issued_at: context.issued_at,
            authorization_expires_at: context.expires_at,
            admitted_at: ref.admittedAt,
            consumed_at: TIME,
            recorded_at: recordedAt,
            correlation_id: "correlation-canonical-001",
            audit_lineage_json: JSON.stringify(context.audit_lineage),
          };
          record = {
            admission,
            decision: { ...context, decision: "ADMITTED" },
            binding: { ...context },
            consumption: { lifecycle_state: "CONSUMED", consumption_reference: consumptionReference },
            ownership: { ...context },
            counts: { admissions: 1, consumptions: 1 },
            current: { principal: "ACTIVE", session: "ACTIVE", membership: "ACTIVE", company: "ACTIVE", tenant: "ACTIVE" },
          };
        },
      },
      verifier: {
        async verify(id) {
          const value = await verifier.verify(id);
          canonicalVerification = value;
          return value;
        },
      },
    });
    if (!result.completed) throw new Error(result.failure);
    for (const artifact of [canonicalAdmission, canonicalVerification, result.data.provenance]) {
      expect(artifact).toBeDefined();
      expect(Object.isFrozen(artifact)).toBe(true);
      expect(structuredClone(artifact)).toEqual(artifact);
    }
    expect(result.data.rows).toEqual([["A01", "10"]]);
    expect(Object.keys(result).sort()).toEqual(["completed", "data"]);
    expect(lookupCsvIngestionProofV1(result.data)).toMatchObject({
      admitted_object_id: request.admitted_object_id,
      acquisition_id: request.acquisition_id,
    });
    expect(lookupCsvIngestionProofV1(structuredClone(result.data))).toBeUndefined();
    expect(Object.keys(runtimeExports).sort()).toEqual([
      "lookupCsvIngestionProofV1", "runGovernedIndustrialRuntime",
    ]);
  });

  it.each([["nested proxy"], ["hidden key"], ["symbol"], ["cycle"], ["inspection exception"]] as const)(
    "rejects %s in verification before reading CSV content",
    async kind => {
      const bytes = new TextEncoder().encode("code,amount\nA01,10");
      const events: string[] = [];
      const deps = dependencies("CSV", bytes, events);
      const result = await runGovernedIndustrialRuntime(input("CSV", bytes), {
        ...deps,
        verifier: {
          async verify(id) {
            const original = await deps.verifier.verify(id);
            const value = { ...original };
            if (kind === "nested proxy") value.current_state = new Proxy(original.current_state, {});
            if (kind === "hidden key") Object.defineProperty(value, "hidden", { value: "unexpected" });
            if (kind === "symbol") Object.defineProperty(value, Symbol("unexpected"), { value: true });
            if (kind === "cycle") Object.defineProperty(value, "cycle", { value, enumerable: true });
            Object.freeze(value);
            if (kind === "inspection exception") {
              return new Proxy(value, { ownKeys() { throw new Error("fixture inspection failure"); } });
            }
            return value;
          },
        },
      });
      expect(result).toEqual({
        completed: false, stage: "INTERPRETATION_INPUT", failure: "INTERPRETATION_ADMISSION_INCOHERENT",
      });
      expect(events).not.toContain("read");
      expect(lookupCsvIngestionProofV1(result)).toBeUndefined();
    },
  );
});
