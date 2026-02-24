// core/src/notifications/routes.notifications.ts
// =====================================================
// P7.4 — Notifications Routes (Minimal)
// - GET  /notifications/health
// - POST /notify/test
// =====================================================

import type { NotifyEnv } from "./notify";
import { notify } from "./notify";
import type { NotificationChannel, NotificationTemplateId } from "./templates";

function json(body: any, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

type NotifyTestBody = {
  channel: NotificationChannel;
  to: string;
  template: NotificationTemplateId;
  vars?: Record<string, unknown>;
  fallback_email_to?: string;
};

export async function notificationsHealthRoute(_req: Request): Promise<Response> {
  return json({ ok: true });
}

export async function notifyTestRoute(req: Request, env: NotifyEnv): Promise<Response> {
  if (req.method !== "POST") return json({ ok: false, reason: "METHOD_NOT_ALLOWED" }, 405);

  const body = (await req.json()) as NotifyTestBody;

  const res = await notify(env, {
    channel: body.channel,
    to: body.to,
    template: body.template,
    vars: (body.vars ?? {}) as Record<string, any>,
    fallback: body.fallback_email_to ? { email_to: body.fallback_email_to } : undefined
  });

  return json(res, res.ok ? 200 : 400);
}