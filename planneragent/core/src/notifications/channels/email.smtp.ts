// core/src/notifications/channels/email.smtp.ts
// =====================================================
// P7.4 — Email Fallback (Cloudflare-safe)
// Canonical Source of Truth
//
// Cloudflare Workers cannot open raw SMTP sockets.
// This adapter uses an HTTP webhook endpoint you control
// (e.g., a tiny mail relay / provider API bridge).
// =====================================================

export type EmailEnv = {
  EMAIL_WEBHOOK_URL?: string; // POST JSON {from,to,subject,text}
  EMAIL_FROM?: string;
  EMAIL_SUBJECT_PREFIX?: string;
};

export async function sendEmailFallback(
  env: EmailEnv,
  payload: { to: string; subject: string; text: string }
): Promise<{ ok: boolean; reason?: string }> {
  const url = env.EMAIL_WEBHOOK_URL;
  const from = env.EMAIL_FROM;

  if (!url || !from) return { ok: false, reason: "EMAIL_NOT_CONFIGURED" };

  const subjectPrefix = env.EMAIL_SUBJECT_PREFIX ?? "PlannerAgent";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        from,
        to: payload.to,
        subject: `${subjectPrefix} — ${payload.subject}`,
        text: payload.text,
      }),
    });

    if (!res.ok) return { ok: false, reason: "EMAIL_HTTP_ERROR" };
    return { ok: true };
  } catch {
    return { ok: false, reason: "EMAIL_EXCEPTION" };
  }
}