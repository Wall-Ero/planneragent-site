import { createHash } from "node:crypto";
import { deepCopyAndFreeze } from "../knowledge-exposure/knowledge.projection.guard.v1";
import {
  PLATFORM_ALERT_POLICY_ID, PLATFORM_ALERT_POLICY_VERSION, PLATFORM_OWNER_ID,
  PlatformAlertError, type PlatformAlertAdmissionRequestV1,
  type PlatformAlertProjectionManifestV1, type PlatformOperationalAlertIntentV1,
  type VerifiedPlatformAlertSourceV1,
} from "./platform.alert.contracts.v1";

const ID = /^[A-Za-z0-9][A-Za-z0-9:._/@-]{0,255}$/;
const HEX = /^[0-9a-f]{64}$/;
const TTL_MS = 24 * 60 * 60 * 1000;
export const PLATFORM_ALERT_PROJECTION: PlatformAlertProjectionManifestV1 = Object.freeze({
  version: 1, representation: "STRUCTURED_JSON",
  fields: Object.freeze(["source_class", "source_outcome", "source_evidence_digest", "failure_code"] as const),
  content_classification: "PLATFORM_OBSERVABLE_CONTENT_FREE",
});

export function platformAlertDigestV1(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value), "utf8").digest("hex");
}

export function platformAlertSourceDigestV1(source: Omit<VerifiedPlatformAlertSourceV1, "source_evidence_digest">): string {
  return platformAlertDigestV1(source);
}

function utc(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString() === value;
}

function prohibited(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const forbidden = /(^|_)(message|body|payload|prompt|quotation|order|inventory|bom|credential|token|password|phone|email|endpoint|provider_response|raw_error)(_|$)/i;
  return Object.entries(value as Record<string, unknown>).some(([key, child]) => forbidden.test(key) || prohibited(child));
}

export function buildPlatformOperationalAlertIntentV1(
  unsafe: PlatformAlertAdmissionRequestV1,
  source: VerifiedPlatformAlertSourceV1,
): PlatformOperationalAlertIntentV1 {
  if (!unsafe || !Object.isFrozen(unsafe)) throw new PlatformAlertError("PLATFORM_ALERT_REQUEST_INVALID");
  if (prohibited(unsafe)) throw new PlatformAlertError("PLATFORM_ALERT_SOURCE_CONTENT_PROHIBITED");
  const request = deepCopyAndFreeze(unsafe) as PlatformAlertAdmissionRequestV1;
  const exact = ["version","source_class","source_evidence_id","source_evidence_digest","platform_owner_id","communication_family","purpose","policy_id","policy_version","requested_at","correlation_id","causal_references"];
  if (Object.keys(request).sort().join() !== exact.sort().join() || request.version !== 1 || !utc(request.requested_at) || !ID.test(request.correlation_id) || !Array.isArray(request.causal_references)) {
    throw new PlatformAlertError("PLATFORM_ALERT_REQUEST_INVALID");
  }
  if (request.source_class !== "WU4B_EMAIL_DELIVERY" && request.source_class !== "WU4C_TWILIO_DELIVERY") throw new PlatformAlertError("PLATFORM_ALERT_SOURCE_UNSUPPORTED");
  if (!source || request.source_class !== source.source_class || request.source_evidence_id !== source.source_evidence_id || request.source_evidence_digest !== source.source_evidence_digest) throw new PlatformAlertError("PLATFORM_ALERT_SOURCE_SUBSTITUTED");
  const {source_evidence_digest:sourceDigest,...sourceSubject}=source;
  if (!HEX.test(sourceDigest) || platformAlertSourceDigestV1(sourceSubject)!==sourceDigest || !utc(source.occurred_at) || !source.failure_code || source.correlation_id !== request.correlation_id || !request.causal_references.includes(request.source_evidence_id) || !source.causal_references.every(ref => request.causal_references.includes(ref))) throw new PlatformAlertError("PLATFORM_ALERT_SOURCE_INVALID");
  if (request.platform_owner_id !== PLATFORM_OWNER_ID) throw new PlatformAlertError("PLATFORM_ALERT_OWNER_MISMATCH");
  if (request.communication_family !== "PLATFORM_OPERATIONAL_ALERT") throw new PlatformAlertError("PLATFORM_ALERT_FAMILY_MISMATCH");
  if (request.purpose !== "GOVERNED_DELIVERY_REVIEW") throw new PlatformAlertError("PLATFORM_ALERT_PURPOSE_INVALID");
  if (request.policy_id !== PLATFORM_ALERT_POLICY_ID) throw new PlatformAlertError("PLATFORM_ALERT_POLICY_SUBSTITUTED");
  if (request.policy_version !== PLATFORM_ALERT_POLICY_VERSION) throw new PlatformAlertError("PLATFORM_ALERT_POLICY_INVALID");
  if (source.source_outcome !== "FAILED" && source.source_outcome !== "INDETERMINATE") throw new PlatformAlertError("PLATFORM_ALERT_OUTCOME_UNSUPPORTED");
  if (source.source_class === "WU4B_EMAIL_DELIVERY" && source.source_outcome !== "FAILED") throw new PlatformAlertError("PLATFORM_ALERT_OUTCOME_UNSUPPORTED");
  const expiresAt = new Date(Date.parse(source.occurred_at) + TTL_MS).toISOString();
  if (Date.parse(request.requested_at) >= Date.parse(expiresAt)) throw new PlatformAlertError("PLATFORM_ALERT_EXPIRED");
  const reviewUrgency = source.source_outcome === "INDETERMINATE" ? "URGENT_REVIEW" : "REVIEW_REQUIRED";
  const window = source.occurred_at.slice(0, 10);
  const dedupSubject = { family:"PLATFORM_OPERATIONAL_ALERT", source_evidence_id:source.source_evidence_id, source_class:source.source_class, policy_id:request.policy_id, policy_version:request.policy_version, platform_owner_id:request.platform_owner_id, purpose:request.purpose, window };
  const deduplicationId = `platform-alert-dedup:sha256:${platformAlertDigestV1(dedupSubject)}`;
  const subject = {
    deduplication_id: deduplicationId, communication_family: "PLATFORM_OPERATIONAL_ALERT" as const,
    platform_owner_id: PLATFORM_OWNER_ID, source_class: source.source_class,
    source_evidence_id: source.source_evidence_id, source_evidence_digest: source.source_evidence_digest,
    source_outcome: source.source_outcome, purpose: "GOVERNED_DELIVERY_REVIEW" as const,
    review_urgency: reviewUrgency, acknowledgement_required: true as const,
    platform_scope: "PLANNERAGENT_DELIVERY_OPERATIONS" as const,
    ...(source.tenant_reference_digest ? {tenant_reference_digest:source.tenant_reference_digest} : {}),
    ...(source.company_reference_digest ? {company_reference_digest:source.company_reference_digest} : {}),
    knowledge_owner_classification: "PLATFORM_OBSERVABLE_CONTENT_FREE" as const,
    projection_manifest: PLATFORM_ALERT_PROJECTION, policy_id: PLATFORM_ALERT_POLICY_ID,
    policy_version: PLATFORM_ALERT_POLICY_VERSION, effective_at: source.occurred_at, expires_at: expiresAt,
    correlation_id: request.correlation_id, causal_references: [...request.causal_references],
  };
  const alertId = `platform-alert:sha256:${platformAlertDigestV1(subject)}`;
  return deepCopyAndFreeze({version:1, alert_id:alertId, ...subject, canonical_digest:platformAlertDigestV1({alert_id:alertId,...subject})}) as PlatformOperationalAlertIntentV1;
}
