// core/src/notifications/twilio.hook.ts
// ============================================
// Legacy Twilio boundary. Production network access is permanently closed;
// governed outbound delivery is owned by OKS-WU4C.
// ============================================

export interface TwilioEnv {
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_FROM?: string;
}

export async function sendTwilioNotification(
  _env: TwilioEnv,
  _payload: {
    to: string;
    message: string;
  }
): Promise<{ ok: boolean; reason?: string }> {
  return { ok: false, reason: "GOVERNED_TWILIO_LEGACY_BYPASS_PROHIBITED" };
}
