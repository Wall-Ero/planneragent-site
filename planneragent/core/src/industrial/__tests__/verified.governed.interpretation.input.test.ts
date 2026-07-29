import { describe, expect, it, vi } from "vitest";
import type {
  GovernedUploadVerificationResultV1,
} from "../../operational-identity/verification";
import {
  assembleCanonicalGovernedUploadProvenanceV1,
  createVerifiedGovernedInterpretationInputV1,
} from "../provenance";

function freeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

function verification(): GovernedUploadVerificationResultV1 {
  return freeze({
    version: 1,
    outcome: "VERIFIED",
    admitted_object_id: "admitted-object-003",
    acquisition_id: "acquisition-003",
    upload_id: "upload-003",
    principal_id: "principal-003",
    session_id: "session-003",
    membership_id: "membership-003",
    company_id: "company-003",
    tenant_id: "tenant-003",
    ownership_reference: "ownership-003",
    authorization_decision_id: "authorization-003",
    consumption_reference: "governed-upload:upload-003:wu8:authorization-003",
    resource: "governed-upload:industrial-file",
    purpose: "operational-planning",
    permission: "UPLOAD_DATA",
    policy_version: "upload-policy-v1",
    byte_digest: "f".repeat(64),
    byte_length: 64,
    acquisition_profile: "UNIVERSAL_SECURE_FILE_ACQUISITION_V1",
    interpretation_registry_version: "1",
    quarantine_reference: "quarantine-003",
    inspection_id: "inspection-003",
    malware_scan_id: "scan-003",
    detected_format: "CSV",
    admitted_at: "2026-07-29T12:01:00.000Z",
    correlation_id: "correlation-003",
    audit_lineage: ["audit-003"],
    current_state: {
      principal: "ACTIVE",
      session: "ACTIVE",
      membership: "ACTIVE",
      company: "ACTIVE",
      tenant: "ACTIVE",
      drifted: false,
    },
  });
}

function admission(overrides: Record<string, unknown> = {}) {
  return freeze({
    processed: true,
    disposition: "ADMITTED_FOR_GOVERNED_INTERPRETATION",
    reference: {
      acquisitionProfile: "UNIVERSAL_SECURE_FILE_ACQUISITION_V1",
      interpretationRegistryVersion: "1",
      uploadId: "upload-003",
      tenantId: "tenant-003",
      companyId: "company-003",
      authorizationReference: "authorization-003",
      quarantineReference: "quarantine-003",
      inspectionId: "inspection-003",
      malwareScanId: "scan-003",
      detectedFormat: "CSV",
      byteDigestAlgorithm: "SHA-256",
      byteDigest: "f".repeat(64),
      byteLength: 64,
      admittedAt: "2026-07-29T12:01:00.000Z",
      ...overrides,
    },
  }) as any;
}

function provenance(value = verification()) {
  const result = assembleCanonicalGovernedUploadProvenanceV1(value);
  if (!result.assembled) throw new Error(result.failure);
  return result.provenance;
}

function values() {
  const verified = verification();
  const readVerifiedContent = vi.fn(async function (
    this: { marker: string },
  ) {
    return { marker: this.marker, bytes: new Uint8Array([1, 2, 3]) };
  });
  const reader = {
    marker: "reader-003",
    readVerifiedContent,
  };
  const configuration = {
    delimiter: ",",
    bounds: { rows: 10, columns: 5 },
    fields: [{ name: "sku" }, { name: "quantity" }],
  };
  return {
    input: {
      version: 1 as const,
      admission: admission(),
      verification: verified,
      provenance: provenance(verified),
      content_reader: reader,
      adapter_configuration: configuration,
    },
    reader,
    configuration,
    readVerifiedContent,
  };
}

