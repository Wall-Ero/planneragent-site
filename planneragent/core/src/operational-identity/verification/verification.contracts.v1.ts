export type GovernedUploadVerificationFailureCode =
  | "ADMITTED_OBJECT_NOT_FOUND"
  | "ADMISSION_LINEAGE_DUPLICATE"
  | "AUTHORIZATION_DECISION_MISSING"
  | "AUTHORIZATION_NOT_ADMITTED"
  | "AUTHORIZATION_CONSUMPTION_MISSING"
  | "AUTHORIZATION_NOT_CONSUMED"
  | "AUTHORIZATION_CONSUMPTION_DUPLICATE"
  | "GOVERNED_CONTEXT_MISSING"
  | "IDENTITY_LINEAGE_SUBSTITUTED"
  | "SESSION_LINEAGE_SUBSTITUTED"
  | "MEMBERSHIP_LINEAGE_SUBSTITUTED"
  | "TENANT_COMPANY_LINEAGE_SUBSTITUTED"
  | "AUTHORIZATION_LINEAGE_SUBSTITUTED"
  | "ACQUISITION_LINEAGE_SUBSTITUTED"
  | "AUDIT_LINEAGE_MALFORMED"
  | "TEMPORAL_LINEAGE_CONTRADICTORY";

export class GovernedUploadVerificationError extends Error {
  constructor(readonly code: GovernedUploadVerificationFailureCode) {
    super(code);
    this.name = "GovernedUploadVerificationError";
  }
}

export interface GovernedUploadVerificationResultV1 {
  readonly version: 1;
  readonly outcome: "VERIFIED";
  readonly admitted_object_id: string;
  readonly acquisition_id: string;
  readonly upload_id: string;
  readonly principal_id: string;
  readonly session_id: string;
  readonly membership_id: string;
  readonly company_id: string;
  readonly tenant_id: string;
  readonly ownership_reference: string;
  readonly authorization_decision_id: string;
  readonly consumption_reference: string;
  readonly resource: string;
  readonly purpose: string;
  readonly permission: string;
  readonly policy_version: string;
  readonly byte_digest: string;
  readonly byte_length: number;
  readonly acquisition_profile: string;
  readonly interpretation_registry_version: string;
  readonly quarantine_reference: string;
  readonly inspection_id: string;
  readonly malware_scan_id: string;
  readonly detected_format: string;
  readonly admitted_at: string;
  readonly correlation_id: string;
  readonly audit_lineage: readonly string[];
  readonly current_state: Readonly<{
    principal: string | null;
    session: string | null;
    membership: string | null;
    company: string | null;
    tenant: string | null;
    drifted: boolean;
  }>;
}
