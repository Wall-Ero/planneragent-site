// planneragent/core/src/notifications/providers/twilioWhatsApp.ts
// Twilio WhatsApp Provider — Canonical v1
// Cloudflare-safe · Provider-isolated · No business logic

export type TwilioWhatsAppConfig = Readonly<{
  accountSid: string;
  authToken: string;
  fromWhatsApp: string; // "whatsapp:+14155238886"
  toWhatsApp: string;   // "whatsapp:+393331234567"
}>;

export async function sendWhatsApp(
  _message: string,
  _config: TwilioWhatsAppConfig
): Promise<void> {
  throw new Error("GOVERNED_TWILIO_LEGACY_BYPASS_PROHIBITED");
}
