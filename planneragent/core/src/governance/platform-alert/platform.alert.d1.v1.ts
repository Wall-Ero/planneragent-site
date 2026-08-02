import {
  PLATFORM_ALERT_POLICY_ID, PLATFORM_ALERT_POLICY_VERSION, PlatformAlertError,
  type PlatformAlertAuditEventV1, type PlatformAlertRepositoryV1,
  type PlatformAlertSourceClassV1, type PlatformAlertSourceRepositoryV1,
  type PlatformOperationalAlertIntentV1, type VerifiedPlatformAlertSourceV1,
} from "./platform.alert.contracts.v1";
import { platformAlertDigestV1, platformAlertSourceDigestV1 } from "./platform.alert.policy.v1";

function strings(value: unknown): readonly string[] {
  try { const parsed = JSON.parse(String(value)); if (Array.isArray(parsed) && parsed.every(item => typeof item === "string")) return Object.freeze(parsed); }
  catch {}
  throw new PlatformAlertError("PLATFORM_ALERT_SOURCE_INVALID");
}

export class D1PlatformAlertSourceRepositoryV1 implements PlatformAlertSourceRepositoryV1 {
  constructor(private readonly db: D1Database) {}

  async resolve(sourceClass: PlatformAlertSourceClassV1, evidenceId: string): Promise<VerifiedPlatformAlertSourceV1 | null> {
    if (sourceClass === "WU4B_EMAIL_DELIVERY") {
      const row = await this.db.prepare(`SELECT e.delivery_evidence_id source_evidence_id,e.status source_outcome,e.dispatched_at occurred_at,
        e.failure_code,a.tenant_id,a.company_id,a.correlation_id,e.causal_references_json,
        (SELECT COUNT(*) FROM sqlite_master WHERE type='trigger' AND name IN ('governed_email_evidence_no_update','governed_email_evidence_no_delete')) immutable_guards
        FROM governed_email_delivery_evidence e JOIN outbound_disclosure_admissions a ON a.disclosure_id=e.disclosure_id
        WHERE e.delivery_evidence_id=?`).bind(evidenceId).first<Record<string, unknown>>();
      return row ? this.verified(sourceClass, row) : null;
    }
    if (sourceClass === "WU4C_TWILIO_DELIVERY") {
      const row = await this.db.prepare(`SELECT e.evidence_id source_evidence_id,e.status source_outcome,e.dispatched_at occurred_at,
        e.failure_code,e.tenant_id,e.company_id,e.correlation_id,e.causal_references_json,
        (SELECT COUNT(*) FROM sqlite_master WHERE type='trigger' AND name IN ('governed_twilio_evidence_no_update','governed_twilio_evidence_no_delete')) immutable_guards
        FROM governed_twilio_delivery_evidence e WHERE e.evidence_id=?`).bind(evidenceId).first<Record<string, unknown>>();
      return row ? this.verified(sourceClass, row) : null;
    }
    throw new PlatformAlertError("PLATFORM_ALERT_SOURCE_UNSUPPORTED");
  }

  private verified(sourceClass: PlatformAlertSourceClassV1, row: Record<string, unknown>): VerifiedPlatformAlertSourceV1 {
    if (Number(row.immutable_guards) !== 2 || (row.source_outcome !== "FAILED" && row.source_outcome !== "INDETERMINATE") || !row.failure_code) throw new PlatformAlertError("PLATFORM_ALERT_SOURCE_INVALID");
    if (sourceClass === "WU4B_EMAIL_DELIVERY" && row.source_outcome !== "FAILED") throw new PlatformAlertError("PLATFORM_ALERT_OUTCOME_UNSUPPORTED");
    const subject = {
      source_class: sourceClass, source_evidence_id:String(row.source_evidence_id),
      source_outcome:row.source_outcome as VerifiedPlatformAlertSourceV1["source_outcome"], occurred_at:String(row.occurred_at),
      failure_code:String(row.failure_code), tenant_reference_digest:platformAlertDigestV1(String(row.tenant_id)),
      company_reference_digest:platformAlertDigestV1(String(row.company_id)), correlation_id:String(row.correlation_id),
      causal_references:strings(row.causal_references_json),
    };
    return Object.freeze({...subject, source_evidence_digest:platformAlertSourceDigestV1(subject)});
  }
}

export class D1PlatformAlertRepositoryV1 implements PlatformAlertRepositoryV1 {
  constructor(private readonly db: D1Database) {}

