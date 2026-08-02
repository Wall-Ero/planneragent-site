export const PLATFORM_ALERT_POLICY_ID = "PLATFORM_DELIVERY_OUTCOME_POLICY" as const;
export const PLATFORM_ALERT_POLICY_VERSION = "PLATFORM_ALERT_POLICY_V1" as const;
export const PLATFORM_OWNER_ID = "platform-owner:planneragent-walcorp-operations" as const;

export type PlatformAlertSourceClassV1 = "WU4B_EMAIL_DELIVERY" | "WU4C_TWILIO_DELIVERY";
export type PlatformAlertSourceOutcomeV1 = "FAILED" | "INDETERMINATE";
export type PlatformAlertReviewUrgencyV1 = "REVIEW_REQUIRED" | "URGENT_REVIEW";
export type PlatformAlertAuditKindV1 = "SOURCE_VERIFIED" | "INTENT_CONSTRUCTED" | "ADMITTED" | "DENIED" | "DUPLICATE_DETECTED" | "SUPPRESSED";

export type PlatformAlertFailureCode =
  | "PLATFORM_ALERT_REQUEST_INVALID" | "PLATFORM_ALERT_SOURCE_UNSUPPORTED"
  | "PLATFORM_ALERT_SOURCE_NOT_FOUND" | "PLATFORM_ALERT_SOURCE_INVALID"
  | "PLATFORM_ALERT_SOURCE_SUBSTITUTED" | "PLATFORM_ALERT_SOURCE_CONTENT_PROHIBITED"
  | "PLATFORM_ALERT_OWNER_MISMATCH" | "PLATFORM_ALERT_FAMILY_MISMATCH"
  | "PLATFORM_ALERT_PURPOSE_INVALID" | "PLATFORM_ALERT_POLICY_INVALID"
  | "PLATFORM_ALERT_POLICY_SUBSTITUTED" | "PLATFORM_ALERT_OUTCOME_UNSUPPORTED"
  | "PLATFORM_ALERT_URGENCY_INVALID" | "PLATFORM_ALERT_PROJECTION_INVALID"
  | "PLATFORM_ALERT_EXPIRED" | "PLATFORM_ALERT_DUPLICATE" | "PLATFORM_ALERT_SUPPRESSED"
  | "PLATFORM_ALERT_PERSISTENCE_FAILED" | "PLATFORM_ALERT_AUDIT_FAILED";

export class PlatformAlertError extends Error {
  constructor(readonly code: PlatformAlertFailureCode) { super(code); this.name = "PlatformAlertError"; }
}

export interface PlatformAlertAdmissionRequestV1 {
  readonly version: 1;
  readonly source_class: PlatformAlertSourceClassV1;
  readonly source_evidence_id: string;
  readonly source_evidence_digest: string;
  readonly platform_owner_id: typeof PLATFORM_OWNER_ID;
  readonly communication_family: "PLATFORM_OPERATIONAL_ALERT";
  readonly purpose: "GOVERNED_DELIVERY_REVIEW";
  readonly policy_id: typeof PLATFORM_ALERT_POLICY_ID;
  readonly policy_version: typeof PLATFORM_ALERT_POLICY_VERSION;
  readonly requested_at: string;
  readonly correlation_id: string;
  readonly causal_references: readonly string[];
}

export interface VerifiedPlatformAlertSourceV1 {
  readonly source_class: PlatformAlertSourceClassV1;
  readonly source_evidence_id: string;
  readonly source_evidence_digest: string;
  readonly source_outcome: PlatformAlertSourceOutcomeV1;
  readonly occurred_at: string;
  readonly failure_code: string;
  readonly tenant_reference_digest?: string;
  readonly company_reference_digest?: string;
  readonly correlation_id: string;
  readonly causal_references: readonly string[];
}

export interface PlatformAlertProjectionManifestV1 {
  readonly version: 1;
  readonly representation: "STRUCTURED_JSON";
  readonly fields: readonly ["source_class", "source_outcome", "source_evidence_digest", "failure_code"];
  readonly content_classification: "PLATFORM_OBSERVABLE_CONTENT_FREE";
}

export interface PlatformOperationalAlertIntentV1 {
  readonly version: 1;
  readonly alert_id: string;
  readonly deduplication_id: string;
  readonly communication_family: "PLATFORM_OPERATIONAL_ALERT";
  readonly platform_owner_id: typeof PLATFORM_OWNER_ID;
  readonly source_class: PlatformAlertSourceClassV1;
  readonly source_evidence_id: string;
  readonly source_evidence_digest: string;
  readonly source_outcome: PlatformAlertSourceOutcomeV1;
  readonly purpose: "GOVERNED_DELIVERY_REVIEW";
  readonly review_urgency: PlatformAlertReviewUrgencyV1;
  readonly acknowledgement_required: true;
  readonly platform_scope: "PLANNERAGENT_DELIVERY_OPERATIONS";
  readonly tenant_reference_digest?: string;
  readonly company_reference_digest?: string;
  readonly knowledge_owner_classification: "PLATFORM_OBSERVABLE_CONTENT_FREE";
  readonly projection_manifest: PlatformAlertProjectionManifestV1;
  readonly policy_id: typeof PLATFORM_ALERT_POLICY_ID;
  readonly policy_version: typeof PLATFORM_ALERT_POLICY_VERSION;
  readonly effective_at: string;
  readonly expires_at: string;
  readonly correlation_id: string;
  readonly causal_references: readonly string[];
  readonly canonical_digest: string;
}

export interface PlatformAlertAuditEventV1 {
  readonly audit_event_id: string; readonly event_kind: PlatformAlertAuditKindV1;
  readonly alert_id?: string; readonly source_class?: PlatformAlertSourceClassV1;
  readonly source_evidence_id?: string; readonly source_evidence_digest?: string;
  readonly family?: "PLATFORM_OPERATIONAL_ALERT"; readonly policy_id?: string; readonly policy_version?: string;
  readonly purpose?: string; readonly review_urgency?: PlatformAlertReviewUrgencyV1;
  readonly platform_scope?: string; readonly tenant_reference_digest?: string; readonly company_reference_digest?: string;
  readonly reason_code: string; readonly correlation_id: string; readonly causal_references: readonly string[]; readonly recorded_at: string;
}

export interface PlatformAlertSourceRepositoryV1 { resolve(sourceClass: PlatformAlertSourceClassV1, evidenceId: string): Promise<VerifiedPlatformAlertSourceV1 | null>; }
export interface PlatformAlertRepositoryV1 {
  persistAdmission(intent: PlatformOperationalAlertIntentV1, verifiedAt: string): Promise<"CREATED" | "EXISTING">;
  findByDeduplicationId(id: string): Promise<PlatformOperationalAlertIntentV1 | null>;
  suppress(id: string, canonicalAlertId: string, correlationId: string, at: string): Promise<void>;
  audit(event: PlatformAlertAuditEventV1): Promise<void>;
}
export type PlatformAlertAdmissionResultV1 = Readonly<{version:1; status:"ADMITTED"|"SUPPRESSED"; intent:PlatformOperationalAlertIntentV1; content_returned:false}>;
