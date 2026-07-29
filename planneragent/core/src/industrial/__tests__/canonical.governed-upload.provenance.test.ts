import { describe, expect, it } from "vitest";
import type {
  GovernedUploadVerificationResultV1,
} from "../../operational-identity/verification";
import {
  assembleCanonicalGovernedUploadProvenanceV1,
  CANONICAL_PROVENANCE_ATTESTATION_PROFILE,
  type CanonicalFactProvenanceAttestationV1,
  type DatasetProvenanceAttestationV1,
  type InterpretationProvenanceAttestationV1,
} from "../provenance";

function verified(
  overrides: Record<string, unknown> = {},
): GovernedUploadVerificationResultV1 {
  return {
    version: 1,
    outcome: "VERIFIED",
    admitted_object_id: "admitted-object-001",
    acquisition_id: "acquisition-001",
    upload_id: "upload-001",
    principal_id: "principal-001",
    session_id: "session-001",
    membership_id: "membership-001",
    company_id: "company-001",
    tenant_id: "tenant-001",
    ownership_reference: "ownership-001",
    authorization_decision_id: "authorization-001",
    consumption_reference: "governed-upload:upload-001:wu8:authorization-001",
    resource: "governed-upload:industrial-file",
    purpose: "operational-planning",
    permission: "UPLOAD_DATA",
    policy_version: "upload-policy-v1",
    byte_digest: "a".repeat(64),
    byte_length: 42,
    acquisition_profile: "UNIVERSAL_SECURE_FILE_ACQUISITION_V1",
    interpretation_registry_version: "1",
    quarantine_reference: "quarantine-001",
    inspection_id: "inspection-001",
    malware_scan_id: "scan-001",
    detected_format: "CSV",
    admitted_at: "2026-07-29T10:01:00.000Z",
    correlation_id: "correlation-001",
    audit_lineage: ["authentication-audit-001", "participation-audit-001"],
    current_state: {
      principal: "ACTIVE",
      session: "ACTIVE",
      membership: "ACTIVE",
      company: "ACTIVE",
      tenant: "ACTIVE",
      drifted: false,
    },
    ...overrides,
  } as GovernedUploadVerificationResultV1;
}

function assembled(input = verified()) {
  const result = assembleCanonicalGovernedUploadProvenanceV1(input);
  if (!result.assembled) throw new Error(result.failure);
  return result.provenance;
}