  async persistAdmission(intent: PlatformOperationalAlertIntentV1, verifiedAt: string): Promise<"CREATED" | "EXISTING"> {
    const decisionId = `platform-alert-decision:sha256:${platformAlertDigestV1({alert_id:intent.alert_id,policy_id:intent.policy_id,policy_version:intent.policy_version})}`;
    try {
      await this.db.batch([
        this.db.prepare(`INSERT INTO platform_alert_intents (
          alert_id,deduplication_id,family,platform_owner_id,source_class,source_evidence_id,source_evidence_digest,source_outcome,
          purpose,review_urgency,acknowledgement_required,platform_scope,tenant_reference_digest,company_reference_digest,
          projection_manifest_json,policy_id,policy_version,effective_at,expires_at,correlation_id,causal_references_json,canonical_digest
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
          intent.alert_id,intent.deduplication_id,intent.communication_family,intent.platform_owner_id,intent.source_class,
          intent.source_evidence_id,intent.source_evidence_digest,intent.source_outcome,intent.purpose,intent.review_urgency,1,
          intent.platform_scope,intent.tenant_reference_digest??null,intent.company_reference_digest??null,JSON.stringify(intent.projection_manifest),
          intent.policy_id,intent.policy_version,intent.effective_at,intent.expires_at,intent.correlation_id,JSON.stringify(intent.causal_references),intent.canonical_digest),
        this.db.prepare(`INSERT INTO platform_alert_source_bindings VALUES (?,?,?,?,?)`).bind(
          intent.alert_id,intent.source_class,intent.source_evidence_id,intent.source_evidence_digest,verifiedAt),
        this.db.prepare(`INSERT INTO platform_alert_admission_decisions VALUES (?,?,?,?,?,?,?)`).bind(
          decisionId,intent.alert_id,"ADMITTED",PLATFORM_ALERT_POLICY_ID,PLATFORM_ALERT_POLICY_VERSION,"PLATFORM_ALERT_ADMITTED",verifiedAt),
      ]);
      return "CREATED";
    } catch {
      const existing = await this.findByDeduplicationId(intent.deduplication_id);
      if (existing) return "EXISTING";
      throw new PlatformAlertError("PLATFORM_ALERT_PERSISTENCE_FAILED");
    }
  }

  async findByDeduplicationId(id: string): Promise<PlatformOperationalAlertIntentV1 | null> {
    const row = await this.db.prepare(`SELECT * FROM platform_alert_intents WHERE deduplication_id=?`).bind(id).first<Record<string, unknown>>();
    if (!row) return null;
    return Object.freeze({
      version:1, alert_id:String(row.alert_id), deduplication_id:String(row.deduplication_id),
      communication_family:"PLATFORM_OPERATIONAL_ALERT", platform_owner_id:String(row.platform_owner_id) as PlatformOperationalAlertIntentV1["platform_owner_id"],
      source_class:row.source_class as PlatformOperationalAlertIntentV1["source_class"], source_evidence_id:String(row.source_evidence_id),
      source_evidence_digest:String(row.source_evidence_digest), source_outcome:row.source_outcome as PlatformOperationalAlertIntentV1["source_outcome"],
      purpose:"GOVERNED_DELIVERY_REVIEW", review_urgency:row.review_urgency as PlatformOperationalAlertIntentV1["review_urgency"],
      acknowledgement_required:true, platform_scope:"PLANNERAGENT_DELIVERY_OPERATIONS",
      ...(row.tenant_reference_digest ? {tenant_reference_digest:String(row.tenant_reference_digest)} : {}),
      ...(row.company_reference_digest ? {company_reference_digest:String(row.company_reference_digest)} : {}),
      knowledge_owner_classification:"PLATFORM_OBSERVABLE_CONTENT_FREE",
      projection_manifest:Object.freeze(JSON.parse(String(row.projection_manifest_json))), policy_id:PLATFORM_ALERT_POLICY_ID,
      policy_version:PLATFORM_ALERT_POLICY_VERSION, effective_at:String(row.effective_at), expires_at:String(row.expires_at),
      correlation_id:String(row.correlation_id), causal_references:strings(row.causal_references_json), canonical_digest:String(row.canonical_digest),
    });
  }

  async suppress(id: string, canonicalAlertId: string, correlationId: string, at: string): Promise<void> {
    const suppressionId = `platform-alert-suppression:sha256:${platformAlertDigestV1({id,correlationId})}`;
    try { await this.db.prepare(`INSERT OR IGNORE INTO platform_alert_suppressions VALUES (?,?,?,?,?,?)`).bind(suppressionId,id,canonicalAlertId,"PLATFORM_ALERT_DUPLICATE",at,correlationId).run(); }
    catch { throw new PlatformAlertError("PLATFORM_ALERT_PERSISTENCE_FAILED"); }
  }

  async audit(event: PlatformAlertAuditEventV1): Promise<void> {
    try {
      await this.db.prepare(`INSERT INTO platform_alert_audit_events VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
        event.audit_event_id,event.event_kind,event.alert_id??null,event.source_class??null,event.source_evidence_id??null,
        event.source_evidence_digest??null,event.family??null,event.policy_id??null,event.policy_version??null,event.purpose??null,
        event.review_urgency??null,event.platform_scope??null,event.tenant_reference_digest??null,event.company_reference_digest??null,
        event.reason_code,event.correlation_id,JSON.stringify(event.causal_references),event.recorded_at).run();
    } catch { throw new PlatformAlertError("PLATFORM_ALERT_AUDIT_FAILED"); }
  }
}
