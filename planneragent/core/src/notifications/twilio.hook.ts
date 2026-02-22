// core/src/notifications/twilio.hook.ts
// ============================================
// P7.2 — Twilio Notification Hook (Minimal)
// Best-effort · No business logic · No throws
// ============================================

export interface TwilioEnv {
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_FROM?: string;
}

export async function sendTwilioNotification(
  env: TwilioEnv,
  payload: {
    to: string;
    message: string;
  }
): Promise<{ ok: boolean; reason?: string }> {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM } = env;

  // Not configured → silently skip (PRE-SRL safe)
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM) {
    return { ok: false, reason: "TWILIO_NOT_CONFIGURED" };
  }

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Authorization":
            "Basic " +
            btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          From: TWILIO_FROM,
          To: payload.to,
          Body: payload.message
        })
      }
    );

    if (!res.ok) {
      return { ok: false, reason: "TWILIO_HTTP_ERROR" };
    }

    return { ok: true };
  } catch {
    // NEVER break the core system
    return { ok: false, reason: "TWILIO_EXCEPTION" };
  }
}