import {
  GovernedUploadVerificationError,
  type GovernedUploadVerificationFailureCode,
  type GovernedUploadVerificationResultV1,
} from "./verification.contracts.v1";
import type {
  D1GovernedUploadVerificationRepository,
  GovernedAdmissionRecord,
} from "./verification.persistence.d1";

function fail(code: GovernedUploadVerificationFailureCode): never {
  throw new GovernedUploadVerificationError(code);
}
function same(row: Record<string, unknown>, other: Record<string, unknown>, fields: string[]) {
  return fields.every(field => row[field] === other[field]);
}

export class GovernedUploadLineageVerifierV1 {
  constructor(private readonly repository: Pick<D1GovernedUploadVerificationRepository, "resolve">) {}

  async verify(admittedObjectId: string): Promise<GovernedUploadVerificationResultV1> {
    if (typeof admittedObjectId !== "string" || !admittedObjectId) fail("ADMITTED_OBJECT_NOT_FOUND");
    const record = await this.repository.resolve(admittedObjectId);
    if (!record) fail("ADMITTED_OBJECT_NOT_FOUND");
    return this.verifyRecord(record);
  }

  private verifyRecord(record: GovernedAdmissionRecord): GovernedUploadVerificationResultV1 {
    const { admission: a, decision: d, binding: b, consumption: c, ownership: o, counts } = record;
    if (counts.admissions !== 1) fail("ADMISSION_LINEAGE_DUPLICATE");
    if (!d) fail("AUTHORIZATION_DECISION_MISSING");
    if (d.decision !== "ADMITTED") fail("AUTHORIZATION_NOT_ADMITTED");
    if (!c) fail("AUTHORIZATION_CONSUMPTION_MISSING");
    if (counts.consumptions !== 1) fail("AUTHORIZATION_CONSUMPTION_DUPLICATE");
    if (c.lifecycle_state !== "CONSUMED") fail("AUTHORIZATION_NOT_CONSUMED");
    if (!b) fail("GOVERNED_CONTEXT_MISSING");
    if (a.authorization_decision_id !== d.authorization_decision_id) {
      fail("AUTHORIZATION_LINEAGE_SUBSTITUTED");
    }
    if (!same(a, d, ["principal_id"])) fail("IDENTITY_LINEAGE_SUBSTITUTED");
    if (!same(a, d, ["session_id"])) fail("SESSION_LINEAGE_SUBSTITUTED");
    if (!same(a, d, ["membership_id"])) fail("MEMBERSHIP_LINEAGE_SUBSTITUTED");
    if (!same(a, d, ["company_id", "tenant_id"]) || !o ||
      !same(a, o, ["company_id", "tenant_id", "ownership_reference"])) {
      fail("TENANT_COMPANY_LINEAGE_SUBSTITUTED");
    }
    if (!same(a, d, ["permission", "resource", "purpose", "policy_version"])) {
      fail("AUTHORIZATION_LINEAGE_SUBSTITUTED");
    }
    if (a.upload_id !== b.upload_id || a.authorization_decision_id !== b.authorization_decision_id ||
      a.authorization_reference !== d.authorization_decision_id ||
      a.consumption_reference !== c.consumption_reference) {
      fail("AUTHORIZATION_LINEAGE_SUBSTITUTED");
    }
    if (!String(a.consumption_reference).startsWith(`governed-upload:${a.upload_id}:`)) {
      fail("ACQUISITION_LINEAGE_SUBSTITUTED");
    }
    if (!/^[0-9a-f]{64}$/.test(String(a.byte_digest)) || a.byte_digest_algorithm !== "SHA-256" ||
      !(Number(a.byte_length) > 0)) fail("ACQUISITION_LINEAGE_SUBSTITUTED");
    if (!(Date.parse(String(a.authorization_issued_at)) <= Date.parse(String(a.consumed_at)) &&
      Date.parse(String(a.consumed_at)) <= Date.parse(String(a.admitted_at)) &&
      Date.parse(String(a.admitted_at)) <= Date.parse(String(a.recorded_at)) &&
      Date.parse(String(a.consumed_at)) < Date.parse(String(a.authorization_expires_at)))) {
      fail("TEMPORAL_LINEAGE_CONTRADICTORY");
    }
    let audit: unknown;
    try { audit = JSON.parse(String(a.audit_lineage_json)); } catch { fail("AUDIT_LINEAGE_MALFORMED"); }
    if (!Array.isArray(audit) || !audit.every(value => typeof value === "string")) {
      fail("AUDIT_LINEAGE_MALFORMED");
    }
    const current = {
      principal: (record.current.principal as string | undefined) ?? null,
      session: (record.current.session as string | undefined) ?? null,
      membership: (record.current.membership as string | undefined) ?? null,
      company: (record.current.company as string | undefined) ?? null,
      tenant: (record.current.tenant as string | undefined) ?? null,
    };
    return Object.freeze({
      version: 1, outcome: "VERIFIED", admitted_object_id: String(a.admitted_object_id),
      acquisition_id: String(a.acquisition_id), upload_id: String(a.upload_id),
      principal_id: String(a.principal_id), session_id: String(a.session_id),
      membership_id: String(a.membership_id), company_id: String(a.company_id),
      tenant_id: String(a.tenant_id), ownership_reference: String(a.ownership_reference),
      authorization_decision_id: String(a.authorization_decision_id),
      consumption_reference: String(a.consumption_reference), resource: String(a.resource),
      purpose: String(a.purpose), permission: String(a.permission),
      policy_version: String(a.policy_version), byte_digest: String(a.byte_digest),
      byte_length: Number(a.byte_length), acquisition_profile: String(a.acquisition_profile),
      interpretation_registry_version: String(a.interpretation_registry_version),
      quarantine_reference: String(a.quarantine_reference), inspection_id: String(a.inspection_id),
      malware_scan_id: String(a.malware_scan_id), detected_format: String(a.detected_format),
      admitted_at: String(a.admitted_at), correlation_id: String(a.correlation_id),
      audit_lineage: Object.freeze([...audit]),
      current_state: Object.freeze({
        ...current,
        drifted: current.principal !== "ACTIVE" || current.session !== "ACTIVE" ||
          current.membership !== "ACTIVE" || current.company !== "ACTIVE" || current.tenant !== "ACTIVE",
      }),
    });
  }
}
