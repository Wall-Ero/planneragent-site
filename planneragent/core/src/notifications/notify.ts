// core/src/notifications/notify.ts
// =====================================================
// P7.4 — Notifications Dispatcher (Canonical)
// - channel selection
// - fallback email if whatsapp fails
// - best-effort (never throws)
// =====================================================

import type {
  NotificationChannel,
  NotificationTemplateId,
  TemplateVars,
  RenderedTemplate
} from "./templates";
import { renderTemplate } from "./templates";

import type { WhatsAppTwilioEnv } from "./channels/whatsapp.twilio";
import { sendWhatsAppViaTwilio } from "./channels/whatsapp.twilio";

import type { EmailWebhookEnv } from "./channels/email.webhook";
import { sendEmailViaWebhook } from "./channels/email.webhook";

export type NotifyEnv = WhatsAppTwilioEnv &
  EmailWebhookEnv & {
    // reserved for future routing
    ENVIRONMENT?: string;
    VERSION?: string;
  };

export type NotifyRequest = {
  channel: NotificationChannel; // preferred
  to: string; // whatsapp:+.. or email
  template: NotificationTemplateId;
  vars: TemplateVars;

  // Fallback target (email) if whatsapp fails
  fallback?: {
    email_to: string;
  };
};

export type NotifyResult =
  | {
      ok: true;
      primary: { channel: NotificationChannel; ok: true };
      fallback?: { channel: "email"; ok: true };
      rendered: RenderedTemplate;
    }
  | {
      ok: false;
      primary: { channel: NotificationChannel; ok: false; reason: string };
      fallback?: { channel: "email"; ok: boolean; reason?: string };
      rendered?: RenderedTemplate;
    };

// Allow tests to inject custom channel senders
export function createNotifier(deps?: {
  sendWhatsApp?: typeof sendWhatsAppViaTwilio;
  sendEmail?: typeof sendEmailViaWebhook;
}) {
  const sendWhatsApp = deps?.sendWhatsApp ?? sendWhatsAppViaTwilio;
  const sendEmail = deps?.sendEmail ?? sendEmailViaWebhook;

  return async function notify(
    env: NotifyEnv,
    req: NotifyRequest
  ): Promise<NotifyResult> {
    let rendered: RenderedTemplate | undefined;
    try {
      rendered = renderTemplate(req.template, req.vars);
    } catch (e: any) {
      return {
        ok: false,
        primary: { channel: req.channel, ok: false, reason: e?.message ?? "TEMPLATE_ERROR" }
      };
    }

    // --------------------------------------------
    // Primary send
    // --------------------------------------------
    if (req.channel === "whatsapp") {
      const p = await sendWhatsApp(env, { to: req.to, message: rendered });

      if (p.ok) {
        return { ok: true, primary: { channel: "whatsapp", ok: true }, rendered };
      }

      // fallback email (only if provided)
      if (req.fallback?.email_to) {
        const f = await sendEmail(env, {
          to: req.fallback.email_to,
          message: rendered
        });

        if (f.ok) {
          return {
            ok: true,
            primary: { channel: "whatsapp", ok: true }, // overall success thanks to fallback
            fallback: { channel: "email", ok: true },
            rendered
          };
        }

        return {
          ok: false,
          primary: { channel: "whatsapp", ok: false, reason: p.reason ?? "WHATSAPP_FAILED" },
          fallback: { channel: "email", ok: false, reason: f.reason ?? "EMAIL_FAILED" },
          rendered
        };
      }

      return {
        ok: false,
        primary: { channel: "whatsapp", ok: false, reason: p.reason ?? "WHATSAPP_FAILED" },
        rendered
      };
    }

    // email primary
    const p = await sendEmail(env, { to: req.to, message: rendered });
    if (p.ok) {
      return { ok: true, primary: { channel: "email", ok: true }, rendered };
    }

    return {
      ok: false,
      primary: { channel: "email", ok: false, reason: p.reason ?? "EMAIL_FAILED" },
      rendered
    };
  };
}

export const notify = createNotifier();