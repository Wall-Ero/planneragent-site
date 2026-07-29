import type { GovernedUploadOperationalContextV1 } from "../contracts/track-a.v1";
import type { SecureFileAcquisitionResult } from "../../industrial/acquisition/secure.file.acquisition";

type Admitted = Extract<SecureFileAcquisitionResult, {
  disposition: "ADMITTED_FOR_GOVERNED_INTERPRETATION";
}>;

export interface GovernedAdmissionIds {
  readonly admitted_object_id: string;
  readonly acquisition_id: string;
}

export interface GovernedAdmissionRecord {
  readonly admission: Record<string, unknown>;
  readonly decision: Record<string, unknown> | null;
  readonly binding: Record<string, unknown> | null;
  readonly consumption: Record<string, unknown> | null;
  readonly ownership: Record<string, unknown> | null;
  readonly current: Record<string, unknown>;
  readonly counts: Readonly<{ admissions: number; consumptions: number }>;
}

export class D1GovernedUploadVerificationRepository {
  constructor(private readonly db: D1Database) {}

  async recordAdmission(
    ids: GovernedAdmissionIds,
    context: GovernedUploadOperationalContextV1 & { readonly correlation_id?: string },
    result: Admitted,
    recordedAt: string,
  ): Promise<void> {
    const state = await this.db.prepare(`SELECT c.consumed_at, c.consumption_reference,
      b.participation_context_id, o.ownership_reference
      FROM oir_authorization_consumptions c
      JOIN oir_governed_upload_authorizations b
        ON b.authorization_decision_id = c.authorization_decision_id
      JOIN oir_authorization_decisions d
        ON d.authorization_decision_id = c.authorization_decision_id
      JOIN oir_tenant_company_ownership o
        ON o.tenant_id = d.tenant_id AND o.company_id = d.company_id
        AND o.effective_from <= d.issued_at
        AND (o.effective_until IS NULL OR o.effective_until > d.issued_at)
      WHERE c.authorization_decision_id = ? AND c.lifecycle_state = 'CONSUMED'`)
      .bind(context.authorization_decision_id)
      .first<{ consumed_at: string; consumption_reference: string;
        participation_context_id: string; ownership_reference: string }>();
    if (!state) throw new Error("AUTHORIZATION_CONSUMPTION_MISSING");
    const ref = result.reference;
    await this.db.prepare(`INSERT INTO oir_governed_upload_admissions (
      admitted_object_id, acquisition_id, authorization_decision_id,
      upload_operational_context_id, participation_context_id, upload_id,
      principal_id, session_id, membership_id, company_id, tenant_id, ownership_reference,
      permission, resource, purpose, policy_version, authorization_reference,
      consumption_reference, replay_state_reference, acquisition_profile,
      interpretation_registry_version, quarantine_reference, inspection_id,
      malware_scan_id, detected_format, byte_digest_algorithm, byte_digest,
      byte_length, authorization_issued_at, authorization_expires_at,
      consumed_at, admitted_at, recorded_at, correlation_id, audit_lineage_json
    ) VALUES (${Array(35).fill("?").join(", ")})`).bind(
      ids.admitted_object_id, ids.acquisition_id, context.authorization_decision_id,
      context.upload_operational_context_id, state.participation_context_id,
      context.upload_id, context.principal_id, context.session_id, context.membership_id,
      context.company_id, context.tenant_id, state.ownership_reference,
      context.permission, context.resource,
      context.purpose, context.policy_version, ref.authorizationReference,
      state.consumption_reference, context.replay_state_reference,
      ref.acquisitionProfile, ref.interpretationRegistryVersion,
      ref.quarantineReference, ref.inspectionId, ref.malwareScanId,
      ref.detectedFormat, ref.byteDigestAlgorithm, ref.byteDigest, ref.byteLength,
      context.issued_at, context.expires_at, state.consumed_at,
      ref.admittedAt, recordedAt, context.correlation_id ?? `wu8:${context.authorization_decision_id}`,
      JSON.stringify(context.audit_lineage),
    ).run();
  }

  async resolve(admittedObjectId: string): Promise<GovernedAdmissionRecord | null> {
    const admission = await this.db.prepare(
      "SELECT * FROM oir_governed_upload_admissions WHERE admitted_object_id = ?",
    ).bind(admittedObjectId).first<Record<string, unknown>>();
    if (!admission) return null;
    const decisionId = admission.authorization_decision_id as string;
    const [decision, binding, consumption, ownership, counts, current] = await Promise.all([
      this.db.prepare("SELECT * FROM oir_authorization_decisions WHERE authorization_decision_id = ?")
        .bind(decisionId).first<Record<string, unknown>>(),
      this.db.prepare("SELECT * FROM oir_governed_upload_authorizations WHERE authorization_decision_id = ?")
        .bind(decisionId).first<Record<string, unknown>>(),
      this.db.prepare("SELECT * FROM oir_authorization_consumptions WHERE authorization_decision_id = ?")
        .bind(decisionId).first<Record<string, unknown>>(),
      this.db.prepare(`SELECT * FROM oir_tenant_company_ownership
        WHERE ownership_reference = ? AND tenant_id = ? AND company_id = ?
        AND effective_from <= ? AND (effective_until IS NULL OR effective_until > ?)`)
        .bind(admission.ownership_reference, admission.tenant_id, admission.company_id,
          admission.authorization_issued_at, admission.authorization_issued_at)
        .first<Record<string, unknown>>(),
      this.db.prepare(`SELECT
        (SELECT COUNT(*) FROM oir_governed_upload_admissions WHERE authorization_decision_id = ?) admissions,
        (SELECT COUNT(*) FROM oir_authorization_consumptions WHERE authorization_decision_id = ?) consumptions`)
        .bind(decisionId, decisionId).first<{ admissions: number; consumptions: number }>(),
      this.db.prepare(`SELECT
        (SELECT lifecycle_state FROM oir_principals WHERE principal_id = ?) principal,
        (SELECT lifecycle_state FROM oir_server_sessions WHERE session_id = ?) session,
        (SELECT lifecycle_state FROM oir_organization_memberships WHERE membership_id = ?) membership,
        (SELECT lifecycle_state FROM oir_companies WHERE company_id = ?) company,
        (SELECT lifecycle_state FROM oir_tenants WHERE tenant_id = ?) tenant`)
        .bind(admission.principal_id, admission.session_id, admission.membership_id,
          admission.company_id, admission.tenant_id).first<Record<string, unknown>>(),
    ]);
    return Object.freeze({
      admission: Object.freeze({ ...admission }), decision: decision ? Object.freeze({ ...decision }) : null,
      binding: binding ? Object.freeze({ ...binding }) : null,
      consumption: consumption ? Object.freeze({ ...consumption }) : null,
      ownership: ownership ? Object.freeze({ ...ownership }) : null,
      current: Object.freeze({ ...(current ?? {}) }),
      counts: Object.freeze(counts ?? { admissions: 0, consumptions: 0 }),
    });
  }
}