describe("WU10B-3 verified governed interpretation input", () => {
  it("creates the single canonical parser-neutral input envelope", () => {
    const { input } = values();
    const result = createVerifiedGovernedInterpretationInputV1(input);
    expect(result).toMatchObject({
      created: true,
      input: {
        version: 1,
        content_read_request: {
          version: 1,
          admitted_object_id: "admitted-object-003",
          acquisition_id: "acquisition-003",
          upload_id: "upload-003",
          quarantine_reference: "quarantine-003",
          byte_digest: {
            subject: "ACQUIRED_SOURCE_BYTES",
            algorithm: "SHA-256",
            value: "f".repeat(64),
          },
          byte_length: 64,
        },
      },
    });
    if (!result.created) return;
    expect(result.input.admission).toBe(input.admission);
    expect(result.input.verification).toBe(input.verification);
    expect(result.input.canonical_provenance).toBe(input.provenance);
    expect(result.input.acquisition_provenance)
      .toBe(input.provenance.chain_head);
  });

  it("delegates admission proof to WU10B-2 and preserves its typed failure", () => {
    const { input } = values();
    expect(createVerifiedGovernedInterpretationInputV1({
      ...input,
      admission: admission({ uploadId: "substituted-upload" }),
    })).toEqual({
      created: false,
      failure: "INTERPRETATION_ADMISSION_INCOHERENT",
      coherence_failure: "COHERENCE_UPLOAD_SUBSTITUTED",
    });
  });

  it("does not read or parse content during envelope construction", () => {
    const { input, readVerifiedContent } = values();
    const result = createVerifiedGovernedInterpretationInputV1(input);
    expect(result.created).toBe(true);
    expect(readVerifiedContent).not.toHaveBeenCalled();
    if (!result.created) return;
    expect(result.input).not.toHaveProperty("headers");
    expect(result.input).not.toHaveProperty("rows");
    expect(result.input).not.toHaveProperty("interpretation_provenance");
  });

  it("wraps the content reader immutably while preserving its receiver", async () => {
    const { input, reader, readVerifiedContent } = values();
    const result = createVerifiedGovernedInterpretationInputV1(input);
    if (!result.created) throw new Error(result.failure);
    expect(Object.isFrozen(result.input.content_reader)).toBe(true);
    expect(Object.isFrozen(reader)).toBe(false);
    const content = await result.input.content_reader.readVerifiedContent(
      result.input.content_read_request,
    );
    expect(content).toMatchObject({ marker: "reader-003" });
    expect(readVerifiedContent).toHaveBeenCalledWith(
      result.input.content_read_request,
    );
  });

  it("defensively copies and deeply freezes adapter configuration", () => {
    const { input, configuration } = values();
    const result = createVerifiedGovernedInterpretationInputV1(input);
    if (!result.created) throw new Error(result.failure);
    configuration.bounds.rows = 999;
    configuration.fields[0]!.name = "mutated";
    expect(result.input.adapter_configuration).toEqual({
      delimiter: ",",
      bounds: { rows: 10, columns: 5 },
      fields: [{ name: "sku" }, { name: "quantity" }],
    });
    expect(result.input.adapter_configuration).not.toBe(configuration);
    expect(Object.isFrozen(result.input.adapter_configuration)).toBe(true);
    expect(Object.isFrozen(result.input.adapter_configuration.bounds)).toBe(true);
    expect(Object.isFrozen(result.input.adapter_configuration.fields)).toBe(true);
    expect(Object.isFrozen(result.input.adapter_configuration.fields[0])).toBe(true);
  });

  it("deeply freezes the envelope without rewriting frozen history", () => {
    const { input } = values();
    const before = JSON.stringify(input.provenance);
    const result = createVerifiedGovernedInterpretationInputV1(input);
    if (!result.created) throw new Error(result.failure);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.input)).toBe(true);
    expect(Object.isFrozen(result.input.content_read_request)).toBe(true);
    expect(JSON.stringify(input.provenance)).toBe(before);
    expect(result.input.acquisition_provenance.previous)
      .toBe(input.provenance.chain_head.previous);
  });

  it.each([
    ["missing value", null, "INTERPRETATION_INPUT_INVALID"],
    ["missing reader", { content_reader: null }, "INTERPRETATION_INPUT_INVALID"],
    ["missing configuration", { adapter_configuration: null },
      "INTERPRETATION_INPUT_INVALID"],
    ["reader without canonical method", { content_reader: {} },
      "INTERPRETATION_CONTENT_READER_INVALID"],
    ["function in configuration", {
      adapter_configuration: { parse() { return true; } },
    }, "INTERPRETATION_CONFIGURATION_INVALID"],
    ["undefined in configuration", {
      adapter_configuration: { delimiter: undefined },
    }, "INTERPRETATION_CONFIGURATION_INVALID"],
    ["non-finite number in configuration", {
      adapter_configuration: { maxRows: Number.POSITIVE_INFINITY },
    }, "INTERPRETATION_CONFIGURATION_INVALID"],
    ["typed array in configuration", {
      adapter_configuration: { bytes: new Uint8Array([1]) },
    }, "INTERPRETATION_CONFIGURATION_INVALID"],
  ])("fails closed for %s", (_label, override, failure) => {
    const { input } = values();
    const candidate = override === null ? null : { ...input, ...override };
    expect(createVerifiedGovernedInterpretationInputV1(candidate as any))
      .toEqual({ created: false, failure });
  });

  it("rejects circular configuration without throwing", () => {
    const { input } = values();
    const configuration: Record<string, unknown> = {};
    configuration.self = configuration;
    expect(createVerifiedGovernedInterpretationInputV1({
      ...input,
      adapter_configuration: configuration,
    })).toEqual({
      created: false,
      failure: "INTERPRETATION_CONFIGURATION_INVALID",
    });
  });

  it("is format-neutral and preserves configuration vocabulary unchanged", () => {
    const { input } = values();
    const configuration = {
      layout: "FIXED_WIDTH",
      fields: [{ name: "code", start: 0, length: 3 }],
      newline: "\n",
    };
    const result = createVerifiedGovernedInterpretationInputV1({
      ...input,
      adapter_configuration: configuration,
    });
    expect(result).toMatchObject({
      created: true,
      input: { adapter_configuration: configuration },
    });
  });
});
