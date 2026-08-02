import { randomUUID } from "node:crypto";
import { deepCopyAndFreeze } from "../knowledge-exposure/knowledge.projection.guard.v1";
import {
  PlatformAlertError, type PlatformAlertAdmissionRequestV1, type PlatformAlertAdmissionResultV1,
  type PlatformAlertAuditEventV1, type PlatformAlertFailureCode, type PlatformAlertRepositoryV1,
  type PlatformAlertSourceRepositoryV1, type PlatformOperationalAlertIntentV1,
} from "./platform.alert.contracts.v1";
import { buildPlatformOperationalAlertIntentV1 } from "./platform.alert.policy.v1";

export class PlatformAlertAdmissionRuntimeV1 {
  constructor(private readonly dependencies: Readonly<{source:PlatformAlertSourceRepositoryV1; repository:PlatformAlertRepositoryV1}>) {}

  async admit(request: PlatformAlertAdmissionRequestV1): Promise<PlatformAlertAdmissionResultV1> {
    let intent: PlatformOperationalAlertIntentV1 | undefined;
    try {
      if (!request || !Object.isFrozen(request)) throw new PlatformAlertError("PLATFORM_ALERT_REQUEST_INVALID");
      if (request.source_class !== "WU4B_EMAIL_DELIVERY" && request.source_class !== "WU4C_TWILIO_DELIVERY") throw new PlatformAlertError("PLATFORM_ALERT_SOURCE_UNSUPPORTED");
      const source = await this.dependencies.source.resolve(request.source_class, request.source_evidence_id);
      if (!source) throw new PlatformAlertError("PLATFORM_ALERT_SOURCE_NOT_FOUND");
      intent = buildPlatformOperationalAlertIntentV1(request, source);
      await this.audit("SOURCE_VERIFIED", request, "PLATFORM_ALERT_SOURCE_VERIFIED", intent);
      await this.audit("INTENT_CONSTRUCTED", request, "PLATFORM_ALERT_INTENT_CONSTRUCTED", intent);
      const persisted = await this.dependencies.repository.persistAdmission(intent, request.requested_at);
      if (persisted === "EXISTING") {
        const canonical = await this.dependencies.repository.findByDeduplicationId(intent.deduplication_id);
        if (!canonical) throw new PlatformAlertError("PLATFORM_ALERT_PERSISTENCE_FAILED");
        await this.dependencies.repository.suppress(intent.deduplication_id, canonical.alert_id, request.correlation_id, request.requested_at);
        await this.audit("DUPLICATE_DETECTED", request, "PLATFORM_ALERT_DUPLICATE", canonical);
        await this.audit("SUPPRESSED", request, "PLATFORM_ALERT_SUPPRESSED", canonical);
        return deepCopyAndFreeze({version:1,status:"SUPPRESSED",intent:canonical,content_returned:false}) as PlatformAlertAdmissionResultV1;
      }
      await this.audit("ADMITTED", request, "PLATFORM_ALERT_ADMITTED", intent);
      return deepCopyAndFreeze({version:1,status:"ADMITTED",intent,content_returned:false}) as PlatformAlertAdmissionResultV1;
    } catch (error) {
      const code: PlatformAlertFailureCode = error instanceof PlatformAlertError ? error.code : "PLATFORM_ALERT_PERSISTENCE_FAILED";
      if (code !== "PLATFORM_ALERT_AUDIT_FAILED") await this.audit("DENIED", request, code, intent).catch(() => { throw new PlatformAlertError("PLATFORM_ALERT_AUDIT_FAILED"); });
      throw new PlatformAlertError(code);
    }
  }

  private async audit(kind: PlatformAlertAuditEventV1["event_kind"], request: PlatformAlertAdmissionRequestV1, reason: string, intent?: PlatformOperationalAlertIntentV1): Promise<void> {
    const event = deepCopyAndFreeze({
      audit_event_id:`platform-alert-audit:${randomUUID()}`, event_kind:kind,
      ...(intent?.alert_id ? {alert_id:intent.alert_id} : {}),
      ...(request?.source_class ? {source_class:request.source_class} : {}),
      ...(request?.source_evidence_id ? {source_evidence_id:request.source_evidence_id} : {}),
      ...(request?.source_evidence_digest ? {source_evidence_digest:request.source_evidence_digest} : {}),
      family:"PLATFORM_OPERATIONAL_ALERT", policy_id:request?.policy_id, policy_version:request?.policy_version,
      purpose:request?.purpose, review_urgency:intent?.review_urgency, platform_scope:intent?.platform_scope,
      tenant_reference_digest:intent?.tenant_reference_digest, company_reference_digest:intent?.company_reference_digest,
      reason_code:reason, correlation_id:request?.correlation_id ?? "platform-alert:invalid-request",
      causal_references:request?.causal_references ?? [], recorded_at:request?.requested_at ?? new Date(0).toISOString(),
    }) as PlatformAlertAuditEventV1;
    try { await this.dependencies.repository.audit(event); }
    catch { throw new PlatformAlertError("PLATFORM_ALERT_AUDIT_FAILED"); }
  }
}
