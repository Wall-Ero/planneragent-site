// core/src/notifications/channels/email.webhook.ts
// =====================================================
// P7.4 — Email Channel (Webhook-based, Cloudflare-safe)
// Minimal fallback (no SMTP in Workers)
// =====================================================

import type { RenderedTemplate } from "../templates";

export interface EmailWebhookEnv {
  EMAIL_WEBHOOK_URL?: string; // e.g. your own relay / provider endpoint
  EMAIL_WEBHOOK_TOKEN?: string; // optional bearer
  EMAIL_FROM?: string; // optional metadata
}

export async function sendEmailViaWebhook(
  env: EmailWebhookEnv,
  input: {
    to: string;
    message: RenderedTemplate;
  }
): Promise<{ ok: boolean; reason?: string }> {
  if (!env.EMAIL_WEBHOOK_URL) {
    return { ok: false, reason: "EMAIL_NOT_CONFIGURED" };
  }

  try {
    const res = await fetch(env.EMAIL_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(env.EMAIL_WEBHOOK_TOKEN
          ? { Authorization: `Bearer ${env.EMAIL_WEBHOOK_TOKEN}` }
          : {})
      },
      body: JSON.stringify({
        to: input.to,
        from: env.EMAIL_FROM ?? "planneragent",
        subject: input.message.subject,
        body: input.message.body
      })
    });

    if (!res.ok) return { ok: false, reason: "EMAIL_HTTP_ERROR" };
    return { ok: true };
  } catch {
    return { ok: false, reason: "EMAIL_EXCEPTION" };
  }
}