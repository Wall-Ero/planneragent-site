// planneragent/core/src/notifications/providers/emailProvider.ts
// Minimal email provider (placeholder v1)

export type EmailPayload = Readonly<{
  to: string;
  subject: string;
  body: string;
}>;

export async function sendEmail(payload: EmailPayload): Promise<void> {
  // v1 stub — replace with real provider later
  console.log("[email]", payload.to, payload.subject);
}