describe("WU10B canonical governed-upload provenance contracts", () => {
  it("assembles the canonical attestation sequence without flattening history", () => {
    const provenance = assembled();
    const acquisition = provenance.chain_head;
    const authorization = acquisition.previous;
    const identity = authorization.previous;
    expect([
      identity.kind,
      authorization.kind,
      acquisition.kind,
    ]).toEqual([
      "OPERATIONAL_IDENTITY",
      "AUTHORIZATION",
      "ACQUISITION",
    ]);
    expect(identity.previous_attestation_id).toBeNull();
    expect(authorization.previous_attestation_id).toBe(identity.attestation_id);
    expect(acquisition.previous_attestation_id).toBe(authorization.attestation_id);
    expect(authorization.previous).toBe(identity);
    expect(acquisition.previous).toBe(authorization);
  });

  it("projects each fact into exactly one owning attestation layer", () => {
    const provenance = assembled();
    expect(provenance.chain_head.previous.previous.facts).toEqual({
      principal_id: "principal-001",
      session_id: "session-001",
      membership_id: "membership-001",
      company_id: "company-001",
      tenant_id: "tenant-001",
      ownership_reference: "ownership-001",
    });
    expect(provenance.chain_head.previous.facts).toEqual({
      authorization_decision_id: "authorization-001",
      consumption_reference: "governed-upload:upload-001:wu8:authorization-001",
      permission: "UPLOAD_DATA",
      resource: "governed-upload:industrial-file",
      purpose: "operational-planning",
      policy_version: "upload-policy-v1",
    });
    expect(provenance.chain_head.facts).toMatchObject({
      admitted_object_id: "admitted-object-001",
      acquisition_id: "acquisition-001",
      upload_id: "upload-001",
      source_byte_digest: {
        subject: "ACQUIRED_SOURCE_BYTES",
        algorithm: "SHA-256",
        value: "a".repeat(64),
      },
    });
  });

  it("produces deterministic attestation identities", () => {
    expect(assembled()).toEqual(assembled());
    expect(assembled().chain_head.attestation_id)
      .toMatch(/^provenance-attestation:acquisition:sha256:[0-9a-f]{64}$/);
    expect(assembled().chain_head.attestation_profile)
      .toBe(CANONICAL_PROVENANCE_ATTESTATION_PROFILE);
  });

  it("changes only the affected stage and descendants", () => {
    const baseline = assembled();
    const acquisitionChanged = assembled(verified({ byte_length: 43 }));
    expect(acquisitionChanged.chain_head.previous.attestation_id)
      .toBe(baseline.chain_head.previous.attestation_id);
    expect(acquisitionChanged.chain_head.attestation_id)
      .not.toBe(baseline.chain_head.attestation_id);

    const authorizationChanged = assembled(verified({ purpose: "inventory-planning" }));
    expect(authorizationChanged.chain_head.previous.previous.attestation_id)
      .toBe(baseline.chain_head.previous.previous.attestation_id);
    expect(authorizationChanged.chain_head.previous.attestation_id)
      .not.toBe(baseline.chain_head.previous.attestation_id);
    expect(authorizationChanged.chain_head.attestation_id)
      .not.toBe(baseline.chain_head.attestation_id);
  });

  it("does not let current-state drift rewrite historical attestations", () => {
    const baseline = assembled();
    const drifted = assembled(verified({
      current_state: {
        principal: "ACTIVE",
        session: "REVOKED",
        membership: "SUSPENDED",
        company: "ACTIVE",
        tenant: "ACTIVE",
        drifted: true,
      },
    }));
    expect(drifted.chain_head).toEqual(baseline.chain_head);
    expect(drifted.verification_observation.current_state.drifted).toBe(true);
    expect(drifted.verification_observation.historical_attestation_affected)
      .toBe(false);
  });

  it("deeply freezes the chain and defensively copies mutable input arrays", () => {
    const input = verified() as any;
    const provenance = assembled(input);
    input.audit_lineage.push("later");
    input.current_state.session = "REVOKED";
    expect(provenance.verification_observation.audit_lineage)
      .toEqual(["authentication-audit-001", "participation-audit-001"]);
    expect(provenance.verification_observation.current_state.session).toBe("ACTIVE");
    for (const value of [
      provenance,
      provenance.chain_head,
      provenance.chain_head.facts,
      provenance.chain_head.facts.source_byte_digest,
      provenance.chain_head.previous,
      provenance.chain_head.previous.previous,
      provenance.verification_observation,
      provenance.verification_observation.audit_lineage,
      provenance.verification_observation.current_state,
    ]) expect(Object.isFrozen(value)).toBe(true);
  });

  it("defines append-only future stage contracts over the prior stage", () => {
    const acquisition = assembled().chain_head;
    const interpretation = {
      version: 1,
      kind: "INTERPRETATION",
      attestation_id: "interpretation-attestation",
      attestation_profile: CANONICAL_PROVENANCE_ATTESTATION_PROFILE,
      digest_algorithm: "SHA-256",
      previous_attestation_id: acquisition.attestation_id,
      previous: acquisition,
      facts: {
        interpretation_id: "interpretation-001",
        interpretation_profile: "GOVERNED_PASSIVE_CSV_V1",
        interpretation_version: "1",
      },
    } satisfies InterpretationProvenanceAttestationV1;
    const dataset = {
      ...interpretation,
      kind: "DATASET",
      attestation_id: "dataset-attestation",
      previous_attestation_id: interpretation.attestation_id,
      previous: interpretation,
      facts: {
        dataset_id: "dataset-001",
        dataset_digest: {
          subject: "INTERPRETED_DATASET",
          algorithm: "SHA-256",
          profile: "DATASET_V1",
          value: "b".repeat(64),
        },
      },
    } satisfies DatasetProvenanceAttestationV1;
    const fact = {
      ...dataset,
      kind: "CANONICAL_FACT",
      attestation_id: "fact-attestation",
      previous_attestation_id: dataset.attestation_id,
      previous: dataset,
      facts: {
        canonical_fact_id: "fact-001",
        canonical_schema_version: "1",
        transformation_id: "transformation-001",
        transformation_version: "1",
        canonical_fact_digest: {
          subject: "CANONICAL_FACT",
          algorithm: "SHA-256",
          profile: "CANONICAL_FACT_V1",
          value: "c".repeat(64),
        },
      },
    } satisfies CanonicalFactProvenanceAttestationV1;
    expect(fact.previous.previous.previous).toBe(acquisition);
  });

  it.each([
    ["unverified outcome", { outcome: "DENIED" }, "PROVENANCE_VERIFICATION_REQUIRED"],
    ["wrong version", { version: 2 }, "PROVENANCE_VERIFICATION_REQUIRED"],
    ["missing input", null, "PROVENANCE_VERIFICATION_REQUIRED"],
    ["empty principal", { principal_id: "" }, "PROVENANCE_INPUT_INVALID"],
    ["malformed digest", { byte_digest: "not-a-digest" }, "PROVENANCE_INPUT_INVALID"],
    ["zero length", { byte_length: 0 }, "PROVENANCE_INPUT_INVALID"],
    ["non-canonical time", { admitted_at: "2026-07-29" }, "PROVENANCE_INPUT_INVALID"],
    ["malformed audit", { audit_lineage: ["valid", 1] }, "PROVENANCE_INPUT_INVALID"],
    ["malformed current-state observation", {
      current_state: {
        principal: 1, session: "ACTIVE", membership: "ACTIVE",
        company: "ACTIVE", tenant: "ACTIVE", drifted: false,
      },
    }, "PROVENANCE_INPUT_INVALID"],
    ["wrong permission", { permission: "VIEW_COCKPIT" }, "PROVENANCE_LINEAGE_INVALID"],
    ["collapsed admission ids", { admitted_object_id: "acquisition-001" },
      "PROVENANCE_LINEAGE_INVALID"],
    ["collapsed authorization refs", {
      authorization_decision_id: "same", consumption_reference: "same",
    }, "PROVENANCE_LINEAGE_INVALID"],
  ])("fails closed for %s", (_label, overrides, failure) => {
    const input = overrides === null ? null : verified(overrides);
    expect(assembleCanonicalGovernedUploadProvenanceV1(input as any))
      .toEqual({ assembled: false, failure });
  });

  it("does not expose bytes, parsed content, or canonical-fact claims", () => {
    const serialized = JSON.stringify(assembled());
    for (const forbidden of [
      '"bytes"', '"rows"', '"headers"', '"dataset_id"',
      '"canonical_fact_id"', '"transformation_id"',
    ]) expect(serialized).not.toContain(forbidden);
  });
});
