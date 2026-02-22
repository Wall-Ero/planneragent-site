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
  message: string,
  config: TwilioWhatsAppConfig
): Promise<void> {
  const auth = btoa(`${config.accountSid}:${config.authToken}`);

  const body = new URLSearchParams({
    From: config.fromWhatsApp,
    To: config.toWhatsApp,
    Body: message,
  });

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Twilio WhatsApp send failed (${res.status}): ${text}`
    );
  }
}