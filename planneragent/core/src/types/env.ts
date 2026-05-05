//core/src/types/env.ts

export interface Env {
  // D1
  POLICIES_DB: D1Database;

  // Security
  SNAPSHOT_HMAC_SECRET: string;

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
}