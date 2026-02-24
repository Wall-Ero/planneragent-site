// core/src/notifications/channels/whatsapp.twilio.ts
// =====================================================
// P7.4 — WhatsApp Channel (Twilio wrapper)
// Uses existing twilio.hook.ts (DO NOT duplicate Twilio logic)
// =====================================================

import { sendTwilioNotification, type TwilioEnv } from "../twilio.hook";
import type { RenderedTemplate } from "../templates";

export type WhatsAppTwilioEnv = TwilioEnv & {
  // Optional alias used elsewhere in the repo
  TWILIO_FROM_NUMBER?: string;
};

export async function sendWhatsAppViaTwilio(
  env: WhatsAppTwilioEnv,
  input: {
    to: string; // whatsapp target (E.164)
    message: RenderedTemplate;
  }
): Promise<{ ok: boolean; reason?: string }> {
  const mappedEnv: TwilioEnv = {
    TWILIO_ACCOUNT_SID: env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: env.TWILIO_AUTH_TOKEN,
    // twilio.hook.ts expects TWILIO_FROM (keep backward compatibility)
    TWILIO_FROM: env.TWILIO_FROM ?? env.TWILIO_FROM_NUMBER
  };

  // WhatsApp format: in Twilio it is usually "whatsapp:+39..."
  // If you already pass "whatsapp:+..", we keep it.
  const to =
    input.to.startsWith("whatsapp:") ? input.to : `whatsapp:${input.to}`;

  return sendTwilioNotification(mappedEnv, {
    to,
    message: input.message.body
  });
}