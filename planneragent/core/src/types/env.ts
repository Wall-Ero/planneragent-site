//core/src/types/env.ts

export interface Env {
  // D1
  POLICIES_DB: D1Database;
  TRUSTED_SIGN_REPLAY_DB?: D1Database;
  TRUSTED_SIGN_EVIDENCE_DB?: D1Database;

  // Security
  SNAPSHOT_HMAC_SECRET: string;
  TRUSTED_SIGN_AWS_REGION?: string;
  TRUSTED_SIGN_AWS_KMS_KEY_ARN?: string;
  TRUSTED_SIGN_AWS_CREDENTIAL_REFERENCE?: string;

  // AI
  OPENROUTER_API_KEY?: string;
  DL_ENABLED?: string;
  RESEND_API_KEY?: string;

  // Legal
  LEGAL_STATE?: string;

  // Twilio
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_FROM_NUMBER?: string;

  //health
  ENVIRONMENT?: string;
VERSION?: string;

  // Production industrial connector
  INDUSTRIAL_ERP_BASE_URL?: string;
  INDUSTRIAL_ERP_TENANT_ID?: string;
  INDUSTRIAL_ERP_COMPANY_ID?: string;
  INDUSTRIAL_ERP_OWNER_ID?: string;
  INDUSTRIAL_ERP_SOURCE_SYSTEM?: string;
  INDUSTRIAL_ERP_SOURCE_REGION?: string;
  INDUSTRIAL_ERP_CREDENTIAL_REFERENCE?: string;
  INDUSTRIAL_ERP_REQUEST_TIMEOUT_MS?: string;
}
